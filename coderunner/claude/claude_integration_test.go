// +build integration

package claude

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Integration tests that require Claude CLI to be installed
// Run with: go test -tags=integration ./claude/...

func TestIntegrationCreateSession(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	process, err := service.CreateSession(user.ID)
	if err != nil {
		t.Skip("Claude CLI not available, skipping integration test")
	}

	assert.NotNil(t, process)
	assert.NotEmpty(t, process.sessionID)
	assert.Equal(t, user.ID, process.userID)

	// Clean up
	service.StopSession(process.sessionID)
}

func TestIntegrationResumeSession(t *testing.T) {
	db := setupTestDB(t)
	service := createTestService(db)
	user := createTestUser(db)

	// First create a session
	process, err := service.CreateSession(user.ID)
	if err != nil {
		t.Skip("Claude CLI not available, skipping integration test")
	}

	sessionID := process.sessionID
	service.StopSession(sessionID)

	// Wait a bit
	time.Sleep(500 * time.Millisecond)

	// Now resume it
	resumedProcess, err := service.ResumeSession(sessionID, user.ID)
	require.NoError(t, err)
	assert.NotNil(t, resumedProcess)
	assert.Equal(t, sessionID, resumedProcess.sessionID)

	// Clean up
	service.StopSession(sessionID)
}