package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// setConfigDefaults sets default values for all configuration sections
func setConfigDefaults(config *AppConfig) {
	// SlackBot defaults
	config.SlackBot = SlackBotConfig{
		Enabled:             false,
		SessionTimeout:      30 * time.Minute,
		MaxSessions:         10,
		WorkingDirectory:    "/tmp/slackbot",
		Debug:               true,
		IdeationEnabled:     true,
		IdeationTimeout:     2 * time.Hour,
		MaxIdeationSessions: 20,
		AutoExpandThreshold: 2,
	}

	// Claude defaults
	config.Claude = ClaudeConfig{
		Debug:    true,
		DebugDir: "/tmp/claude",
		Tools:    []string{"Read", "Write", "Bash"},
	}

	// Worklet defaults
	config.Worklet = WorkletConfig{
		BaseDir:       "/tmp/worklet-repos",
		CleanupMaxAge: 24 * time.Hour,
		MaxConcurrent: 5,
	}

	// Git defaults
	config.Git = GitConfig{
		BaseDir: "/tmp/git-repos",
	}
}

// applyEnvOverrides applies environment variable overrides to the configuration
func applyEnvOverrides(config *AppConfig) {
	// OpenAI environment variables
	if openaiKey := os.Getenv("OPENAI_API_KEY"); openaiKey != "" {
		config.OpenAIKey = openaiKey
	}

	// SlackBot environment variables
	if enabled := os.Getenv("SLACKBOT_ENABLED"); enabled != "" {
		config.SlackBot.Enabled = enabled == "true" || enabled == "1"
	}
	if botToken := os.Getenv("SLACK_BOT_TOKEN"); botToken != "" {
		config.SlackBot.BotToken = botToken
	}
	if slackToken := os.Getenv("SLACK_TOKEN"); slackToken != "" {
		config.SlackBot.SlackToken = slackToken
	}
	if signingSecret := os.Getenv("SLACK_SIGNING_SECRET"); signingSecret != "" {
		config.SlackBot.SlackSigningSecret = signingSecret
	}
	if debug := os.Getenv("SLACKBOT_DEBUG"); debug != "" {
		config.SlackBot.Debug = debug == "true" || debug == "1"
	}
	if ideationEnabled := os.Getenv("SLACKBOT_IDEATION_ENABLED"); ideationEnabled != "" {
		config.SlackBot.IdeationEnabled = ideationEnabled == "true" || ideationEnabled == "1"
	}
	if sessionTimeoutStr := os.Getenv("SLACKBOT_SESSION_TIMEOUT"); sessionTimeoutStr != "" {
		if sessionTimeout, err := time.ParseDuration(sessionTimeoutStr); err == nil {
			config.SlackBot.SessionTimeout = sessionTimeout
		}
	}
	if ideationTimeoutStr := os.Getenv("SLACKBOT_IDEATION_TIMEOUT"); ideationTimeoutStr != "" {
		if ideationTimeout, err := time.ParseDuration(ideationTimeoutStr); err == nil {
			config.SlackBot.IdeationTimeout = ideationTimeout
		}
	}
	if maxSessionsStr := os.Getenv("SLACKBOT_MAX_SESSIONS"); maxSessionsStr != "" {
		if maxSessions, err := strconv.Atoi(maxSessionsStr); err == nil {
			config.SlackBot.MaxSessions = maxSessions
		}
	}
	if maxIdeationSessionsStr := os.Getenv("SLACKBOT_MAX_IDEATION_SESSIONS"); maxIdeationSessionsStr != "" {
		if maxIdeationSessions, err := strconv.Atoi(maxIdeationSessionsStr); err == nil {
			config.SlackBot.MaxIdeationSessions = maxIdeationSessions
		}
	}
	if autoExpandThresholdStr := os.Getenv("SLACKBOT_AUTO_EXPAND_THRESHOLD"); autoExpandThresholdStr != "" {
		if autoExpandThreshold, err := strconv.Atoi(autoExpandThresholdStr); err == nil {
			config.SlackBot.AutoExpandThreshold = autoExpandThreshold
		}
	}
	if workingDir := os.Getenv("SLACKBOT_WORKING_DIRECTORY"); workingDir != "" {
		config.SlackBot.WorkingDirectory = workingDir
	}

	// Claude environment variables
	if debugStr := os.Getenv("CLAUDE_DEBUG"); debugStr != "" {
		config.Claude.Debug = debugStr == "true" || debugStr == "1"
	}
	if debugDir := os.Getenv("CLAUDE_DEBUG_DIR"); debugDir != "" {
		config.Claude.DebugDir = debugDir
	}
	if tools := os.Getenv("CLAUDE_TOOLS"); tools != "" {
		// Split comma-separated tools
		config.Claude.Tools = parseCommaSeparated(tools)
	}

	// Worklet environment variables
	if baseDir := os.Getenv("WORKLET_BASE_DIR"); baseDir != "" {
		config.Worklet.BaseDir = baseDir
	}
	if maxAgeStr := os.Getenv("WORKLET_CLEANUP_MAX_AGE"); maxAgeStr != "" {
		if maxAge, err := time.ParseDuration(maxAgeStr); err == nil {
			config.Worklet.CleanupMaxAge = maxAge
		}
	}
	if maxConcurrentStr := os.Getenv("WORKLET_MAX_CONCURRENT"); maxConcurrentStr != "" {
		if maxConcurrent, err := strconv.Atoi(maxConcurrentStr); err == nil {
			config.Worklet.MaxConcurrent = maxConcurrent
		}
	}

	// Git environment variables
	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		config.Git.Token = token
	}
	if baseDir := os.Getenv("GIT_BASE_DIR"); baseDir != "" {
		config.Git.BaseDir = baseDir
	}
}

// parseCommaSeparated splits a comma-separated string into a slice of strings
func parseCommaSeparated(s string) []string {
	if s == "" {
		return nil
	}

	var result []string
	for _, item := range strings.Split(s, ",") {
		if trimmed := strings.TrimSpace(item); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
