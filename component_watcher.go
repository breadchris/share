package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

// ComponentWatcher monitors session directories for new component files
type ComponentWatcher struct {
	snapshotter    *ComponentSnapshotter
	watchedDirs    map[string]bool // sessionDir -> watching
	watcher        *fsnotify.Watcher
	mu             sync.RWMutex
	ctx            context.Context
	cancel         context.CancelFunc
	config         ComponentWatcherConfig
	snapshotQueue  chan SnapshotTask
	processingWG   sync.WaitGroup
}

// ComponentWatcherConfig configures the component watcher
type ComponentWatcherConfig struct {
	SessionBaseDir      string        `json:"sessionBaseDir"`      // Base directory for sessions (e.g., "./data/session")
	DebounceDelay       time.Duration `json:"debounceDelay"`       // Delay before triggering snapshot after file change
	AutoSnapshot        bool          `json:"autoSnapshot"`        // Whether to automatically capture snapshots
	SnapshotViewports   []string      `json:"snapshotViewports"`   // Viewports to capture ("mobile", "tablet", "desktop")
	MaxConcurrentTasks  int           `json:"maxConcurrentTasks"`  // Maximum concurrent snapshot tasks
	FileExtensions      []string      `json:"fileExtensions"`      // File extensions to watch (e.g., [".tsx", ".ts"])
	IgnorePatterns      []string      `json:"ignorePatterns"`      // Patterns to ignore (e.g., ["node_modules", ".git"])
	SnapshotDelay       time.Duration `json:"snapshotDelay"`       // Additional delay before capturing snapshot
}

// SnapshotTask represents a queued snapshot task
type SnapshotTask struct {
	SessionID     string
	ComponentPath string
	FilePath      string
	Timestamp     time.Time
}

// DefaultComponentWatcherConfig returns sensible defaults
func DefaultComponentWatcherConfig() ComponentWatcherConfig {
	return ComponentWatcherConfig{
		SessionBaseDir:     "./data/session",
		DebounceDelay:      2 * time.Second,
		AutoSnapshot:       true,
		SnapshotViewports:  []string{"desktop"}, // Default to desktop only for performance
		MaxConcurrentTasks: 3,
		FileExtensions:     []string{".tsx", ".ts"},
		IgnorePatterns:     []string{"node_modules", ".git", ".DS_Store", "*.log"},
		SnapshotDelay:      3 * time.Second, // Wait for file to stabilize
	}
}

// NewComponentWatcher creates a new component file watcher
func NewComponentWatcher(snapshotter *ComponentSnapshotter, config ComponentWatcherConfig) (*ComponentWatcher, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("failed to create file watcher: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())

	cw := &ComponentWatcher{
		snapshotter:   snapshotter,
		watchedDirs:   make(map[string]bool),
		watcher:       watcher,
		ctx:           ctx,
		cancel:        cancel,
		config:        config,
		snapshotQueue: make(chan SnapshotTask, 100), // Buffered queue
	}

	// Start worker goroutines for processing snapshot tasks
	for i := 0; i < config.MaxConcurrentTasks; i++ {
		cw.processingWG.Add(1)
		go cw.snapshotWorker(i)
	}

	return cw, nil
}

// Start begins watching for component file changes
func (cw *ComponentWatcher) Start() error {
	slog.Info("Starting component watcher",
		"session_base_dir", cw.config.SessionBaseDir,
		"auto_snapshot", cw.config.AutoSnapshot,
		"debounce_delay", cw.config.DebounceDelay,
		"max_concurrent_tasks", cw.config.MaxConcurrentTasks,
	)

	// Start the main watcher goroutine
	go cw.watchLoop()

	// Start session directory discovery
	go cw.discoverSessionDirectories()

	return nil
}

// Stop stops the component watcher
func (cw *ComponentWatcher) Stop() {
	slog.Info("Stopping component watcher")
	
	cw.cancel()
	
	// Close the watcher
	if cw.watcher != nil {
		cw.watcher.Close()
	}
	
	// Close snapshot queue
	close(cw.snapshotQueue)
	
	// Wait for workers to finish
	cw.processingWG.Wait()
	
	slog.Info("Component watcher stopped")
}

// AddSessionDirectory adds a session directory to watch
func (cw *ComponentWatcher) AddSessionDirectory(sessionID string) error {
	sessionDir := filepath.Join(cw.config.SessionBaseDir, sessionID)
	
	cw.mu.Lock()
	defer cw.mu.Unlock()
	
	// Check if already watching
	if cw.watchedDirs[sessionDir] {
		return nil
	}
	
	// Check if directory exists
	if _, err := os.Stat(sessionDir); os.IsNotExist(err) {
		return fmt.Errorf("session directory does not exist: %s", sessionDir)
	}
	
	// Add to watcher
	if err := cw.watcher.Add(sessionDir); err != nil {
		return fmt.Errorf("failed to watch session directory %s: %w", sessionDir, err)
	}
	
	cw.watchedDirs[sessionDir] = true
	
	slog.Info("Added session directory to watcher",
		"session_id", sessionID,
		"directory", sessionDir,
	)
	
	return nil
}

// RemoveSessionDirectory removes a session directory from watching
func (cw *ComponentWatcher) RemoveSessionDirectory(sessionID string) error {
	sessionDir := filepath.Join(cw.config.SessionBaseDir, sessionID)
	
	cw.mu.Lock()
	defer cw.mu.Unlock()
	
	if !cw.watchedDirs[sessionDir] {
		return nil // Not watching
	}
	
	if err := cw.watcher.Remove(sessionDir); err != nil {
		return fmt.Errorf("failed to stop watching directory %s: %w", sessionDir, err)
	}
	
	delete(cw.watchedDirs, sessionDir)
	
	slog.Info("Removed session directory from watcher",
		"session_id", sessionID,
		"directory", sessionDir,
	)
	
	return nil
}

// discoverSessionDirectories periodically scans for new session directories
func (cw *ComponentWatcher) discoverSessionDirectories() {
	ticker := time.NewTicker(30 * time.Second) // Check every 30 seconds
	defer ticker.Stop()
	
	// Initial scan
	cw.scanForSessionDirectories()
	
	for {
		select {
		case <-ticker.C:
			cw.scanForSessionDirectories()
		case <-cw.ctx.Done():
			return
		}
	}
}

// scanForSessionDirectories scans the base directory for session directories
func (cw *ComponentWatcher) scanForSessionDirectories() {
	entries, err := os.ReadDir(cw.config.SessionBaseDir)
	if err != nil {
		if !os.IsNotExist(err) {
			slog.Error("Failed to scan session base directory",
				"directory", cw.config.SessionBaseDir,
				"error", err,
			)
		}
		return
	}
	
	for _, entry := range entries {
		if entry.IsDir() {
			sessionID := entry.Name()
			if err := cw.AddSessionDirectory(sessionID); err != nil {
				slog.Debug("Failed to add session directory",
					"session_id", sessionID,
					"error", err,
				)
			}
		}
	}
}

// watchLoop is the main file watching loop
func (cw *ComponentWatcher) watchLoop() {
	debounceMap := make(map[string]*time.Timer)
	var debounceMapMu sync.Mutex
	
	for {
		select {
		case event, ok := <-cw.watcher.Events:
			if !ok {
				return
			}
			
			if cw.shouldProcessEvent(event) {
				// Debounce file changes
				debounceMapMu.Lock()
				
				if timer, exists := debounceMap[event.Name]; exists {
					timer.Stop()
				}
				
				debounceMap[event.Name] = time.AfterFunc(cw.config.DebounceDelay, func() {
					cw.handleFileEvent(event)
					
					debounceMapMu.Lock()
					delete(debounceMap, event.Name)
					debounceMapMu.Unlock()
				})
				
				debounceMapMu.Unlock()
			}
			
		case err, ok := <-cw.watcher.Errors:
			if !ok {
				return
			}
			slog.Error("File watcher error", "error", err)
			
		case <-cw.ctx.Done():
			return
		}
	}
}

// shouldProcessEvent determines if a file event should be processed
func (cw *ComponentWatcher) shouldProcessEvent(event fsnotify.Event) bool {
	// Only process write and create events
	if event.Op&fsnotify.Write == 0 && event.Op&fsnotify.Create == 0 {
		return false
	}
	
	// Check file extension
	ext := filepath.Ext(event.Name)
	extensionAllowed := false
	for _, allowedExt := range cw.config.FileExtensions {
		if ext == allowedExt {
			extensionAllowed = true
			break
		}
	}
	
	if !extensionAllowed {
		return false
	}
	
	// Check ignore patterns
	filename := filepath.Base(event.Name)
	for _, pattern := range cw.config.IgnorePatterns {
		if matched, _ := filepath.Match(pattern, filename); matched {
			return false
		}
		if strings.Contains(event.Name, pattern) {
			return false
		}
	}
	
	return true
}

// handleFileEvent processes a file change event
func (cw *ComponentWatcher) handleFileEvent(event fsnotify.Event) {
	// Extract session ID from file path
	sessionID := cw.extractSessionID(event.Name)
	if sessionID == "" {
		return
	}
	
	// Get relative component path within session
	sessionDir := filepath.Join(cw.config.SessionBaseDir, sessionID)
	componentPath, err := filepath.Rel(sessionDir, event.Name)
	if err != nil {
		slog.Error("Failed to get relative component path",
			"file_path", event.Name,
			"session_dir", sessionDir,
			"error", err,
		)
		return
	}
	
	slog.Info("Component file changed",
		"session_id", sessionID,
		"component_path", componentPath,
		"file_path", event.Name,
		"operation", event.Op.String(),
	)
	
	// Queue snapshot task if auto-snapshot is enabled
	if cw.config.AutoSnapshot {
		task := SnapshotTask{
			SessionID:     sessionID,
			ComponentPath: componentPath,
			FilePath:      event.Name,
			Timestamp:     time.Now(),
		}
		
		select {
		case cw.snapshotQueue <- task:
			slog.Debug("Queued snapshot task",
				"session_id", sessionID,
				"component_path", componentPath,
			)
		default:
			slog.Warn("Snapshot queue is full, dropping task",
				"session_id", sessionID,
				"component_path", componentPath,
			)
		}
	}
}

// extractSessionID extracts the session ID from a file path
func (cw *ComponentWatcher) extractSessionID(filePath string) string {
	// Normalize path
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		return ""
	}
	
	absBaseDir, err := filepath.Abs(cw.config.SessionBaseDir)
	if err != nil {
		return ""
	}
	
	// Check if file is within session base directory
	relPath, err := filepath.Rel(absBaseDir, absPath)
	if err != nil || strings.HasPrefix(relPath, "..") {
		return ""
	}
	
	// Extract session ID (first directory component)
	parts := strings.Split(relPath, string(filepath.Separator))
	if len(parts) > 0 {
		return parts[0]
	}
	
	return ""
}

// snapshotWorker processes snapshot tasks from the queue
func (cw *ComponentWatcher) snapshotWorker(workerID int) {
	defer cw.processingWG.Done()
	
	slog.Debug("Starting snapshot worker", "worker_id", workerID)
	
	for task := range cw.snapshotQueue {
		cw.processSnapshotTask(workerID, task)
	}
	
	slog.Debug("Stopping snapshot worker", "worker_id", workerID)
}

// processSnapshotTask processes a single snapshot task
func (cw *ComponentWatcher) processSnapshotTask(workerID int, task SnapshotTask) {
	start := time.Now()
	
	slog.Info("Processing snapshot task",
		"worker_id", workerID,
		"session_id", task.SessionID,
		"component_path", task.ComponentPath,
	)
	
	// Wait for file to stabilize
	if cw.config.SnapshotDelay > 0 {
		time.Sleep(cw.config.SnapshotDelay)
	}
	
	// Check if file still exists
	if _, err := os.Stat(task.FilePath); os.IsNotExist(err) {
		slog.Debug("File no longer exists, skipping snapshot",
			"worker_id", workerID,
			"file_path", task.FilePath,
		)
		return
	}
	
	// Capture snapshots for configured viewports
	var successCount, errorCount int
	
	for _, viewportName := range cw.config.SnapshotViewports {
		// Find viewport configuration
		var viewport Viewport
		found := false
		for _, vp := range cw.snapshotter.config.DefaultViewports {
			if vp.Name == viewportName {
				viewport = vp
				found = true
				break
			}
		}
		
		if !found {
			slog.Warn("Viewport configuration not found",
				"viewport", viewportName,
				"session_id", task.SessionID,
			)
			continue
		}
		
		// Prepare snapshot options
		options := SnapshotOptions{
			Viewport:     viewport,
			FullPage:     false,
			OutputFormat: "png",
			Quality:      90,
			Delay:        1 * time.Second,
		}
		
		// Capture snapshot
		result, err := cw.snapshotter.CaptureComponentSnapshot(task.ComponentPath, task.SessionID, options)
		if err != nil {
			slog.Error("Failed to capture component snapshot",
				"worker_id", workerID,
				"session_id", task.SessionID,
				"component_path", task.ComponentPath,
				"viewport", viewportName,
				"error", err,
			)
			errorCount++
		} else {
			slog.Info("Component snapshot captured automatically",
				"worker_id", workerID,
				"session_id", task.SessionID,
				"component_path", task.ComponentPath,
				"viewport", viewportName,
				"output_path", result.FilePath,
				"file_size", result.FileSize,
			)
			successCount++
		}
	}
	
	duration := time.Since(start)
	slog.Info("Completed snapshot task",
		"worker_id", workerID,
		"session_id", task.SessionID,
		"component_path", task.ComponentPath,
		"duration", duration,
		"success_count", successCount,
		"error_count", errorCount,
	)
}

// GetWatchedSessionDirectories returns a list of currently watched session directories
func (cw *ComponentWatcher) GetWatchedSessionDirectories() []string {
	cw.mu.RLock()
	defer cw.mu.RUnlock()
	
	var sessions []string
	for sessionDir := range cw.watchedDirs {
		sessionID := filepath.Base(sessionDir)
		sessions = append(sessions, sessionID)
	}
	
	return sessions
}

// GetQueueStatus returns information about the snapshot queue
func (cw *ComponentWatcher) GetQueueStatus() map[string]interface{} {
	return map[string]interface{}{
		"queue_length":     len(cw.snapshotQueue),
		"queue_capacity":   cap(cw.snapshotQueue),
		"watched_sessions": len(cw.watchedDirs),
		"max_workers":      cw.config.MaxConcurrentTasks,
	}
}