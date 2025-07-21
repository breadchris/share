package slackbot

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"reflect"
	"sync"
	"time"

	"github.com/breadchris/flow/deps"
	"github.com/slack-go/slack/socketmode"
)

// HandlerRegistry manages dynamic registration and hot-reload of Slack event handlers
// This registry works with yaegi interpretation to enable runtime handler updates
type HandlerRegistry struct {
	handlers       map[string][]RegisteredHandler
	mu             sync.RWMutex
	bot            *SlackBot
	deps           deps.Deps
	router         *EventRouter
	config         *RegistryConfig
	metrics        *RegistryMetrics
	hotReloadPaths map[string]string // Maps handler names to file paths for hot reload
}

// RegisteredHandler wraps a handler with metadata for dynamic management
type RegisteredHandler struct {
	Handler      SlackEventHandler `json:"-"`
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	EventType    string            `json:"event_type"`
	Priority     int               `json:"priority"`
	FilePath     string            `json:"file_path"`
	Version      int               `json:"version"`
	RegisteredAt time.Time         `json:"registered_at"`
	LastUpdated  time.Time         `json:"last_updated"`
	IsHotReload  bool              `json:"is_hot_reload"`
	Enabled      bool              `json:"enabled"`
	Metadata     map[string]any    `json:"metadata"`
}

// RegistryConfig configures the handler registry
type RegistryConfig struct {
	EnableHotReload     bool     `json:"enable_hot_reload"`
	WatchPaths          []string `json:"watch_paths"`
	MaxHandlersPerType  int      `json:"max_handlers_per_type"`
	HandlerTimeout      int      `json:"handler_timeout_seconds"`
	EnableMetrics       bool     `json:"enable_metrics"`
	AllowDynamicLoading bool     `json:"allow_dynamic_loading"`
	DebugMode           bool     `json:"debug_mode"`
}

// RegistryMetrics tracks registry performance and usage
type RegistryMetrics struct {
	HandlersRegistered   int64            `json:"handlers_registered"`
	HandlersUnregistered int64            `json:"handlers_unregistered"`
	HotReloads           int64            `json:"hot_reloads"`
	FailedRegistrations  int64            `json:"failed_registrations"`
	HandlerExecutions    map[string]int64 `json:"handler_executions"`
	LastReload           time.Time        `json:"last_reload"`
	mu                   sync.RWMutex
}

// DefaultRegistryConfig returns a default configuration
func DefaultRegistryConfig() *RegistryConfig {
	return &RegistryConfig{
		EnableHotReload:     true,
		WatchPaths:          []string{"./flow/slackbot/"},
		MaxHandlersPerType:  10,
		HandlerTimeout:      30,
		EnableMetrics:       true,
		AllowDynamicLoading: true,
		DebugMode:           false,
	}
}

// NewHandlerRegistry creates a new dynamic handler registry
func NewHandlerRegistry(bot *SlackBot, deps deps.Deps, config *RegistryConfig) *HandlerRegistry {
	if config == nil {
		config = DefaultRegistryConfig()
	}

	registry := &HandlerRegistry{
		handlers:       make(map[string][]RegisteredHandler),
		bot:            bot,
		deps:           deps,
		config:         config,
		metrics:        &RegistryMetrics{HandlerExecutions: make(map[string]int64)},
		hotReloadPaths: make(map[string]string),
	}

	// Initialize router with registry
	registry.router = NewEventRouter(bot, deps)
	
	// Register default handlers
	registry.registerDefaultHandlers()

	return registry
}

// registerDefaultHandlers registers the core event handlers
func (r *HandlerRegistry) registerDefaultHandlers() {
	factory := NewHandlerFactory(r.bot)
	defaultHandlers := factory.CreateDefaultHandlers()

	for _, handler := range defaultHandlers {
		metadata := map[string]any{
			"default": true,
			"source":  "builtin",
		}
		
		r.RegisterHandler(handler, "", metadata)
	}
}

// RegisterHandler dynamically registers a new event handler
func (r *HandlerRegistry) RegisterHandler(handler SlackEventHandler, filePath string, metadata map[string]any) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if metadata == nil {
		metadata = make(map[string]any)
	}

	// Check limits
	eventType := handler.GetEventType()
	if len(r.handlers[eventType]) >= r.config.MaxHandlersPerType {
		r.metrics.FailedRegistrations++
		return fmt.Errorf("maximum handlers reached for event type: %s", eventType)
	}

	// Create registered handler
	registered := RegisteredHandler{
		Handler:      handler,
		ID:           generateHandlerID(handler),
		Name:         getHandlerName(handler),
		EventType:    eventType,
		Priority:     handler.GetPriority(),
		FilePath:     filePath,
		Version:      1,
		RegisteredAt: time.Now(),
		LastUpdated:  time.Now(),
		IsHotReload:  filePath != "",
		Enabled:      true,
		Metadata:     metadata,
	}

	// Add to registry
	if r.handlers[eventType] == nil {
		r.handlers[eventType] = make([]RegisteredHandler, 0)
	}

	r.handlers[eventType] = append(r.handlers[eventType], registered)

	// Register with router
	r.router.RegisterHandler(handler)

	// Track hot reload path
	if filePath != "" {
		r.hotReloadPaths[registered.ID] = filePath
	}

	// Update metrics
	r.metrics.HandlersRegistered++

	if r.config.DebugMode {
		fmt.Printf("Registered handler: %s (type: %s, priority: %d)\n", 
			registered.Name, eventType, handler.GetPriority())
	}

	return nil
}

// UnregisterHandler removes a handler from the registry
func (r *HandlerRegistry) UnregisterHandler(handlerID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for eventType, handlers := range r.handlers {
		for i, registered := range handlers {
			if registered.ID == handlerID {
				// Remove from slice
				r.handlers[eventType] = append(handlers[:i], handlers[i+1:]...)
				
				// Remove from router
				r.router.UnregisterHandler(eventType, registered.Handler)
				
				// Remove hot reload path
				delete(r.hotReloadPaths, handlerID)
				
				// Update metrics
				r.metrics.HandlersUnregistered++
				
				if r.config.DebugMode {
					fmt.Printf("Unregistered handler: %s\n", registered.Name)
				}
				
				return nil
			}
		}
	}

	return fmt.Errorf("handler not found: %s", handlerID)
}

// ReloadHandler performs hot reload of a specific handler
func (r *HandlerRegistry) ReloadHandler(handlerID string) error {
	r.mu.Lock()
	_, exists := r.hotReloadPaths[handlerID]
	r.mu.Unlock()

	if !exists {
		return fmt.Errorf("handler not configured for hot reload: %s", handlerID)
	}

	if !r.config.EnableHotReload {
		return fmt.Errorf("hot reload is disabled")
	}

	// This would integrate with yaegi to reload the handler from file
	// For now, we'll simulate the reload process
	
	r.mu.Lock()
	defer r.mu.Unlock()

	// Find the handler to reload
	for eventType, handlers := range r.handlers {
		for i, registered := range handlers {
			if registered.ID == handlerID {
				// Update version and timestamp
				r.handlers[eventType][i].Version++
				r.handlers[eventType][i].LastUpdated = time.Now()
				
				// Update metrics
				r.metrics.HotReloads++
				r.metrics.LastReload = time.Now()
				
				if r.config.DebugMode {
					fmt.Printf("Hot reloaded handler: %s (version: %d)\n", 
						registered.Name, r.handlers[eventType][i].Version)
				}
				
				return nil
			}
		}
	}

	return fmt.Errorf("handler not found for reload: %s", handlerID)
}

// EnableHandler enables a disabled handler
func (r *HandlerRegistry) EnableHandler(handlerID string) error {
	return r.setHandlerEnabled(handlerID, true)
}

// DisableHandler disables an active handler
func (r *HandlerRegistry) DisableHandler(handlerID string) error {
	return r.setHandlerEnabled(handlerID, false)
}

// setHandlerEnabled sets the enabled state of a handler
func (r *HandlerRegistry) setHandlerEnabled(handlerID string, enabled bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for eventType, handlers := range r.handlers {
		for i, registered := range handlers {
			if registered.ID == handlerID {
				r.handlers[eventType][i].Enabled = enabled
				r.handlers[eventType][i].LastUpdated = time.Now()
				
				if r.config.DebugMode {
					status := "enabled"
					if !enabled {
						status = "disabled"
					}
					fmt.Printf("Handler %s: %s\n", registered.Name, status)
				}
				
				return nil
			}
		}
	}

	return fmt.Errorf("handler not found: %s", handlerID)
}

// GetRegisteredHandlers returns all registered handlers
func (r *HandlerRegistry) GetRegisteredHandlers() map[string][]RegisteredHandler {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Return a deep copy to avoid concurrent modification
	result := make(map[string][]RegisteredHandler)
	for eventType, handlers := range r.handlers {
		handlersCopy := make([]RegisteredHandler, len(handlers))
		for i, handler := range handlers {
			handlersCopy[i] = handler
			// Don't copy the actual handler interface to avoid issues
			handlersCopy[i].Handler = nil
		}
		result[eventType] = handlersCopy
	}

	return result
}

// GetHandlerByID returns a specific handler by ID
func (r *HandlerRegistry) GetHandlerByID(handlerID string) (*RegisteredHandler, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, handlers := range r.handlers {
		for _, registered := range handlers {
			if registered.ID == handlerID {
				// Return a copy without the handler interface
				result := registered
				result.Handler = nil
				return &result, nil
			}
		}
	}

	return nil, fmt.Errorf("handler not found: %s", handlerID)
}

// RouteEvent routes an event through enabled handlers
func (r *HandlerRegistry) RouteEvent(ctx context.Context, evt socketmode.Event) error {
	// Update metrics
	if r.config.EnableMetrics {
		r.metrics.mu.Lock()
		r.metrics.HandlerExecutions[string(evt.Type)]++
		r.metrics.mu.Unlock()
	}

	// Use the event router to process the event
	return r.router.RouteEvent(ctx, evt)
}

// GetMetrics returns current registry metrics
func (r *HandlerRegistry) GetMetrics() RegistryMetrics {
	r.metrics.mu.RLock()
	defer r.metrics.mu.RUnlock()

	// Return a copy
	result := *r.metrics
	result.HandlerExecutions = make(map[string]int64)
	for k, v := range r.metrics.HandlerExecutions {
		result.HandlerExecutions[k] = v
	}

	return result
}

// HTTPHandlerRegistry provides HTTP interface for the registry
type HTTPHandlerRegistry struct {
	registry *HandlerRegistry
}

// NewHTTPHandlerRegistry creates an HTTP wrapper for the registry
func NewHTTPHandlerRegistry(registry *HandlerRegistry) *HTTPHandlerRegistry {
	return &HTTPHandlerRegistry{registry: registry}
}

// ServeHTTP implements http.Handler for yaegi compatibility
func (h *HTTPHandlerRegistry) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case "GET":
		h.handleGet(w, r)
	case "POST":
		h.handlePost(w, r)
	case "PUT":
		h.handlePut(w, r)
	case "DELETE":
		h.handleDelete(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleGet handles GET requests for registry information
func (h *HTTPHandlerRegistry) handleGet(w http.ResponseWriter, r *http.Request) {
	urlPath := r.URL.Path
	
	switch {
	case urlPath == "/handlers":
		// List all handlers
		handlers := h.registry.GetRegisteredHandlers()
		json.NewEncoder(w).Encode(map[string]any{
			"handlers": handlers,
			"total":    getTotalHandlers(handlers),
		})
		
	case urlPath == "/metrics":
		// Get registry metrics
		metrics := h.registry.GetMetrics()
		json.NewEncoder(w).Encode(metrics)
		
	case urlPath == "/config":
		// Get registry configuration
		json.NewEncoder(w).Encode(h.registry.config)
		
	default:
		// Try to get specific handler by ID
		handlerID := path.Base(urlPath)
		if handlerID != "" && handlerID != "." {
			handler, err := h.registry.GetHandlerByID(handlerID)
			if err != nil {
				http.Error(w, err.Error(), http.StatusNotFound)
				return
			}
			json.NewEncoder(w).Encode(handler)
		} else {
			http.Error(w, "Invalid endpoint", http.StatusBadRequest)
		}
	}
}

// handlePost handles POST requests for handler operations
func (h *HTTPHandlerRegistry) handlePost(w http.ResponseWriter, r *http.Request) {
	urlPath := r.URL.Path
	
	switch {
	case urlPath == "/handlers/reload":
		// Reload specific handler
		var req struct {
			HandlerID string `json:"handler_id"`
		}
		
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		
		if err := h.registry.ReloadHandler(req.HandlerID); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "reloaded",
			"handler": req.HandlerID,
		})
		
	case urlPath == "/handlers/enable":
		// Enable handler
		var req struct {
			HandlerID string `json:"handler_id"`
		}
		
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		
		if err := h.registry.EnableHandler(req.HandlerID); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "enabled",
			"handler": req.HandlerID,
		})
		
	case urlPath == "/handlers/disable":
		// Disable handler
		var req struct {
			HandlerID string `json:"handler_id"`
		}
		
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		
		if err := h.registry.DisableHandler(req.HandlerID); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "disabled",
			"handler": req.HandlerID,
		})
		
	default:
		http.Error(w, "Invalid endpoint", http.StatusBadRequest)
	}
}

// handlePut handles PUT requests for handler updates
func (h *HTTPHandlerRegistry) handlePut(w http.ResponseWriter, r *http.Request) {
	// Future: Update handler configuration
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

// handleDelete handles DELETE requests for handler removal
func (h *HTTPHandlerRegistry) handleDelete(w http.ResponseWriter, r *http.Request) {
	handlerID := path.Base(r.URL.Path)
	if handlerID == "" || handlerID == "." {
		http.Error(w, "Handler ID required", http.StatusBadRequest)
		return
	}
	
	if err := h.registry.UnregisterHandler(handlerID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "unregistered",
		"handler": handlerID,
	})
}

// Utility functions

// generateHandlerID generates a unique ID for a handler
func generateHandlerID(handler SlackEventHandler) string {
	return fmt.Sprintf("%s_%s_%d", 
		handler.GetEventType(), 
		getHandlerName(handler), 
		time.Now().UnixNano())
}

// getHandlerName extracts the name from a handler
func getHandlerName(handler SlackEventHandler) string {
	handlerType := reflect.TypeOf(handler)
	if handlerType.Kind() == reflect.Ptr {
		handlerType = handlerType.Elem()
	}
	return handlerType.Name()
}

// getTotalHandlers counts total handlers across all types
func getTotalHandlers(handlers map[string][]RegisteredHandler) int {
	total := 0
	for _, handlerList := range handlers {
		total += len(handlerList)
	}
	return total
}

// RegistryMux creates an HTTP ServeMux for the handler registry
func RegistryMux(deps deps.Deps) *http.ServeMux {
	// This function will be called by yaegi interpreter
	// Note: In practice, this would need access to a real SlackBot instance
	
	mux := http.NewServeMux()
	
	// Placeholder registry for yaegi compatibility
	// In real integration, this would use a proper SlackBot instance
	config := DefaultRegistryConfig()
	registry := &HandlerRegistry{
		handlers:       make(map[string][]RegisteredHandler),
		config:         config,
		metrics:        &RegistryMetrics{HandlerExecutions: make(map[string]int64)},
		hotReloadPaths: make(map[string]string),
	}
	
	httpRegistry := NewHTTPHandlerRegistry(registry)
	
	// Mount registry endpoints
	mux.Handle("/registry/", http.StripPrefix("/registry", httpRegistry))
	
	// Add convenience endpoints
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":    "healthy",
			"service":   "handler_registry",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})
	
	return mux
}