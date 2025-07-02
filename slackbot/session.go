package slackbot

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/url"
	"strings"
	"time"

	"github.com/breadchris/share/coderunner/claude"
	"github.com/gorilla/websocket"
)

// createClaudeSession initializes a new Claude session for a Slack thread
func (b *SlackBot) createClaudeSession(userID, channelID, threadTS string) (*SlackClaudeSession, error) {
	sessionID, correlationID := b.createSessionID(userID)
	
	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    channelID,
		UserID:       userID,
		SessionID:    sessionID,
		ProcessID:    correlationID,
		LastActivity: time.Now(),
		Context:      b.config.WorkingDirectory,
		Active:       true,
	}
	
	// Store session
	b.setSession(threadTS, session)
	
	if b.config.Debug {
		slog.Debug("Created Claude session", 
			"thread_ts", threadTS,
			"session_id", sessionID,
			"correlation_id", correlationID)
	}
	
	return session, nil
}

// streamClaudeInteraction handles the bidirectional communication with Claude
func (b *SlackBot) streamClaudeInteraction(session *SlackClaudeSession, prompt string) {
	if b.config.Debug {
		slog.Debug("Starting Claude interaction", 
			"session_id", session.SessionID,
			"prompt_length", len(prompt))
	}

	// Connect to Claude WebSocket
	conn, err := b.connectToClaudeWS(session)
	if err != nil {
		slog.Error("Failed to connect to Claude WebSocket", "error", err)
		b.updateMessage(session.ChannelID, session.ThreadTS, 
			"❌ Failed to connect to Claude. Please try again later.")
		return
	}
	defer conn.Close()

	// Send initial prompt
	err = b.sendPromptToClaudeWS(conn, session, prompt)
	if err != nil {
		slog.Error("Failed to send prompt to Claude", "error", err)
		b.updateMessage(session.ChannelID, session.ThreadTS, 
			"❌ Failed to send prompt to Claude. Please try again.")
		return
	}

	// Stream responses back to Slack
	b.handleClaudeResponseStream(conn, session)
}

// connectToClaudeWS establishes a WebSocket connection to the Claude service
func (b *SlackBot) connectToClaudeWS(session *SlackClaudeSession) (*websocket.Conn, error) {
	// Construct WebSocket URL - assuming Claude service runs on same host
	// TODO: Make this configurable
	wsURL := url.URL{
		Scheme: "ws",
		Host:   "localhost:8080", // Default from main.go
		Path:   "/coderunner/claude/ws",
	}
	
	if b.config.Debug {
		slog.Debug("Connecting to Claude WebSocket", "url", wsURL.String())
	}
	
	conn, _, err := websocket.DefaultDialer.Dial(wsURL.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to dial Claude WebSocket: %w", err)
	}
	
	return conn, nil
}

// sendPromptToClaudeWS sends a prompt to Claude via WebSocket
func (b *SlackBot) sendPromptToClaudeWS(conn *websocket.Conn, session *SlackClaudeSession, prompt string) error {
	promptMsg := claude.ClaudePrompt{
		Prompt:    prompt,
		SessionID: session.SessionID,
	}
	
	promptPayload, err := json.Marshal(promptMsg)
	if err != nil {
		return fmt.Errorf("failed to marshal prompt: %w", err)
	}
	
	wsMsg := claude.WSMessage{
		Type:    "prompt",
		Payload: json.RawMessage(promptPayload),
	}
	
	if b.config.Debug {
		slog.Debug("Sending prompt to Claude", "session_id", session.SessionID)
	}
	
	return conn.WriteJSON(wsMsg)
}

// handleClaudeResponseStream processes the streaming response from Claude
func (b *SlackBot) handleClaudeResponseStream(conn *websocket.Conn, session *SlackClaudeSession) {
	var responseBuilder strings.Builder
	var currentMessageTS string
	lastUpdate := time.Now()
	
	// Create initial message in thread
	initialTS, err := b.postMessage(session.ChannelID, session.ThreadTS, "🤔 _Claude is thinking..._")
	if err != nil {
		slog.Error("Failed to create initial response message", "error", err)
		return
	}
	currentMessageTS = initialTS
	session.MessageTS = currentMessageTS

	for {
		var claudeMsg claude.ClaudeMessage
		err := conn.ReadJSON(&claudeMsg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("Claude WebSocket error", "error", err)
			}
			break
		}

		if b.config.Debug {
			slog.Debug("Received Claude message", 
				"type", claudeMsg.Type,
				"session_id", claudeMsg.SessionID)
		}

		// Update session activity
		b.updateSessionActivity(session.ThreadTS)

		// Process different message types
		switch claudeMsg.Type {
		case "assistant":
			// Append to response
			if claudeMsg.Result != "" {
				responseBuilder.WriteString(claudeMsg.Result)
			}
			
			// Update message periodically to avoid rate limits
			if time.Since(lastUpdate) > 2*time.Second {
				content := b.formatClaudeResponse(responseBuilder.String())
				if content != "" {
					err := b.updateMessage(session.ChannelID, currentMessageTS, content)
					if err != nil {
						slog.Error("Failed to update message", "error", err)
					}
					lastUpdate = time.Now()
				}
			}

		case "tool_use":
			// Format tool use for display
			toolDisplay := b.formatToolUse(&claudeMsg)
			responseBuilder.WriteString(toolDisplay)
			
			// Update message immediately for tool use
			content := b.formatClaudeResponse(responseBuilder.String())
			if content != "" {
				err := b.updateMessage(session.ChannelID, currentMessageTS, content)
				if err != nil {
					slog.Error("Failed to update message with tool use", "error", err)
				}
				lastUpdate = time.Now()
			}

		case "error":
			// Handle error messages
			errorMsg := fmt.Sprintf("❌ Error: %s", claudeMsg.Result)
			responseBuilder.WriteString("\n\n" + errorMsg)
			
			content := b.formatClaudeResponse(responseBuilder.String())
			err := b.updateMessage(session.ChannelID, currentMessageTS, content)
			if err != nil {
				slog.Error("Failed to update message with error", "error", err)
			}

		case "completion":
			// Final update
			content := b.formatClaudeResponse(responseBuilder.String())
			if content != "" {
				err := b.updateMessage(session.ChannelID, currentMessageTS, content)
				if err != nil {
					slog.Error("Failed to send final update", "error", err)
				}
			}
			
			if b.config.Debug {
				slog.Debug("Claude interaction completed", "session_id", session.SessionID)
			}
			return

		default:
			if b.config.Debug {
				slog.Debug("Unhandled Claude message type", "type", claudeMsg.Type)
			}
		}
	}

	// Send final update if we exited the loop without completion
	if responseBuilder.Len() > 0 {
		content := b.formatClaudeResponse(responseBuilder.String())
		if content != "" {
			err := b.updateMessage(session.ChannelID, currentMessageTS, content)
			if err != nil {
				slog.Error("Failed to send final update after loop exit", "error", err)
			}
		}
	}
}

// sendToClaudeSession sends a follow-up message to an existing Claude session
func (b *SlackBot) sendToClaudeSession(session *SlackClaudeSession, message string) {
	if !session.Active {
		slog.Warn("Attempted to send message to inactive session", "session_id", session.SessionID)
		return
	}

	if b.config.Debug {
		slog.Debug("Sending follow-up to Claude session", 
			"session_id", session.SessionID,
			"message_length", len(message))
	}

	go func() {
		// Connect to Claude WebSocket
		conn, err := b.connectToClaudeWS(session)
		if err != nil {
			slog.Error("Failed to connect to Claude WebSocket for follow-up", "error", err)
			_, err := b.postMessage(session.ChannelID, session.ThreadTS, 
				"❌ Failed to connect to Claude. Please try again.")
			if err != nil {
				slog.Error("Failed to post error message", "error", err)
			}
			return
		}
		defer conn.Close()

		// Send follow-up message
		err = b.sendPromptToClaudeWS(conn, session, message)
		if err != nil {
			slog.Error("Failed to send follow-up to Claude", "error", err)
			_, err := b.postMessage(session.ChannelID, session.ThreadTS, 
				"❌ Failed to send message to Claude. Please try again.")
			if err != nil {
				slog.Error("Failed to post error message", "error", err)
			}
			return
		}

		// Handle the response stream
		b.handleClaudeResponseStream(conn, session)
	}()
}