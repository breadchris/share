package slackbot

import (
	"context"
	"fmt"
	"net/http"
	"sort"
	"sync"

	"github.com/breadchris/flow/deps"
	"github.com/slack-go/slack/socketmode"
)

// EventRouter manages the routing of Slack events to appropriate handlers
// This router is designed to work with yaegi interpretation for hot-reload capabilities
type EventRouter struct {
	handlers    map[string][]SlackEventHandler
	mu          sync.RWMutex
	bot         *SlackBot
	deps        deps.Deps
	interceptors []EventInterceptor
}

// EventInterceptor allows for pre/post processing of events
type EventInterceptor interface {
	PreProcess(ctx context.Context, evt socketmode.Event) (context.Context, error)
	PostProcess(ctx context.Context, evt socketmode.Event, err error) error
}

// NewEventRouter creates a new event router with default handlers
func NewEventRouter(bot *SlackBot, deps deps.Deps) *EventRouter {
	router := &EventRouter{
		handlers:     make(map[string][]SlackEventHandler),
		bot:          bot,
		deps:         deps,
		interceptors: make([]EventInterceptor, 0),
	}

	// Register default handlers
	factory := NewHandlerFactory(bot)
	defaultHandlers := factory.CreateDefaultHandlers()
	
	for _, handler := range defaultHandlers {
		router.RegisterHandler(handler)
	}

	return router
}

// RegisterHandler adds a new event handler to the router
func (r *EventRouter) RegisterHandler(handler SlackEventHandler) {
	r.mu.Lock()
	defer r.mu.Unlock()

	eventType := handler.GetEventType()
	if r.handlers[eventType] == nil {
		r.handlers[eventType] = make([]SlackEventHandler, 0)
	}

	r.handlers[eventType] = append(r.handlers[eventType], handler)
	
	// Sort handlers by priority (higher priority first)
	sort.Slice(r.handlers[eventType], func(i, j int) bool {
		return r.handlers[eventType][i].GetPriority() > r.handlers[eventType][j].GetPriority()
	})
}

// UnregisterHandler removes a handler from the router
func (r *EventRouter) UnregisterHandler(eventType string, handler SlackEventHandler) {
	r.mu.Lock()
	defer r.mu.Unlock()

	handlers := r.handlers[eventType]
	for i, h := range handlers {
		if h == handler {
			r.handlers[eventType] = append(handlers[:i], handlers[i+1:]...)
			break
		}
	}
}

// RegisterInterceptor adds an event interceptor
func (r *EventRouter) RegisterInterceptor(interceptor EventInterceptor) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.interceptors = append(r.interceptors, interceptor)
}

// RouteEvent processes an event through the appropriate handlers
func (r *EventRouter) RouteEvent(ctx context.Context, evt socketmode.Event) error {
	// Run pre-processing interceptors
	for _, interceptor := range r.interceptors {
		var err error
		ctx, err = interceptor.PreProcess(ctx, evt)
		if err != nil {
			return fmt.Errorf("interceptor pre-process failed: %w", err)
		}
	}

	var lastError error
	handled := false

	// Get event type for routing
	eventType := r.getEventTypeFromEvent(evt)
	
	r.mu.RLock()
	handlers := r.handlers[eventType]
	r.mu.RUnlock()

	// Try event-specific handlers first
	for _, handler := range handlers {
		err := handler.HandleEvent(ctx, evt)
		if err == nil {
			handled = true
			break // Event successfully handled
		}
		lastError = err
	}

	// If no specific handler worked, try default handlers
	if !handled {
		r.mu.RLock()
		defaultHandlers := r.handlers["default"]
		r.mu.RUnlock()

		for _, handler := range defaultHandlers {
			err := handler.HandleEvent(ctx, evt)
			if err == nil {
				handled = true
				break
			}
			lastError = err
		}
	}

	// Run post-processing interceptors
	for _, interceptor := range r.interceptors {
		err := interceptor.PostProcess(ctx, evt, lastError)
		if err != nil {
			return fmt.Errorf("interceptor post-process failed: %w", err)
		}
	}

	if !handled && lastError != nil {
		return fmt.Errorf("event not handled: %w", lastError)
	}

	return nil
}

// getEventTypeFromEvent determines the event type for routing
func (r *EventRouter) getEventTypeFromEvent(evt socketmode.Event) string {
	switch evt.Type {
	case socketmode.EventTypeSlashCommand:
		return "slash_command"
	case socketmode.EventTypeEventsAPI:
		// For EventsAPI, we need to look at the inner event type
		return r.getEventsAPIEventType(evt)
	default:
		return "default"
	}
}

// getEventsAPIEventType extracts the specific event type from EventsAPI events
func (r *EventRouter) getEventsAPIEventType(evt socketmode.Event) string {
	// This is a simplified approach - in practice, you might want more sophisticated routing
	// based on the inner event type within EventsAPI events
	return "message" // Default to message for EventsAPI events
}

// GetRegisteredHandlers returns information about registered handlers
func (r *EventRouter) GetRegisteredHandlers() map[string][]HandlerInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make(map[string][]HandlerInfo)
	for eventType, handlers := range r.handlers {
		handlerInfos := make([]HandlerInfo, len(handlers))
		for i, handler := range handlers {
			handlerInfos[i] = HandlerInfo{
				EventType: handler.GetEventType(),
				Priority:  handler.GetPriority(),
				Type:      fmt.Sprintf("%T", handler),
			}
		}
		result[eventType] = handlerInfos
	}

	return result
}

// HandlerInfo provides information about a registered handler
type HandlerInfo struct {
	EventType string `json:"event_type"`
	Priority  int    `json:"priority"`
	Type      string `json:"type"`
}

// HTTPEventRouter wraps EventRouter to work with HTTP ServeMux for yaegi interpretation
type HTTPEventRouter struct {
	router *EventRouter
}

// NewHTTPEventRouter creates an HTTP-compatible event router
func NewHTTPEventRouter(deps deps.Deps) *HTTPEventRouter {
	// This will be initialized with a bot instance when integrated
	return &HTTPEventRouter{
		router: nil, // Will be set during integration
	}
}

// ServeHTTP implements http.Handler interface for yaegi compatibility
func (h *HTTPEventRouter) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if h.router == nil {
		http.Error(w, "Event router not initialized", http.StatusInternalServerError)
		return
	}

	// Return information about registered handlers
	handlers := h.router.GetRegisteredHandlers()
	
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{
		"status": "active",
		"message": "Slack event router is running",
		"handlers": %d,
		"types": %v
	}`, len(handlers), getEventTypes(handlers))
}

// getEventTypes extracts event types from handler info
func getEventTypes(handlers map[string][]HandlerInfo) []string {
	types := make([]string, 0, len(handlers))
	for eventType := range handlers {
		types = append(types, eventType)
	}
	return types
}

// EventRouterConfig configures the event router
type EventRouterConfig struct {
	EnableDebugLogging bool                   `json:"enable_debug_logging"`
	MaxHandlers        int                    `json:"max_handlers"`
	HandlerTimeout     int                    `json:"handler_timeout_seconds"`
	EnableMetrics      bool                   `json:"enable_metrics"`
	CustomHandlers     []CustomHandlerConfig  `json:"custom_handlers"`
}

// CustomHandlerConfig defines configuration for custom handlers
type CustomHandlerConfig struct {
	Name        string `json:"name"`
	EventType   string `json:"event_type"`
	Priority    int    `json:"priority"`
	HandlerFile string `json:"handler_file"`
	Enabled     bool   `json:"enabled"`
}

// RouterMetrics tracks event processing metrics
type RouterMetrics struct {
	EventsProcessed   int64            `json:"events_processed"`
	EventsHandled     int64            `json:"events_handled"`
	EventsFailed      int64            `json:"events_failed"`
	HandlerMetrics    map[string]int64 `json:"handler_metrics"`
	AverageProcessing float64          `json:"average_processing_ms"`
}

// LoggingInterceptor provides debug logging for events
type LoggingInterceptor struct {
	enableDebug bool
}

func NewLoggingInterceptor(enableDebug bool) *LoggingInterceptor {
	return &LoggingInterceptor{enableDebug: enableDebug}
}

func (l *LoggingInterceptor) PreProcess(ctx context.Context, evt socketmode.Event) (context.Context, error) {
	if l.enableDebug {
		fmt.Printf("Processing event: type=%s\n", evt.Type)
	}
	return ctx, nil
}

func (l *LoggingInterceptor) PostProcess(ctx context.Context, evt socketmode.Event, err error) error {
	if l.enableDebug {
		if err != nil {
			fmt.Printf("Event processing failed: type=%s, error=%v\n", evt.Type, err)
		} else {
			fmt.Printf("Event processed successfully: type=%s\n", evt.Type)
		}
	}
	return nil
}

// MetricsInterceptor tracks processing metrics
type MetricsInterceptor struct {
	metrics *RouterMetrics
	mu      sync.Mutex
}

func NewMetricsInterceptor() *MetricsInterceptor {
	return &MetricsInterceptor{
		metrics: &RouterMetrics{
			HandlerMetrics: make(map[string]int64),
		},
	}
}

func (m *MetricsInterceptor) PreProcess(ctx context.Context, evt socketmode.Event) (context.Context, error) {
	m.mu.Lock()
	m.metrics.EventsProcessed++
	m.mu.Unlock()
	return ctx, nil
}

func (m *MetricsInterceptor) PostProcess(ctx context.Context, evt socketmode.Event, err error) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if err != nil {
		m.metrics.EventsFailed++
	} else {
		m.metrics.EventsHandled++
	}
	
	// Track by event type
	eventType := string(evt.Type)
	m.metrics.HandlerMetrics[eventType]++
	
	return nil
}

func (m *MetricsInterceptor) GetMetrics() RouterMetrics {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	// Return copy of metrics
	result := *m.metrics
	result.HandlerMetrics = make(map[string]int64)
	for k, v := range m.metrics.HandlerMetrics {
		result.HandlerMetrics[k] = v
	}
	
	return result
}

// YaegiEventHandlerFactory creates handlers that can be interpreted by yaegi
type YaegiEventHandlerFactory struct {
	deps deps.Deps
	bot  *SlackBot
}

func NewYaegiEventHandlerFactory(deps deps.Deps, bot *SlackBot) *YaegiEventHandlerFactory {
	return &YaegiEventHandlerFactory{
		deps: deps,
		bot:  bot,
	}
}

// CreateInterpreterCompatibleHandler creates handlers compatible with yaegi interpretation
func (f *YaegiEventHandlerFactory) CreateInterpreterCompatibleHandler(handlerType string) http.Handler {
	factory := NewHandlerFactory(f.bot)
	handler := factory.CreateHandler(handlerType)
	
	return &HTTPSlackEventHandler{
		Handler: handler,
	}
}

// GetEventRouterMux returns an HTTP ServeMux for the event router
func (f *YaegiEventHandlerFactory) GetEventRouterMux() *http.ServeMux {
	mux := http.NewServeMux()
	
	// Add routes for different handler types
	mux.Handle("/handlers/slash_command", f.CreateInterpreterCompatibleHandler("slash_command"))
	mux.Handle("/handlers/message", f.CreateInterpreterCompatibleHandler("message"))
	mux.Handle("/handlers/app_mention", f.CreateInterpreterCompatibleHandler("app_mention"))
	mux.Handle("/handlers/reaction", f.CreateInterpreterCompatibleHandler("reaction"))
	mux.Handle("/handlers/file_shared", f.CreateInterpreterCompatibleHandler("file_shared"))
	
	// Add router status endpoint
	mux.Handle("/status", NewHTTPEventRouter(f.deps))
	
	return mux
}

// IntegratedEventRouter combines the event router with yaegi interpretation capabilities
func IntegratedEventRouter(deps deps.Deps) *http.ServeMux {
	// This function will be called by the yaegi interpreter
	// It creates a new SlackBot instance and sets up the event router
	
	// Note: In practice, this would need access to a real SlackBot instance
	// For now, we'll create a placeholder that can be properly initialized
	
	factory := &YaegiEventHandlerFactory{
		deps: deps,
		bot:  nil, // Will be set during proper integration
	}
	
	return factory.GetEventRouterMux()
}