package config

// Helper methods for configuration validation and access

// IsSlackBotEnabled returns true if the Slack bot is enabled and has valid configuration
func (c *AppConfig) IsSlackBotEnabled() bool {
	return c.SlackBot.Enabled
}

// GetSlackBotConfig returns the Slack bot configuration
func (c *AppConfig) GetSlackBotConfig() *SlackBotConfig {
	return &c.SlackBot
}

// GetClaudeConfig returns the Claude configuration
func (c *AppConfig) GetClaudeConfig() *ClaudeConfig {
	return &c.Claude
}

// GetWorkletConfig returns the Worklet configuration
func (c *AppConfig) GetWorkletConfig() *WorkletConfig {
	return &c.Worklet
}

// GetGitConfig returns the Git configuration
func (c *AppConfig) GetGitConfig() *GitConfig {
	return &c.Git
}

// SlackBotConfig helper methods
