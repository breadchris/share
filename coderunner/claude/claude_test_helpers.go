package claude

import (
	"testing"
	"time"

	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
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

// createTestService creates a new ClaudeService instance for testing
func createTestService(db *gorm.DB) *ClaudeService {
	testDeps := createTestDeps(db)
	return NewClaudeService(testDeps)
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