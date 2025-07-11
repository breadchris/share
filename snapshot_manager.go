package main

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/breadchris/share/config"
	"github.com/breadchris/share/models"
	"github.com/breadchris/share/snapshot"
	"gorm.io/gorm"
)

// SnapshotManager manages the lifecycle of snapshot workers
type SnapshotManager struct {
	mu                sync.RWMutex
	snapshotter       *ComponentSnapshotter
	watcher           *ComponentWatcher
	config            *config.AppConfig
	db                *gorm.DB
	isRunning         bool
	ctx               context.Context
	cancel            context.CancelFunc
	activeSessions    map[string]bool // sessionID -> monitoring
	sessionMonitorWG  sync.WaitGroup
}

// NewSnapshotManager creates a new snapshot manager
func NewSnapshotManager(appConfig *config.AppConfig, db *gorm.DB) *SnapshotManager {
	ctx, cancel := context.WithCancel(context.Background())
	
	return &SnapshotManager{
		config:         appConfig,
		db:            db,
		ctx:           ctx,
		cancel:        cancel,
		activeSessions: make(map[string]bool),
	}
}

// Start initializes and starts the snapshot workers based on configuration
func (sm *SnapshotManager) Start(port int) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.isRunning {
		return nil // Already running
	}

	if !sm.config.ShouldStartSnapshotWorkers() {
		log.Printf("Snapshot workers disabled in configuration (enabled: %v, mode: %s)", 
			sm.config.SnapshotEnabled(), sm.config.SnapshotMode())
		return nil
	}

	// Create snapshot configuration
	snapshotConfig := snapshot.SnapshotConfig{
		DefaultTimeout:   30 * time.Second,
		BaseURL:          sm.config.ExternalURL,
		OutputDir:        "./data/snapshots",
		DefaultViewports: snapshot.DefaultViewports,
	}

	if snapshotConfig.BaseURL == "" {
		snapshotConfig.BaseURL = fmt.Sprintf("http://localhost:%d", port)
	}

	// Create snapshotter
	snapshotter, err := NewComponentSnapshotter(snapshotConfig)
	if err != nil {
		return fmt.Errorf("failed to create component snapshotter: %w", err)
	}
	sm.snapshotter = snapshotter

	// Create watcher configuration
	watcherConfig := snapshot.DefaultComponentWatcherConfig()
	
	// Adjust watcher config based on app configuration
	if sm.config.SnapshotMode() == "claude-session" {
		watcherConfig.AutoSnapshot = false // We'll control this manually
	}

	// Create watcher
	watcher, err := NewComponentWatcher(snapshotter, watcherConfig)
	if err != nil {
		return fmt.Errorf("failed to create component watcher: %w", err)
	}
	sm.watcher = watcher

	// Start watcher
	if err := watcher.Start(); err != nil {
		return fmt.Errorf("failed to start component watcher: %w", err)
	}

	sm.isRunning = true
	
	// Start Claude session monitoring if needed
	if sm.config.SnapshotMode() == "claude-session" {
		go sm.monitorClaudeSessions()
	}
	
	// Set initial session filter if specified in config
	if len(sm.config.Snapshot.SessionFilter) > 0 {
		sm.watcher.SetSessionFilter(sm.config.Snapshot.SessionFilter)
	}

	log.Printf("Snapshot workers started (mode: %s, enabled: %v)", 
		sm.config.SnapshotMode(), sm.config.SnapshotEnabled())
	
	return nil
}

// Stop stops the snapshot workers
func (sm *SnapshotManager) Stop() error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if !sm.isRunning {
		return nil // Already stopped
	}

	// Cancel context to stop session monitoring
	sm.cancel()
	
	// Wait for session monitoring to finish
	sm.sessionMonitorWG.Wait()

	// Stop watcher
	if sm.watcher != nil {
		sm.watcher.Stop()
	}

	// Close snapshotter
	if sm.snapshotter != nil {
		sm.snapshotter.Close()
	}

	sm.isRunning = false
	sm.snapshotter = nil
	sm.watcher = nil
	
	log.Printf("Snapshot workers stopped")
	return nil
}

// IsRunning returns whether the snapshot workers are currently running
func (sm *SnapshotManager) IsRunning() bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.isRunning
}

// GetStatus returns the current status of the snapshot manager
func (sm *SnapshotManager) GetStatus() map[string]interface{} {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	status := map[string]interface{}{
		"running":          sm.isRunning,
		"enabled":          sm.config.SnapshotEnabled(),
		"mode":             sm.config.SnapshotMode(),
		"active_sessions":  len(sm.activeSessions),
		"session_filter":   sm.config.Snapshot.SessionFilter,
		"claude_only":      sm.config.Snapshot.ClaudeSessionOnly,
	}

	if sm.isRunning {
		status["snapshotter_running"] = sm.snapshotter != nil
		status["watcher_running"] = sm.watcher != nil
	}

	return status
}

// monitorClaudeSessions watches for active Claude sessions and adjusts monitoring
func (sm *SnapshotManager) monitorClaudeSessions() {
	sm.sessionMonitorWG.Add(1)
	defer sm.sessionMonitorWG.Done()

	ticker := time.NewTicker(30 * time.Second) // Check every 30 seconds
	defer ticker.Stop()

	for {
		select {
		case <-sm.ctx.Done():
			return
		case <-ticker.C:
			sm.checkActiveClaudeSessions()
		}
	}
}

// checkActiveClaudeSessions queries the database for active Claude sessions
func (sm *SnapshotManager) checkActiveClaudeSessions() {
	var sessions []models.ClaudeSession
	
	// Query for Claude sessions that were active in the last hour
	cutoff := time.Now().Add(-1 * time.Hour)
	if err := sm.db.Where("updated_at > ?", cutoff).Find(&sessions).Error; err != nil {
		log.Printf("Error querying Claude sessions: %v", err)
		return
	}

	sm.mu.Lock()
	defer sm.mu.Unlock()

	// Clear previous session tracking
	sm.activeSessions = make(map[string]bool)

	// Track currently active sessions
	for _, session := range sessions {
		sm.activeSessions[session.SessionID] = true
	}

	// If we have a session filter, only monitor those sessions
	if len(sm.config.Snapshot.SessionFilter) > 0 {
		filtered := make(map[string]bool)
		for _, sessionID := range sm.config.Snapshot.SessionFilter {
			if sm.activeSessions[sessionID] {
				filtered[sessionID] = true
			}
		}
		sm.activeSessions = filtered
	}

	// Update the watcher's session filter
	if sm.watcher != nil {
		activeSessionIDs := make([]string, 0, len(sm.activeSessions))
		for sessionID := range sm.activeSessions {
			activeSessionIDs = append(activeSessionIDs, sessionID)
		}
		sm.watcher.SetSessionFilter(activeSessionIDs)
	}

	log.Printf("Active Claude sessions being monitored: %v", len(sm.activeSessions))
}

// AddSessionToMonitor adds a specific session to be monitored
func (sm *SnapshotManager) AddSessionToMonitor(sessionID string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	if sm.activeSessions == nil {
		sm.activeSessions = make(map[string]bool)
	}
	
	sm.activeSessions[sessionID] = true
	
	// Update the watcher's session filter
	if sm.watcher != nil {
		sm.watcher.AddSessionToFilter(sessionID)
	}
	
	log.Printf("Added session %s to monitoring", sessionID)
}

// RemoveSessionFromMonitor removes a specific session from monitoring
func (sm *SnapshotManager) RemoveSessionFromMonitor(sessionID string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	delete(sm.activeSessions, sessionID)
	
	// Update the watcher's session filter
	if sm.watcher != nil {
		sm.watcher.RemoveSessionFromFilter(sessionID)
	}
	
	log.Printf("Removed session %s from monitoring", sessionID)
}

// ShouldMonitorSession returns whether a given session should be monitored
func (sm *SnapshotManager) ShouldMonitorSession(sessionID string) bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if !sm.isRunning {
		return false
	}

	mode := sm.config.SnapshotMode()
	
	switch mode {
	case "always":
		return true
	case "claude-session":
		return sm.activeSessions[sessionID]
	case "disabled":
		return false
	default:
		return false
	}
}