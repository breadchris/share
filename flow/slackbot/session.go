package slackbot

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/breadchris/flow/claude"
)

// createClaudeSession initializes a new Claude session for a Slack thread
func (b *SlackBot) createClaudeSession(userID, channelID, threadTS string) (*SlackClaudeSession, error) {
	return b.resumeOrCreateSession(userID, channelID, threadTS)
}

// resumeOrCreateSession attempts to resume an existing session or creates a new one
func (b *SlackBot) resumeOrCreateSession(userID, channelID, threadTS string) (*SlackClaudeSession, error) {
	if err := os.MkdirAll(b.config.WorkingDirectory, 0755); err != nil && !os.IsExist(err) {
		return nil, fmt.Errorf("failed to ensure working directory: %w", err)
	}

	// First, try to find existing session in database
	sessionInfo, err := b.claudeService.GetSessionInfo(threadTS, userID)
	if err != nil {
		slog.Error("Failed to query existing session", "error", err, "thread_ts", threadTS)
		// Continue to create new session
	}

	if sessionInfo != nil && sessionInfo.Active {
		// Try to resume existing session
		if b.config.Debug {
			slog.Debug("Found existing session, attempting to resume",
				"session_id", sessionInfo.SessionID,
				"thread_ts", threadTS,
				"process_exists", sessionInfo.ProcessExists)
		}

		// If process doesn't exist in memory, try to resume it
		if !sessionInfo.ProcessExists {
			process, err := b.claudeService.ResumeSession(sessionInfo.SessionID, userID)
			if err != nil {
				slog.Warn("Failed to resume Claude session, creating new one",
					"session_id", sessionInfo.SessionID,
					"thread_ts", threadTS,
					"error", err)
				// Fall through to create new session
			} else {
				// Successfully resumed
				session := &SlackClaudeSession{
					ThreadTS:     threadTS,
					ChannelID:    channelID,
					UserID:       userID,
					SessionID:    sessionInfo.SessionID,
					ProcessID:    process.GetCorrelationID(),
					LastActivity: time.Now(),
					Context:      sessionInfo.WorkingDir,
					Active:       true,
					Resumed:      true,
					Process:      process,
					SessionInfo:  sessionInfo,
				}

				// Store session
				b.setSession(threadTS, session)

				// Create context tracking for this resumed Claude session
				if b.contextManager != nil {
					b.contextManager.CreateContext(threadTS, channelID, userID, "claude", "Claude session (resumed)")
				}

				if b.config.Debug {
					slog.Debug("Resumed Claude session successfully",
						"thread_ts", threadTS,
						"session_id", sessionInfo.SessionID,
						"working_dir", sessionInfo.WorkingDir)
				}

				return session, nil
			}
		} else {
			// Process exists in memory, just recreate the SlackClaudeSession
			if b.config.Debug {
				slog.Debug("Session process exists in memory, recreating session object",
					"session_id", sessionInfo.SessionID,
					"thread_ts", threadTS)
			}

			session := &SlackClaudeSession{
				ThreadTS:     threadTS,
				ChannelID:    channelID,
				UserID:       userID,
				SessionID:    sessionInfo.SessionID,
				ProcessID:    "", // Will be updated when process is accessed
				LastActivity: time.Now(),
				Context:      sessionInfo.WorkingDir,
				Active:       true,
				Resumed:      false, // Not newly resumed, was already active
				Process:      nil,   // Will be retrieved from service when needed
				SessionInfo:  sessionInfo,
			}

			// Store session
			b.setSession(threadTS, session)

			return session, nil
		}
	}

	// Create new session
	// Double-check that we don't have a race condition - look for session one more time
	existingSession, err := b.sessionDB.GetSession(threadTS)
	if err == nil && existingSession != nil && existingSession.Active {
		if b.config.Debug {
			slog.Debug("Found existing session during race condition check",
				"thread_ts", threadTS,
				"session_id", existingSession.SessionID)
		}
		
		// Try to resume this session instead of creating a new one
		process, err := b.claudeService.ResumeSession(existingSession.SessionID, userID)
		if err == nil {
			existingSession.Process = process
			existingSession.Resumed = true
			existingSession.LastActivity = time.Now()
			
			// Store updated session
			b.setSession(threadTS, existingSession)
			return existingSession, nil
		}
		// If resume fails, continue with creating new session
		if b.config.Debug {
			slog.Debug("Failed to resume found session, creating new one", "error", err)
		}
	}

	process, newSessionInfo, err := b.claudeService.CreateSessionWithPersistence(threadTS, channelID, userID, b.config.WorkingDirectory)
	if err != nil {
		return nil, fmt.Errorf("failed to create Claude session: %w", err)
	}

	session := &SlackClaudeSession{
		ThreadTS:     threadTS,
		ChannelID:    channelID,
		UserID:       userID,
		SessionID:    newSessionInfo.SessionID,
		ProcessID:    process.GetCorrelationID(),
		LastActivity: time.Now(),
		Context:      b.config.WorkingDirectory,
		Active:       true,
		Resumed:      false,
		Process:      process,
		SessionInfo:  newSessionInfo,
	}

	// Store session
	b.setSession(threadTS, session)

	// Create context tracking for this new Claude session
	if b.contextManager != nil {
		b.contextManager.CreateContext(threadTS, channelID, userID, "claude", "Claude session")
	}

	if b.config.Debug {
		slog.Debug("Created new Claude session",
			"thread_ts", threadTS,
			"session_id", newSessionInfo.SessionID,
			"working_dir", newSessionInfo.WorkingDir)
	}

	// Communicate session ID to user
	go func() {
		// Small delay to ensure session creation message order
		time.Sleep(500 * time.Millisecond)
		sessionMsg := fmt.Sprintf("📋 **Session ID:** `%s`\n🔗 **Component URL:** %s/data/session/%s/", 
			newSessionInfo.SessionID, 
			b.getExternalURL(),
			newSessionInfo.SessionID)
		
		_, err := b.postMessage(channelID, threadTS, sessionMsg)
		if err != nil {
			slog.Error("Failed to post session ID message", "error", err)
		}
	}()

	return session, nil
}

// streamClaudeInteraction handles the bidirectional communication with Claude
func (b *SlackBot) streamClaudeInteraction(session *SlackClaudeSession, prompt string) {
	if b.config.Debug {
		slog.Debug("Starting Claude interaction",
			"session_id", session.SessionID,
			"prompt_length", len(prompt),
			"resumed", session.Resumed)
	}

	ctx := context.Background()

	// Use existing process or create/resume as needed
	process := session.Process
	if process == nil {
		// This should not happen for new sessions, but handle it gracefully
		slog.Error("No Claude process available for session", "session_id", session.SessionID)
		b.updateMessage(session.ChannelID, session.ThreadTS,
			"❌ Failed to access Claude session. Please try again.")
		return
	}

	// Send prompt to Claude
	if err := b.claudeService.SendMessage(process, prompt); err != nil {
		slog.Error("Failed to send prompt to Claude", "error", err)
		b.updateMessage(session.ChannelID, session.ThreadTS,
			"❌ Failed to send prompt to Claude. Please try again.")
		return
	}

	if b.config.Debug {
		slog.Debug("Sent prompt to Claude, starting response stream",
			"session_id", session.SessionID,
			"prompt_length", len(prompt),
			"resumed", session.Resumed)
	}

	// Stream responses back to Slack
	b.handleClaudeResponseStream(ctx, process, session)
}

// handleClaudeResponseStream processes the streaming response from Claude
func (b *SlackBot) handleClaudeResponseStream(ctx context.Context, process *claude.Process, session *SlackClaudeSession) {
	// Get message channel from Claude service
	messageChan := b.claudeService.ReceiveMessages(process)
	timeout := time.After(5 * time.Minute)

	if b.config.Debug {
		slog.Debug("Starting to receive messages from Claude",
			"session_id", session.SessionID,
			"channel_available", messageChan != nil)
	}

	messageCount := 0
	for {
		select {
		case <-timeout:
			slog.Error("Claude response timeout",
				"session_id", session.SessionID,
				"messages_received", messageCount)
			_, err := b.postMessage(session.ChannelID, session.ThreadTS, "❌ Claude response timed out. Please try again.")
			if err != nil {
				slog.Error("Failed to post timeout message", "error", err)
			}
			return

		case <-ctx.Done():
			slog.Debug("Context cancelled during Claude interaction")
			return

		case claudeMsg, ok := <-messageChan:
			messageCount++
			if !ok {
				// Channel closed - Claude finished
				if b.config.Debug {
					slog.Debug("Claude message channel closed",
						"session_id", session.SessionID,
						"total_messages", messageCount)
				}
				return
			}

			if b.config.Debug {
				slog.Debug("Received Claude message",
					"type", claudeMsg.Type,
					"subtype", claudeMsg.Subtype,
					"session_id", claudeMsg.SessionID,
					"message_length", len(claudeMsg.Message),
					"has_result", claudeMsg.Result != "",
					"raw_message_preview", func() string {
						if len(claudeMsg.Message) > 200 {
							return string(claudeMsg.Message[:200]) + "..."
						}
						return string(claudeMsg.Message)
					}())
			}

			// Update session activity
			b.updateSessionActivity(session.ThreadTS)

			// Process different message types - post individual messages for each
			switch claudeMsg.Type {
			case "assistant":
				fallthrough
			case "message":
				fallthrough
			case "user":
				fallthrough
			case "text":
				// Parse Claude message JSON structure to extract text content
				if len(claudeMsg.Message) > 0 {
					// Try to parse as Claude message format first
					var messageContent struct {
						Content []struct {
							Type string `json:"type"`
							Text string `json:"text"`
						} `json:"content"`
					}

					if err := json.Unmarshal(claudeMsg.Message, &messageContent); err == nil {
						// Successfully parsed Claude message format
						for _, content := range messageContent.Content {
							if content.Type == "text" && content.Text != "" {
								formattedContent := b.formatClaudeResponse(content.Text)
								_, err := b.postMessage(session.ChannelID, session.ThreadTS, formattedContent)
								if err != nil {
									slog.Error("Failed to post parsed text message", "error", err)
								} else if b.config.Debug {
									slog.Debug("Posted parsed text message to Slack",
										"content_length", len(content.Text))
								}
							}
						}
					} else {
						// Fallback to treating the entire message as text content
						textContent := string(claudeMsg.Message)
						// Skip empty or very short messages that might be artifacts
						if len(textContent) > 3 {
							formattedContent := b.formatClaudeResponse(textContent)
							_, err := b.postMessage(session.ChannelID, session.ThreadTS, formattedContent)
							if err != nil {
								slog.Error("Failed to post fallback text message", "error", err)
							} else if b.config.Debug {
								slog.Debug("Posted fallback text message to Slack",
									"content_length", len(textContent))
							}
						}
					}
				}

			case "tool_use":
				// Post tool usage as individual message
				if claudeMsg.Subtype == "start" {
					// Tool is starting
					_, err := b.postMessage(session.ChannelID, session.ThreadTS, "🔧 _Claude is using tools..._")
					if err != nil {
						slog.Error("Failed to post tool start message", "error", err)
					} else if b.config.Debug {
						slog.Debug("Posted tool start message to Slack")
					}
				} else if claudeMsg.Subtype == "result" {
					// Tool completed - show result
					toolDisplay := b.formatToolUse(&claudeMsg)
					if toolDisplay != "" {
						_, err := b.postMessage(session.ChannelID, session.ThreadTS, toolDisplay)
						if err != nil {
							slog.Error("Failed to post tool result message", "error", err)
						} else if b.config.Debug {
							slog.Debug("Posted tool result message to Slack")
						}
					}
				} else {
					// Generic tool use message
					toolDisplay := b.formatToolUse(&claudeMsg)
					if toolDisplay != "" {
						_, err := b.postMessage(session.ChannelID, session.ThreadTS, toolDisplay)
						if err != nil {
							slog.Error("Failed to post tool message", "error", err)
						} else if b.config.Debug {
							slog.Debug("Posted tool message to Slack")
						}
					}
				}

			case "error":
				// Post error as individual message
				var errorText string
				if len(claudeMsg.Message) > 0 {
					errorText = string(claudeMsg.Message)
				} else if claudeMsg.Result != "" {
					errorText = claudeMsg.Result
				} else {
					errorText = "Unknown error occurred"
				}

				errorMsg := fmt.Sprintf("❌ **Error:** %s", errorText)
				_, err := b.postMessage(session.ChannelID, session.ThreadTS, errorMsg)
				if err != nil {
					slog.Error("Failed to post error message", "error", err)
				}

			case "completion":
				// Claude has finished - optionally post completion message
				if b.config.Debug {
					slog.Debug("Claude interaction completed",
						"session_id", session.SessionID,
						"total_messages", messageCount)
				}
				// Note: Not posting a completion message to keep the conversation clean
				return

			//case "result":
			//	// Handle tool use result messages
			//	if b.config.Debug {
			//		slog.Debug("Received tool use result",
			//			"session_id", session.SessionID,
			//			"result_length", len(claudeMsg.Result))
			//	}
			//	continue

			case "system":
				// Handle system messages (like init messages)
				if b.config.Debug {
					slog.Debug("Received system message", "subtype", claudeMsg.Subtype)
				}
				// Don't forward system messages to Slack
				continue

			default:
				// Handle unknown message types
				if b.config.Debug {
					slog.Debug("Unhandled Claude message type",
						"type", claudeMsg.Type,
						"subtype", claudeMsg.Subtype,
						"message", string(claudeMsg.Message),
						"result", claudeMsg.Result)
				}

				// Try to post unknown message types if they have content
				if len(claudeMsg.Message) > 0 {
					content := b.formatClaudeResponse(string(claudeMsg.Message))
					_, err := b.postMessage(session.ChannelID, session.ThreadTS, content)
					if err != nil {
						slog.Error("Failed to post unknown message type", "error", err)
					} else if b.config.Debug {
						slog.Debug("Posted unknown message type to Slack", "type", claudeMsg.Type)
					}
				}
			}
		}
	}
}

// parseAndPostAssistantMessage parses a Claude assistant message wrapper and posts the content to Slack
func (b *SlackBot) parseAndPostAssistantMessage(session *SlackClaudeSession, messageBytes []byte) error {
	// Parse the assistant message wrapper structure
	var assistantWrapper struct {
		ParentUuid  string `json:"parentUuid"`
		IsSidechain bool   `json:"isSidechain"`
		UserType    string `json:"userType"`
		Cwd         string `json:"cwd"`
		SessionId   string `json:"sessionId"`
		Version     string `json:"version"`
		Message     struct {
			ID      string `json:"id"`
			Type    string `json:"type"`
			Role    string `json:"role"`
			Model   string `json:"model"`
			Content []struct {
				Type  string                 `json:"type"`
				Text  string                 `json:"text,omitempty"`
				ID    string                 `json:"id,omitempty"`
				Name  string                 `json:"name,omitempty"`
				Input map[string]interface{} `json:"input,omitempty"`
			} `json:"content"`
			StopReason   *string `json:"stop_reason"`
			StopSequence *string `json:"stop_sequence"`
			Usage        *struct {
				InputTokens              int    `json:"input_tokens"`
				CacheCreationInputTokens int    `json:"cache_creation_input_tokens"`
				CacheReadInputTokens     int    `json:"cache_read_input_tokens"`
				OutputTokens             int    `json:"output_tokens"`
				ServiceTier              string `json:"service_tier"`
			} `json:"usage"`
		} `json:"message"`
		RequestId string `json:"requestId"`
		Type      string `json:"type"`
		Uuid      string `json:"uuid"`
		Timestamp string `json:"timestamp"`
	}

	if err := json.Unmarshal(messageBytes, &assistantWrapper); err != nil {
		return fmt.Errorf("failed to unmarshal assistant message wrapper: %w", err)
	}

	// Only process assistant messages with content
	//if assistantWrapper.Message.Role != "assistant" || len(assistantWrapper.Message.Content) == 0 {
	//	if b.config.Debug {
	//		slog.Debug("Skipping non-assistant message or message without content",
	//			"role", assistantWrapper.Message.Role,
	//			"content_length", len(assistantWrapper.Message.Content))
	//	}
	//	return nil
	//}

	// Extract and post each content block
	for _, content := range assistantWrapper.Message.Content {
		switch content.Type {
		case "text":
			if content.Text != "" {
				formattedContent := b.formatClaudeResponse(content.Text)
				_, err := b.postMessage(session.ChannelID, session.ThreadTS, formattedContent)
				if err != nil {
					slog.Error("Failed to post assistant text content", "error", err)
					return err
				} else if b.config.Debug {
					slog.Debug("Posted assistant text content to Slack",
						"content_length", len(content.Text),
						"message_id", assistantWrapper.Message.ID)
				}
			}

		case "tool_use":
			// Handle tool use content (like exit_plan_mode)
			if content.Name != "" {
				var toolMessage string
				if content.Name == "exit_plan_mode" {
					// Special handling for plan mode - extract the plan text
					if planInput, ok := content.Input["plan"].(string); ok {
						toolMessage = fmt.Sprintf("📋 **Plan Created:**\n\n%s", planInput)
					} else {
						toolMessage = fmt.Sprintf("🔧 Used tool: **%s**", content.Name)
					}
				} else {
					toolMessage = fmt.Sprintf("🔧 Used tool: **%s**", content.Name)
				}

				formattedContent := b.formatClaudeResponse(toolMessage)
				_, err := b.postMessage(session.ChannelID, session.ThreadTS, formattedContent)
				if err != nil {
					slog.Error("Failed to post tool use content", "error", err)
					return err
				} else if b.config.Debug {
					slog.Debug("Posted tool use content to Slack",
						"tool_name", content.Name,
						"message_id", assistantWrapper.Message.ID)
				}
			}

		default:
			if b.config.Debug {
				slog.Debug("Unhandled content type in assistant message",
					"content_type", content.Type,
					"message_id", assistantWrapper.Message.ID)
			}
		}
	}

	return nil
}

// parseAndPostClaudeMessage parses a full Claude message and posts the content to Slack
func (b *SlackBot) parseAndPostClaudeMessage(session *SlackClaudeSession, messageBytes []byte) error {
	// Parse the full Claude message structure
	var claudeMessage struct {
		ID      string `json:"id"`
		Type    string `json:"type"`
		Role    string `json:"role"`
		Model   string `json:"model"`
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		StopReason   *string `json:"stop_reason"`
		StopSequence *string `json:"stop_sequence"`
		Usage        *struct {
			InputTokens              int    `json:"input_tokens"`
			CacheCreationInputTokens int    `json:"cache_creation_input_tokens"`
			CacheReadInputTokens     int    `json:"cache_read_input_tokens"`
			OutputTokens             int    `json:"output_tokens"`
			ServiceTier              string `json:"service_tier"`
		} `json:"usage"`
	}

	if err := json.Unmarshal(messageBytes, &claudeMessage); err != nil {
		return fmt.Errorf("failed to unmarshal Claude message: %w", err)
	}

	// Only process assistant messages with content
	//if claudeMessage.Role != "assistant" || len(claudeMessage.Content) == 0 {
	//	if b.config.Debug {
	//		slog.Debug("Skipping non-assistant message or message without content",
	//			"role", claudeMessage.Role,
	//			"content_length", len(claudeMessage.Content))
	//	}
	//	return nil
	//}

	// Extract and post each text content block
	for _, content := range claudeMessage.Content {
		if content.Type == "text" && content.Text != "" {
			formattedContent := b.formatClaudeResponse(content.Text)
			_, err := b.postMessage(session.ChannelID, session.ThreadTS, formattedContent)
			if err != nil {
				slog.Error("Failed to post Claude message content", "error", err)
				return err
			} else if b.config.Debug {
				slog.Debug("Posted Claude message content to Slack",
					"content_length", len(content.Text),
					"message_id", claudeMessage.ID)
			}
		}
	}

	return nil
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
		ctx := context.Background()

		// Post immediate acknowledgment that we received the message
		_, err := b.postMessage(session.ChannelID, session.ThreadTS, "🤔 _Processing your message..._")
		if err != nil {
			slog.Error("Failed to post processing acknowledgment", "error", err)
		}

		// Get or resume Claude process for this session
		process := session.Process
		if process == nil {
			// Try to resume the session
			if b.config.Debug {
				slog.Debug("Claude process not in memory, attempting to resume",
					"session_id", session.SessionID,
					"thread_ts", session.ThreadTS)
			}

			resumedProcess, err := b.claudeService.ResumeSession(session.SessionID, session.UserID)
			if err != nil {
				slog.Error("Failed to resume Claude session", 
					"session_id", session.SessionID,
					"thread_ts", session.ThreadTS,
					"error", err)
				_, err := b.postMessage(session.ChannelID, session.ThreadTS,
					"❌ Claude session expired and could not be resumed. Use `/flow <your message>` to start a new conversation.")
				if err != nil {
					slog.Error("Failed to post session resume error message", "error", err)
				}
				return
			}

			// Update session with resumed process
			session.Process = resumedProcess
			session.Resumed = true
			session.LastActivity = time.Now()
			process = resumedProcess

			if b.config.Debug {
				slog.Debug("Successfully resumed Claude session",
					"session_id", session.SessionID,
					"thread_ts", session.ThreadTS)
			}

			// Post a notification about resumption
			_, err = b.postMessage(session.ChannelID, session.ThreadTS, "🔄 _Resumed previous Claude session with full context..._")
			if err != nil {
				slog.Error("Failed to post resumption notification", "error", err)
			}
		}

		// Update session activity in database
		if err := b.claudeService.UpdateSessionActivity(session.SessionID); err != nil {
			slog.Error("Failed to update session activity", "error", err)
		}

		// Send follow-up message to Claude process
		if err := b.claudeService.SendMessage(process, message); err != nil {
			slog.Error("Failed to send follow-up to Claude", "error", err)
			_, err := b.postMessage(session.ChannelID, session.ThreadTS,
				"❌ Failed to send message to Claude. Please try again, or use `/flow <your message>` to start a new conversation.")
			if err != nil {
				slog.Error("Failed to post error message", "error", err)
			}
			return
		}

		if b.config.Debug {
			slog.Debug("Sent follow-up message to Claude successfully",
				"session_id", session.SessionID,
				"message_length", len(message),
				"resumed", session.Resumed)
		}

		// Handle the response stream
		b.handleClaudeResponseStream(ctx, process, session)
	}()
}
