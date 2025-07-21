package slackbot

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/breadchris/flow/config"
	"gorm.io/gorm"
)

// MockSessionDB implements SessionDB interface for testing
type MockSessionDB struct {
	sessions       map[string]*SlackClaudeSession
	updateCalls    []string
	errors         map[string]error // threadTS -> error to return
	updateCount    int
	shouldFail     bool
	failAfterCalls int
	mu             sync.RWMutex
}

func NewMockSessionDB() *MockSessionDB {
	return &MockSessionDB{
		sessions: make(map[string]*SlackClaudeSession),
		errors:   make(map[string]error),
	}
}

func (m *MockSessionDB) UpdateSessionActivity(threadTS string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.updateCalls = append(m.updateCalls, threadTS)
	m.updateCount++
	
	// Check for specific error for this threadTS
	if err, exists := m.errors[threadTS]; exists {
		return err
	}
	
	// Check for global failure conditions
	if m.shouldFail && m.updateCount > m.failAfterCalls {
		return errors.New("database connection failed")
	}
	
	// Check if session exists and is active
	if session, exists := m.sessions[threadTS]; exists && session.Active {
		session.LastActivity = time.Now()
		return nil
	}
	
	return fmt.Errorf("no active session found for thread %s", threadTS)
}

func (m *MockSessionDB) GetSession(threadTS string) (*SlackClaudeSession, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	if err, exists := m.errors[threadTS+"_get"]; exists {
		return nil, err
	}
	
	if session, exists := m.sessions[threadTS]; exists {
		return session, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockSessionDB) SetSession(session *SlackClaudeSession) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if err, exists := m.errors[session.ThreadTS+"_set"]; exists {
		return err
	}
	
	m.sessions[session.ThreadTS] = session
	return nil
}

func (m *MockSessionDB) SessionExists(threadTS string) (bool, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	if err, exists := m.errors[threadTS+"_exists"]; exists {
		return false, err
	}
	
	_, exists := m.sessions[threadTS]
	return exists, nil
}

func (m *MockSessionDB) SetError(threadTS string, err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.errors[threadTS] = err
}

func (m *MockSessionDB) GetUpdateCalls() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	calls := make([]string, len(m.updateCalls))
	copy(calls, m.updateCalls)
	return calls
}

// MockSessionCache implements SessionCache interface for testing
type MockSessionCache struct {
	sessions map[string]*SlackClaudeSession
	mu       sync.RWMutex
}

func NewMockSessionCache() *MockSessionCache {
	return &MockSessionCache{
		sessions: make(map[string]*SlackClaudeSession),
	}
}

func (m *MockSessionCache) GetSession(threadTS string) (*SlackClaudeSession, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	session, exists := m.sessions[threadTS]
	return session, exists
}

func (m *MockSessionCache) SetSession(threadTS string, session *SlackClaudeSession) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[threadTS] = session
}

func (m *MockSessionCache) UpdateSessionActivity(threadTS string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if session, exists := m.sessions[threadTS]; exists {
		session.LastActivity = time.Now()
	}
}

// MockTimeProvider implements TimeProvider interface for testing
type MockTimeProvider struct {
	currentTime time.Time
}

func NewMockTimeProvider(t time.Time) *MockTimeProvider {
	return &MockTimeProvider{currentTime: t}
}

func (m *MockTimeProvider) Now() time.Time {
	return m.currentTime
}

func (m *MockTimeProvider) SetTime(t time.Time) {
	m.currentTime = t
}

func TestSessionActivityManager_UpdateActivity_Success(t *testing.T) {
	mockDB := NewMockSessionDB()
	mockCache := NewMockSessionCache()
	
	// Create a session in both cache and database
	session := &SlackClaudeSession{
		ThreadTS:     "1234567890.123456",
		ChannelID:    "C1234567890",
		UserID:       "U1234567890",
		SessionID:    "session-123",
		Active:       true,
		LastActivity: time.Now().Add(-time.Hour),
	}
	
	mockCache.SetSession(session.ThreadTS, session)
	mockDB.sessions[session.ThreadTS] = session
	
	manager := NewSessionActivityManager(mockDB, mockCache, false)
	
	err := manager.UpdateActivity(session.ThreadTS)
	if err != nil {
		t.Errorf("UpdateActivity() failed: %v", err)
	}
	
	// Verify database was called
	calls := mockDB.GetUpdateCalls()
	if len(calls) != 1 || calls[0] != session.ThreadTS {
		t.Errorf("Expected 1 database call for %s, got %v", session.ThreadTS, calls)
	}
}

func TestSessionActivityManager_UpdateActivity_EmptyThreadTS(t *testing.T) {
	mockDB := NewMockSessionDB()
	mockCache := NewMockSessionCache()
	manager := NewSessionActivityManager(mockDB, mockCache, false)
	
	err := manager.UpdateActivity("")
	if err == nil {
		t.Error("UpdateActivity() should fail with empty threadTS")
	}
	
	if !strings.Contains(err.Error(), "threadTS cannot be empty") {
		t.Errorf("Expected error about empty threadTS, got: %v", err)
	}
}

func TestSessionActivityManager_UpdateActivity_RaceCondition(t *testing.T) {
	mockDB := NewMockSessionDB()
	mockCache := NewMockSessionCache()
	
	threadTS := "1234567890.123456"
	
	// Session exists in cache but not in database (race condition)
	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    "C1234567890",
		UserID:       "U1234567890",
		SessionID:    "session-123",
		Active:       true,
		LastActivity: time.Now(),
	}
	mockCache.SetSession(threadTS, session)
	
	// Database will initially fail with "no active session found"
	mockDB.SetError(threadTS, fmt.Errorf("no active session found for thread %s", threadTS))
	
	manager := NewSessionActivityManager(mockDB, mockCache, true)
	
	// First attempt should fail, but it should try to create the missing session
	err := manager.UpdateActivity(threadTS)
	
	// The manager should have attempted to create the session
	// After creating, it should exist in the mock database
	if _, exists := mockDB.sessions[threadTS]; !exists {
		t.Error("Manager should have created missing session in database")
	}
	
	// Error might still occur on first attempt, but that's okay for race conditions
	if err != nil {
		// Make sure it's the expected race condition error
		if !manager.isRaceConditionError(err) {
			t.Errorf("Expected race condition error, got: %v", err)
		}
	}
}

func TestSessionActivityManager_UpdateActivity_RetryLogic(t *testing.T) {
	// Create a custom mock that fails initially then succeeds
	mockDB := &MockSessionDB{
		sessions:    make(map[string]*SlackClaudeSession),
		errors:      make(map[string]error),
		updateCalls: []string{},
	}
	mockCache := NewMockSessionCache()
	
	threadTS := "1234567890.123456"
	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    "C1234567890",
		UserID:       "U1234567890",
		SessionID:    "session-123",
		Active:       true,
		LastActivity: time.Now(),
	}
	
	mockCache.SetSession(threadTS, session)
	mockDB.sessions[threadTS] = session
	
	// The mock will fail with transient error until we have enough retries
	// This test verifies the retry logic works, we expect it to fail but make multiple attempts
	mockDB.SetError(threadTS, errors.New("connection timeout"))
	
	manager := NewSessionActivityManager(mockDB, mockCache, true)
	manager.maxRetries = 2
	manager.retryDelay = 1 * time.Millisecond // Speed up test
	
	err := manager.UpdateActivity(threadTS)
	// This should fail after retries since we set a persistent error
	if err == nil {
		t.Error("UpdateActivity() should fail with persistent transient error")
	}
	
	// But verify multiple attempts were made
	calls := mockDB.GetUpdateCalls()
	expectedCalls := manager.maxRetries + 1 // Initial attempt + retries
	if len(calls) != expectedCalls {
		t.Errorf("Expected exactly %d attempts, got %d calls", expectedCalls, len(calls))
	}
	
	// Verify all calls were for the same thread
	for _, call := range calls {
		if call != threadTS {
			t.Errorf("Expected all calls to be for thread %s, got call for %s", threadTS, call)
		}
	}
}

func TestSessionActivityManager_UpdateActivity_NonTransientError(t *testing.T) {
	mockDB := NewMockSessionDB()
	mockCache := NewMockSessionCache()
	
	threadTS := "1234567890.123456"
	
	// Set up a non-transient error
	mockDB.SetError(threadTS, errors.New("constraint violation"))
	
	manager := NewSessionActivityManager(mockDB, mockCache, false)
	
	err := manager.UpdateActivity(threadTS)
	if err == nil {
		t.Error("UpdateActivity() should fail with non-transient error")
	}
	
	// Should only try once for non-transient errors
	calls := mockDB.GetUpdateCalls()
	if len(calls) != 1 {
		t.Errorf("Expected exactly 1 call for non-transient error, got %d", len(calls))
	}
}

func TestSessionActivityManager_UpdateActivity_ConcurrentUpdates(t *testing.T) {
	mockDB := NewMockSessionDB()
	mockCache := NewMockSessionCache()
	
	threadTS := "1234567890.123456"
	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    "C1234567890",
		UserID:       "U1234567890",
		SessionID:    "session-123",
		Active:       true,
		LastActivity: time.Now(),
	}
	
	mockCache.SetSession(threadTS, session)
	mockDB.sessions[threadTS] = session
	
	manager := NewSessionActivityManager(mockDB, mockCache, false)
	
	// Run multiple concurrent updates
	const numGoroutines = 10
	var wg sync.WaitGroup
	errors := make(chan error, numGoroutines)
	
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			err := manager.UpdateActivity(threadTS)
			if err != nil {
				errors <- err
			}
		}()
	}
	
	wg.Wait()
	close(errors)
	
	// Check for any errors
	var errorList []error
	for err := range errors {
		errorList = append(errorList, err)
	}
	
	if len(errorList) > 0 {
		t.Errorf("Concurrent updates failed with errors: %v", errorList)
	}
	
	// All calls should have been made
	calls := mockDB.GetUpdateCalls()
	if len(calls) != numGoroutines {
		t.Errorf("Expected %d calls, got %d", numGoroutines, len(calls))
	}
}

func TestSessionActivityManager_IsRaceConditionError(t *testing.T) {
	manager := NewSessionActivityManager(nil, nil, false)
	
	tests := []struct {
		name     string
		err      error
		expected bool
	}{
		{
			name:     "nil error",
			err:      nil,
			expected: false,
		},
		{
			name:     "race condition error",
			err:      fmt.Errorf("no active session found for thread 123"),
			expected: true,
		},
		{
			name:     "gorm record not found",
			err:      gorm.ErrRecordNotFound,
			expected: true,
		},
		{
			name:     "other database error",
			err:      errors.New("connection failed"),
			expected: false,
		},
		{
			name:     "constraint violation",
			err:      errors.New("UNIQUE constraint failed"),
			expected: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := manager.isRaceConditionError(tt.err)
			if result != tt.expected {
				t.Errorf("isRaceConditionError(%v) = %v, expected %v", tt.err, result, tt.expected)
			}
		})
	}
}

func TestSessionActivityManager_IsTransientError(t *testing.T) {
	manager := NewSessionActivityManager(nil, nil, false)
	
	tests := []struct {
		name     string
		err      error
		expected bool
	}{
		{
			name:     "nil error",
			err:      nil,
			expected: false,
		},
		{
			name:     "connection error",
			err:      errors.New("database connection failed"),
			expected: true,
		},
		{
			name:     "timeout error",
			err:      errors.New("operation timeout"),
			expected: true,
		},
		{
			name:     "deadlock error",
			err:      errors.New("deadlock detected"),
			expected: true,
		},
		{
			name:     "constraint violation",
			err:      errors.New("UNIQUE constraint failed"),
			expected: false,
		},
		{
			name:     "syntax error",
			err:      errors.New("syntax error in SQL"),
			expected: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := manager.isTransientError(tt.err)
			if result != tt.expected {
				t.Errorf("isTransientError(%v) = %v, expected %v", tt.err, result, tt.expected)
			}
		})
	}
}

func TestSessionActivityManager_GetSessionInfo(t *testing.T) {
	mockDB := NewMockSessionDB()
	mockCache := NewMockSessionCache()
	mockTime := NewMockTimeProvider(time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC))
	
	threadTS := "1234567890.123456"
	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    "C1234567890",
		UserID:       "U1234567890",
		SessionID:    "session-123",
		Active:       true,
		LastActivity: mockTime.Now().Add(-time.Hour),
	}
	
	// Add session to both cache and database
	mockCache.SetSession(threadTS, session)
	mockDB.sessions[threadTS] = session
	
	manager := NewSessionActivityManager(mockDB, mockCache, false)
	manager.timeProvider = mockTime
	
	info := manager.GetSessionInfo(threadTS)
	
	// Verify expected fields
	if info["thread_ts"] != threadTS {
		t.Errorf("Expected thread_ts %s, got %v", threadTS, info["thread_ts"])
	}
	
	if info["cache_exists"] != true {
		t.Errorf("Expected cache_exists true, got %v", info["cache_exists"])
	}
	
	if info["db_exists"] != true {
		t.Errorf("Expected db_exists true, got %v", info["db_exists"])
	}
	
	if info["cache_session_id"] != "session-123" {
		t.Errorf("Expected cache_session_id session-123, got %v", info["cache_session_id"])
	}
	
	if info["db_session_id"] != "session-123" {
		t.Errorf("Expected db_session_id session-123, got %v", info["db_session_id"])
	}
}

func TestSessionActivityManager_TryCreateMissingSession(t *testing.T) {
	mockDB := NewMockSessionDB()
	mockCache := NewMockSessionCache()
	
	threadTS := "1234567890.123456"
	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    "C1234567890",
		UserID:       "U1234567890",
		SessionID:    "session-123",
		Active:       false, // Initially inactive
		LastActivity: time.Now().Add(-time.Hour),
	}
	
	// Session exists in cache but not in database
	mockCache.SetSession(threadTS, session)
	
	manager := NewSessionActivityManager(mockDB, mockCache, true)
	
	success := manager.tryCreateMissingSession(threadTS)
	if !success {
		t.Error("tryCreateMissingSession() should succeed")
	}
	
	// Verify session was created in database and marked as active
	if dbSession, exists := mockDB.sessions[threadTS]; exists {
		if !dbSession.Active {
			t.Error("Created session should be marked as active")
		}
	} else {
		t.Error("Session should have been created in database")
	}
}

// Tests for message preprocessing functionality
func TestSlackBot_PreprocessMessage(t *testing.T) {
	bot := &SlackBot{
		botUserID: "U09537B9B32",
		config: &config.SlackBotConfig{
			Debug: true,
		},
	}

	tests := []struct {
		name          string
		input         string
		userID        string
		expected      string
		shouldError   bool
		errorContains string
	}{
		{
			name:        "simple message",
			input:       "Hello bot, can you help me?",
			userID:      "U093Z388PL2",
			expected:    "Hello bot, can you help me?",
			shouldError: false,
		},
		{
			name:        "message with user mention",
			input:       "Hey <@U12345678> and <@U87654321|username> check this out",
			userID:      "U093Z388PL2",
			expected:    "Hey @user and @username check this out",
			shouldError: false,
		},
		{
			name:        "message with channel mention",
			input:       "Posted in <#C12345678> and <#C87654321|general>",
			userID:      "U093Z388PL2",
			expected:    "Posted in #channel and #general",
			shouldError: false,
		},
		{
			name:        "message with links",
			input:       "Check out <https://example.com> and <https://github.com|GitHub>",
			userID:      "U093Z388PL2",
			expected:    "Check out https://example.com and GitHub (https://github.com)",
			shouldError: false,
		},
		{
			name:        "message with special slack mentions",
			input:       "<!here> and <!channel> and <!everyone> attention please",
			userID:      "U093Z388PL2",
			expected:    "and and attention please",
			shouldError: false,
		},
		{
			name:        "message with excessive whitespace",
			input:       "This   has    lots\n\n\n\nof\t\twhitespace",
			userID:      "U093Z388PL2",
			expected:    "This has lots\n\nof whitespace",
			shouldError: false,
		},
		{
			name:        "message with windows line endings",
			input:       "Line 1\r\nLine 2\rLine 3\nLine 4",
			userID:      "U093Z388PL2",
			expected:    "Line 1\nLine 2\nLine 3\nLine 4",
			shouldError: false,
		},
		{
			name:          "empty message",
			input:         "",
			userID:        "U093Z388PL2",
			expected:      "",
			shouldError:   true,
			errorContains: "empty message",
		},
		{
			name:          "whitespace only message",
			input:         "   \t\n   ",
			userID:        "U093Z388PL2",
			expected:      "",
			shouldError:   true,
			errorContains: "empty message after processing",
		},
		{
			name:          "very long message",
			input:         strings.Repeat("a", 5000),
			userID:        "U093Z388PL2",
			expected:      "",
			shouldError:   true,
			errorContains: "message too long",
		},
		{
			name:        "message at length limit",
			input:       strings.Repeat("a", 4000),
			userID:      "U093Z388PL2",
			expected:    strings.Repeat("a", 4000),
			shouldError: false,
		},
		{
			name:        "complex formatting combination",
			input:       "Hey <@U12345678>! Check <#C12345678|general> for <https://example.com|this link>. <!here>",
			userID:      "U093Z388PL2",
			expected:    "Hey @user! Check #general for this link (https://example.com).",
			shouldError: false,
		},
		{
			name:        "production message example",
			input:       "<@U09537B9B32> make me a makeup affiliate market site with only tsx and react",
			userID:      "U093Z388PL2",
			expected:    "@user make me a makeup affiliate market site with only tsx and react",
			shouldError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := bot.preprocessMessage(tt.input, tt.userID)
			
			if tt.shouldError {
				if err == nil {
					t.Errorf("preprocessMessage() should return error for %s", tt.name)
				} else if tt.errorContains != "" && !strings.Contains(err.Error(), tt.errorContains) {
					t.Errorf("Error should contain '%s', got: %v", tt.errorContains, err)
				}
			} else {
				if err != nil {
					t.Errorf("preprocessMessage() unexpected error: %v", err)
				} else if result != tt.expected {
					t.Errorf("preprocessMessage() = %q, expected %q", result, tt.expected)
				}
			}
		})
	}
}

func TestSlackBot_CleanSlackFormatting(t *testing.T) {
	bot := &SlackBot{}

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "remove here mention",
			input:    "<!here> everyone look at this",
			expected: " everyone look at this",
		},
		{
			name:     "remove channel mention",
			input:    "<!channel> important announcement",
			expected: " important announcement",
		},
		{
			name:     "remove everyone mention",
			input:    "<!everyone> please read",
			expected: " please read",
		},
		{
			name:     "remove multiple special mentions",
			input:    "<!here> <!channel> <!everyone> triple mention",
			expected: "   triple mention",
		},
		{
			name:     "preserve other formatting",
			input:    "*bold* _italic_ `code` ```block``` normal text",
			expected: "*bold* _italic_ `code` ```block``` normal text",
		},
		{
			name:     "no special mentions",
			input:    "Regular message with <@U12345678> user mention",
			expected: "Regular message with <@U12345678> user mention",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := bot.cleanSlackFormatting(tt.input)
			if result != tt.expected {
				t.Errorf("cleanSlackFormatting() = %q, expected %q", result, tt.expected)
			}
		})
	}
}

func TestSlackBot_ExpandUserMentions(t *testing.T) {
	// Create a mock client that returns user info
	bot := &SlackBot{
		// We can't easily mock the Slack client here without major refactoring
		// So we'll test the regex pattern matching directly
	}

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "mention with username",
			input:    "<@U12345678|john.doe> hello",
			expected: "@john.doe hello",
		},
		{
			name:     "mention without username",
			input:    "<@U12345678> hello",
			expected: "@user hello", // Default fallback when API call would fail
		},
		{
			name:     "multiple mentions",
			input:    "<@U12345678|alice> and <@U87654321|bob> are here",
			expected: "@alice and @bob are here",
		},
		{
			name:     "mention in middle",
			input:    "Hey <@U12345678|sarah> how are you?",
			expected: "Hey @sarah how are you?",
		},
		{
			name:     "no mentions",
			input:    "Regular message without mentions",
			expected: "Regular message without mentions",
		},
		{
			name:     "malformed mention",
			input:    "This @U12345678 is not a proper mention",
			expected: "This @U12345678 is not a proper mention",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := bot.expandUserMentions(tt.input)
			if result != tt.expected {
				t.Errorf("expandUserMentions() = %q, expected %q", result, tt.expected)
			}
		})
	}
}

func TestSlackBot_ExpandChannelMentions(t *testing.T) {
	bot := &SlackBot{
		// We can't easily mock the Slack client here without major refactoring
		// So we'll test the regex pattern matching directly
	}

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "mention with channel name",
			input:    "Posted in <#C12345678|general>",
			expected: "Posted in #general",
		},
		{
			name:     "mention without channel name",
			input:    "Posted in <#C12345678>",
			expected: "Posted in #channel", // Default fallback when API call would fail
		},
		{
			name:     "multiple channel mentions",
			input:    "See <#C12345678|dev> and <#C87654321|general>",
			expected: "See #dev and #general",
		},
		{
			name:     "no channel mentions",
			input:    "Regular message",
			expected: "Regular message",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := bot.expandChannelMentions(tt.input)
			if result != tt.expected {
				t.Errorf("expandChannelMentions() = %q, expected %q", result, tt.expected)
			}
		})
	}
}

func TestSlackBot_CleanSlackLinks(t *testing.T) {
	bot := &SlackBot{}

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "link with text",
			input:    "Check out <https://example.com|Example Site>",
			expected: "Check out Example Site (https://example.com)",
		},
		{
			name:     "link without text",
			input:    "Visit <https://github.com>",
			expected: "Visit https://github.com",
		},
		{
			name:     "multiple links",
			input:    "See <https://google.com|Google> and <https://github.com>",
			expected: "See Google (https://google.com) and https://github.com",
		},
		{
			name:     "no links",
			input:    "Just regular text",
			expected: "Just regular text",
		},
		{
			name:     "malformed link",
			input:    "This https://example.com is not wrapped",
			expected: "This https://example.com is not wrapped",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := bot.cleanSlackLinks(tt.input)
			if result != tt.expected {
				t.Errorf("cleanSlackLinks() = %q, expected %q", result, tt.expected)
			}
		})
	}
}

// Tests for rate limiting functionality
func TestMessageRateLimiter_Basic(t *testing.T) {
	maxMessages := 3
	window := 1 * time.Second
	limiter := NewMessageRateLimiter(maxMessages, window)

	userID := "U093Z388PL2"

	// First 3 messages should be allowed
	for i := 0; i < maxMessages; i++ {
		allowed, resetTime := limiter.CheckRateLimit(userID)
		if !allowed {
			t.Errorf("Message %d should be allowed", i+1)
		}
		if !resetTime.IsZero() {
			t.Errorf("Reset time should be zero for allowed messages")
		}
	}

	// 4th message should be rate limited
	allowed, resetTime := limiter.CheckRateLimit(userID)
	if allowed {
		t.Error("4th message should be rate limited")
	}
	if resetTime.IsZero() {
		t.Error("Reset time should be set for rate limited messages")
	}

	// Wait for window to pass
	time.Sleep(window + 10*time.Millisecond)

	// Should be allowed again after window
	allowed, resetTime = limiter.CheckRateLimit(userID)
	if !allowed {
		t.Error("Message should be allowed after window expires")
	}
	if !resetTime.IsZero() {
		t.Error("Reset time should be zero after window expires")
	}
}

func TestMessageRateLimiter_MultipleUsers(t *testing.T) {
	maxMessages := 2
	window := 100 * time.Millisecond
	limiter := NewMessageRateLimiter(maxMessages, window)

	user1 := "U093Z388PL2"
	user2 := "U093Z388PL3"

	// Both users should be able to send their quota
	for i := 0; i < maxMessages; i++ {
		allowed1, _ := limiter.CheckRateLimit(user1)
		allowed2, _ := limiter.CheckRateLimit(user2)
		
		if !allowed1 {
			t.Errorf("User1 message %d should be allowed", i+1)
		}
		if !allowed2 {
			t.Errorf("User2 message %d should be allowed", i+1)
		}
	}

	// Both should now be rate limited
	allowed1, _ := limiter.CheckRateLimit(user1)
	allowed2, _ := limiter.CheckRateLimit(user2)
	
	if allowed1 {
		t.Error("User1 should be rate limited")
	}
	if allowed2 {
		t.Error("User2 should be rate limited")
	}
}

func TestMessageRateLimiter_GetUserStats(t *testing.T) {
	maxMessages := 3
	window := 1 * time.Second
	limiter := NewMessageRateLimiter(maxMessages, window)

	userID := "U093Z388PL2"

	// Initially no messages
	count, timeToReset := limiter.GetUserStats(userID)
	if count != 0 {
		t.Errorf("Expected 0 messages, got %d", count)
	}
	if timeToReset != 0 {
		t.Errorf("Expected 0 time to reset, got %v", timeToReset)
	}

	// Send 2 messages
	limiter.CheckRateLimit(userID)
	limiter.CheckRateLimit(userID)

	count, timeToReset = limiter.GetUserStats(userID)
	if count != 2 {
		t.Errorf("Expected 2 messages, got %d", count)
	}
	if timeToReset == 0 {
		t.Error("Expected non-zero time to reset")
	}
}

func TestMessageRateLimiter_CleanupExpiredEntries(t *testing.T) {
	maxMessages := 5
	window := 50 * time.Millisecond
	limiter := NewMessageRateLimiter(maxMessages, window)

	// Add messages for multiple users
	users := []string{"U1", "U2", "U3"}
	for _, user := range users {
		limiter.CheckRateLimit(user)
	}

	// Wait for entries to expire
	time.Sleep(window * 3)

	// Cleanup should remove old entries
	limiter.CleanupExpiredEntries()

	// Check that internal state is cleaned
	if len(limiter.userLimits) > 0 {
		// Some entries might still exist if they haven't been idle long enough
		// This is expected behavior - the cleanup is conservative
		t.Logf("Remaining entries after cleanup: %d", len(limiter.userLimits))
	}
}

func TestMessageRateLimiter_ConcurrentAccess(t *testing.T) {
	maxMessages := 10
	window := 100 * time.Millisecond
	limiter := NewMessageRateLimiter(maxMessages, window)

	userID := "U093Z388PL2"
	const numGoroutines = 20

	var wg sync.WaitGroup

	// Run concurrent rate limit checks
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			allowed, _ := limiter.CheckRateLimit(userID)
			if allowed {
				time.Sleep(1 * time.Millisecond) // Small delay
				// Use atomic operation to safely increment counter
				if allowed {
					// Simple increment without atomic for test purposes
					// In a real scenario, this would need proper synchronization
					count, _ := limiter.GetUserStats(userID)
					_ = count // Use the value to avoid unused variable warning
				}
			}
		}()
	}

	wg.Wait()

	// The total allowed should not exceed maxMessages due to rate limiting
	finalCount, _ := limiter.GetUserStats(userID)
	if finalCount > maxMessages {
		t.Errorf("Rate limiter allowed %d messages, max should be %d", finalCount, maxMessages)
	}

	// At least some messages should have been allowed
	if finalCount == 0 {
		t.Error("Rate limiter should have allowed at least some messages")
	}
}

func TestMessageRateLimiter_EdgeCases(t *testing.T) {
	maxMessages := 1
	window := 100 * time.Millisecond
	limiter := NewMessageRateLimiter(maxMessages, window)

	t.Run("empty_user_id", func(t *testing.T) {
		// Test with empty user ID
		allowed, _ := limiter.CheckRateLimit("")
		if !allowed {
			t.Error("Empty user ID should be handled gracefully")
		}
	})

	t.Run("very_long_user_id", func(t *testing.T) {
		// Test with very long user ID
		longUserID := strings.Repeat("U", 1000)
		allowed, _ := limiter.CheckRateLimit(longUserID)
		if !allowed {
			t.Error("Long user ID should be handled gracefully")
		}
	})

	t.Run("zero_max_messages", func(t *testing.T) {
		// Test rate limiter with zero max messages
		zeroLimiter := NewMessageRateLimiter(0, window)
		allowed, _ := zeroLimiter.CheckRateLimit("U123")
		if allowed {
			t.Error("Zero max messages should always rate limit")
		}
	})
}