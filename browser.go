package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/cdproto/runtime"
	"github.com/chromedp/chromedp"
	"github.com/google/uuid"
	deps2 "github.com/breadchris/share/deps"
)

type BrowserSession struct {
	ID              string                 `json:"id"`
	URL             string                 `json:"url"`
	StartTime       time.Time              `json:"start_time"`
	EndTime         time.Time              `json:"end_time"`
	ConsoleMessages []ConsoleMessage       `json:"console_messages"`
	NetworkRequests []NetworkRequest       `json:"network_requests"`
	Errors          []BrowserError         `json:"errors"`
	Status          string                 `json:"status"`
	Metadata        map[string]interface{} `json:"metadata"`
}

type ConsoleMessage struct {
	Level     string    `json:"level"`
	Text      string    `json:"text"`
	URL       string    `json:"url"`
	Line      int64     `json:"line"`
	Column    int64     `json:"column"`
	Timestamp time.Time `json:"timestamp"`
}

type NetworkRequest struct {
	RequestID    string            `json:"request_id"`
	URL          string            `json:"url"`
	Method       string            `json:"method"`
	Status       int64             `json:"status"`
	StatusText   string            `json:"status_text"`
	Headers      map[string]string `json:"headers"`
	ResponseTime time.Duration     `json:"response_time"`
	Size         int64             `json:"size"`
	Failed       bool              `json:"failed"`
	ErrorText    string            `json:"error_text"`
	Timestamp    time.Time         `json:"timestamp"`
}

type BrowserError struct {
	Type        string                 `json:"type"`
	Message     string                 `json:"message"`
	URL         string                 `json:"url"`
	Line        int64                  `json:"line"`
	Column      int64                  `json:"column"`
	StackTrace  string                 `json:"stack_trace"`
	Timestamp   time.Time              `json:"timestamp"`
	Metadata    map[string]interface{} `json:"metadata"`
}

type BrowserConfig struct {
	Headless       bool          `json:"headless"`
	Timeout        time.Duration `json:"timeout"`
	ViewportWidth  int64         `json:"viewport_width"`
	ViewportHeight int64         `json:"viewport_height"`
	UserAgent      string        `json:"user_agent"`
	DisableImages  bool          `json:"disable_images"`
	DisableCSS     bool          `json:"disable_css"`
}

// runBrowserCommand executes the browser command from CLI
func runBrowserCommand(url string, timeoutSeconds int, headless bool) error {
	config := BrowserConfig{
		Headless:       headless,
		Timeout:        time.Duration(timeoutSeconds) * time.Second,
		ViewportWidth:  1920,
		ViewportHeight: 1080,
	}

	session, err := runBrowserSession(url, config)
	if err != nil {
		return fmt.Errorf("failed to run browser session: %w", err)
	}

	// Pretty print the result
	result, err := json.MarshalIndent(session, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal session result: %w", err)
	}

	fmt.Printf("Browser Session Results:\n%s\n", result)
	return nil
}

// runBrowserSession performs the actual browser automation
func runBrowserSession(url string, config BrowserConfig) (*BrowserSession, error) {
	// Create session
	session := &BrowserSession{
		ID:              uuid.New().String(),
		URL:             url,
		StartTime:       time.Now(),
		Status:          "running",
		ConsoleMessages: []ConsoleMessage{},
		NetworkRequests: []NetworkRequest{},
		Errors:          []BrowserError{},
		Metadata:        make(map[string]interface{}),
	}

	// Setup Chrome options
	chromeOptions := []chromedp.ExecAllocatorOption{
		chromedp.Flag("headless", config.Headless),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("disable-background-timer-throttling", true),
		chromedp.Flag("disable-backgrounding-occluded-windows", true),
		chromedp.Flag("disable-renderer-backgrounding", true),
		chromedp.Flag("disable-web-security", true),
		chromedp.Flag("disable-features", "VizDisplayCompositor"),
	}

	if config.DisableImages {
		chromeOptions = append(chromeOptions, chromedp.Flag("disable-images", true))
	}

	if config.UserAgent != "" {
		chromeOptions = append(chromeOptions, chromedp.UserAgent(config.UserAgent))
	}

	// Create Chrome context
	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), chromeOptions...)
	defer cancel()

	chromeCtx, cancel := chromedp.NewContext(allocCtx, chromedp.WithDebugf(slog.Debug))
	defer cancel()

	// Create timeout context
	timeoutCtx, cancel := context.WithTimeout(chromeCtx, config.Timeout)
	defer cancel()

	// Setup event listeners
	networkRequests := make(map[string]*NetworkRequest)
	
	// Listen for console messages and errors
	chromedp.ListenTarget(timeoutCtx, func(ev interface{}) {
		switch ev := ev.(type) {
		case *runtime.EventConsoleAPICalled:
			// Handle console API calls (console.log, console.error, etc.)
			var text string
			for _, arg := range ev.Args {
				if arg.Value != nil {
					text += fmt.Sprintf("%v ", arg.Value)
				}
			}
			
			message := ConsoleMessage{
				Level:     ev.Type.String(),
				Text:      text,
				Timestamp: time.Now(),
			}
			session.ConsoleMessages = append(session.ConsoleMessages, message)
			
			// Check if this is an error
			if ev.Type == runtime.APITypeError {
				session.Errors = append(session.Errors, BrowserError{
					Type:      "console_api_error",
					Message:   text,
					Timestamp: time.Now(),
				})
			}

		case *runtime.EventExceptionThrown:
			// Handle uncaught exceptions
			exception := ev.ExceptionDetails
			session.Errors = append(session.Errors, BrowserError{
				Type:       "runtime_exception",
				Message:    exception.Text,
				URL:        exception.URL,
				Line:       exception.LineNumber,
				Column:     exception.ColumnNumber,
				StackTrace: fmt.Sprintf("%+v", exception.StackTrace),
				Timestamp:  time.Now(),
			})

		case *network.EventRequestWillBeSent:
			// Track network requests
			networkRequests[ev.RequestID.String()] = &NetworkRequest{
				RequestID: ev.RequestID.String(),
				URL:       ev.Request.URL,
				Method:    ev.Request.Method,
				Timestamp: time.Now(),
			}

		case *network.EventResponseReceived:
			// Update network request with response info
			if req, exists := networkRequests[ev.RequestID.String()]; exists {
				req.Status = ev.Response.Status
				req.StatusText = ev.Response.StatusText
				req.Headers = make(map[string]string)
				
				// Convert headers
				for key, value := range ev.Response.Headers {
					if strValue, ok := value.(string); ok {
						req.Headers[key] = strValue
					}
				}
				
				// Check for HTTP errors
				if ev.Response.Status >= 400 {
					req.Failed = true
					session.Errors = append(session.Errors, BrowserError{
						Type:      "network_error",
						Message:   fmt.Sprintf("HTTP %d %s", ev.Response.Status, ev.Response.StatusText),
						URL:       req.URL,
						Timestamp: time.Now(),
						Metadata: map[string]interface{}{
							"status_code": ev.Response.Status,
							"method":      req.Method,
						},
					})
				}
			}

		case *network.EventLoadingFinished:
			// Finalize network request
			if req, exists := networkRequests[ev.RequestID.String()]; exists {
				req.ResponseTime = time.Since(req.Timestamp)
				req.Size = int64(ev.EncodedDataLength)
				session.NetworkRequests = append(session.NetworkRequests, *req)
			}

		case *network.EventLoadingFailed:
			// Handle failed network requests
			if req, exists := networkRequests[ev.RequestID.String()]; exists {
				req.Failed = true
				req.ErrorText = ev.ErrorText
				req.ResponseTime = time.Since(req.Timestamp)
				session.NetworkRequests = append(session.NetworkRequests, *req)
				
				session.Errors = append(session.Errors, BrowserError{
					Type:      "network_failure",
					Message:   fmt.Sprintf("Failed to load %s: %s", req.URL, ev.ErrorText),
					URL:       req.URL,
					Timestamp: time.Now(),
					Metadata: map[string]interface{}{
						"method":     req.Method,
						"error_text": ev.ErrorText,
					},
				})
			}
		}
	})

	// Execute browser actions
	var title string
	actions := []chromedp.Action{
		// Enable necessary domains
		network.Enable(),
		runtime.Enable(),
		
		// Set viewport
		chromedp.EmulateViewport(config.ViewportWidth, config.ViewportHeight),
		
		// Navigate to URL
		chromedp.Navigate(url),
		
		// Wait for page to load
		chromedp.WaitReady("body", chromedp.ByQuery),
		
		// Get page title
		chromedp.Title(&title),
		
		// Wait a bit more for any async operations
		chromedp.Sleep(2 * time.Second),
	}

	// Execute actions
	err := chromedp.Run(timeoutCtx, actions...)
	if err != nil {
		session.Status = "failed"
		session.Errors = append(session.Errors, BrowserError{
			Type:      "execution_error",
			Message:   fmt.Sprintf("Failed to execute browser actions: %v", err),
			Timestamp: time.Now(),
		})
	} else {
		session.Status = "completed"
	}

	session.EndTime = time.Now()
	session.Metadata["title"] = title
	session.Metadata["duration"] = session.EndTime.Sub(session.StartTime).String()
	session.Metadata["total_requests"] = len(session.NetworkRequests)
	session.Metadata["failed_requests"] = countFailedRequests(session.NetworkRequests)
	session.Metadata["total_errors"] = len(session.Errors)

	return session, nil
}

// countFailedRequests counts the number of failed network requests
func countFailedRequests(requests []NetworkRequest) int {
	count := 0
	for _, req := range requests {
		if req.Failed {
			count++
		}
	}
	return count
}

// New returns an HTTP handler for the browser service
func NewBrowser(deps deps2.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	// POST /browser/session - Create a new browser session
	mux.HandleFunc("POST /session", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			URL    string        `json:"url"`
			Config BrowserConfig `json:"config"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
			return
		}

		if req.URL == "" {
			http.Error(w, "URL is required", http.StatusBadRequest)
			return
		}

		// Set default config values
		if req.Config.Timeout == 0 {
			req.Config.Timeout = 30 * time.Second
		}
		if req.Config.ViewportWidth == 0 {
			req.Config.ViewportWidth = 1920
		}
		if req.Config.ViewportHeight == 0 {
			req.Config.ViewportHeight = 1080
		}

		session, err := runBrowserSession(req.URL, req.Config)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to run browser session: %v", err), http.StatusInternalServerError)
			return
		}

		// Store session in supabase-kv if we have a session
		if sessionID, err := deps.Session.GetUserID(r.Context()); err == nil {
			session.Metadata["session_id"] = sessionID
			// The session data will be accessible via the TypeScript component
			// at /code/render/data/session/<session_id>/BrowserSessionViewer.tsx
			// which will use the supabase-kv module to store/retrieve session data
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(session)
	})

	// GET /browser/health - Health check endpoint
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "healthy",
			"service": "browser",
		})
	})

	return mux
}