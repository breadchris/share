package slackbot

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/breadchris/flow/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SessionDBService handles database operations for Slack sessions
type SessionDBService struct {
	db    *gorm.DB
	debug bool
}

// NewSessionDBService creates a new session database service
func NewSessionDBService(db *gorm.DB, debug bool) *SessionDBService {
	return &SessionDBService{
		db:    db,
		debug: debug,
	}
}

// GetSession retrieves a session by thread timestamp
func (s *SessionDBService) GetSession(threadTS string) (*SlackClaudeSession, error) {
	var dbSession models.SlackSession
	err := s.db.Where("thread_ts = ? AND active = ?", threadTS, true).First(&dbSession).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // No session found
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	// Convert database model to in-memory model
	session := &SlackClaudeSession{
		ThreadTS:     dbSession.ThreadTS,
		ChannelID:    dbSession.ChannelID,
		UserID:       dbSession.UserID,
		SessionID:    dbSession.SessionID,
		ProcessID:    dbSession.ProcessID,
		LastActivity: dbSession.LastActivity,
		Context:      dbSession.Context,
		Active:       dbSession.Active,
		Resumed:      dbSession.Resumed,
		Process:      nil, // Will be set separately when needed
		SessionInfo:  nil, // Will be set separately when needed
	}

	if s.debug {
		slog.Debug("Retrieved session from database",
			"thread_ts", threadTS,
			"session_id", session.SessionID,
			"user_id", session.UserID)
	}

	return session, nil
}

// SetSession stores or updates a session in the database
func (s *SessionDBService) SetSession(session *SlackClaudeSession) error {
	// Check if session already exists
	var existing models.SlackSession
	err := s.db.Where("thread_ts = ?", session.ThreadTS).First(&existing).Error
	
	if err == gorm.ErrRecordNotFound {
		// Create new session
		dbSession := models.SlackSession{
			Model: models.Model{
				ID:        uuid.NewString(),
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			ThreadTS:     session.ThreadTS,
			ChannelID:    session.ChannelID,
			UserID:       session.UserID,
			SessionID:    session.SessionID,
			ProcessID:    session.ProcessID,
			LastActivity: session.LastActivity,
			Context:      session.Context,
			Active:       session.Active,
			Resumed:      session.Resumed,
		}

		if err := s.db.Create(&dbSession).Error; err != nil {
			return fmt.Errorf("failed to create session: %w", err)
		}

		if s.debug {
			slog.Debug("Created new session in database",
				"thread_ts", session.ThreadTS,
				"session_id", session.SessionID,
				"user_id", session.UserID)
		}
	} else if err != nil {
		return fmt.Errorf("failed to check existing session: %w", err)
	} else {
		// Update existing session
		existing.SessionID = session.SessionID
		existing.ProcessID = session.ProcessID
		existing.LastActivity = session.LastActivity
		existing.Context = session.Context
		existing.Active = session.Active
		existing.Resumed = session.Resumed

		if err := s.db.Save(&existing).Error; err != nil {
			return fmt.Errorf("failed to update session: %w", err)
		}

		if s.debug {
			slog.Debug("Updated session in database",
				"thread_ts", session.ThreadTS,
				"session_id", session.SessionID,
				"user_id", session.UserID)
		}
	}

	return nil
}

// UpdateSessionActivity updates the last activity time for a session
func (s *SessionDBService) UpdateSessionActivity(threadTS string) error {
	result := s.db.Model(&models.SlackSession{}).
		Where("thread_ts = ? AND active = ?", threadTS, true).
		Update("last_activity", time.Now())
	
	if result.Error != nil {
		return fmt.Errorf("failed to update session activity: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("no active session found for thread %s", threadTS)
	}

	if s.debug {
		slog.Debug("Updated session activity", "thread_ts", threadTS)
	}

	return nil
}

// SessionExists checks if a session exists in the database
func (s *SessionDBService) SessionExists(threadTS string) (bool, error) {
	var count int64
	err := s.db.Model(&models.SlackSession{}).
		Where("thread_ts = ?", threadTS).
		Count(&count).Error
	
	if err != nil {
		return false, fmt.Errorf("failed to check session existence: %w", err)
	}
	
	return count > 0, nil
}

// RemoveSession marks a session as inactive
func (s *SessionDBService) RemoveSession(threadTS string) error {
	result := s.db.Model(&models.SlackSession{}).
		Where("thread_ts = ?", threadTS).
		Update("active", false)
	
	if result.Error != nil {
		return fmt.Errorf("failed to remove session: %w", result.Error)
	}

	if s.debug {
		slog.Debug("Marked session as inactive", "thread_ts", threadTS)
	}

	return nil
}

// CleanupInactiveSessions removes sessions that have been inactive for longer than the specified timeout
func (s *SessionDBService) CleanupInactiveSessions(timeout time.Duration) error {
	cutoff := time.Now().Add(-timeout)
	
	result := s.db.Model(&models.SlackSession{}).
		Where("last_activity < ? AND active = ?", cutoff, true).
		Update("active", false)
	
	if result.Error != nil {
		return fmt.Errorf("failed to cleanup inactive sessions: %w", result.Error)
	}

	if result.RowsAffected > 0 {
		slog.Info("Cleaned up inactive sessions",
			"count", result.RowsAffected,
			"timeout", timeout)
	}

	return nil
}

// GetAllActiveSessions returns all active sessions (for monitoring/debugging)
func (s *SessionDBService) GetAllActiveSessions() ([]*SlackClaudeSession, error) {
	var dbSessions []models.SlackSession
	err := s.db.Where("active = ?", true).Find(&dbSessions).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get active sessions: %w", err)
	}

	sessions := make([]*SlackClaudeSession, len(dbSessions))
	for i, dbSession := range dbSessions {
		sessions[i] = &SlackClaudeSession{
			ThreadTS:     dbSession.ThreadTS,
			ChannelID:    dbSession.ChannelID,
			UserID:       dbSession.UserID,
			SessionID:    dbSession.SessionID,
			ProcessID:    dbSession.ProcessID,
			LastActivity: dbSession.LastActivity,
			Context:      dbSession.Context,
			Active:       dbSession.Active,
			Resumed:      dbSession.Resumed,
			Process:      nil,
			SessionInfo:  nil,
		}
	}

	return sessions, nil
}

// ContextDBService handles database operations for thread contexts
type ContextDBService struct {
	db    *gorm.DB
	debug bool
}

// NewContextDBService creates a new context database service
func NewContextDBService(db *gorm.DB, debug bool) *ContextDBService {
	return &ContextDBService{
		db:    db,
		debug: debug,
	}
}

// GetContext retrieves a context summary by thread timestamp
func (c *ContextDBService) GetContext(threadTS string) (*ThreadContextSummary, error) {
	var dbContext models.ThreadContext
	err := c.db.Where("thread_ts = ? AND active = ?", threadTS, true).First(&dbContext).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // No context found
		}
		return nil, fmt.Errorf("failed to get context: %w", err)
	}

	// Convert database model to in-memory model
	context := &ThreadContextSummary{
		ThreadTS:       dbContext.ThreadTS,
		ChannelID:      dbContext.ChannelID,
		SessionType:    dbContext.SessionType,
		OriginalPrompt: dbContext.OriginalPrompt,
		CreatedAt:      dbContext.CreatedAt,
		LastUpdated:    dbContext.UpdatedAt,
		LastActivity:   dbContext.LastActivity,
		Summary:        dbContext.Summary,
		NextSteps:      dbContext.NextSteps.Data,
		KeyMetrics:     dbContext.KeyMetrics.Data,
		PinnedMessage:  dbContext.PinnedMessage,
		UserID:         dbContext.UserID,
		Active:         dbContext.Active,
	}

	if c.debug {
		slog.Debug("Retrieved context from database",
			"thread_ts", threadTS,
			"session_type", context.SessionType,
			"user_id", context.UserID)
	}

	return context, nil
}

// CreateContext creates a new context summary in the database
func (c *ContextDBService) CreateContext(threadTS, channelID, userID, sessionType, originalPrompt string) (*ThreadContextSummary, error) {
	now := time.Now()
	
	dbContext := models.ThreadContext{
		Model: models.Model{
			ID:        uuid.NewString(),
			CreatedAt: now,
			UpdatedAt: now,
		},
		ThreadTS:       threadTS,
		ChannelID:      channelID,
		SessionType:    sessionType,
		OriginalPrompt: originalPrompt,
		LastActivity:   now,
		Summary:        "",
		NextSteps:      models.JSONField[[]string]{Data: []string{}},
		KeyMetrics:     models.JSONField[map[string]interface{}]{Data: make(map[string]interface{})},
		PinnedMessage:  "",
		UserID:         userID,
		Active:         true,
	}

	if err := c.db.Create(&dbContext).Error; err != nil {
		return nil, fmt.Errorf("failed to create context: %w", err)
	}

	// Convert back to in-memory model
	context := &ThreadContextSummary{
		ThreadTS:       dbContext.ThreadTS,
		ChannelID:      dbContext.ChannelID,
		SessionType:    dbContext.SessionType,
		OriginalPrompt: dbContext.OriginalPrompt,
		CreatedAt:      dbContext.CreatedAt,
		LastUpdated:    dbContext.UpdatedAt,
		LastActivity:   dbContext.LastActivity,
		Summary:        dbContext.Summary,
		NextSteps:      dbContext.NextSteps.Data,
		KeyMetrics:     dbContext.KeyMetrics.Data,
		PinnedMessage:  dbContext.PinnedMessage,
		UserID:         dbContext.UserID,
		Active:         dbContext.Active,
	}

	if c.debug {
		slog.Debug("Created context in database",
			"thread_ts", threadTS,
			"session_type", sessionType,
			"user_id", userID)
	}

	return context, nil
}

// UpdateContext updates an existing context summary in the database
func (c *ContextDBService) UpdateContext(context *ThreadContextSummary) error {
	var dbContext models.ThreadContext
	err := c.db.Where("thread_ts = ?", context.ThreadTS).First(&dbContext).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("context not found for thread %s", context.ThreadTS)
		}
		return fmt.Errorf("failed to find context: %w", err)
	}

	// Update fields
	dbContext.SessionType = context.SessionType
	dbContext.OriginalPrompt = context.OriginalPrompt
	dbContext.LastActivity = context.LastActivity
	dbContext.Summary = context.Summary
	dbContext.NextSteps = models.JSONField[[]string]{Data: context.NextSteps}
	dbContext.KeyMetrics = models.JSONField[map[string]interface{}]{Data: context.KeyMetrics}
	dbContext.PinnedMessage = context.PinnedMessage
	dbContext.Active = context.Active

	if err := c.db.Save(&dbContext).Error; err != nil {
		return fmt.Errorf("failed to update context: %w", err)
	}

	if c.debug {
		slog.Debug("Updated context in database",
			"thread_ts", context.ThreadTS,
			"session_type", context.SessionType)
	}

	return nil
}

// CleanupOldContexts removes contexts that are older than the specified age
func (c *ContextDBService) CleanupOldContexts(maxAge time.Duration) error {
	cutoff := time.Now().Add(-maxAge)
	
	result := c.db.Model(&models.ThreadContext{}).
		Where("updated_at < ? AND active = ?", cutoff, true).
		Update("active", false)
	
	if result.Error != nil {
		return fmt.Errorf("failed to cleanup old contexts: %w", result.Error)
	}

	if result.RowsAffected > 0 {
		slog.Info("Cleaned up old contexts",
			"count", result.RowsAffected,
			"max_age", maxAge)
	}

	return nil
}