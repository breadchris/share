# Slack Bot Claude Integration

## Overview
This package provides a Slack bot that integrates with Claude sessions, allowing users to interact with Claude directly from Slack using the `/flow` command. The bot creates threaded conversations where Claude streams responses in real-time, providing a natural chat interface within Slack.

## Architecture

### Core Components
- **SlackBot**: Main bot service that manages Slack connections and Claude sessions
- **Session Management**: Bridges Slack threads with Claude sessions 
- **Message Streaming**: Real-time updates to Slack messages as Claude responds
- **Event Handling**: Processes slash commands and thread replies

### Integration Points
- Uses existing `coderunner/claude` service for Claude communication
- Leverages Socket Mode for real-time Slack events
- Connects to Claude WebSocket infrastructure for streaming
- Follows existing session patterns in `~/.claude/projects/`

## Features

### Current Implementation
- `/flow <prompt>` - Creates new Claude session in a threaded conversation
- Real-time message streaming with live updates
- Thread reply handling for continued conversation
- Session management with automatic cleanup
- Error handling and graceful degradation

### Planned Enhancements
- Multiple model support (Claude 3.5 Sonnet, Haiku, etc.)
- File attachment handling for context
- Rich formatting with Slack blocks
- Session persistence across bot restarts
- Rate limiting and concurrent session management
- Integration with existing auth system

## Setup

### Prerequisites
1. Slack App with Socket Mode enabled
2. Bot token with appropriate scopes:
   - `app_mentions:read`
   - `channels:read`
   - `chat:write`
   - `commands`
   - `im:read`
   - `users:read`

### Configuration
Set environment variables:
```bash
export SLACK_APP_TOKEN=xapp-1-...     # Socket Mode token
export SLACK_BOT_TOKEN=xoxb-...       # Bot User OAuth token
```

Or configure in application config:
```json
{
  "slack_bot": {
    "enabled": true,
    "token": "xapp-1-...",
    "bot_token": "xoxb-...",
    "session_timeout": "30m",
    "max_sessions": 10,
    "channel_whitelist": ["C1234567890", "^C.*DEV$"]
  }
}
```

### Channel Whitelist

The bot supports channel-based access control using regex patterns. This allows you to restrict which Slack channels can use the bot commands.

#### Configuration

The `channel_whitelist` field accepts an array of regex patterns that match against Slack channel IDs:

```json
{
  "slack_bot": {
    "channel_whitelist": [
      "C1234567890",           // Exact channel ID match
      "^C.*DEV$",              // Channels ending with "DEV"  
      ".*test.*",              // Channels containing "test"
      "^(C123|C456|C789).*"    // Multiple channel prefixes
    ]
  }
}
```

#### Behavior

- **Empty whitelist**: All channels are allowed (default behavior)
- **Configured whitelist**: Only matching channels can use bot commands and receive responses to app mentions
- **Non-matching channels**: All interactions (slash commands, app mentions, thread replies) are silently ignored (no response sent)
- **Debug logging**: When enabled, shows which channels are allowed/rejected

#### Examples

**Development Environment Setup:**
```json
{
  "channel_whitelist": ["^C.*dev$", "^C.*test$", "C1234567890"]
}
```

**Production Environment Setup:**
```json
{
  "channel_whitelist": ["C0987654321", "^C.*prod$"]
}
```

**No Restrictions:**
```json
{
  "channel_whitelist": []
}
```

#### Security Considerations

- Channel whitelist can only be configured through the config file (not environment variables)
- All bot interactions (slash commands, app mentions, thread replies, reactions) are subject to whitelist restrictions
- Rejected interactions are silently ignored to avoid revealing bot presence
- Regex patterns are compiled at startup and validated for correctness
- Debug logs show whitelist decisions for troubleshooting

### Slack App Setup
1. Create new Slack App at https://api.slack.com/apps
2. Enable Socket Mode in "Socket Mode" settings
3. Add slash command `/flow` pointing to your app
4. Configure OAuth scopes as listed above
5. Install app to workspace

## Usage

### Starting a Claude Session
```
/flow Help me refactor this Go code to be more modular
```

This creates a new thread where Claude will:
1. Acknowledge the request
2. Stream the response in real-time
3. Update the message as new content arrives
4. Show tool usage (file reads, code analysis, etc.)

### Continuing the Conversation
Simply reply to the thread to send additional messages to Claude:
```
Actually, can you also add error handling?
```

### Session Management
- Sessions automatically timeout after 30 minutes of inactivity
- Each thread maintains its own Claude session and context
- Sessions are cleaned up when the thread becomes inactive

## Implementation Details

### Message Flow
1. User sends `/flow` command
2. Bot creates Slack thread and Claude session
3. Bot sends prompt to Claude via WebSocket
4. Claude streams response back through WebSocket
5. Bot updates Slack message in real-time
6. Thread replies continue the Claude session

### Session Mapping
```
Slack Thread TS → SlackClaudeSession {
    ThreadTS: "1234567890.123456"
    ChannelID: "C1234567890"
    UserID: "U1234567890"
    SessionID: "uuid-claude-session"
    MessageTS: "current-message-timestamp"
}
```

### Error Handling
- Network failures: Graceful retry with user feedback
- Claude timeouts: Clear error messages in thread
- Rate limiting: Queuing and backoff strategies
- Invalid commands: Helpful usage guidance

### Security Considerations
- Slack token validation
- User permission checking
- Session isolation between users
- Secure Claude session management

## Code Structure

```
slackbot/
├── CLAUDE.md              # This documentation
├── slackbot.go           # Main bot implementation
├── handlers.go           # Event and command handlers  
├── session.go            # Claude session management
├── formatting.go         # Message formatting utilities
└── config.go             # Configuration structures
```

## Development Roadmap

### Phase 1 (Complete)
- [x] Basic bot structure and Socket Mode setup
- [x] `/flow` command handling
- [x] Claude session integration
- [x] Message streaming and updates
- [x] Thread reply handling

### Phase 2 (Planned)
- [ ] Enhanced error handling and resilience
- [ ] Session persistence across restarts
- [ ] Rate limiting and concurrent session management
- [ ] Rich message formatting with Slack blocks
- [ ] File attachment support

### Phase 3 (Future)
- [ ] Multiple Claude model selection
- [ ] Integration with existing user auth
- [ ] Advanced formatting (code syntax highlighting)
- [ ] Session sharing and collaboration features
- [ ] Analytics and usage monitoring

## Known Limitations

1. **Message Length**: Slack limits messages to 4000 characters
   - Mitigation: Automatic truncation with continuation indicators
   
2. **Rate Limits**: Both Slack and Claude have API rate limits
   - Mitigation: Request queuing and backoff strategies
   
3. **Session Persistence**: In-memory sessions lost on restart
   - Planned: Database persistence in Phase 2
   
4. **Concurrent Sessions**: High load may impact performance
   - Planned: Session pooling and resource management

## Testing

### Manual Testing
1. Set up test Slack workspace
2. Install bot with development tokens
3. Test `/flow` commands with various prompts
4. Verify thread replies work correctly
5. Test error conditions and edge cases

### Automated Testing
- Unit tests for message formatting
- Integration tests for Claude session management
- End-to-end tests with mock Slack API
- Load testing for concurrent sessions

## Troubleshooting

### Common Issues

**Bot not responding to commands:**
- Check token configuration
- Verify Socket Mode is enabled
- Ensure slash command is properly configured

**Claude sessions not working:**
- Verify Claude service is running
- Check WebSocket connection
- Review Claude configuration and API keys

**Message updates not appearing:**
- Check Slack API rate limits
- Verify bot has chat:write permissions
- Review error logs for API failures

### Debug Mode
Enable debug logging by setting:
```bash
export SLACK_BOT_DEBUG=true
```

This provides detailed logs of:
- Slack event processing
- Claude session management
- Message update operations
- Error conditions and retries