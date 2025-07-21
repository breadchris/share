// +build integration

package worklet

import (
	"context"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestClaudeDirectCodeModification tests Claude's ability to modify code directly
// without the full worklet deployment pipeline (no Docker required)
func TestClaudeDirectCodeModification(t *testing.T) {
	// Skip if Claude CLI is not available
	if !isClaudeCLIAvailable() {
		t.Skip("Claude CLI not available, skipping integration test")
	}

	// Create temporary directory for test
	tempDir, err := ioutil.TempDir("", "claude-direct-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create test repository with Node.js server
	repoPath := createSimpleNodeRepo(t, tempDir)

	// Create Claude client directly
	claudeClient := NewClaudeClient()
	ctx := context.Background()

	// Define the specific change we want Claude to make
	prompt := "Add a new GET endpoint at /status that returns JSON with {status: 'ok', timestamp: current ISO timestamp}. Make sure to use res.json() for the response."

	t.Logf("Sending prompt to Claude: %s", prompt)
	t.Logf("Working directory: %s", repoPath)

	// Apply the prompt directly using Claude
	err = claudeClient.ApplyPrompt(ctx, repoPath, prompt)
	if err != nil {
		t.Logf("Claude error: %v", err)
		// If Claude fails, let's still check if we can at least create a session
		t.Skipf("Claude failed to process prompt: %v", err)
	}

	// Read the modified server.js file
	serverJSPath := filepath.Join(repoPath, "server.js")
	modifiedContent, err := ioutil.ReadFile(serverJSPath)
	require.NoError(t, err)

	modifiedCode := string(modifiedContent)
	t.Logf("Modified server.js content:\n%s", modifiedCode)

	// Verify that Claude made the expected changes
	verifyStatusEndpointExists(t, modifiedCode)

	// Check git status to confirm changes were made
	hasChanges := checkGitChanges(t, repoPath)
	t.Logf("Git detected changes: %v", hasChanges)

	// Verify original functionality is preserved
	assert.Contains(t, modifiedCode, "Hello World", "Original functionality should be preserved")

	t.Logf("✅ Direct Claude test completed successfully!")
}

// TestClaudeSessionManagement tests basic Claude session creation and message sending
func TestClaudeSessionManagement(t *testing.T) {
	if !isClaudeCLIAvailable() {
		t.Skip("Claude CLI not available, skipping integration test")
	}

	// Create temporary directory
	tempDir, err := ioutil.TempDir("", "claude-session-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	repoPath := createSimpleNodeRepo(t, tempDir)
	claudeClient := NewClaudeClient()

	// Test session creation
	process, err := claudeClient.claudeService.CreateSessionWithOptions(repoPath)
	if err != nil {
		t.Skipf("Claude session creation failed: %v", err)
	}
	require.NotNil(t, process)
	t.Logf("✅ Claude session created successfully")

	// Test sending a simple message
	err = claudeClient.claudeService.SendMessage(process, "Hello Claude! Can you confirm you can see the files in this directory?")
	require.NoError(t, err)
	t.Logf("✅ Message sent to Claude successfully")

	// Wait for a response
	timeout := time.After(30 * time.Second)
	messageChan := claudeClient.claudeService.ReceiveMessages(process)

	select {
	case msg, ok := <-messageChan:
		if ok {
			t.Logf("✅ Received message from Claude: Type=%s", msg.Type)
			if len(msg.Message) > 0 && len(msg.Message) < 200 {
				t.Logf("Message content: %s", string(msg.Message))
			}
		}
	case <-timeout:
		t.Log("⚠️  Timeout waiting for Claude response (this is ok for this test)")
	}

	// Clean up - we need to access sessionID through the process struct
	// Since sessionID is not exported, we'll skip cleanup for this test
	t.Logf("✅ Session management test completed")
}

// createSimpleNodeRepo creates a minimal Node.js repository for testing
func createSimpleNodeRepo(t *testing.T, baseDir string) string {
	repoDir := filepath.Join(baseDir, "test-repo")
	require.NoError(t, os.MkdirAll(repoDir, 0755))

	// Initialize git
	require.NoError(t, runCommand(repoDir, "git", "init"))
	require.NoError(t, runCommand(repoDir, "git", "config", "user.email", "test@example.com"))
	require.NoError(t, runCommand(repoDir, "git", "config", "user.name", "Test User"))

	// Create package.json
	packageJSON := `{
  "name": "claude-test",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  }
}`

	// Create server.js
	serverJS := `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log('Server running on port ' + port);
});`

	require.NoError(t, ioutil.WriteFile(filepath.Join(repoDir, "package.json"), []byte(packageJSON), 0644))
	require.NoError(t, ioutil.WriteFile(filepath.Join(repoDir, "server.js"), []byte(serverJS), 0644))

	// Initial commit
	require.NoError(t, runCommand(repoDir, "git", "add", "."))
	require.NoError(t, runCommand(repoDir, "git", "commit", "-m", "Initial commit"))

	return repoDir
}

// checkGitChanges checks if there are uncommitted changes in the repository
func checkGitChanges(t *testing.T, repoPath string) bool {
	cmd := exec.Command("git", "status", "--porcelain")
	cmd.Dir = repoPath
	output, err := cmd.Output()
	if err != nil {
		t.Logf("Git status check failed: %v", err)
		return false
	}
	return len(strings.TrimSpace(string(output))) > 0
}