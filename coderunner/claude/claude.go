package claude

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

type ClaudeService struct {
	db       *gorm.DB
	sessions map[string]*ClaudeProcess
	mu       sync.RWMutex
}

type ClaudeProcess struct {
	sessionID     string
	cmd           *exec.Cmd
	stdin         io.WriteCloser
	stdout        io.ReadCloser
	scanner       *bufio.Scanner
	ctx           context.Context
	cancel        context.CancelFunc
	messages      []ClaudeMessage
	mu            sync.Mutex
	startTime     time.Time
	correlationID string
	userID        string
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

func NewClaudeService(database *gorm.DB) *ClaudeService {
	return &ClaudeService{
		db:       database,
		sessions: make(map[string]*ClaudeProcess),
	}
}

func (cs *ClaudeService) CreateSession(userID string) (*ClaudeProcess, error) {
	startTime := time.Now()
	correlationID := uuid.New().String()
	
	slog.Info("Creating new Claude CLI session",
		"correlation_id", correlationID,
		"user_id", userID,
		"action", "claude_process_start",
	)
	
	ctx, cancel := context.WithCancel(context.Background())
	
	args := []string{
		"--print",
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
		slog.Error("Failed to create Claude stdout pipe",
			"correlation_id", correlationID,
			"user_id", userID,
			"error", err,
			"action", "claude_stdout_failed",
		)
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}
	
	slog.Debug("Starting Claude CLI process",
		"correlation_id", correlationID,
		"user_id", userID,
		"action", "claude_process_starting",
	)
	
	if err := cmd.Start(); err != nil {
		cancel()
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
		scanner:       bufio.NewScanner(stdout),
		ctx:           ctx,
		cancel:        cancel,
		messages:      []ClaudeMessage{},
		startTime:     startTime,
		correlationID: correlationID,
		userID:        userID,
	}
	
	slog.Debug("Reading Claude initialization message",
		"correlation_id", correlationID,
		"user_id", userID,
		"pid", cmd.Process.Pid,
		"action", "claude_init_read",
	)
	
	// Read initial message to get session ID
	if process.scanner.Scan() {
		line := process.scanner.Text()
		
		slog.Debug("Claude initialization message received",
			"correlation_id", correlationID,
			"user_id", userID,
			"pid", cmd.Process.Pid,
			"message_length", len(line),
			"action", "claude_init_received",
		)
		
		var msg ClaudeMessage
		if err := json.Unmarshal([]byte(line), &msg); err == nil {
			if msg.Type == "system" && msg.Subtype == "init" {
				process.sessionID = msg.SessionID
				process.messages = append(process.messages, msg)
				
				slog.Info("Claude session initialized",
					"correlation_id", correlationID,
					"user_id", userID,
					"session_id", msg.SessionID,
					"pid", cmd.Process.Pid,
					"total_duration_ms", time.Since(startTime).Milliseconds(),
					"action", "claude_session_initialized",
				)
				
				// Save session to database
				session := &models.ClaudeSession{
					SessionID: msg.SessionID,
					UserID:    userID,
					Messages:  models.JSONField[interface{}]{Data: process.messages},
					Title:     "New Claude Session",
				}
				if err := cs.db.Create(session).Error; err != nil {
					slog.Error("Failed to save session to database",
						"correlation_id", correlationID,
						"user_id", userID,
						"session_id", msg.SessionID,
						"error", err,
						"action", "session_save_failed",
					)
				} else {
					slog.Debug("Session saved to database",
						"correlation_id", correlationID,
						"user_id", userID,
						"session_id", msg.SessionID,
						"action", "session_saved",
					)
				}
			}
		} else {
			slog.Error("Failed to parse Claude initialization message",
				"correlation_id", correlationID,
				"user_id", userID,
				"pid", cmd.Process.Pid,
				"error", err,
				"raw_message", line,
				"action", "claude_init_parse_failed",
			)
		}
	} else {
		slog.Error("No initialization message received from Claude",
			"correlation_id", correlationID,
			"user_id", userID,
			"pid", cmd.Process.Pid,
			"action", "claude_init_timeout",
		)
	}
	
	cs.mu.Lock()
	cs.sessions[process.sessionID] = process
	cs.mu.Unlock()
	
	return process, nil
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
	if err := cs.db.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err != nil {
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
	
	process := &ClaudeProcess{
		sessionID:     sessionID,
		cmd:           cmd,
		stdin:         stdin,
		stdout:        stdout,
		scanner:       bufio.NewScanner(stdout),
		ctx:           ctx,
		cancel:        cancel,
		messages:      messages,
		startTime:     startTime,
		correlationID: correlationID,
		userID:        userID,
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
	
	for process.scanner.Scan() {
		line := process.scanner.Text()
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		
		messageCount++
		totalBytesProcessed += len(line)
		
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
	
	if err := process.scanner.Err(); err != nil {
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
	err := cs.db.Model(&models.ClaudeSession{}).
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
		
		process.cancel()
		
		if process.stdin != nil {
			process.stdin.Close()
		}
		if process.stdout != nil {
			process.stdout.Close()
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
	err := cs.db.Where("user_id = ?", userID).Order("updated_at DESC").Find(&sessions).Error
	
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
	err := cs.db.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&session).Error
	
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