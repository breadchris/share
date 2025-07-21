package slackbot

import (
	"fmt"
	"log/slog"
	"time"

	"gorm.io/gorm"
)

// SessionDB interface for database operations (testable)
type SessionDB interface {
	UpdateSessionActivity(threadTS string) error
	GetSession(threadTS string) (*SlackClaudeSession, error)
	SetSession(session *SlackClaudeSession) error
	SessionExists(threadTS string) (bool, error)
}

// SessionCache interface for memory cache operations (testable)
type SessionCache interface {
	GetSession(threadTS string) (*SlackClaudeSession, bool)
	SetSession(threadTS string, session *SlackClaudeSession)
	UpdateSessionActivity(threadTS string)
}

// TimeProvider interface for testable time operations
type TimeProvider interface {
	Now() time.Time
}

// RealTimeProvider implements TimeProvider using real time
type RealTimeProvider struct{}

func (r *RealTimeProvider) Now() time.Time {
	return time.Now()
}

// SessionActivityManager handles session activity updates with proper error handling
type SessionActivityManager struct {
	db           SessionDB
	cache        SessionCache
	timeProvider TimeProvider
	debug        bool
	maxRetries   int
	retryDelay   time.Duration
}

// NewSessionActivityManager creates a new session activity manager
func NewSessionActivityManager(db SessionDB, cache SessionCache, debug bool) *SessionActivityManager {
	return &SessionActivityManager{
		db:           db,
		cache:        cache,
		timeProvider: &RealTimeProvider{},
		debug:        debug,
		maxRetries:   3,
		retryDelay:   100 * time.Millisecond,
	}
}

// UpdateActivity updates session activity with proper error handling and retry logic
func (sam *SessionActivityManager) UpdateActivity(threadTS string) error {
	if threadTS == "" {
		return fmt.Errorf("threadTS cannot be empty")
	}

	// First, update memory cache if session exists there
	sam.cache.UpdateSessionActivity(threadTS)

	// Then update database with retry logic
	var lastErr error
	for attempt := 0; attempt <= sam.maxRetries; attempt++ {
		err := sam.updateDatabaseActivity(threadTS, attempt)
		if err == nil {
			return nil // Success
		}

		lastErr = err
		
		// Categorize error types
		if sam.isRaceConditionError(err) {
			// This is likely a race condition - try to create/sync session
			if sam.tryCreateMissingSession(threadTS) {
				// Try the update again after creating session
				continue
			}
		}

		if sam.isTransientError(err) && attempt < sam.maxRetries {
			// Retry transient errors
			if sam.debug {
				slog.Debug("Retrying session activity update",
					"thread_ts", threadTS,
					"attempt", attempt+1,
					"error", err)
			}
			time.Sleep(sam.retryDelay * time.Duration(attempt+1))
			continue
		}

		// Non-retryable error or max retries reached
		break
	}

	// Log appropriate error level based on error type
	if sam.isRaceConditionError(lastErr) {
		if sam.debug {
			slog.Debug("Session activity update failed due to race condition",
				"thread_ts", threadTS,
				"error", lastErr)
		}
	} else {
		slog.Error("Failed to update session activity after retries",
			"thread_ts", threadTS,
			"attempts", sam.maxRetries+1,
			"error", lastErr)
	}

	return lastErr
}

// updateDatabaseActivity performs the actual database update
func (sam *SessionActivityManager) updateDatabaseActivity(threadTS string, attempt int) error {
	return sam.db.UpdateSessionActivity(threadTS)
}

// isRaceConditionError checks if error is likely due to race condition
func (sam *SessionActivityManager) isRaceConditionError(err error) bool {
	if err == nil {
		return false
	}
	
	// Check for gorm record not found
	if err == gorm.ErrRecordNotFound {
		return true
	}
	
	errStr := err.Error()
	prefix := "no active session found"
	
	// Check if error starts with the race condition pattern
	if len(errStr) >= len(prefix) {
		return errStr[:len(prefix)] == prefix
	}
	
	return false
}

// isTransientError checks if error might be resolved by retrying
func (sam *SessionActivityManager) isTransientError(err error) bool {
	if err == nil {
		return false
	}
	// Add logic to detect transient database errors
	// For now, consider connection errors as transient
	errStr := err.Error()
	return containsAny(errStr, []string{
		"connection", "timeout", "temporary", "retry",
		"deadlock", "lock", "busy",
	})
}

// tryCreateMissingSession attempts to create a session record if it's missing but exists in cache
func (sam *SessionActivityManager) tryCreateMissingSession(threadTS string) bool {
	// Get session from memory cache
	session, exists := sam.cache.GetSession(threadTS)
	if !exists {
		return false
	}

	// Check if session already exists in database
	dbExists, err := sam.db.SessionExists(threadTS)
	if err != nil {
		if sam.debug {
			slog.Debug("Failed to check if session exists", "error", err, "thread_ts", threadTS)
		}
		return false
	}

	if dbExists {
		return true // Session exists, the issue was elsewhere
	}

	// Try to create the missing session
	session.Active = true // Ensure it's marked as active
	session.LastActivity = sam.timeProvider.Now()
	
	err = sam.db.SetSession(session)
	if err != nil {
		if sam.debug {
			slog.Debug("Failed to create missing session",
				"error", err,
				"thread_ts", threadTS,
				"session_id", session.SessionID)
		}
		return false
	}

	if sam.debug {
		slog.Debug("Created missing session record",
			"thread_ts", threadTS,
			"session_id", session.SessionID)
	}
	return true
}

// GetSessionInfo returns session information for debugging
func (sam *SessionActivityManager) GetSessionInfo(threadTS string) map[string]interface{} {
	info := map[string]interface{}{
		"thread_ts": threadTS,
		"timestamp": sam.timeProvider.Now(),
	}

	// Check memory cache
	if session, exists := sam.cache.GetSession(threadTS); exists {
		info["cache_exists"] = true
		info["cache_active"] = session.Active
		info["cache_session_id"] = session.SessionID
		info["cache_last_activity"] = session.LastActivity
	} else {
		info["cache_exists"] = false
	}

	// Check database
	if session, err := sam.db.GetSession(threadTS); err == nil && session != nil {
		info["db_exists"] = true
		info["db_active"] = session.Active
		info["db_session_id"] = session.SessionID
		info["db_last_activity"] = session.LastActivity
	} else {
		info["db_exists"] = false
		if err != nil {
			info["db_error"] = err.Error()
		}
	}

	return info
}

// containsAny checks if string contains any of the given substrings
func containsAny(s string, substrings []string) bool {
	for _, sub := range substrings {
		if len(s) >= len(sub) {
			for i := 0; i <= len(s)-len(sub); i++ {
				if s[i:i+len(sub)] == sub {
					return true
				}
			}
		}
	}
	return false
}