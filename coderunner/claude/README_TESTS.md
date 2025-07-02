# ClaudeService Tests

This directory contains comprehensive tests for the ClaudeService that manages interactions with the Claude CLI.

## Test Files

### `claude_unit_test.go`
Contains unit tests that can run without the Claude CLI installed:
- Session management (Stop, Get, GetSessions)
- Database operations (Save, Load)
- Message parsing
- WebSocket message types
- Error handling
- Concurrent access
- Benchmarks

### `claude_integration_test.go`
Contains integration tests that require Claude CLI (run with `-tags=integration`):
- CreateSession with actual CLI
- ResumeSession with actual CLI

### `claude_e2e_test.go`
Contains end-to-end tests that simulate complete user workflows (run with `-tags=e2e`):
- Full session lifecycle from HTTP to WebSocket to Claude CLI
- Session resumption with message replay
- Multi-user isolation and security
- Conversation flows with real prompts and responses
- HTTP API endpoint testing
- Error handling and recovery scenarios

### `claude_test_helpers.go`
Shared test utilities used across all test files:
- `setupTestDB()` - Creates in-memory SQLite database
- `createTestService()` - Creates ClaudeService instance  
- `createTestUser()` - Creates test user with unique username

## Running Tests

### Unit Tests Only
```bash
go test ./claude/...
```

### With Coverage
```bash
go test ./claude/... -cover
```

### Integration Tests (requires Claude CLI)
```bash
go test -tags=integration ./claude/...
```

### End-to-End Tests (requires Claude CLI)
```bash
go test -tags=e2e ./claude/...
```

### Verbose Output
```bash
go test ./claude/... -v
```

### Individual Test Files
```bash
go test claude_unit_test.go claude_test_helpers.go claude.go
go test -tags=integration claude_integration_test.go claude_test_helpers.go claude.go  
go test -tags=e2e claude_e2e_test.go claude_test_helpers.go claude.go
```

## Test Coverage

### Unit Tests
Current coverage: **27.6%** of statements (improved from 25.9%)

The coverage is limited because:
- Many functions require actual Claude CLI process execution
- WebSocket handling requires full connection lifecycle
- Process management involves OS-level operations

### E2E Tests  
E2E tests provide comprehensive coverage of user-facing workflows:
- Complete session lifecycle validation
- Real WebSocket communication testing
- Actual database persistence verification
- Multi-user security and isolation testing

## Key Test Areas

1. **Session Management**
   - Creating, resuming, and stopping sessions
   - Session storage and retrieval
   - Multi-user session isolation
   - Session cleanup on shutdown

2. **WebSocket Communication**
   - Message parsing and validation
   - Error handling for invalid messages
   - Connection lifecycle management
   - Multiple concurrent connections
   - Invalid JSON handling

3. **Database Operations**
   - Session persistence
   - Message storage and state persistence
   - User authorization
   - Cross-session data isolation

4. **Concurrency**
   - Thread-safe session management
   - Concurrent session operations with isolated databases
   - Multiple WebSocket connections

5. **Error Scenarios**
   - Invalid session IDs
   - Unauthorized access attempts
   - Process start failures
   - Empty and malformed messages
   - WebSocket connection errors

6. **Edge Cases**
   - Empty message handling
   - Null message content
   - Concurrent database operations

## Future Improvements

1. Mock the exec.Cmd interface for better unit test coverage
2. Add more WebSocket streaming tests
3. Test timeout scenarios
4. Add performance benchmarks for large message volumes
5. Integration tests for full Claude conversation flows