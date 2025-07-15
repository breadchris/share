package process

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestClaudeExecutor_Spawn(t *testing.T) {
	// Create a temporary directory for testing
	tempDir, err := os.MkdirTemp("", "claude-executor-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	executor := &ClaudeExecutor{}
	taskID := uuid.New()
	ctx := context.Background()

	t.Run("ValidWorktreePath", func(t *testing.T) {
		cmd, err := executor.Spawn(ctx, taskID, tempDir)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}

		if cmd == nil {
			t.Fatal("Expected command to be returned, got nil")
		}

		// Verify command configuration
		if cmd.Dir != tempDir {
			t.Errorf("Expected command dir to be %s, got %s", tempDir, cmd.Dir)
		}

		// Check that the command contains the expected Claude CLI call
		commandString := strings.Join(cmd.Args, " ")
		if !strings.Contains(commandString, "npx") {
			t.Errorf("Expected command to contain 'npx', got: %s", commandString)
		}
		if !strings.Contains(commandString, "claude-code") {
			t.Errorf("Expected command to contain 'claude-code', got: %s", commandString)
		}
	})

	t.Run("InvalidWorktreePath", func(t *testing.T) {
		invalidPath := filepath.Join(tempDir, "nonexistent")
		_, err := executor.Spawn(ctx, taskID, invalidPath)
		if err == nil {
			t.Fatal("Expected error for invalid worktree path, got nil")
		}

		if !strings.Contains(err.Error(), "does not exist") {
			t.Errorf("Expected error message about path not existing, got: %v", err)
		}
	})
}

func TestClaudeExecutor_GetExecutorType(t *testing.T) {
	executor := &ClaudeExecutor{}
	execType := executor.GetExecutorType()

	if execType != ExecutorClaude {
		t.Errorf("Expected ExecutorClaude, got %v", execType)
	}
}

func TestClaudeExecutor_NormalizeLogs(t *testing.T) {
	executor := &ClaudeExecutor{}
	tempDir, err := os.MkdirTemp("", "claude-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	t.Run("EmptyLogs", func(t *testing.T) {
		conversation, err := executor.NormalizeLogs("", tempDir)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}

		if conversation == nil {
			t.Fatal("Expected conversation to be returned, got nil")
		}

		if conversation.ExecutorType != "claude" {
			t.Errorf("Expected executor type 'claude', got %s", conversation.ExecutorType)
		}
	})

	t.Run("ValidJSON", func(t *testing.T) {
		// Simulate Claude stream JSON output
		mockLogs := `{"type":"system","subtype":"init","model":"claude-3-5-sonnet-20241022","session_id":"test-session-123"}
{"type":"assistant","message":{"id":"msg_123","type":"message","role":"assistant","content":[{"type":"text","text":"Hello! I'm ready to help with this task."}]}}
{"type":"result"}`

		conversation, err := executor.NormalizeLogs(mockLogs, tempDir)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}

		if len(conversation.Entries) == 0 {
			t.Error("Expected conversation entries, got none")
		}

		if conversation.SessionID == nil {
			t.Error("Expected session ID to be extracted, got nil")
		} else if *conversation.SessionID != "test-session-123" {
			t.Errorf("Expected session ID 'test-session-123', got %s", *conversation.SessionID)
		}
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		mockLogs := "invalid json line\nanother invalid line"

		conversation, err := executor.NormalizeLogs(mockLogs, tempDir)
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}

		// Should still return a conversation with raw text entries
		if len(conversation.Entries) == 0 {
			t.Error("Expected conversation entries for invalid JSON, got none")
		}
	})
}

func TestClaudeFollowupExecutor_Spawn(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "claude-followup-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	executor := &ClaudeFollowupExecutor{
		SessionID: "test-session-456",
		Prompt:    "Continue working on this task",
	}
	taskID := uuid.New()
	ctx := context.Background()

	cmd, err := executor.Spawn(ctx, taskID, tempDir)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if cmd == nil {
		t.Fatal("Expected command to be returned, got nil")
	}

	// Verify command contains resume flag with session ID
	commandString := strings.Join(cmd.Args, " ")
	if !strings.Contains(commandString, "--resume=test-session-456") {
		t.Errorf("Expected command to contain resume flag with session ID, got: %s", commandString)
	}
}

// Integration test that simulates the full execution flow
func TestClaudeExecutor_EndToEndFlow(t *testing.T) {
	// Skip this test if we're in a CI environment or if npx is not available
	if os.Getenv("CI") != "" {
		t.Skip("Skipping end-to-end test in CI environment")
	}

	if _, err := exec.LookPath("npx"); err != nil {
		t.Skip("Skipping end-to-end test: npx not found in PATH")
	}

	tempDir, err := os.MkdirTemp("", "claude-e2e-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create a simple test file in the worktree
	testFile := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(testFile, []byte("This is a test file for Claude to work with."), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	executor := &ClaudeExecutor{}
	taskID := uuid.New()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	t.Run("FullExecutionFlow", func(t *testing.T) {
		// Spawn the executor
		cmd, err := executor.Spawn(ctx, taskID, tempDir)
		if err != nil {
			t.Fatalf("Failed to spawn executor: %v", err)
		}

		// Start the command
		if err := cmd.Start(); err != nil {
			t.Fatalf("Failed to start command: %v", err)
		}

		// Wait for completion or timeout
		done := make(chan error, 1)
		go func() {
			done <- cmd.Wait()
		}()

		select {
		case err := <-done:
			// Command completed
			t.Logf("Command completed with error: %v", err)

			// Note: We expect this to fail if Claude CLI is not properly configured
			// or if authentication is missing, but the test validates that the
			// executor can spawn and run the command properly

		case <-ctx.Done():
			// Timeout - kill the process
			if cmd.Process != nil {
				cmd.Process.Kill()
			}
			t.Log("Command timed out (expected for this test)")
		}
	})
}

// Test the executor configuration and factory methods
func TestExecutorFactory(t *testing.T) {
	t.Run("CreateClaudeExecutor", func(t *testing.T) {
		executor := CreateExecutor(ExecutorClaude)

		claudeExec, ok := executor.(*ClaudeExecutor)
		if !ok {
			t.Errorf("Expected *ClaudeExecutor, got %T", executor)
		}

		if claudeExec.GetExecutorType() != ExecutorClaude {
			t.Errorf("Expected ExecutorClaude, got %v", claudeExec.GetExecutorType())
		}
	})

	t.Run("CreateFollowupExecutor", func(t *testing.T) {
		sessionID := "test-session-789"
		prompt := "Test followup prompt"

		executor := CreateFollowupExecutor(ExecutorClaude, sessionID, prompt)

		followupExec, ok := executor.(*ClaudeFollowupExecutor)
		if !ok {
			t.Errorf("Expected *ClaudeFollowupExecutor, got %T", executor)
		}

		if followupExec.SessionID != sessionID {
			t.Errorf("Expected session ID %s, got %s", sessionID, followupExec.SessionID)
		}

		if followupExec.Prompt != prompt {
			t.Errorf("Expected prompt %s, got %s", prompt, followupExec.Prompt)
		}
	})
}

// Benchmark test for executor spawning
func BenchmarkClaudeExecutor_Spawn(b *testing.B) {
	tempDir, err := os.MkdirTemp("", "claude-benchmark")
	if err != nil {
		b.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	executor := &ClaudeExecutor{}
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		taskID := uuid.New()
		_, err := executor.Spawn(ctx, taskID, tempDir)
		if err != nil {
			b.Fatalf("Spawn failed: %v", err)
		}
	}
}
