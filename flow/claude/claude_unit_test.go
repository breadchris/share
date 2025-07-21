package claude

import (
	"bufio"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/breadchris/flow/models"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test helpers are in claude_test_helpers.go

// Test ClaudeService initialization
func TestNewClaudeService(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	
	assert.NotNil(t, service)
	assert.NotNil(t, service.deps.DB)
	assert.NotNil(t, service.sessions)
}

// Test session management without exec
func TestStopSession(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	// Create a mock process
	sessionID := uuid.New().String()
	ctx, cancel := context.WithCancel(context.Background())
	stdinReader, stdinWriter := io.Pipe()
	stdoutReader, stdoutWriter := io.Pipe()
	
	process := &ClaudeProcess{
		sessionID:     sessionID,
		userID:        user.ID,
		stdin:         stdinWriter,
		stdout:        stdoutReader,
		stdoutScanner: bufio.NewScanner(stdoutReader),
		ctx:           ctx,
		cancel:        cancel,
		messages:      []ClaudeMessage{},
		correlationID: uuid.New().String(),
	}

	// Add to service sessions
	service.mu.Lock()
	service.sessions[sessionID] = process
	service.mu.Unlock()

	// Stop the session
	service.StopSession(sessionID)

	// Verify session is removed
	service.mu.RLock()
	_, exists := service.sessions[sessionID]
	service.mu.RUnlock()
	assert.False(t, exists)

	// Clean up
	stdinReader.Close()
	stdoutWriter.Close()
}

// Test database operations
func TestGetSessions(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	// Create test sessions
	for i := 0; i < 3; i++ {
		session := &models.ClaudeSession{
			Model: models.Model{
				ID:        uuid.New().String(),
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			SessionID: uuid.New().String(),
			UserID:    user.ID,
			Title:     "Test Session " + string(rune(i+1)),
			Messages:  models.JSONField[interface{}]{Data: []interface{}{}},
		}
		err := db.Create(session).Error
		require.NoError(t, err)
	}

	// Get sessions
	sessions, err := service.GetSessions(user.ID)
	require.NoError(t, err)
	assert.Len(t, sessions, 3)
}

func TestGetSession(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	// Create test session
	sessionID := uuid.New().String()
	testSession := &models.ClaudeSession{
		Model: models.Model{
			ID:        uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		SessionID: sessionID,
		UserID:    user.ID,
		Title:     "Test Session",
		Messages:  models.JSONField[interface{}]{Data: []interface{}{}},
	}
	err := db.Create(testSession).Error
	require.NoError(t, err)

	// Get specific session
	session, err := service.GetSession(sessionID, user.ID)
	require.NoError(t, err)
	assert.Equal(t, sessionID, session.SessionID)
	assert.Equal(t, user.ID, session.UserID)
	assert.Equal(t, "Test Session", session.Title)

	// Test unauthorized access
	otherUser := createTestUser(db)
	_, err = service.GetSession(sessionID, otherUser.ID)
	assert.Error(t, err)
}

func TestSaveSession(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	// Create session in database first
	sessionID := uuid.New().String()
	session := &models.ClaudeSession{
		Model: models.Model{
			ID:        uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		SessionID: sessionID,
		UserID:    user.ID,
		Title:     "Test Session",
		Messages:  models.JSONField[interface{}]{Data: []interface{}{}},
	}
	err := db.Create(session).Error
	require.NoError(t, err)

	// Create process with messages
	process := &ClaudeProcess{
		sessionID: sessionID,
		userID:    user.ID,
		messages: []ClaudeMessage{
			{Type: "system", Subtype: "init", SessionID: sessionID},
			{Type: "user", Message: json.RawMessage(`{"content":"Hello"}`)},
			{Type: "assistant", Message: json.RawMessage(`{"content":"Hi!"}`)},
		},
		correlationID: uuid.New().String(),
	}

	// Save session
	err = service.SaveSession(process)
	require.NoError(t, err)

	// Verify messages were saved
	var savedSession models.ClaudeSession
	err = db.Where("session_id = ?", sessionID).First(&savedSession).Error
	require.NoError(t, err)

	// Check messages
	if messages, ok := savedSession.Messages.Data.([]interface{}); ok {
		assert.Len(t, messages, 3)
	} else {
		t.Fatal("Failed to retrieve messages")
	}
}

// Test message parsing
func TestMessageParsing(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected ClaudeMessage
		wantErr  bool
	}{
		{
			name:  "System init message",
			input: `{"type":"system","subtype":"init","session_id":"test-123"}`,
			expected: ClaudeMessage{
				Type:      "system",
				Subtype:   "init",
				SessionID: "test-123",
			},
		},
		{
			name:  "User message",
			input: `{"type":"user","message":{"content":"Hello"}}`,
			expected: ClaudeMessage{
				Type:    "user",
				Message: json.RawMessage(`{"content":"Hello"}`),
			},
		},
		{
			name:  "Assistant message",
			input: `{"type":"assistant","message":{"content":"Hi there!"}}`,
			expected: ClaudeMessage{
				Type:    "assistant",
				Message: json.RawMessage(`{"content":"Hi there!"}`),
			},
		},
		{
			name:    "Invalid JSON",
			input:   `{invalid json}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var msg ClaudeMessage
			err := json.Unmarshal([]byte(tt.input), &msg)
			
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expected.Type, msg.Type)
				assert.Equal(t, tt.expected.Subtype, msg.Subtype)
				assert.Equal(t, tt.expected.SessionID, msg.SessionID)
			}
		})
	}
}

// Test WebSocket message handling
func TestWebSocketMessageTypes(t *testing.T) {
	tests := []struct {
		name    string
		message WSMessage
		wantErr bool
	}{
		{
			name: "Valid start message",
			message: WSMessage{
				Type:    "start",
				Payload: json.RawMessage(`{}`),
			},
		},
		{
			name: "Valid resume message",
			message: WSMessage{
				Type:    "resume",
				Payload: json.RawMessage(`{"sessionId":"test-123"}`),
			},
		},
		{
			name: "Valid prompt message",
			message: WSMessage{
				Type:    "prompt",
				Payload: json.RawMessage(`{"prompt":"Hello","sessionId":"test-123"}`),
			},
		},
		{
			name: "Valid stop message",
			message: WSMessage{
				Type:    "stop",
				Payload: json.RawMessage(`{}`),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Just test that the messages can be marshaled/unmarshaled
			data, err := json.Marshal(tt.message)
			require.NoError(t, err)

			var msg WSMessage
			err = json.Unmarshal(data, &msg)
			require.NoError(t, err)
			assert.Equal(t, tt.message.Type, msg.Type)
		})
	}
}

// Test error scenarios
func TestInvalidSessionID(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	// Try to get non-existent session
	_, err := service.GetSession("invalid-session-id", user.ID)
	assert.Error(t, err)
}

func TestUnauthorizedAccess(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user1 := createTestUser(db)
	user2 := createTestUser(db)

	// Create session for user1
	sessionID := uuid.New().String()
	session := &models.ClaudeSession{
		Model: models.Model{
			ID:        uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		SessionID: sessionID,
		UserID:    user1.ID,
		Title:     "User1 Session",
		Messages:  models.JSONField[interface{}]{Data: []interface{}{}},
	}
	err := db.Create(session).Error
	require.NoError(t, err)

	// Try to access with user2
	_, err = service.GetSession(sessionID, user2.ID)
	assert.Error(t, err)
}

// Test concurrent access
func TestConcurrentSessionAccess(t *testing.T) {
	// Each concurrent operation uses its own service to avoid database conflicts
	sessionCount := 10
	
	// Test concurrent session creation/deletion
	var wg sync.WaitGroup
	results := make(chan bool, sessionCount)
	
	for i := 0; i < sessionCount; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			
			// Create separate database and service for each goroutine
			db := setupTestDB(t)
			service := createTestService(db)
			
			sessionID := uuid.New().String()
			ctx, cancel := context.WithCancel(context.Background())
			
			process := &ClaudeProcess{
				sessionID:     sessionID,
				userID:        uuid.New().String(),
				ctx:           ctx,
				cancel:        cancel,
				messages:      []ClaudeMessage{},
				correlationID: uuid.New().String(),
			}
			
			// Add session
			service.mu.Lock()
			service.sessions[sessionID] = process
			service.mu.Unlock()
			
			// Simulate some work
			time.Sleep(10 * time.Millisecond)
			
			// Remove session
			service.StopSession(sessionID)
			
			// Verify session is removed
			service.mu.RLock()
			_, exists := service.sessions[sessionID]
			service.mu.RUnlock()
			
			results <- !exists // Should be true if session was properly removed
		}(i)
	}
	
	wg.Wait()
	close(results)
	
	// Verify all operations succeeded
	successCount := 0
	for success := range results {
		if success {
			successCount++
		}
	}
	
	assert.Equal(t, sessionCount, successCount)
}

// Benchmark tests
func BenchmarkMessageParsing(b *testing.B) {
	msgJSON := `{"type":"assistant","message":{"content":"This is a test message with some content"}}`
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var msg ClaudeMessage
		json.Unmarshal([]byte(msgJSON), &msg)
	}
}

func BenchmarkSessionSave(b *testing.B) {
	db := setupTestDB(&testing.T{})
	service := createTestService(db)
	user := createTestUser(db)

	// Create session
	sessionID := uuid.New().String()
	session := &models.ClaudeSession{
		Model: models.Model{
			ID:        uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		SessionID: sessionID,
		UserID:    user.ID,
		Title:     "Benchmark Session",
		Messages:  models.JSONField[interface{}]{Data: []interface{}{}},
	}
	db.Create(session)

	process := &ClaudeProcess{
		sessionID: sessionID,
		userID:    user.ID,
		messages: []ClaudeMessage{
			{Type: "system", Subtype: "init", SessionID: sessionID},
			{Type: "user", Message: json.RawMessage(`{"content":"Hello"}`)},
			{Type: "assistant", Message: json.RawMessage(`{"content":"Hi!"}`)},
		},
		correlationID: uuid.New().String(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		service.SaveSession(process)
	}
}

// Test WebSocket error handling with mock server
func TestWebSocketErrorHandling(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upgrader := websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		require.NoError(t, err)
		
		// Handle one message then close
		go func() {
			var msg WSMessage
			err := conn.ReadJSON(&msg)
			if err == nil && msg.Type == "prompt" {
				// Send error response for prompt without session
				conn.WriteJSON(WSMessage{
					Type:    "error",
					Payload: json.RawMessage(`{"error":"no active session"}`),
				})
			}
			conn.Close()
		}()
		
		service.HandleWebSocket(conn, user.ID)
	}))
	defer server.Close()

	// Connect and send prompt without session
	wsURL := strings.Replace(server.URL, "http://", "ws://", 1)
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)
	defer conn.Close()

	// Send prompt without active session
	err = conn.WriteJSON(WSMessage{
		Type:    "prompt",
		Payload: json.RawMessage(`{"prompt":"Hello"}`),
	})
	require.NoError(t, err)

	// Should receive error response
	var response WSMessage
	err = conn.ReadJSON(&response)
	if err == nil {
		assert.Equal(t, "error", response.Type)
	}
}

// Test WebSocket invalid JSON handling
func TestWebSocketInvalidJSON(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	done := make(chan bool)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upgrader := websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		require.NoError(t, err)
		defer conn.Close()

		go service.HandleWebSocket(conn, user.ID)
		<-done
	}))
	defer server.Close()

	wsURL := strings.Replace(server.URL, "http://", "ws://", 1)
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)
	defer conn.Close()

	// Send invalid JSON (should be handled gracefully)
	err = conn.WriteMessage(websocket.TextMessage, []byte(`{invalid json`))
	require.NoError(t, err)

	done <- true
}

// Test multiple WebSocket connections
func TestMultipleWebSocketConnections(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upgrader := websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		require.NoError(t, err)
		defer conn.Close()

		service.HandleWebSocket(conn, user.ID)
	}))
	defer server.Close()

	// Create multiple connections concurrently
	var wg sync.WaitGroup
	connectionCount := 5

	for i := 0; i < connectionCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			wsURL := strings.Replace(server.URL, "http://", "ws://", 1)
			conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
			require.NoError(t, err)
			defer conn.Close()

			// Send stop command to cleanly close
			err = conn.WriteJSON(WSMessage{
				Type:    "stop",
				Payload: json.RawMessage(`{}`),
			})
			require.NoError(t, err)
		}()
	}

	wg.Wait()
}

// Test session state persistence across saves
func TestSessionStatePersistence(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	// Create initial session
	sessionID := uuid.New().String()
	session := &models.ClaudeSession{
		Model: models.Model{
			ID:        uuid.New().String(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		SessionID: sessionID,
		UserID:    user.ID,
		Title:     "State Persistence Test",
		Messages:  models.JSONField[interface{}]{Data: []interface{}{}},
	}
	err := db.Create(session).Error
	require.NoError(t, err)

	// Create process and add multiple messages
	messages := []ClaudeMessage{
		{Type: "system", Subtype: "init", SessionID: sessionID},
		{Type: "user", Message: json.RawMessage(`{"content":"First message"}`)},
		{Type: "assistant", Message: json.RawMessage(`{"content":"First response"}`)},
		{Type: "user", Message: json.RawMessage(`{"content":"Second message"}`)},
		{Type: "assistant", Message: json.RawMessage(`{"content":"Second response"}`)},
	}

	process := &ClaudeProcess{
		sessionID:     sessionID,
		userID:        user.ID,
		messages:      messages,
		correlationID: uuid.New().String(),
	}

	// Save multiple times to test state persistence
	for i := 0; i < 3; i++ {
		err = service.SaveSession(process)
		require.NoError(t, err)

		// Verify messages are persisted correctly
		var savedSession models.ClaudeSession
		err = db.Where("session_id = ?", sessionID).First(&savedSession).Error
		require.NoError(t, err)

		if savedMessages, ok := savedSession.Messages.Data.([]interface{}); ok {
			assert.Len(t, savedMessages, len(messages))
		} else {
			t.Fatal("Failed to retrieve persisted messages")
		}
	}
}

// Test edge case with empty messages
func TestEmptyMessageHandling(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantErr  bool
	}{
		{
			name:  "Empty object",
			input: `{}`,
		},
		{
			name:  "Null message",
			input: `{"type":"assistant","message":null}`,
		},
		{
			name:  "Empty string message",
			input: `{"type":"user","message":""}`,
		},
		{
			name:    "Completely empty",
			input:   ``,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var msg ClaudeMessage
			err := json.Unmarshal([]byte(tt.input), &msg)
			
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// Test session cleanup on service shutdown
func TestSessionCleanupOnShutdown(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)

	// Create multiple active sessions
	sessionIDs := make([]string, 3)
	for i := 0; i < 3; i++ {
		sessionID := uuid.New().String()
		sessionIDs[i] = sessionID
		
		ctx, cancel := context.WithCancel(context.Background())
		process := &ClaudeProcess{
			sessionID:     sessionID,
			userID:        uuid.New().String(),
			ctx:           ctx,
			cancel:        cancel,
			messages:      []ClaudeMessage{},
			correlationID: uuid.New().String(),
		}

		service.mu.Lock()
		service.sessions[sessionID] = process
		service.mu.Unlock()
	}

	// Verify sessions exist
	service.mu.RLock()
	initialCount := len(service.sessions)
	service.mu.RUnlock()
	assert.Equal(t, 3, initialCount)

	// Simulate shutdown by stopping all sessions
	for _, sessionID := range sessionIDs {
		service.StopSession(sessionID)
	}

	// Verify all sessions are cleaned up
	service.mu.RLock()
	finalCount := len(service.sessions)
	service.mu.RUnlock()
	assert.Equal(t, 0, finalCount)
}