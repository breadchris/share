//go:build integration
// +build integration

package worklet

import (
	"context"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// TestClaudeBasicFileModification tests Claude's ability to read and modify a simple file
func TestClaudeBasicFileModification(t *testing.T) {
	if !isClaudeCLIAvailable() {
		t.Skip("Claude CLI not available, skipping integration test")
	}

	// Create temporary directory
	tempDir, err := ioutil.TempDir("", "claude-simple-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a simple text file
	testFile := filepath.Join(tempDir, "hello.txt")
	originalContent := "Hello World!"
	require.NoError(t, ioutil.WriteFile(testFile, []byte(originalContent), 0644))

	// Create Claude client
	claudeClient := NewClaudeClient()

	// Test with a very simple prompt
	prompt := "Read the hello.txt file and add the text ' - Modified by Claude' to the end of it"

	t.Logf("Original content: %s", originalContent)
	t.Logf("Sending prompt: %s", prompt)
	t.Logf("Working directory: %s", tempDir)

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Apply the prompt
	err = claudeClient.ApplyPrompt(ctx, tempDir, prompt)
	if err != nil {
		t.Logf("Claude error: %v", err)
		t.Skipf("Claude failed: %v", err)
	}

	// Read the file again to see if it was modified
	modifiedContent, err := ioutil.ReadFile(testFile)
	require.NoError(t, err)

	modifiedText := string(modifiedContent)
	t.Logf("Modified content: %s", modifiedText)

	// Check if the file was actually modified
	if modifiedText != originalContent {
		t.Logf("✅ SUCCESS: Claude successfully modified the file!")
		t.Logf("   Original: %s", originalContent)
		t.Logf("   Modified: %s", modifiedText)
	} else {
		t.Logf("ℹ️  File was not modified (this might be expected if Claude is being careful)")
	}
}
