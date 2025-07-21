package slackbot

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/google/uuid"
)

// IdeationSession represents an ideation session tied to a Slack thread
type IdeationSession struct {
	SessionID     string            `json:"session_id"`
	ThreadID      string            `json:"thread_id"`
	ChannelID     string            `json:"channel_id"`
	UserID        string            `json:"user_id"`
	OriginalIdea  string            `json:"original_idea"`
	Features      []Feature         `json:"features"`
	Preferences   map[string]int    `json:"preferences"`   // emoji -> count
	ChatHistory   []ChatMessage     `json:"chat_history"`
	CreatedAt     time.Time         `json:"created_at"`
	LastActivity  time.Time         `json:"last_activity"`
	Active        bool              `json:"active"`
	MessageTS     map[string]string `json:"message_ts"`    // feature_id -> message timestamp
}

// ChatMessage represents a message in the ideation chat history
type ChatMessage struct {
	Role      string    `json:"role"`      // "user" or "assistant"
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	Type      string    `json:"type"`      // "initial", "expansion", "reaction", etc.
}

// FeatureReaction represents a user's reaction to a feature
type FeatureReaction struct {
	FeatureID string    `json:"feature_id"`
	UserID    string    `json:"user_id"`
	Emoji     string    `json:"emoji"`
	Timestamp time.Time `json:"timestamp"`
}

// IdeationManager manages ideation sessions
type IdeationManager struct {
	sessions map[string]*IdeationSession // thread_id -> session
	mu       sync.RWMutex
	debug    bool
}

// NewIdeationManager creates a new ideation manager
func NewIdeationManager(debug bool) *IdeationManager {
	return &IdeationManager{
		sessions: make(map[string]*IdeationSession),
		debug:    debug,
	}
}

// CreateSession creates a new ideation session
func (im *IdeationManager) CreateSession(userID, channelID, threadID, originalIdea string) *IdeationSession {
	im.mu.Lock()
	defer im.mu.Unlock()

	session := &IdeationSession{
		SessionID:    uuid.New().String(),
		ThreadID:     threadID,
		ChannelID:    channelID,
		UserID:       userID,
		OriginalIdea: originalIdea,
		Features:     []Feature{},
		Preferences:  make(map[string]int),
		ChatHistory:  []ChatMessage{},
		CreatedAt:    time.Now(),
		LastActivity: time.Now(),
		Active:       true,
		MessageTS:    make(map[string]string),
	}

	// Add initial chat message
	session.ChatHistory = append(session.ChatHistory, ChatMessage{
		Role:      "user",
		Content:   originalIdea,
		Timestamp: time.Now(),
		Type:      "initial",
	})

	im.sessions[threadID] = session

	if im.debug {
		slog.Debug("Created ideation session",
			"session_id", session.SessionID,
			"thread_id", threadID,
			"user_id", userID,
			"idea", originalIdea)
	}

	return session
}

// GetSession retrieves a session by thread ID
func (im *IdeationManager) GetSession(threadID string) (*IdeationSession, bool) {
	im.mu.RLock()
	defer im.mu.RUnlock()
	session, exists := im.sessions[threadID]
	return session, exists
}

// UpdateSession updates a session
func (im *IdeationManager) UpdateSession(session *IdeationSession) {
	im.mu.Lock()
	defer im.mu.Unlock()
	session.LastActivity = time.Now()
	im.sessions[session.ThreadID] = session

	if im.debug {
		slog.Debug("Updated ideation session",
			"session_id", session.SessionID,
			"thread_id", session.ThreadID)
	}
}

// AddFeatures adds features to a session
func (im *IdeationManager) AddFeatures(threadID string, features []Feature, messageType string) error {
	im.mu.Lock()
	defer im.mu.Unlock()

	session, exists := im.sessions[threadID]
	if !exists {
		return fmt.Errorf("session not found for thread %s", threadID)
	}

	// Add features to session
	session.Features = append(session.Features, features...)
	session.LastActivity = time.Now()

	// Add to chat history
	featuresJSON, _ := json.Marshal(features)
	session.ChatHistory = append(session.ChatHistory, ChatMessage{
		Role:      "assistant",
		Content:   string(featuresJSON),
		Timestamp: time.Now(),
		Type:      messageType,
	})

	if im.debug {
		slog.Debug("Added features to session",
			"session_id", session.SessionID,
			"feature_count", len(features),
			"total_features", len(session.Features))
	}

	return nil
}

// AddReaction adds a reaction to a feature
func (im *IdeationManager) AddReaction(threadID, featureID, emoji, userID string) error {
	im.mu.Lock()
	defer im.mu.Unlock()

	session, exists := im.sessions[threadID]
	if !exists {
		return fmt.Errorf("session not found for thread %s", threadID)
	}

	// Update preferences
	session.Preferences[emoji]++
	session.LastActivity = time.Now()

	// Add to chat history
	reactionMsg := fmt.Sprintf("User reacted %s to feature %s", emoji, featureID)
	session.ChatHistory = append(session.ChatHistory, ChatMessage{
		Role:      "user",
		Content:   reactionMsg,
		Timestamp: time.Now(),
		Type:      "reaction",
	})

	if im.debug {
		slog.Debug("Added reaction to session",
			"session_id", session.SessionID,
			"feature_id", featureID,
			"emoji", emoji,
			"user_id", userID)
	}

	return nil
}

// RemoveReaction removes a reaction from a feature
func (im *IdeationManager) RemoveReaction(threadID, featureID, emoji, userID string) error {
	im.mu.Lock()
	defer im.mu.Unlock()

	session, exists := im.sessions[threadID]
	if !exists {
		return fmt.Errorf("session not found for thread %s", threadID)
	}

	// Update preferences (decrement but don't go below 0)
	if session.Preferences[emoji] > 0 {
		session.Preferences[emoji]--
	}
	session.LastActivity = time.Now()

	if im.debug {
		slog.Debug("Removed reaction from session",
			"session_id", session.SessionID,
			"feature_id", featureID,
			"emoji", emoji,
			"user_id", userID)
	}

	return nil
}

// SetFeatureMessageTS stores the message timestamp for a feature
func (im *IdeationManager) SetFeatureMessageTS(threadID, featureID, messageTS string) error {
	im.mu.Lock()
	defer im.mu.Unlock()

	session, exists := im.sessions[threadID]
	if !exists {
		return fmt.Errorf("session not found for thread %s", threadID)
	}

	session.MessageTS[featureID] = messageTS

	if im.debug {
		slog.Debug("Set feature message timestamp",
			"session_id", session.SessionID,
			"feature_id", featureID,
			"message_ts", messageTS)
	}

	return nil
}

// GetLikedFeatures returns features that received positive reactions
func (im *IdeationManager) GetLikedFeatures(threadID string) ([]Feature, error) {
	im.mu.RLock()
	defer im.mu.RUnlock()

	session, exists := im.sessions[threadID]
	if !exists {
		return nil, fmt.Errorf("session not found for thread %s", threadID)
	}

	var likedFeatures []Feature
	
	// For now, consider features "liked" if there are any positive reactions
	// In a real implementation, you might want to track reactions per feature
	if session.Preferences["👍"] > 0 || session.Preferences["🔥"] > 0 || session.Preferences["❤️"] > 0 {
		// Return all features for simplicity
		// In practice, you'd want to track which specific features were reacted to
		likedFeatures = session.Features
	}

	return likedFeatures, nil
}

// ShouldExpandIdeas determines if enough feedback has been collected to expand ideas
func (im *IdeationManager) ShouldExpandIdeas(threadID string) bool {
	im.mu.RLock()
	defer im.mu.RUnlock()

	session, exists := im.sessions[threadID]
	if !exists {
		return false
	}

	// Expand ideas if user has given at least 2 positive reactions
	totalPositiveReactions := session.Preferences["👍"] + session.Preferences["🔥"] + session.Preferences["❤️"]
	return totalPositiveReactions >= 2
}

// GetSessionSummary returns a summary of the session for context
func (im *IdeationManager) GetSessionSummary(threadID string) (string, error) {
	im.mu.RLock()
	defer im.mu.RUnlock()

	session, exists := im.sessions[threadID]
	if !exists {
		return "", fmt.Errorf("session not found for thread %s", threadID)
	}

	summary := fmt.Sprintf(`Ideation Session Summary:
- Original Idea: %s
- Features Generated: %d
- User Reactions: 👍 %d, 🔥 %d, ❤️ %d, 👎 %d
- Session Duration: %v
- Total Messages: %d`,
		session.OriginalIdea,
		len(session.Features),
		session.Preferences["👍"],
		session.Preferences["🔥"],
		session.Preferences["❤️"],
		session.Preferences["👎"],
		time.Since(session.CreatedAt).Round(time.Minute),
		len(session.ChatHistory))

	return summary, nil
}

// CleanupOldSessions removes sessions older than the specified duration
func (im *IdeationManager) CleanupOldSessions(maxAge time.Duration) int {
	im.mu.Lock()
	defer im.mu.Unlock()

	var removedCount int
	cutoff := time.Now().Add(-maxAge)

	for threadID, session := range im.sessions {
		if session.LastActivity.Before(cutoff) {
			delete(im.sessions, threadID)
			removedCount++

			if im.debug {
				slog.Debug("Cleaned up old ideation session",
					"session_id", session.SessionID,
					"thread_id", threadID,
					"last_activity", session.LastActivity)
			}
		}
	}

	return removedCount
}

// GetActiveSessions returns the number of active sessions
func (im *IdeationManager) GetActiveSessions() int {
	im.mu.RLock()
	defer im.mu.RUnlock()
	return len(im.sessions)
}

// DeactivateSession marks a session as inactive
func (im *IdeationManager) DeactivateSession(threadID string) error {
	im.mu.Lock()
	defer im.mu.Unlock()

	session, exists := im.sessions[threadID]
	if !exists {
		return fmt.Errorf("session not found for thread %s", threadID)
	}

	session.Active = false
	session.LastActivity = time.Now()

	if im.debug {
		slog.Debug("Deactivated ideation session",
			"session_id", session.SessionID,
			"thread_id", threadID)
	}

	return nil
}