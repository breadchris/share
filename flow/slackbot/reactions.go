package slackbot

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/slack-go/slack"
	"github.com/slack-go/slack/slackevents"
)

// handleReactionEvent processes reaction events
func (b *SlackBot) handleReactionEvent(reaction *slackevents.ReactionAddedEvent, isRemoval bool) {
	if b.config.Debug {
		action := "added"
		if isRemoval {
			action = "removed"
		}
		slog.Debug("Handling reaction event",
			"action", action,
			"emoji", reaction.Reaction,
			"user_id", reaction.User,
			"channel_id", reaction.Item.Channel,
			"timestamp", reaction.Item.Timestamp)
	}

	// Check if channel is allowed by whitelist
	if !b.isChannelAllowed(reaction.Item.Channel) {
		if b.config.Debug {
			slog.Debug("Reaction event rejected - channel not in whitelist",
				"channel_id", reaction.Item.Channel,
				"user_id", reaction.User)
		}
		return
	}

	// Ignore reactions from bots
	if reaction.User == "" {
		return
	}

	// Check if this is a reaction to a message in an ideation thread
	threadTS := b.getThreadTimestamp(reaction.Item.Channel, reaction.Item.Timestamp)
	if threadTS == "" {
		return // Not in a thread
	}

	// Check if we have an ideation session for this thread
	session, exists := b.ideationManager.GetSession(threadTS)
	if !exists {
		return // No ideation session for this thread
	}

	// Find the feature this reaction is for
	featureID := b.findFeatureByMessageTS(session, reaction.Item.Timestamp)
	if featureID == "" {
		if b.config.Debug {
			slog.Debug("No feature found for reaction message",
				"message_ts", reaction.Item.Timestamp,
				"thread_ts", threadTS)
		}
		return
	}

	// Process the reaction
	if isRemoval {
		err := b.ideationManager.RemoveReaction(threadTS, featureID, reaction.Reaction, reaction.User)
		if err != nil {
			slog.Error("Failed to remove reaction", "error", err)
			return
		}
	} else {
		err := b.ideationManager.AddReaction(threadTS, featureID, reaction.Reaction, reaction.User)
		if err != nil {
			slog.Error("Failed to add reaction", "error", err)
			return
		}
	}

	// Update context summary when reactions change
	if b.contextManager != nil {
		go func() {
			time.Sleep(1 * time.Second) // Brief delay to allow reaction processing
			ctx := context.Background()
			err := b.contextManager.GenerateContextSummary(ctx, threadTS, session)
			if err != nil && b.config.Debug {
				slog.Debug("Failed to update context after reaction", "error", err)
			}
		}()
	}

	// Check if we should expand ideas based on current feedback
	if !isRemoval && b.ideationManager.ShouldExpandIdeas(threadTS) {
		go b.handleIdeationExpansion(threadTS, session)
	}
}

// getThreadTimestamp gets the thread timestamp for a message
func (b *SlackBot) getThreadTimestamp(channelID, messageTS string) string {
	// Get message info to check if it's in a thread
	// For now, we'll assume messages in ideation sessions are always in threads
	// In a real implementation, you'd use the Slack API to get message details
	return messageTS
}

// findFeatureByMessageTS finds a feature ID by its message timestamp
func (b *SlackBot) findFeatureByMessageTS(session *IdeationSession, messageTS string) string {
	for featureID, storedTS := range session.MessageTS {
		if storedTS == messageTS {
			return featureID
		}
	}
	return ""
}

// handleIdeationExpansion generates additional ideas based on user feedback
func (b *SlackBot) handleIdeationExpansion(threadTS string, session *IdeationSession) {
	ctx := context.Background()

	if b.config.Debug {
		slog.Debug("Expanding ideation based on user feedback",
			"session_id", session.SessionID,
			"thread_ts", threadTS)
	}

	// Get liked features
	likedFeatures, err := b.ideationManager.GetLikedFeatures(threadTS)
	if err != nil {
		slog.Error("Failed to get liked features", "error", err)
		return
	}

	if len(likedFeatures) == 0 {
		if b.config.Debug {
			slog.Debug("No liked features found for expansion", "session_id", session.SessionID)
		}
		return
	}

	// Post notification that we're expanding
	_, err = b.postMessage(session.ChannelID, threadTS, 
		"🔄 I notice you're showing interest in certain features! Let me generate some additional ideas based on your preferences...")
	if err != nil {
		slog.Error("Failed to post expansion notification", "error", err)
	}

	// Generate expanded ideas
	expansionResponse, err := b.chatgptService.ExpandIdeas(ctx, session.OriginalIdea, likedFeatures, session.Preferences)
	if err != nil {
		slog.Error("Failed to expand ideas", "error", err)
		_, _ = b.postMessage(session.ChannelID, threadTS, 
			fmt.Sprintf("❌ Failed to generate additional ideas: %s", err.Error()))
		return
	}

	// Add new features to session
	err = b.ideationManager.AddFeatures(threadTS, expansionResponse.Features, "expansion")
	if err != nil {
		slog.Error("Failed to add expanded features to session", "error", err)
		return
	}

	// Post expansion summary
	summaryMsg := fmt.Sprintf("✨ **%s**\n\nBased on your reactions, here are some additional ideas:", 
		expansionResponse.Summary)
	
	_, err = b.postMessage(session.ChannelID, threadTS, summaryMsg)
	if err != nil {
		slog.Error("Failed to post expansion summary", "error", err)
		return
	}

	// Post each new feature
	for _, feature := range expansionResponse.Features {
		featureMsg := b.formatFeatureMessage(feature)
		messageTS, err := b.postMessage(session.ChannelID, threadTS, featureMsg)
		if err != nil {
			slog.Error("Failed to post expanded feature message", "error", err)
			continue
		}

		// Store message timestamp for this feature
		err = b.ideationManager.SetFeatureMessageTS(threadTS, feature.ID, messageTS)
		if err != nil {
			slog.Error("Failed to store expanded feature message timestamp", "error", err)
		}

		// Add default emoji reactions
		emojis := []string{"👍", "🔥", "❤️", "👎"}
		for _, emoji := range emojis {
			err = b.client.AddReaction(emoji, slack.ItemRef{
				Channel:   session.ChannelID,
				Timestamp: messageTS,
			})
			if err != nil && b.config.Debug {
				slog.Debug("Failed to add reaction to expanded feature", "emoji", emoji, "error", err)
			}
		}

		// Add a small delay to avoid rate limiting
		time.Sleep(100 * time.Millisecond)
	}

	// Update context summary after expansion
	if b.contextManager != nil {
		go func() {
			time.Sleep(2 * time.Second) // Wait for messages to be posted
			err := b.contextManager.GenerateContextSummary(ctx, threadTS, session)
			if err != nil && b.config.Debug {
				slog.Debug("Failed to update context after expansion", "error", err)
			}
		}()
	}

	if b.config.Debug {
		slog.Debug("Ideation expansion completed",
			"session_id", session.SessionID,
			"new_features", len(expansionResponse.Features))
	}
}

// processFeatureReaction handles reactions to specific features
func (b *SlackBot) processFeatureReaction(session *IdeationSession, featureID, emoji, userID string, isRemoval bool) {
	if b.config.Debug {
		action := "added"
		if isRemoval {
			action = "removed"
		}
		slog.Debug("Processing feature reaction",
			"action", action,
			"session_id", session.SessionID,
			"feature_id", featureID,
			"emoji", emoji,
			"user_id", userID)
	}

	// Find the feature
	var feature *Feature
	for i := range session.Features {
		if session.Features[i].ID == featureID {
			feature = &session.Features[i]
			break
		}
	}

	if feature == nil {
		if b.config.Debug {
			slog.Debug("Feature not found for reaction",
				"feature_id", featureID,
				"session_id", session.SessionID)
		}
		return
	}

	// Update feature reaction count (if we were tracking per-feature reactions)
	// For now, we're tracking global preferences in the session

	// Check for significant feedback patterns
	totalReactions := session.Preferences["👍"] + session.Preferences["🔥"] + session.Preferences["❤️"]
	negativeReactions := session.Preferences["👎"]

	// If user is showing strong positive interest, suggest expansion
	if !isRemoval && totalReactions >= 3 && negativeReactions == 0 {
		go func() {
			time.Sleep(2 * time.Second) // Give user time to react to more features
			if b.ideationManager.ShouldExpandIdeas(session.ThreadID) {
				b.handleIdeationExpansion(session.ThreadID, session)
			}
		}()
	}

	// If user is showing mixed reactions, provide guidance
	if !isRemoval && totalReactions >= 2 && negativeReactions >= 1 {
		go func() {
			time.Sleep(3 * time.Second)
			_, err := b.postMessage(session.ChannelID, session.ThreadID,
				"💡 I see you have mixed feelings about these features. Feel free to keep reacting - your feedback helps me understand what direction to explore!")
			if err != nil && b.config.Debug {
				slog.Debug("Failed to post guidance message", "error", err)
			}
		}()
	}
}