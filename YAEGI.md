# Yaegi Integration Documentation

## Overview

Yaegi is a Go interpreter that enables dynamic code execution and hot reloading in Go applications. This document explains how yaegi is integrated into this codebase to provide dynamic HTTP handler interpretation and hot-reload capabilities.

## What is Yaegi?

Yaegi (Yet Another Elegant Go Interpreter) is a Go interpreter written in Go that allows:
- **Dynamic Code Execution**: Run Go code at runtime without compilation
- **Hot Reloading**: Update application logic without restarting the server
- **REPL Capabilities**: Interactive Go code execution
- **Reflection Support**: Full Go reflection capabilities in interpreted code

## Architecture Overview

### Core Components

1. **Symbol System** (`symbol/symbol.go`)
2. **Dynamic HTTP Multiplexer** (`code/code.go`)
3. **Interpretation Wrapper** (`main.go`)
4. **Debug Support** (`graveyard/yaegi/yaegi.go`)

## Symbol System

### How Symbols Work

The symbol system provides yaegi with access to compiled Go packages and functions. Symbols are generated using the `yaegi extract` command and stored in `symbol/symbol.go`.

### Symbol Generation

Located in `symbol/symbol.go`, symbols are generated via `go generate`:

```go
//go:generate go install github.com/breadchris/yaegi/cmd/yaegi
//go:generate yaegi extract github.com/breadchris/share/html
//go:generate yaegi extract github.com/breadchris/share/deps
//go:generate yaegi extract net/http
```

### Adding New Packages

To add new packages for yaegi interpretation:

1. Add a `//go:generate yaegi extract package/path` line to `symbol/symbol.go`
2. Run `go generate .` to regenerate symbols
3. The extracted symbols are automatically added to the `Symbols` map

### Example Symbol Extraction

```bash
# Extract symbols for a package
yaegi extract github.com/breadchris/share/newpackage

# Regenerate all symbols
go generate ./symbol
```

## Dynamic HTTP Multiplexer

### Core Function: `DynamicHTTPMux`

Located in `code/code.go`, this function wraps HTTP handlers for yaegi interpretation:

```go
func DynamicHTTPMux(f func(d Deps) *http.ServeMux, files ...string) func(Deps) *http.ServeMux
```

### How It Works

1. **Function Analysis**: Uses runtime reflection to extract function metadata
2. **Interpreter Creation**: Creates a new yaegi interpreter instance
3. **Symbol Loading**: Loads standard library and custom symbols
4. **Code Evaluation**: Evaluates the source files containing the handler
5. **Function Extraction**: Extracts the interpreted function
6. **Fallback Handling**: Returns original function if interpretation fails

### Example Usage

```go
// Original handler function
func MyHandler(deps Deps) *http.ServeMux {
    mux := http.NewServeMux()
    mux.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello from interpreted handler!"))
    })
    return mux
}

// Wrapped with yaegi interpretation
interpreted(MyHandler, "myhandler.go")
```

## Interpretation System in main.go

### The `interpreted` Function

```go
interpreted := func(f func(d deps2.Deps) *http.ServeMux, files ...string) *http.ServeMux {
    m := http.NewServeMux()
    m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        if shouldInterpret {
            code.DynamicHTTPMux(f, files...)(deps).ServeHTTP(w, r)
        } else {
            f(deps).ServeHTTP(w, r)
        }
    })
    return m
}
```

### Features

- **Runtime Switching**: Toggle between interpreted and compiled modes
- **Development Mode**: Enable interpretation with `shouldInterpret = true`
- **Production Safety**: Fallback to compiled handlers when interpretation fails
- **Hot Reloading**: Update handlers without server restart

### Route Registration

Routes are registered using the interpretation wrapper:

```go
p("/myroute", interpreted(MyHandler, "myhandler.go"))
```

## Debug Support

### Debug Interface

Located in `graveyard/yaegi/yaegi.go`:

```go
type Debug struct {
    Interp *interp.Interpreter
}

func (d Debug) DoGetStack() ([]StackFrame, error) {
    // Returns filtered stack trace from interpreter
}
```

### Stack Trace Analysis

- **Runtime Inspection**: Examine interpreter call stack
- **Error Debugging**: Detailed error information with line numbers
- **Performance Monitoring**: Track interpretation overhead

## Development Workflow

### 1. Development Mode

Enable interpretation for hot reloading:

```go
shouldInterpret := true
```

### 2. Code Changes

1. Modify handler source files
2. Changes are automatically picked up on next request
3. No server restart required

### 3. Testing

Test both interpreted and compiled modes:

```bash
# Toggle interpretation mode via debug endpoint
curl -X POST http://localhost:8080/debug -d "debug=on"
curl -X POST http://localhost:8080/debug -d "debug=off"
```

### 4. Production Deployment

Set interpretation mode to false for production:

```go
shouldInterpret := false
```

## Performance Considerations

### Interpretation Overhead

- **Startup Cost**: Initial interpretation takes longer than compiled execution
- **Runtime Performance**: Interpreted code runs slower than compiled code
- **Memory Usage**: Interpreters consume additional memory

### When to Use Interpretation

✅ **Good for:**
- Development and testing
- Rapid prototyping
- Dynamic configuration
- Hot fixes in development

❌ **Avoid for:**
- High-performance production code
- CPU-intensive operations
- High-frequency handlers
- Memory-constrained environments

## Best Practices

### 1. Code Structure

Write yaegi-compatible code:

```go
// Good: Simple, self-contained handlers
func SimpleHandler(deps Deps) *http.ServeMux {
    mux := http.NewServeMux()
    mux.HandleFunc("/simple", handleSimple)
    return mux
}

// Avoid: Complex dependencies, closures, or goroutines
func ComplexHandler(deps Deps) *http.ServeMux {
    // This may not interpret well
    go backgroundTask()
    return complexLogic()
}
```

### 2. Error Handling

Always provide fallback behavior:

```go
func safeInterpretedHandler(w http.ResponseWriter, r *http.Request) {
    defer func() {
        if r := recover(); r != nil {
            // Fallback to safe default
            http.Error(w, "Internal error", 500)
        }
    }()
    
    // Interpreted handler logic
}
```

### 3. Testing

Test both interpretation modes:

```go
func TestHandler(t *testing.T) {
    // Test compiled version
    shouldInterpret = false
    testHandler(t)
    
    // Test interpreted version
    shouldInterpret = true
    testHandler(t)
}
```

### 4. Debugging

Use the debug interface for troubleshooting:

```go
// Get interpreter stack trace
debug := yaegi.Debug{Interp: interpreter}
stack, err := debug.DoGetStack()
if err != nil {
    log.Printf("Stack trace: %+v", stack)
}
```

## Common Issues and Solutions

### 1. Missing Symbols

**Problem**: `undefined symbol` errors during interpretation

**Solution**: Add missing packages to `symbol/symbol.go`:

```go
//go:generate yaegi extract missing/package
```

### 2. Import Conflicts

**Problem**: Package name conflicts between interpreted and compiled code

**Solution**: Use explicit package imports and avoid dot imports in interpreted code

### 3. Performance Issues

**Problem**: Slow response times in interpreted mode

**Solution**: 
- Profile interpreted vs compiled performance
- Consider disabling interpretation for critical paths
- Optimize hot code paths

### 4. Goroutine Issues

**Problem**: Goroutines not working correctly in interpreted code

**Solution**: Avoid goroutines in interpreted handlers or use careful synchronization

## Integration Examples

### Basic HTTP Handler

```go
func ExampleHandler(deps Deps) *http.ServeMux {
    mux := http.NewServeMux()
    
    mux.HandleFunc("/api/example", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Hello from interpreted handler",
            "mode":    "yaegi",
        })
    })
    
    return mux
}

// Register with interpretation
p("/example", interpreted(ExampleHandler, "example_handler.go"))
```

### Database Integration

```go
func DatabaseHandler(deps Deps) *http.ServeMux {
    mux := http.NewServeMux()
    
    mux.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
        // Access database through deps
        var count int64
        deps.DB.Model(&models.User{}).Count(&count)
        
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]int64{
            "user_count": count,
        })
    })
    
    return mux
}
```

### Session Management

```go
func SessionHandler(deps Deps) *http.ServeMux {
    mux := http.NewServeMux()
    
    mux.HandleFunc("/api/session", func(w http.ResponseWriter, r *http.Request) {
        userID, err := deps.Session.GetUserID(r.Context())
        if err != nil {
            http.Error(w, "Unauthorized", 401)
            return
        }
        
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{
            "user_id": userID,
            "status":  "authenticated",
        })
    })
    
    return mux
}
```

## Troubleshooting

### Debug Mode

Enable detailed logging:

```go
// Enable yaegi debug logging
os.Setenv("YAEGI_DEBUG", "1")
```

### Stack Traces

Get detailed stack information:

```go
if shouldInterpret {
    // Access interpreter debug info
    debug := yaegi.Debug{Interp: interpreter}
    stack, _ := debug.DoGetStack()
    log.Printf("Interpreter stack: %+v", stack)
}
```

### Performance Profiling

Profile interpreted vs compiled performance:

```go
import _ "net/http/pprof"

// Access profiling at http://localhost:8080/debug/pprof/
```

## Conclusion

Yaegi provides powerful dynamic interpretation capabilities that enable hot reloading and rapid development. Use it wisely in development environments while being mindful of performance implications in production systems.

For questions or issues with yaegi integration, refer to:
- [Yaegi Documentation](https://github.com/traefik/yaegi)
- [Go Reflection Documentation](https://golang.org/pkg/reflect/)
- This project's `code/code.go` implementation