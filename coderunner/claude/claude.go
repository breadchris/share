package claude

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type ClaudeService struct {
	deps     deps.Deps
	sessions map[string]*ClaudeProcess
	mu       sync.RWMutex
}

type ClaudeProcess struct {
	sessionID     string
	cmd           *exec.Cmd
	stdin         io.WriteCloser
	stdout        io.ReadCloser
	stderr        io.ReadCloser
	stdoutScanner *bufio.Scanner
	stderrScanner *bufio.Scanner
	ctx           context.Context
	cancel        context.CancelFunc
	messages      []ClaudeMessage
	mu            sync.Mutex
	startTime     time.Time
	correlationID string
	userID        string
	debugDir      string
	stdinLogFile  *os.File
	stdoutLogFile *os.File
	stderrLogFile *os.File
	isHealthy     bool
	lastHeartbeat time.Time
	inputChan     chan string        // Channel for sending messages to Claude
	outputChan    chan ClaudeMessage // Channel for receiving messages from Claude
	initComplete  chan bool          // Signal when initialization is complete
}

type ClaudeMessage struct {
	Type      string          `json:"type"`
	Subtype   string          `json:"subtype,omitempty"`
	Message   json.RawMessage `json:"message,omitempty"`
	SessionID string          `json:"session_id,omitempty"`
	ParentID  string          `json:"parent_tool_use_id,omitempty"`
	Result    string          `json:"result,omitempty"`
	IsError   bool            `json:"is_error,omitempty"`
}

type ClaudeInitMessage struct {
	CWD          string   `json:"cwd"`
	SessionID    string   `json:"session_id"`
	Tools        []string `json:"tools"`
	Model        string   `json:"model"`
	APIKeySource string   `json:"apiKeySource"`
}

type ClaudePrompt struct {
	Prompt    string `json:"prompt"`
	SessionID string `json:"sessionId,omitempty"`
}

type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func NewClaudeService(d deps.Deps) *ClaudeService {
	return &ClaudeService{
		deps:     d,
		sessions: make(map[string]*ClaudeProcess),
	}
}

// createDebugDirectory creates debug logging directory if debug mode is enabled
func (cs *ClaudeService) createDebugDirectory(correlationID string) (string, error) {
	if !cs.deps.Config.ClaudeDebug {
		return "", nil
	}

	debugDir := filepath.Join("/tmp/worklet", correlationID)
	if err := os.MkdirAll(debugDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create debug directory: %w", err)
	}
	return debugDir, nil
}

// openDebugFiles opens debug log files for stdin, stdout, and stderr
func (cs *ClaudeService) openDebugFiles(debugDir string) (*os.File, *os.File, *os.File, error) {
	if debugDir == "" {
		return nil, nil, nil, nil
	}

	stdinFile, err := os.Create(filepath.Join(debugDir, "stdin.log"))
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to create stdin log file: %w", err)
	}

	stdoutFile, err := os.Create(filepath.Join(debugDir, "stdout.log"))
	if err != nil {
		stdinFile.Close()
		return nil, nil, nil, fmt.Errorf("failed to create stdout log file: %w", err)
	}

	stderrFile, err := os.Create(filepath.Join(debugDir, "stderr.log"))
	if err != nil {
		stdinFile.Close()
		stdoutFile.Close()
		return nil, nil, nil, fmt.Errorf("failed to create stderr log file: %w", err)
	}

	return stdinFile, stdoutFile, stderrFile, nil
}

// closeDebugFiles safely closes all debug files
func (process *ClaudeProcess) closeDebugFiles() {
	if process.stdinLogFile != nil {
		process.stdinLogFile.Close()
	}
	if process.stdoutLogFile != nil {
		process.stdoutLogFile.Close()
	}
	if process.stderrLogFile != nil {
		process.stderrLogFile.Close()
	}
}

// logToDebugFile writes data to a debug file if it exists
func (process *ClaudeProcess) logToDebugFile(file *os.File, prefix string, data []byte) {
	if file != nil {
		timestamp := time.Now().Format("2006-01-02 15:04:05.000")
		line := fmt.Sprintf("[%s] %s: %s\n", timestamp, prefix, string(data))
		file.WriteString(line)
		file.Sync() // Ensure data is written immediately
	}
}

// validateProcessHealth checks if the Claude process is still healthy
func (process *ClaudeProcess) validateProcessHealth() bool {
	if process.cmd == nil || process.cmd.Process == nil {
		return false
	}

	// Check if process is still running
	if err := process.cmd.Process.Signal(os.Signal(nil)); err != nil {
		return false
	}

	process.lastHeartbeat = time.Now()
	process.isHealthy = true
	return true
}

// monitorStderr monitors stderr output from the Claude process
func (cs *ClaudeService) monitorStderr(process *ClaudeProcess) {
	slog.Debug("Starting stderr monitoring",
		"correlation_id", process.correlationID,
		"user_id", process.userID,
		"session_id", process.sessionID,
		"action", "stderr_monitor_start",
	)

	stderrLineCount := 0
	for process.stderrScanner.Scan() {
		line := process.stderrScanner.Text()
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		stderrLineCount++

		// Log to debug file if enabled
		process.logToDebugFile(process.stderrLogFile, "STDERR", []byte(line))

		// Log stderr messages with high priority since they often indicate issues
		slog.Warn("Claude stderr output",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"stderr_line", line,
			"stderr_line_count", stderrLineCount,
			"action", "stderr_received",
		)

		// Check for specific error patterns that might indicate process health issues
		if strings.Contains(strings.ToLower(line), "error") ||
			strings.Contains(strings.ToLower(line), "failed") ||
			strings.Contains(strings.ToLower(line), "timeout") {

			slog.Error("Critical error detected in Claude stderr",
				"correlation_id", process.correlationID,
				"user_id", process.userID,
				"session_id", process.sessionID,
				"error_line", line,
				"action", "stderr_critical_error",
			)

			process.isHealthy = false
		}
	}

	if err := process.stderrScanner.Err(); err != nil {
		slog.Error("Claude stderr scanner error",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"error", err,
			"lines_processed", stderrLineCount,
			"action", "stderr_scanner_error",
		)
	} else {
		slog.Debug("Claude stderr monitoring completed",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"lines_processed", stderrLineCount,
			"action", "stderr_monitor_completed",
		)
	}
}

func (cs *ClaudeService) CreateSession(userID string) (*ClaudeProcess, error) {
	startTime := time.Now()
	correlationID := uuid.New().String()

	slog.Info("Creating new Claude CLI session",
		"correlation_id", correlationID,
		"user_id", userID,
		"debug_mode", cs.deps.Config.ClaudeDebug,
		"action", "claude_process_start",
	)

	// Create debug directory if debug mode is enabled
	debugDir, err := cs.createDebugDirectory(correlationID)
	if err != nil {
		slog.Error("Failed to create debug directory",
			"correlation_id", correlationID,
			"user_id", userID,
			"error", err,
			"action", "debug_dir_failed",
		)
		return nil, fmt.Errorf("failed to create debug directory: %w", err)
	}

	// Open debug files if debug mode is enabled
	stdinLogFile, stdoutLogFile, stderrLogFile, err := cs.openDebugFiles(debugDir)
	if err != nil {
		slog.Error("Failed to open debug files",
			"correlation_id", correlationID,
			"user_id", userID,
			"error", err,
			"action", "debug_files_failed",
		)
		return nil, fmt.Errorf("failed to open debug files: %w", err)
	}

	if debugDir != "" {
		slog.Info("Debug mode enabled",
			"correlation_id", correlationID,
			"user_id", userID,
			"debug_dir", debugDir,
			"action", "debug_enabled",
		)
	}

	ctx, cancel := context.WithCancel(context.Background())

	args := []string{
		"--print",
		"--input-format", "stream-json",
		"--output-format", "stream-json",
		"--verbose",
	}

	slog.Debug("Claude CLI command prepared",
		"correlation_id", correlationID,
		"user_id", userID,
		"command", "claude",
		"args", strings.Join(args, " "),
		"action", "claude_cmd_prepared",
	)

	cmd := exec.CommandContext(ctx, "claude", args...)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		cancel()
		if stdinLogFile != nil {
			stdinLogFile.Close()
		}
		if stdoutLogFile != nil {
			stdoutLogFile.Close()
		}
		if stderrLogFile != nil {
			stderrLogFile.Close()
		}
		slog.Error("Failed to create Claude stdin pipe",
			"correlation_id", correlationID,
			"user_id", userID,
			"error", err,
			"action", "claude_stdin_failed",
		)
		return nil, fmt.Errorf("failed to create stdin pipe: %w", err)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		if stdinLogFile != nil {
			stdinLogFile.Close()
		}
		if stdoutLogFile != nil {
			stdoutLogFile.Close()
		}
		if stderrLogFile != nil {
			stderrLogFile.Close()
		}
		slog.Error("Failed to create Claude stdout pipe",
			"correlation_id", correlationID,
			"user_id", userID,
			"error", err,
			"action", "claude_stdout_failed",
		)
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		if stdinLogFile != nil {
			stdinLogFile.Close()
		}
		if stdoutLogFile != nil {
			stdoutLogFile.Close()
		}
		if stderrLogFile != nil {
			stderrLogFile.Close()
		}
		slog.Error("Failed to create Claude stderr pipe",
			"correlation_id", correlationID,
			"user_id", userID,
			"error", err,
			"action", "claude_stderr_failed",
		)
		return nil, fmt.Errorf("failed to create stderr pipe: %w", err)
	}

	slog.Debug("Starting Claude CLI process",
		"correlation_id", correlationID,
		"user_id", userID,
		"action", "claude_process_starting",
	)

	if err := cmd.Start(); err != nil {
		cancel()
		if stdinLogFile != nil {
			stdinLogFile.Close()
		}
		if stdoutLogFile != nil {
			stdoutLogFile.Close()
		}
		if stderrLogFile != nil {
			stderrLogFile.Close()
		}
		slog.Error("Failed to start Claude CLI process",
			"correlation_id", correlationID,
			"user_id", userID,
			"error", err,
			"command", "claude",
			"args", strings.Join(args, " "),
			"action", "claude_process_start_failed",
		)
		return nil, fmt.Errorf("failed to start claude process: %w", err)
	}

	processStartDuration := time.Since(startTime)
	slog.Info("Claude CLI process started successfully",
		"correlation_id", correlationID,
		"user_id", userID,
		"pid", cmd.Process.Pid,
		"start_duration_ms", processStartDuration.Milliseconds(),
		"action", "claude_process_started",
	)

	process := &ClaudeProcess{
		cmd:           cmd,
		stdin:         stdin,
		stdout:        stdout,
		stderr:        stderr,
		stdoutScanner: bufio.NewScanner(stdout),
		stderrScanner: bufio.NewScanner(stderr),
		ctx:           ctx,
		cancel:        cancel,
		messages:      []ClaudeMessage{},
		startTime:     startTime,
		correlationID: correlationID,
		userID:        userID,
		debugDir:      debugDir,
		stdinLogFile:  stdinLogFile,
		stdoutLogFile: stdoutLogFile,
		stderrLogFile: stderrLogFile,
		isHealthy:     true,
		lastHeartbeat: time.Now(),
		inputChan:     make(chan string, 10),        // Buffered channel for input
		outputChan:    make(chan ClaudeMessage, 10), // Buffered channel for output
		initComplete:  make(chan bool, 1),           // Signal channel for init
	}

	// Start stderr monitoring in background
	go cs.monitorStderr(process)

	// Start message handlers
	go cs.handleStdout(process)
	go cs.handleStdin(process)

	// Send initial message to trigger Claude's initialization
	initialMessage := `{"type":"user","message":{"role":"user","content":[{"type":"text","text":""}]}}`
	select {
	case process.inputChan <- initialMessage:
		slog.Debug("Sent initial message to trigger Claude init",
			"correlation_id", correlationID,
			"user_id", userID,
			"action", "init_trigger_sent",
		)
	case <-time.After(5 * time.Second):
		cancel()
		process.closeDebugFiles()
		return nil, fmt.Errorf("timeout sending initial message")
	}

	// Wait for initialization to complete
	select {
	case <-process.initComplete:
		slog.Info("Claude session initialized successfully",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", process.sessionID,
			"pid", cmd.Process.Pid,
			"total_duration_ms", time.Since(startTime).Milliseconds(),
			"action", "session_initialized",
		)
	case <-time.After(10 * time.Second):
		cancel()
		process.closeDebugFiles()
		return nil, fmt.Errorf("timeout waiting for Claude initialization")
	case <-ctx.Done():
		process.closeDebugFiles()
		return nil, fmt.Errorf("context cancelled during initialization")
	}

	// Add to active sessions
	cs.mu.Lock()
	cs.sessions[process.sessionID] = process
	cs.mu.Unlock()

	return process, nil
}

// handleStdout reads messages from Claude's stdout and processes them
func (cs *ClaudeService) handleStdout(process *ClaudeProcess) {
	defer close(process.outputChan)
	defer close(process.initComplete)

	slog.Debug("Starting stdout handler",
		"correlation_id", process.correlationID,
		"user_id", process.userID,
		"action", "stdout_handler_start",
	)

	messageCount := 0
	for process.stdoutScanner.Scan() {
		line := process.stdoutScanner.Text()
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		messageCount++

		// Log to debug file if enabled
		process.logToDebugFile(process.stdoutLogFile, "STDOUT", []byte(line))

		slog.Debug("Claude stdout line received",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"line_length", len(line),
			"message_count", messageCount,
			"action", "stdout_line_received",
		)

		var msg ClaudeMessage
		if err := json.Unmarshal([]byte(line), &msg); err != nil {
			slog.Error("Failed to parse Claude message",
				"correlation_id", process.correlationID,
				"user_id", process.userID,
				"error", err,
				"raw_line", line,
				"action", "message_parse_failed",
			)
			continue
		}

		// Handle initialization message
		if msg.Type == "system" && msg.Subtype == "init" && process.sessionID == "" {
			process.sessionID = msg.SessionID
			process.mu.Lock()
			process.messages = append(process.messages, msg)
			process.mu.Unlock()

			slog.Info("Received Claude init message",
				"correlation_id", process.correlationID,
				"user_id", process.userID,
				"session_id", msg.SessionID,
				"action", "init_message_received",
			)

			// Save session to database
			session := &models.ClaudeSession{
				SessionID: msg.SessionID,
				UserID:    process.userID,
				Messages:  models.JSONField[interface{}]{Data: []ClaudeMessage{msg}},
				Title:     "New Claude Session",
			}
			if err := cs.deps.DB.Create(session).Error; err != nil {
				slog.Error("Failed to save session to database",
					"correlation_id", process.correlationID,
					"user_id", process.userID,
					"session_id", msg.SessionID,
					"error", err,
					"action", "session_save_failed",
				)
			}

			// Signal initialization complete
			select {
			case process.initComplete <- true:
			default:
			}
			continue
		}

		// Store message
		process.mu.Lock()
		process.messages = append(process.messages, msg)
		process.mu.Unlock()

		// Send to output channel
		select {
		case process.outputChan <- msg:
		case <-process.ctx.Done():
			slog.Debug("Context cancelled, stopping stdout handler",
				"correlation_id", process.correlationID,
				"user_id", process.userID,
				"action", "stdout_handler_cancelled",
			)
			return
		}

		// Save to database periodically
		if msg.Type == "result" {
			if err := cs.SaveSession(process); err != nil {
				slog.Error("Failed to save session",
					"correlation_id", process.correlationID,
					"user_id", process.userID,
					"session_id", process.sessionID,
					"error", err,
					"action", "session_save_failed",
				)
			}
		}
	}

	if err := process.stdoutScanner.Err(); err != nil {
		slog.Error("Stdout scanner error",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"error", err,
			"messages_processed", messageCount,
			"action", "stdout_scanner_error",
		)
	}

	slog.Debug("Stdout handler completed",
		"correlation_id", process.correlationID,
		"user_id", process.userID,
		"messages_processed", messageCount,
		"action", "stdout_handler_completed",
	)
}

// handleStdin writes messages from the input channel to Claude's stdin
func (cs *ClaudeService) handleStdin(process *ClaudeProcess) {
	slog.Debug("Starting stdin handler",
		"correlation_id", process.correlationID,
		"user_id", process.userID,
		"action", "stdin_handler_start",
	)

	messageCount := 0
	for {
		select {
		case message, ok := <-process.inputChan:
			if !ok {
				slog.Debug("Input channel closed, stopping stdin handler",
					"correlation_id", process.correlationID,
					"user_id", process.userID,
					"messages_sent", messageCount,
					"action", "stdin_handler_stopped",
				)
				return
			}

			messageCount++

			// Log to debug file if enabled
			process.logToDebugFile(process.stdinLogFile, "STDIN", []byte(message))

			// Write to Claude's stdin
			if _, err := fmt.Fprintln(process.stdin, message); err != nil {
				slog.Error("Failed to write to Claude stdin",
					"correlation_id", process.correlationID,
					"user_id", process.userID,
					"error", err,
					"message_length", len(message),
					"action", "stdin_write_failed",
				)
				return
			}

			slog.Debug("Sent message to Claude",
				"correlation_id", process.correlationID,
				"user_id", process.userID,
				"message_length", len(message),
				"message_count", messageCount,
				"action", "stdin_message_sent",
			)

		case <-process.ctx.Done():
			slog.Debug("Context cancelled, stopping stdin handler",
				"correlation_id", process.correlationID,
				"user_id", process.userID,
				"messages_sent", messageCount,
				"action", "stdin_handler_cancelled",
			)
			return
		}
	}
}

func (cs *ClaudeService) ResumeSession(sessionID string, userID string) (*ClaudeProcess, error) {
	startTime := time.Now()
	correlationID := uuid.New().String()

	slog.Info("Resuming Claude session",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"action", "session_resume_start",
	)

	// Check if session is already active
	cs.mu.RLock()
	if process, exists := cs.sessions[sessionID]; exists {
		cs.mu.RUnlock()
		slog.Info("Session already active",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"action", "session_already_active",
		)
		return process, nil
	}
	cs.mu.RUnlock()

	// Load session from database
	slog.Debug("Loading session from database",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"action", "db_load_start",
	)

	var session models.ClaudeSession
	if err := cs.deps.DB.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err != nil {
		slog.Error("Failed to load session from database",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"error", err,
			"action", "db_load_failed",
		)
		return nil, fmt.Errorf("session not found: %w", err)
	}

	slog.Debug("Session loaded from database",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"session_title", session.Title,
		"created_at", session.CreatedAt,
		"action", "db_load_success",
	)

	// Create new process with resume flag
	ctx, cancel := context.WithCancel(context.Background())

	args := []string{
		"--print",
		"--output-format", "stream-json",
		"--verbose",
		"--resume", sessionID,
	}

	slog.Debug("Preparing Claude CLI resume command",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"command", "claude",
		"args", strings.Join(args, " "),
		"action", "resume_cmd_prepared",
	)

	cmd := exec.CommandContext(ctx, "claude", args...)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		cancel()
		slog.Error("Failed to create Claude stdin pipe for resume",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"error", err,
			"action", "resume_stdin_failed",
		)
		return nil, fmt.Errorf("failed to create stdin pipe: %w", err)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		slog.Error("Failed to create Claude stdout pipe for resume",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"error", err,
			"action", "resume_stdout_failed",
		)
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	slog.Debug("Starting Claude CLI process for resume",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"action", "resume_process_starting",
	)

	if err := cmd.Start(); err != nil {
		cancel()
		slog.Error("Failed to start Claude CLI process for resume",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"error", err,
			"command", "claude",
			"args", strings.Join(args, " "),
			"action", "resume_process_start_failed",
		)
		return nil, fmt.Errorf("failed to start claude process: %w", err)
	}

	processStartDuration := time.Since(startTime)
	slog.Info("Claude CLI process started for resume",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"pid", cmd.Process.Pid,
		"start_duration_ms", processStartDuration.Milliseconds(),
		"action", "resume_process_started",
	)

	// Parse stored messages
	slog.Debug("Parsing stored messages",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"action", "message_parse_start",
	)

	var messages []ClaudeMessage
	if session.Messages.Data != nil {
		if messageData, ok := session.Messages.Data.([]interface{}); ok {
			// Convert from interface{} slice to ClaudeMessage slice
			for i, item := range messageData {
				if msgBytes, err := json.Marshal(item); err == nil {
					var msg ClaudeMessage
					if err := json.Unmarshal(msgBytes, &msg); err == nil {
						messages = append(messages, msg)
					} else {
						slog.Warn("Failed to unmarshal stored message",
							"correlation_id", correlationID,
							"user_id", userID,
							"session_id", sessionID,
							"message_index", i,
							"error", err,
							"action", "message_unmarshal_failed",
						)
					}
				} else {
					slog.Warn("Failed to marshal stored message",
						"correlation_id", correlationID,
						"user_id", userID,
						"session_id", sessionID,
						"message_index", i,
						"error", err,
						"action", "message_marshal_failed",
					)
				}
			}
		}
	}

	slog.Debug("Messages parsed successfully",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"message_count", len(messages),
		"action", "message_parse_success",
	)

	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		slog.Error("Failed to create Claude stderr pipe for resume",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"error", err,
			"action", "resume_stderr_failed",
		)
		return nil, fmt.Errorf("failed to create stderr pipe: %w", err)
	}

	process := &ClaudeProcess{
		sessionID:     sessionID,
		cmd:           cmd,
		stdin:         stdin,
		stdout:        stdout,
		stderr:        stderr,
		stdoutScanner: bufio.NewScanner(stdout),
		stderrScanner: bufio.NewScanner(stderr),
		ctx:           ctx,
		cancel:        cancel,
		messages:      messages,
		startTime:     startTime,
		correlationID: correlationID,
		userID:        userID,
		inputChan:     make(chan string, 10),
		outputChan:    make(chan ClaudeMessage, 10),
		initComplete:  make(chan bool, 1),
		isHealthy:     true,
		lastHeartbeat: time.Now(),
	}

	// Start message handlers
	go cs.monitorStderr(process)
	go cs.handleStdout(process)
	go cs.handleStdin(process)

	// Since this is a resume, we don't need to wait for init message
	// The session is already initialized
	select {
	case process.initComplete <- true:
	default:
	}

	cs.mu.Lock()
	cs.sessions[sessionID] = process
	cs.mu.Unlock()

	totalDuration := time.Since(startTime)
	slog.Info("Claude session resumed successfully",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"pid", cmd.Process.Pid,
		"message_count", len(messages),
		"total_duration_ms", totalDuration.Milliseconds(),
		"action", "session_resumed",
	)

	return process, nil
}

func (cs *ClaudeService) HandleWebSocket(conn *websocket.Conn, userID string) {
	// Generate correlation ID for this WebSocket connection
	correlationID := uuid.New().String()
	startTime := time.Now()

	slog.Info("WebSocket connection established",
		"correlation_id", correlationID,
		"user_id", userID,
		"remote_addr", conn.RemoteAddr().String(),
		"timestamp", startTime,
	)

	defer func() {
		duration := time.Since(startTime)
		slog.Info("WebSocket connection closed",
			"correlation_id", correlationID,
			"user_id", userID,
			"duration_ms", duration.Milliseconds(),
		)
		conn.Close()
	}()

	var process *ClaudeProcess
	var err error

	for {
		var msg WSMessage
		if err := conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("Unexpected WebSocket error",
					"correlation_id", correlationID,
					"user_id", userID,
					"error", err,
					"error_type", "websocket_unexpected_close",
				)
			} else {
				slog.Debug("WebSocket connection closed normally",
					"correlation_id", correlationID,
					"user_id", userID,
					"reason", err.Error(),
				)
			}
			break
		}

		// Log incoming message with size and type
		msgSize := len(fmt.Sprintf("%v", msg.Payload))
		slog.Debug("WebSocket message received",
			"correlation_id", correlationID,
			"user_id", userID,
			"message_type", msg.Type,
			"payload_size_bytes", msgSize,
			"session_id", func() string {
				if process != nil {
					return process.sessionID
				}
				return "none"
			}(),
		)

		switch msg.Type {
		case "start":
			slog.Info("Starting new Claude session",
				"correlation_id", correlationID,
				"user_id", userID,
				"action", "session_start",
			)

			process, err = cs.CreateSession(userID)
			if err != nil {
				slog.Error("Failed to create Claude session",
					"correlation_id", correlationID,
					"user_id", userID,
					"error", err,
					"action", "session_start_failed",
				)

				conn.WriteJSON(WSMessage{
					Type:    "error",
					Payload: json.RawMessage(fmt.Sprintf(`{"error": "%s"}`, err.Error())),
				})
				continue
			}

			// Update process with correlation info
			if process != nil {
				process.correlationID = correlationID
				process.userID = userID
			}

			slog.Info("Claude session created successfully",
				"correlation_id", correlationID,
				"user_id", userID,
				"session_id", process.sessionID,
				"action", "session_started",
			)

			// Start reading from Claude in a goroutine
			go cs.streamFromClaude(process, conn)

		case "resume":
			var payload struct {
				SessionID string `json:"sessionId"`
			}
			if err := json.Unmarshal(msg.Payload, &payload); err != nil {
				slog.Error("Invalid resume payload",
					"correlation_id", correlationID,
					"user_id", userID,
					"error", err,
					"action", "resume_parse_failed",
				)

				conn.WriteJSON(WSMessage{
					Type:    "error",
					Payload: json.RawMessage(`{"error": "invalid payload"}`),
				})
				continue
			}

			slog.Info("Resuming Claude session",
				"correlation_id", correlationID,
				"user_id", userID,
				"session_id", payload.SessionID,
				"action", "session_resume",
			)

			process, err = cs.ResumeSession(payload.SessionID, userID)
			if err != nil {
				slog.Error("Failed to resume Claude session",
					"correlation_id", correlationID,
					"user_id", userID,
					"session_id", payload.SessionID,
					"error", err,
					"action", "session_resume_failed",
				)

				conn.WriteJSON(WSMessage{
					Type:    "error",
					Payload: json.RawMessage(fmt.Sprintf(`{"error": "%s"}`, err.Error())),
				})
				continue
			}

			// Update process with correlation info
			if process != nil {
				process.correlationID = correlationID
				process.userID = userID
			}

			slog.Info("Claude session resumed successfully",
				"correlation_id", correlationID,
				"user_id", userID,
				"session_id", process.sessionID,
				"message_count", len(process.messages),
				"action", "session_resumed",
			)

			// Send existing messages
			for i, msg := range process.messages {
				jsonData, _ := json.Marshal(msg)
				conn.WriteJSON(WSMessage{
					Type:    "message",
					Payload: json.RawMessage(jsonData),
				})

				slog.Debug("Replaying message to client",
					"correlation_id", correlationID,
					"user_id", userID,
					"session_id", process.sessionID,
					"message_index", i,
					"message_type", msg.Type,
				)
			}

			// Start reading from Claude
			go cs.streamFromClaude(process, conn)

		case "prompt":
			if process == nil {
				slog.Warn("Prompt received without active session",
					"correlation_id", correlationID,
					"user_id", userID,
					"action", "prompt_no_session",
				)

				conn.WriteJSON(WSMessage{
					Type:    "error",
					Payload: json.RawMessage(`{"error": "no active session"}`),
				})
				continue
			}

			var prompt ClaudePrompt
			if err := json.Unmarshal(msg.Payload, &prompt); err != nil {
				slog.Error("Invalid prompt payload",
					"correlation_id", correlationID,
					"user_id", userID,
					"session_id", process.sessionID,
					"error", err,
					"action", "prompt_parse_failed",
				)

				conn.WriteJSON(WSMessage{
					Type:    "error",
					Payload: json.RawMessage(`{"error": "invalid prompt"}`),
				})
				continue
			}

			// Safely truncate prompt for logging
			promptPreview := prompt.Prompt
			if len(promptPreview) > 200 {
				promptPreview = promptPreview[:200] + "..."
			}

			slog.Info("Sending prompt to Claude",
				"correlation_id", correlationID,
				"user_id", userID,
				"session_id", process.sessionID,
				"prompt_length", len(prompt.Prompt),
				"prompt_preview", promptPreview,
				"action", "prompt_send",
			)

			// Send prompt to Claude
			if _, err := fmt.Fprintln(process.stdin, prompt.Prompt); err != nil {
				slog.Error("Failed to send prompt to Claude process",
					"correlation_id", correlationID,
					"user_id", userID,
					"session_id", process.sessionID,
					"error", err,
					"action", "prompt_send_failed",
				)

				conn.WriteJSON(WSMessage{
					Type:    "error",
					Payload: json.RawMessage(fmt.Sprintf(`{"error": "failed to send prompt: %s"}`, err.Error())),
				})
			} else {
				// Log to debug file if enabled
				process.logToDebugFile(process.stdinLogFile, "PROMPT", []byte(prompt.Prompt))

				slog.Debug("Prompt sent to Claude successfully",
					"correlation_id", correlationID,
					"user_id", userID,
					"session_id", process.sessionID,
					"action", "prompt_sent",
				)
			}

		case "stop":
			if process != nil {
				slog.Info("Stopping Claude session",
					"correlation_id", correlationID,
					"user_id", userID,
					"session_id", process.sessionID,
					"action", "session_stop",
				)

				cs.StopSession(process.sessionID)
				process = nil

				slog.Info("Claude session stopped",
					"correlation_id", correlationID,
					"user_id", userID,
					"action", "session_stopped",
				)
			} else {
				slog.Warn("Stop received without active session",
					"correlation_id", correlationID,
					"user_id", userID,
					"action", "stop_no_session",
				)
			}
		}
	}

	// Clean up on disconnect
	if process != nil {
		cs.StopSession(process.sessionID)
	}
}

func (cs *ClaudeService) streamFromClaude(process *ClaudeProcess, conn *websocket.Conn) {
	slog.Info("Starting Claude stream processing",
		"correlation_id", process.correlationID,
		"user_id", process.userID,
		"session_id", process.sessionID,
		"action", "stream_start",
	)

	messageCount := 0
	totalBytesProcessed := 0

	for process.stdoutScanner.Scan() {
		line := process.stdoutScanner.Text()
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		messageCount++
		totalBytesProcessed += len(line)

		// Log to debug file if enabled
		process.logToDebugFile(process.stdoutLogFile, "STDOUT", []byte(line))

		slog.Debug("Claude stream line received",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"message_count", messageCount,
			"line_length", len(line),
			"total_bytes", totalBytesProcessed,
			"action", "stream_line_received",
		)

		var msg ClaudeMessage
		if err := json.Unmarshal([]byte(line), &msg); err != nil {
			slog.Error("Failed to parse Claude JSON output",
				"correlation_id", process.correlationID,
				"user_id", process.userID,
				"session_id", process.sessionID,
				"error", err,
				"raw_line", line,
				"line_length", len(line),
				"message_count", messageCount,
				"action", "stream_parse_failed",
			)
			continue
		}

		// Extract key info for logging
		contentPreview := ""
		tokenUsage := map[string]interface{}{}

		if msg.Type == "assistant" && msg.Message != nil {
			// Try to extract content and usage from assistant message
			if msgBytes, err := json.Marshal(msg.Message); err == nil {
				var assistantMsg map[string]interface{}
				if err := json.Unmarshal(msgBytes, &assistantMsg); err == nil {
					if content, ok := assistantMsg["content"].([]interface{}); ok && len(content) > 0 {
						if textContent, ok := content[0].(map[string]interface{}); ok {
							if text, ok := textContent["text"].(string); ok {
								if len(text) > 100 {
									contentPreview = text[:100] + "..."
								} else {
									contentPreview = text
								}
							}
						}
					}
					if usage, ok := assistantMsg["usage"].(map[string]interface{}); ok {
						tokenUsage = usage
					}
				}
			}
		}

		slog.Info("Claude message parsed successfully",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"message_type", msg.Type,
			"message_subtype", msg.Subtype,
			"content_preview", contentPreview,
			"token_usage", tokenUsage,
			"is_error", msg.IsError,
			"message_count", messageCount,
			"action", "stream_message_parsed",
		)

		// Store message
		process.mu.Lock()
		process.messages = append(process.messages, msg)
		messageStoreCount := len(process.messages)
		process.mu.Unlock()

		slog.Debug("Message stored in process",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"total_messages", messageStoreCount,
			"action", "message_stored",
		)

		// Forward to WebSocket
		jsonData, _ := json.Marshal(msg)
		if err := conn.WriteJSON(WSMessage{
			Type:    "message",
			Payload: json.RawMessage(jsonData),
		}); err != nil {
			slog.Error("Failed to write message to WebSocket",
				"correlation_id", process.correlationID,
				"user_id", process.userID,
				"session_id", process.sessionID,
				"error", err,
				"message_type", msg.Type,
				"action", "websocket_write_failed",
			)
			break
		}

		slog.Debug("Message sent to WebSocket client",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"message_type", msg.Type,
			"payload_size", len(jsonData),
			"action", "websocket_message_sent",
		)

		// Save to database periodically
		if msg.Type == "result" {
			slog.Debug("Saving session after result message",
				"correlation_id", process.correlationID,
				"user_id", process.userID,
				"session_id", process.sessionID,
				"action", "session_save_trigger",
			)

			if err := cs.SaveSession(process); err != nil {
				slog.Error("Failed to save session to database",
					"correlation_id", process.correlationID,
					"user_id", process.userID,
					"session_id", process.sessionID,
					"error", err,
					"action", "session_save_failed",
				)
			}
		}
	}

	if err := process.stdoutScanner.Err(); err != nil {
		slog.Error("Claude stream scanner error",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"error", err,
			"messages_processed", messageCount,
			"total_bytes", totalBytesProcessed,
			"action", "stream_scanner_error",
		)
	} else {
		slog.Info("Claude stream processing completed",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"messages_processed", messageCount,
			"total_bytes", totalBytesProcessed,
			"duration_ms", time.Since(process.startTime).Milliseconds(),
			"action", "stream_completed",
		)
	}
}

func (cs *ClaudeService) SaveSession(process *ClaudeProcess) error {
	process.mu.Lock()
	messages := process.messages
	messageCount := len(messages)
	process.mu.Unlock()

	slog.Debug("Saving session to database",
		"correlation_id", process.correlationID,
		"user_id", process.userID,
		"session_id", process.sessionID,
		"message_count", messageCount,
		"action", "session_save_start",
	)

	startTime := time.Now()
	err := cs.deps.DB.Model(&models.ClaudeSession{}).
		Where("session_id = ?", process.sessionID).
		Update("messages", models.JSONField[interface{}]{Data: messages}).Error

	duration := time.Since(startTime)

	if err != nil {
		slog.Error("Failed to save session to database",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"error", err,
			"message_count", messageCount,
			"duration_ms", duration.Milliseconds(),
			"action", "session_save_failed",
		)
	} else {
		slog.Debug("Session saved to database successfully",
			"correlation_id", process.correlationID,
			"user_id", process.userID,
			"session_id", process.sessionID,
			"message_count", messageCount,
			"duration_ms", duration.Milliseconds(),
			"action", "session_saved",
		)
	}

	return err
}

func (cs *ClaudeService) StopSession(sessionID string) {
	startTime := time.Now()

	slog.Info("Stopping Claude session",
		"session_id", sessionID,
		"action", "session_stop_start",
	)

	cs.mu.Lock()
	process, exists := cs.sessions[sessionID]
	if exists {
		delete(cs.sessions, sessionID)
	}
	cs.mu.Unlock()

	if exists {
		correlationID := process.correlationID
		userID := process.userID
		sessionUptime := time.Since(process.startTime)

		slog.Info("Found active session to stop",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"session_uptime_ms", sessionUptime.Milliseconds(),
			"message_count", len(process.messages),
			"action", "session_found_for_stop",
		)

		// Save final state
		saveStartTime := time.Now()
		if err := cs.SaveSession(process); err != nil {
			slog.Error("Failed to save session during stop",
				"correlation_id", correlationID,
				"user_id", userID,
				"session_id", sessionID,
				"error", err,
				"action", "session_final_save_failed",
			)
		} else {
			slog.Debug("Session saved during stop",
				"correlation_id", correlationID,
				"user_id", userID,
				"session_id", sessionID,
				"save_duration_ms", time.Since(saveStartTime).Milliseconds(),
				"action", "session_final_saved",
			)
		}

		// Clean up process
		slog.Debug("Cleaning up Claude process",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"pid", func() int {
				if process.cmd != nil && process.cmd.Process != nil {
					return process.cmd.Process.Pid
				}
				return 0
			}(),
			"action", "process_cleanup_start",
		)

		// Close debug files
		process.closeDebugFiles()

		process.cancel()

		if process.stdin != nil {
			process.stdin.Close()
		}
		if process.stdout != nil {
			process.stdout.Close()
		}
		if process.stderr != nil {
			process.stderr.Close()
		}

		if process.cmd != nil {
			if err := process.cmd.Wait(); err != nil {
				slog.Warn("Claude process exited with error",
					"correlation_id", correlationID,
					"user_id", userID,
					"session_id", sessionID,
					"error", err,
					"action", "process_wait_error",
				)
			} else {
				slog.Debug("Claude process exited cleanly",
					"correlation_id", correlationID,
					"user_id", userID,
					"session_id", sessionID,
					"action", "process_exited_clean",
				)
			}
		}

		totalStopDuration := time.Since(startTime)
		slog.Info("Claude session stopped successfully",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"session_uptime_ms", sessionUptime.Milliseconds(),
			"stop_duration_ms", totalStopDuration.Milliseconds(),
			"final_message_count", len(process.messages),
			"action", "session_stopped",
		)
	} else {
		slog.Warn("Attempted to stop non-existent session",
			"session_id", sessionID,
			"action", "session_not_found_for_stop",
		)
	}
}

func (cs *ClaudeService) GetSessions(userID string) ([]models.ClaudeSession, error) {
	startTime := time.Now()
	correlationID := uuid.New().String()

	slog.Debug("Fetching user sessions",
		"correlation_id", correlationID,
		"user_id", userID,
		"action", "sessions_fetch_start",
	)

	var sessions []models.ClaudeSession
	err := cs.deps.DB.Where("user_id = ?", userID).Order("updated_at DESC").Find(&sessions).Error

	duration := time.Since(startTime)

	if err != nil {
		slog.Error("Failed to fetch user sessions",
			"correlation_id", correlationID,
			"user_id", userID,
			"error", err,
			"duration_ms", duration.Milliseconds(),
			"action", "sessions_fetch_failed",
		)
	} else {
		slog.Debug("Successfully fetched user sessions",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_count", len(sessions),
			"duration_ms", duration.Milliseconds(),
			"action", "sessions_fetched",
		)
	}

	return sessions, err
}

func (cs *ClaudeService) GetSession(sessionID string, userID string) (*models.ClaudeSession, error) {
	startTime := time.Now()
	correlationID := uuid.New().String()

	slog.Debug("Fetching specific session",
		"correlation_id", correlationID,
		"user_id", userID,
		"session_id", sessionID,
		"action", "session_fetch_start",
	)

	var session models.ClaudeSession
	err := cs.deps.DB.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&session).Error

	duration := time.Since(startTime)

	if err != nil {
		slog.Error("Failed to fetch specific session",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"error", err,
			"duration_ms", duration.Milliseconds(),
			"action", "session_fetch_failed",
		)
	} else {
		slog.Debug("Successfully fetched specific session",
			"correlation_id", correlationID,
			"user_id", userID,
			"session_id", sessionID,
			"session_title", session.Title,
			"created_at", session.CreatedAt,
			"duration_ms", duration.Milliseconds(),
			"action", "session_fetched",
		)
	}

	return &session, err
}
