package claude

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// SessionIDCallback is called when Claude's session ID is received
type SessionIDCallback func(claudeSessionID string) error

// ProcessWithCallback extends Process with session ID callback functionality
type ProcessWithCallback struct {
	*Process
	sessionIDCallback SessionIDCallback
	callbackMutex     sync.Mutex
	callbackExecuted  bool
}

// SetSessionIDCallback sets a callback to be executed when Claude's session ID is received
func (p *ProcessWithCallback) SetSessionIDCallback(callback SessionIDCallback) {
	p.callbackMutex.Lock()
	defer p.callbackMutex.Unlock()
	p.sessionIDCallback = callback
}

// executeSessionIDCallback executes the callback when Claude's session ID is received
func (p *ProcessWithCallback) executeSessionIDCallback(claudeSessionID string) {
	p.callbackMutex.Lock()
	defer p.callbackMutex.Unlock()

	if p.callbackExecuted || p.sessionIDCallback == nil {
		return
	}

	p.callbackExecuted = true

	if err := p.sessionIDCallback(claudeSessionID); err != nil {
		slog.Error("Session ID callback failed",
			"claude_session_id", claudeSessionID,
			"error", err)
	}
}

// CreateSessionWithCallbackFix creates a Claude session that properly handles session ID mismatches
func (cs *ClaudeService) CreateSessionWithCallbackFix(threadTS, channelID, userID, workingDir string) (*ProcessWithCallback, *SessionInfo, error) {
	// Prepare upload directory for this thread (if any files were uploaded)
	uploadDir := filepath.Join("./data", "slack-uploads", threadTS)

	// Start with just the upload directory if it exists
	var dirs []string
	if _, err := os.Stat(uploadDir); err == nil {
		dirs = append(dirs, uploadDir)
		slog.Info("Including upload directory in Claude session", "upload_dir", uploadDir)
	}

	// Create a minimal working directory for Claude to start in
	// We'll add the session directory later once we get Claude's session ID
	if len(dirs) == 0 {
		// Use the current working directory as fallback
		dirs = append(dirs, ".")
	}

	// Create the Claude process
	process, err := cs.service.CreateSessionWithMultipleDirs(dirs)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create Claude process: %w", err)
	}

	// Create session info that will be updated once we get Claude's session ID
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

	// Wrap process with callback functionality
	processWithCallback := &ProcessWithCallback{
		Process:          process,
		callbackExecuted: false,
	}

	// Set up callback to create session directory when we get Claude's session ID
	processWithCallback.SetSessionIDCallback(func(claudeSessionID string) error {
		return cs.handleClaudeSessionID(sessionInfo, claudeSessionID, threadTS)
	})

	return processWithCallback, sessionInfo, nil
}

// handleClaudeSessionID handles the setup once we receive Claude's actual session ID
func (cs *ClaudeService) handleClaudeSessionID(sessionInfo *SessionInfo, claudeSessionID, threadTS string) error {
	// Create session-specific directory using Claude's actual session ID
	sessionDir := filepath.Join("./data", "session", claudeSessionID)
	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		return fmt.Errorf("failed to create session directory: %w", err)
	}

	// Create CLAUDE.md in session directory from default configuration
	sessionClaudemd := filepath.Join(sessionDir, "CLAUDE.md")
	if err := cs.createClaudeMDFromConfig(sessionClaudemd, ""); err != nil {
		slog.Warn("Failed to create CLAUDE.md in session directory",
			"claude_session_id", claudeSessionID,
			"error", err)
		// Continue without CLAUDE.md - not critical
	}

	// Update session info
	sessionInfo.SessionID = claudeSessionID
	sessionInfo.WorkingDir = sessionDir

	// Add the session directory to Claude's accessible directories
	// Note: This would require extending the Claude CLI to support adding directories dynamically,
	// or restarting the process with the new directory included

	slog.Info("Successfully set up session directory with Claude's session ID",
		"claude_session_id", claudeSessionID,
		"session_dir", sessionDir,
		"thread_ts", threadTS)

	return nil
}

// Modified handleStdout that triggers the callback (this would replace the existing handleStdout logic)
func (s *Service) handleStdoutWithCallback(process *ProcessWithCallback) {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("Claude stdout handler panicked",
				"correlation_id", process.correlationID,
				"panic", r,
				"action", "stdout_handler_panic",
			)
		}
	}()

	lineCount := 0
	for process.stdoutScanner.Scan() {
		lineCount++
		line := process.stdoutScanner.Text()

		if process.stderrLogFile != nil {
			fmt.Fprintln(process.stdoutLogFile, line)
		}

		var msg Message
		if err := json.Unmarshal([]byte(line), &msg); err != nil {
			slog.Debug("Failed to parse Claude message",
				"correlation_id", process.correlationID,
				"error", err,
				"raw_line", line,
				"action", "message_parse_failed",
			)
			continue
		}

		// Handle initialization message and trigger callback
		if msg.Type == "system" && msg.Subtype == "init" && process.sessionID == "" {
			process.sessionID = msg.SessionID

			slog.Info("Received Claude init message",
				"correlation_id", process.correlationID,
				"claude_session_id", msg.SessionID,
				"action", "init_message_received",
			)

			// Execute the session ID callback to set up the directory
			process.executeSessionIDCallback(msg.SessionID)

			// Signal initialization complete
			select {
			case process.initComplete <- true:
			default:
			}
			continue
		}

		// Send to output channel
		select {
		case process.outputChan <- msg:
		case <-process.ctx.Done():
			slog.Debug("Context cancelled, stopping stdout handler",
				"correlation_id", process.correlationID,
				"session_id", process.sessionID,
				"lines_processed", lineCount,
				"action", "stdout_handler_stopped",
			)
			return
		}
	}

	if err := process.stdoutScanner.Err(); err != nil {
		slog.Error("Claude stdout scanner error",
			"correlation_id", process.correlationID,
			"session_id", process.sessionID,
			"error", err,
			"lines_processed", lineCount,
			"action", "stdout_scanner_error",
		)
	} else {
		slog.Debug("Claude stdout monitoring completed",
			"correlation_id", process.correlationID,
			"session_id", process.sessionID,
			"lines_processed", lineCount,
			"action", "stdout_monitor_completed",
		)
	}
}
