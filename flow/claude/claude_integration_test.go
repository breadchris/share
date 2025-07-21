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

	process, err := service.CreateSession()
	if err != nil {
		t.Skip("Claude CLI not available, skipping integration test")
	}

	assert.NotNil(t, process)
	assert.NotEmpty(t, process.sessionID)

	// Clean up
	service.StopSession(process.sessionID)
}

func TestIntegrationResumeSession(t *testing.T) {
	// This test is no longer applicable since the new claude service
	// doesn't support session resuming by ID
	t.Skip("Session resuming not supported in new claude interface")
}