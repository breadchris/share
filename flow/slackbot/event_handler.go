package slackbot

import (
	"context"
	"fmt"
	"net/http"

	"github.com/slack-go/slack"
	"github.com/slack-go/slack/slackevents"
	"github.com/slack-go/slack/socketmode"
)

// SlackEventHandler defines the interface for handling different types of Slack events
// This abstraction allows for yaegi interpretation of event handlers
type SlackEventHandler interface {
	// HandleEvent processes a Slack event and returns an error if processing fails
	HandleEvent(ctx context.Context, evt socketmode.Event) error
	
	// GetEventType returns the type of event this handler can process
	GetEventType() string
	
	// GetPriority returns the priority of this handler (higher numbers = higher priority)
	GetPriority() int
}

// HTTPSlackEventHandler wraps SlackEventHandler to work with HTTP ServeMux pattern
// This allows yaegi interpretation via the existing DynamicHTTPMux system
type HTTPSlackEventHandler struct {
	Handler SlackEventHandler
}

// ServeHTTP implements http.Handler interface to make slack events compatible with HTTP routing
func (h *HTTPSlackEventHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// This is a bridge - in practice, we'll use the event router to dispatch events
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Slack event handler: %s", h.Handler.GetEventType())
}

// BaseSlackEventHandler provides common functionality for event handlers
type BaseSlackEventHandler struct {
	EventType string
	Priority  int
	Bot       *SlackBot
}

func (b *BaseSlackEventHandler) GetEventType() string {
	return b.EventType
}

func (b *BaseSlackEventHandler) GetPriority() int {
	return b.Priority
}

// SlashCommandHandler handles slash command events
type SlashCommandHandler struct {
	BaseSlackEventHandler
}

func NewSlashCommandHandler(bot *SlackBot) *SlashCommandHandler {
	return &SlashCommandHandler{
		BaseSlackEventHandler: BaseSlackEventHandler{
			EventType: "slash_command",
			Priority:  100,
			Bot:       bot,
		},
	}
}

func (h *SlashCommandHandler) HandleEvent(ctx context.Context, evt socketmode.Event) error {
	if evt.Type != socketmode.EventTypeSlashCommand {
		return fmt.Errorf("unexpected event type: %s", evt.Type)
	}

	cmd, ok := evt.Data.(slack.SlashCommand)
	if !ok {
		return fmt.Errorf("invalid slash command data")
	}

	// Route to existing slash command handling logic
	h.Bot.handleSlashCommand(&evt, &cmd)
	return nil
}

// MessageEventHandler handles message events (thread replies)
type MessageEventHandler struct {
	BaseSlackEventHandler
}

func NewMessageEventHandler(bot *SlackBot) *MessageEventHandler {
	return &MessageEventHandler{
		BaseSlackEventHandler: BaseSlackEventHandler{
			EventType: "message",
			Priority:  90,
			Bot:       bot,
		},
	}
}

func (h *MessageEventHandler) HandleEvent(ctx context.Context, evt socketmode.Event) error {
	if evt.Type != socketmode.EventTypeEventsAPI {
		return fmt.Errorf("unexpected event type: %s", evt.Type)
	}

	eventsAPIEvent, ok := evt.Data.(slackevents.EventsAPIEvent)
	if !ok {
		return fmt.Errorf("invalid events API data")
	}

	if eventsAPIEvent.Type != slackevents.CallbackEvent {
		return nil // Not a callback event, ignore
	}

	innerEvent := eventsAPIEvent.InnerEvent
	if innerEvent.Type != "message" {
		return nil // Not a message event, ignore
	}

	msgEvent, ok := innerEvent.Data.(*slackevents.MessageEvent)
	if !ok {
		return fmt.Errorf("invalid message event data")
	}

	// Route to existing message handling logic
	h.Bot.handleMessageEvent(msgEvent)
	return nil
}

// AppMentionHandler handles app mention events
type AppMentionHandler struct {
	BaseSlackEventHandler
}

func NewAppMentionHandler(bot *SlackBot) *AppMentionHandler {
	return &AppMentionHandler{
		BaseSlackEventHandler: BaseSlackEventHandler{
			EventType: "app_mention",
			Priority:  95,
			Bot:       bot,
		},
	}
}

func (h *AppMentionHandler) HandleEvent(ctx context.Context, evt socketmode.Event) error {
	if evt.Type != socketmode.EventTypeEventsAPI {
		return fmt.Errorf("unexpected event type: %s", evt.Type)
	}

	eventsAPIEvent, ok := evt.Data.(slackevents.EventsAPIEvent)
	if !ok {
		return fmt.Errorf("invalid events API data")
	}

	if eventsAPIEvent.Type != slackevents.CallbackEvent {
		return nil // Not a callback event, ignore
	}

	innerEvent := eventsAPIEvent.InnerEvent
	if innerEvent.Type != "app_mention" {
		return nil // Not an app mention event, ignore
	}

	mentionEvent, ok := innerEvent.Data.(*slackevents.AppMentionEvent)
	if !ok {
		return fmt.Errorf("invalid app mention event data")
	}

	// Route to existing app mention handling logic
	h.Bot.handleAppMentionEvent(mentionEvent)
	return nil
}

// ReactionEventHandler handles reaction added/removed events
type ReactionEventHandler struct {
	BaseSlackEventHandler
}

func NewReactionEventHandler(bot *SlackBot) *ReactionEventHandler {
	return &ReactionEventHandler{
		BaseSlackEventHandler: BaseSlackEventHandler{
			EventType: "reaction",
			Priority:  80,
			Bot:       bot,
		},
	}
}

func (h *ReactionEventHandler) HandleEvent(ctx context.Context, evt socketmode.Event) error {
	if evt.Type != socketmode.EventTypeEventsAPI {
		return fmt.Errorf("unexpected event type: %s", evt.Type)
	}

	eventsAPIEvent, ok := evt.Data.(slackevents.EventsAPIEvent)
	if !ok {
		return fmt.Errorf("invalid events API data")
	}

	if eventsAPIEvent.Type != slackevents.CallbackEvent {
		return nil // Not a callback event, ignore
	}

	innerEvent := eventsAPIEvent.InnerEvent
	
	switch innerEvent.Type {
	case "reaction_added":
		reactionEvent, ok := innerEvent.Data.(*slackevents.ReactionAddedEvent)
		if !ok {
			return fmt.Errorf("invalid reaction added event data")
		}
		h.Bot.handleReactionEvent(reactionEvent, false)
		return nil
		
	case "reaction_removed":
		reactionEvent, ok := innerEvent.Data.(*slackevents.ReactionRemovedEvent)
		if !ok {
			return fmt.Errorf("invalid reaction removed event data")
		}
		// Convert to ReactionAddedEvent type for the handler
		addedEvent := &slackevents.ReactionAddedEvent{
			Type:           reactionEvent.Type,
			User:           reactionEvent.User,
			Reaction:       reactionEvent.Reaction,
			ItemUser:       reactionEvent.ItemUser,
			Item:           reactionEvent.Item,
			EventTimestamp: reactionEvent.EventTimestamp,
		}
		h.Bot.handleReactionEvent(addedEvent, true)
		return nil
		
	default:
		return nil // Not a reaction event, ignore
	}
}

// FileSharedHandler handles file shared events
type FileSharedHandler struct {
	BaseSlackEventHandler
}

func NewFileSharedHandler(bot *SlackBot) *FileSharedHandler {
	return &FileSharedHandler{
		BaseSlackEventHandler: BaseSlackEventHandler{
			EventType: "file_shared",
			Priority:  85,
			Bot:       bot,
		},
	}
}

func (h *FileSharedHandler) HandleEvent(ctx context.Context, evt socketmode.Event) error {
	if evt.Type != socketmode.EventTypeEventsAPI {
		return fmt.Errorf("unexpected event type: %s", evt.Type)
	}

	eventsAPIEvent, ok := evt.Data.(slackevents.EventsAPIEvent)
	if !ok {
		return fmt.Errorf("invalid events API data")
	}

	if eventsAPIEvent.Type != slackevents.CallbackEvent {
		return nil // Not a callback event, ignore
	}

	innerEvent := eventsAPIEvent.InnerEvent
	if innerEvent.Type != "file_shared" {
		return nil // Not a file shared event, ignore
	}

	fileEvent, ok := innerEvent.Data.(*slackevents.FileSharedEvent)
	if !ok {
		return fmt.Errorf("invalid file shared event data")
	}

	// Route to existing file handling logic
	h.Bot.handleFileSharedEvent(fileEvent)
	return nil
}

// DefaultEventHandler handles any unrecognized events
type DefaultEventHandler struct {
	BaseSlackEventHandler
}

func NewDefaultEventHandler(bot *SlackBot) *DefaultEventHandler {
	return &DefaultEventHandler{
		BaseSlackEventHandler: BaseSlackEventHandler{
			EventType: "default",
			Priority:  1, // Lowest priority
			Bot:       bot,
		},
	}
}

func (h *DefaultEventHandler) HandleEvent(ctx context.Context, evt socketmode.Event) error {
	// Log unhandled events for debugging
	if h.Bot != nil {
		// Use existing logging infrastructure
		fmt.Printf("Unhandled event type: %s\n", evt.Type)
	}
	return nil // Don't error on unhandled events
}

// HandlerFactory creates handlers for different event types
type HandlerFactory struct {
	bot *SlackBot
}

func NewHandlerFactory(bot *SlackBot) *HandlerFactory {
	return &HandlerFactory{bot: bot}
}

// CreateDefaultHandlers creates the standard set of event handlers
func (f *HandlerFactory) CreateDefaultHandlers() []SlackEventHandler {
	return []SlackEventHandler{
		NewSlashCommandHandler(f.bot),
		NewMessageEventHandler(f.bot),
		NewAppMentionHandler(f.bot),
		NewReactionEventHandler(f.bot),
		NewFileSharedHandler(f.bot),
		NewDefaultEventHandler(f.bot),
	}
}

// CreateHandler creates a specific handler by name
func (f *HandlerFactory) CreateHandler(handlerType string) SlackEventHandler {
	switch handlerType {
	case "slash_command":
		return NewSlashCommandHandler(f.bot)
	case "message":
		return NewMessageEventHandler(f.bot)
	case "app_mention":
		return NewAppMentionHandler(f.bot)
	case "reaction":
		return NewReactionEventHandler(f.bot)
	case "file_shared":
		return NewFileSharedHandler(f.bot)
	default:
		return NewDefaultEventHandler(f.bot)
	}
}

// HandlerMetadata provides information about available handlers
type HandlerMetadata struct {
	Name        string `json:"name"`
	EventType   string `json:"event_type"`
	Priority    int    `json:"priority"`
	Description string `json:"description"`
}

// GetAvailableHandlers returns metadata about all available handlers
func (f *HandlerFactory) GetAvailableHandlers() []HandlerMetadata {
	return []HandlerMetadata{
		{
			Name:        "SlashCommandHandler",
			EventType:   "slash_command",
			Priority:    100,
			Description: "Handles slash commands like /flow, /explore, /context",
		},
		{
			Name:        "MessageEventHandler",
			EventType:   "message",
			Priority:    90,
			Description: "Handles message events in threads with bot mentions",
		},
		{
			Name:        "AppMentionHandler",
			EventType:   "app_mention",
			Priority:    95,
			Description: "Handles direct mentions of the bot in channels",
		},
		{
			Name:        "ReactionEventHandler",
			EventType:   "reaction",
			Priority:    80,
			Description: "Handles reaction added/removed events for ideation feedback",
		},
		{
			Name:        "FileSharedHandler",
			EventType:   "file_shared",
			Priority:    85,
			Description: "Handles file uploads for image analysis and context",
		},
		{
			Name:        "DefaultEventHandler",
			EventType:   "default",
			Priority:    1,
			Description: "Fallback handler for unrecognized event types",
		},
	}
}