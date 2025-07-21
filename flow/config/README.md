# Configuration Package

This package provides comprehensive configuration management for the Flow application, supporting JSON configuration files and environment variable overrides.

## Features

- **Centralized Configuration**: All application settings in one place
- **Environment Variable Support**: Override any setting via environment variables
- **Validation**: Built-in validation for required configuration fields
- **Defaults**: Sensible defaults for all configuration options
- **Type Safety**: Strongly typed configuration structs

## Configuration Sections

### SlackBot Configuration
- **Purpose**: Slack bot integration settings
- **Environment Variables**: `SLACK_APP_TOKEN`, `SLACK_BOT_TOKEN`, `SLACK_BOT_DEBUG`, etc.
- **Auto-Enable**: Bot automatically enables when tokens are provided

### Claude Configuration  
- **Purpose**: Claude CLI integration settings
- **Environment Variables**: `CLAUDE_DEBUG`, `CLAUDE_DEBUG_DIR`, `CLAUDE_TOOLS`
- **Default Tools**: Read, Write, Bash

### Worklet Configuration
- **Purpose**: Worklet system settings  
- **Environment Variables**: `WORKLET_BASE_DIR`, `WORKLET_CLEANUP_MAX_AGE`, `WORKLET_MAX_CONCURRENT`
- **Default Cleanup**: 24 hours

### Git Configuration
- **Purpose**: Git and GitHub integration
- **Environment Variables**: `GITHUB_TOKEN`, `GIT_BASE_DIR`
- **Used For**: Repository cloning, PR creation

## Usage

### Loading Configuration

```go
// Load from file with environment overrides
config := config.LoadConfig()

// Load from specific file
config := config.NewFromFile("/path/to/config.json")

// Use default configuration
config := config.New()
```

### Accessing Configuration

```go
// Check if SlackBot is enabled and valid
if config.IsSlackBotEnabled() {
    slackConfig := config.GetSlackBotConfig()
    // Use slack configuration
}

// Get other configuration sections
claudeConfig := config.GetClaudeConfig()
workletConfig := config.GetWorkletConfig()  
gitConfig := config.GetGitConfig()
```

### Environment Variable Examples

```bash
# SlackBot configuration
export SLACK_APP_TOKEN="xapp-1-..."
export SLACK_BOT_TOKEN="xoxb-..."
export SLACK_BOT_DEBUG="true"
export SLACK_BOT_SESSION_TIMEOUT="45m"
export SLACK_BOT_MAX_SESSIONS="15"

# Claude configuration  
export CLAUDE_DEBUG="true"
export CLAUDE_DEBUG_DIR="/var/log/claude"
export CLAUDE_TOOLS="Read,Write,Bash,Edit"

# Worklet configuration
export WORKLET_BASE_DIR="/data/worklets"
export WORKLET_CLEANUP_MAX_AGE="48h"
export WORKLET_MAX_CONCURRENT="10"

# Git configuration
export GITHUB_TOKEN="ghp_..."
export GIT_BASE_DIR="/data/repos"
```

## Configuration File Format

See `data/config.example.json` for a complete example configuration file.

### JSON Structure

```json
{
  "slack_bot": {
    "enabled": true,
    "slack_app_token": "xapp-1-...",
    "slack_bot_token": "xoxb-...",
    "session_timeout": "30m",
    "max_sessions": 10,
    "working_directory": "/tmp/slackbot",
    "debug": false
  },
  "claude": {
    "debug": false,
    "debug_dir": "/tmp/claude",
    "tools": ["Read", "Write", "Bash"]
  },
  "worklet": {
    "base_dir": "/tmp/worklet-repos",
    "cleanup_max_age": "24h",
    "max_concurrent": 5
  },
  "git": {
    "github_token": "ghp_...",
    "base_dir": "/tmp/git-repos"
  }
}
```

## Validation

### SlackBot Validation
```go
slackConfig := config.GetSlackBotConfig()
if slackConfig.IsValid() {
    // Both app token and bot token are present
}
```

### Built-in Checks
- SlackBot automatically enables when both tokens are provided
- All duration strings are parsed (e.g., "30m", "24h")
- Numeric values are validated from environment variables

## Migration from Old Config

The new configuration system is backward compatible with the existing `AppConfig` structure. New configuration sections are added alongside existing fields, so existing code continues to work.

## Testing

Run the configuration tests:
```bash
go test ./config/...
```

The tests verify:
- Default value initialization
- Environment variable parsing
- Configuration validation
- Helper method functionality