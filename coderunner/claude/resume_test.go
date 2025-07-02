package claude

import (
	"testing"
	"time"

	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// TestResumeSessionPipeCreation tests that stderr pipe is created before process starts
func TestResumeSessionPipeCreation(t *testing.T) {
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
	service := NewClaudeService(testDeps)

	// Create test user
	userID := "test-user-123"
	user := &models.User{
		ID:        userID,
		CreatedAt: time.Now(),
		Username:  "testuser",
	}
	err = db.Create(user).Error
	require.NoError(t, err)

	// Create test session in database
	sessionID := "test-session-123"
	session := &models.ClaudeSession{
		Model: models.Model{
			ID:        "session-model-id-123",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		SessionID: sessionID,
		UserID:    userID,
		Title:     "Test Session",
		Messages:  models.JSONField[interface{}]{Data: []interface{}{}},
	}
	err = db.Create(session).Error
	require.NoError(t, err)

	// Test ResumeSession - this should NOT fail with "StderrPipe after process started"
	// Note: This will likely fail because claude CLI is not available in test environment,
	// but the important thing is that it should NOT fail with the specific pipe error
	process, err := service.ResumeSession(sessionID, userID)

	if err != nil {
		// Check that the error is NOT the pipe creation error
		assert.NotContains(t, err.Error(), "StderrPipe after process started", 
			"ResumeSession should not fail with StderrPipe error - pipes should be created before process starts")
		
		// It's acceptable to fail with claude CLI not found or other process errors
		// as long as it's not the pipe ordering issue
		t.Logf("Expected failure (Claude CLI not available): %v", err)
	} else {
		// If successful, clean up the process
		assert.NotNil(t, process, "Process should not be nil if no error")
		if process != nil {
			service.StopSession(sessionID)
		}
	}
}

// TestResumeSessionNonExistentSession tests resuming a session that doesn't exist
func TestResumeSessionNonExistentSession(t *testing.T) {
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
			ClaudeDebug: false,
		},
	}

	// Create ClaudeService
	service := NewClaudeService(testDeps)

	// Try to resume non-existent session
	process, err := service.ResumeSession("non-existent-session", "test-user")

	// Should fail with session not found error, not pipe error
	assert.Error(t, err)
	assert.Nil(t, process)
	assert.Contains(t, err.Error(), "session not found", 
		"Should fail with session not found error")
	assert.NotContains(t, err.Error(), "StderrPipe after process started",
		"Should not fail with pipe creation error")
}