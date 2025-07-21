package slackbot

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/breadchris/flow/models"
	"github.com/breadchris/flow/worklet"
	"github.com/slack-go/slack"
	"github.com/slack-go/slack/slackevents"
	"github.com/slack-go/slack/socketmode"
	"gorm.io/gorm"
)

// handleSlashCommand processes incoming slash commands
func (b *SlackBot) handleSlashCommand(evt *socketmode.Event, cmd *slack.SlashCommand) {
	defer b.socketMode.Ack(*evt.Request)

	switch cmd.Command {
	case "/flow":
		b.handleFlowCommand(evt, cmd)
	case "/explore":
		b.handleExploreCommand(evt, cmd)
	case "/context":
		b.handleContextCommand(evt, cmd)
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

	// Check if channel is allowed by whitelist
	if !b.isChannelAllowed(cmd.ChannelID) {
		if b.config.Debug {
			slog.Debug("Flow command rejected - channel not in whitelist",
				"channel_id", cmd.ChannelID,
				"user_id", cmd.UserID)
		}
		// Silently ignore - no response to avoid revealing bot presence
		return
	}

	// Validate that we have content to work with
	content := strings.TrimSpace(cmd.Text)
	if content == "" {
		response := map[string]interface{}{
			"response_type": "ephemeral",
			"text":          "Please provide a prompt for Claude.\nExamples:\n• `/flow Help me debug this Go code`\n• `/flow https://github.com/user/repo.git Add dark mode support`",
		}
		payload, _ := json.Marshal(response)
		b.socketMode.Ack(*evt.Request, payload)
		return
	}

	// Parse the command to check for repository URL
	repoURL, prompt := b.parseFlowCommand(content)

	// Send immediate response to acknowledge the command
	var responseText string
	if repoURL != "" {
		responseText = "🚀 Creating worklet for repository..."
	} else {
		responseText = "🤖 Starting Claude session..."
	}

	response := map[string]interface{}{
		"response_type": "in_channel",
		"text":          responseText,
	}
	_, _ = json.Marshal(response)

	// Create the initial message and thread
	go func() {
		// First, post the user's command text to show what they requested
		_, _, err := b.client.PostMessage(cmd.ChannelID,
			slack.MsgOptionText(content, false),
			slack.MsgOptionAsUser(false), // Show as the user who typed the command
		)
		if err != nil {
			slog.Error("Failed to post user command", "error", err)
		}

		// Then post the system response to create the thread
		_, threadTS, err := b.client.PostMessage(cmd.ChannelID,
			slack.MsgOptionText(responseText, false),
			slack.MsgOptionAsUser(true),
		)
		if err != nil {
			slog.Error("Failed to create thread", "error", err)
			return
		}

		if repoURL != "" {
			// Repository workflow - create worklet
			b.handleRepositoryWorkflow(cmd.UserID, cmd.ChannelID, threadTS, repoURL, prompt)
		} else {
			// Simple prompt workflow - direct Claude session
			b.handleSimpleWorkflow(cmd.UserID, cmd.ChannelID, threadTS, content)
		}
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
		case *slackevents.ReactionAddedEvent:
			b.handleReactionEvent(ev, false)
		case *slackevents.ReactionRemovedEvent:
			// Convert ReactionRemovedEvent to ReactionAddedEvent for unified handling
			reactionEvent := &slackevents.ReactionAddedEvent{
				Type:           ev.Type,
				User:           ev.User,
				Reaction:       ev.Reaction,
				Item:           ev.Item,
				EventTimestamp: ev.EventTimestamp,
			}
			b.handleReactionEvent(reactionEvent, true)
		case *slackevents.FileSharedEvent:
			b.handleFileSharedEvent(ev)
		}
	default:
		if b.config.Debug {
			slog.Debug("Unhandled events API event", "type", eventsAPIEvent.Type)
		}
	}
}

// isBotMentioned checks if the bot is mentioned in the message text
func (b *SlackBot) isBotMentioned(text string) bool {
	if b.botUserID == "" {
		return false
	}

	// Check for direct mention format: <@BOT_USER_ID> or <@BOT_USER_ID|username>
	mentionPattern := fmt.Sprintf("<@%s", b.botUserID)
	return strings.Contains(text, mentionPattern)
}

// handleMessageEvent processes message events (including thread replies)
func (b *SlackBot) handleMessageEvent(ev *slackevents.MessageEvent) {
	// Ignore messages from bots and our own messages
	if ev.BotID != "" || ev.User == "" {
		if b.config.Debug {
			slog.Debug("Ignoring message from bot",
				"bot_id", ev.BotID,
				"user", ev.User,
				"text_preview", func() string {
					if len(ev.Text) > 50 {
						return ev.Text[:50] + "..."
					}
					return ev.Text
				}())
		}
		return
	}

	// Ignore our own messages by checking user ID
	if ev.User == b.botUserID {
		if b.config.Debug {
			slog.Debug("Ignoring bot's own message",
				"user_id", ev.User,
				"bot_user_id", b.botUserID,
				"text_preview", func() string {
					if len(ev.Text) > 50 {
						return ev.Text[:50] + "..."
					}
					return ev.Text
				}())
		}
		return
	}

	// Only handle thread replies (messages with ThreadTimeStamp)
	if ev.ThreadTimeStamp == "" {
		return
	}

	// Only process messages that mention the bot
	if !b.isBotMentioned(ev.Text) {
		if b.config.Debug {
			slog.Debug("Ignoring thread message without bot mention",
				"user_id", ev.User,
				"thread_ts", ev.ThreadTimeStamp,
				"text_preview", func() string {
					if len(ev.Text) > 50 {
						return ev.Text[:50] + "..."
					}
					return ev.Text
				}())
		}
		return
	}

	if b.config.Debug {
		slog.Debug("Processing thread message with bot mention",
			"user_id", ev.User,
			"thread_ts", ev.ThreadTimeStamp,
			"text_length", len(ev.Text))
	}

	// Check if channel is allowed by whitelist
	if !b.isChannelAllowed(ev.Channel) {
		if b.config.Debug {
			slog.Debug("Thread message rejected - channel not in whitelist",
				"channel_id", ev.Channel,
				"user_id", ev.User,
				"thread_ts", ev.ThreadTimeStamp)
		}
		// Silently ignore - no response to avoid revealing bot presence
		return
	}

	// Check rate limiting before processing message
	allowed, resetTime := b.rateLimiter.CheckRateLimit(ev.User)
	if !allowed {
		timeToReset := time.Until(resetTime)
		minutes := int(timeToReset.Minutes())
		seconds := int(timeToReset.Seconds()) % 60

		var resetMessage string
		if minutes > 0 {
			resetMessage = fmt.Sprintf("⏱️ _Rate limit exceeded. Please wait %dm %ds before sending another message._", minutes, seconds)
		} else {
			resetMessage = fmt.Sprintf("⏱️ _Rate limit exceeded. Please wait %ds before sending another message._", seconds)
		}

		_, err := b.postMessage(ev.Channel, ev.ThreadTimeStamp, resetMessage)
		if err != nil {
			slog.Error("Failed to post rate limit message", "error", err)
		}

		if b.config.Debug {
			slog.Debug("Message rate limited",
				"user_id", ev.User,
				"thread_ts", ev.ThreadTimeStamp,
				"time_to_reset", timeToReset)
		}
		return
	}

	// Track user activity for context management
	if b.contextManager != nil {
		b.contextManager.TrackUserActivity(ev.User, ev.ThreadTimeStamp)

		// Check if we should show context for returning users
		if b.contextManager.ShouldShowContext(ev.User, ev.ThreadTimeStamp) {
			go b.handleContextDisplay(ev.User, ev.Channel, ev.ThreadTimeStamp)
		}
	}

	// Check if this is a /flow command in a thread
	if strings.HasPrefix(strings.TrimSpace(ev.Text), "/flow") {
		b.handleFlowInThreadMessage(ev)
		return
	}

	// Check if this is a thread we're managing (Claude session)
	session, exists := b.getSession(ev.ThreadTimeStamp)
	if !exists {
		// Check if this is an ideation thread
		_, ideationExists := b.ideationManager.GetSession(ev.ThreadTimeStamp)
		if ideationExists {
			// This is an ideation thread but not a /flow command, ignore
			return
		}

		// Try to resume/create a session before giving up
		if b.config.Debug {
			slog.Debug("No active session found in memory, attempting to resume",
				"thread_ts", ev.ThreadTimeStamp,
				"user_id", ev.User,
				"channel_id", ev.Channel)
		}

		// Attempt to resume or create session (this checks database too)
		resumedSession, err := b.resumeOrCreateSession(ev.User, ev.Channel, ev.ThreadTimeStamp)
		if err != nil {
			if b.config.Debug {
				slog.Debug("Failed to resume session for thread message",
					"thread_ts", ev.ThreadTimeStamp,
					"error", err)
			}
			// Check if user is trying to continue a conversation in an old thread
			_, err := b.postMessage(ev.Channel, ev.ThreadTimeStamp,
				"💡 _No active Claude session in this thread. Use `/flow <your message>` to start a new conversation._")
			if err != nil {
				slog.Error("Failed to post no session message", "error", err)
			}
			return
		}

		// Successfully resumed/created session
		session = resumedSession
		if b.config.Debug {
			slog.Debug("Successfully resumed session for thread message",
				"thread_ts", ev.ThreadTimeStamp,
				"session_id", session.SessionID,
				"resumed", session.Resumed)
		}

		// Post a notification about resumption if this was an existing session
		if session.Resumed {
			_, err := b.postMessage(ev.Channel, ev.ThreadTimeStamp, "🔄 _Resuming Claude session..._")
			if err != nil {
				slog.Error("Failed to post resumption notification", "error", err)
			}
		}
	}

	// Validate and preprocess the message
	processedText, err := b.preprocessMessage(ev.Text, ev.User)
	if err != nil {
		slog.Error("Failed to preprocess message", "error", err)
		_, err := b.postMessage(ev.Channel, ev.ThreadTimeStamp,
			"❌ _Unable to process your message. Please try rephrasing._")
		if err != nil {
			slog.Error("Failed to post preprocessing error message", "error", err)
		}
		return
	}

	// Check for empty or very short messages
	if len(strings.TrimSpace(processedText)) < 2 {
		_, err := b.postMessage(ev.Channel, ev.ThreadTimeStamp,
			"🤔 _Your message seems a bit short. Could you provide more detail?_")
		if err != nil {
			slog.Error("Failed to post short message feedback", "error", err)
		}
		return
	}

	// Update session activity
	b.updateSessionActivity(ev.ThreadTimeStamp)

	if b.config.Debug {
		slog.Debug("Handling thread reply",
			"user_id", ev.User,
			"channel_id", ev.Channel,
			"thread_ts", ev.ThreadTimeStamp,
			"original_text", ev.Text,
			"processed_text", processedText,
			"text_length", len(processedText))
	}

	// Check if Claude session is healthy before sending
	if !session.Active {
		slog.Warn("Attempted to send message to inactive session",
			"session_id", session.SessionID,
			"thread_ts", ev.ThreadTimeStamp)
		_, err := b.postMessage(ev.Channel, ev.ThreadTimeStamp,
			"⚠️ _Claude session is currently inactive. Use `/flow <your message>` to start a new conversation._")
		if err != nil {
			slog.Error("Failed to post inactive session message", "error", err)
		}
		return
	}

	// Send the processed message to Claude with typing indicator
	b.sendToClaudeSessionWithTyping(session, processedText)
}

// handleAppMentionEvent processes app mention events
func (b *SlackBot) handleAppMentionEvent(ev *slackevents.AppMentionEvent) {
	// Check if channel is allowed by whitelist
	if !b.isChannelAllowed(ev.Channel) {
		if b.config.Debug {
			slog.Debug("App mention rejected - channel not in whitelist",
				"channel_id", ev.Channel,
				"user_id", ev.User)
		}
		// Silently ignore - no response to avoid revealing bot presence
		return
	}

	if b.config.Debug {
		slog.Debug("Processing app mention",
			"channel_id", ev.Channel,
			"user_id", ev.User)
	}

	// Process app mentions similar to /flow commands
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
			"text", text,
			"in_thread", ev.ThreadTimeStamp != "",
			"thread_ts", ev.ThreadTimeStamp)
	}

	// Handle app mention - reply in existing thread or create new one
	go func() {
		var threadTS string
		var err error

		if ev.ThreadTimeStamp != "" {
			// We're in an existing thread - reply there
			threadTS = ev.ThreadTimeStamp
			if b.config.Debug {
				slog.Debug("App mention in existing thread, replying in thread",
					"thread_ts", threadTS,
					"channel_id", ev.Channel)
			}
			_, _, err = b.client.PostMessage(ev.Channel,
				slack.MsgOptionText("🤖 Starting Claude session...", false),
				slack.MsgOptionTS(ev.ThreadTimeStamp),
			)
			if err != nil {
				slog.Error("Failed to reply in thread for app mention", "error", err, "thread_ts", threadTS)
				return
			}
		} else {
			// Create new thread
			if b.config.Debug {
				slog.Debug("App mention in channel, creating new thread",
					"channel_id", ev.Channel)
			}
			_, threadTS, err = b.client.PostMessage(ev.Channel,
				slack.MsgOptionText("🤖 Starting Claude session...", false),
				slack.MsgOptionAsUser(true),
			)
			if err != nil {
				slog.Error("Failed to create thread for app mention", "error", err)
				return
			}
		}

		// Create Claude session
		session, err := b.createClaudeSession(ev.User, ev.Channel, threadTS)
		if err != nil {
			slog.Error("Failed to create Claude session for app mention", "error", err, "thread_ts", threadTS)
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

// parseFlowCommand parses the /flow command to extract repository URL and prompt
func (b *SlackBot) parseFlowCommand(content string) (repoURL, prompt string) {
	// Regular expression to match GitHub repository URLs
	repoRegex := regexp.MustCompile(`https://github\.com/[\w\-\.]+/[\w\-\.]+(?:\.git)?`)

	// Check if content contains a repository URL
	match := repoRegex.FindString(content)
	if match != "" {
		// Found repository URL, extract it and the remaining text as prompt
		repoURL = match
		// Remove the repo URL from content to get the prompt
		prompt = strings.TrimSpace(strings.Replace(content, match, "", 1))

		// If no prompt provided, use a default
		if prompt == "" {
			prompt = "Help me understand and improve this codebase"
		}

		return repoURL, prompt
	}

	// Check for other git URL patterns (git@github.com, etc.)
	gitRegex := regexp.MustCompile(`(?:git@github\.com:|https://github\.com/)[\w\-\.]+/[\w\-\.]+(?:\.git)?`)
	match = gitRegex.FindString(content)
	if match != "" {
		repoURL = match
		prompt = strings.TrimSpace(strings.Replace(content, match, "", 1))
		if prompt == "" {
			prompt = "Help me understand and improve this codebase"
		}
		return repoURL, prompt
	}

	// No repository URL found, treat entire content as prompt
	return "", content
}

// handleSimpleWorkflow handles direct Claude sessions without repositories
func (b *SlackBot) handleSimpleWorkflow(userID, channelID, threadTS, prompt string) {
	// Check if there's an active ideation session we should use context from
	enhancedPrompt := b.enhancePromptWithIdeationContext(userID, channelID, prompt)

	// Create Claude session
	session, err := b.createClaudeSession(userID, channelID, threadTS)
	if err != nil {
		slog.Error("Failed to create Claude session", "error", err)
		_ = b.updateMessage(channelID, threadTS, "❌ Failed to start Claude session. Please try again.")
		return
	}

	// Start Claude interaction in the thread
	b.streamClaudeInteraction(session, enhancedPrompt)
}

// handleRepositoryWorkflow handles worklet creation and repository-based workflows
func (b *SlackBot) handleRepositoryWorkflow(userID, channelID, threadTS, repoURL, prompt string) {
	ctx := context.Background()

	// Update initial message to show progress
	_ = b.updateMessage(channelID, threadTS, "🔄 Creating worklet...")

	// Create worklet request
	workletReq := worklet.CreateWorkletRequest{
		Name:        fmt.Sprintf("Slack Flow - %s", b.extractRepoName(repoURL)),
		Description: fmt.Sprintf("Created via Slack /flow command for user %s", userID),
		GitRepo:     repoURL,
		Branch:      "main", // Default to main branch
		BasePrompt:  prompt,
		Environment: map[string]string{
			"SLACK_USER_ID":   userID,
			"SLACK_CHANNEL":   channelID,
			"SLACK_THREAD_TS": threadTS,
		},
	}

	// Create worklet
	workletObj, err := b.workletManager.CreateWorklet(ctx, workletReq, userID)
	if err != nil {
		slog.Error("Failed to create worklet", "error", err)
		_ = b.updateMessage(channelID, threadTS,
			fmt.Sprintf("❌ Failed to create worklet: %s", err.Error()))
		return
	}

	// Update message with worklet creation success
	_ = b.updateMessage(channelID, threadTS,
		fmt.Sprintf("✅ Worklet created successfully!\n🆔 ID: `%s`\n🔗 Repository: %s\n\n🔄 Building and deploying...",
			workletObj.ID, repoURL))

	// Start monitoring worklet status and update Slack accordingly
	go b.monitorWorkletProgress(ctx, workletObj.ID, channelID, threadTS, repoURL, prompt)
}

// extractRepoName extracts the repository name from a Git URL
func (b *SlackBot) extractRepoName(repoURL string) string {
	// Parse the URL to extract repository name
	if u, err := url.Parse(repoURL); err == nil {
		parts := strings.Split(strings.TrimSuffix(u.Path, ".git"), "/")
		if len(parts) >= 2 {
			return parts[len(parts)-1]
		}
	}

	// Fallback: extract from string patterns
	parts := strings.Split(repoURL, "/")
	if len(parts) > 0 {
		name := parts[len(parts)-1]
		return strings.TrimSuffix(name, ".git")
	}

	return "unknown-repo"
}

// monitorWorkletProgress monitors worklet deployment and updates Slack with progress
func (b *SlackBot) monitorWorkletProgress(ctx context.Context, workletID, channelID, threadTS, repoURL, prompt string) {
	// Poll worklet status until it's running or failed
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	timeout := time.After(10 * time.Minute) // 10 minute timeout

	for {
		select {
		case <-timeout:
			_ = b.updateMessage(channelID, threadTS,
				"❌ Worklet deployment timed out after 10 minutes. Please try again.")
			return

		case <-ctx.Done():
			return

		case <-ticker.C:
			workletObj, err := b.workletManager.GetWorklet(workletID)
			if err != nil {
				slog.Error("Failed to get worklet status", "error", err)
				continue
			}

			switch workletObj.Status {
			case worklet.StatusRunning:
				// Worklet is ready, create PR and send link
				_ = b.updateMessage(channelID, threadTS,
					fmt.Sprintf("🎉 Worklet is running!\n🌐 Web URL: <%s>\n\n🔄 Creating pull request...",
						workletObj.WebURL))

				// Create PR for the changes
				b.createPullRequestForWorklet(ctx, workletObj, channelID, threadTS, prompt)
				return

			case worklet.StatusError:
				errorMsg := "❌ Worklet deployment failed"
				if workletObj.LastError != "" {
					errorMsg += fmt.Sprintf(": %s", workletObj.LastError)
				}
				_ = b.updateMessage(channelID, threadTS, errorMsg)
				return

			case worklet.StatusBuilding:
				_ = b.updateMessage(channelID, threadTS,
					"🔨 Building Docker container...")

			case worklet.StatusDeploying:
				_ = b.updateMessage(channelID, threadTS,
					"🚀 Deploying worklet...")
			}
		}
	}
}

// createPullRequestForWorklet creates a pull request for the worklet changes and posts the PR link to Slack
func (b *SlackBot) createPullRequestForWorklet(ctx context.Context, workletObj *worklet.Worklet, channelID, threadTS, prompt string) {
	// Generate branch name from prompt
	branchName := b.generateBranchName(prompt)

	// Create PR title and description
	prTitle := fmt.Sprintf("feat: %s", prompt)
	if len(prTitle) > 72 {
		prTitle = prTitle[:69] + "..."
	}

	prDescription := fmt.Sprintf(`## Changes Made by Claude

**Original Prompt:** %s

**Worklet ID:** %s
**Repository:** %s
**Web Preview:** %s

This pull request contains changes generated by Claude in response to the above prompt.

### Summary
Claude has analyzed the codebase and applied the requested changes. Please review the modifications carefully before merging.

---
*Generated via Slack /flow command*`, prompt, workletObj.ID, workletObj.GitRepo, workletObj.WebURL)

	// Get worklet manager to access git operations through ClaudeClient
	// We'll use the worklet's ClaudeClient which has git integration
	claudeClient := &worklet.ClaudeClient{}

	// Create PR using the worklet's repository path
	err := claudeClient.CreatePR(ctx, fmt.Sprintf("/tmp/worklet-repos/%s", workletObj.ID), branchName, prTitle, prDescription)
	if err != nil {
		slog.Error("Failed to create PR for worklet", "error", err, "worklet_id", workletObj.ID)
		_ = b.updateMessage(channelID, threadTS,
			fmt.Sprintf("❌ Failed to create pull request: %s\n\n🌐 Worklet URL: <%s>",
				err.Error(), workletObj.WebURL))
		return
	}

	// Success! Update message with PR link
	_ = b.updateMessage(channelID, threadTS,
		fmt.Sprintf(`✅ **Pull Request Created Successfully!**

🔗 **Repository:** %s
🌐 **Worklet Preview:** <%s>
📝 **PR Title:** %s

The changes have been pushed to a new branch and a pull request has been created. You can review and merge the changes on GitHub.

---
*Generated via Slack /flow command*`, workletObj.GitRepo, workletObj.WebURL, prTitle))
}

// generateBranchName creates a git-safe branch name from the prompt
func (b *SlackBot) generateBranchName(prompt string) string {
	// Convert to lowercase and replace non-alphanumeric chars with hyphens
	branchName := strings.ToLower(prompt)
	branchName = regexp.MustCompile(`[^a-zA-Z0-9\s]+`).ReplaceAllString(branchName, "")
	branchName = regexp.MustCompile(`\s+`).ReplaceAllString(branchName, "-")
	branchName = strings.Trim(branchName, "-")

	// Limit length
	if len(branchName) > 50 {
		branchName = branchName[:50]
		branchName = strings.TrimSuffix(branchName, "-")
	}

	// Add prefix to indicate it's from flow
	return fmt.Sprintf("flow/%s", branchName)
}

// handleExploreCommand processes /explore slash commands
func (b *SlackBot) handleExploreCommand(evt *socketmode.Event, cmd *slack.SlashCommand) {
	if b.config.Debug {
		slog.Debug("Handling /explore command",
			"user_id", cmd.UserID,
			"channel_id", cmd.ChannelID,
			"text", cmd.Text)
	}

	// Check if channel is allowed by whitelist
	if !b.isChannelAllowed(cmd.ChannelID) {
		if b.config.Debug {
			slog.Debug("Explore command rejected - channel not in whitelist",
				"channel_id", cmd.ChannelID,
				"user_id", cmd.UserID)
		}
		// Silently ignore - no response to avoid revealing bot presence
		return
	}

	// Validate that we have an idea to work with
	idea := strings.TrimSpace(cmd.Text)
	if idea == "" {
		response := map[string]interface{}{
			"response_type": "ephemeral",
			"text":          "Please provide an idea to explore.\nExamples:\n• `/explore Build a habit tracking app`\n• `/explore Create a collaborative note-taking platform`\n• `/explore Design a meal planning service`",
		}
		payload, _ := json.Marshal(response)
		b.socketMode.Ack(*evt.Request, payload)
		return
	}

	// Send immediate response to acknowledge the command
	response := map[string]interface{}{
		"response_type": "in_channel",
		"text":          "🧠 Starting ideation session...",
	}
	_, _ = json.Marshal(response)

	// Create the initial message and thread
	go func() {
		// First, post the user's idea to show what they requested
		_, _, err := b.client.PostMessage(cmd.ChannelID,
			slack.MsgOptionText(fmt.Sprintf("💡 **Exploring idea:** %s", idea), false),
			slack.MsgOptionAsUser(false), // Show as the user who typed the command
		)
		if err != nil {
			slog.Error("Failed to post user idea", "error", err)
		}

		// Then post the system response to create the thread
		_, threadTS, err := b.client.PostMessage(cmd.ChannelID,
			slack.MsgOptionText("🧠 Starting ideation session...", false),
			slack.MsgOptionAsUser(true),
		)
		if err != nil {
			slog.Error("Failed to create ideation thread", "error", err)
			return
		}

		// Start ideation process
		b.handleIdeationWorkflow(cmd.UserID, cmd.ChannelID, threadTS, idea)
	}()
}

// handleIdeationWorkflow manages the ideation process with ChatGPT
func (b *SlackBot) handleIdeationWorkflow(userID, channelID, threadTS, idea string) {
	ctx := context.Background()

	// Create ideation session
	session := b.ideationManager.CreateSession(userID, channelID, threadTS, idea)

	// Create context tracking for this ideation session
	if b.contextManager != nil {
		b.contextManager.CreateContext(threadTS, channelID, userID, "ideation", idea)
	}

	// Update initial message to show progress
	_ = b.updateMessage(channelID, threadTS, "🔄 Generating feature ideas...")

	// Generate initial ideas with ChatGPT
	ideationResponse, err := b.chatgptService.GenerateInitialIdeas(ctx, idea)
	if err != nil {
		slog.Error("Failed to generate initial ideas", "error", err)
		_ = b.updateMessage(channelID, threadTS,
			fmt.Sprintf("❌ Failed to generate ideas: %s", err.Error()))
		return
	}

	// Add features to session
	err = b.ideationManager.AddFeatures(threadTS, ideationResponse.Features, "initial")
	if err != nil {
		slog.Error("Failed to add features to session", "error", err)
		return
	}

	// Post the ideation summary
	summaryMsg := fmt.Sprintf("🎯 **%s**\n\n%s", ideationResponse.Summary,
		"React with emojis to show your interest:\n👍 Like  🔥 Priority  ❤️ Love  👎 Pass")

	_, err = b.postMessage(channelID, threadTS, summaryMsg)
	if err != nil {
		slog.Error("Failed to post ideation summary", "error", err)
		return
	}

	// Post each feature as a separate message for individual reactions
	for _, feature := range ideationResponse.Features {
		featureMsg := b.formatFeatureMessage(feature)
		messageTS, err := b.postMessage(channelID, threadTS, featureMsg)
		if err != nil {
			slog.Error("Failed to post feature message", "error", err)
			continue
		}

		// Store message timestamp for this feature
		err = b.ideationManager.SetFeatureMessageTS(threadTS, feature.ID, messageTS)
		if err != nil {
			slog.Error("Failed to store feature message timestamp", "error", err)
		}

		// Add default emoji reactions to guide users
		emojis := []string{"👍", "🔥", "❤️", "👎"}
		for _, emoji := range emojis {
			err = b.client.AddReaction(emoji, slack.ItemRef{
				Channel:   channelID,
				Timestamp: messageTS,
			})
			if err != nil && b.config.Debug {
				slog.Debug("Failed to add default reaction", "emoji", emoji, "error", err)
			}
		}
	}

	// Post instructions
	instructionsMsg := `**How to use this ideation session:**
• React with emojis to features you like (👍 🔥 ❤️)
• I'll generate more ideas based on your preferences
• Use /flow in this thread to start building your favorite features with Claude`

	_, err = b.postMessage(channelID, threadTS, instructionsMsg)
	if err != nil {
		slog.Error("Failed to post instructions", "error", err)
	}

	// Generate and update context summary for the ideation session
	if b.contextManager != nil {
		go func() {
			time.Sleep(3 * time.Second) // Wait for all messages to be posted
			err := b.contextManager.GenerateContextSummary(ctx, threadTS, session)
			if err != nil && b.config.Debug {
				slog.Debug("Failed to generate initial ideation context", "error", err)
			}
		}()
	}

	if b.config.Debug {
		slog.Debug("Ideation session started successfully",
			"session_id", session.SessionID,
			"thread_ts", threadTS,
			"feature_count", len(ideationResponse.Features))
	}
}

// formatFeatureMessage formats a feature for display in Slack
func (b *SlackBot) formatFeatureMessage(feature Feature) string {
	priorityEmoji := map[string]string{
		"High":   "🔴",
		"Medium": "🟡",
		"Low":    "🟢",
	}

	complexityEmoji := map[string]string{
		"Simple":  "🟢",
		"Medium":  "🟡",
		"Complex": "🔴",
	}

	return fmt.Sprintf("**%s** `%s`\n%s\n\n%s Priority • %s Complexity",
		feature.Title,
		feature.Category,
		feature.Description,
		priorityEmoji[feature.Priority],
		complexityEmoji[feature.Complexity])
}

// enhancePromptWithIdeationContext checks for recent ideation sessions and enhances the prompt
func (b *SlackBot) enhancePromptWithIdeationContext(userID, channelID, originalPrompt string) string {
	// Find the most recent ideation session for this user in this channel
	recentSession := b.findRecentIdeationSession(userID, channelID)
	if recentSession == nil {
		return originalPrompt
	}

	// Generate enhanced context using ChatGPT
	ctx := context.Background()
	claudeContext, err := b.chatgptService.GenerateClaudeContext(ctx, recentSession)
	if err != nil {
		slog.Error("Failed to generate Claude context from ideation session", "error", err)
		return originalPrompt
	}

	// Combine the ideation context with the original prompt
	enhancedPrompt := fmt.Sprintf(`**IDEATION CONTEXT:**
%s

**USER REQUEST:**
%s

**INSTRUCTIONS FOR CLAUDE:**
The user has completed an ideation session for their product idea. Use the context above to understand their vision, preferred features, and feedback. Focus your implementation on the features they showed interest in. When building features, prioritize the ones they reacted positively to (👍, 🔥, ❤️).`, claudeContext, originalPrompt)

	if b.config.Debug {
		slog.Debug("Enhanced prompt with ideation context",
			"session_id", recentSession.SessionID,
			"original_length", len(originalPrompt),
			"enhanced_length", len(enhancedPrompt))
	}

	// Notify user that we're using ideation context
	go func() {
		time.Sleep(1 * time.Second) // Small delay to ensure message ordering
		contextMsg := fmt.Sprintf("💡 I found your recent ideation session for \"%s\". I'll use that context to better understand your requirements.", recentSession.OriginalIdea)
		// Note: We can't easily post to the thread here since we don't have threadTS
		// This would be better implemented by modifying the /flow command to detect ideation threads directly
		if b.config.Debug {
			slog.Debug("Would notify user about ideation context usage", "message", contextMsg)
		}
	}()

	return enhancedPrompt
}

// findRecentIdeationSession finds the most recent active ideation session for a user in a channel
func (b *SlackBot) findRecentIdeationSession(userID, channelID string) *IdeationSession {
	// Get all active sessions and find the most recent one for this user/channel
	// This is a simplified implementation - in practice, you'd want better session management

	var recentSession *IdeationSession
	var mostRecent time.Time

	// This is a simplified search - ideally we'd store sessions in a database
	// For now, we'll check all sessions in the ideation manager
	sessionCount := b.ideationManager.GetActiveSessions()
	if sessionCount == 0 {
		return nil
	}

	// Since we don't have direct access to iterate sessions in IdeationManager,
	// we'll need to modify this approach. For now, return nil and handle the case
	// where no ideation context is found.

	if b.config.Debug {
		slog.Debug("Looking for recent ideation session",
			"user_id", userID,
			"channel_id", channelID,
			"active_sessions", sessionCount)
	}

	// TODO: Implement proper session search when we have database backing
	// For now, we could check if the user has been active in the last hour
	cutoff := time.Now().Add(-1 * time.Hour)
	_ = cutoff     // Avoid unused variable warning
	_ = mostRecent // Avoid unused variable warning

	return recentSession
}

// Alternative approach: Modify /flow to work within threads
func (b *SlackBot) handleFlowInThread(userID, channelID, threadTS, prompt string) {
	// Check if this thread has an ideation session
	session, exists := b.ideationManager.GetSession(threadTS)
	if !exists {
		// No ideation session, proceed with normal flow
		b.handleSimpleWorkflow(userID, channelID, threadTS, prompt)
		return
	}

	// Generate Claude context from ideation session
	ctx := context.Background()
	claudeContext, err := b.chatgptService.GenerateClaudeContext(ctx, session)
	if err != nil {
		slog.Error("Failed to generate Claude context from ideation session", "error", err)
		b.handleSimpleWorkflow(userID, channelID, threadTS, prompt)
		return
	}

	// Create enhanced prompt
	enhancedPrompt := fmt.Sprintf(`**IDEATION CONTEXT:**
%s

**USER REQUEST:**
%s

**INSTRUCTIONS FOR CLAUDE:**
The user has completed an ideation session in this thread. Use the context above to understand their vision, preferred features based on emoji reactions, and overall product direction. Focus your implementation on the features they showed positive interest in.`, claudeContext, prompt)

	// Notify user that we're using ideation context
	_, err = b.postMessage(channelID, threadTS,
		fmt.Sprintf("💡 Using ideation context from this session (\"%s\") to inform Claude's response.", session.OriginalIdea))
	if err != nil {
		slog.Error("Failed to post ideation context notification", "error", err)
	}

	// Create Claude session with enhanced prompt
	claudeSession, err := b.createClaudeSession(userID, channelID, threadTS)
	if err != nil {
		slog.Error("Failed to create Claude session", "error", err)
		_ = b.updateMessage(channelID, threadTS, "❌ Failed to start Claude session. Please try again.")
		return
	}

	// Deactivate the ideation session since we're moving to implementation
	err = b.ideationManager.DeactivateSession(threadTS)
	if err != nil {
		slog.Error("Failed to deactivate ideation session", "error", err)
	}

	// Start Claude interaction with enhanced context
	b.streamClaudeInteraction(claudeSession, enhancedPrompt)

	if b.config.Debug {
		slog.Debug("Started Claude session with ideation context",
			"session_id", session.SessionID,
			"claude_session_id", claudeSession.SessionID,
			"enhanced_prompt_length", len(enhancedPrompt))
	}
}

// handleContextDisplay displays context information for returning users
func (b *SlackBot) handleContextDisplay(userID, channelID, threadTS string) {
	if b.contextManager == nil {
		return
	}

	// Get context for this thread
	contextSummary, exists := b.contextManager.GetContext(threadTS)
	if !exists {
		// Try to determine session type and create context
		if session, sessionExists := b.getSession(threadTS); sessionExists {
			// This is a Claude session
			contextSummary := b.contextManager.CreateContext(threadTS, channelID, userID, "claude", "Claude session")
			_ = contextSummary // Will be used in goroutine

			// Generate context summary for Claude session
			go func() {
				ctx := context.Background()
				err := b.contextManager.GenerateContextSummary(ctx, threadTS, session)
				if err != nil {
					if b.config.Debug {
						slog.Debug("Failed to generate Claude context summary", "error", err)
					}
					return
				}

				// Post context summary after generation
				time.Sleep(2 * time.Second) // Brief delay to let generation complete
				b.postContextSummary(channelID, threadTS, contextSummary)
			}()
			return
		}

		if ideationSession, ideationExists := b.ideationManager.GetSession(threadTS); ideationExists {
			// This is an ideation session
			contextSummary = b.contextManager.CreateContext(threadTS, channelID, userID, "ideation", ideationSession.OriginalIdea)

			// Generate context summary for ideation session
			go func() {
				ctx := context.Background()
				err := b.contextManager.GenerateContextSummary(ctx, threadTS, ideationSession)
				if err != nil {
					if b.config.Debug {
						slog.Debug("Failed to generate ideation context summary", "error", err)
					}
					return
				}

				// Post context summary after generation
				time.Sleep(2 * time.Second) // Brief delay to let generation complete
				b.postContextSummary(channelID, threadTS, contextSummary)
			}()
			return
		}

		// Unknown session type, create generic context
		contextSummary = b.contextManager.CreateContext(threadTS, channelID, userID, "general", "Thread session")
	}

	// Post the context summary if it exists
	if contextSummary.Summary != "" {
		b.postContextSummary(channelID, threadTS, contextSummary)
	}
}

// postContextSummary posts a context summary message to the thread
func (b *SlackBot) postContextSummary(channelID, threadTS string, context *ThreadContextSummary) {
	if b.contextManager == nil {
		return
	}

	// Refresh context from manager to get latest data
	updatedContext, exists := b.contextManager.GetContext(threadTS)
	if exists {
		context = updatedContext
	}

	// Format and post the context message
	contextMessage := b.contextManager.FormatContextMessage(context)
	messageTS, err := b.postMessage(channelID, threadTS, contextMessage)
	if err != nil {
		slog.Error("Failed to post context summary", "error", err)
		return
	}

	// Pin the message if auto-pinning is enabled
	if b.contextManager.config.AutoPinContext {
		err = b.client.AddPin(channelID, slack.ItemRef{
			Channel:   channelID,
			Timestamp: messageTS,
		})
		if err != nil {
			if b.config.Debug {
				slog.Debug("Failed to pin context message", "error", err)
			}
		} else {
			// Store the pinned message timestamp
			_ = b.contextManager.UpdateContext(threadTS, map[string]interface{}{
				"pinned_message": messageTS,
			})
		}
	}

	if b.config.Debug {
		slog.Debug("Posted context summary",
			"thread_ts", threadTS,
			"session_type", context.SessionType,
			"message_ts", messageTS)
	}
}

// handleFlowInThreadMessage handles /flow commands posted as thread replies
func (b *SlackBot) handleFlowInThreadMessage(ev *slackevents.MessageEvent) {
	// Extract the prompt from the /flow command
	text := strings.TrimSpace(ev.Text)
	if !strings.HasPrefix(text, "/flow") {
		return
	}

	// Remove "/flow" prefix and get the actual prompt
	prompt := strings.TrimSpace(text[5:]) // Remove "/flow"
	if prompt == "" {
		// Post help message in thread
		_, err := b.postMessage(ev.Channel, ev.ThreadTimeStamp,
			"Please provide a prompt for Claude.\nExample: `/flow Help me implement the user registration feature`")
		if err != nil {
			slog.Error("Failed to post flow help message", "error", err)
		}
		return
	}

	if b.config.Debug {
		slog.Debug("Handling /flow in thread",
			"user_id", ev.User,
			"channel_id", ev.Channel,
			"thread_ts", ev.ThreadTimeStamp,
			"prompt", prompt)
	}

	// Use the thread-aware flow handler
	go b.handleFlowInThread(ev.User, ev.Channel, ev.ThreadTimeStamp, prompt)
}

// handleContextCommand processes /context slash commands for manual context summaries
func (b *SlackBot) handleContextCommand(evt *socketmode.Event, cmd *slack.SlashCommand) {
	if b.config.Debug {
		slog.Debug("Handling /context command",
			"user_id", cmd.UserID,
			"channel_id", cmd.ChannelID,
			"text", cmd.Text)
	}

	// Check if channel is allowed by whitelist
	if !b.isChannelAllowed(cmd.ChannelID) {
		if b.config.Debug {
			slog.Debug("Context command rejected - channel not in whitelist",
				"channel_id", cmd.ChannelID,
				"user_id", cmd.UserID)
		}
		// Silently ignore - no response to avoid revealing bot presence
		return
	}

	if b.contextManager == nil {
		response := map[string]interface{}{
			"response_type": "ephemeral",
			"text":          "Context management is not enabled.",
		}
		payload, _ := json.Marshal(response)
		b.socketMode.Ack(*evt.Request, payload)
		return
	}

	// Parse the command to get thread timestamp
	threadTS := strings.TrimSpace(cmd.Text)
	if threadTS == "" {
		response := map[string]interface{}{
			"response_type": "ephemeral",
			"text":          "Please provide a thread timestamp.\nExample: `/context 1234567890.123456`\nOr use this command in a thread to get context for the current thread.",
		}
		payload, _ := json.Marshal(response)
		b.socketMode.Ack(*evt.Request, payload)
		return
	}

	// Send immediate response to acknowledge the command
	response := map[string]interface{}{
		"response_type": "ephemeral",
		"text":          "🔍 Generating context summary...",
	}
	_, _ = json.Marshal(response)

	// Generate and post context summary
	go func() {
		// Check if context already exists
		contextSummary, exists := b.contextManager.GetContext(threadTS)
		if !exists {
			// Try to determine session type and create context
			if session, sessionExists := b.getSession(threadTS); sessionExists {
				contextSummary = b.contextManager.CreateContext(threadTS, cmd.ChannelID, cmd.UserID, "claude", "Claude session")
				_ = contextSummary // Will be used later

				// Generate context summary
				ctx := context.Background()
				err := b.contextManager.GenerateContextSummary(ctx, threadTS, session)
				if err != nil {
					slog.Error("Failed to generate Claude context summary", "error", err)
					_, err := b.postMessage(cmd.ChannelID, threadTS, "❌ Failed to generate context summary.")
					if err != nil {
						slog.Error("Failed to post error message", "error", err)
					}
					return
				}
			} else if ideationSession, ideationExists := b.ideationManager.GetSession(threadTS); ideationExists {
				contextSummary = b.contextManager.CreateContext(threadTS, cmd.ChannelID, cmd.UserID, "ideation", ideationSession.OriginalIdea)

				// Generate context summary
				ctx := context.Background()
				err := b.contextManager.GenerateContextSummary(ctx, threadTS, ideationSession)
				if err != nil {
					slog.Error("Failed to generate ideation context summary", "error", err)
					_, err := b.postMessage(cmd.ChannelID, threadTS, "❌ Failed to generate context summary.")
					if err != nil {
						slog.Error("Failed to post error message", "error", err)
					}
					return
				}
			} else {
				// No active session found
				_, err := b.postMessage(cmd.ChannelID, "", fmt.Sprintf("❌ No active session found for thread %s.", threadTS))
				if err != nil {
					slog.Error("Failed to post no session message", "error", err)
				}
				return
			}
		}

		// Wait a moment for context generation to complete
		time.Sleep(2 * time.Second)

		// Get updated context
		updatedContext, exists := b.contextManager.GetContext(threadTS)
		if !exists {
			_, err := b.postMessage(cmd.ChannelID, "", "❌ Failed to retrieve context summary.")
			if err != nil {
				slog.Error("Failed to post context retrieval error", "error", err)
			}
			return
		}

		// Post context summary to the specified thread
		b.postContextSummary(cmd.ChannelID, threadTS, updatedContext)

		if b.config.Debug {
			slog.Debug("Posted manual context summary",
				"user_id", cmd.UserID,
				"thread_ts", threadTS,
				"session_type", updatedContext.SessionType)
		}
	}()
}

// handleFileSharedEvent processes file upload events in threads
func (b *SlackBot) handleFileSharedEvent(ev *slackevents.FileSharedEvent) {
	if b.config.Debug {
		slog.Debug("Received file shared event",
			"file_id", ev.FileID,
			"user_id", ev.UserID,
			"channel_id", ev.ChannelID)
	}

	// Get file information from Slack API
	file, _, _, err := b.client.GetFileInfo(ev.FileID, 0, 0)
	if err != nil {
		slog.Error("Failed to get file info", "error", err, "file_id", ev.FileID)
		return
	}

	if b.config.Debug {
		slog.Debug("File info retrieved",
			"file_id", ev.FileID,
			"name", file.Name,
			"mimetype", file.Mimetype,
			"size", file.Size,
			"channels", file.Channels)
	}

	// Check if this file is shared in a thread we're managing
	var threadTS string
	for _, channelID := range file.Channels {
		// We need to determine if this file was uploaded to a thread
		// Unfortunately, FileSharedEvent doesn't directly provide thread info
		// We'll check if there are any active sessions in this channel
		if sessions, err := b.sessionDB.GetAllActiveSessions(); err == nil {
			for _, session := range sessions {
				if session.ChannelID == channelID {
					threadTS = session.ThreadTS
					break
				}
			}
		}
		if threadTS != "" {
			break
		}
	}

	// If we don't have a thread context, we can't process this file
	if threadTS == "" {
		if b.config.Debug {
			slog.Debug("File not uploaded to managed thread, ignoring",
				"file_id", ev.FileID,
				"channels", file.Channels)
		}
		return
	}

	// Check if file is a supported type
	if !b.isSupportedFile(file.Mimetype, int64(file.Size)) {
		slog.Info("Unsupported file type uploaded",
			"file_id", ev.FileID,
			"mimetype", file.Mimetype,
			"size", file.Size,
			"thread_ts", threadTS)

		// Notify user about unsupported file type or size
		category := b.getFileCategory(file.Mimetype)
		var message string
		if category == "unsupported" {
			message = fmt.Sprintf("⚠️ Uploaded file '%s' has an unsupported format (%s). Supported formats: Images (PNG, JPG, GIF, WebP), Documents (PDF, TXT, MD, CSV), Code files (JS, PY, GO, HTML, CSS, JSON, XML, YAML), and Office files (DOCX, XLSX, PPTX)", file.Name, file.Mimetype)
		} else {
			maxSize := b.getMaxFileSize(file.Mimetype)
			message = fmt.Sprintf("⚠️ Uploaded file '%s' exceeds maximum size limit. File size: %d bytes, Maximum allowed: %d bytes", file.Name, file.Size, maxSize)
		}
		_, err := b.postMessage(ev.ChannelID, threadTS, message)
		if err != nil {
			slog.Error("Failed to post unsupported file message", "error", err)
		}
		return
	}

	// Download and store the file
	go b.downloadAndStoreFile(file, ev.UserID, ev.ChannelID, threadTS)
}

// isSupportedFile checks if the file type and size are supported
func (b *SlackBot) isSupportedFile(mimetype string, size int64) bool {
	// Check if file type is supported
	if b.getFileCategory(mimetype) == "unsupported" {
		return false
	}

	// Check file size limits
	maxSize := b.getMaxFileSize(mimetype)
	if size > maxSize {
		return false
	}

	return true
}

// getFileCategory determines the category of a file based on its MIME type
func (b *SlackBot) getFileCategory(mimetype string) string {
	// Image files
	imageTypes := []string{
		"image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp",
		"image/bmp", "image/tiff", "image/svg+xml",
	}

	// Document files
	documentTypes := []string{
		"application/pdf", "text/plain", "text/markdown", "text/csv",
		"application/rtf", "application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	}

	// Code files
	codeTypes := []string{
		"text/javascript", "application/javascript", "text/x-python", "text/x-go",
		"text/html", "text/css", "application/json", "text/xml", "application/xml",
		"text/yaml", "application/yaml", "text/x-yaml", "text/x-c", "text/x-cpp",
		"text/x-java", "text/x-php", "text/x-ruby", "text/x-shell", "text/x-sql",
		"application/typescript", "text/typescript",
	}

	// Archive files
	archiveTypes := []string{
		"application/zip", "application/x-tar", "application/gzip",
		"application/x-rar-compressed", "application/x-7z-compressed",
	}

	for _, t := range imageTypes {
		if mimetype == t {
			return "image"
		}
	}

	for _, t := range documentTypes {
		if mimetype == t {
			return "document"
		}
	}

	for _, t := range codeTypes {
		if mimetype == t {
			return "code"
		}
	}

	for _, t := range archiveTypes {
		if mimetype == t {
			return "archive"
		}
	}

	// Check for text files with generic mime types
	if strings.HasPrefix(mimetype, "text/") {
		return "text"
	}

	return "unsupported"
}

// getMaxFileSize returns the maximum allowed file size for a given MIME type
func (b *SlackBot) getMaxFileSize(mimetype string) int64 {
	category := b.getFileCategory(mimetype)

	switch category {
	case "image":
		return 10 * 1024 * 1024 // 10 MB for images
	case "document":
		return 50 * 1024 * 1024 // 50 MB for documents
	case "code", "text":
		return 1 * 1024 * 1024 // 1 MB for code/text files
	case "archive":
		return 100 * 1024 * 1024 // 100 MB for archives
	default:
		return 10 * 1024 * 1024 // 10 MB default
	}
}

// getFileMimeType retrieves the MIME type of a file from the database
func (b *SlackBot) getFileMimeType(filename, threadTS string) string {
	// Query database for file metadata
	var fileUpload models.SlackFileUpload
	if err := b.sessionDB.db.Where("file_name = ? AND thread_ts = ?", filename, threadTS).First(&fileUpload).Error; err != nil {
		// If not found in database, try to guess from filename extension
		return b.guessMimeTypeFromFilename(filename)
	}
	return fileUpload.MimeType
}

// guessMimeTypeFromFilename attempts to guess MIME type from file extension
func (b *SlackBot) guessMimeTypeFromFilename(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))

	mimeMap := map[string]string{
		".png":  "image/png",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".gif":  "image/gif",
		".webp": "image/webp",
		".pdf":  "application/pdf",
		".txt":  "text/plain",
		".md":   "text/markdown",
		".csv":  "text/csv",
		".js":   "text/javascript",
		".py":   "text/x-python",
		".go":   "text/x-go",
		".html": "text/html",
		".css":  "text/css",
		".json": "application/json",
		".xml":  "application/xml",
		".yaml": "text/yaml",
		".yml":  "text/yaml",
		".zip":  "application/zip",
		".tar":  "application/x-tar",
		".gz":   "application/gzip",
	}

	if mimeType, exists := mimeMap[ext]; exists {
		return mimeType
	}

	return "application/octet-stream"
}

// downloadAndStoreFile downloads a file from Slack and stores it locally
func (b *SlackBot) downloadAndStoreFile(file *slack.File, userID, channelID, threadTS string) {
	if b.config.Debug {
		slog.Debug("Starting file download",
			"file_id", file.ID,
			"name", file.Name,
			"size", file.Size,
			"thread_ts", threadTS)
	}

	// Create directory structure: ./data/slack-uploads/{thread_ts}/
	uploadDir := filepath.Join("./data", "slack-uploads", threadTS)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		slog.Error("Failed to create upload directory", "error", err, "dir", uploadDir)
		b.postMessage(channelID, threadTS, "❌ Failed to create directory for file storage.")
		return
	}

	// Generate unique filename with timestamp prefix
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("%s_%s", timestamp, file.Name)
	filePath := filepath.Join(uploadDir, filename)

	// Download file from Slack
	downloadURL := file.URLPrivateDownload
	if downloadURL == "" {
		downloadURL = file.URLPrivate
	}

	if downloadURL == "" {
		slog.Error("No download URL available for file", "file_id", file.ID)
		b.postMessage(channelID, threadTS, "❌ Unable to download file - no download URL available.")
		return
	}

	// Create HTTP request with Slack token
	req, err := http.NewRequest("GET", downloadURL, nil)
	if err != nil {
		slog.Error("Failed to create download request", "error", err)
		b.postMessage(channelID, threadTS, "❌ Failed to create download request.")
		return
	}

	req.Header.Set("Authorization", "Bearer "+b.config.BotToken)

	// Execute download
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		slog.Error("Failed to download file", "error", err, "url", downloadURL)
		b.postMessage(channelID, threadTS, "❌ Failed to download file from Slack.")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		slog.Error("Download request failed", "status", resp.StatusCode, "url", downloadURL)
		b.postMessage(channelID, threadTS, "❌ Download request failed.")
		return
	}

	// Create local file
	localFile, err := os.Create(filePath)
	if err != nil {
		slog.Error("Failed to create local file", "error", err, "path", filePath)
		b.postMessage(channelID, threadTS, "❌ Failed to create local file.")
		return
	}
	defer localFile.Close()

	// Copy file content
	bytesWritten, err := io.Copy(localFile, resp.Body)
	if err != nil {
		slog.Error("Failed to write file content", "error", err, "path", filePath)
		b.postMessage(channelID, threadTS, "❌ Failed to write file content.")
		return
	}

	if b.config.Debug {
		slog.Debug("File downloaded successfully",
			"file_id", file.ID,
			"local_path", filePath,
			"bytes_written", bytesWritten,
			"thread_ts", threadTS)
	}

	// Record file upload in database
	if err := b.recordFileUpload(file, filename, filePath, userID, channelID, threadTS, bytesWritten); err != nil {
		slog.Error("Failed to record file upload in database", "error", err)
		// Continue anyway - file was downloaded successfully
	}

	// Notify Claude about the new file
	b.notifyClaudeAboutFile(filename, channelID, threadTS)

	// Send confirmation to user
	category := b.getFileCategory(file.Mimetype)
	var fileTypeDescription string
	switch category {
	case "image":
		fileTypeDescription = "image"
	case "document":
		fileTypeDescription = "document"
	case "code":
		fileTypeDescription = "code file"
	case "text":
		fileTypeDescription = "text file"
	case "archive":
		fileTypeDescription = "archive file"
	default:
		fileTypeDescription = "file"
	}

	message := fmt.Sprintf("✅ %s uploaded successfully: `%s` (%d bytes)\nClaude can now analyze this %s!",
		strings.Title(fileTypeDescription), filename, bytesWritten, fileTypeDescription)
	_, err = b.postMessage(channelID, threadTS, message)
	if err != nil {
		slog.Error("Failed to post success message", "error", err)
	}
}

// notifyClaudeAboutFile sends a message to Claude about the newly uploaded file
func (b *SlackBot) notifyClaudeAboutFile(filename, channelID, threadTS string) {
	// Check if there's an active Claude session for this thread
	session, exists := b.getSession(threadTS)
	if !exists || !session.Active {
		if b.config.Debug {
			slog.Debug("No active Claude session for file notification",
				"thread_ts", threadTS,
				"filename", filename)
		}
		return
	}

	// Add upload directory to session metadata for future resumption
	// Since Claude CLI doesn't support dynamic directory addition to running sessions,
	// we ensure the upload directory will be included when the session is next resumed
	if err := b.addUploadDirectoryToSession(session.SessionID, threadTS); err != nil {
		slog.Error("Failed to add upload directory to session metadata",
			"error", err, "session_id", session.SessionID, "thread_ts", threadTS)
	}

	// Send notification message to Claude
	category := b.getFileCategory(b.getFileMimeType(filename, threadTS))
	var fileTypeDescription string
	var analysisHint string

	switch category {
	case "image":
		fileTypeDescription = "image"
		analysisHint = "You can analyze this image, describe its contents, extract text, or answer questions about it."
	case "document":
		fileTypeDescription = "document"
		analysisHint = "You can read and analyze this document, extract key information, summarize its contents, or answer questions about it."
	case "code":
		fileTypeDescription = "code file"
		analysisHint = "You can review this code, suggest improvements, identify bugs, explain functionality, or help with refactoring."
	case "text":
		fileTypeDescription = "text file"
		analysisHint = "You can read and analyze this text file, extract information, or answer questions about its contents."
	case "archive":
		fileTypeDescription = "archive file"
		analysisHint = "You can examine this archive file, though you may need to extract it first to analyze its contents."
	default:
		fileTypeDescription = "file"
		analysisHint = "You can examine this file using your Read tool."
	}

	notificationMessage := fmt.Sprintf("A new %s has been uploaded to this conversation: %s. File path: ./data/slack-uploads/%s/%s\n\n%s",
		fileTypeDescription, filename, threadTS, filename, analysisHint)

	// Update session activity
	b.updateSessionActivity(threadTS)

	// Send the notification to Claude
	b.sendToClaudeSession(session, notificationMessage)

	if b.config.Debug {
		slog.Debug("Notified Claude about uploaded file with path info",
			"session_id", session.SessionID,
			"filename", filename,
			"thread_ts", threadTS,
			"file_path", fmt.Sprintf("./data/slack-uploads/%s/%s", threadTS, filename))
	}
}

// addUploadDirectoryToSession adds the upload directory to session metadata for future resumption
func (b *SlackBot) addUploadDirectoryToSession(sessionID, threadTS string) error {
	// Get the session from database to update metadata
	var dbSession models.ClaudeSession
	err := b.claudeService.GetDB().Where("session_id = ?", sessionID).First(&dbSession).Error
	if err != nil {
		return fmt.Errorf("failed to find session in database: %w", err)
	}

	// Extract current metadata
	metadata := dbSession.Metadata.Data
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	// Add upload directory information
	uploadDir := fmt.Sprintf("./data/slack-uploads/%s", threadTS)
	metadata["upload_directory"] = uploadDir
	metadata["has_uploaded_files"] = true
	metadata["last_file_upload"] = time.Now().Format(time.RFC3339)

	// Update the database record
	dbSession.Metadata = models.MakeJSONField(metadata)
	if err := b.claudeService.GetDB().Save(&dbSession).Error; err != nil {
		return fmt.Errorf("failed to update session metadata: %w", err)
	}

	if b.config.Debug {
		slog.Debug("Added upload directory to session metadata",
			"session_id", sessionID,
			"thread_ts", threadTS,
			"upload_dir", uploadDir)
	}

	return nil
}

// recordFileUpload creates a database record for the uploaded file
func (b *SlackBot) recordFileUpload(file *slack.File, filename, localPath, userID, channelID, threadTS string, fileSize int64) error {
	// Get the associated Claude session ID if there is one
	sessionID := ""
	if session, exists := b.getSession(threadTS); exists {
		sessionID = session.SessionID
	}

	// Create the file upload record
	fileUpload := &models.SlackFileUpload{
		ThreadTS:     threadTS,
		ChannelID:    channelID,
		UserID:       userID,
		SlackFileID:  file.ID,
		FileName:     filename,
		OriginalName: file.Name,
		MimeType:     file.Mimetype,
		Category:     b.getFileCategory(file.Mimetype),
		FileSize:     fileSize,
		LocalPath:    localPath,
		UploadedAt:   time.Now(),
		Downloaded:   true,
		DownloadedAt: &time.Time{}, // Set to current time
		SessionID:    sessionID,
	}

	// Set DownloadedAt to current time
	now := time.Now()
	fileUpload.DownloadedAt = &now

	// Save to database
	if err := b.claudeService.GetDB().Create(fileUpload).Error; err != nil {
		return fmt.Errorf("failed to create file upload record: %w", err)
	}

	if b.config.Debug {
		slog.Debug("File upload recorded in database",
			"file_id", file.ID,
			"thread_ts", threadTS,
			"local_path", localPath,
			"session_id", sessionID)
	}

	return nil
}

// FileManager handles file cleanup and management operations
type FileManager struct {
	db     *gorm.DB
	debug  bool
	maxAge time.Duration // Maximum age for uploaded files
}

// NewFileManager creates a new file manager instance
func NewFileManager(db *gorm.DB, debug bool, maxAge time.Duration) *FileManager {
	return &FileManager{
		db:     db,
		debug:  debug,
		maxAge: maxAge,
	}
}

// CleanupOldFiles removes old uploaded files from both filesystem and database
func (fm *FileManager) CleanupOldFiles() error {
	cutoffTime := time.Now().Add(-fm.maxAge)

	// Find old file uploads
	var oldFiles []models.SlackFileUpload
	err := fm.db.Where("uploaded_at < ?", cutoffTime).Find(&oldFiles).Error
	if err != nil {
		return fmt.Errorf("failed to query old files: %w", err)
	}

	if len(oldFiles) == 0 {
		if fm.debug {
			slog.Debug("No old files to cleanup")
		}
		return nil
	}

	removedCount := 0
	for _, fileUpload := range oldFiles {
		// Remove physical file
		if err := os.Remove(fileUpload.LocalPath); err != nil {
			if !os.IsNotExist(err) {
				slog.Error("Failed to remove physical file",
					"file_path", fileUpload.LocalPath,
					"error", err)
				continue // Skip database deletion if file removal failed
			}
			// File doesn't exist, continue with database cleanup
		}

		// Remove database record
		if err := fm.db.Delete(&fileUpload).Error; err != nil {
			slog.Error("Failed to remove file record from database",
				"file_id", fileUpload.SlackFileID,
				"error", err)
			continue
		}

		removedCount++
		if fm.debug {
			slog.Debug("Removed old file",
				"file_id", fileUpload.SlackFileID,
				"local_path", fileUpload.LocalPath,
				"uploaded_at", fileUpload.UploadedAt)
		}
	}

	if removedCount > 0 {
		slog.Info("Cleaned up old uploaded files", "removed_count", removedCount)
	}

	return nil
}

// CleanupEmptyDirectories removes empty upload directories
func (fm *FileManager) CleanupEmptyDirectories() error {
	uploadBaseDir := "./data/slack-uploads"

	// Check if base directory exists
	if _, err := os.Stat(uploadBaseDir); os.IsNotExist(err) {
		return nil // Nothing to cleanup
	}

	entries, err := os.ReadDir(uploadBaseDir)
	if err != nil {
		return fmt.Errorf("failed to read upload directory: %w", err)
	}

	removedDirs := 0
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		dirPath := filepath.Join(uploadBaseDir, entry.Name())

		// Check if directory is empty
		dirEntries, err := os.ReadDir(dirPath)
		if err != nil {
			slog.Error("Failed to read directory", "path", dirPath, "error", err)
			continue
		}

		if len(dirEntries) == 0 {
			// Directory is empty, remove it
			if err := os.Remove(dirPath); err != nil {
				slog.Error("Failed to remove empty directory", "path", dirPath, "error", err)
				continue
			}

			removedDirs++
			if fm.debug {
				slog.Debug("Removed empty upload directory", "path", dirPath)
			}
		}
	}

	if removedDirs > 0 {
		slog.Info("Cleaned up empty upload directories", "removed_count", removedDirs)
	}

	return nil
}

// GetFileUploadStats returns statistics about uploaded files
func (fm *FileManager) GetFileUploadStats() (map[string]interface{}, error) {
	var stats struct {
		TotalFiles      int64 `json:"total_files"`
		TotalSize       int64 `json:"total_size_bytes"`
		DownloadedFiles int64 `json:"downloaded_files"`
		ActiveSessions  int64 `json:"files_with_active_sessions"`
	}

	// Total files
	if err := fm.db.Model(&models.SlackFileUpload{}).Count(&stats.TotalFiles).Error; err != nil {
		return nil, fmt.Errorf("failed to count total files: %w", err)
	}

	// Total size
	if err := fm.db.Model(&models.SlackFileUpload{}).Select("COALESCE(SUM(file_size), 0)").Scan(&stats.TotalSize).Error; err != nil {
		return nil, fmt.Errorf("failed to calculate total size: %w", err)
	}

	// Downloaded files
	if err := fm.db.Model(&models.SlackFileUpload{}).Where("downloaded = ?", true).Count(&stats.DownloadedFiles).Error; err != nil {
		return nil, fmt.Errorf("failed to count downloaded files: %w", err)
	}

	// Files with active sessions
	if err := fm.db.Model(&models.SlackFileUpload{}).Where("session_id != ''").Count(&stats.ActiveSessions).Error; err != nil {
		return nil, fmt.Errorf("failed to count files with sessions: %w", err)
	}

	result := map[string]interface{}{
		"total_files":                stats.TotalFiles,
		"total_size_bytes":           stats.TotalSize,
		"total_size_mb":              float64(stats.TotalSize) / (1024 * 1024),
		"downloaded_files":           stats.DownloadedFiles,
		"files_with_active_sessions": stats.ActiveSessions,
	}

	return result, nil
}

// preprocessMessage cleans and validates a message before sending to Claude
func (b *SlackBot) preprocessMessage(text, userID string) (string, error) {
	if text == "" {
		return "", fmt.Errorf("empty message")
	}

	// Remove extra whitespace and normalize line endings
	processed := strings.TrimSpace(text)
	processed = strings.ReplaceAll(processed, "\r\n", "\n")
	processed = strings.ReplaceAll(processed, "\r", "\n")

	// Handle Slack-specific formatting
	processed = b.cleanSlackFormatting(processed)

	// Handle user mentions - convert to readable format
	processed = b.expandUserMentions(processed)

	// Handle channel mentions
	processed = b.expandChannelMentions(processed)

	// Handle special links (URLs, etc.)
	processed = b.cleanSlackLinks(processed)

	// Remove excessive whitespace
	processed = regexp.MustCompile(`\n{3,}`).ReplaceAllString(processed, "\n\n")
	processed = regexp.MustCompile(`[ \t]+`).ReplaceAllString(processed, " ")
	processed = strings.TrimSpace(processed)

	// Check if the processed message is empty
	if processed == "" {
		return "", fmt.Errorf("empty message after processing")
	}

	// Validate message length
	if len(processed) > 4000 {
		return "", fmt.Errorf("message too long (%d characters, max 4000)", len(processed))
	}

	return processed, nil
}

// cleanSlackFormatting removes or converts Slack-specific formatting
func (b *SlackBot) cleanSlackFormatting(text string) string {
	// Convert Slack formatting to markdown-like format
	// *bold* stays the same
	// _italic_ stays the same
	// `code` stays the same
	// ```code block``` stays the same

	// Remove Slack's special formatting that Claude doesn't need
	// Remove <!here>, <!channel>, <!everyone>
	text = regexp.MustCompile(`<!(?:here|channel|everyone)>`).ReplaceAllString(text, "")

	return text
}

// expandUserMentions converts <@USERID> to readable format
func (b *SlackBot) expandUserMentions(text string) string {
	// Pattern to match <@USERID> or <@USERID|username>
	mentionPattern := regexp.MustCompile(`<@([A-Z0-9]+)(?:\|([^>]+))?>`)

	return mentionPattern.ReplaceAllStringFunc(text, func(match string) string {
		matches := mentionPattern.FindStringSubmatch(match)
		if len(matches) >= 2 {
			userID := matches[1]

			// If we have a username in the mention, use it
			if len(matches) >= 3 && matches[2] != "" {
				return "@" + matches[2]
			}

			// Try to get user info from Slack API
			if b.client != nil {
				if user, err := b.client.GetUserInfo(userID); err == nil {
					return "@" + user.Name
				}
			}

			// Fallback to generic mention
			return "@user"
		}
		return match
	})
}

// expandChannelMentions converts <#CHANNELID> to readable format
func (b *SlackBot) expandChannelMentions(text string) string {
	// Pattern to match <#CHANNELID> or <#CHANNELID|channelname>
	channelPattern := regexp.MustCompile(`<#([A-Z0-9]+)(?:\|([^>]+))?>`)

	return channelPattern.ReplaceAllStringFunc(text, func(match string) string {
		matches := channelPattern.FindStringSubmatch(match)
		if len(matches) >= 2 {
			channelID := matches[1]

			// If we have a channel name in the mention, use it
			if len(matches) >= 3 && matches[2] != "" {
				return "#" + matches[2]
			}

			// Try to get channel info from Slack API
			if b.client != nil {
				if channel, err := b.client.GetConversationInfo(&slack.GetConversationInfoInput{
					ChannelID: channelID,
				}); err == nil {
					return "#" + channel.Name
				}
			}

			// Fallback to generic mention
			return "#channel"
		}
		return match
	})
}

// cleanSlackLinks converts Slack-style links to readable format
func (b *SlackBot) cleanSlackLinks(text string) string {
	// Pattern to match <URL|text> or <URL>
	linkPattern := regexp.MustCompile(`<(https?://[^|>]+)(?:\|([^>]+))?>`)

	return linkPattern.ReplaceAllStringFunc(text, func(match string) string {
		matches := linkPattern.FindStringSubmatch(match)
		if len(matches) >= 2 {
			url := matches[1]

			// If we have link text, use it with the URL
			if len(matches) >= 3 && matches[2] != "" {
				return fmt.Sprintf("%s (%s)", matches[2], url)
			}

			// Just return the URL
			return url
		}
		return match
	})
}

// MessageRateLimiter manages rate limiting for user messages
type MessageRateLimiter struct {
	mu          sync.RWMutex
	userLimits  map[string]*UserRateLimit
	maxMessages int           // Maximum messages per window
	window      time.Duration // Time window for rate limiting
}

// UserRateLimit tracks rate limiting for a specific user
type UserRateLimit struct {
	messages    []time.Time
	lastCleanup time.Time
}

// NewMessageRateLimiter creates a new rate limiter
func NewMessageRateLimiter(maxMessages int, window time.Duration) *MessageRateLimiter {
	return &MessageRateLimiter{
		userLimits:  make(map[string]*UserRateLimit),
		maxMessages: maxMessages,
		window:      window,
	}
}

// CheckRateLimit checks if a user can send a message and updates their rate limit
func (rl *MessageRateLimiter) CheckRateLimit(userID string) (allowed bool, resetTime time.Time) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	// Get or create user limit
	userLimit, exists := rl.userLimits[userID]
	if !exists {
		userLimit = &UserRateLimit{
			messages:    make([]time.Time, 0),
			lastCleanup: now,
		}
		rl.userLimits[userID] = userLimit
	}

	// Clean up old messages (older than window)
	cutoff := now.Add(-rl.window)
	var validMessages []time.Time
	for _, msgTime := range userLimit.messages {
		if msgTime.After(cutoff) {
			validMessages = append(validMessages, msgTime)
		}
	}
	userLimit.messages = validMessages
	userLimit.lastCleanup = now

	// Check if user is within rate limit
	if len(userLimit.messages) >= rl.maxMessages {
		// Find the earliest message time to determine when user can send again
		if len(userLimit.messages) > 0 {
			earliestMsg := userLimit.messages[0]
			resetTime = earliestMsg.Add(rl.window)
		} else {
			resetTime = now.Add(rl.window)
		}
		return false, resetTime
	}

	// Add current message to the count
	userLimit.messages = append(userLimit.messages, now)
	return true, time.Time{}
}

// GetUserStats returns rate limit statistics for a user
func (rl *MessageRateLimiter) GetUserStats(userID string) (messageCount int, timeToReset time.Duration) {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	userLimit, exists := rl.userLimits[userID]
	if !exists {
		return 0, 0
	}

	now := time.Now()
	cutoff := now.Add(-rl.window)

	// Count valid messages
	validCount := 0
	var earliestValidMsg time.Time
	for _, msgTime := range userLimit.messages {
		if msgTime.After(cutoff) {
			validCount++
			if earliestValidMsg.IsZero() || msgTime.Before(earliestValidMsg) {
				earliestValidMsg = msgTime
			}
		}
	}

	if validCount > 0 && !earliestValidMsg.IsZero() {
		resetTime := earliestValidMsg.Add(rl.window)
		timeToReset = time.Until(resetTime)
		if timeToReset < 0 {
			timeToReset = 0
		}
	}

	return validCount, timeToReset
}

// CleanupExpiredEntries removes old entries from memory (should be called periodically)
func (rl *MessageRateLimiter) CleanupExpiredEntries() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window * 2) // Keep entries a bit longer than window

	for userID, userLimit := range rl.userLimits {
		// If last cleanup was long ago and no recent messages, remove user entry
		if userLimit.lastCleanup.Before(cutoff) && len(userLimit.messages) == 0 {
			delete(rl.userLimits, userID)
			continue
		}

		// Clean up old messages
		var validMessages []time.Time
		for _, msgTime := range userLimit.messages {
			if msgTime.After(cutoff) {
				validMessages = append(validMessages, msgTime)
			}
		}
		userLimit.messages = validMessages
	}
}

// sendToClaudeSessionWithTyping sends a message to Claude with typing indicators
func (b *SlackBot) sendToClaudeSessionWithTyping(session *SlackClaudeSession, message string) {
	if !session.Active {
		slog.Warn("Attempted to send message to inactive session", "session_id", session.SessionID)
		_, err := b.postMessage(session.ChannelID, session.ThreadTS,
			"⚠️ _Claude session is currently inactive. Use `/flow <your message>` to start a new conversation._")
		if err != nil {
			slog.Error("Failed to post inactive session message", "error", err)
		}
		return
	}

	// Show typing indicator
	go b.showTypingIndicator(session.ChannelID, session.ThreadTS)

	// Send to existing Claude session handling function
	b.sendToClaudeSession(session, message)
}

// showTypingIndicator shows a typing indicator and removes it after a delay
func (b *SlackBot) showTypingIndicator(channelID, threadTS string) {
	// Post typing indicator
	_, timestamp, err := b.client.PostMessage(channelID,
		slack.MsgOptionText("🤖 _Claude is thinking..._", false),
		slack.MsgOptionTS(threadTS))
	if err != nil {
		slog.Error("Failed to post typing indicator", "error", err)
		return
	}

	// Wait a bit, then remove the typing indicator
	time.Sleep(2 * time.Second)

	// Delete the typing indicator message
	_, _, err = b.client.DeleteMessage(channelID, timestamp)
	if err != nil {
		// If we can't delete it, update it to be less prominent
		_, _, _, err = b.client.UpdateMessage(channelID, timestamp,
			slack.MsgOptionText("🤖 _Processing..._", false))
		if err != nil {
			slog.Error("Failed to update typing indicator", "error", err)
		}
	}
}
