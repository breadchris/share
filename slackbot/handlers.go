package slackbot

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/slack-go/slack"
	"github.com/slack-go/slack/slackevents"
	"github.com/slack-go/slack/socketmode"
)

// handleSlashCommand processes incoming slash commands
func (b *SlackBot) handleSlashCommand(evt *socketmode.Event, cmd *slack.SlashCommand) {
	defer b.socketMode.Ack(*evt.Request)

	switch cmd.Command {
	case "/flow":
		b.handleFlowCommand(evt, cmd)
	default:
		// Send ephemeral response for unknown commands
		response := map[string]interface{}{
			"response_type": "ephemeral",
			"text":          fmt.Sprintf("Unknown command: %s", cmd.Command),
		}
		
		payload, _ := json.Marshal(response)
		b.socketMode.Ack(*evt.Request, payload)
	}
}

// handleFlowCommand processes /flow slash commands
func (b *SlackBot) handleFlowCommand(evt *socketmode.Event, cmd *slack.SlashCommand) {
	if b.config.Debug {
		slog.Debug("Handling /flow command", 
			"user_id", cmd.UserID, 
			"channel_id", cmd.ChannelID,
			"text", cmd.Text)
	}

	// Validate that we have content to work with
	content := strings.TrimSpace(cmd.Text)
	if content == "" {
		response := map[string]interface{}{
			"response_type": "ephemeral",
			"text":          "Please provide a prompt for Claude. Example: `/flow Help me debug this Go code`",
		}
		payload, _ := json.Marshal(response)
		b.socketMode.Ack(*evt.Request, payload)
		return
	}

	// Send immediate response to acknowledge the command
	response := map[string]interface{}{
		"response_type": "in_channel",
		"text":          "🤖 Starting Claude session...",
	}
	_, _ = json.Marshal(response)
	
	// Create the initial message and thread
	go func() {
		// Post initial message to create thread
		_, threadTS, err := b.client.PostMessage(cmd.ChannelID,
			slack.MsgOptionText("🤖 Starting Claude session...", false),
			slack.MsgOptionAsUser(true),
		)
		if err != nil {
			slog.Error("Failed to create thread", "error", err)
			return
		}

		// Create Claude session
		session, err := b.createClaudeSession(cmd.UserID, cmd.ChannelID, threadTS)
		if err != nil {
			slog.Error("Failed to create Claude session", "error", err)
			b.updateMessage(cmd.ChannelID, threadTS, "❌ Failed to start Claude session. Please try again.")
			return
		}

		// Start Claude interaction in the thread
		b.streamClaudeInteraction(session, content)
	}()
}

// handleEventsAPI processes Events API events
func (b *SlackBot) handleEventsAPI(evt *socketmode.Event, eventsAPIEvent *slackevents.EventsAPIEvent) {
	defer b.socketMode.Ack(*evt.Request)

	switch eventsAPIEvent.Type {
	case slackevents.CallbackEvent:
		innerEvent := eventsAPIEvent.InnerEvent
		switch ev := innerEvent.Data.(type) {
		case *slackevents.MessageEvent:
			b.handleMessageEvent(ev)
		case *slackevents.AppMentionEvent:
			b.handleAppMentionEvent(ev)
		}
	default:
		if b.config.Debug {
			slog.Debug("Unhandled events API event", "type", eventsAPIEvent.Type)
		}
	}
}

// handleMessageEvent processes message events (including thread replies)
func (b *SlackBot) handleMessageEvent(ev *slackevents.MessageEvent) {
	// Ignore messages from bots and our own messages
	if ev.BotID != "" || ev.User == "" {
		return
	}

	// Only handle thread replies (messages with ThreadTimeStamp)
	if ev.ThreadTimeStamp == "" {
		return
	}

	// Check if this is a thread we're managing
	session, exists := b.getSession(ev.ThreadTimeStamp)
	if !exists {
		return
	}

	// Update session activity
	b.updateSessionActivity(ev.ThreadTimeStamp)

	if b.config.Debug {
		slog.Debug("Handling thread reply", 
			"user_id", ev.User,
			"channel_id", ev.Channel,
			"thread_ts", ev.ThreadTimeStamp,
			"text", ev.Text)
	}

	// Send the message to Claude
	b.sendToClaudeSession(session, ev.Text)
}

// handleAppMentionEvent processes app mention events
func (b *SlackBot) handleAppMentionEvent(ev *slackevents.AppMentionEvent) {
	// For now, treat app mentions like /flow commands
	// Remove the bot mention from the text
	text := strings.TrimSpace(ev.Text)
	
	// Remove bot mention (format: <@BOTID>)
	if strings.HasPrefix(text, "<@") {
		parts := strings.SplitN(text, ">", 2)
		if len(parts) == 2 {
			text = strings.TrimSpace(parts[1])
		}
	}

	if text == "" {
		_, _, err := b.client.PostMessage(ev.Channel,
			slack.MsgOptionText("👋 Hi! Use `/flow <your prompt>` to start a conversation with Claude.", false),
			slack.MsgOptionTS(ev.ThreadTimeStamp), // Reply in thread if mentioned in a thread
		)
		if err != nil {
			slog.Error("Failed to respond to app mention", "error", err)
		}
		return
	}

	if b.config.Debug {
		slog.Debug("Handling app mention", 
			"user_id", ev.User,
			"channel_id", ev.Channel,
			"text", text)
	}

	// Create a new thread for the Claude session
	go func() {
		_, threadTS, err := b.client.PostMessage(ev.Channel,
			slack.MsgOptionText("🤖 Starting Claude session...", false),
			slack.MsgOptionAsUser(true),
		)
		if err != nil {
			slog.Error("Failed to create thread for app mention", "error", err)
			return
		}

		// Create Claude session
		session, err := b.createClaudeSession(ev.User, ev.Channel, threadTS)
		if err != nil {
			slog.Error("Failed to create Claude session for app mention", "error", err)
			b.updateMessage(ev.Channel, threadTS, "❌ Failed to start Claude session. Please try again.")
			return
		}

		// Start Claude interaction
		b.streamClaudeInteraction(session, text)
	}()
}

// updateMessage updates a Slack message
func (b *SlackBot) updateMessage(channel, timestamp, text string) error {
	_, _, _, err := b.client.UpdateMessage(channel, timestamp,
		slack.MsgOptionText(text, false),
		slack.MsgOptionAsUser(true),
	)
	return err
}

// postMessage posts a new message to a channel/thread
func (b *SlackBot) postMessage(channel, threadTS, text string) (string, error) {
	options := []slack.MsgOption{
		slack.MsgOptionText(text, false),
		slack.MsgOptionAsUser(true),
	}
	
	if threadTS != "" {
		options = append(options, slack.MsgOptionTS(threadTS))
	}
	
	_, timestamp, err := b.client.PostMessage(channel, options...)
	return timestamp, err
}