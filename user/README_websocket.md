# WebSocket Code Generation

This document explains how to use the configurable WebSocket code generation feature.

## Overview

The API generator now supports optional WebSocket code generation alongside the default HTTP client generation. This allows you to choose between:

1. **HTTP-only** (default) - Traditional REST API with HTTP client
2. **HTTP + WebSocket** - Dual transport with both HTTP and WebSocket clients

## Usage

### HTTP-only Generation (Default)

```bash
go run cmd/tygo-api/main.go --input ./user --output ./user
```

**Generated files:**
- `api.ts` - TypeScript types and HTTP client functions
- `handlers.go` - Go HTTP handler registration functions

### HTTP + WebSocket Generation

```bash
go run cmd/tygo-api/main.go --input ./user --output ./user --enable-websocket
```

**Generated files:**
- `api.ts` - TypeScript types, HTTP client functions, and WebSocket client
- `handlers.go` - Go HTTP handler registration + WebSocket registration functions
- `websocket.go` - Complete WebSocket server implementation (auto-generated)

## Features

### Auto-Generated websocket.go

When `--enable-websocket` is used, the system automatically generates a complete `websocket.go` file containing:

- **WebSocket message types** (`WSMessage`, `WSResponse`, `WSEvent`)
- **Connection management** (`Connection`, `Hub` structs)
- **Message routing** - Automatically routes to your API functions
- **Event broadcasting** - Real-time notifications for updates/deletions
- **Error handling** - Comprehensive error handling and logging

### TypeScript WebSocket Client

The generated TypeScript client includes:

- **WebSocket client class** with auto-reconnection
- **Promise-based API** - Same signatures as HTTP functions
- **Event subscription** - Listen for server-to-client events
- **Connection monitoring** - Real-time connection status
- **Transport abstraction** - Switch between HTTP and WebSocket

## Example Usage

### Go Server Setup

```go
package main

import (
    "net/http"
    "github.com/breadchris/share/user"
)

func main() {
    mux := http.NewServeMux()
    
    // Register HTTP handlers
    user.RegisterHandlers(mux)
    
    // Register WebSocket handler (if generated)
    user.RegisterWebSocketHandler(mux)
    
    http.ListenAndServe(":8080", mux)
}
```

### TypeScript Client Usage

```typescript
import { CreateTodo, wsClient } from './user/api';

// HTTP transport
const httpResponse = await CreateTodo({ title: "Learn WebSockets" });

// WebSocket transport
const wsResponse = await wsClient.createTodo({ title: "Learn WebSockets" });

// Event subscription
wsClient.on('todo_updated', (todo) => {
    console.log('Todo updated:', todo);
});
```

## Configuration

### CLI Flags

- `--input` - Input Go package path (required)
- `--output` - Output directory for generated files (required)
- `--base-url` - Base URL for API endpoints (optional)
- `--enable-websocket` - Generate WebSocket client and server code (optional)

### Config Struct

```go
type Config struct {
    InputPath       string // Go package path to analyze
    OutputPath      string // Directory to write generated TypeScript
    BaseURL         string // Base URL for API endpoints
    EnableWebSocket bool   // Whether to generate WebSocket code
}
```

## Benefits

- **Optional feature** - WebSocket generation is opt-in
- **Backward compatible** - Existing HTTP-only usage continues to work
- **Fully automated** - No manual file creation required
- **Type-safe** - Full TypeScript type safety for all transports
- **Real-time capable** - Automatic event broadcasting for collaborative features

## Migration

### From HTTP-only to WebSocket

1. Add `--enable-websocket` flag to your generation command
2. Update your server to register WebSocket handlers
3. Use the generated WebSocket client in your TypeScript code
4. Subscribe to real-time events as needed

### Backward Compatibility

Existing HTTP-only generation continues to work unchanged. The new flag is optional and defaults to `false`.