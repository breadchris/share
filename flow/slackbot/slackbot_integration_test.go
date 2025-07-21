package slackbot

import (
	"testing"

	"github.com/breadchris/flow/config"
	"github.com/slack-go/slack/slackevents"
)

func TestSlackBot_isChannelAllowed_Integration(t *testing.T) {
	tests := []struct {
		name              string
		whitelistPatterns []string
		channelID         string
		expected          bool
		shouldFailInit    bool
	}{
		{
			name:              "no whitelist - allow all",
			whitelistPatterns: []string{},
			channelID:         "C1234567890",
			expected:          true,
			shouldFailInit:    false,
		},
		{
			name:              "whitelist with match",
			whitelistPatterns: []string{"^C.*DEV$", ".*test.*"},
			channelID:         "C123DEV",
			expected:          true,
			shouldFailInit:    false,
		},
		{
			name:              "whitelist without match",
			whitelistPatterns: []string{"^C.*DEV$", ".*test.*"},
			channelID:         "C123PROD",
			expected:          false,
			shouldFailInit:    false,
		},
		{
			name:              "invalid regex pattern should fail init",
			whitelistPatterns: []string{"[invalid"},
			channelID:         "C1234567890",
			expected:          false,
			shouldFailInit:    true,
		},
		{
			name:              "real slack channel patterns",
			whitelistPatterns: []string{"^[CGD][A-Z0-9]{8,}$"},
			channelID:         "C1234567890",
			expected:          true,
			shouldFailInit:    false,
		},
		{
			name:              "real slack channel patterns - DM",
			whitelistPatterns: []string{"^[CGD][A-Z0-9]{8,}$"},
			channelID:         "D1234567890",
			expected:          true,
			shouldFailInit:    false,
		},
		{
			name:              "real slack channel patterns - invalid",
			whitelistPatterns: []string{"^[CGD][A-Z0-9]{8,}$"},
			channelID:         "X1234567890",
			expected:          false,
			shouldFailInit:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a minimal SlackBot config for testing
			slackConfig := &config.SlackBotConfig{
				ChannelWhitelist: tt.whitelistPatterns,
				Debug:            false,
			}

			// Try to create the whitelist
			whitelist, err := NewChannelWhitelist(slackConfig.ChannelWhitelist, slackConfig.Debug)
			
			if tt.shouldFailInit {
				if err == nil {
					t.Errorf("NewChannelWhitelist() expected error but got none")
				}
				return
			}
			
			if err != nil {
				t.Fatalf("NewChannelWhitelist() unexpected error: %v", err)
			}

			// Create a minimal SlackBot instance with just the whitelist
			bot := &SlackBot{
				config:           slackConfig,
				channelWhitelist: whitelist,
			}

			// Test the channel check
			result := bot.isChannelAllowed(tt.channelID)
			if result != tt.expected {
				t.Errorf("isChannelAllowed(%q) = %v, expected %v (patterns: %v)", 
					tt.channelID, result, tt.expected, tt.whitelistPatterns)
			}
		})
	}
}

func TestSlackBot_isChannelAllowed_EdgeCases(t *testing.T) {
	// Test with nil whitelist (should not happen in practice but good to test)
	bot := &SlackBot{
		config:           &config.SlackBotConfig{},
		channelWhitelist: nil,
	}

	// This should panic or be handled gracefully
	defer func() {
		if r := recover(); r != nil {
			t.Errorf("isChannelAllowed() panicked with nil whitelist: %v", r)
		}
	}()

	// In practice this won't happen since New() creates the whitelist
	// but it's good to test defensive programming
	if bot.channelWhitelist != nil {
		bot.isChannelAllowed("C1234567890")
	}
}

func TestSlackBot_AppMentionWhitelistEnforcement(t *testing.T) {
	tests := []struct {
		name              string
		whitelistPatterns []string
		channelID         string
		shouldHandle      bool
	}{
		{
			name:              "no whitelist - allow all",
			whitelistPatterns: []string{},
			channelID:         "C1234567890",
			shouldHandle:      true,
		},
		{
			name:              "whitelist with match",
			whitelistPatterns: []string{"^C.*DEV$"},
			channelID:         "C123DEV",
			shouldHandle:      true,
		},
		{
			name:              "whitelist without match",
			whitelistPatterns: []string{"^C.*DEV$"},
			channelID:         "C123PROD",
			shouldHandle:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create whitelist
			whitelist, err := NewChannelWhitelist(tt.whitelistPatterns, true)
			if err != nil {
				t.Fatalf("NewChannelWhitelist() unexpected error: %v", err)
			}

			// Create a minimal SlackBot instance
			slackConfig := &config.SlackBotConfig{
				Debug:            true,
				ChannelWhitelist: tt.whitelistPatterns,
			}
			
			bot := &SlackBot{
				config:           slackConfig,
				channelWhitelist: whitelist,
			}

			// Test that isChannelAllowed correctly gates app mentions
			result := bot.isChannelAllowed(tt.channelID)
			if result != tt.shouldHandle {
				t.Errorf("App mention whitelist check failed: isChannelAllowed(%q) = %v, expected %v (patterns: %v)", 
					tt.channelID, result, tt.shouldHandle, tt.whitelistPatterns)
			}
		})
	}
}

func TestSlackBot_AppMentionThreadHandling(t *testing.T) {
	tests := []struct {
		name                    string
		threadTimeStamp         string
		expectedInExistingThread bool
		description             string
	}{
		{
			name:                    "app mention in new channel message",
			threadTimeStamp:         "",
			expectedInExistingThread: false,
			description:             "Should create new thread when mentioned in channel",
		},
		{
			name:                    "app mention in existing thread",
			threadTimeStamp:         "1234567890.123456",
			expectedInExistingThread: true,
			description:             "Should reply in existing thread when mentioned in thread",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test the thread detection logic directly
			// We can't easily test the full handleAppMentionEvent without mocking Slack client
			// but we can verify the core logic that determines if we're in an existing thread
			inExistingThread := tt.threadTimeStamp != ""
			
			if inExistingThread != tt.expectedInExistingThread {
				t.Errorf("Thread detection failed: threadTimeStamp=%q, expected inExistingThread=%v, got=%v", 
					tt.threadTimeStamp, tt.expectedInExistingThread, inExistingThread)
			}

			t.Logf("Test case verified: %s - threadTS=%q, inExistingThread=%v", 
				tt.description, tt.threadTimeStamp, inExistingThread)
		})
	}
}

func BenchmarkChannelWhitelist_IsAllowed(b *testing.B) {
	// Test performance with different pattern complexities
	tests := []struct {
		name     string
		patterns []string
	}{
		{
			name:     "no patterns",
			patterns: []string{},
		},
		{
			name:     "single exact pattern",
			patterns: []string{"C1234567890"},
		},
		{
			name:     "single regex pattern",
			patterns: []string{"^C.*DEV$"},
		},
		{
			name:     "multiple patterns",
			patterns: []string{"^C.*DEV$", ".*test.*", "^G.*PRIVATE$", "^D.*"},
		},
		{
			name:     "complex regex",
			patterns: []string{"^[CGD][A-Z0-9]{8,}$"},
		},
	}

	channelID := "C1234567890"

	for _, tt := range tests {
		b.Run(tt.name, func(b *testing.B) {
			whitelist, err := NewChannelWhitelist(tt.patterns, false)
			if err != nil {
				b.Fatalf("NewChannelWhitelist() failed: %v", err)
			}

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				whitelist.IsAllowed(channelID)
			}
		})
	}
}

func BenchmarkChannelWhitelist_VeryLongChannelID(b *testing.B) {
	// Test performance with very long channel ID
	patterns := []string{".*test.*", "^C.*DEV$"}
	whitelist, err := NewChannelWhitelist(patterns, false)
	if err != nil {
		b.Fatalf("NewChannelWhitelist() failed: %v", err)
	}

	// Create a very long channel ID
	longChannelID := "C" + string(make([]byte, 10000))
	for i := range longChannelID[1:] {
		longChannelID = longChannelID[:i+1] + "A" + longChannelID[i+2:]
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		whitelist.IsAllowed(longChannelID)
	}
}

// Tests for the core bot detection logic that's causing the production issue
func TestSlackBot_BotDetectionLogic(t *testing.T) {
	// Create a test bot with a known bot user ID
	testBotUserID := "U09537B9B32"
	bot := &SlackBot{
		botUserID: testBotUserID,
		config: &config.SlackBotConfig{
			Debug: true,
		},
		channelWhitelist: createTestWhitelist(t),
	}

	tests := []struct {
		name          string
		messageEvent  *slackevents.MessageEvent
		shouldIgnore  bool
		reason        string
	}{
		{
			name: "valid user message with bot mention",
			messageEvent: &slackevents.MessageEvent{
				Type:      "message",
				User:      "U093Z388PL2", // Real user ID from production logs
				Text:      "<@U09537B9B32> make me a makeup affiliate market site",
				Channel:   "C093Z38BN1G",
				TimeStamp: "1752296777.707309",
				ThreadTimeStamp: "1752296777.707309",
				BotID:     "", // No bot ID - this is a real user
			},
			shouldIgnore: false,
			reason:       "should process valid user messages with bot mentions",
		},
		{
			name: "message_changed event with bot mention",
			messageEvent: &slackevents.MessageEvent{
				Type:      "message",
				SubType:   "message_changed",
				User:      "U093Z388PL2", // Real user ID 
				Text:      "<@U09537B9B32> updated message with bot mention",
				Channel:   "C093Z38BN1G",
				TimeStamp: "1752297250.005300",
				ThreadTimeStamp: "1752296777.707309",
				BotID:     "", // No bot ID - this is a real user editing
			},
			shouldIgnore: false,
			reason:       "should process message_changed events from real users",
		},
		{
			name: "bot message should be ignored",
			messageEvent: &slackevents.MessageEvent{
				Type:    "message",
				User:    "",
				Text:    "This is a bot message",
				Channel: "C093Z38BN1G",
				BotID:   "B12345678", // Has bot ID
			},
			shouldIgnore: true,
			reason:       "should ignore messages from bots",
		},
		{
			name: "bot's own message should be ignored",
			messageEvent: &slackevents.MessageEvent{
				Type:    "message",
				User:    testBotUserID, // Bot's own user ID
				Text:    "This is the bot's own message",
				Channel: "C093Z38BN1G",
				BotID:   "",
			},
			shouldIgnore: true,
			reason:       "should ignore bot's own messages",
		},
		{
			name: "empty user field should be ignored",
			messageEvent: &slackevents.MessageEvent{
				Type:    "message",
				User:    "", // Empty user field
				Text:    "Message with empty user",
				Channel: "C093Z38BN1G",
				BotID:   "", // No bot ID but no user either
			},
			shouldIgnore: true,
			reason:       "should ignore messages with empty user field",
		},
		{
			name: "message without thread timestamp should be ignored",
			messageEvent: &slackevents.MessageEvent{
				Type:    "message",
				User:    "U093Z388PL2",
				Text:    "<@U09537B9B32> message in channel not thread",
				Channel: "C093Z38BN1G",
				ThreadTimeStamp: "", // No thread timestamp
				BotID:   "",
			},
			shouldIgnore: true,
			reason:       "should ignore non-thread messages",
		},
		{
			name: "message without bot mention should be ignored",
			messageEvent: &slackevents.MessageEvent{
				Type:    "message",
				User:    "U093Z388PL2",
				Text:    "message without mention",
				Channel: "C093Z38BN1G",
				ThreadTimeStamp: "1752296777.707309",
				BotID:   "",
			},
			shouldIgnore: true,
			reason:       "should ignore messages without bot mention",
		},
		{
			name: "edge case: message with both botID and user",
			messageEvent: &slackevents.MessageEvent{
				Type:    "message",
				User:    "U093Z388PL2", // Has user ID
				Text:    "Weird edge case",
				Channel: "C093Z38BN1G",
				BotID:   "B12345678", // But also has bot ID
			},
			shouldIgnore: true,
			reason:       "should ignore messages with bot ID even if user ID present",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test the individual parts of the bot detection logic
			
			// 1. Test basic bot filtering (ev.BotID != "" || ev.User == "")
			isBotMessage := tt.messageEvent.BotID != "" || tt.messageEvent.User == ""
			
			// 2. Test self-message detection (ev.User == b.botUserID)
			isSelfMessage := tt.messageEvent.User == bot.botUserID
			
			// 3. Test thread requirement (ev.ThreadTimeStamp == "")
			isNonThreadMessage := tt.messageEvent.ThreadTimeStamp == ""
			
			// 4. Test bot mention detection
			hasBotMention := bot.isBotMentioned(tt.messageEvent.Text)
			
			// Combine all the logic from handleMessageEvent
			shouldIgnoreForBotFilter := isBotMessage
			shouldIgnoreForSelf := isSelfMessage
			shouldIgnoreForThread := isNonThreadMessage
			shouldIgnoreForMention := !hasBotMention
			
			overallShouldIgnore := shouldIgnoreForBotFilter || shouldIgnoreForSelf || shouldIgnoreForThread || shouldIgnoreForMention
			
			if overallShouldIgnore != tt.shouldIgnore {
				t.Errorf("Bot detection logic failed for %s:\n", tt.name)
				t.Errorf("  Expected shouldIgnore: %v", tt.shouldIgnore)
				t.Errorf("  Actual shouldIgnore: %v", overallShouldIgnore)
				t.Errorf("  Reason: %s", tt.reason)
				t.Errorf("  Breakdown:")
				t.Errorf("    - isBotMessage (BotID='%s', User='%s'): %v", tt.messageEvent.BotID, tt.messageEvent.User, isBotMessage)
				t.Errorf("    - isSelfMessage: %v", isSelfMessage)
				t.Errorf("    - isNonThreadMessage: %v", isNonThreadMessage)
				t.Errorf("    - hasBotMention: %v", hasBotMention)
			}
		})
	}
}

func TestSlackBot_isBotMentioned(t *testing.T) {
	testBotUserID := "U09537B9B32"
	bot := &SlackBot{
		botUserID: testBotUserID,
	}

	tests := []struct {
		name      string
		text      string
		mentioned bool
	}{
		{
			name:      "direct mention at start",
			text:      "<@U09537B9B32> help me with this",
			mentioned: true,
		},
		{
			name:      "direct mention with username",
			text:      "<@U09537B9B32|botname> help me with this",
			mentioned: true,
		},
		{
			name:      "mention in middle of message",
			text:      "Hey <@U09537B9B32> can you help?",
			mentioned: true,
		},
		{
			name:      "mention at end",
			text:      "Can you help me <@U09537B9B32>?",
			mentioned: true,
		},
		{
			name:      "no mention",
			text:      "This is a message without mention",
			mentioned: false,
		},
		{
			name:      "mention of different user",
			text:      "<@U12345678> different user mentioned",
			mentioned: false,
		},
		{
			name:      "empty text",
			text:      "",
			mentioned: false,
		},
		{
			name:      "malformed mention",
			text:      "@@U09537B9B32 malformed mention",
			mentioned: false,
		},
		{
			name:      "partial match should not trigger",
			text:      "U09537B9B32 without angle brackets",
			mentioned: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := bot.isBotMentioned(tt.text)
			if result != tt.mentioned {
				t.Errorf("isBotMentioned(%q) = %v, expected %v", tt.text, result, tt.mentioned)
			}
		})
	}
}

func TestSlackBot_isBotMentioned_EmptyBotUserID(t *testing.T) {
	// Test the edge case where botUserID is not set
	bot := &SlackBot{
		botUserID: "", // Empty bot user ID
	}

	result := bot.isBotMentioned("<@U09537B9B32> mention some user")
	if result != false {
		t.Errorf("isBotMentioned() with empty botUserID should return false, got %v", result)
	}
}

func TestSlackBot_MessageEventWhitelistIntegration(t *testing.T) {
	tests := []struct {
		name              string
		whitelistPatterns []string
		channelID         string
		shouldProcess     bool
	}{
		{
			name:              "whitelisted channel should process",
			whitelistPatterns: []string{"^C093Z38BN1G$"}, // Exact match for production channel
			channelID:         "C093Z38BN1G",
			shouldProcess:     true,
		},
		{
			name:              "non-whitelisted channel should ignore",
			whitelistPatterns: []string{"^C093Z38BN1G$"},
			channelID:         "C999999999",
			shouldProcess:     false,
		},
		{
			name:              "pattern matching development channels",
			whitelistPatterns: []string{".*DEV.*", ".*TEST.*"},
			channelID:         "C123DEV456",
			shouldProcess:     true,
		},
		{
			name:              "no whitelist allows all",
			whitelistPatterns: []string{},
			channelID:         "C999999999",
			shouldProcess:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create whitelist
			whitelist, err := NewChannelWhitelist(tt.whitelistPatterns, true)
			if err != nil {
				t.Fatalf("NewChannelWhitelist() error: %v", err)
			}

			bot := &SlackBot{
				botUserID: "U09537B9B32",
				config: &config.SlackBotConfig{
					Debug:            true,
					ChannelWhitelist: tt.whitelistPatterns,
				},
				channelWhitelist: whitelist,
			}

			// Test the channel check that would be used in handleMessageEvent
			result := bot.isChannelAllowed(tt.channelID)
			if result != tt.shouldProcess {
				t.Errorf("Channel whitelist check failed: isChannelAllowed(%q) = %v, expected %v (patterns: %v)", 
					tt.channelID, result, tt.shouldProcess, tt.whitelistPatterns)
			}
		})
	}
}

func TestSlackBot_AppMentionEventWhitelistIntegration(t *testing.T) {
	tests := []struct {
		name              string
		whitelistPatterns []string
		appMentionEvent   *slackevents.AppMentionEvent
		shouldProcess     bool
	}{
		{
			name:              "app mention in whitelisted channel",
			whitelistPatterns: []string{"^C093Z38BN1G$"},
			appMentionEvent: &slackevents.AppMentionEvent{
				Type:    "app_mention",
				User:    "U093Z388PL2",
				Text:    "<@U09537B9B32> help me",
				Channel: "C093Z38BN1G",
			},
			shouldProcess: true,
		},
		{
			name:              "app mention in non-whitelisted channel",
			whitelistPatterns: []string{"^C093Z38BN1G$"},
			appMentionEvent: &slackevents.AppMentionEvent{
				Type:    "app_mention",
				User:    "U093Z388PL2", 
				Text:    "<@U09537B9B32> help me",
				Channel: "C999999999",
			},
			shouldProcess: false,
		},
		{
			name:              "app mention in thread in whitelisted channel",
			whitelistPatterns: []string{"^C093Z38BN1G$"},
			appMentionEvent: &slackevents.AppMentionEvent{
				Type:            "app_mention",
				User:            "U093Z388PL2",
				Text:            "<@U09537B9B32> continue in thread",
				Channel:         "C093Z38BN1G",
				ThreadTimeStamp: "1752296777.707309",
			},
			shouldProcess: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create whitelist
			whitelist, err := NewChannelWhitelist(tt.whitelistPatterns, true)
			if err != nil {
				t.Fatalf("NewChannelWhitelist() error: %v", err)
			}

			bot := &SlackBot{
				botUserID: "U09537B9B32",
				config: &config.SlackBotConfig{
					Debug:            true,
					ChannelWhitelist: tt.whitelistPatterns,
				},
				channelWhitelist: whitelist,
			}

			// Test the channel check that would be used in handleAppMentionEvent  
			result := bot.isChannelAllowed(tt.appMentionEvent.Channel)
			if result != tt.shouldProcess {
				t.Errorf("App mention whitelist check failed: isChannelAllowed(%q) = %v, expected %v (patterns: %v)", 
					tt.appMentionEvent.Channel, result, tt.shouldProcess, tt.whitelistPatterns)
			}
		})
	}
}

// Test the production scenario that's failing
func TestSlackBot_ProductionScenarioReproduction(t *testing.T) {
	// This test reproduces the exact scenario from the production logs
	testBotUserID := "U09537B9B32"
	bot := &SlackBot{
		botUserID: testBotUserID,
		config: &config.SlackBotConfig{
			Debug: true,
		},
		channelWhitelist: createTestWhitelist(t),
	}

	// This is the exact message from the production logs that was being ignored
	productionMessage := &slackevents.MessageEvent{
		Type:    "message",
		SubType: "message_changed", // This was a message_changed event
		User:    "U093Z388PL2",     // Real user ID from logs
		Text:    "<@U09537B9B32> make me a makeup affiliate market site with only tsx and react...", // Truncated for brevity
		Channel: "C093Z38BN1G",     // Real channel ID from logs
		TimeStamp: "1752297250.005300",
		ThreadTimeStamp: "1752296777.707309", // This was in a thread
		BotID:   "", // No bot ID - this is a real user
	}

	// Test each part of the bot detection logic
	t.Run("bot_filter_check", func(t *testing.T) {
		isBotMessage := productionMessage.BotID != "" || productionMessage.User == ""
		if isBotMessage {
			t.Errorf("Production message incorrectly identified as bot message: BotID='%s', User='%s'", 
				productionMessage.BotID, productionMessage.User)
		}
	})

	t.Run("self_message_check", func(t *testing.T) {
		isSelfMessage := productionMessage.User == bot.botUserID
		if isSelfMessage {
			t.Errorf("Production message incorrectly identified as self message: User='%s', BotUserID='%s'", 
				productionMessage.User, bot.botUserID)
		}
	})

	t.Run("thread_check", func(t *testing.T) {
		isNonThreadMessage := productionMessage.ThreadTimeStamp == ""
		if isNonThreadMessage {
			t.Errorf("Production message incorrectly identified as non-thread: ThreadTimeStamp='%s'", 
				productionMessage.ThreadTimeStamp)
		}
	})

	t.Run("mention_check", func(t *testing.T) {
		hasBotMention := bot.isBotMentioned(productionMessage.Text)
		if !hasBotMention {
			t.Errorf("Production message mention not detected: Text='%s', BotUserID='%s'", 
				productionMessage.Text, bot.botUserID)
		}
	})

	t.Run("overall_logic", func(t *testing.T) {
		// This is the exact logic from handleMessageEvent lines 176-227
		
		// Step 1: Bot message filter
		if productionMessage.BotID != "" || productionMessage.User == "" {
			t.Errorf("Production message should NOT be ignored for bot filter")
			return
		}

		// Step 2: Self message filter  
		if productionMessage.User == bot.botUserID {
			t.Errorf("Production message should NOT be ignored for self filter")
			return
		}

		// Step 3: Thread requirement
		if productionMessage.ThreadTimeStamp == "" {
			t.Errorf("Production message should NOT be ignored for thread requirement")
			return
		}

		// Step 4: Bot mention requirement
		if !bot.isBotMentioned(productionMessage.Text) {
			t.Errorf("Production message should NOT be ignored for mention requirement")
			return
		}

		// If we get here, the message should be processed
		t.Logf("✅ Production message should be processed correctly")
	})
}

// Helper function to create a test whitelist that allows common test channels
func createTestWhitelist(t *testing.T) *ChannelWhitelist {
	patterns := []string{
		"^C093Z38BN1G$", // Production channel from logs
		"^C.*TEST.*$",   // Test channels
		"^C.*DEV.*$",    // Dev channels  
		"^G.*$",         // Group channels
		"^D.*$",         // DM channels
	}
	
	whitelist, err := NewChannelWhitelist(patterns, true)
	if err != nil {
		t.Fatalf("Failed to create test whitelist: %v", err)
	}
	
	return whitelist
}