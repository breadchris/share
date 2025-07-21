package claude

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/breadchris/flow/deps"
	"github.com/breadchris/flow/models"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

// WSMessage represents a WebSocket message
type WSMessage struct {
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload"`
	Timestamp int64           `json:"timestamp"`
}

// ClaudeMessage represents a message from Claude CLI
type ClaudeMessage struct {
	Type      string          `json:"type"`
	Subtype   string          `json:"subtype,omitempty"`
	Message   json.RawMessage `json:"message,omitempty"`
	SessionID string          `json:"session_id,omitempty"`
	ParentID  string          `json:"parent_tool_use_id,omitempty"`
	Result    string          `json:"result,omitempty"`
	IsError   bool            `json:"is_error,omitempty"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now
	},
}

// NewHTTP creates a new HTTP handler for Claude WebSocket connections
func NewHTTP(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	claudeService := NewClaudeService(d)

	// WebSocket endpoint
	mux.HandleFunc("/claude/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(claudeService, w, r)
	})

	// Sessions endpoint
	mux.HandleFunc("/claude/sessions", func(w http.ResponseWriter, r *http.Request) {
		handleSessions(claudeService, w, r)
	})

	// Specific session endpoint
	mux.HandleFunc("/claude/sessions/", func(w http.ResponseWriter, r *http.Request) {
		// Check if this is a git operation request
		if strings.Contains(r.URL.Path, "/diff") || strings.Contains(r.URL.Path, "/commit") || strings.Contains(r.URL.Path, "/status") || strings.Contains(r.URL.Path, "/cleanup") {
			handleGitOperations(claudeService, w, r)
		} else {
			handleSession(claudeService, w, r)
		}
	})

	// Git-related endpoints
	mux.HandleFunc("/claude/git/sessions", func(w http.ResponseWriter, r *http.Request) {
		handleGitSession(claudeService, w, r)
	})

	// CLAUDE.md configuration endpoints
	mux.HandleFunc("/claude/configs", func(w http.ResponseWriter, r *http.Request) {
		handleClaudeMDConfigs(claudeService, w, r)
	})

	// Initialize CLAUDE.md configurations
	if err := claudeService.InitializeClaudeMDConfigs(); err != nil {
		slog.Error("Failed to initialize CLAUDE.md configurations", "error", err)
	}

	return mux
}

// handleWebSocket handles WebSocket connections for Claude
func handleWebSocket(cs *ClaudeService, w http.ResponseWriter, r *http.Request) {
	// TODO: Implement proper session-based authentication
	// For now, we'll use a simple user ID from query parameter
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		// Try to get user from session or other auth mechanism
		// For now, use a default user ID
		userID = "default-user"
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade WebSocket connection", "error", err)
		return
	}

	// Handle the WebSocket connection
	cs.HandleWebSocket(conn, userID)
}

// handleSessions handles requests for user sessions
func handleSessions(cs *ClaudeService, w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Get user ID from session/auth
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = "default-user"
	}

	sessions, err := cs.GetSessions(userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get sessions: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}

// handleSession handles requests for specific sessions
func handleSession(cs *ClaudeService, w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Get user ID from session/auth
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = "default-user"
	}

	// Extract session ID from path
	sessionID := r.URL.Path[len("/claude/sessions/"):]
	if sessionID == "" {
		http.Error(w, "Session ID required", http.StatusBadRequest)
		return
	}

	session, err := cs.GetSession(sessionID, userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get session: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(session)
}

// HandleWebSocket handles WebSocket connections for Claude sessions
func (cs *ClaudeService) HandleWebSocket(conn *websocket.Conn, userID string) {
	defer conn.Close()

	slog.Info("New Claude WebSocket connection", "user_id", userID)

	var activeProcess *Process
	var sessionID string

	// Send initial connection message
	initialMsg := WSMessage{
		Type:      "connection",
		Payload:   json.RawMessage(`{"status": "connected"}`),
		Timestamp: time.Now().UnixMilli(),
	}
	if err := conn.WriteJSON(initialMsg); err != nil {
		slog.Error("Failed to send initial WebSocket message", "error", err)
		return
	}

	// Handle incoming messages
	for {
		var wsMsg WSMessage
		if err := conn.ReadJSON(&wsMsg); err != nil {
			slog.Error("Failed to read WebSocket message", "error", err)
			break
		}

		switch wsMsg.Type {
		case "start":
			// Start a new Claude session
			var startData struct {
				ConfigID string `json:"config_id"`
			}
			if err := json.Unmarshal(wsMsg.Payload, &startData); err != nil {
				// Continue with empty config if payload is invalid
				slog.Warn("Invalid start payload, using default config", "error", err)
			}

			process, sessionInfo, err := cs.CreateSessionWithPersistenceAndConfig("", "", userID, "", startData.ConfigID)
			if err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(fmt.Sprintf(`{"error": "Failed to create session: %v"}`, err)),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			activeProcess = process
			sessionID = sessionInfo.SessionID

			// Send system init message
			initMsg := WSMessage{
				Type: "message",
				Payload: json.RawMessage(fmt.Sprintf(`{
					"type": "system",
					"subtype": "init",
					"session_id": "%s",
					"message": "Claude session initialized"
				}`, sessionID)),
				Timestamp: time.Now().UnixMilli(),
			}
			conn.WriteJSON(initMsg)

			// Start listening for Claude messages
			go cs.forwardClaudeMessages(conn, process)

		case "start_git":
			// Start a new git-enabled Claude session
			var gitStartData struct {
				ThreadTS       string `json:"thread_ts"`
				ChannelID      string `json:"channel_id"`
				RepositoryPath string `json:"repository_path"`
				BaseBranch     string `json:"base_branch"`
				ConfigID       string `json:"config_id"`
			}
			if err := json.Unmarshal(wsMsg.Payload, &gitStartData); err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "Invalid git start data"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			if gitStartData.RepositoryPath == "" {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "repository_path is required"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			process, sessionInfo, gitSessionInfo, err := cs.CreateGitSessionWithPersistenceAndConfig(
				gitStartData.ThreadTS,
				gitStartData.ChannelID,
				userID,
				gitStartData.RepositoryPath,
				gitStartData.BaseBranch,
				gitStartData.ConfigID,
			)
			if err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(fmt.Sprintf(`{"error": "Failed to create git session: %v"}`, err)),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			activeProcess = process
			sessionID = sessionInfo.SessionID

			// Send git init message
			gitInitBytes, _ := json.Marshal(map[string]interface{}{
				"type":             "system",
				"subtype":          "git_init",
				"session_id":       sessionID,
				"message":          "Git-enabled Claude session initialized",
				"git_session_info": gitSessionInfo,
			})
			initMsg := WSMessage{
				Type:      "message",
				Payload:   json.RawMessage(gitInitBytes),
				Timestamp: time.Now().UnixMilli(),
			}
			conn.WriteJSON(initMsg)

			// Start listening for Claude messages
			go cs.forwardClaudeMessages(conn, process)

		case "resume":
			// Resume an existing Claude session
			var resumeData struct {
				SessionID string `json:"sessionId"`
			}
			if err := json.Unmarshal(wsMsg.Payload, &resumeData); err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "Invalid resume data"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			process, err := cs.ResumeSession(resumeData.SessionID, userID)
			if err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(fmt.Sprintf(`{"error": "Failed to resume session: %v"}`, err)),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			activeProcess = process
			sessionID = resumeData.SessionID

			// Send resume confirmation
			resumeMsg := WSMessage{
				Type: "message",
				Payload: json.RawMessage(fmt.Sprintf(`{
					"type": "system",
					"subtype": "init",
					"session_id": "%s",
					"message": "Claude session resumed"
				}`, sessionID)),
				Timestamp: time.Now().UnixMilli(),
			}
			conn.WriteJSON(resumeMsg)

			// Start listening for Claude messages
			go cs.forwardClaudeMessages(conn, process)

		case "prompt":
			// Send a prompt to Claude
			if activeProcess == nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "No active session"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			var promptData struct {
				Prompt    string `json:"prompt"`
				SessionID string `json:"sessionId"`
			}
			if err := json.Unmarshal(wsMsg.Payload, &promptData); err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "Invalid prompt data"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			if err := cs.SendMessage(activeProcess, promptData.Prompt); err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(fmt.Sprintf(`{"error": "Failed to send message: %v"}`, err)),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

		case "stop":
			// Stop the active session
			if activeProcess != nil && sessionID != "" {
				cs.StopSession(sessionID)
				activeProcess = nil
				sessionID = ""
			}

			stopMsg := WSMessage{
				Type:      "message",
				Payload:   json.RawMessage(`{"type": "system", "subtype": "stop", "message": "Session stopped"}`),
				Timestamp: time.Now().UnixMilli(),
			}
			conn.WriteJSON(stopMsg)

		case "git_diff":
			// Get git diff for the current session
			if sessionID == "" {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "No active session"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			diff, err := cs.GetSessionDiff(sessionID, userID)
			if err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(fmt.Sprintf(`{"error": "Failed to get diff: %v"}`, err)),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			diffBytes, _ := json.Marshal(map[string]interface{}{
				"type":       "git_diff",
				"session_id": sessionID,
				"diff":       diff,
			})
			diffMsg := WSMessage{
				Type:      "message",
				Payload:   json.RawMessage(diffBytes),
				Timestamp: time.Now().UnixMilli(),
			}
			conn.WriteJSON(diffMsg)

		case "git_commit":
			// Commit changes for the current session
			if sessionID == "" {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "No active session"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			var commitData struct {
				Message string `json:"message"`
			}
			if err := json.Unmarshal(wsMsg.Payload, &commitData); err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "Invalid commit data"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			if commitData.Message == "" {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "Commit message is required"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			commitHash, err := cs.CommitSessionChanges(sessionID, userID, commitData.Message)
			if err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(fmt.Sprintf(`{"error": "Failed to commit changes: %v"}`, err)),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			commitBytes, _ := json.Marshal(map[string]interface{}{
				"type":        "git_commit",
				"session_id":  sessionID,
				"commit_hash": commitHash,
				"message":     commitData.Message,
				"status":      "committed",
			})
			commitMsg := WSMessage{
				Type:      "message",
				Payload:   json.RawMessage(commitBytes),
				Timestamp: time.Now().UnixMilli(),
			}
			conn.WriteJSON(commitMsg)

		case "git_status":
			// Get git status for the current session
			if sessionID == "" {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(`{"error": "No active session"}`),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			status, err := cs.GetSessionGitStatus(sessionID, userID)
			if err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Payload:   json.RawMessage(fmt.Sprintf(`{"error": "Failed to get status: %v"}`, err)),
					Timestamp: time.Now().UnixMilli(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			statusBytes, _ := json.Marshal(map[string]interface{}{
				"type":       "git_status",
				"session_id": sessionID,
				"status":     status,
			})
			statusMsg := WSMessage{
				Type:      "message",
				Payload:   json.RawMessage(statusBytes),
				Timestamp: time.Now().UnixMilli(),
			}
			conn.WriteJSON(statusMsg)

		default:
			slog.Warn("Unknown WebSocket message type", "type", wsMsg.Type)
		}
	}

	// Cleanup on disconnect
	if activeProcess != nil && sessionID != "" {
		cs.StopSession(sessionID)
	}
}

// forwardClaudeMessages forwards messages from Claude process to WebSocket
func (cs *ClaudeService) forwardClaudeMessages(conn *websocket.Conn, process *Process) {
	messageChan := cs.ReceiveMessages(process)

	for message := range messageChan {
		// Convert Claude message to WebSocket message
		claudeMsg := ClaudeMessage{
			Type:      message.Type,
			Subtype:   message.Subtype,
			Message:   message.Message,
			SessionID: message.SessionID,
			ParentID:  message.ParentID,
			Result:    message.Result,
			IsError:   message.IsError,
		}

		msgBytes, err := json.Marshal(claudeMsg)
		if err != nil {
			slog.Error("Failed to marshal Claude message", "error", err)
			continue
		}

		wsMsg := WSMessage{
			Type:      "message",
			Payload:   msgBytes,
			Timestamp: time.Now().UnixMilli(),
		}

		if err := conn.WriteJSON(wsMsg); err != nil {
			slog.Error("Failed to send WebSocket message", "error", err)
			break
		}
	}
}

// GetSessions returns all sessions for a user
func (cs *ClaudeService) GetSessions(userID string) ([]models.ClaudeSession, error) {
	var sessions []models.ClaudeSession
	err := cs.db.Where("user_id = ?", userID).Find(&sessions).Error
	return sessions, err
}

// GetSession returns a specific session for a user
func (cs *ClaudeService) GetSession(sessionID, userID string) (*models.ClaudeSession, error) {
	var session models.ClaudeSession
	err := cs.db.Where("session_id = ? AND user_id = ?", sessionID, userID).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// handleGitSession handles requests to create git-enabled Claude sessions
func handleGitSession(cs *ClaudeService, w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Get user ID from session/auth
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = "default-user"
	}

	var req struct {
		ThreadTS       string `json:"thread_ts"`
		ChannelID      string `json:"channel_id"`
		RepositoryPath string `json:"repository_path"`
		BaseBranch     string `json:"base_branch"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if req.RepositoryPath == "" {
		http.Error(w, "repository_path is required", http.StatusBadRequest)
		return
	}

	// Create git session
	process, sessionInfo, gitSessionInfo, err := cs.CreateGitSessionWithPersistence(
		req.ThreadTS,
		req.ChannelID,
		userID,
		req.RepositoryPath,
		req.BaseBranch,
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create git session: %v", err), http.StatusInternalServerError)
		return
	}

	// Prepare response
	response := map[string]interface{}{
		"session_id":       process.sessionID,
		"session_info":     sessionInfo,
		"git_session_info": gitSessionInfo,
		"status":           "created",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleGitOperations handles git operations for existing sessions
func handleGitOperations(cs *ClaudeService, w http.ResponseWriter, r *http.Request) {
	// TODO: Get user ID from session/auth
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = "default-user"
	}

	// Extract session ID from path
	pathParts := strings.Split(strings.TrimPrefix(r.URL.Path, "/claude/sessions/"), "/")
	if len(pathParts) < 2 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	sessionID := pathParts[0]
	operation := pathParts[1]

	switch operation {
	case "diff":
		handleGetDiff(cs, w, r, sessionID, userID)
	case "commit":
		handleCommit(cs, w, r, sessionID, userID)
	case "status":
		handleGetStatus(cs, w, r, sessionID, userID)
	case "cleanup":
		handleCleanup(cs, w, r, sessionID, userID)
	default:
		http.Error(w, "Unknown operation", http.StatusBadRequest)
	}
}

// handleGetDiff handles requests to get git diff for a session
func handleGetDiff(cs *ClaudeService, w http.ResponseWriter, r *http.Request, sessionID, userID string) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	diff, err := cs.GetSessionDiff(sessionID, userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get diff: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"session_id": sessionID,
		"diff":       diff,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleCommit handles requests to commit changes in a session
func handleCommit(cs *ClaudeService, w http.ResponseWriter, r *http.Request, sessionID, userID string) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Message string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if req.Message == "" {
		http.Error(w, "commit message is required", http.StatusBadRequest)
		return
	}

	commitHash, err := cs.CommitSessionChanges(sessionID, userID, req.Message)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to commit changes: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"session_id":  sessionID,
		"commit_hash": commitHash,
		"message":     req.Message,
		"status":      "committed",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleGetStatus handles requests to get git status for a session
func handleGetStatus(cs *ClaudeService, w http.ResponseWriter, r *http.Request, sessionID, userID string) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	status, err := cs.GetSessionGitStatus(sessionID, userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get status: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"session_id": sessionID,
		"status":     status,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleCleanup handles requests to cleanup git worktree for a session
func handleCleanup(cs *ClaudeService, w http.ResponseWriter, r *http.Request, sessionID, userID string) {
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := cs.CleanupSessionWorktree(sessionID, userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to cleanup worktree: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"session_id": sessionID,
		"status":     "cleaned_up",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleClaudeMDConfigs handles CRUD operations for CLAUDE.md configurations
func handleClaudeMDConfigs(cs *ClaudeService, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case "GET":
		// List all configurations
		response, err := cs.ListClaudeMDConfigs()
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to list configurations: %v", err), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(response)

	case "POST":
		// Create new configuration
		var req ClaudeMDCreateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
			return
		}

		if req.Name == "" {
			http.Error(w, "name is required", http.StatusBadRequest)
			return
		}

		if req.Content == "" {
			http.Error(w, "content is required", http.StatusBadRequest)
			return
		}

		config, err := cs.CreateClaudeMDConfig(&req)
		if err != nil {
			if strings.Contains(err.Error(), "UNIQUE constraint failed") {
				http.Error(w, fmt.Sprintf("Configuration with name '%s' already exists", req.Name), http.StatusConflict)
				return
			}
			http.Error(w, fmt.Sprintf("Failed to create configuration: %v", err), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(config)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleClaudeMDConfig handles operations on specific CLAUDE.md configurations
func handleClaudeMDConfig(cs *ClaudeService, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Extract config ID from path
	pathPrefix := "/claude/configs/"
	if !strings.HasPrefix(r.URL.Path, pathPrefix) {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	configID := strings.TrimPrefix(r.URL.Path, pathPrefix)
	if configID == "" {
		http.Error(w, "Configuration ID required", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case "GET":
		// Get specific configuration
		config, err := cs.GetClaudeMDConfig(configID)
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				http.Error(w, "Configuration not found", http.StatusNotFound)
				return
			}
			http.Error(w, fmt.Sprintf("Failed to get configuration: %v", err), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(config)

	case "PUT":
		// Update configuration
		var req ClaudeMDUpdateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
			return
		}

		config, err := cs.UpdateClaudeMDConfig(configID, &req)
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				http.Error(w, "Configuration not found", http.StatusNotFound)
				return
			}
			if strings.Contains(err.Error(), "UNIQUE constraint failed") {
				http.Error(w, fmt.Sprintf("Configuration with name '%s' already exists", *req.Name), http.StatusConflict)
				return
			}
			http.Error(w, fmt.Sprintf("Failed to update configuration: %v", err), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(config)

	case "DELETE":
		// Delete configuration
		err := cs.DeleteClaudeMDConfig(configID)
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				http.Error(w, "Configuration not found", http.StatusNotFound)
				return
			}
			if strings.Contains(err.Error(), "cannot delete default configuration") {
				http.Error(w, "Cannot delete default configuration", http.StatusForbidden)
				return
			}
			http.Error(w, fmt.Sprintf("Failed to delete configuration: %v", err), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
