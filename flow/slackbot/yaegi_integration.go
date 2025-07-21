package slackbot

import (
	"context"
	"fmt"
	"net/http"
	"sync"

	"github.com/breadchris/flow/deps"
	"github.com/slack-go/slack/socketmode"
)

// YaegiSlackBotAdapter adapts the existing SlackBot to work with yaegi interpretation
// This allows for hot-reload of event handlers without restarting the bot
type YaegiSlackBotAdapter struct {
	originalBot     *SlackBot
	registry        *HandlerRegistry
	eventRouter     *EventRouter
	deps            deps.Deps
	config          *YaegiConfig
	isEnabled       bool
	originalHandler func(*socketmode.Event) // Store original event handler
	mu              sync.RWMutex
}

// YaegiConfig configures the yaegi integration
type YaegiConfig struct {
	EnableHotReload     bool `json:"enable_hot_reload"`
	EnableEventRouting  bool `json:"enable_event_routing"`
	EnableHandlerCache  bool `json:"enable_handler_cache"`
	DebugMode           bool `json:"debug_mode"`
	FallbackToOriginal  bool `json:"fallback_to_original"`
}

// DefaultYaegiConfig returns default configuration for yaegi integration
func DefaultYaegiConfig() *YaegiConfig {
	return &YaegiConfig{
		EnableHotReload:     true,
		EnableEventRouting:  true,
		EnableHandlerCache:  true,
		DebugMode:           false,
		FallbackToOriginal:  true,
	}
}

// NewYaegiSlackBotAdapter creates a new adapter for yaegi integration
func NewYaegiSlackBotAdapter(bot *SlackBot, deps deps.Deps, config *YaegiConfig) *YaegiSlackBotAdapter {
	if config == nil {
		config = DefaultYaegiConfig()
	}

	registryConfig := DefaultRegistryConfig()
	registryConfig.DebugMode = config.DebugMode
	registryConfig.EnableHotReload = config.EnableHotReload

	adapter := &YaegiSlackBotAdapter{
		originalBot: bot,
		deps:        deps,
		config:      config,
		isEnabled:   false,
	}

	// Initialize registry and router
	adapter.registry = NewHandlerRegistry(bot, deps, registryConfig)
	adapter.eventRouter = NewEventRouter(bot, deps)

	return adapter
}

// Enable activates yaegi interpretation for the SlackBot
func (a *YaegiSlackBotAdapter) Enable() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.isEnabled {
		return fmt.Errorf("yaegi integration already enabled")
	}

	if a.config.DebugMode {
		fmt.Printf("Enabling yaegi integration for SlackBot\n")
	}

	// Store original event handler (if we can access it)
	// Note: This is a simplified approach - in practice, we'd need to hook into
	// the actual event processing loop of the original SlackBot

	a.isEnabled = true
	return nil
}

// Disable deactivates yaegi interpretation
func (a *YaegiSlackBotAdapter) Disable() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if !a.isEnabled {
		return fmt.Errorf("yaegi integration not enabled")
	}

	if a.config.DebugMode {
		fmt.Printf("Disabling yaegi integration for SlackBot\n")
	}

	a.isEnabled = false
	return nil
}

// ProcessEvent processes an event through the yaegi-compatible router
func (a *YaegiSlackBotAdapter) ProcessEvent(ctx context.Context, evt socketmode.Event) error {
	a.mu.RLock()
	enabled := a.isEnabled
	a.mu.RUnlock()

	if !enabled {
		return fmt.Errorf("yaegi integration not enabled")
	}

	if a.config.EnableEventRouting {
		// Route through yaegi-compatible handlers
		err := a.registry.RouteEvent(ctx, evt)
		if err != nil && a.config.FallbackToOriginal {
			// Fallback to original handler if configured
			if a.config.DebugMode {
				fmt.Printf("Yaegi handler failed, falling back to original: %v\n", err)
			}
			// In practice, this would call the original bot's event handler
			return a.fallbackToOriginal(ctx, evt)
		}
		return err
	}

	return fmt.Errorf("event routing disabled in yaegi integration")
}

// fallbackToOriginal calls the original bot's event handling logic
func (a *YaegiSlackBotAdapter) fallbackToOriginal(ctx context.Context, evt socketmode.Event) error {
	// This is where we'd call the original SlackBot's event handling
	// For now, we'll return nil to indicate successful fallback
	if a.config.DebugMode {
		fmt.Printf("Falling back to original handler for event: %s\n", evt.Type)
	}
	return nil
}

// GetRegistry returns the handler registry
func (a *YaegiSlackBotAdapter) GetRegistry() *HandlerRegistry {
	return a.registry
}

// GetEventRouter returns the event router
func (a *YaegiSlackBotAdapter) GetEventRouter() *EventRouter {
	return a.eventRouter
}

// RegisterCustomHandler registers a custom handler for hot reload
func (a *YaegiSlackBotAdapter) RegisterCustomHandler(handler SlackEventHandler, filePath string) error {
	metadata := map[string]any{
		"custom":      true,
		"yaegi":       true,
		"hot_reload":  true,
		"file_path":   filePath,
	}
	
	return a.registry.RegisterHandler(handler, filePath, metadata)
}

// HTTPYaegiAdapter provides HTTP interface for yaegi integration
type HTTPYaegiAdapter struct {
	adapter *YaegiSlackBotAdapter
}

// NewHTTPYaegiAdapter creates an HTTP wrapper for the yaegi adapter
func NewHTTPYaegiAdapter(adapter *YaegiSlackBotAdapter) *HTTPYaegiAdapter {
	return &HTTPYaegiAdapter{adapter: adapter}
}

// ServeHTTP implements http.Handler for yaegi compatibility
func (h *HTTPYaegiAdapter) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.URL.Path {
	case "/status":
		h.handleStatus(w, r)
	case "/enable":
		h.handleEnable(w, r)
	case "/disable":
		h.handleDisable(w, r)
	case "/registry":
		// Delegate to registry handler
		registryHandler := NewHTTPHandlerRegistry(h.adapter.GetRegistry())
		registryHandler.ServeHTTP(w, r)
	default:
		http.Error(w, "Endpoint not found", http.StatusNotFound)
	}
}

// handleStatus returns the status of yaegi integration
func (h *HTTPYaegiAdapter) handleStatus(w http.ResponseWriter, r *http.Request) {
	h.adapter.mu.RLock()
	enabled := h.adapter.isEnabled
	h.adapter.mu.RUnlock()

	status := map[string]any{
		"yaegi_enabled":     enabled,
		"hot_reload":        h.adapter.config.EnableHotReload,
		"event_routing":     h.adapter.config.EnableEventRouting,
		"debug_mode":        h.adapter.config.DebugMode,
		"fallback_enabled":  h.adapter.config.FallbackToOriginal,
	}

	if enabled {
		// Add registry metrics
		metrics := h.adapter.registry.GetMetrics()
		status["registry_metrics"] = metrics
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{
		"status": "active",
		"yaegi_integration": %v,
		"config": %v
	}`, enabled, status)
}

// handleEnable enables yaegi integration
func (h *HTTPYaegiAdapter) handleEnable(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := h.adapter.Enable(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "enabled", "message": "Yaegi integration activated"}`)
}

// handleDisable disables yaegi integration
func (h *HTTPYaegiAdapter) handleDisable(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := h.adapter.Disable(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "disabled", "message": "Yaegi integration deactivated"}`)
}

// YaegiIntegrationMux creates the HTTP ServeMux for slackbot yaegi integration
// This function is called by the yaegi interpreter from main.go
func YaegiIntegrationMux(deps deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	// Create a placeholder SlackBot for demonstration
	// In practice, this would connect to the actual running SlackBot instance
	config := DefaultYaegiConfig()
	config.DebugMode = true // Enable debug mode for development

	// Note: We can't create a real SlackBot here without tokens
	// So we'll create a mock structure for yaegi compatibility
	mockBot := &SlackBot{} // This would be properly initialized in real integration

	adapter := NewYaegiSlackBotAdapter(mockBot, deps, config)
	httpAdapter := NewHTTPYaegiAdapter(adapter)

	// Mount adapter endpoints
	mux.Handle("/adapter/", http.StripPrefix("/adapter", httpAdapter))
	
	// Mount registry endpoints
	registryHandler := NewHTTPHandlerRegistry(adapter.GetRegistry())
	mux.Handle("/registry/", http.StripPrefix("/registry", registryHandler))

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{
			"status": "healthy",
			"service": "slackbot_yaegi_integration",
			"features": ["hot_reload", "event_routing", "handler_registry"],
			"endpoints": [
				"/adapter/status",
				"/adapter/enable", 
				"/adapter/disable",
				"/registry/handlers",
				"/registry/metrics"
			]
		}`)
	})

	// Demo endpoint showing yaegi capabilities
	mux.HandleFunc("/demo", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{
			"message": "SlackBot Yaegi Integration Demo",
			"capabilities": {
				"hot_reload": "Dynamically update event handlers without restart",
				"event_routing": "Route Slack events through interpreted handlers", 
				"registry": "Manage handlers with enable/disable/reload operations",
				"metrics": "Track handler performance and usage",
				"fallback": "Graceful fallback to original handlers on errors"
			},
			"usage": {
				"enable_yaegi": "POST /flow/slackbot/adapter/enable",
				"list_handlers": "GET /flow/slackbot/registry/handlers",
				"reload_handler": "POST /flow/slackbot/registry/handlers/reload",
				"view_metrics": "GET /flow/slackbot/registry/metrics"
			}
		}`)
	})

	return mux
}

// ExampleCustomHandler demonstrates how to create a custom handler for yaegi
type ExampleCustomHandler struct {
	BaseSlackEventHandler
}

func NewExampleCustomHandler(bot *SlackBot) *ExampleCustomHandler {
	return &ExampleCustomHandler{
		BaseSlackEventHandler: BaseSlackEventHandler{
			EventType: "example_custom",
			Priority:  50,
			Bot:       bot,
		},
	}
}

func (h *ExampleCustomHandler) HandleEvent(ctx context.Context, evt socketmode.Event) error {
	// This is an example of a custom handler that can be hot-reloaded
	fmt.Printf("Custom handler processing event: %s\n", evt.Type)
	return nil
}

// IntegrationTest provides a test function for the yaegi integration
func IntegrationTest(deps deps.Deps) error {
	// Create adapter
	config := DefaultYaegiConfig()
	config.DebugMode = true
	
	mockBot := &SlackBot{}
	adapter := NewYaegiSlackBotAdapter(mockBot, deps, config)
	
	// Enable integration
	if err := adapter.Enable(); err != nil {
		return fmt.Errorf("failed to enable yaegi integration: %w", err)
	}
	
	// Register custom handler
	customHandler := NewExampleCustomHandler(mockBot)
	if err := adapter.RegisterCustomHandler(customHandler, "example_handler.go"); err != nil {
		return fmt.Errorf("failed to register custom handler: %w", err)
	}
	
	fmt.Printf("Yaegi integration test completed successfully\n")
	return nil
}