package slackbot

import (
	"os"
	"strconv"
	"time"
)

// Config holds configuration for the Slack bot
type Config struct {
	SlackAppToken    string        `json:"slack_app_token"`
	SlackBotToken    string        `json:"slack_bot_token"`
	SessionTimeout   time.Duration `json:"session_timeout"`
	MaxSessions      int           `json:"max_sessions"`
	WorkingDirectory string        `json:"working_directory"`
	Debug            bool          `json:"debug"`
	Enabled          bool          `json:"enabled"`
}

// LoadConfig reads configuration from environment variables with sensible defaults
func LoadConfig() *Config {
	config := &Config{
		SlackAppToken:    os.Getenv("SLACK_APP_TOKEN"),
		SlackBotToken:    os.Getenv("SLACK_BOT_TOKEN"),
		SessionTimeout:   30 * time.Minute,
		MaxSessions:      10,
		WorkingDirectory: "/Users/hacked/Documents/GitHub/share",
		Debug:            false,
		Enabled:          false,
	}

	// Parse session timeout from environment
	if timeoutStr := os.Getenv("SLACK_BOT_SESSION_TIMEOUT"); timeoutStr != "" {
		if timeout, err := time.ParseDuration(timeoutStr); err == nil {
			config.SessionTimeout = timeout
		}
	}

	// Parse max sessions from environment
	if maxStr := os.Getenv("SLACK_BOT_MAX_SESSIONS"); maxStr != "" {
		if max, err := strconv.Atoi(maxStr); err == nil {
			config.MaxSessions = max
		}
	}

	// Parse working directory from environment
	if wd := os.Getenv("SLACK_BOT_WORKING_DIR"); wd != "" {
		config.WorkingDirectory = wd
	}

	// Parse debug flag from environment
	if debugStr := os.Getenv("SLACK_BOT_DEBUG"); debugStr != "" {
		config.Debug = debugStr == "true" || debugStr == "1"
	}

	// Check if bot should be enabled
	if enabledStr := os.Getenv("SLACK_BOT_ENABLED"); enabledStr != "" {
		config.Enabled = enabledStr == "true" || enabledStr == "1"
	}

	// Auto-enable if tokens are present
	if config.SlackAppToken != "" && config.SlackBotToken != "" {
		config.Enabled = true
	}

	return config
}

// IsValid checks if the configuration has required fields
func (c *Config) IsValid() bool {
	return c.SlackAppToken != "" && c.SlackBotToken != ""
}