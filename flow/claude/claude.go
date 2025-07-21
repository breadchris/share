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

	"github.com/breadchris/flow/deps"
	"github.com/breadchris/flow/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Config struct {
	Debug    bool
	DebugDir string
	Tools    []string
}

// ClaudeMDConfig represents a CLAUDE.md configuration
type ClaudeMDConfig struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"uniqueIndex;not null"`
	Description string    `json:"description"`
	Content     string    `json:"content" gorm:"type:text;not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	IsDefault   bool      `json:"is_default" gorm:"default:false"`
}

// ClaudeMDConfigListResponse represents the response for listing configurations
type ClaudeMDConfigListResponse struct {
	Configs []ClaudeMDConfig `json:"configs"`
	Total   int              `json:"total"`
}

// ClaudeMDCreateRequest represents the request for creating a configuration
type ClaudeMDCreateRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Content     string `json:"content" binding:"required"`
}

// ClaudeMDUpdateRequest represents the request for updating a configuration
type ClaudeMDUpdateRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Content     *string `json:"content"`
}

type Service struct {
	config   Config
	sessions map[string]*Process
	mu       sync.RWMutex
}

// ClaudeService provides database-integrated Claude session management
type ClaudeService struct {
	service    *Service    // Embedded basic service
	gitService *GitService // Git operations service
	db         *gorm.DB
	config     Config
	debug      bool
}

// SessionInfo represents session metadata stored in database
type SessionInfo struct {
	SessionID     string
	ThreadTS      string
	UserID        string
	ChannelID     string
	WorkingDir    string
	LastActivity  time.Time
	Active        bool
	ProcessExists bool
}

type Process struct {
	sessionID     string
	cmd           *exec.Cmd
	stdin         io.WriteCloser
	stdout        io.ReadCloser
	stderr        io.ReadCloser
	stdoutScanner *bufio.Scanner
	stderrScanner *bufio.Scanner
	ctx           context.Context
	cancel        context.CancelFunc
	startTime     time.Time
	correlationID string
	debugDir      string
	stdinLogFile  *os.File
	stdoutLogFile *os.File
	stderrLogFile *os.File
	isHealthy     bool
	lastHeartbeat time.Time
	inputChan     chan Input   // Channel for sending messages to Claude
	outputChan    chan Message // Channel for receiving messages from Claude
	initComplete  chan bool    // Signal when initialization is complete
	errorChan     chan Message // Channel for forwarding stderr errors
}

// GetCorrelationID returns the correlation ID for this process
func (p *Process) GetCorrelationID() string {
	return p.correlationID
}

// Message represents a message from Claude CLI
type Message struct {
	Type      string          `json:"type"`
	Subtype   string          `json:"subtype,omitempty"`
	Message   json.RawMessage `json:"message,omitempty"`
	SessionID string          `json:"session_id,omitempty"`
	ParentID  string          `json:"parent_tool_use_id,omitempty"`
	Result    string          `json:"result,omitempty"`
	IsError   bool            `json:"is_error,omitempty"`
}

type Input struct {
	Type    string       `json:"type"`
	Message InputMessage `json:"message"`
}

type InputMessage struct {
	Role    string                `json:"role"`
	Content []InputMessageContent `json:"content"`
}

type InputMessageContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

func NewService(config Config) *Service {
	// Set default values if not provided
	if len(config.Tools) == 0 {
		config.Tools = []string{"Read", "Write", "Bash"}
	}
	if config.DebugDir == "" {
		config.DebugDir = "/tmp/worklet"
	}

	return &Service{
		config:   config,
		sessions: make(map[string]*Process),
	}
}

// createDebugDirectory creates debug logging directory if debug mode is enabled
func (s *Service) createDebugDirectory(correlationID string) (string, error) {
	if !s.config.Debug {
		return "", nil
	}

	debugDir := filepath.Join(s.config.DebugDir, correlationID)
	if err := os.MkdirAll(debugDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create debug directory: %w", err)
	}
	return debugDir, nil
}

// formatUserError converts Claude CLI stderr messages into user-friendly error messages
func (s *Service) formatUserError(stderrLine string) string {
	lowerLine := strings.ToLower(stderrLine)

	// Handle JSON parsing errors
	if strings.Contains(lowerLine, "syntaxerror") && strings.Contains(lowerLine, "json") {
		if strings.Contains(stderrLine, "\"asdf\"") || strings.Contains(stderrLine, "'asdf'") {
			return "Invalid input format. Please provide a valid question or command instead of random text."
		}
		return "Invalid input format. Please ensure your input is properly formatted text or valid JSON."
	}

	// Handle other common errors
	if strings.Contains(lowerLine, "parsing") && strings.Contains(lowerLine, "error") {
		return "Unable to process your input. Please check the format and try again."
	}

	if strings.Contains(lowerLine, "timeout") {
		return "Request timed out. Please try again or simplify your request."
	}

	if strings.Contains(lowerLine, "failed") {
		return "Command failed to execute. Please check your input and try again."
	}

	// Default error message for unrecognized errors
	return "An error occurred while processing your request. Please try again."
}

// openDebugFiles opens debug log files for stdin, stdout, and stderr
func (s *Service) openDebugFiles(debugDir string) (*os.File, *os.File, *os.File, error) {
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
func (process *Process) closeDebugFiles() {
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
func (process *Process) logToDebugFile(file *os.File, prefix string, data []byte) {
	if file != nil {
		timestamp := time.Now().Format("2006-01-02 15:04:05.000")
		line := fmt.Sprintf("[%s] %s: %s\n", timestamp, prefix, string(data))
		file.WriteString(line)
		file.Sync() // Ensure data is written immediately
	}
}

// validateProcessHealth checks if the Claude process is still healthy
func (process *Process) validateProcessHealth() bool {
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
func (s *Service) monitorStderr(process *Process) {
	slog.Debug("Starting stderr monitoring",
		"correlation_id", process.correlationID,
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
				"session_id", process.sessionID,
				"error_line", line,
				"action", "stderr_critical_error",
			)

			// Create user-friendly error message
			userError := s.formatUserError(line)
			errorMsg := Message{
				Type:      "error",
				Subtype:   "process_error",
				SessionID: process.sessionID,
				Message: json.RawMessage(fmt.Sprintf(`{"error": "%s", "source": "claude_process", "timestamp": "%s", "details": "%s"}`,
					userError, time.Now().Format(time.RFC3339), strings.ReplaceAll(line, `"`, `\"`))),
				IsError: true,
			}

			// Send error to error channel (non-blocking)
			select {
			case process.errorChan <- errorMsg:
				slog.Debug("Error message sent to error channel",
					"correlation_id", process.correlationID,
					"session_id", process.sessionID,
					"action", "error_forwarded",
				)
			default:
				slog.Warn("Error channel full, dropping error message",
					"correlation_id", process.correlationID,
					"session_id", process.sessionID,
					"action", "error_dropped",
				)
			}

			process.isHealthy = false
		}
	}

	if err := process.stderrScanner.Err(); err != nil {
		slog.Error("Claude stderr scanner error",
			"correlation_id", process.correlationID,
			"session_id", process.sessionID,
			"error", err,
			"lines_processed", stderrLineCount,
			"action", "stderr_scanner_error",
		)
	} else {
		slog.Debug("Claude stderr monitoring completed",
			"correlation_id", process.correlationID,
			"session_id", process.sessionID,
			"lines_processed", stderrLineCount,
			"action", "stderr_monitor_completed",
		)
	}
}

func (s *Service) CreateSession() (*Process, error) {
	return s.CreateSessionWithOptions("")
}

func (s *Service) CreateSessionWithOptions(workingDir string) (*Process, error) {
	return s.CreateSessionWithMultipleDirs([]string{workingDir})
}

// CreateSessionWithMultipleDirs creates a new Claude session with multiple directories
func (s *Service) CreateSessionWithMultipleDirs(dirs []string) (*Process, error) {
	startTime := time.Now()
	correlationID := uuid.New().String()

	// Validate that at least one directory is provided for isolation
	if len(dirs) == 0 {
		return nil, fmt.Errorf("at least one directory must be provided for Claude session isolation")
	}

	// Ensure the first directory exists and will be used as working directory
	sessionDir := dirs[0]
	if sessionDir == "" {
		return nil, fmt.Errorf("session directory (first directory) cannot be empty")
	}

	// Validate that the session directory exists and is accessible
	if _, err := os.Stat(sessionDir); err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("session directory does not exist: %s", sessionDir)
		}
		return nil, fmt.Errorf("session directory is not accessible: %s (%w)", sessionDir, err)
	}

	slog.Info("Creating new Claude CLI session",
		"correlation_id", correlationID,
		"debug_mode", s.config.Debug,
		"directories", dirs,
		"session_working_dir", sessionDir,
		"action", "claude_process_start",
	)

	// Create debug directory if debug mode is enabled
	debugDir, err := s.createDebugDirectory(correlationID)
	if err != nil {
		slog.Error("Failed to create debug directory",
			"correlation_id", correlationID,
			"error", err,
			"action", "debug_dir_failed",
		)
		return nil, fmt.Errorf("failed to create debug directory: %w", err)
	}

	// Open debug files if debug mode is enabled
	stdinLogFile, stdoutLogFile, stderrLogFile, err := s.openDebugFiles(debugDir)
	if err != nil {
		slog.Error("Failed to open debug files",
			"correlation_id", correlationID,
			"error", err,
			"action", "debug_files_failed",
		)
		return nil, fmt.Errorf("failed to open debug files: %w", err)
	}

	if debugDir != "" {
		slog.Info("Debug mode enabled",
			"correlation_id", correlationID,
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
		"--allowedTools", strings.Join(s.config.Tools, ","),
	}
	
	// Add all directories that are not empty
	for _, dir := range dirs {
		if dir != "" {
			args = append(args, "--add-dir", dir)
		}
	}

	slog.Debug("Claude CLI command prepared",
		"correlation_id", correlationID,
		"command", "claude",
		"args", strings.Join(args, " "),
		"working_dir", sessionDir,
		"action", "claude_cmd_prepared",
	)

	cmd := exec.CommandContext(ctx, "claude", args...)
	
	// Set working directory to the session directory for isolation
	cmd.Dir = sessionDir
	
	slog.Info("Claude CLI will execute from session directory",
		"correlation_id", correlationID,
		"working_dir", sessionDir,
		"action", "claude_working_dir_set",
	)

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
			"error", err,
			"action", "claude_stderr_failed",
		)
		return nil, fmt.Errorf("failed to create stderr pipe: %w", err)
	}

	slog.Debug("Starting Claude CLI process",
		"correlation_id", correlationID,
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
		"pid", cmd.Process.Pid,
		"start_duration_ms", processStartDuration.Milliseconds(),
		"action", "claude_process_started",
	)

	process := &Process{
		cmd:           cmd,
		stdin:         stdin,
		stdout:        stdout,
		stderr:        stderr,
		stdoutScanner: bufio.NewScanner(stdout),
		stderrScanner: bufio.NewScanner(stderr),
		ctx:           ctx,
		cancel:        cancel,
		startTime:     startTime,
		correlationID: correlationID,
		debugDir:      debugDir,
		stdinLogFile:  stdinLogFile,
		stdoutLogFile: stdoutLogFile,
		stderrLogFile: stderrLogFile,
		isHealthy:     true,
		lastHeartbeat: time.Now(),
		inputChan:     make(chan Input, 10),   // Buffered channel for input
		outputChan:    make(chan Message, 10), // Buffered channel for output
		initComplete:  make(chan bool, 1),     // Signal channel for init
		errorChan:     make(chan Message, 10), // Buffered channel for errors
	}

	// Start stderr monitoring in background
	go s.monitorStderr(process)

	// Start message handlers
	go s.handleStdout(process)
	go s.handleStdin(process)

	initialMessage := Input{
		Type: "user",
		Message: InputMessage{
			Role: "user",
			Content: []InputMessageContent{
				{
					Type: "text",
					Text: "Hello, Claude! Initializing session.",
				},
			},
		},
	}
	select {
	case process.inputChan <- initialMessage:
		slog.Debug("Sent initial message to trigger Claude init",
			"correlation_id", correlationID,
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
	s.mu.Lock()
	s.sessions[process.sessionID] = process
	s.mu.Unlock()

	return process, nil
}

// handleStdout reads messages from Claude's stdout and processes them
func (s *Service) handleStdout(process *Process) {
	defer close(process.outputChan)
	defer close(process.initComplete)

	slog.Debug("Starting stdout handler",
		"correlation_id", process.correlationID,
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
			"line_length", len(line),
			"message_count", messageCount,
			"action", "stdout_line_received",
		)

		var msg Message
		if err := json.Unmarshal([]byte(line), &msg); err != nil {
			slog.Error("Failed to parse Claude message",
				"correlation_id", process.correlationID,
				"error", err,
				"raw_line", line,
				"action", "message_parse_failed",
			)
			continue
		}

		// Handle initialization message
		if msg.Type == "system" && msg.Subtype == "init" && process.sessionID == "" {
			process.sessionID = msg.SessionID

			slog.Info("Received Claude init message",
				"correlation_id", process.correlationID,
				"session_id", msg.SessionID,
				"action", "init_message_received",
			)

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
				"action", "stdout_handler_cancelled",
			)
			return
		}
	}

	if err := process.stdoutScanner.Err(); err != nil {
		slog.Error("Stdout scanner error",
			"correlation_id", process.correlationID,
			"error", err,
			"messages_processed", messageCount,
			"action", "stdout_scanner_error",
		)
	}

	slog.Debug("Stdout handler completed",
		"correlation_id", process.correlationID,
		"messages_processed", messageCount,
		"action", "stdout_handler_completed",
	)
}

// handleStdin writes messages from the input channel to Claude's stdin
func (s *Service) handleStdin(process *Process) {
	slog.Debug("Starting stdin handler",
		"correlation_id", process.correlationID,
		"action", "stdin_handler_start",
	)

	messageCount := 0
	for {
		select {
		case message, ok := <-process.inputChan:
			if !ok {
				slog.Debug("Input channel closed, stopping stdin handler",
					"correlation_id", process.correlationID,
					"messages_sent", messageCount,
					"action", "stdin_handler_stopped",
				)
				return
			}

			messageCount++

			var (
				m   []byte
				err error
			)
			if m, err = json.Marshal(message); err != nil {
				slog.Error("Failed to marshal Claude input message",
					"correlation_id", process.correlationID,
					"error", err,
					"message_count", messageCount,
					"action", "stdin_message_marshal_failed",
				)
				continue
			}

			// Log to debug file if enabled
			process.logToDebugFile(process.stdinLogFile, "STDIN", m)

			// Write to Claude's stdin
			if _, err := fmt.Fprintln(process.stdin, string(m)); err != nil {
				slog.Error("Failed to write to Claude stdin",
					"correlation_id", process.correlationID,
					"error", err,
					"action", "stdin_write_failed",
				)
				return
			}

			slog.Debug("Sent message to Claude",
				"correlation_id", process.correlationID,
				"message_count", messageCount,
				"message", string(m),
				"action", "stdin_message_sent",
			)

		case <-process.ctx.Done():
			slog.Debug("Context cancelled, stopping stdin handler",
				"correlation_id", process.correlationID,
				"messages_sent", messageCount,
				"action", "stdin_handler_cancelled",
			)
			return
		}
	}
}

func (s *Service) SendMessage(process *Process, text string) error {
	message := Input{
		Type: "user",
		Message: InputMessage{
			Role: "user",
			Content: []InputMessageContent{
				{
					Type: "text",
					Text: text,
				},
			},
		},
	}

	select {
	case process.inputChan <- message:
		return nil
	case <-time.After(5 * time.Second):
		return fmt.Errorf("timeout sending message")
	case <-process.ctx.Done():
		return fmt.Errorf("session cancelled")
	}
}

func (s *Service) ReceiveMessages(process *Process) <-chan Message {
	return process.outputChan
}

func (s *Service) StopSession(sessionID string) {
	startTime := time.Now()

	slog.Info("Stopping Claude session",
		"session_id", sessionID,
		"action", "session_stop_start",
	)

	s.mu.Lock()
	process, exists := s.sessions[sessionID]
	if exists {
		delete(s.sessions, sessionID)
	}
	s.mu.Unlock()

	if exists {
		correlationID := process.correlationID
		sessionUptime := time.Since(process.startTime)

		slog.Info("Found active session to stop",
			"correlation_id", correlationID,
			"session_id", sessionID,
			"session_uptime_ms", sessionUptime.Milliseconds(),
			"action", "session_found_for_stop",
		)

		// Clean up process
		slog.Debug("Cleaning up Claude process",
			"correlation_id", correlationID,
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

		// Close channels to signal goroutines to stop
		if process.inputChan != nil {
			close(process.inputChan)
		}
		if process.errorChan != nil {
			close(process.errorChan)
		}
		// Note: outputChan and initComplete are closed by the handleStdout goroutine

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
					"session_id", sessionID,
					"error", err,
					"action", "process_wait_error",
				)
			} else {
				slog.Debug("Claude process exited cleanly",
					"correlation_id", correlationID,
					"session_id", sessionID,
					"action", "process_exited_clean",
				)
			}
		}

		totalStopDuration := time.Since(startTime)
		slog.Info("Claude session stopped successfully",
			"correlation_id", correlationID,
			"session_id", sessionID,
			"session_uptime_ms", sessionUptime.Milliseconds(),
			"stop_duration_ms", totalStopDuration.Milliseconds(),
			"action", "session_stopped",
		)
	} else {
		slog.Warn("Attempted to stop non-existent session",
			"session_id", sessionID,
			"action", "session_not_found_for_stop",
		)
	}
}

// NewClaudeService creates a new database-integrated Claude service
func NewClaudeService(d deps.Deps) *ClaudeService {
	config := Config{
		Debug:    d.Config.ClaudeDebug,
		DebugDir: "/tmp/claude-sessions",
		Tools:    []string{"Read", "Write", "Bash"},
	}

	service := NewService(config)
	gitService := NewGitService()

	return &ClaudeService{
		service:    service,
		gitService: gitService,
		db:         d.DB,
		config:     config,
		debug:      config.Debug,
	}
}

// GetDB returns the database instance for external access
func (cs *ClaudeService) GetDB() *gorm.DB {
	return cs.db
}

// CreateSessionWithPersistence creates a new Claude session and persists it to database
func (cs *ClaudeService) CreateSessionWithPersistence(threadTS, channelID, userID, workingDir string) (*Process, *SessionInfo, error) {
	return cs.CreateSessionWithPersistenceAndConfig(threadTS, channelID, userID, workingDir, "")
}

// CreateSessionWithPersistenceAndConfig creates a new Claude session with specified CLAUDE.md configuration
func (cs *ClaudeService) CreateSessionWithPersistenceAndConfig(threadTS, channelID, userID, workingDir, configID string) (*Process, *SessionInfo, error) {
	// Create session ID first
	sessionID := uuid.New().String()
	
	// Create session-specific directory structure
	sessionDir := filepath.Join("./data", "session", sessionID)
	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		return nil, nil, fmt.Errorf("failed to create session directory: %w", err)
	}
	
	// Create CLAUDE.md in session directory from configuration
	sessionClaudemd := filepath.Join(sessionDir, "CLAUDE.md")
	if err := cs.createClaudeMDFromConfig(sessionClaudemd, configID); err != nil {
		slog.Warn("Failed to create CLAUDE.md in session directory",
			"session_id", sessionID,
			"config_id", configID,
			"error", err)
		// Continue without CLAUDE.md - not critical
	}
	
	// Prepare directories - use session directory as primary, include upload directory for this thread
	uploadDir := filepath.Join("./data", "slack-uploads", threadTS)
	dirs := []string{sessionDir, uploadDir}
	
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		slog.Warn("Failed to create upload directory, Claude won't have access to uploaded files",
			"upload_dir", uploadDir,
			"error", err,
			"thread_ts", threadTS)
		// Continue without upload directory, but keep session directory as primary
		dirs = []string{sessionDir}
	}

	// Create the Claude process using the underlying service with multiple directories
	process, err := cs.service.CreateSessionWithMultipleDirs(dirs)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create Claude process: %w", err)
	}

	// Create session info
	sessionInfo := &SessionInfo{
		SessionID:     sessionID,
		ThreadTS:      threadTS,
		UserID:        userID,
		ChannelID:     channelID,
		WorkingDir:    sessionDir,
		LastActivity:  time.Now(),
		Active:        true,
		ProcessExists: true,
	}

	// Persist session to database
	dbSession := &models.ClaudeSession{
		Model: models.Model{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		SessionID: sessionID,
		UserID:    userID,
		Title:     fmt.Sprintf("Slack Thread %s", threadTS),
		Messages:  models.JSONField[interface{}]{Data: []interface{}{}},
		Metadata: models.MakeJSONField(map[string]interface{}{
			"thread_ts":      threadTS,
			"channel_id":     channelID,
			"working_dir":    sessionDir,
			"session_dir":    sessionDir,
			"upload_dir":     uploadDir,
			"created_via":    "slack_bot",
			"last_activity":  time.Now().Format(time.RFC3339),
			"active":         true,
		}),
	}

	if err := cs.db.Create(dbSession).Error; err != nil {
		// If database persistence fails, we still return the process but log the error
		slog.Error("Failed to persist Claude session to database",
			"session_id", process.sessionID,
			"thread_ts", threadTS,
			"error", err)
	} else {
		if cs.debug {
			slog.Debug("Claude session persisted to database",
				"session_id", process.sessionID,
				"thread_ts", threadTS,
				"user_id", userID)
		}
	}

	return process, sessionInfo, nil
}

// ResumeSession attempts to resume an existing Claude session using --resume
func (cs *ClaudeService) ResumeSession(sessionID, userID string) (*Process, error) {
	if cs.debug {
		slog.Debug("Attempting to resume Claude session",
			"session_id", sessionID,
			"user_id", userID)
	}

	// First check if session exists and belongs to user
	var dbSession models.ClaudeSession
	err := cs.db.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&dbSession).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("session not found for user")
		}
		return nil, fmt.Errorf("failed to query session: %w", err)
	}

	// Extract session directory and upload directory from metadata
	sessionDir := ""
	uploadDir := ""
	if dbSession.Metadata != nil {
		metadata := dbSession.Metadata.Data
		// Try session_dir first, fallback to working_dir for old sessions
		if sd, exists := metadata["session_dir"]; exists {
			if sdStr, ok := sd.(string); ok {
				sessionDir = sdStr
			}
		} else if wd, exists := metadata["working_dir"]; exists {
			if wdStr, ok := wd.(string); ok {
				sessionDir = wdStr
			}
		}
		
		// Check for upload_dir in metadata, or fall back to upload_directory
		if ud, exists := metadata["upload_dir"]; exists {
			if udStr, ok := ud.(string); ok {
				uploadDir = udStr
			}
		} else if ud, exists := metadata["upload_directory"]; exists {
			if udStr, ok := ud.(string); ok {
				uploadDir = udStr
			}
		}
	}

	// Create Claude process with --resume argument, including upload directory if available
	dirs := []string{sessionDir}
	if uploadDir != "" {
		dirs = append(dirs, uploadDir)
		if cs.debug {
			slog.Debug("Including upload directory in resumed session",
				"session_id", sessionID,
				"upload_dir", uploadDir)
		}
	}
	
	process, err := cs.createResumedProcessWithDirs(sessionID, dirs)
	if err != nil {
		return nil, fmt.Errorf("failed to resume Claude process: %w", err)
	}

	// Update session metadata to mark as resumed
	if dbSession.Metadata != nil {
		metadata := dbSession.Metadata.Data
		metadata["resumed_at"] = time.Now().Format(time.RFC3339)
		metadata["last_activity"] = time.Now().Format(time.RFC3339)
	}

	if err := cs.db.Save(&dbSession).Error; err != nil {
		slog.Error("Failed to update resumed session metadata", "error", err)
	}

	if cs.debug {
		slog.Debug("Claude session resumed successfully",
			"session_id", sessionID,
			"user_id", userID,
			"session_dir", sessionDir)
	}

	return process, nil
}

// createResumedProcess creates a Claude process with --resume argument (single directory)
func (cs *ClaudeService) createResumedProcess(sessionID, workingDir string) (*Process, error) {
	return cs.createResumedProcessWithDirs(sessionID, []string{workingDir})
}

// createResumedProcessWithDirs creates a Claude process with --resume argument (multiple directories)
func (cs *ClaudeService) createResumedProcessWithDirs(sessionID string, dirs []string) (*Process, error) {
	startTime := time.Now()
	correlationID := uuid.New().String()

	slog.Info("Resuming Claude CLI session",
		"session_id", sessionID,
		"correlation_id", correlationID,
		"debug_mode", cs.config.Debug,
		"directories", dirs,
		"action", "claude_process_resume",
	)

	// Create debug directory if debug mode is enabled
	debugDir, err := cs.service.createDebugDirectory(correlationID)
	if err != nil {
		slog.Error("Failed to create debug directory for resumed session",
			"correlation_id", correlationID,
			"session_id", sessionID,
			"error", err)
		return nil, fmt.Errorf("failed to create debug directory: %w", err)
	}

	// Open debug files if debug mode is enabled
	stdinLogFile, stdoutLogFile, stderrLogFile, err := cs.service.openDebugFiles(debugDir)
	if err != nil {
		slog.Error("Failed to open debug files for resumed session",
			"correlation_id", correlationID,
			"session_id", sessionID,
			"error", err)
		return nil, fmt.Errorf("failed to open debug files: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())

	// Build arguments with --resume
	args := []string{
		"--print",
		"--input-format", "stream-json",
		"--output-format", "stream-json",
		"--verbose",
		"--allowedTools", strings.Join(cs.config.Tools, ","),
		"--resume", sessionID, // Key argument for resumption
	}

	// Add all directories that are not empty
	for _, dir := range dirs {
		if dir != "" {
			args = append(args, "--add-dir", dir)
		}
	}

	if cs.debug {
		slog.Debug("Claude CLI resume command prepared",
			"correlation_id", correlationID,
			"session_id", sessionID,
			"command", "claude",
			"args", strings.Join(args, " "),
			"action", "claude_resume_cmd_prepared",
		)
	}

	cmd := exec.CommandContext(ctx, "claude", args...)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to create stdin pipe: %w", err)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to create stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("failed to start resumed claude process: %w", err)
	}

	process := &Process{
		sessionID:     sessionID, // Use the existing session ID
		cmd:           cmd,
		stdin:         stdin,
		stdout:        stdout,
		stderr:        stderr,
		stdoutScanner: bufio.NewScanner(stdout),
		stderrScanner: bufio.NewScanner(stderr),
		ctx:           ctx,
		cancel:        cancel,
		startTime:     startTime,
		correlationID: correlationID,
		debugDir:      debugDir,
		stdinLogFile:  stdinLogFile,
		stdoutLogFile: stdoutLogFile,
		stderrLogFile: stderrLogFile,
		isHealthy:     true,
		lastHeartbeat: time.Now(),
		inputChan:     make(chan Input, 10),
		outputChan:    make(chan Message, 10),
		initComplete:  make(chan bool, 1),
		errorChan:     make(chan Message, 10),
	}

	// Start monitoring and handlers
	go cs.service.monitorStderr(process)
	go cs.service.handleStdout(process)
	go cs.service.handleStdin(process)

	// For resumed sessions, we don't send an initial message
	// The session should already be initialized
	select {
	case <-process.initComplete:
		slog.Info("Resumed Claude session initialized",
			"correlation_id", correlationID,
			"session_id", sessionID,
			"action", "resumed_session_ready")
	case <-time.After(10 * time.Second):
		cancel()
		process.closeDebugFiles()
		return nil, fmt.Errorf("timeout waiting for resumed Claude session initialization")
	case <-ctx.Done():
		process.closeDebugFiles()
		return nil, fmt.Errorf("context cancelled during resumed session initialization")
	}

	// Add to active sessions
	cs.service.mu.Lock()
	cs.service.sessions[sessionID] = process
	cs.service.mu.Unlock()

	slog.Info("Claude session resumed successfully",
		"correlation_id", correlationID,
		"session_id", sessionID,
		"total_duration_ms", time.Since(startTime).Milliseconds(),
		"action", "session_resumed")

	return process, nil
}

// GetSessionInfo retrieves session information from database
func (cs *ClaudeService) GetSessionInfo(threadTS, userID string) (*SessionInfo, error) {
	var dbSessions []models.ClaudeSession
	err := cs.db.Where("user_id = ?", userID).Find(&dbSessions).Error
	if err != nil {
		return nil, fmt.Errorf("failed to query sessions by user: %w", err)
	}

	// Find session with matching thread_ts in metadata
	var dbSession *models.ClaudeSession
	for _, session := range dbSessions {
		if session.Metadata != nil {
			metadata := session.Metadata.Data
			if ts, exists := metadata["thread_ts"]; exists {
				if tsStr, ok := ts.(string); ok && tsStr == threadTS {
					dbSession = &session
					break
				}
			}
		}
	}

	if dbSession == nil {
		return nil, nil // No session found
	}

	// Extract metadata
	var threadTSFromDB, channelID, workingDir string
	var lastActivity time.Time
	var active bool

	if dbSession.Metadata != nil {
		metadata := dbSession.Metadata.Data
		if ts, exists := metadata["thread_ts"]; exists {
			if tsStr, ok := ts.(string); ok {
				threadTSFromDB = tsStr
			}
		}
		if ch, exists := metadata["channel_id"]; exists {
			if chStr, ok := ch.(string); ok {
				channelID = chStr
			}
		}
		if wd, exists := metadata["working_dir"]; exists {
			if wdStr, ok := wd.(string); ok {
				workingDir = wdStr
			}
		}
		if act, exists := metadata["active"]; exists {
			if actBool, ok := act.(bool); ok {
				active = actBool
			}
		}
		if lastAct, exists := metadata["last_activity"]; exists {
			if lastActStr, ok := lastAct.(string); ok {
				if parsed, err := time.Parse(time.RFC3339, lastActStr); err == nil {
					lastActivity = parsed
				}
			}
		}
	}

	// Check if process exists in memory
	cs.service.mu.RLock()
	_, processExists := cs.service.sessions[dbSession.SessionID]
	cs.service.mu.RUnlock()

	return &SessionInfo{
		SessionID:     dbSession.SessionID,
		ThreadTS:      threadTSFromDB,
		UserID:        userID,
		ChannelID:     channelID,
		WorkingDir:    workingDir,
		LastActivity:  lastActivity,
		Active:        active,
		ProcessExists: processExists,
	}, nil
}

// UpdateSessionActivity updates the last activity time for a session
func (cs *ClaudeService) UpdateSessionActivity(sessionID string) error {
	var dbSession models.ClaudeSession
	err := cs.db.Where("session_id = ?", sessionID).First(&dbSession).Error
	if err != nil {
		return fmt.Errorf("failed to find session: %w", err)
	}

	// Update metadata
	if dbSession.Metadata != nil {
		metadata := dbSession.Metadata.Data
		metadata["last_activity"] = time.Now().Format(time.RFC3339)
	}

	return cs.db.Save(&dbSession).Error
}

// DeactivateSession marks a session as inactive in the database
func (cs *ClaudeService) DeactivateSession(sessionID string) error {
	var dbSession models.ClaudeSession
	err := cs.db.Where("session_id = ?", sessionID).First(&dbSession).Error
	if err != nil {
		return fmt.Errorf("failed to find session: %w", err)
	}

	// Update metadata
	if dbSession.Metadata != nil {
		metadata := dbSession.Metadata.Data
		metadata["active"] = false
		metadata["deactivated_at"] = time.Now().Format(time.RFC3339)
	}

	return cs.db.Save(&dbSession).Error
}

// copyFile copies a file from src to dst
func (cs *ClaudeService) copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}

// SendMessage sends a message to a Claude process
func (cs *ClaudeService) SendMessage(process *Process, text string) error {
	return cs.service.SendMessage(process, text)
}

// ReceiveMessages returns the output channel for a Claude process
func (cs *ClaudeService) ReceiveMessages(process *Process) <-chan Message {
	return cs.service.ReceiveMessages(process)
}

// StopSession stops a Claude session and marks it as inactive
func (cs *ClaudeService) StopSession(sessionID string) {
	// Stop the underlying process
	cs.service.StopSession(sessionID)

	// Mark session as inactive in database
	if err := cs.DeactivateSession(sessionID); err != nil {
		slog.Error("Failed to deactivate session in database",
			"session_id", sessionID,
			"error", err)
	}
}

// CreateGitSessionWithPersistence creates a new Claude session with git repository integration
func (cs *ClaudeService) CreateGitSessionWithPersistence(threadTS, channelID, userID, repoPath, baseBranch string) (*Process, *SessionInfo, *GitSessionInfo, error) {
	return cs.CreateGitSessionWithPersistenceAndConfig(threadTS, channelID, userID, repoPath, baseBranch, "")
}

func (cs *ClaudeService) CreateGitSessionWithPersistenceAndConfig(threadTS, channelID, userID, repoPath, baseBranch, configID string) (*Process, *SessionInfo, *GitSessionInfo, error) {
	// Validate repository path
	if repoPath == "" {
		return nil, nil, nil, fmt.Errorf("repository path is required")
	}

	if err := cs.gitService.ValidateRepository(repoPath); err != nil {
		return nil, nil, nil, fmt.Errorf("invalid repository: %w", err)
	}

	// Use default branch if not specified
	if baseBranch == "" {
		baseBranch = "main"
	}

	// Create session ID first
	sessionID := uuid.New().String()
	
	// Generate unique branch name for this session
	branchName := fmt.Sprintf("claude-session-%s", sessionID[:8])
	
	// Create git worktree
	worktreePath, err := cs.gitService.CreateWorktree(repoPath, branchName, baseBranch)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to create git worktree: %w", err)
	}

	// Create CLAUDE.md in worktree directory from configuration
	sessionClaudemd := filepath.Join(worktreePath, "CLAUDE.md")
	if err := cs.createClaudeMDFromConfig(sessionClaudemd, configID); err != nil {
		slog.Warn("Failed to create CLAUDE.md in worktree directory",
			"session_id", sessionID,
			"config_id", configID,
			"error", err)
		// Continue without CLAUDE.md - not critical
	}
	
	// Prepare directories - use worktree as primary, include upload directory for this thread
	uploadDir := filepath.Join("./data", "slack-uploads", threadTS)
	dirs := []string{worktreePath, uploadDir}
	
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		slog.Warn("Failed to create upload directory, Claude won't have access to uploaded files",
			"upload_dir", uploadDir,
			"error", err,
			"thread_ts", threadTS)
		// Continue without upload directory, but keep worktree as primary
		dirs = []string{worktreePath}
	}

	// Create the Claude process using the underlying service with multiple directories
	process, err := cs.service.CreateSessionWithMultipleDirs(dirs)
	if err != nil {
		// Clean up worktree if process creation fails
		cs.gitService.RemoveWorktree(repoPath, worktreePath)
		return nil, nil, nil, fmt.Errorf("failed to create Claude process: %w", err)
	}

	// Create session info
	sessionInfo := &SessionInfo{
		SessionID:     sessionID,
		ThreadTS:      threadTS,
		UserID:        userID,
		ChannelID:     channelID,
		WorkingDir:    worktreePath,
		LastActivity:  time.Now(),
		Active:        true,
		ProcessExists: true,
	}

	// Create git session info
	gitSessionInfo := &GitSessionInfo{
		RepositoryPath: repoPath,
		WorktreePath:   worktreePath,
		BranchName:     branchName,
		BaseBranch:     baseBranch,
		HasChanges:     false,
	}

	// Persist session to database
	dbSession := &models.ClaudeSession{
		Model: models.Model{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		SessionID: sessionID,
		UserID:    userID,
		Title:     fmt.Sprintf("Git Session %s", threadTS),
		Messages:  models.JSONField[interface{}]{Data: []interface{}{}},
		Metadata: models.MakeJSONField(map[string]interface{}{
			"thread_ts":       threadTS,
			"channel_id":      channelID,
			"working_dir":     worktreePath,
			"session_dir":     worktreePath,
			"upload_dir":      uploadDir,
			"created_via":     "git_session",
			"last_activity":   time.Now().Format(time.RFC3339),
			"active":          true,
			"git_enabled":     true,
			"repository_path": repoPath,
			"worktree_path":   worktreePath,
			"branch_name":     branchName,
			"base_branch":     baseBranch,
		}),
	}

	if err := cs.db.Create(dbSession).Error; err != nil {
		// If database persistence fails, we still return the process but log the error
		slog.Error("Failed to persist Claude git session to database",
			"session_id", process.sessionID,
			"thread_ts", threadTS,
			"error", err)
	} else {
		if cs.debug {
			slog.Debug("Claude git session persisted to database",
				"session_id", process.sessionID,
				"thread_ts", threadTS,
				"user_id", userID,
				"worktree_path", worktreePath)
		}
	}

	return process, sessionInfo, gitSessionInfo, nil
}

// GetSessionDiff returns the git diff for a Claude session
func (cs *ClaudeService) GetSessionDiff(sessionID, userID string) (string, error) {
	// Get session from database
	var dbSession models.ClaudeSession
	err := cs.db.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&dbSession).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", fmt.Errorf("session not found")
		}
		return "", fmt.Errorf("failed to query session: %w", err)
	}

	// Check if session has git enabled
	if dbSession.Metadata == nil {
		return "", fmt.Errorf("session has no metadata")
	}

	metadata := dbSession.Metadata.Data
	gitEnabled, exists := metadata["git_enabled"]
	if !exists || !gitEnabled.(bool) {
		return "", fmt.Errorf("session is not git-enabled")
	}

	// Get worktree path
	worktreePath, exists := metadata["worktree_path"]
	if !exists {
		return "", fmt.Errorf("session has no worktree path")
	}

	worktreePathStr, ok := worktreePath.(string)
	if !ok {
		return "", fmt.Errorf("invalid worktree path in session metadata")
	}

	// Get diff from base branch
	baseBranch, exists := metadata["base_branch"]
	if !exists {
		baseBranch = "main"
	}

	baseBranchStr, ok := baseBranch.(string)
	if !ok {
		baseBranchStr = "main"
	}

	return cs.gitService.GetDiffFromBaseBranch(worktreePathStr, baseBranchStr)
}

// CommitSessionChanges commits changes in a Claude session's git worktree
func (cs *ClaudeService) CommitSessionChanges(sessionID, userID, commitMessage string) (string, error) {
	// Get session from database
	var dbSession models.ClaudeSession
	err := cs.db.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&dbSession).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", fmt.Errorf("session not found")
		}
		return "", fmt.Errorf("failed to query session: %w", err)
	}

	// Check if session has git enabled
	if dbSession.Metadata == nil {
		return "", fmt.Errorf("session has no metadata")
	}

	metadata := dbSession.Metadata.Data
	gitEnabled, exists := metadata["git_enabled"]
	if !exists || !gitEnabled.(bool) {
		return "", fmt.Errorf("session is not git-enabled")
	}

	// Get worktree path
	worktreePath, exists := metadata["worktree_path"]
	if !exists {
		return "", fmt.Errorf("session has no worktree path")
	}

	worktreePathStr, ok := worktreePath.(string)
	if !ok {
		return "", fmt.Errorf("invalid worktree path in session metadata")
	}

	// Commit changes
	commitHash, err := cs.gitService.CommitChanges(worktreePathStr, commitMessage)
	if err != nil {
		return "", fmt.Errorf("failed to commit changes: %w", err)
	}

	// Update session metadata with commit hash
	metadata["last_commit_hash"] = commitHash
	metadata["last_commit_time"] = time.Now().Format(time.RFC3339)

	if err := cs.db.Save(&dbSession).Error; err != nil {
		slog.Error("Failed to update session metadata with commit hash", "error", err)
	}

	return commitHash, nil
}

// GetSessionGitStatus returns the git status for a Claude session
func (cs *ClaudeService) GetSessionGitStatus(sessionID, userID string) (*RepositoryStatus, error) {
	// Get session from database
	var dbSession models.ClaudeSession
	err := cs.db.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&dbSession).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("session not found")
		}
		return nil, fmt.Errorf("failed to query session: %w", err)
	}

	// Check if session has git enabled
	if dbSession.Metadata == nil {
		return nil, fmt.Errorf("session has no metadata")
	}

	metadata := dbSession.Metadata.Data
	gitEnabled, exists := metadata["git_enabled"]
	if !exists || !gitEnabled.(bool) {
		return nil, fmt.Errorf("session is not git-enabled")
	}

	// Get worktree path
	worktreePath, exists := metadata["worktree_path"]
	if !exists {
		return nil, fmt.Errorf("session has no worktree path")
	}

	worktreePathStr, ok := worktreePath.(string)
	if !ok {
		return nil, fmt.Errorf("invalid worktree path in session metadata")
	}

	return cs.gitService.GetRepositoryStatus(worktreePathStr)
}

// CleanupSessionWorktree removes the git worktree for a Claude session
func (cs *ClaudeService) CleanupSessionWorktree(sessionID, userID string) error {
	// Get session from database
	var dbSession models.ClaudeSession
	err := cs.db.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&dbSession).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("session not found")
		}
		return fmt.Errorf("failed to query session: %w", err)
	}

	// Check if session has git enabled
	if dbSession.Metadata == nil {
		return fmt.Errorf("session has no metadata")
	}

	metadata := dbSession.Metadata.Data
	gitEnabled, exists := metadata["git_enabled"]
	if !exists || !gitEnabled.(bool) {
		return fmt.Errorf("session is not git-enabled")
	}

	// Get paths
	worktreePath, exists := metadata["worktree_path"]
	if !exists {
		return fmt.Errorf("session has no worktree path")
	}

	repositoryPath, exists := metadata["repository_path"]
	if !exists {
		return fmt.Errorf("session has no repository path")
	}

	worktreePathStr, ok := worktreePath.(string)
	if !ok {
		return fmt.Errorf("invalid worktree path in session metadata")
	}

	repositoryPathStr, ok := repositoryPath.(string)
	if !ok {
		return fmt.Errorf("invalid repository path in session metadata")
	}

	// Remove worktree
	return cs.gitService.RemoveWorktree(repositoryPathStr, worktreePathStr)
}

// InitializeClaudeMDConfigs initializes default CLAUDE.md configurations
func (cs *ClaudeService) InitializeClaudeMDConfigs() error {
	// Auto-migrate the ClaudeMDConfig table
	if err := cs.db.AutoMigrate(&ClaudeMDConfig{}); err != nil {
		return fmt.Errorf("failed to migrate ClaudeMDConfig table: %w", err)
	}

	// Check if configurations already exist
	var count int64
	if err := cs.db.Model(&ClaudeMDConfig{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to count existing configurations: %w", err)
	}

	if count > 0 {
		return nil // Configurations already exist
	}

	// Load default configurations from files
	configsDir := filepath.Join(".", "data", "claude-configs")
	configFiles := []struct {
		filename    string
		name        string
		description string
		isDefault   bool
	}{
		{"default.md", "Default", "Default CLAUDE.md configuration", true},
		{"web-development.md", "Web Development", "Configuration for web development projects", false},
		{"go-backend.md", "Go Backend", "Configuration for Go backend development", false},
		{"react-frontend.md", "React Frontend", "Configuration for React frontend development", false},
	}

	for _, configFile := range configFiles {
		filePath := filepath.Join(configsDir, configFile.filename)
		content, err := os.ReadFile(filePath)
		if err != nil {
			slog.Warn("Failed to read configuration file", "path", filePath, "error", err)
			continue
		}

		config := &ClaudeMDConfig{
			ID:          uuid.NewString(),
			Name:        configFile.name,
			Description: configFile.description,
			Content:     string(content),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			IsDefault:   configFile.isDefault,
		}

		if err := cs.db.Create(config).Error; err != nil {
			slog.Error("Failed to create configuration", "name", configFile.name, "error", err)
			continue
		}

		slog.Info("Created CLAUDE.md configuration", "name", configFile.name)
	}

	return nil
}

// ListClaudeMDConfigs returns all available CLAUDE.md configurations
func (cs *ClaudeService) ListClaudeMDConfigs() (*ClaudeMDConfigListResponse, error) {
	var configs []ClaudeMDConfig
	
	if err := cs.db.Order("is_default DESC, name ASC").Find(&configs).Error; err != nil {
		return nil, fmt.Errorf("failed to list configurations: %w", err)
	}

	return &ClaudeMDConfigListResponse{
		Configs: configs,
		Total:   len(configs),
	}, nil
}

// GetClaudeMDConfig returns a specific CLAUDE.md configuration by ID
func (cs *ClaudeService) GetClaudeMDConfig(id string) (*ClaudeMDConfig, error) {
	var config ClaudeMDConfig
	
	if err := cs.db.Where("id = ?", id).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("configuration not found")
		}
		return nil, fmt.Errorf("failed to get configuration: %w", err)
	}

	return &config, nil
}

// GetClaudeMDConfigByName returns a specific CLAUDE.md configuration by name
func (cs *ClaudeService) GetClaudeMDConfigByName(name string) (*ClaudeMDConfig, error) {
	var config ClaudeMDConfig
	
	if err := cs.db.Where("name = ?", name).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("configuration not found")
		}
		return nil, fmt.Errorf("failed to get configuration: %w", err)
	}

	return &config, nil
}

// CreateClaudeMDConfig creates a new CLAUDE.md configuration
func (cs *ClaudeService) CreateClaudeMDConfig(req *ClaudeMDCreateRequest) (*ClaudeMDConfig, error) {
	config := &ClaudeMDConfig{
		ID:          uuid.NewString(),
		Name:        req.Name,
		Description: req.Description,
		Content:     req.Content,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		IsDefault:   false,
	}

	if err := cs.db.Create(config).Error; err != nil {
		return nil, fmt.Errorf("failed to create configuration: %w", err)
	}

	return config, nil
}

// UpdateClaudeMDConfig updates an existing CLAUDE.md configuration
func (cs *ClaudeService) UpdateClaudeMDConfig(id string, req *ClaudeMDUpdateRequest) (*ClaudeMDConfig, error) {
	var config ClaudeMDConfig
	
	if err := cs.db.Where("id = ?", id).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("configuration not found")
		}
		return nil, fmt.Errorf("failed to get configuration: %w", err)
	}

	// Update fields if provided
	if req.Name != nil {
		config.Name = *req.Name
	}
	if req.Description != nil {
		config.Description = *req.Description
	}
	if req.Content != nil {
		config.Content = *req.Content
	}
	config.UpdatedAt = time.Now()

	if err := cs.db.Save(&config).Error; err != nil {
		return nil, fmt.Errorf("failed to update configuration: %w", err)
	}

	return &config, nil
}

// DeleteClaudeMDConfig deletes a CLAUDE.md configuration
func (cs *ClaudeService) DeleteClaudeMDConfig(id string) error {
	var config ClaudeMDConfig
	
	if err := cs.db.Where("id = ?", id).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("configuration not found")
		}
		return fmt.Errorf("failed to get configuration: %w", err)
	}

	// Prevent deletion of default configuration
	if config.IsDefault {
		return fmt.Errorf("cannot delete default configuration")
	}

	if err := cs.db.Delete(&config).Error; err != nil {
		return fmt.Errorf("failed to delete configuration: %w", err)
	}

	return nil
}

// GetClaudeMDConfigContent returns the content of a CLAUDE.md configuration
func (cs *ClaudeService) GetClaudeMDConfigContent(configName string) (string, error) {
	if configName == "" {
		configName = "Default"
	}

	config, err := cs.GetClaudeMDConfigByName(configName)
	if err != nil {
		// Fallback to default if specified config doesn't exist
		if configName != "Default" {
			config, err = cs.GetClaudeMDConfigByName("Default")
			if err != nil {
				return "", fmt.Errorf("failed to get default configuration: %w", err)
			}
		} else {
			return "", err
		}
	}

	return config.Content, nil
}

// createClaudeMDFromConfig creates a CLAUDE.md file from a configuration
func (cs *ClaudeService) createClaudeMDFromConfig(filePath, configID string) error {
	var content string
	var err error

	if configID == "" {
		// Use default configuration
		content, err = cs.GetClaudeMDConfigContent("Default")
	} else {
		// Get config by ID
		config, err := cs.GetClaudeMDConfig(configID)
		if err != nil {
			// Fallback to default if specified config doesn't exist
			content, err = cs.GetClaudeMDConfigContent("Default")
			if err != nil {
				return fmt.Errorf("failed to get fallback configuration: %w", err)
			}
		} else {
			content = config.Content
		}
	}

	if err != nil {
		return fmt.Errorf("failed to get configuration content: %w", err)
	}

	// Create the file with the configuration content
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write CLAUDE.md file: %w", err)
	}

	return nil
}