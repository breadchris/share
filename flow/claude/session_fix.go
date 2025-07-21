package claude

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"
)

// CreateSessionWithDeferredDirectory creates a Claude session but defers session directory creation
// until we get the actual session ID from Claude. This fixes the session ID mismatch issue.
func (cs *ClaudeService) CreateSessionWithDeferredDirectory(threadTS, channelID, userID, workingDir string) (*Process, *SessionInfo, error) {
	// Prepare upload directory for this thread (if any files were uploaded)
	uploadDir := filepath.Join("./data", "slack-uploads", threadTS)

	// Only create upload directory if files exist there
	var dirs []string
	if _, err := os.Stat(uploadDir); err == nil {
		dirs = append(dirs, uploadDir)
		slog.Info("Including upload directory in Claude session", "upload_dir", uploadDir)
	}

	// If no upload directory, we'll use a temporary working directory that Claude can access
	// We'll create the actual session directory after getting Claude's session ID
	if len(dirs) == 0 {
		// Create a temporary directory that we'll replace later
		tempDir := filepath.Join("./data", "temp-session", fmt.Sprintf("temp-%d", time.Now().UnixNano()))
		if err := os.MkdirAll(tempDir, 0755); err != nil {
			return nil, nil, fmt.Errorf("failed to create temporary session directory: %w", err)
		}
		dirs = append(dirs, tempDir)
		defer os.RemoveAll(tempDir) // Clean up temp directory after session creation
	}

	// Create the Claude process
	process, err := cs.service.CreateSessionWithMultipleDirs(dirs)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create Claude process: %w", err)
	}

	// Wait for Claude to provide its session ID
	// This happens in handleStdout when we receive the init message

	// Create session info with placeholder session ID that will be updated
	sessionInfo := &SessionInfo{
		SessionID:     "", // Will be set when we receive Claude's session ID
		ThreadTS:      threadTS,
		UserID:        userID,
		ChannelID:     channelID,
		WorkingDir:    "", // Will be set when we create the actual session directory
		LastActivity:  time.Now(),
		Active:        true,
		ProcessExists: true,
	}

	return process, sessionInfo, nil
}

// setupSessionDirectory creates the actual session directory once we have Claude's session ID
func (cs *ClaudeService) setupSessionDirectory(claudeSessionID, threadTS string) (string, error) {
	// Create session-specific directory using Claude's actual session ID
	sessionDir := filepath.Join("./data", "session", claudeSessionID)
	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create session directory: %w", err)
	}

	// Create CLAUDE.md in session directory from default configuration
	sessionClaudemd := filepath.Join(sessionDir, "CLAUDE.md")
	if err := cs.createClaudeMDFromConfig(sessionClaudemd, ""); err != nil {
		slog.Warn("Failed to create CLAUDE.md in session directory",
			"session_id", claudeSessionID,
			"error", err)
		// Continue without CLAUDE.md - not critical
	}

	slog.Info("Created session directory with Claude's session ID",
		"claude_session_id", claudeSessionID,
		"session_dir", sessionDir)

	return sessionDir, nil
}

// UpdateSessionInfoWithClaudeID updates the session info once we receive Claude's session ID
func (cs *ClaudeService) UpdateSessionInfoWithClaudeID(sessionInfo *SessionInfo, claudeSessionID string) error {
	// Create the actual session directory
	sessionDir, err := cs.setupSessionDirectory(claudeSessionID, sessionInfo.ThreadTS)
	if err != nil {
		return fmt.Errorf("failed to setup session directory: %w", err)
	}

	// Update session info
	sessionInfo.SessionID = claudeSessionID
	sessionInfo.WorkingDir = sessionDir

	slog.Info("Updated session info with Claude's session ID",
		"claude_session_id", claudeSessionID,
		"working_dir", sessionDir)

	return nil
}
