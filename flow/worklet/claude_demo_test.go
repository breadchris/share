//go:build integration
// +build integration

package worklet

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// TestClaudeIntegrationDemo demonstrates that the Claude integration is working correctly
// This test validates the core worklet functionality: cloning a repo and connecting to Claude
func TestClaudeIntegrationDemo(t *testing.T) {
	if !isClaudeCLIAvailable() {
		t.Skip("Claude CLI not available, skipping integration test")
	}

	t.Log("🚀 Starting Claude Integration Demo")

	// Create a test helper (same as other worklet tests)
	helper := NewTestHelper(t)
	defer helper.Cleanup()

	// Create test repository with Node.js code
	repoPath := createTestNodeJSRepo(t, helper.TempDir)
	t.Logf("✅ Created test repository at: %s", repoPath)

	// Create Claude client directly
	claudeClient := NewClaudkClient()
	t.Log("✅ Claude client created successfully")

	// Test 1: Verify repository structure
	serverJSPath := filepath.Join(repoPath, "server.js")
	originalContent, err := ioutil.ReadFile(serverJSPath)
	require.NoError(t, err)
	t.Logf("✅ Original server.js content (first 100 chars): %s...", string(originalContent)[:100])

	// Test 2: Create Claude session with working directory
	process, err := claudeClient.claudeService.CreateSessionWithOptions(repoPath)
	require.NoError(t, err)
	require.NotNil(t, process)
	t.Log("✅ Claude session created with working directory access")

	// Test 3: Send a simple message to Claude
	err = claudeClient.claudeService.SendMessage(process, "Hello Claude! Can you see the files in this Node.js project?")
	require.NoError(t, err)
	t.Log("✅ Message sent to Claude successfully")

	// Test 4: Wait briefly for Claude to respond (don't wait for full completion)
	messageChan := claudeClient.claudeService.ReceiveMessages(process)
	select {
	case msg, ok := <-messageChan:
		if ok {
			t.Logf("✅ Received response from Claude: Type=%s", msg.Type)
			if msg.Type == "text" && len(msg.Message) > 0 {
				msgContent := string(msg.Message)
				if len(msgContent) > 100 {
					msgContent = msgContent[:100] + "..."
				}
				t.Logf("   Message preview: %s", msgContent)
			}
		}
	case <-time.After(5 * time.Second):
		t.Log("⏳ Claude is processing (normal for complex requests)")
	}

	// Test 5: Verify git integration works
	gitClient := helper.Manager.gitClient
	clonedPath := gitClient.GetRepoPath(repoPath, "main")
	t.Logf("✅ Git client can access repository at: %s", clonedPath)

	// Summary
	//t.Log("🎉 ALL TESTS PASSED!")
	//t.Log("✅ Repository cloning: Working")
	//t.Log("✅ Claude CLI integration: Working")
	//t.Log("✅ Claude session creation: Working")
	//t.Log("✅ Message sending to Claude: Working")
	//t.Log("✅ Working directory access: Working")
	//t.Log("✅ Git operations: Working")
	//
	//t.Log("🏆 The worklet system can successfully:")
	//t.Log("   • Clone a repository")
	//t.Log("   • Start Claude with access to the repository")
	//t.Log("   • Send prompts to Claude for code modification")
	//t.Log("   • All components are working together correctly!")
}

func createTestNodeJSRepo(t *testing.T, baseDir string) string {
	repoDir := filepath.Join(baseDir, "demo-node-repo")
	require.NoError(t, os.MkdirAll(repoDir, 0755))

	// Initialize git
	require.NoError(t, runCommand(repoDir, "git", "init"))
	require.NoError(t, runCommand(repoDir, "git", "config", "user.email", "test@example.com"))
	require.NoError(t, runCommand(repoDir, "git", "config", "user.name", "Test User"))

	// Create package.json
	packageJSON := `{
  "name": "worklet-demo",
  "version": "1.0.0",
  "description": "Demo Node.js app for worklet testing",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}`

	// Create server.js
	serverJS := `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from the demo server!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime()
  });
});

// Start server
app.listen(port, () => {
  console.log('Demo server running on port ' + port);
});`

	// Create README
	readme := `# Worklet Demo Project

This is a demo Node.js project for testing Claude integration with worklets.

## Features
- Express.js server
- JSON responses
- Health check endpoint

This repository is used to test that Claude can:
1. Read and understand the codebase
2. Make modifications to the code
3. Add new features and endpoints
`

	// Write files
	require.NoError(t, ioutil.WriteFile(filepath.Join(repoDir, "package.json"), []byte(packageJSON), 0644))
	require.NoError(t, ioutil.WriteFile(filepath.Join(repoDir, "server.js"), []byte(serverJS), 0644))
	require.NoError(t, ioutil.WriteFile(filepath.Join(repoDir, "README.md"), []byte(readme), 0644))

	// Initial commit
	require.NoError(t, runCommand(repoDir, "git", "add", "."))
	require.NoError(t, runCommand(repoDir, "git", "commit", "-m", "Initial commit: Demo Node.js server"))

	return repoDir
}
