package snapshot

import "time"

// Viewport represents a device viewport configuration
type Viewport struct {
	Name   string  `json:"name"`
	Width  int64   `json:"width"`
	Height int64   `json:"height"`
	Mobile bool    `json:"mobile"`
	Scale  float64 `json:"scale"`
}

// Interaction represents a user interaction to perform before capturing
type Interaction struct {
	Type     string `json:"type"`     // "click", "hover", "scroll", "wait"
	Selector string `json:"selector"` // CSS selector for target element
	Duration string `json:"duration"` // For wait actions
	Value    string `json:"value"`    // For input actions
}

// SnapshotOptions configures how a snapshot should be captured
type SnapshotOptions struct {
	Viewport      Viewport      `json:"viewport"`
	WaitFor       string        `json:"waitFor"`       // CSS selector or time duration
	Interactions  []Interaction `json:"interactions"`  // User interactions before capture
	FullPage      bool          `json:"fullPage"`      // Capture full page or viewport only
	Element       string        `json:"element"`       // CSS selector for specific element
	OutputFormat  string        `json:"outputFormat"`  // "png" or "jpeg"
	Quality       int           `json:"quality"`       // JPEG quality (1-100)
	Delay         time.Duration `json:"delay"`         // Additional delay before capture
}

// SnapshotConfig configures the snapshot service
type SnapshotConfig struct {
	ChromeFlags      []string      `json:"chromeFlags"`
	DefaultTimeout   time.Duration `json:"defaultTimeout"`
	BaseURL          string        `json:"baseURL"`        // Base URL for component rendering
	OutputDir        string        `json:"outputDir"`      // Base directory for snapshots
	DefaultViewports []Viewport    `json:"defaultViewports"`
}

// SnapshotResult contains information about a captured snapshot
type SnapshotResult struct {
	FilePath     string    `json:"filePath"`
	Viewport     Viewport  `json:"viewport"`
	ComponentURL string    `json:"componentURL"`
	Timestamp    time.Time `json:"timestamp"`
	FileSize     int64     `json:"fileSize"`
	Error        string    `json:"error,omitempty"`
}

// ComponentWatcherConfig configures the component watcher
type ComponentWatcherConfig struct {
	SessionBaseDir     string        `json:"sessionBaseDir"`      // Base directory for sessions (e.g., "./data/session")
	DebounceDelay      time.Duration `json:"debounceDelay"`       // Delay before triggering snapshot after file change
	AutoSnapshot       bool          `json:"autoSnapshot"`        // Whether to automatically capture snapshots
	SnapshotViewports  []string      `json:"snapshotViewports"`   // Viewports to capture ("mobile", "tablet", "desktop")
	MaxConcurrentTasks int           `json:"maxConcurrentTasks"`  // Maximum concurrent snapshot tasks
	FileExtensions     []string      `json:"fileExtensions"`      // File extensions to watch (e.g., [".tsx", ".ts"])
	IgnorePatterns     []string      `json:"ignorePatterns"`      // Patterns to ignore (e.g., ["node_modules", ".git"])
	SnapshotDelay      time.Duration `json:"snapshotDelay"`       // Additional delay before capturing snapshot
}

// Default viewport configurations
var DefaultViewports = []Viewport{
	{Name: "mobile", Width: 375, Height: 667, Mobile: true, Scale: 2.0},
	{Name: "tablet", Width: 768, Height: 1024, Mobile: false, Scale: 1.0},
	{Name: "desktop", Width: 1920, Height: 1080, Mobile: false, Scale: 1.0},
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