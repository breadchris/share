package slackbot

import (
	"testing"
	"time"

	"github.com/breadchris/flow/config"
	"github.com/breadchris/flow/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestSessionActivity_Integration(t *testing.T) {
	// Create an in-memory SQLite database for testing
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Migrate the schema
	if err := db.AutoMigrate(&models.SlackSession{}); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	// Create SlackBot components
	sessionDB := NewSessionDBService(db, true)
	sessionCache := NewSlackBotSessionCache()
	sessionActivityMgr := NewSessionActivityManager(sessionDB, sessionCache, true)

	// Create a minimal SlackBot instance for integration testing
	slackConfig := &config.SlackBotConfig{
		Debug:       true,
		MaxSessions: 10,
	}

	bot := &SlackBot{
		sessionDB:          sessionDB,
		sessionCache:       sessionCache,
		sessionActivityMgr: sessionActivityMgr,
		config:             slackConfig,
		sessions:           make(map[string]*SlackClaudeSession), // Initialize the legacy map
	}

	threadTS := "1234567890.123456"
	
	// Test 1: Update activity for non-existent session should handle gracefully
	bot.updateSessionActivity(threadTS)
	
	// Should not crash, but no session exists yet
	
	// Test 2: Create a session and update activity
	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    "C1234567890",
		UserID:       "U1234567890",
		SessionID:    "session-123",
		ProcessID:    "process-456",
		Active:       true,
		LastActivity: time.Now().Add(-time.Hour),
		Context:      "/test/context",
		Resumed:      false,
	}

	// Store the session
	bot.setSession(threadTS, session)

	// Verify session was stored in all places
	if _, exists := bot.sessionCache.GetSession(threadTS); !exists {
		t.Error("Session should exist in new cache")
	}

	// Update activity
	oldTime := session.LastActivity
	time.Sleep(1 * time.Millisecond) // Ensure time difference
	
	bot.updateSessionActivity(threadTS)

	// Verify activity was updated in cache
	updatedSession, exists := bot.sessionCache.GetSession(threadTS)
	if !exists {
		t.Fatal("Session should still exist in cache after activity update")
	}
	
	if !updatedSession.LastActivity.After(oldTime) {
		t.Error("Session activity time should have been updated")
	}

	// Verify activity was updated in database by retrieving the session
	dbSession, err := sessionDB.GetSession(threadTS)
	if err != nil {
		t.Fatalf("Failed to retrieve session from database: %v", err)
	}
	if dbSession == nil {
		t.Fatal("Session should exist in database")
	}
	
	if !dbSession.LastActivity.After(oldTime) {
		t.Error("Database session activity time should have been updated")
	}

	// Test 3: Test concurrent activity updates
	const numUpdates = 10
	done := make(chan bool, numUpdates)
	
	for i := 0; i < numUpdates; i++ {
		go func() {
			bot.updateSessionActivity(threadTS)
			done <- true
		}()
	}
	
	// Wait for all updates to complete
	for i := 0; i < numUpdates; i++ {
		<-done
	}
	
	// Session should still be intact
	finalSession, exists := bot.sessionCache.GetSession(threadTS)
	if !exists {
		t.Error("Session should still exist after concurrent updates")
	}
	if finalSession.SessionID != session.SessionID {
		t.Error("Session data should be intact after concurrent updates")
	}

	// Test 4: Test session removal
	bot.removeSession(threadTS)
	
	if _, exists := bot.sessionCache.GetSession(threadTS); exists {
		t.Error("Session should be removed from cache")
	}
	
	// Database session should be marked as inactive
	dbSession, err = sessionDB.GetSession(threadTS)
	if err != nil {
		t.Logf("Session retrieval after removal failed (expected): %v", err)
	}
	if dbSession != nil && dbSession.Active {
		t.Error("Database session should be marked as inactive after removal")
	}
}

func TestSessionActivity_RaceConditionRecovery(t *testing.T) {
	// Create an in-memory SQLite database for testing
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Migrate the schema
	if err := db.AutoMigrate(&models.SlackSession{}); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	// Create SlackBot components
	sessionDB := NewSessionDBService(db, true)
	sessionCache := NewSlackBotSessionCache()
	sessionActivityMgr := NewSessionActivityManager(sessionDB, sessionCache, true)

	slackConfig := &config.SlackBotConfig{
		Debug:       true,
		MaxSessions: 10,
	}

	bot := &SlackBot{
		sessionDB:          sessionDB,
		sessionCache:       sessionCache,
		sessionActivityMgr: sessionActivityMgr,
		config:             slackConfig,
		sessions:           make(map[string]*SlackClaudeSession), // Initialize the legacy map
	}

	threadTS := "1234567890.123456"
	
	// Simulate race condition: Session exists in cache but not in database
	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    "C1234567890",
		UserID:       "U1234567890",
		SessionID:    "session-123",
		ProcessID:    "process-456",
		Active:       true,
		LastActivity: time.Now(),
		Context:      "/test/context",
		Resumed:      false,
	}

	// Add to cache only (not database)
	bot.sessionCache.SetSession(threadTS, session)

	// Update activity should trigger race condition recovery
	bot.updateSessionActivity(threadTS)

	// After race condition recovery, session should exist in database
	dbSession, err := sessionDB.GetSession(threadTS)
	if err != nil {
		t.Fatalf("Session should exist in database after race condition recovery: %v", err)
	}
	if dbSession == nil {
		t.Fatal("Database session should have been created during race condition recovery")
	}
	
	if !dbSession.Active {
		t.Error("Recovered session should be marked as active")
	}
	
	if dbSession.SessionID != session.SessionID {
		t.Error("Recovered session should have correct session ID")
	}
}

func TestSessionActivity_ErrorHandling(t *testing.T) {
	// Create an in-memory SQLite database for testing
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Migrate the schema
	if err := db.AutoMigrate(&models.SlackSession{}); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	sessionDB := NewSessionDBService(db, true)
	sessionCache := NewSlackBotSessionCache()
	sessionActivityMgr := NewSessionActivityManager(sessionDB, sessionCache, true)

	slackConfig := &config.SlackBotConfig{
		Debug:       true,
		MaxSessions: 10,
	}

	bot := &SlackBot{
		sessionDB:          sessionDB,
		sessionCache:       sessionCache,
		sessionActivityMgr: sessionActivityMgr,
		config:             slackConfig,
		sessions:           make(map[string]*SlackClaudeSession), // Initialize the legacy map
	}

	// Test with empty threadTS (should handle gracefully)
	bot.updateSessionActivity("")

	// Test with invalid threadTS (should handle gracefully)
	bot.updateSessionActivity("invalid-thread-id")

	// Test should complete without panicking
	t.Log("Error handling test completed successfully")
}

func BenchmarkSessionActivity_UpdateActivity(b *testing.B) {
	// Create an in-memory SQLite database for benchmarking
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		b.Fatalf("Failed to create test database: %v", err)
	}

	// Migrate the schema
	if err := db.AutoMigrate(&models.SlackSession{}); err != nil {
		b.Fatalf("Failed to migrate database: %v", err)
	}

	sessionDB := NewSessionDBService(db, false) // Disable debug for benchmark
	sessionCache := NewSlackBotSessionCache()
	sessionActivityMgr := NewSessionActivityManager(sessionDB, sessionCache, false)

	slackConfig := &config.SlackBotConfig{
		Debug:       false,
		MaxSessions: 1000,
	}

	bot := &SlackBot{
		sessionDB:          sessionDB,
		sessionCache:       sessionCache,
		sessionActivityMgr: sessionActivityMgr,
		config:             slackConfig,
		sessions:           make(map[string]*SlackClaudeSession), // Initialize the legacy map
	}

	// Create a session for benchmarking
	threadTS := "1234567890.123456"
	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    "C1234567890",
		UserID:       "U1234567890",
		SessionID:    "session-123",
		ProcessID:    "process-456",
		Active:       true,
		LastActivity: time.Now(),
		Context:      "/test/context",
		Resumed:      false,
	}

	bot.setSession(threadTS, session)

	b.ResetTimer()
	
	// Benchmark the activity update
	for i := 0; i < b.N; i++ {
		bot.updateSessionActivity(threadTS)
	}
}