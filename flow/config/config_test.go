package config

import (
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestConfigDefaults(t *testing.T) {
	config := LoadConfig()

	// Test default values are set
	assert.False(t, config.SlackBot.Enabled)
	assert.Equal(t, 30*time.Minute, config.SlackBot.SessionTimeout)
	assert.Equal(t, 10, config.SlackBot.MaxSessions)
	assert.Equal(t, "/tmp/slackbot", config.SlackBot.WorkingDirectory)
	assert.False(t, config.SlackBot.Debug)

	assert.False(t, config.Claude.Debug)
	assert.Equal(t, "/tmp/claude", config.Claude.DebugDir)
	assert.Equal(t, []string{"Read", "Write", "Bash"}, config.Claude.Tools)

	assert.Equal(t, "/tmp/worklet-repos", config.Worklet.BaseDir)
	assert.Equal(t, 24*time.Hour, config.Worklet.CleanupMaxAge)
	assert.Equal(t, 5, config.Worklet.MaxConcurrent)

	assert.Equal(t, "/tmp/git-repos", config.Git.BaseDir)
}

func TestEnvironmentVariableOverrides(t *testing.T) {
	// Set environment variables
	os.Setenv("SLACK_APP_TOKEN", "test-app-token")
	os.Setenv("SLACK_BOT_TOKEN", "test-bot-token")
	os.Setenv("SLACK_BOT_DEBUG", "true")
	os.Setenv("CLAUDE_DEBUG", "true")
	os.Setenv("GITHUB_TOKEN", "test-github-token")
	
	defer func() {
		// Clean up environment variables
		os.Unsetenv("SLACK_APP_TOKEN")
		os.Unsetenv("SLACK_BOT_TOKEN")
		os.Unsetenv("SLACK_BOT_DEBUG")
		os.Unsetenv("CLAUDE_DEBUG")
		os.Unsetenv("GITHUB_TOKEN")
	}()

	config := LoadConfig()

	// Test environment variable overrides
	assert.Equal(t, "test-app-token", config.SlackBot.SlackAppToken)
	assert.Equal(t, "test-bot-token", config.SlackBot.SlackBotToken)
	assert.True(t, config.SlackBot.Debug)
	assert.True(t, config.SlackBot.Enabled) // Should auto-enable when tokens are present
	assert.True(t, config.Claude.Debug)
	assert.Equal(t, "test-github-token", config.Git.Token)
}

func TestSlackBotConfigValidation(t *testing.T) {
	// Test invalid config
	config := SlackBotConfig{
		SlackAppToken: "",
		SlackBotToken: "",
	}
	assert.False(t, config.IsValid())

	// Test valid config
	config = SlackBotConfig{
		SlackAppToken: "test-app-token",
		SlackBotToken: "test-bot-token",
	}
	assert.True(t, config.IsValid())
}

func TestAppConfigHelpers(t *testing.T) {
	config := AppConfig{
		SlackBot: SlackBotConfig{
			Enabled:       true,
			SlackAppToken: "test-app-token",
			SlackBotToken: "test-bot-token",
		},
	}

	// Test helper methods
	assert.True(t, config.IsSlackBotEnabled())
	assert.NotNil(t, config.GetSlackBotConfig())
	assert.NotNil(t, config.GetClaudeConfig())
	assert.NotNil(t, config.GetWorkletConfig())
	assert.NotNil(t, config.GetGitConfig())

	// Test disabled SlackBot
	config.SlackBot.Enabled = false
	assert.False(t, config.IsSlackBotEnabled())
}