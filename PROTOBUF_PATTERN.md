# Protobuf + ConnectRPC Design Pattern

This document describes the buf protobuf + connectrpc design pattern used in this codebase, providing a complete example of type-safe, end-to-end API development.

## Overview

The pattern enables:
- **End-to-end type safety** from protobuf definitions to Go and TypeScript
- **Automatic code generation** for both server and client
- **HTTP/JSON transport** (not binary protobuf) for better debugging
- **Modern developer experience** with ConnectRPC vs traditional gRPC-Web

## Architecture

```
proto/example/example.proto
    ↓ (buf generate)
    ├── Go (pkg/gen/proto/example/)
    │   ├── example.pb.go
    │   ├── example_grpc.pb.go
    │   └── exampleconnect/example.connect.go
    └── TypeScript (data/coderunner/src/gen/proto/example/)
        ├── example_pb.ts
        └── example_connect.ts
```

## Project Structure

```
project/
├── buf.gen.yaml                     # Buf code generation configuration
├── buf.yaml                         # Buf module configuration  
├── proto/example/example.proto      # Service definitions
├── example/                         # Go service implementation
│   ├── service.go                   # Business logic
│   └── handler.go                   # HTTP handler setup
├── data/coderunner/src/
│   ├── gen/proto/example/           # Generated TypeScript
│   └── example/ExampleClient.tsx    # React client component
└── main.go                          # Route registration
```

## Implementation Guide

### 1. Protocol Buffer Definition

Create `proto/example/example.proto`:

```protobuf
syntax = "proto3";
package example;

import "google/protobuf/empty.proto";
import "google/protobuf/timestamp.proto";

service ExampleService {
  rpc CreateItem(CreateItemRequest) returns (CreateItemResponse);
  rpc GetItem(GetItemRequest) returns (GetItemResponse);
  rpc UpdateItem(UpdateItemRequest) returns (UpdateItemResponse);
  rpc DeleteItem(DeleteItemRequest) returns (google.protobuf.Empty);
  rpc ListItems(ListItemsRequest) returns (ListItemsResponse);
}

message CreateItemRequest {
  string name = 1;
  string description = 2;
  map<string, string> metadata = 3;
}

// ... other messages
```

### 2. Buf Configuration

Configure `buf.gen.yaml` for code generation:

```yaml
version: v1
managed:
  enabled: true
  go_package_prefix:
    default: github.com/breadchris/share/pkg/gen
plugins:
  - plugin: buf.build/protocolbuffers/go
    out: ./gen
    opt:
      - paths=source_relative
  - plugin: buf.build/bufbuild/connect-go
    out: ./gen
    opt:
      - paths=source_relative
  - plugin: es
    opt: target=ts
    out: ./data/coderunner/src/gen
  - plugin: connect-es
    opt: target=ts
    out: ./data/coderunner/src/gen
```

### 3. Code Generation

Generate Go and TypeScript code:

```bash
buf generate
```

This creates:
- Go: `gen/proto/example/exampleconnect/example.connect.go`
- TypeScript: `data/coderunner/src/gen/proto/example/example_connect.ts`

### 4. Go Service Implementation

Implement `example/service.go`:

```go
package example

import (
    "context"
    "github.com/breadchris/share/gen/proto/example"
    "github.com/breadchris/share/gen/proto/example/exampleconnect"
    "github.com/bufbuild/connect-go"
)

type Service struct {
    // Your dependencies here
}

var _ exampleconnect.ExampleServiceHandler = (*Service)(nil)

func (s *Service) CreateItem(
    ctx context.Context,
    req *connect.Request[example.CreateItemRequest],
) (*connect.Response[example.CreateItemResponse], error) {
    // Implementation here
    return connect.NewResponse(&example.CreateItemResponse{
        Item: item,
    }), nil
}
```

### 5. HTTP Handler Registration

Create `example/handler.go`:

```go
func New(d deps.Deps) *http.ServeMux {
    mux := http.NewServeMux()
    service := NewService()
    
    interceptors := connect.WithInterceptors(
        // Add logging, auth, etc.
    )
    
    path, handler := exampleconnect.NewExampleServiceHandler(service, interceptors)
    mux.Handle(path, handler)
    return mux
}
```

### 6. Route Mounting

Add to `main.go`:

```go
import "github.com/breadchris/share/example"

// In server setup:
p("/example", interpreted(example.New))
```

### 7. TypeScript Client

Create React component `data/coderunner/src/example/ExampleClient.tsx`:

```typescript
import { createConnectTransport } from '@connectrpc/connect-web';
import { createPromiseClient } from '@connectrpc/connect';
import { ExampleService } from '../gen/proto/example/example_connect';

const transport = createConnectTransport({
  baseUrl: '/example',
});

const client = createPromiseClient(ExampleService, transport);

// Use in React component:
const response = await client.createItem(request);
```

## Key Benefits

### Type Safety
- **Single source of truth**: Protobuf definitions drive all types
- **Compile-time validation**: TypeScript and Go catch type mismatches
- **Refactoring safety**: Changes propagate through entire stack

### Developer Experience
- **HTTP/JSON**: Easy debugging with browser dev tools
- **Modern protocols**: ConnectRPC supports HTTP/2, streaming, etc.
- **Automatic serialization**: No manual JSON marshaling
- **Generated documentation**: Types serve as API documentation

### Code Generation
- **Zero boilerplate**: Client and server code generated automatically
- **Consistent patterns**: All services follow same structure
- **Version compatibility**: buf manages breaking changes

## HTTP Transport Details

ConnectRPC uses HTTP/JSON by default:
- **POST** requests to `/package.ServiceName/MethodName`
- **JSON payloads** (not binary protobuf)
- **Standard HTTP status codes**
- **Works with existing HTTP tooling**

Example request:
```bash
curl -X POST http://localhost:8080/example/ExampleService/CreateItem \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "description": "example item"}'
```

## Testing

### Go Testing
```go
func TestExampleService(t *testing.T) {
    service := NewService()
    req := connect.NewRequest(&example.CreateItemRequest{
        Name: "test",
    })
    
    resp, err := service.CreateItem(context.Background(), req)
    require.NoError(t, err)
    assert.Equal(t, "test", resp.Msg.Item.Name)
}
```

### TypeScript Testing
```typescript
import { createConnectTransport } from '@connectrpc/connect-web';
import { createPromiseClient } from '@connectrpc/connect';

const mockTransport = createConnectTransport({
  baseUrl: 'http://localhost:8080/example',
});

const client = createPromiseClient(ExampleService, mockTransport);
```

## Error Handling

### Go Errors
```go
if req.Msg.Name == "" {
    return nil, connect.NewError(
        connect.CodeInvalidArgument, 
        errors.New("name is required")
    )
}
```

### TypeScript Errors
```typescript
try {
  const response = await client.createItem(request);
} catch (err) {
  if (err instanceof ConnectError) {
    console.log(err.code, err.message);
  }
}
```

## Advanced Features

### Interceptors
Add middleware for logging, authentication, etc.:

```go
interceptors := connect.WithInterceptors(
    authInterceptor(),
    loggingInterceptor(),
)
```

### Streaming
Support real-time communication:

```protobuf
service StreamService {
  rpc StreamData(stream DataRequest) returns (stream DataResponse);
}
```

### Validation
Use buf validate for input validation:

```protobuf
message CreateItemRequest {
  string name = 1 [(validate.rules).string.min_len = 1];
}
```

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure buf generate ran successfully
2. **Type mismatches**: Regenerate code after proto changes  
3. **Route conflicts**: Check path mounting in main.go
4. **CORS issues**: Configure transport for cross-origin requests

### Debugging

1. **Check generated files**: Verify code generation output
2. **HTTP requests**: Use browser dev tools or curl
3. **Server logs**: Add logging interceptors
4. **Type checking**: Run TypeScript compiler

## Performance Considerations

- **HTTP/2**: ConnectRPC supports multiplexing
- **Compression**: Automatic gzip compression
- **Connection pooling**: Client handles connection reuse
- **Binary mode**: Optional protobuf binary encoding

## Security

- **Authentication**: Add auth interceptors
- **Authorization**: Check permissions in handlers
- **Input validation**: Use buf validate or custom validation
- **HTTPS**: Always use TLS in production

## Migration Path

To adopt this pattern in existing code:

1. **Define protobuf services** for existing APIs
2. **Generate code** and compare with manual implementations
3. **Gradually migrate** one service at a time
4. **Update clients** to use generated TypeScript
5. **Remove manual serialization** code

## References

- [Buf Documentation](https://docs.buf.build/)
- [ConnectRPC](https://connectrpc.com/)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)
- [Connect-ES](https://github.com/bufbuild/connect-es)

This pattern provides a foundation for scalable, type-safe API development that grows with your application.