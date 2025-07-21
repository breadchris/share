package claude

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
)

// SessionIDMismatchError represents a session ID mismatch issue
type SessionIDMismatchError struct {
	GoSessionID     string
	ClaudeSessionID string
	DirectoryPath   string
	ExpectedPath    string
}

func (e *SessionIDMismatchError) Error() string {
	return fmt.Sprintf("Session ID mismatch: Go UUID=%s, Claude ID=%s, Directory=%s, Expected=%s",
		e.GoSessionID, e.ClaudeSessionID, e.DirectoryPath, e.ExpectedPath)
}

// ValidateSessionConsistency checks for session ID mismatches
func (cs *ClaudeService) ValidateSessionConsistency(goSessionID, claudeSessionID string) error {
	if goSessionID == "" || claudeSessionID == "" {
		return fmt.Errorf("session IDs cannot be empty: go=%s, claude=%s", goSessionID, claudeSessionID)
	}

	if goSessionID != claudeSessionID {
		goDir := filepath.Join("./data", "session", goSessionID)
		claudeDir := filepath.Join("./data", "session", claudeSessionID)
		
		return &SessionIDMismatchError{
			GoSessionID:     goSessionID,
			ClaudeSessionID: claudeSessionID,
			DirectoryPath:   goDir,
			ExpectedPath:    claudeDir,
		}
	}

	return nil
}

// DiagnoseSessionDirectories scans for orphaned session directories
func (cs *ClaudeService) DiagnoseSessionDirectories() error {
	sessionBaseDir := "./data/session"
	
	entries, err := os.ReadDir(sessionBaseDir)
	if err != nil {
		return fmt.Errorf("failed to read session directory: %w", err)
	}

	slog.Info("Session directory diagnosis", "base_dir", sessionBaseDir, "total_entries", len(entries))
	
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		
		sessionID := entry.Name()
		sessionDir := filepath.Join(sessionBaseDir, sessionID)
		
		// Check if this is a UUID format (Go-generated)
		isUUID := len(sessionID) == 36 && strings.Count(sessionID, "-") == 4
		
		// Check if directory has content
		files, err := os.ReadDir(sessionDir)
		if err != nil {
			slog.Warn("Cannot read session directory", "session_id", sessionID, "error", err)
			continue
		}
		
		hasContent := len(files) > 1 // More than just CLAUDE.md
		
		slog.Info("Session directory analysis",
			"session_id", sessionID,
			"is_uuid_format", isUUID,
			"file_count", len(files),
			"has_content", hasContent,
			"path", sessionDir)
		
		// List files for debugging
		for _, file := range files {
			slog.Debug("Session file", "session_id", sessionID, "file", file.Name(), "is_dir", file.IsDir())
		}
	}
	
	return nil
}

// FixSessionIDMismatch moves files from Go UUID directory to Claude session directory
func (cs *ClaudeService) FixSessionIDMismatch(goSessionID, claudeSessionID string) error {
	if goSessionID == claudeSessionID {
		return nil // No mismatch to fix
	}
	
	goDir := filepath.Join("./data", "session", goSessionID)
	claudeDir := filepath.Join("./data", "session", claudeSessionID)
	
	// Check if Go directory exists and has content
	goStat, err := os.Stat(goDir)
	if err != nil {
		if os.IsNotExist(err) {
			slog.Info("Go session directory doesn't exist, no fix needed", "go_dir", goDir)
			return nil
		}
		return fmt.Errorf("failed to stat Go session directory: %w", err)
	}
	
	if !goStat.IsDir() {
		return fmt.Errorf("Go session path is not a directory: %s", goDir)
	}
	
	// Create Claude directory if it doesn't exist
	if err := os.MkdirAll(claudeDir, 0755); err != nil {
		return fmt.Errorf("failed to create Claude session directory: %w", err)
	}
	
	// Move all files from Go directory to Claude directory
	files, err := os.ReadDir(goDir)
	if err != nil {
		return fmt.Errorf("failed to read Go session directory: %w", err)
	}
	
	for _, file := range files {
		srcPath := filepath.Join(goDir, file.Name())
		dstPath := filepath.Join(claudeDir, file.Name())
		
		if err := os.Rename(srcPath, dstPath); err != nil {
			return fmt.Errorf("failed to move file %s to %s: %w", srcPath, dstPath, err)
		}
		
		slog.Info("Moved session file", "from", srcPath, "to", dstPath)
	}
	
	// Remove empty Go directory
	if err := os.Remove(goDir); err != nil {
		slog.Warn("Failed to remove empty Go session directory", "dir", goDir, "error", err)
	} else {
		slog.Info("Removed empty Go session directory", "dir", goDir)
	}
	
	slog.Info("Fixed session ID mismatch", "go_session_id", goSessionID, "claude_session_id", claudeSessionID)
	return nil
}