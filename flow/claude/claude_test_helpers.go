package claude

import (
	"testing"
	"time"

	"github.com/breadchris/flow/config"
	"github.com/breadchris/flow/deps"
	"github.com/breadchris/flow/models"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrate the schema
	err = db.AutoMigrate(&models.ClaudeSession{}, &models.User{})
	require.NoError(t, err)

	return db
}

// createTestDeps creates a deps.Deps struct for testing
func createTestDeps(db *gorm.DB) deps.Deps {
	return deps.Deps{
		DB: db,
		Config: config.AppConfig{
			ClaudeDebug: false, // Disable debug mode for tests
		},
	}
}

// createTestService creates a new Service instance for testing
func createTestService(db *gorm.DB) *Service {
	config := Config{
		Debug:    false,
		DebugDir: "/tmp/claude-tests",
		Tools:    []string{"Read", "Write", "Bash"},
	}
	return NewService(config)
}

// createTestUser creates a test user with unique username
func createTestUser(db *gorm.DB) *models.User {
	userID := uuid.New().String()
	user := &models.User{
		ID:        userID,
		CreatedAt: time.Now(),
		Username:  "testuser_" + userID[:8], // Unique username using UUID prefix
	}
	db.Create(user)
	return user
}