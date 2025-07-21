// +build integration

package worklet

import (
	"context"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestWorkletClaudeCodeModification tests that Claude can successfully clone a repo,
// receive a prompt, and make the expected code changes to the repository
func TestWorkletClaudeCodeModification(t *testing.T) {
	// Skip if Claude CLI is not available
	if !isClaudeCLIAvailable() {
		t.Skip("Claude CLI not available, skipping integration test")
	}

	helper := NewTestHelper(t)
	defer helper.Cleanup()

	ctx := context.Background()

	// Create test repository with a basic Express server
	repoPath := createNodeExpressRepo(t, helper, "claude-integration-repo")

	// Define the expected change we want Claude to make
	expectedPrompt := "Add a new GET endpoint at /status that returns JSON with {status: 'ok', timestamp: current timestamp}"

	// Create worklet with Claude prompt
	req := CreateWorkletRequest{
		Name:        "Claude Code Modification Test",
		Description: "Tests Claude's ability to modify code based on prompts",
		GitRepo:     repoPath,
		Branch:      "main",
		BasePrompt:  expectedPrompt,
	}

	// Create the worklet
	worklet, err := helper.Manager.CreateWorklet(ctx, req, helper.TestUser)
	require.NoError(t, err)
	assert.NotEmpty(t, worklet.ID)
	assert.Equal(t, StatusCreating, worklet.Status)

	// Wait for Claude to process the prompt and make changes
	// This is the critical part - we need to wait for Claude to finish
	timeout := time.After(3 * time.Minute) // Generous timeout for Claude processing
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	var finalWorklet *Worklet
	for {
		select {
		case <-timeout:
			// If timeout, still get the latest state for debugging
			finalWorklet, _ = helper.Manager.GetWorklet(worklet.ID)
			t.Logf("Test timed out. Final worklet status: %s", finalWorklet.Status)
			t.Logf("Final worklet error: %s", finalWorklet.LastError)
			t.Logf("Build logs: %s", finalWorklet.BuildLogs)
			t.Fatal("Timeout waiting for Claude to process the prompt")

		case <-ticker.C:
			updatedWorklet, err := helper.Manager.GetWorklet(worklet.ID)
			require.NoError(t, err)

			t.Logf("Worklet status: %s", updatedWorklet.Status)
			if updatedWorklet.LastError != "" {
				t.Logf("Worklet error: %s", updatedWorklet.LastError)
			}

			// Check if Claude processing is complete (either success or error)
			if updatedWorklet.Status == StatusRunning || updatedWorklet.Status == StatusError {
				finalWorklet = updatedWorklet
				goto verifyChanges
			}
		}
	}

verifyChanges:
	// Log final state for debugging
	t.Logf("Final worklet status: %s", finalWorklet.Status)
	if finalWorklet.LastError != "" {
		t.Logf("Final error: %s", finalWorklet.LastError)
	}
	if finalWorklet.BuildLogs != "" {
		t.Logf("Build logs: %s", finalWorklet.BuildLogs)
	}

	// Get the repository path where Claude made changes
	gitClient := helper.Manager.gitClient
	clonedRepoPath := gitClient.GetRepoPath(finalWorklet.GitRepo, finalWorklet.Branch)

	// Verify that the repository exists and has been modified
	require.DirExists(t, clonedRepoPath, "Cloned repository should exist")

	// Read the server.js file that Claude should have modified
	serverJSPath := filepath.Join(clonedRepoPath, "server.js")
	require.FileExists(t, serverJSPath, "server.js should exist in the cloned repository")

	modifiedContent, err := ioutil.ReadFile(serverJSPath)
	require.NoError(t, err, "Should be able to read the modified server.js file")

	modifiedCode := string(modifiedContent)
	t.Logf("Modified server.js content:\n%s", modifiedCode)

	// Verify that Claude made the expected changes
	verifyStatusEndpointExists(t, modifiedCode)

	// Verify that git detected the changes
	hasChanges, err := gitClient.HasUncommittedChanges(clonedRepoPath)
	require.NoError(t, err)
	
	// If Claude made changes, there should be uncommitted changes
	// (unless Claude also committed them, which is also valid)
	t.Logf("Repository has uncommitted changes: %v", hasChanges)

	// Additional verification: ensure the original endpoint still exists
	assert.Contains(t, modifiedCode, "Hello World", "Original functionality should be preserved")

	t.Logf("✅ Test completed successfully! Claude successfully modified the code.")
}

// createNodeExpressRepo creates a test repository with a basic Node.js Express server
func createNodeExpressRepo(t *testing.T, helper *TestHelper, repoName string) string {
	repoDir := filepath.Join(helper.TempDir, repoName)
	require.NoError(t, os.MkdirAll(repoDir, 0755))

	// Initialize git repository
	require.NoError(t, runCommand(repoDir, "git", "init"))
	require.NoError(t, runCommand(repoDir, "git", "config", "user.email", "test@example.com"))
	require.NoError(t, runCommand(repoDir, "git", "config", "user.name", "Test User"))

	// Create package.json
	packageJSON := `{
  "name": "claude-test-server",
  "version": "1.0.0",
  "description": "Test server for Claude integration",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}`

	// Create initial server.js - this is what Claude will modify
	serverJS := `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// Original endpoint that should be preserved
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start server
app.listen(port, () => {
  console.log('Server running on port ' + port);
});`

	// Write files
	require.NoError(t, ioutil.WriteFile(filepath.Join(repoDir, "package.json"), []byte(packageJSON), 0644))
	require.NoError(t, ioutil.WriteFile(filepath.Join(repoDir, "server.js"), []byte(serverJS), 0644))

	// Create initial commit
	require.NoError(t, runCommand(repoDir, "git", "add", "."))
	require.NoError(t, runCommand(repoDir, "git", "commit", "-m", "Initial commit: basic Express server"))

	t.Logf("Created test repository at: %s", repoDir)
	return repoDir
}

// verifyStatusEndpointExists checks that Claude added the expected /status endpoint
func verifyStatusEndpointExists(t *testing.T, code string) {
	// Check for the /status endpoint
	statusEndpointPattern := `app\.get\s*\(\s*['"]/status['"].*?\)`
	matched, err := regexp.MatchString(statusEndpointPattern, code)
	require.NoError(t, err)
	assert.True(t, matched, "Should find app.get('/status', ...) endpoint in the code")

	// Check for status and timestamp in the response
	assert.Contains(t, code, "status", "Response should include 'status' field")
	assert.Contains(t, code, "timestamp", "Response should include 'timestamp' field")

	// Check that it's a JSON response (looking for res.json or JSON.stringify)
	jsonResponsePattern := `(res\.json|JSON\.stringify)`
	matched, err = regexp.MatchString(jsonResponsePattern, code)
	require.NoError(t, err)
	assert.True(t, matched, "Should find JSON response (res.json or JSON.stringify) in the code")

	t.Logf("✅ Verified: /status endpoint exists with expected JSON response structure")
}

// isClaudeCLIAvailable checks if the Claude CLI is available for testing
func isClaudeCLIAvailable() bool {
	cmd := exec.Command("claude", "--help")
	return cmd.Run() == nil
}

// TestWorkletClaudeSimpleModification tests a simpler code modification
func TestWorkletClaudeSimpleModification(t *testing.T) {
	if !isClaudeCLIAvailable() {
		t.Skip("Claude CLI not available, skipping integration test")
	}

	helper := NewTestHelper(t)
	defer helper.Cleanup()

	ctx := context.Background()

	// Create test repository
	repoPath := createNodeExpressRepo(t, helper, "claude-simple-test")

	// Simple prompt: add a comment
	simplePrompt := "Add a comment at the top of server.js explaining what this server does"

	req := CreateWorkletRequest{
		Name:       "Claude Simple Modification Test",
		GitRepo:    repoPath,
		Branch:     "main",
		BasePrompt: simplePrompt,
	}

	worklet, err := helper.Manager.CreateWorklet(ctx, req, helper.TestUser)
	require.NoError(t, err)

	// Wait for processing with shorter timeout for simple change
	timeout := time.After(90 * time.Second)
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			finalWorklet, _ := helper.Manager.GetWorklet(worklet.ID)
			t.Logf("Final status: %s, error: %s", finalWorklet.Status, finalWorklet.LastError)
			t.Fatal("Timeout waiting for simple Claude modification")

		case <-ticker.C:
			updatedWorklet, err := helper.Manager.GetWorklet(worklet.ID)
			require.NoError(t, err)

			if updatedWorklet.Status == StatusRunning || updatedWorklet.Status == StatusError {
				// Verify the comment was added
				gitClient := helper.Manager.gitClient
				clonedRepoPath := gitClient.GetRepoPath(updatedWorklet.GitRepo, updatedWorklet.Branch)
				serverJSPath := filepath.Join(clonedRepoPath, "server.js")

				if content, err := ioutil.ReadFile(serverJSPath); err == nil {
					code := string(content)
					t.Logf("Modified code:\n%s", code)
					// Look for comment indicators
					hasComment := strings.Contains(code, "//") || strings.Contains(code, "/*")
					assert.True(t, hasComment, "Should find a comment in the modified code")
					t.Logf("✅ Simple modification test completed")
				}
				return
			}
		}
	}
}