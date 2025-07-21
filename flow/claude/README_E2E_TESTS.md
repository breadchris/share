# End-to-End (E2E) Tests for ClaudeService

This directory contains comprehensive end-to-end tests that validate the complete ClaudeService workflow from HTTP requests through WebSocket communication to Claude CLI process management.

## Test Architecture

The E2E tests simulate the complete user experience:

1. **HTTP Server**: Test HTTP server with authentication and ClaudeService integration
2. **WebSocket Client**: Test WebSocket client that connects and sends messages
3. **Database Operations**: Real database interactions with session persistence
4. **Claude CLI Integration**: Actual Claude CLI process spawning and communication

## Test Categories

### Session Lifecycle Tests
- `TestE2ENewSessionFlow`: Complete new session creation workflow
- `TestE2ESessionResumption`: Session resumption with message replay
- `TestE2EConversationFlow`: Full conversation with prompt/response cycle

### Multi-User and Security Tests  
- `TestE2EMultiUserIsolation`: Concurrent users with session isolation
- `TestE2EErrorHandling`: Error scenarios and graceful recovery

### API Integration Tests
- `TestE2EHTTPEndpoints`: HTTP API endpoints for session management

## Prerequisites

### Claude CLI Installation
The E2E tests require the actual Claude CLI to be installed and available in the system PATH:

```bash
# Install Claude CLI (adjust method based on your platform)
npm install -g @anthropic-ai/claude
# or
pip install claude-cli
# or download from official releases
```

### Claude CLI Configuration
Ensure Claude CLI is properly configured with API credentials:

```bash
claude configure
# Follow prompts to set API key
```

### Test Dependencies
```bash
go mod download
```

## Running E2E Tests

### Run All E2E Tests
```bash
go test -tags=e2e -v ./claude/...
```

### Run Specific Test
```bash
go test -tags=e2e -v -run TestE2ENewSessionFlow ./claude/...
```

### Run with Timeout (for long-running tests)
```bash
go test -tags=e2e -v -timeout=30s ./claude/...
```

## Test Behavior

### When Claude CLI is Available
- Tests will run the complete workflow with real Claude CLI processes
- WebSocket communication will include actual Claude responses
- Database will contain real session data with Claude messages

### When Claude CLI is Not Available
- Tests will gracefully skip with message: "Claude CLI not available, skipping e2e test"
- No false test failures due to missing CLI
- Tests validate infrastructure and error handling

## Test Infrastructure

### E2ETestServer
Complete HTTP test server that provides:
- WebSocket endpoint: `/claude/ws?user_id={userID}`
- Sessions endpoint: `/claude/sessions?user_id={userID}`
- Specific session endpoint: `/claude/sessions/{sessionID}?user_id={userID}`

### WebSocketTestClient
Feature-rich WebSocket client with:
- Message sending/receiving with timeouts
- Message type validation and assertions
- Concurrent connection support
- Error collection and debugging

### Test Utilities
- `AssertMessageType()`: Validate WebSocket message types
- `AssertClaudeMessage()`: Parse and validate Claude messages
- `AssertErrorMessage()`: Validate error responses
- `GetSessions()`, `GetSession()`: HTTP API helpers

## Test Scenarios Covered

### 1. New Session Creation
```
WebSocket connect → send "start" → Claude CLI spawn → 
init message → DB save → stream ready
```

### 2. Session Resumption
```
WebSocket connect → send "resume" → DB load → 
Claude CLI spawn with --resume → message replay → stream ready
```

### 3. Conversation Flow
```
Session active → send "prompt" → Claude response → 
message storage → WebSocket streaming → final DB save
```

### 4. Multi-User Isolation
```
Two users → concurrent sessions → isolated processes → 
cross-user security → resource cleanup
```

### 5. Error Recovery
```
Session active → error condition → error handling → 
graceful cleanup → recovery capability
```

## Debugging Failed Tests

### Enable Verbose Logging
```bash
go test -tags=e2e -v -run TestE2ENewSessionFlow 2>&1 | tee test.log
```

### Check Claude CLI Manually
```bash
# Test Claude CLI directly
claude --help

# Test with same arguments as ClaudeService
claude --print --input-format stream-json --output-format stream-json --verbose
```

### Common Issues

1. **"No response received from Claude service"**
   - Claude CLI not installed or not in PATH
   - Claude CLI not configured with API key
   - Network connectivity issues

2. **"repeated read on failed websocket connection"**
   - Claude CLI process crashed or hung
   - Invalid Claude CLI arguments
   - Insufficient system resources

3. **Database errors**
   - Test database migration issues
   - Concurrent test conflicts (rare with in-memory DB)

## Performance Expectations

- **Session Creation**: < 2 seconds with Claude CLI
- **Message Processing**: < 1 second per message
- **Database Operations**: < 100ms for typical operations
- **WebSocket Communication**: < 50ms round-trip

## Integration with CI/CD

### Running in CI Without Claude CLI
```bash
# Tests will automatically skip if Claude CLI unavailable
go test -tags=e2e -v ./claude/... || echo "E2E tests skipped - Claude CLI not available"
```

### Running in CI With Claude CLI
```bash
# Set up Claude CLI in CI environment
export CLAUDE_API_KEY="${{secrets.CLAUDE_API_KEY}}"
claude configure --api-key $CLAUDE_API_KEY
go test -tags=e2e -v ./claude/...
```

## Extending E2E Tests

### Adding New Test Cases
1. Follow the existing test pattern in `claude_e2e_test.go`
2. Use the test infrastructure (`E2ETestServer`, `WebSocketTestClient`)
3. Include both success and error scenarios
4. Add appropriate Claude CLI availability checks

### Mock vs Real Testing
- E2E tests use real Claude CLI for full integration testing
- Unit tests use mocks for isolated component testing
- Both approaches are valuable and complementary

## Security Considerations

- E2E tests use test users and isolated databases
- No production data or credentials should be used
- Claude CLI API usage is minimal and controlled
- Test cleanup ensures no orphaned processes or data

## Troubleshooting

### Memory Issues
- E2E tests spawn real processes - monitor system resources
- Use timeouts to prevent hanging tests
- Ensure proper cleanup in test teardown

### Concurrency Issues
- Each test uses isolated database instances
- WebSocket connections are properly managed
- Session IDs are unique across test runs

### Claude CLI Issues
- Check Claude CLI version compatibility
- Verify API key permissions and limits
- Monitor Claude API rate limiting in tests