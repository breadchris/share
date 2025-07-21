package slackbot

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/breadchris/flow/claude"
	"github.com/breadchris/flow/config"
	"github.com/breadchris/flow/deps"
	"github.com/breadchris/flow/worklet"
	"github.com/google/uuid"
	"github.com/slack-go/slack"
	"github.com/slack-go/slack/slackevents"
	"github.com/slack-go/slack/socketmode"
)

// SlackBot manages Slack interactions and Claude sessions
type SlackBot struct {
	client             *slack.Client
	socketMode         *socketmode.Client
	claudeService      *claude.ClaudeService // Updated to use database-integrated service
	workletManager     *worklet.Manager
	chatgptService     *ChatGPTService
	ideationManager    *IdeationManager
	contextManager     *ContextManager
	sessionDB          *SessionDBService              // Database service for sessions
	contextDB          *ContextDBService              // Database service for contexts
	fileManager        *FileManager                   // File management service for uploads
	rateLimiter        *MessageRateLimiter            // Rate limiter for messages
	sessions           map[string]*SlackClaudeSession // thread_ts -> session (temporary for process references)
	mu                 sync.RWMutex
	config             *config.SlackBotConfig
	appConfig          *config.AppConfig // Application config for external URL access
	ctx                context.Context
	cancel             context.CancelFunc
	channelWhitelist   *ChannelWhitelist       // Channel access control
	sessionCache       *SlackBotSessionCache   // Session cache
	sessionActivityMgr *SessionActivityManager // Session activity manager with error handling
	wg                 sync.WaitGroup          // Wait group for tracking goroutines
	botUserID          string                  // Bot's own user ID to filter out self-messages
}

// SlackClaudeSession represents a Claude session tied to a Slack thread
type SlackClaudeSession struct {
	ThreadTS     string              `json:"thread_ts"`
	ChannelID    string              `json:"channel_id"`
	UserID       string              `json:"user_id"`
	SessionID    string              `json:"session_id"` // Claude session ID
	ProcessID    string              `json:"process_id"` // Claude process correlation ID
	LastActivity time.Time           `json:"last_activity"`
	Context      string              `json:"context"` // Working directory context
	Active       bool                `json:"active"`  // Whether the session is currently active
	Resumed      bool                `json:"resumed"` // Whether this session was resumed
	Process      *claude.Process     `json:"-"`       // Active Claude process (not serialized)
	SessionInfo  *claude.SessionInfo `json:"-"`       // Database session info (not serialized)
}

// New creates a new SlackBot instance
func New(d deps.Deps) (*SlackBot, error) {
	slackConfig := d.Config.GetSlackBotConfig()
	if !d.Config.IsSlackBotEnabled() {
		return nil, fmt.Errorf("slack bot is disabled")
	}

	// Create Slack client
	client := slack.New(
		slackConfig.BotToken,
		slack.OptionDebug(slackConfig.Debug),
		slack.OptionAppLevelToken(slackConfig.SlackToken),
	)
	// Create socket mode client
	socketClient := socketmode.New(
		client,
		socketmode.OptionDebug(slackConfig.Debug),
	)

	// Create database-integrated Claude service
	claudeService := claude.NewClaudeService(d)

	// Create worklet manager
	workletManager := worklet.NewManager(&d)

	// Create ChatGPT service
	chatgptService := NewChatGPTService(d.AI, slackConfig.Debug)

	// Create ideation manager
	ideationManager := NewIdeationManager(slackConfig.Debug)

	// Create context manager with default configuration
	contextConfig := &ContextConfig{
		Enabled:             true,
		InactivityThreshold: 30 * time.Minute,
		ContextUpdateDelay:  5 * time.Second,
		AutoPinContext:      true,
		ContextMaxAge:       24 * time.Hour,
		MaxSummaryLength:    500,
		MaxNextSteps:        4,
	}
	// Create database services
	sessionDB := NewSessionDBService(d.DB, slackConfig.Debug)
	contextDB := NewContextDBService(d.DB, slackConfig.Debug)
	fileManager := NewFileManager(d.DB, slackConfig.Debug, 7*24*time.Hour) // Keep files for 7 days
	rateLimiter := NewMessageRateLimiter(10, 1*time.Minute)                // 10 messages per minute per user

	contextManager := NewContextManager(chatgptService, contextConfig, contextDB, slackConfig.Debug)

	ctx, cancel := context.WithCancel(context.Background())

	// Create channel whitelist
	channelWhitelist, err := NewChannelWhitelist(slackConfig.ChannelWhitelist, slackConfig.Debug)
	if err != nil {
		return nil, fmt.Errorf("failed to create channel whitelist: %w", err)
	}

	// Create session cache
	sessionCache := NewSlackBotSessionCache()

	// Create session activity manager
	sessionActivityMgr := NewSessionActivityManager(sessionDB, sessionCache, slackConfig.Debug)

	bot := &SlackBot{
		client:             client,
		socketMode:         socketClient,
		claudeService:      claudeService,
		workletManager:     workletManager,
		chatgptService:     chatgptService,
		ideationManager:    ideationManager,
		contextManager:     contextManager,
		sessionDB:          sessionDB,
		contextDB:          contextDB,
		fileManager:        fileManager,
		rateLimiter:        rateLimiter,
		sessions:           make(map[string]*SlackClaudeSession),
		config:             slackConfig,
		appConfig:          &d.Config,
		ctx:                ctx,
		cancel:             cancel,
		channelWhitelist:   channelWhitelist,
		sessionCache:       sessionCache,
		sessionActivityMgr: sessionActivityMgr,
	}

	// Get bot's own user ID to filter out self-messages
	authResponse, err := client.AuthTest()
	if err != nil {
		return nil, fmt.Errorf("failed to get bot user ID: %w", err)
	}
	bot.botUserID = authResponse.UserID

	if slackConfig.Debug {
		slog.Debug("SlackBot initialized", 
			"bot_user_id", bot.botUserID,
			"bot_user", authResponse.User)
	}

	return bot, nil
}

// Start begins listening for Slack events
func (b *SlackBot) Start(ctx context.Context) error {
	slog.Info("Starting Slack bot", "debug", b.config.Debug)

	// Start session cleanup goroutine
	b.wg.Add(1)
	go func() {
		defer b.wg.Done()
		b.cleanupSessions()
	}()

	// Start context cleanup goroutine
	if b.contextManager != nil {
		b.wg.Add(1)
		go func() {
			defer b.wg.Done()
			b.cleanupContexts()
		}()
	}

	// Start file cleanup goroutine
	if b.fileManager != nil {
		b.wg.Add(1)
		go func() {
			defer b.wg.Done()
			b.cleanupFiles()
		}()
	}

	// Start rate limiter cleanup goroutine
	if b.rateLimiter != nil {
		b.wg.Add(1)
		go func() {
			defer b.wg.Done()
			b.cleanupRateLimiter()
		}()
	}

	// Handle socket mode events
	b.wg.Add(1)
	go func() {
		defer b.wg.Done()
		defer func() {
			if b.config.Debug {
				slog.Debug("Event processing goroutine shutting down")
			}
		}()

		for {
			select {
			case <-b.ctx.Done():
				if b.config.Debug {
					slog.Debug("Event processing stopped due to context cancellation")
				}
				return
			case evt, ok := <-b.socketMode.Events:
				if !ok {
					if b.config.Debug {
						slog.Debug("Socket mode events channel closed")
					}
					return
				}

				switch evt.Type {
				case socketmode.EventTypeConnecting:
					slog.Info("Slack bot connecting...")

				case socketmode.EventTypeConnectionError:
					slog.Error("Slack bot connection error", "error", evt.Data)

				case socketmode.EventTypeConnected:
					slog.Info("Slack bot connected")

				case socketmode.EventTypeSlashCommand:
					cmd, ok := evt.Data.(slack.SlashCommand)
					if !ok {
						slog.Error("Failed to type assert slash command")
						continue
					}
					b.handleSlashCommand(&evt, &cmd)

				case socketmode.EventTypeEventsAPI:
					eventsAPIEvent, ok := evt.Data.(slackevents.EventsAPIEvent)
					if !ok {
						slog.Error("Failed to type assert events API event")
						continue
					}
					b.handleEventsAPI(&evt, &eventsAPIEvent)

				default:
					if b.config.Debug {
						slog.Debug("Unhandled socket mode event", "type", evt.Type)
					}
				}
			}
		}
	}()

	// Start the socket mode client with context support
	return b.socketMode.RunContext(b.ctx)
}

// Stop gracefully shuts down the bot
func (b *SlackBot) Stop() error {
	slog.Info("Stopping Slack bot")

	// Cancel context to stop goroutines
	b.cancel()

	// Wait for all goroutines to finish with timeout
	done := make(chan struct{})
	go func() {
		b.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		slog.Info("All SlackBot goroutines stopped gracefully")
	case <-time.After(10 * time.Second):
		slog.Warn("Timeout waiting for SlackBot goroutines to stop")
	}

	// Close all active Claude sessions
	b.mu.Lock()
	for _, session := range b.sessions {
		session.Active = false
		// TODO: Properly close Claude sessions when that API is available
	}
	b.mu.Unlock()

	slog.Info("Slack bot stopped")
	return nil
}

// getSession retrieves a session by thread timestamp from database
func (b *SlackBot) getSession(threadTS string) (*SlackClaudeSession, bool) {
	// First check in-memory cache for active processes
	b.mu.RLock()
	if session, exists := b.sessions[threadTS]; exists && session.Process != nil {
		b.mu.RUnlock()
		return session, true
	}
	b.mu.RUnlock()

	// Check database for persistent session data
	session, err := b.sessionDB.GetSession(threadTS)
	if err != nil {
		if b.config.Debug {
			slog.Error("Failed to get session from database", "error", err, "thread_ts", threadTS)
		}
		return nil, false
	}
	if session == nil {
		return nil, false
	}

	// Store in memory cache for future access
	b.mu.Lock()
	b.sessions[threadTS] = session
	b.mu.Unlock()

	return session, true
}

// setSession stores a session by thread timestamp in both database and memory
func (b *SlackBot) setSession(threadTS string, session *SlackClaudeSession) {
	// Store in database for persistence
	if err := b.sessionDB.SetSession(session); err != nil {
		slog.Error("Failed to store session in database", "error", err, "thread_ts", threadTS)
		// Continue with in-memory storage even if database fails
	}

	// Store in new session cache
	b.sessionCache.SetSession(threadTS, session)

	// Store in legacy memory cache for backward compatibility
	// TODO: Remove this once all session access goes through the new cache
	b.mu.Lock()
	defer b.mu.Unlock()

	// Check max sessions limit for in-memory cache
	if len(b.sessions) >= b.config.MaxSessions {
		// Remove oldest inactive session from memory (database keeps them)
		var oldestTS string
		var oldestTime time.Time
		for ts, s := range b.sessions {
			if !s.Active && (oldestTS == "" || s.LastActivity.Before(oldestTime)) {
				oldestTS = ts
				oldestTime = s.LastActivity
			}
		}
		if oldestTS != "" {
			delete(b.sessions, oldestTS)
			slog.Info("Removed oldest session from memory cache", "thread_ts", oldestTS)
		}
	}

	b.sessions[threadTS] = session
}

// removeSession removes a session by thread timestamp from both database and memory
func (b *SlackBot) removeSession(threadTS string) {
	// Mark as inactive in database
	if err := b.sessionDB.RemoveSession(threadTS); err != nil {
		slog.Error("Failed to remove session from database", "error", err, "thread_ts", threadTS)
	}

	// Remove from new session cache
	b.sessionCache.Remove(threadTS)

	// Remove from legacy memory cache
	b.mu.Lock()
	defer b.mu.Unlock()
	delete(b.sessions, threadTS)
}

// cleanupSessions periodically removes inactive sessions
func (b *SlackBot) cleanupSessions() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Cleanup database sessions
			if err := b.sessionDB.CleanupInactiveSessions(b.config.SessionTimeout); err != nil {
				slog.Error("Failed to cleanup database sessions", "error", err)
			}

			// Cleanup memory cache sessions
			b.mu.Lock()
			for threadTS, session := range b.sessions {
				if time.Since(session.LastActivity) > b.config.SessionTimeout {
					delete(b.sessions, threadTS)
					session.Active = false
					slog.Info("Cleaned up inactive session from memory",
						"thread_ts", threadTS,
						"session_id", session.SessionID,
						"idle_time", time.Since(session.LastActivity))
				}
			}
			b.mu.Unlock()

		case <-b.ctx.Done():
			return
		}
	}
}

// cleanupContexts periodically removes old context summaries
func (b *SlackBot) cleanupContexts() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Cleanup database contexts
			if err := b.contextDB.CleanupOldContexts(24 * time.Hour); err != nil {
				slog.Error("Failed to cleanup database contexts", "error", err)
			}

			// Cleanup in-memory contexts if contextManager exists
			if b.contextManager != nil {
				removedCount := b.contextManager.CleanupOldContexts()
				if removedCount > 0 && b.config.Debug {
					slog.Debug("Cleaned up old contexts from memory", "removed_count", removedCount)
				}
			}

		case <-b.ctx.Done():
			return
		}
	}
}

// cleanupFiles periodically removes old uploaded files
func (b *SlackBot) cleanupFiles() {
	ticker := time.NewTicker(30 * time.Minute) // Run every 30 minutes
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Cleanup old files
			if err := b.fileManager.CleanupOldFiles(); err != nil {
				slog.Error("Failed to cleanup old files", "error", err)
			}

			// Cleanup empty directories
			if err := b.fileManager.CleanupEmptyDirectories(); err != nil {
				slog.Error("Failed to cleanup empty directories", "error", err)
			}

			// Log file upload statistics if debug mode is enabled
			if b.config.Debug {
				if stats, err := b.fileManager.GetFileUploadStats(); err == nil {
					slog.Debug("File upload statistics", "stats", stats)
				}
			}

		case <-b.ctx.Done():
			return
		}
	}
}

// cleanupRateLimiter periodically cleans up expired rate limit entries
func (b *SlackBot) cleanupRateLimiter() {
	ticker := time.NewTicker(5 * time.Minute) // Run every 5 minutes
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Cleanup expired rate limit entries
			b.rateLimiter.CleanupExpiredEntries()

			if b.config.Debug {
				slog.Debug("Cleaned up expired rate limit entries")
			}

		case <-b.ctx.Done():
			return
		}
	}
}

// updateSessionActivity updates the last activity time for a session
func (b *SlackBot) updateSessionActivity(threadTS string) {
	// Use the new session activity manager with proper error handling
	if err := b.sessionActivityMgr.UpdateActivity(threadTS); err != nil {
		// SessionActivityManager already handles logging appropriately based on error type
		// Only log debug info if additional context is helpful
		if b.config.Debug {
			info := b.sessionActivityMgr.GetSessionInfo(threadTS)
			slog.Debug("Session activity update failed, session info",
				"thread_ts", threadTS,
				"error", err,
				"session_info", info)
		}
	}

	// Still update the legacy in-memory cache for backward compatibility
	// TODO: Remove this once all session access goes through the new cache
	b.mu.Lock()
	defer b.mu.Unlock()
	if session, exists := b.sessions[threadTS]; exists {
		session.LastActivity = time.Now()
	}
}

// createSessionID generates a unique session ID
func (b *SlackBot) createSessionID(userID string) (string, string) {
	sessionID := uuid.New().String()
	correlationID := fmt.Sprintf("slack-%s-%s", userID, sessionID[:8])
	return sessionID, correlationID
}

// isChannelAllowed checks if a channel ID matches the whitelist patterns
func (b *SlackBot) isChannelAllowed(channelID string) bool {
	return b.channelWhitelist.IsAllowed(channelID)
}

// getExternalURL returns the configured external URL for component access
func (b *SlackBot) getExternalURL() string {
	if b.appConfig != nil && b.appConfig.ExternalURL != "" {
		return b.appConfig.ExternalURL
	}
	return "http://localhost:8080" // Default fallback
}
