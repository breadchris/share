package slackbot

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"
)

// ThreadContextSummary represents a context summary for a Slack thread
type ThreadContextSummary struct {
	ThreadTS       string                 `json:"thread_ts"`
	ChannelID      string                 `json:"channel_id"`
	SessionType    string                 `json:"session_type"` // "ideation", "claude", "worklet"
	OriginalPrompt string                 `json:"original_prompt"`
	CreatedAt      time.Time              `json:"created_at"`
	LastUpdated    time.Time              `json:"last_updated"`
	LastActivity   time.Time              `json:"last_activity"`
	Summary        string                 `json:"summary"`
	NextSteps      []string               `json:"next_steps"`
	KeyMetrics     map[string]interface{} `json:"key_metrics"`
	PinnedMessage  string                 `json:"pinned_message"` // Timestamp of pinned context message
	UserID         string                 `json:"user_id"`
	Active         bool                   `json:"active"`
}

// UserActivity tracks user activity patterns in threads
type UserActivity struct {
	UserID       string    `json:"user_id"`
	ThreadTS     string    `json:"thread_ts"`
	LastSeen     time.Time `json:"last_seen"`
	MessageCount int       `json:"message_count"`
	SessionStart time.Time `json:"session_start"`
}

// ContextManager manages thread context summaries and user activity
type ContextManager struct {
	summaries  map[string]*ThreadContextSummary // threadTS -> context (memory cache)
	activities map[string]*UserActivity         // userID-threadTS -> activity (memory cache)
	mu         sync.RWMutex
	config     *ContextConfig
	chatgpt    *ChatGPTService
	contextDB  *ContextDBService // Database service for persistence
	debug      bool
}

// ContextConfig holds configuration for context management
type ContextConfig struct {
	Enabled             bool          `json:"enabled"`
	InactivityThreshold time.Duration `json:"inactivity_threshold"`
	ContextUpdateDelay  time.Duration `json:"context_update_delay"`
	AutoPinContext      bool          `json:"auto_pin_context"`
	ContextMaxAge       time.Duration `json:"context_max_age"`
	MaxSummaryLength    int           `json:"max_summary_length"`
	MaxNextSteps        int           `json:"max_next_steps"`
}

// NewContextManager creates a new context manager
func NewContextManager(chatgpt *ChatGPTService, config *ContextConfig, contextDB *ContextDBService, debug bool) *ContextManager {
	if config == nil {
		config = &ContextConfig{
			Enabled:             true,
			InactivityThreshold: 30 * time.Minute,
			ContextUpdateDelay:  5 * time.Second,
			AutoPinContext:      true,
			ContextMaxAge:       24 * time.Hour,
			MaxSummaryLength:    500,
			MaxNextSteps:        4,
		}
	}

	return &ContextManager{
		summaries:  make(map[string]*ThreadContextSummary),
		activities: make(map[string]*UserActivity),
		config:     config,
		chatgpt:    chatgpt,
		contextDB:  contextDB,
		debug:      debug,
	}
}

// CreateContext creates a new context summary for a thread
func (cm *ContextManager) CreateContext(threadTS, channelID, userID, sessionType, originalPrompt string) *ThreadContextSummary {
	// Create in database first
	if cm.contextDB != nil {
		context, err := cm.contextDB.CreateContext(threadTS, channelID, userID, sessionType, originalPrompt)
		if err != nil {
			slog.Error("Failed to create context in database", "error", err, "thread_ts", threadTS)
			// Fall back to in-memory only
		} else {
			// Store in memory cache as well
			cm.mu.Lock()
			cm.summaries[threadTS] = context
			cm.mu.Unlock()
			
			if cm.debug {
				slog.Debug("Created thread context in database",
					"thread_ts", threadTS,
					"session_type", sessionType,
					"user_id", userID)
			}
			
			return context
		}
	}

	// Fallback to in-memory only creation
	cm.mu.Lock()
	defer cm.mu.Unlock()

	context := &ThreadContextSummary{
		ThreadTS:       threadTS,
		ChannelID:      channelID,
		SessionType:    sessionType,
		OriginalPrompt: originalPrompt,
		CreatedAt:      time.Now(),
		LastUpdated:    time.Now(),
		LastActivity:   time.Now(),
		Summary:        "",
		NextSteps:      []string{},
		KeyMetrics:     make(map[string]interface{}),
		UserID:         userID,
		Active:         true,
	}

	cm.summaries[threadTS] = context

	if cm.debug {
		slog.Debug("Created thread context (in-memory fallback)",
			"thread_ts", threadTS,
			"session_type", sessionType,
			"user_id", userID)
	}

	return context
}

// GetContext retrieves a context summary for a thread
func (cm *ContextManager) GetContext(threadTS string) (*ThreadContextSummary, bool) {
	// First check memory cache
	cm.mu.RLock()
	if context, exists := cm.summaries[threadTS]; exists {
		cm.mu.RUnlock()
		return context, true
	}
	cm.mu.RUnlock()

	// Check database if not in memory
	if cm.contextDB != nil {
		context, err := cm.contextDB.GetContext(threadTS)
		if err != nil {
			if cm.debug {
				slog.Error("Failed to get context from database", "error", err, "thread_ts", threadTS)
			}
			return nil, false
		}
		if context != nil {
			// Store in memory cache for future access
			cm.mu.Lock()
			cm.summaries[threadTS] = context
			cm.mu.Unlock()
			return context, true
		}
	}

	return nil, false
}

// UpdateContext updates an existing context summary
func (cm *ContextManager) UpdateContext(threadTS string, updates map[string]interface{}) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	context, exists := cm.summaries[threadTS]
	if !exists {
		return fmt.Errorf("context not found for thread %s", threadTS)
	}

	// Update fields based on the updates map
	for key, value := range updates {
		switch key {
		case "summary":
			if v, ok := value.(string); ok {
				context.Summary = v
			}
		case "next_steps":
			if v, ok := value.([]string); ok {
				context.NextSteps = v
			}
		case "key_metrics":
			if v, ok := value.(map[string]interface{}); ok {
				for metricKey, metricValue := range v {
					context.KeyMetrics[metricKey] = metricValue
				}
			}
		case "active":
			if v, ok := value.(bool); ok {
				context.Active = v
			}
		case "pinned_message":
			if v, ok := value.(string); ok {
				context.PinnedMessage = v
			}
		}
	}

	context.LastUpdated = time.Now()
	context.LastActivity = time.Now()

	if cm.debug {
		slog.Debug("Updated thread context",
			"thread_ts", threadTS,
			"updates", len(updates))
	}

	return nil
}

// TrackUserActivity tracks user activity in a thread
func (cm *ContextManager) TrackUserActivity(userID, threadTS string) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	activityKey := fmt.Sprintf("%s-%s", userID, threadTS)
	activity, exists := cm.activities[activityKey]

	if !exists {
		activity = &UserActivity{
			UserID:       userID,
			ThreadTS:     threadTS,
			LastSeen:     time.Now(),
			MessageCount: 1,
			SessionStart: time.Now(),
		}
		cm.activities[activityKey] = activity
	} else {
		activity.LastSeen = time.Now()
		activity.MessageCount++
	}

	// Update thread context last activity
	if context, exists := cm.summaries[threadTS]; exists {
		context.LastActivity = time.Now()
	}

	if cm.debug {
		slog.Debug("Tracked user activity",
			"user_id", userID,
			"thread_ts", threadTS,
			"message_count", activity.MessageCount)
	}
}

// ShouldShowContext determines if context should be shown based on user activity
func (cm *ContextManager) ShouldShowContext(userID, threadTS string) bool {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	if !cm.config.Enabled {
		return false
	}

	activityKey := fmt.Sprintf("%s-%s", userID, threadTS)
	activity, exists := cm.activities[activityKey]

	if !exists {
		// First time user in this thread
		return true
	}

	// Show context if user has been inactive for more than threshold
	timeSinceLastSeen := time.Since(activity.LastSeen)
	return timeSinceLastSeen > cm.config.InactivityThreshold
}

// GenerateContextSummary creates a context summary using ChatGPT
func (cm *ContextManager) GenerateContextSummary(ctx context.Context, threadTS string, sessionData interface{}) error {
	context, exists := cm.GetContext(threadTS)
	if !exists {
		return fmt.Errorf("context not found for thread %s", threadTS)
	}

	// Generate summary based on session type
	var summary string
	var nextSteps []string
	var keyMetrics map[string]interface{}
	var err error

	switch context.SessionType {
	case "ideation":
		summary, nextSteps, keyMetrics, err = cm.generateIdeationSummary(ctx, sessionData)
	case "claude":
		summary, nextSteps, keyMetrics, err = cm.generateClaudeSummary(ctx, sessionData)
	case "worklet":
		summary, nextSteps, keyMetrics, err = cm.generateWorkletSummary(ctx, sessionData)
	default:
		summary, nextSteps, keyMetrics, err = cm.generateGenericSummary(ctx, context, sessionData)
	}

	if err != nil {
		return fmt.Errorf("failed to generate context summary: %w", err)
	}

	// Update context with generated summary
	updates := map[string]interface{}{
		"summary":     summary,
		"next_steps":  nextSteps,
		"key_metrics": keyMetrics,
	}

	return cm.UpdateContext(threadTS, updates)
}

// generateIdeationSummary creates a summary for ideation sessions
func (cm *ContextManager) generateIdeationSummary(ctx context.Context, sessionData interface{}) (string, []string, map[string]interface{}, error) {
	ideationSession, ok := sessionData.(*IdeationSession)
	if !ok {
		return "", nil, nil, fmt.Errorf("invalid session data for ideation summary")
	}

	// Calculate metrics
	totalFeatures := len(ideationSession.Features)
	positiveReactions := ideationSession.Preferences["👍"] + ideationSession.Preferences["🔥"] + ideationSession.Preferences["❤️"]
	sessionDuration := time.Since(ideationSession.CreatedAt)

	// Generate categories breakdown
	categories := make(map[string]int)
	for _, feature := range ideationSession.Features {
		categories[feature.Category]++
	}

	// Create summary prompt for ChatGPT
	prompt := fmt.Sprintf(`Create a concise context summary for this ideation session:

Original Idea: %s
Features Generated: %d
Positive Reactions: %d (👍: %d, 🔥: %d, ❤️: %d)
Session Duration: %v
Categories: %v

Provide:
1. A brief summary (max 100 words) of the session progress
2. Up to 4 next steps the user could take
3. Key insights about user preferences

Format as JSON with fields: summary, next_steps, insights`,
		ideationSession.OriginalIdea,
		totalFeatures,
		positiveReactions,
		ideationSession.Preferences["👍"],
		ideationSession.Preferences["🔥"],
		ideationSession.Preferences["❤️"],
		sessionDuration.Round(time.Minute),
		categories)

	// Use ChatGPT to generate the summary
	response, err := cm.generateSummaryWithChatGPT(ctx, prompt)
	if err != nil {
		// Fallback to simple summary
		summary := fmt.Sprintf("Exploring: %s • %d features generated • %d positive reactions",
			ideationSession.OriginalIdea, totalFeatures, positiveReactions)
		nextSteps := []string{
			"Continue reacting to features with emojis",
			"Use /flow to start implementation",
		}
		keyMetrics := map[string]interface{}{
			"total_features":     totalFeatures,
			"positive_reactions": positiveReactions,
			"session_duration":   sessionDuration.String(),
			"categories":         categories,
		}
		return summary, nextSteps, keyMetrics, nil
	}

	return response.Summary, response.NextSteps, map[string]interface{}{
		"total_features":     totalFeatures,
		"positive_reactions": positiveReactions,
		"session_duration":   sessionDuration.String(),
		"categories":         categories,
	}, nil
}

// generateClaudeSummary creates a summary for Claude sessions
func (cm *ContextManager) generateClaudeSummary(ctx context.Context, sessionData interface{}) (string, []string, map[string]interface{}, error) {
	claudeSession, ok := sessionData.(*SlackClaudeSession)
	if !ok {
		return "", nil, nil, fmt.Errorf("invalid session data for Claude summary")
	}

	sessionDuration := time.Since(claudeSession.LastActivity)

	summary := fmt.Sprintf("Claude session • Working directory: %s • Last active: %v ago",
		claudeSession.Context, sessionDuration.Round(time.Minute))

	nextSteps := []string{
		"Continue conversation with Claude",
		"Ask Claude to explain recent changes",
	}

	keyMetrics := map[string]interface{}{
		"session_id":        claudeSession.SessionID,
		"working_directory": claudeSession.Context,
		"session_duration":  sessionDuration.String(),
		"active":            claudeSession.Active,
	}

	return summary, nextSteps, keyMetrics, nil
}

// generateWorkletSummary creates a summary for worklet sessions
func (cm *ContextManager) generateWorkletSummary(ctx context.Context, sessionData interface{}) (string, []string, map[string]interface{}, error) {
	// This would be implemented when worklet data structure is available
	summary := "Worklet session • Repository-based development"
	nextSteps := []string{
		"Check worklet deployment status",
		"Review generated code changes",
	}
	keyMetrics := map[string]interface{}{
		"type": "worklet",
	}

	return summary, nextSteps, keyMetrics, nil
}

// generateGenericSummary creates a fallback summary
func (cm *ContextManager) generateGenericSummary(ctx context.Context, context *ThreadContextSummary, sessionData interface{}) (string, []string, map[string]interface{}, error) {
	sessionDuration := time.Since(context.CreatedAt)

	summary := fmt.Sprintf("%s session • Started %v ago",
		strings.Title(context.SessionType),
		sessionDuration.Round(time.Minute))

	nextSteps := []string{
		"Continue working on your task",
		"Ask for help if needed",
	}

	keyMetrics := map[string]interface{}{
		"session_duration": sessionDuration.String(),
		"session_type":     context.SessionType,
	}

	return summary, nextSteps, keyMetrics, nil
}

// ChatGPTSummaryResponse represents the structured response from ChatGPT for summaries
type ChatGPTSummaryResponse struct {
	Summary   string   `json:"summary"`
	NextSteps []string `json:"next_steps"`
	Insights  string   `json:"insights"`
}

// generateSummaryWithChatGPT uses ChatGPT to generate intelligent summaries
func (cm *ContextManager) generateSummaryWithChatGPT(ctx context.Context, prompt string) (*ChatGPTSummaryResponse, error) {
	if cm.chatgpt == nil {
		return &ChatGPTSummaryResponse{
			Summary:   "Session in progress",
			NextSteps: []string{"Continue working"},
			Insights:  "User is actively engaged",
		}, nil
	}

	// Use the enhanced ChatGPT service for context generation
	response, err := cm.chatgpt.GenerateContextSummary(ctx, "ideation", prompt)
	if err != nil {
		return nil, err
	}

	return &ChatGPTSummaryResponse{
		Summary:   response.Summary,
		NextSteps: response.NextSteps,
		Insights:  response.Insights,
	}, nil
}

// FormatContextMessage formats a context summary for display in Slack
func (cm *ContextManager) FormatContextMessage(context *ThreadContextSummary) string {
	sessionEmoji := map[string]string{
		"ideation": "🧠",
		"claude":   "🤖",
		"worklet":  "🚀",
	}

	emoji := sessionEmoji[context.SessionType]
	if emoji == "" {
		emoji = "📝"
	}

	var message strings.Builder

	// Header with session type and status
	if context.Active {
		message.WriteString(fmt.Sprintf("%s **%s Session** • Active\n", emoji, strings.Title(context.SessionType)))
	} else {
		message.WriteString(fmt.Sprintf("%s **%s Session** • Completed\n", emoji, strings.Title(context.SessionType)))
	}

	// Original prompt/idea
	message.WriteString(fmt.Sprintf("💡 **Original:** %s\n\n", context.OriginalPrompt))

	// Summary
	if context.Summary != "" {
		message.WriteString(fmt.Sprintf("📋 **Progress:** %s\n\n", context.Summary))
	}

	// Key metrics (simplified display)
	if len(context.KeyMetrics) > 0 {
		message.WriteString("📊 **Stats:** ")
		var stats []string
		for key, value := range context.KeyMetrics {
			switch key {
			case "total_features":
				stats = append(stats, fmt.Sprintf("%v features", value))
			case "positive_reactions":
				stats = append(stats, fmt.Sprintf("%v reactions", value))
			case "session_duration":
				if duration, ok := value.(string); ok && duration != "" {
					stats = append(stats, fmt.Sprintf("Active %v", duration))
				}
			}
		}
		message.WriteString(strings.Join(stats, " • "))
		message.WriteString("\n\n")
	}

	// Next steps
	if len(context.NextSteps) > 0 {
		message.WriteString("➡️ **What's next:**\n")
		for _, step := range context.NextSteps {
			message.WriteString(fmt.Sprintf("• %s\n", step))
		}
	}

	// Footer with last update time
	message.WriteString(fmt.Sprintf("\n*Last updated: %s*",
		context.LastUpdated.Format("3:04 PM")))

	return message.String()
}

// CleanupOldContexts removes old context summaries
func (cm *ContextManager) CleanupOldContexts() int {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	var removedCount int
	cutoff := time.Now().Add(-cm.config.ContextMaxAge)

	for threadTS, context := range cm.summaries {
		if context.LastActivity.Before(cutoff) {
			delete(cm.summaries, threadTS)
			removedCount++

			if cm.debug {
				slog.Debug("Cleaned up old context",
					"thread_ts", threadTS,
					"session_type", context.SessionType,
					"last_activity", context.LastActivity)
			}
		}
	}

	// Also cleanup old activities
	for activityKey, activity := range cm.activities {
		if activity.LastSeen.Before(cutoff) {
			delete(cm.activities, activityKey)
		}
	}

	return removedCount
}

// GetActiveContexts returns the number of active contexts
func (cm *ContextManager) GetActiveContexts() int {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return len(cm.summaries)
}
