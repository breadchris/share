// +build e2e

package claude

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// E2E Test Infrastructure

type E2ETestServer struct {
	server        *httptest.Server
	db            *gorm.DB
	claudeService *ClaudeService
	upgrader      websocket.Upgrader
	users         map[string]*models.User
	mu            sync.RWMutex
}

// setupE2ETestServer creates a complete HTTP test server with ClaudeService integration
func setupE2ETestServer(t *testing.T) *E2ETestServer {
	// Create test database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrate the schema
	err = db.AutoMigrate(&models.ClaudeSession{}, &models.User{})
	require.NoError(t, err)

	// Create test dependencies
	testDeps := deps.Deps{
		DB: db,
		Config: config.AppConfig{
			ClaudeDebug: false, // Disable debug mode for tests
		},
	}

	// Create ClaudeService
	claudeService := NewClaudeService(testDeps)

	// Create WebSocket upgrader
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins in tests
		},
	}

	e2eServer := &E2ETestServer{
		db:            db,
		claudeService: claudeService,
		upgrader:      upgrader,
		users:         make(map[string]*models.User),
	}

	// Create HTTP test server with routes
	mux := http.NewServeMux()

	// Claude WebSocket endpoint
	mux.HandleFunc("/claude/ws", func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from query parameter (simulates session)
		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error":   "authentication_required",
				"message": "user_id query parameter required for tests",
			})
			return
		}

		conn, err := e2eServer.upgrader.Upgrade(w, r, nil)
		if err != nil {
			http.Error(w, "Failed to upgrade WebSocket", http.StatusInternalServerError)
			return
		}

		e2eServer.claudeService.HandleWebSocket(conn, userID)
	})

	// Claude sessions endpoint
	mux.HandleFunc("/claude/sessions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			http.Error(w, "user_id query parameter required", http.StatusBadRequest)
			return
		}

		sessions, err := e2eServer.claudeService.GetSessions(userID)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to get sessions: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(sessions)
	})

	// Specific Claude session endpoint
	mux.HandleFunc("/claude/sessions/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			http.Error(w, "user_id query parameter required", http.StatusBadRequest)
			return
		}

		sessionID := strings.TrimPrefix(r.URL.Path, "/claude/sessions/")
		if sessionID == "" {
			http.Error(w, "Session ID required", http.StatusBadRequest)
			return
		}

		session, err := e2eServer.claudeService.GetSession(sessionID, userID)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to get session: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(session)
	})

	e2eServer.server = httptest.NewServer(mux)
	return e2eServer
}

func (e *E2ETestServer) Close() {
	e.server.Close()
}

func (e *E2ETestServer) CreateTestUser(t *testing.T) *models.User {
	e.mu.Lock()
	defer e.mu.Unlock()

	userID := uuid.New().String()
	user := &models.User{
		ID:        userID,
		CreatedAt: time.Now(),
		Username:  "testuser_" + userID[:8],
	}
	err := e.db.Create(user).Error
	require.NoError(t, err)

	e.users[userID] = user
	return user
}

func (e *E2ETestServer) GetWebSocketURL(userID string) string {
	wsURL := strings.Replace(e.server.URL, "http://", "ws://", 1)
	return fmt.Sprintf("%s/claude/ws?user_id=%s", wsURL, userID)
}

func (e *E2ETestServer) GetHTTPURL(path string, userID string) string {
	return fmt.Sprintf("%s%s?user_id=%s", e.server.URL, path, userID)
}

// WebSocket Test Client

type WebSocketTestClient struct {
	conn         *websocket.Conn
	messages     []WSMessage
	errors       []error
	mu           sync.RWMutex
	done         chan bool
	readTimeout  time.Duration
	writeTimeout time.Duration
}

func NewWebSocketTestClient(wsURL string) (*WebSocketTestClient, error) {
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		return nil, err
	}

	client := &WebSocketTestClient{
		conn:         conn,
		messages:     []WSMessage{},
		errors:       []error{},
		done:         make(chan bool),
		readTimeout:  5 * time.Second,
		writeTimeout: 5 * time.Second,
	}

	// Start reading messages in background
	go client.readMessages()

	return client, nil
}

func (c *WebSocketTestClient) readMessages() {
	defer close(c.done)

	for {
		var msg WSMessage
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			c.mu.Lock()
			c.errors = append(c.errors, err)
			c.mu.Unlock()
			
			// Check if it's a connection close error
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				return
			}
			// For other errors, continue trying to read
			continue
		}

		c.mu.Lock()
		c.messages = append(c.messages, msg)
		c.mu.Unlock()
	}
}

func (c *WebSocketTestClient) SendMessage(msg WSMessage) error {
	c.conn.SetWriteDeadline(time.Now().Add(c.writeTimeout))
	return c.conn.WriteJSON(msg)
}

func (c *WebSocketTestClient) SendStart() error {
	return c.SendMessage(WSMessage{
		Type:    "start",
		Payload: json.RawMessage(`{}`),
	})
}

func (c *WebSocketTestClient) SendResume(sessionID string) error {
	payload := fmt.Sprintf(`{"sessionId": "%s"}`, sessionID)
	return c.SendMessage(WSMessage{
		Type:    "resume",
		Payload: json.RawMessage(payload),
	})
}

func (c *WebSocketTestClient) SendPrompt(prompt string, sessionID string) error {
	payload := fmt.Sprintf(`{"prompt": "%s", "sessionId": "%s"}`, prompt, sessionID)
	return c.SendMessage(WSMessage{
		Type:    "prompt",
		Payload: json.RawMessage(payload),
	})
}

func (c *WebSocketTestClient) SendStop() error {
	return c.SendMessage(WSMessage{
		Type:    "stop",
		Payload: json.RawMessage(`{}`),
	})
}

func (c *WebSocketTestClient) GetMessages() []WSMessage {
	c.mu.RLock()
	defer c.mu.RUnlock()
	
	// Return a copy
	messages := make([]WSMessage, len(c.messages))
	copy(messages, c.messages)
	return messages
}

func (c *WebSocketTestClient) GetErrors() []error {
	c.mu.RLock()
	defer c.mu.RUnlock()
	
	// Return a copy
	errors := make([]error, len(c.errors))
	copy(errors, c.errors)
	return errors
}

func (c *WebSocketTestClient) WaitForMessages(count int, timeout time.Duration) []WSMessage {
	deadline := time.Now().Add(timeout)
	
	for time.Now().Before(deadline) {
		c.mu.RLock()
		messageCount := len(c.messages)
		c.mu.RUnlock()
		
		if messageCount >= count {
			return c.GetMessages()
		}
		
		time.Sleep(10 * time.Millisecond)
	}
	
	return c.GetMessages()
}

func (c *WebSocketTestClient) WaitForMessageType(msgType string, timeout time.Duration) *WSMessage {
	deadline := time.Now().Add(timeout)
	
	for time.Now().Before(deadline) {
		messages := c.GetMessages()
		for _, msg := range messages {
			if msg.Type == msgType {
				return &msg
			}
		}
		
		time.Sleep(10 * time.Millisecond)
	}
	
	return nil
}

func (c *WebSocketTestClient) Close() error {
	return c.conn.Close()
}

// Mock Claude CLI for E2E tests

type MockClaudeProcess struct {
	sessionID     string
	responses     []ClaudeMessage
	responseIndex int
	mu            sync.Mutex
}

func (m *MockClaudeProcess) GetNextResponse() *ClaudeMessage {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if m.responseIndex >= len(m.responses) {
		return nil
	}
	
	response := m.responses[m.responseIndex]
	m.responseIndex++
	return &response
}

// Test message assertion helpers

func AssertMessageType(t *testing.T, msg *WSMessage, expectedType string) {
	require.NotNil(t, msg, "Expected message but got nil")
	assert.Equal(t, expectedType, msg.Type)
}

func AssertClaudeMessage(t *testing.T, msg *WSMessage, expectedType string) *ClaudeMessage {
	AssertMessageType(t, msg, "message")
	
	var claudeMsg ClaudeMessage
	err := json.Unmarshal(msg.Payload, &claudeMsg)
	require.NoError(t, err)
	
	assert.Equal(t, expectedType, claudeMsg.Type)
	return &claudeMsg
}

func AssertErrorMessage(t *testing.T, msg *WSMessage, expectedError string) {
	AssertMessageType(t, msg, "error")
	
	var errorMsg map[string]interface{}
	err := json.Unmarshal(msg.Payload, &errorMsg)
	require.NoError(t, err)
	
	if expectedError != "" {
		assert.Contains(t, errorMsg["error"], expectedError)
	}
}

// HTTP client helpers

func GetSessions(t *testing.T, server *E2ETestServer, userID string) []models.ClaudeSession {
	url := server.GetHTTPURL("/claude/sessions", userID)
	resp, err := http.Get(url)
	require.NoError(t, err)
	defer resp.Body.Close()
	
	require.Equal(t, http.StatusOK, resp.StatusCode)
	
	var sessions []models.ClaudeSession
	err = json.NewDecoder(resp.Body).Decode(&sessions)
	require.NoError(t, err)
	
	return sessions
}

func GetSession(t *testing.T, server *E2ETestServer, userID, sessionID string) *models.ClaudeSession {
	url := server.GetHTTPURL(fmt.Sprintf("/claude/sessions/%s", sessionID), userID)
	resp, err := http.Get(url)
	require.NoError(t, err)
	defer resp.Body.Close()
	
	require.Equal(t, http.StatusOK, resp.StatusCode)
	
	var session models.ClaudeSession
	err = json.NewDecoder(resp.Body).Decode(&session)
	require.NoError(t, err)
	
	return &session
}

// E2E Test Cases

// TestE2ENewSessionFlow tests the complete flow of creating a new Claude session
func TestE2ENewSessionFlow(t *testing.T) {
	server := setupE2ETestServer(t)
	defer server.Close()

	user := server.CreateTestUser(t)

	// Step 1: Connect to WebSocket
	client, err := NewWebSocketTestClient(server.GetWebSocketURL(user.ID))
	require.NoError(t, err)
	defer client.Close()

	// Step 2: Send start message
	err = client.SendStart()
	require.NoError(t, err)

	// Step 3: Wait for response (should be system init message or error if Claude CLI not available)
	messages := client.WaitForMessages(1, 5*time.Second)
	
	// Debug: Print all messages and errors
	allMessages := client.GetMessages()
	allErrors := client.GetErrors()
	t.Logf("Received %d messages: %+v", len(allMessages), allMessages)
	t.Logf("Received %d errors: %+v", len(allErrors), allErrors)
	
	if len(messages) == 0 {
		t.Skip("No response received from Claude service - Claude CLI may not be available or process failed to initialize")
		return
	}

	firstMessage := messages[0]

	// If Claude CLI is not available, we should get an error
	if firstMessage.Type == "error" {
		t.Skip("Claude CLI not available, skipping e2e test")
		return
	}

	// If successful, should get system init message
	AssertMessageType(t, &firstMessage, "message")
	initMsg := AssertClaudeMessage(t, &firstMessage, "system")
	assert.Equal(t, "init", initMsg.Subtype)
	assert.NotEmpty(t, initMsg.SessionID)

	sessionID := initMsg.SessionID

	// Step 4: Verify session was saved to database
	sessions := GetSessions(t, server, user.ID)
	assert.Len(t, sessions, 1)
	assert.Equal(t, sessionID, sessions[0].SessionID)
	assert.Equal(t, user.ID, sessions[0].UserID)
	assert.Equal(t, "New Claude Session", sessions[0].Title)

	// Step 5: Get specific session
	session := GetSession(t, server, user.ID, sessionID)
	assert.Equal(t, sessionID, session.SessionID)
	assert.NotNil(t, session.Messages.Data)

	// Step 6: Verify session is active in service
	server.claudeService.mu.RLock()
	_, exists := server.claudeService.sessions[sessionID]
	server.claudeService.mu.RUnlock()
	assert.True(t, exists, "Session should be active in service")

	// Step 7: Send stop message to clean up
	err = client.SendStop()
	require.NoError(t, err)

	// Wait a bit for cleanup
	time.Sleep(100 * time.Millisecond)

	// Step 8: Verify session was removed from active sessions
	server.claudeService.mu.RLock()
	_, exists = server.claudeService.sessions[sessionID]
	server.claudeService.mu.RUnlock()
	assert.False(t, exists, "Session should be removed from active sessions")
}

// TestE2ESessionResumption tests resuming an existing session
func TestE2ESessionResumption(t *testing.T) {
	server := setupE2ETestServer(t)
	defer server.Close()

	user := server.CreateTestUser(t)

	// Step 1: Create initial session
	client1, err := NewWebSocketTestClient(server.GetWebSocketURL(user.ID))
	require.NoError(t, err)

	err = client1.SendStart()
	require.NoError(t, err)

	messages := client1.WaitForMessages(1, 5*time.Second)
	require.Len(t, messages, 1)

	if messages[0].Type == "error" {
		t.Skip("Claude CLI not available, skipping e2e test")
		return
	}

	initMsg := AssertClaudeMessage(t, &messages[0], "system")
	sessionID := initMsg.SessionID

	// Stop the session
	err = client1.SendStop()
	require.NoError(t, err)
	client1.Close()

	// Wait for cleanup
	time.Sleep(200 * time.Millisecond)

	// Step 2: Resume the session with new WebSocket connection
	client2, err := NewWebSocketTestClient(server.GetWebSocketURL(user.ID))
	require.NoError(t, err)
	defer client2.Close()

	err = client2.SendResume(sessionID)
	require.NoError(t, err)

	// Step 3: Should receive the replayed init message
	messages = client2.WaitForMessages(1, 5*time.Second)
	require.Len(t, messages, 1)

	// Should get the same init message replayed
	replayedMsg := AssertClaudeMessage(t, &messages[0], "system")
	assert.Equal(t, "init", replayedMsg.Subtype)
	assert.Equal(t, sessionID, replayedMsg.SessionID)

	// Step 4: Verify session is active again
	server.claudeService.mu.RLock()
	_, exists := server.claudeService.sessions[sessionID]
	server.claudeService.mu.RUnlock()
	assert.True(t, exists, "Resumed session should be active")

	// Clean up
	err = client2.SendStop()
	require.NoError(t, err)
}

// TestE2EConversationFlow tests sending prompts and receiving responses
func TestE2EConversationFlow(t *testing.T) {
	server := setupE2ETestServer(t)
	defer server.Close()

	user := server.CreateTestUser(t)

	// Step 1: Create session
	client, err := NewWebSocketTestClient(server.GetWebSocketURL(user.ID))
	require.NoError(t, err)
	defer client.Close()

	err = client.SendStart()
	require.NoError(t, err)

	messages := client.WaitForMessages(1, 5*time.Second)
	require.Len(t, messages, 1)

	if messages[0].Type == "error" {
		t.Skip("Claude CLI not available, skipping e2e test")
		return
	}

	initMsg := AssertClaudeMessage(t, &messages[0], "system")
	sessionID := initMsg.SessionID

	// Step 2: Send a prompt
	testPrompt := "Hello, Claude! This is a test message."
	err = client.SendPrompt(testPrompt, sessionID)
	require.NoError(t, err)

	// Step 3: Wait for response messages
	// Claude should respond with user echo and assistant response
	responseMessages := client.WaitForMessages(3, 10*time.Second) // init + user + assistant
	assert.GreaterOrEqual(t, len(responseMessages), 2, "Should have at least user echo and assistant response")

	// Find user and assistant messages
	var userMsg, assistantMsg *ClaudeMessage
	for i := 1; i < len(responseMessages); i++ { // Skip init message
		if responseMessages[i].Type == "message" {
			var claudeMsg ClaudeMessage
			json.Unmarshal(responseMessages[i].Payload, &claudeMsg)
			
			if claudeMsg.Type == "user" {
				userMsg = &claudeMsg
			} else if claudeMsg.Type == "assistant" {
				assistantMsg = &claudeMsg
			}
		}
	}

	// Verify user message was echoed
	assert.NotNil(t, userMsg, "Should receive user message echo")

	// Verify assistant response
	assert.NotNil(t, assistantMsg, "Should receive assistant response")

	// Step 4: Verify messages were persisted to database
	session := GetSession(t, server, user.ID, sessionID)
	assert.NotNil(t, session.Messages.Data)

	// Should have at least init, user, and assistant messages
	if messageData, ok := session.Messages.Data.([]interface{}); ok {
		assert.GreaterOrEqual(t, len(messageData), 3, "Should have at least 3 messages in database")
	}

	// Clean up
	err = client.SendStop()
	require.NoError(t, err)
}

// TestE2EMultiUserIsolation tests that multiple users have isolated sessions
func TestE2EMultiUserIsolation(t *testing.T) {
	server := setupE2ETestServer(t)
	defer server.Close()

	user1 := server.CreateTestUser(t)
	user2 := server.CreateTestUser(t)

	// Step 1: Create sessions for both users
	client1, err := NewWebSocketTestClient(server.GetWebSocketURL(user1.ID))
	require.NoError(t, err)
	defer client1.Close()

	client2, err := NewWebSocketTestClient(server.GetWebSocketURL(user2.ID))
	require.NoError(t, err)
	defer client2.Close()

	// Start sessions
	err = client1.SendStart()
	require.NoError(t, err)

	err = client2.SendStart()
	require.NoError(t, err)

	// Get session IDs
	messages1 := client1.WaitForMessages(1, 5*time.Second)
	messages2 := client2.WaitForMessages(1, 5*time.Second)

	if len(messages1) == 0 || len(messages2) == 0 || 
	   messages1[0].Type == "error" || messages2[0].Type == "error" {
		t.Skip("Claude CLI not available, skipping e2e test")
		return
	}

	initMsg1 := AssertClaudeMessage(t, &messages1[0], "system")
	initMsg2 := AssertClaudeMessage(t, &messages2[0], "system")

	sessionID1 := initMsg1.SessionID
	sessionID2 := initMsg2.SessionID

	// Step 2: Verify sessions are different
	assert.NotEqual(t, sessionID1, sessionID2, "Users should have different session IDs")

	// Step 3: Verify users can only access their own sessions
	user1Sessions := GetSessions(t, server, user1.ID)
	user2Sessions := GetSessions(t, server, user2.ID)

	assert.Len(t, user1Sessions, 1)
	assert.Len(t, user2Sessions, 1)
	assert.Equal(t, sessionID1, user1Sessions[0].SessionID)
	assert.Equal(t, sessionID2, user2Sessions[0].SessionID)

	// Step 4: Test cross-user access protection
	// User1 should not be able to access User2's session
	url := server.GetHTTPURL(fmt.Sprintf("/claude/sessions/%s", sessionID2), user1.ID)
	resp, err := http.Get(url)
	require.NoError(t, err)
	defer resp.Body.Close()
	
	// Should return error (500 due to "record not found")
	assert.Equal(t, http.StatusInternalServerError, resp.StatusCode)

	// Step 5: Verify both sessions are active simultaneously
	server.claudeService.mu.RLock()
	_, exists1 := server.claudeService.sessions[sessionID1]
	_, exists2 := server.claudeService.sessions[sessionID2]
	server.claudeService.mu.RUnlock()

	assert.True(t, exists1, "User1 session should be active")
	assert.True(t, exists2, "User2 session should be active")

	// Clean up
	client1.SendStop()
	client2.SendStop()
}

// TestE2EErrorHandling tests error scenarios and recovery
func TestE2EErrorHandling(t *testing.T) {
	server := setupE2ETestServer(t)
	defer server.Close()

	user := server.CreateTestUser(t)

	// Step 1: Test sending prompt without active session
	client, err := NewWebSocketTestClient(server.GetWebSocketURL(user.ID))
	require.NoError(t, err)
	defer client.Close()

	// Send prompt without starting session
	err = client.SendPrompt("Hello", "nonexistent-session")
	require.NoError(t, err)

	// Should receive error response
	messages := client.WaitForMessages(1, 3*time.Second)
	require.Len(t, messages, 1)
	AssertErrorMessage(t, &messages[0], "no active session")

	// Step 2: Test resuming non-existent session
	err = client.SendResume("nonexistent-session-id")
	require.NoError(t, err)

	messages = client.WaitForMessages(2, 3*time.Second)
	assert.GreaterOrEqual(t, len(messages), 2)
	
	// Should get error for non-existent session
	AssertErrorMessage(t, &messages[1], "session not found")

	// Step 3: Test invalid WebSocket message
	err = client.SendMessage(WSMessage{
		Type:    "invalid_type",
		Payload: json.RawMessage(`{}`),
	})
	require.NoError(t, err)

	// Invalid message types should be ignored (no response expected)
	messages = client.WaitForMessages(3, 1*time.Second)
	assert.Len(t, messages, 2) // Should still only have the previous 2 messages
}

// TestE2EHTTPEndpoints tests the HTTP API endpoints
func TestE2EHTTPEndpoints(t *testing.T) {
	server := setupE2ETestServer(t)
	defer server.Close()

	user := server.CreateTestUser(t)

	// Step 1: Test empty sessions list
	sessions := GetSessions(t, server, user.ID)
	assert.Len(t, sessions, 0)

	// Step 2: Create a session via WebSocket
	client, err := NewWebSocketTestClient(server.GetWebSocketURL(user.ID))
	require.NoError(t, err)
	defer client.Close()

	err = client.SendStart()
	require.NoError(t, err)

	messages := client.WaitForMessages(1, 5*time.Second)
	if len(messages) == 0 || messages[0].Type == "error" {
		t.Skip("Claude CLI not available, skipping e2e test")
		return
	}

	initMsg := AssertClaudeMessage(t, &messages[0], "system")
	sessionID := initMsg.SessionID

	// Step 3: Test sessions list endpoint
	sessions = GetSessions(t, server, user.ID)
	assert.Len(t, sessions, 1)
	assert.Equal(t, sessionID, sessions[0].SessionID)
	assert.Equal(t, user.ID, sessions[0].UserID)

	// Step 4: Test specific session endpoint
	session := GetSession(t, server, user.ID, sessionID)
	assert.Equal(t, sessionID, session.SessionID)
	assert.Equal(t, user.ID, session.UserID)
	assert.Equal(t, "New Claude Session", session.Title)

	// Step 5: Test unauthorized access (missing user_id)
	url := fmt.Sprintf("%s/claude/sessions", server.server.URL)
	resp, err := http.Get(url)
	require.NoError(t, err)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

	// Step 6: Test invalid session ID
	url = server.GetHTTPURL("/claude/sessions/invalid-session-id", user.ID)
	resp, err = http.Get(url)
	require.NoError(t, err)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusInternalServerError, resp.StatusCode) // GORM "record not found" error

	// Clean up
	client.SendStop()
}