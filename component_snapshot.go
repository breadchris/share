package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/chromedp/cdproto/emulation"
	"github.com/chromedp/chromedp"
	"github.com/pkg/errors"
)

// Viewport represents a device viewport configuration
type Viewport struct {
	Name   string `json:"name"`
	Width  int64  `json:"width"`
	Height int64  `json:"height"`
	Mobile bool   `json:"mobile"`
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
	ChromeFlags    []string      `json:"chromeFlags"`
	DefaultTimeout time.Duration `json:"defaultTimeout"`
	BaseURL        string        `json:"baseURL"`        // Base URL for component rendering
	OutputDir      string        `json:"outputDir"`      // Base directory for snapshots
	DefaultViewports []Viewport  `json:"defaultViewports"`
}

// SnapshotResult contains information about a captured snapshot
type SnapshotResult struct {
	FilePath    string    `json:"filePath"`
	Viewport    Viewport  `json:"viewport"`
	ComponentURL string   `json:"componentURL"`
	Timestamp   time.Time `json:"timestamp"`
	FileSize    int64     `json:"fileSize"`
	Error       string    `json:"error,omitempty"`
}

// ComponentSnapshotter handles capturing screenshots of React components
type ComponentSnapshotter struct {
	config    SnapshotConfig
	chromeCtx context.Context
	cancel    context.CancelFunc
}

// DefaultViewports provides common device viewport configurations
var DefaultViewports = []Viewport{
	{Name: "mobile", Width: 375, Height: 667, Mobile: true, Scale: 2.0},
	{Name: "tablet", Width: 768, Height: 1024, Mobile: false, Scale: 1.0},
	{Name: "desktop", Width: 1920, Height: 1080, Mobile: false, Scale: 1.0},
}

// NewComponentSnapshotter creates a new component snapshotter instance
func NewComponentSnapshotter(config SnapshotConfig) (*ComponentSnapshotter, error) {
	// Set default values
	if config.DefaultTimeout == 0 {
		config.DefaultTimeout = 30 * time.Second
	}
	if config.BaseURL == "" {
		config.BaseURL = "http://localhost:8080"
	}
	if config.OutputDir == "" {
		config.OutputDir = "./data/snapshots"
	}
	if len(config.DefaultViewports) == 0 {
		config.DefaultViewports = DefaultViewports
	}

	// Ensure output directory exists
	if err := os.MkdirAll(config.OutputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %w", err)
	}

	// Chrome configuration
	chromeFlags := []chromedp.ExecAllocatorOption{
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("disable-background-timer-throttling", true),
		chromedp.Flag("disable-backgrounding-occluded-windows", true),
		chromedp.Flag("disable-renderer-backgrounding", true),
	}

	// Add custom Chrome flags
	for _, flag := range config.ChromeFlags {
		chromeFlags = append(chromeFlags, chromedp.Flag(flag, true))
	}

	// Create Chrome context
	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), chromeFlags...)
	chromeCtx, _ := chromedp.NewContext(allocCtx, chromedp.WithDebugf(slog.Debug))

	return &ComponentSnapshotter{
		config:    config,
		chromeCtx: chromeCtx,
		cancel:    cancel,
	}, nil
}

// Close releases Chrome resources
func (cs *ComponentSnapshotter) Close() {
	if cs.cancel != nil {
		cs.cancel()
	}
}

// CaptureComponentSnapshot captures a single screenshot of a component
func (cs *ComponentSnapshotter) CaptureComponentSnapshot(componentPath, sessionID string, options SnapshotOptions) (*SnapshotResult, error) {
	// Build component URL
	componentURL := fmt.Sprintf("%s/code/render/data/session/%s/%s", cs.config.BaseURL, sessionID, componentPath)
	
	// Set default options
	if options.OutputFormat == "" {
		options.OutputFormat = "png"
	}
	if options.Quality == 0 {
		options.Quality = 90
	}
	if options.Delay == 0 {
		options.Delay = 1 * time.Second
	}

	// Generate output filename
	timestamp := time.Now().Format("20060102-150405")
	filename := fmt.Sprintf("%s_%s_%s.%s", 
		filepath.Base(componentPath), 
		options.Viewport.Name, 
		timestamp, 
		options.OutputFormat)
	
	// Create session-specific output directory
	sessionOutputDir := filepath.Join(cs.config.OutputDir, sessionID, options.Viewport.Name)
	if err := os.MkdirAll(sessionOutputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create session output directory: %w", err)
	}
	
	outputPath := filepath.Join(sessionOutputDir, filename)

	// Create timeout context
	timeoutCtx, cancel := context.WithTimeout(cs.chromeCtx, cs.config.DefaultTimeout)
	defer cancel()

	// Prepare Chrome actions
	actions := []chromedp.Action{
		// Set viewport
		emulation.SetDeviceMetricsOverride(
			options.Viewport.Width,
			options.Viewport.Height,
			options.Viewport.Scale,
			options.Viewport.Mobile,
		),
		// Navigate to component
		chromedp.Navigate(componentURL),
	}

	// Wait for specific element or time
	if options.WaitFor != "" {
		if duration, err := time.ParseDuration(options.WaitFor); err == nil {
			// Wait for duration
			actions = append(actions, chromedp.Sleep(duration))
		} else {
			// Wait for element
			actions = append(actions, chromedp.WaitVisible(options.WaitFor))
		}
	} else {
		// Default wait for page load
		actions = append(actions, chromedp.Sleep(2*time.Second))
	}

	// Perform interactions
	for _, interaction := range options.Interactions {
		action := cs.createInteractionAction(interaction)
		if action != nil {
			actions = append(actions, action)
		}
	}

	// Additional delay before capture
	if options.Delay > 0 {
		actions = append(actions, chromedp.Sleep(options.Delay))
	}

	// Capture screenshot
	var screenshotBuf []byte
	if options.Element != "" {
		// Capture specific element
		actions = append(actions, chromedp.Screenshot(options.Element, &screenshotBuf))
	} else if options.FullPage {
		// Capture full page
		actions = append(actions, chromedp.FullScreenshot(&screenshotBuf, 100))
	} else {
		// Capture viewport
		actions = append(actions, chromedp.CaptureScreenshot(&screenshotBuf))
	}

	// Execute actions
	start := time.Now()
	if err := chromedp.Run(timeoutCtx, actions...); err != nil {
		return nil, errors.Wrapf(err, "failed to capture screenshot for %s", componentURL)
	}

	// Save screenshot
	if err := os.WriteFile(outputPath, screenshotBuf, 0644); err != nil {
		return nil, fmt.Errorf("failed to save screenshot: %w", err)
	}

	// Get file size
	fileInfo, err := os.Stat(outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	slog.Info("Component snapshot captured",
		"component_path", componentPath,
		"session_id", sessionID,
		"output_path", outputPath,
		"viewport", options.Viewport.Name,
		"duration", time.Since(start),
		"file_size", fileInfo.Size(),
	)

	return &SnapshotResult{
		FilePath:     outputPath,
		Viewport:     options.Viewport,
		ComponentURL: componentURL,
		Timestamp:    time.Now(),
		FileSize:     fileInfo.Size(),
	}, nil
}

// CaptureResponsiveSnapshots captures screenshots across multiple viewports
func (cs *ComponentSnapshotter) CaptureResponsiveSnapshots(componentPath, sessionID string) ([]*SnapshotResult, error) {
	var results []*SnapshotResult
	var errors []error

	for _, viewport := range cs.config.DefaultViewports {
		options := SnapshotOptions{
			Viewport:     viewport,
			FullPage:     false,
			OutputFormat: "png",
			Quality:      90,
			Delay:        1 * time.Second,
		}

		result, err := cs.CaptureComponentSnapshot(componentPath, sessionID, options)
		if err != nil {
			slog.Error("Failed to capture snapshot for viewport",
				"viewport", viewport.Name,
				"component_path", componentPath,
				"error", err,
			)
			errors = append(errors, err)
			// Continue with other viewports
			continue
		}

		results = append(results, result)
	}

	if len(results) == 0 && len(errors) > 0 {
		return nil, fmt.Errorf("failed to capture any snapshots: %v", errors)
	}

	return results, nil
}

// createInteractionAction converts an Interaction to a chromedp Action
func (cs *ComponentSnapshotter) createInteractionAction(interaction Interaction) chromedp.Action {
	switch interaction.Type {
	case "click":
		return chromedp.Click(interaction.Selector)
	case "hover":
		return chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.WaitVisible(interaction.Selector).Do(ctx)
		})
	case "scroll":
		return chromedp.ScrollIntoView(interaction.Selector)
	case "wait":
		if duration, err := time.ParseDuration(interaction.Duration); err == nil {
			return chromedp.Sleep(duration)
		}
		return chromedp.WaitVisible(interaction.Selector)
	case "input":
		return chromedp.SendKeys(interaction.Selector, interaction.Value)
	default:
		slog.Warn("Unknown interaction type", "type", interaction.Type)
		return nil
	}
}

// GetSnapshotMetadata returns metadata about snapshots for a session
func (cs *ComponentSnapshotter) GetSnapshotMetadata(sessionID string) (map[string][]SnapshotResult, error) {
	sessionDir := filepath.Join(cs.config.OutputDir, sessionID)
	metadata := make(map[string][]SnapshotResult)

	// Check if session directory exists
	if _, err := os.Stat(sessionDir); os.IsNotExist(err) {
		return metadata, nil // Return empty metadata
	}

	// Walk through viewport directories
	err := filepath.Walk(sessionDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && (filepath.Ext(info.Name()) == ".png" || filepath.Ext(info.Name()) == ".jpg" || filepath.Ext(info.Name()) == ".jpeg") {
			// Extract viewport from directory structure
			relPath, _ := filepath.Rel(sessionDir, path)
			viewportName := filepath.Dir(relPath)
			
			if viewportName == "." {
				viewportName = "default"
			}

			result := SnapshotResult{
				FilePath:  path,
				Timestamp: info.ModTime(),
				FileSize:  info.Size(),
				Viewport:  Viewport{Name: viewportName},
			}

			metadata[viewportName] = append(metadata[viewportName], result)
		}

		return nil
	})

	return metadata, err
}