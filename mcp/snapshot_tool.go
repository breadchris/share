package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/cdproto/emulation"
	"github.com/chromedp/cdproto/page"
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

// MCPRequest represents an incoming MCP tool request
type MCPRequest struct {
	Method string      `json:"method"`
	Params MCPParams   `json:"params"`
}

// MCPParams contains the parameters for MCP tool calls
type MCPParams struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

// MCPResponse represents an MCP tool response
type MCPResponse struct {
	Content []MCPContent `json:"content"`
	IsError bool         `json:"isError,omitempty"`
}

// MCPContent represents content in an MCP response
type MCPContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// MCPToolCapabilities defines available MCP tools
type MCPToolCapabilities struct {
	Tools []MCPTool `json:"tools"`
}

// MCPTool defines an individual MCP tool
type MCPTool struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema MCPSchema   `json:"inputSchema"`
}

// MCPSchema defines the input schema for an MCP tool
type MCPSchema struct {
	Type       string                `json:"type"`
	Properties map[string]MCPProperty `json:"properties"`
	Required   []string              `json:"required"`
}

// MCPProperty defines a property in an MCP schema
type MCPProperty struct {
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Enum        []string `json:"enum,omitempty"`
	Items       *MCPProperty `json:"items,omitempty"`
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
		// Default wait for page load
		chromedp.Sleep(2*time.Second),
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
			continue
		}

		results = append(results, result)
	}

	if len(results) == 0 && len(errors) > 0 {
		return nil, fmt.Errorf("failed to capture any snapshots: %v", errors)
	}

	return results, nil
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

// SnapshotToolServer handles MCP requests for component snapshots
type SnapshotToolServer struct {
	snapshotter *ComponentSnapshotter
	sessionID   string // Current session context
}

// NewSnapshotToolServer creates a new MCP tool server for snapshots
func NewSnapshotToolServer() (*SnapshotToolServer, error) {
	// Get session ID from environment or working directory
	sessionID := detectSessionID()
	
	// Create snapshotter with default config
	config := SnapshotConfig{
		DefaultTimeout: 30 * time.Second,
		BaseURL:       "http://localhost:8080",
		OutputDir:     "./snapshots",
		DefaultViewports: DefaultViewports,
	}
	
	snapshotter, err := NewComponentSnapshotter(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create snapshotter: %w", err)
	}
	
	return &SnapshotToolServer{
		snapshotter: snapshotter,
		sessionID:   sessionID,
	}, nil
}

// detectSessionID attempts to detect the current session ID from context
func detectSessionID() string {
	// Try to get from environment variable
	if sessionID := os.Getenv("CLAUDE_SESSION_ID"); sessionID != "" {
		return sessionID
	}
	
	// Try to detect from current working directory
	cwd, err := os.Getwd()
	if err == nil {
		if strings.Contains(cwd, "/data/session/") {
			parts := strings.Split(cwd, "/data/session/")
			if len(parts) > 1 {
				sessionParts := strings.Split(parts[1], "/")
				if len(sessionParts) > 0 {
					return sessionParts[0]
				}
			}
		}
	}
	
	// Default fallback
	return "default"
}

// GetCapabilities returns the MCP tool capabilities
func (s *SnapshotToolServer) GetCapabilities() MCPToolCapabilities {
	return MCPToolCapabilities{
		Tools: []MCPTool{
			{
				Name:        "capture_component_snapshot",
				Description: "Capture a screenshot of a React component with optional viewport and interaction configuration",
				InputSchema: MCPSchema{
					Type: "object",
					Properties: map[string]MCPProperty{
						"componentPath": {
							Type:        "string",
							Description: "Path to the component file (relative to session directory)",
						},
						"viewport": {
							Type:        "string",
							Description: "Viewport configuration for the screenshot",
							Enum:        []string{"mobile", "tablet", "desktop", "all"},
						},
						"fullPage": {
							Type:        "boolean",
							Description: "Whether to capture the full page or just the viewport",
						},
						"element": {
							Type:        "string",
							Description: "CSS selector to capture a specific element only",
						},
						"waitFor": {
							Type:        "string",
							Description: "CSS selector to wait for or duration (e.g., '2s')",
						},
						"interactions": {
							Type:        "array",
							Description: "User interactions to perform before capturing",
							Items: &MCPProperty{
								Type: "object",
								Properties: map[string]MCPProperty{
									"type": {
										Type:        "string",
										Description: "Type of interaction",
										Enum:        []string{"click", "hover", "scroll", "wait", "input"},
									},
									"selector": {
										Type:        "string",
										Description: "CSS selector for the target element",
									},
									"value": {
										Type:        "string",
										Description: "Value for input interactions",
									},
									"duration": {
										Type:        "string",
										Description: "Duration for wait interactions",
									},
								},
							},
						},
					},
					Required: []string{"componentPath"},
				},
			},
			{
				Name:        "list_component_snapshots",
				Description: "List existing snapshots for the current session",
				InputSchema: MCPSchema{
					Type:       "object",
					Properties: map[string]MCPProperty{},
					Required:   []string{},
				},
			},
			{
				Name:        "capture_responsive_snapshots",
				Description: "Capture screenshots across all default viewports (mobile, tablet, desktop)",
				InputSchema: MCPSchema{
					Type: "object",
					Properties: map[string]MCPProperty{
						"componentPath": {
							Type:        "string",
							Description: "Path to the component file (relative to session directory)",
						},
					},
					Required: []string{"componentPath"},
				},
			},
		},
	}
}

// HandleToolCall processes an MCP tool call request
func (s *SnapshotToolServer) HandleToolCall(request MCPRequest) MCPResponse {
	switch request.Params.Name {
	case "capture_component_snapshot":
		return s.handleCaptureSnapshot(request.Params.Arguments)
	case "list_component_snapshots":
		return s.handleListSnapshots(request.Params.Arguments)
	case "capture_responsive_snapshots":
		return s.handleCaptureResponsiveSnapshots(request.Params.Arguments)
	default:
		return MCPResponse{
			Content: []MCPContent{{
				Type: "text",
				Text: fmt.Sprintf("Unknown tool: %s", request.Params.Name),
			}},
			IsError: true,
		}
	}
}

// handleCaptureSnapshot processes a single snapshot capture request
func (s *SnapshotToolServer) handleCaptureSnapshot(args map[string]interface{}) MCPResponse {
	// Extract component path
	componentPath, ok := args["componentPath"].(string)
	if !ok {
		return MCPResponse{
			Content: []MCPContent{{
				Type: "text",
				Text: "componentPath is required and must be a string",
			}},
			IsError: true,
		}
	}

	// Parse viewport
	viewportName := "desktop" // default
	if v, ok := args["viewport"].(string); ok {
		viewportName = v
	}

	// Handle "all" viewport option
	if viewportName == "all" {
		return s.handleCaptureResponsiveSnapshots(args)
	}

	// Find viewport configuration
	var viewport Viewport
	found := false
	for _, vp := range s.snapshotter.config.DefaultViewports {
		if vp.Name == viewportName {
			viewport = vp
			found = true
			break
		}
	}
	if !found {
		viewport = DefaultViewports[2] // desktop fallback
	}

	// Build snapshot options
	options := SnapshotOptions{
		Viewport:     viewport,
		FullPage:     false,
		OutputFormat: "png",
		Quality:      90,
		Delay:        1 * time.Second,
	}

	// Parse optional parameters
	if fullPage, ok := args["fullPage"].(bool); ok {
		options.FullPage = fullPage
	}

	if element, ok := args["element"].(string); ok {
		options.Element = element
	}

	if waitFor, ok := args["waitFor"].(string); ok {
		options.WaitFor = waitFor
	}

	// Parse interactions
	if interactionsRaw, ok := args["interactions"].([]interface{}); ok {
		for _, intRaw := range interactionsRaw {
			if intMap, ok := intRaw.(map[string]interface{}); ok {
				interaction := Interaction{}
				if t, ok := intMap["type"].(string); ok {
					interaction.Type = t
				}
				if sel, ok := intMap["selector"].(string); ok {
					interaction.Selector = sel
				}
				if val, ok := intMap["value"].(string); ok {
					interaction.Value = val
				}
				if dur, ok := intMap["duration"].(string); ok {
					interaction.Duration = dur
				}
				options.Interactions = append(options.Interactions, interaction)
			}
		}
	}

	// Capture snapshot
	result, err := s.snapshotter.CaptureComponentSnapshot(componentPath, s.sessionID, options)
	if err != nil {
		return MCPResponse{
			Content: []MCPContent{{
				Type: "text",
				Text: fmt.Sprintf("Failed to capture snapshot: %v", err),
			}},
			IsError: true,
		}
	}

	// Return success response
	return MCPResponse{
		Content: []MCPContent{{
			Type: "text",
			Text: fmt.Sprintf("Screenshot captured successfully:\n"+
				"- File: %s\n"+
				"- Viewport: %s (%dx%d)\n"+
				"- Size: %d bytes\n"+
				"- Component URL: %s",
				result.FilePath,
				result.Viewport.Name,
				result.Viewport.Width,
				result.Viewport.Height,
				result.FileSize,
				result.ComponentURL),
		}},
	}
}

// handleListSnapshots lists existing snapshots for the session
func (s *SnapshotToolServer) handleListSnapshots(args map[string]interface{}) MCPResponse {
	metadata, err := s.snapshotter.GetSnapshotMetadata(s.sessionID)
	if err != nil {
		return MCPResponse{
			Content: []MCPContent{{
				Type: "text",
				Text: fmt.Sprintf("Failed to get snapshot metadata: %v", err),
			}},
			IsError: true,
		}
	}

	if len(metadata) == 0 {
		return MCPResponse{
			Content: []MCPContent{{
				Type: "text",
				Text: "No snapshots found for this session.",
			}},
		}
	}

	// Build response text
	var response strings.Builder
	response.WriteString("Component Snapshots:\n\n")

	for viewport, snapshots := range metadata {
		response.WriteString(fmt.Sprintf("## %s Viewport\n", strings.Title(viewport)))
		for _, snapshot := range snapshots {
			response.WriteString(fmt.Sprintf("- %s (%d bytes, %s)\n",
				filepath.Base(snapshot.FilePath),
				snapshot.FileSize,
				snapshot.Timestamp.Format("2006-01-02 15:04:05")))
		}
		response.WriteString("\n")
	}

	return MCPResponse{
		Content: []MCPContent{{
			Type: "text",
			Text: response.String(),
		}},
	}
}

// handleCaptureResponsiveSnapshots captures snapshots across all viewports
func (s *SnapshotToolServer) handleCaptureResponsiveSnapshots(args map[string]interface{}) MCPResponse {
	// Extract component path
	componentPath, ok := args["componentPath"].(string)
	if !ok {
		return MCPResponse{
			Content: []MCPContent{{
				Type: "text",
				Text: "componentPath is required and must be a string",
			}},
			IsError: true,
		}
	}

	// Capture responsive snapshots
	results, err := s.snapshotter.CaptureResponsiveSnapshots(componentPath, s.sessionID)
	if err != nil {
		return MCPResponse{
			Content: []MCPContent{{
				Type: "text",
				Text: fmt.Sprintf("Failed to capture responsive snapshots: %v", err),
			}},
			IsError: true,
		}
	}

	// Build response
	var response strings.Builder
	response.WriteString(fmt.Sprintf("Captured %d responsive snapshots:\n\n", len(results)))

	for _, result := range results {
		response.WriteString(fmt.Sprintf("✓ %s: %s (%d bytes)\n",
			result.Viewport.Name,
			filepath.Base(result.FilePath),
			result.FileSize))
	}

	return MCPResponse{
		Content: []MCPContent{{
			Type: "text",
			Text: response.String(),
		}},
	}
}

// RunMCPServer starts the MCP server in stdio mode
func (s *SnapshotToolServer) RunMCPServer() error {
	slog.Info("Starting MCP Snapshot Tool Server",
		"session_id", s.sessionID,
		"output_dir", s.snapshotter.config.OutputDir)

	// Process stdin requests
	decoder := json.NewDecoder(os.Stdin)
	encoder := json.NewEncoder(os.Stdout)

	for {
		var request MCPRequest
		if err := decoder.Decode(&request); err != nil {
			if err == io.EOF {
				break
			}
			slog.Error("Failed to decode MCP request", "error", err)
			continue
		}

		// Handle the request
		var response interface{}
		switch request.Method {
		case "tools/list":
			response = s.GetCapabilities()
		case "tools/call":
			response = s.HandleToolCall(request)
		default:
			response = MCPResponse{
				Content: []MCPContent{{
					Type: "text",
					Text: fmt.Sprintf("Unknown method: %s", request.Method),
				}},
				IsError: true,
			}
		}

		// Send response
		if err := encoder.Encode(response); err != nil {
			slog.Error("Failed to encode MCP response", "error", err)
		}
	}

	return nil
}

// Close cleanup resources
func (s *SnapshotToolServer) Close() {
	if s.snapshotter != nil {
		s.snapshotter.Close()
	}
}

// Main function for standalone MCP server
func main() {
	server, err := NewSnapshotToolServer()
	if err != nil {
		slog.Error("Failed to create MCP server", "error", err)
		os.Exit(1)
	}
	defer server.Close()

	if err := server.RunMCPServer(); err != nil {
		slog.Error("MCP server error", "error", err)
		os.Exit(1)
	}
}