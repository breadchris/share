package main

import (
	"github.com/breadchris/share/snapshot"
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






// ComponentSnapshotter handles capturing screenshots of React components
type ComponentSnapshotter struct {
	config    snapshot.SnapshotConfig
	chromeCtx context.Context
	cancel    context.CancelFunc
}

// NewComponentSnapshotter creates a new component snapshotter instance
func NewComponentSnapshotter(config snapshot.SnapshotConfig) (*ComponentSnapshotter, error) {
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
		config.DefaultViewports = snapshot.DefaultViewports
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
func (cs *ComponentSnapshotter) CaptureComponentSnapshot(componentPath, sessionID string, options snapshot.SnapshotOptions) (*snapshot.SnapshotResult, error) {
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

	return &snapshot.SnapshotResult{
		FilePath:     outputPath,
		Viewport:     options.Viewport,
		ComponentURL: componentURL,
		Timestamp:    time.Now(),
		FileSize:     fileInfo.Size(),
	}, nil
}

// CaptureResponsiveSnapshots captures screenshots across multiple viewports
func (cs *ComponentSnapshotter) CaptureResponsiveSnapshots(componentPath, sessionID string) ([]*snapshot.SnapshotResult, error) {
	var results []*snapshot.SnapshotResult
	var errors []error

	for _, viewport := range cs.config.DefaultViewports {
		options := snapshot.SnapshotOptions{
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
func (cs *ComponentSnapshotter) createInteractionAction(interaction snapshot.Interaction) chromedp.Action {
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
func (cs *ComponentSnapshotter) GetSnapshotMetadata(sessionID string) (map[string][]snapshot.SnapshotResult, error) {
	sessionDir := filepath.Join(cs.config.OutputDir, sessionID)
	metadata := make(map[string][]snapshot.SnapshotResult)

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

			result := snapshot.SnapshotResult{
				FilePath:  path,
				Timestamp: info.ModTime(),
				FileSize:  info.Size(),
				Viewport:  snapshot.Viewport{Name: viewportName},
			}

			metadata[viewportName] = append(metadata[viewportName], result)
		}

		return nil
	})

	return metadata, err
}