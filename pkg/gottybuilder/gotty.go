package gottybuilder

import (
	"net/http"
	"os"

	"github.com/breadchris/share/gotty/backend/localcommand"
	"github.com/breadchris/share/gotty/server"
	"github.com/breadchris/share/gotty/utils"
)

// GottyHandlerBuilder provides a builder pattern for creating gotty HTTP handlers
type GottyHandlerBuilder struct {
	command         string
	args            []string
	port            string
	address         string
	credential      string
	permitWrite     bool
	enableRandomUrl bool
	serverOptions   *server.Options
	commandOptions  *localcommand.Options
}

// NewGottyHandler creates a new GottyHandlerBuilder with default settings
func NewGottyHandler() *GottyHandlerBuilder {
	serverOptions := &server.Options{}
	commandOptions := &localcommand.Options{}
	
	// Apply default values
	utils.ApplyDefaultValues(serverOptions)
	utils.ApplyDefaultValues(commandOptions)
	
	return &GottyHandlerBuilder{
		address:        "0.0.0.0",
		port:          "8080",
		serverOptions:  serverOptions,
		commandOptions: commandOptions,
	}
}

// WithCommand sets the command to execute
func (b *GottyHandlerBuilder) WithCommand(command string, args ...string) *GottyHandlerBuilder {
	b.command = command
	b.args = args
	return b
}

// WithPort sets the port number
func (b *GottyHandlerBuilder) WithPort(port string) *GottyHandlerBuilder {
	b.port = port
	b.serverOptions.Port = port
	return b
}

// WithAddress sets the bind address
func (b *GottyHandlerBuilder) WithAddress(address string) *GottyHandlerBuilder {
	b.address = address
	b.serverOptions.Address = address
	return b
}

// WithCredential sets basic auth credentials in format "user:pass"
func (b *GottyHandlerBuilder) WithCredential(credential string) *GottyHandlerBuilder {
	b.credential = credential
	b.serverOptions.Credential = credential
	b.serverOptions.EnableBasicAuth = credential != ""
	return b
}

// WithPermitWrite allows clients to write to the terminal
func (b *GottyHandlerBuilder) WithPermitWrite(permit bool) *GottyHandlerBuilder {
	b.permitWrite = permit
	b.serverOptions.PermitWrite = permit
	return b
}

// WithRandomUrl enables random URL generation
func (b *GottyHandlerBuilder) WithRandomUrl(enable bool) *GottyHandlerBuilder {
	b.enableRandomUrl = enable
	b.serverOptions.EnableRandomUrl = enable
	return b
}

// WithServerOptions allows setting custom server options
func (b *GottyHandlerBuilder) WithServerOptions(options *server.Options) *GottyHandlerBuilder {
	b.serverOptions = options
	return b
}

// WithCommandOptions allows setting custom command options
func (b *GottyHandlerBuilder) WithCommandOptions(options *localcommand.Options) *GottyHandlerBuilder {
	b.commandOptions = options
	return b
}

// BuildHandler creates an HTTP handler that serves gotty
func (b *GottyHandlerBuilder) BuildHandler() (http.Handler, error) {
	if b.command == "" {
		b.command = "bash"
	}

	// Validate server options
	if err := b.serverOptions.Validate(); err != nil {
		return nil, err
	}

	// Create command factory
	factory, err := localcommand.NewFactory(b.command, b.args, b.commandOptions)
	if err != nil {
		return nil, err
	}

	// Set title variables
	hostname, _ := os.Hostname()
	b.serverOptions.TitleVariables = map[string]interface{}{
		"command":  b.command,
		"argv":     b.args,
		"hostname": hostname,
	}

	// Create server
	srv, err := server.New(factory, b.serverOptions)
	if err != nil {
		return nil, err
	}

	// Create a handler that runs the server
	return &gottyHandler{
		server: srv,
	}, nil
}

// BuildServer creates a complete gotty server instance
func (b *GottyHandlerBuilder) BuildServer() (*server.Server, error) {
	if b.command == "" {
		b.command = "bash"
	}

	// Validate server options
	if err := b.serverOptions.Validate(); err != nil {
		return nil, err
	}

	// Create command factory
	factory, err := localcommand.NewFactory(b.command, b.args, b.commandOptions)
	if err != nil {
		return nil, err
	}

	// Set title variables
	hostname, _ := os.Hostname()
	b.serverOptions.TitleVariables = map[string]interface{}{
		"command":  b.command,
		"argv":     b.args,
		"hostname": hostname,
	}

	return server.New(factory, b.serverOptions)
}

// gottyHandler wraps the gotty server as an HTTP handler
type gottyHandler struct {
	server *server.Server
}

func (h *gottyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation
	// In a real implementation, you'd integrate with the gotty server's handlers
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`
		<html>
		<head><title>GoTTY</title></head>
		<body>
			<h1>GoTTY Terminal</h1>
			<p>GoTTY handler is ready. This would normally serve the terminal interface.</p>
			<p>To implement fully, you would need to integrate with the gotty server's routing.</p>
		</body>
		</html>
	`))
}

// CreateDockerClaudeCodeHandler creates a handler equivalent to:
// "go run . --credential "ursohacked:aiissick" -p 9000 -w docker run -it --rm ghcr.io/zeeno-atl/claude-code:latest"
func CreateDockerClaudeCodeHandler() (http.Handler, error) {
	return NewGottyHandler().
		WithCredential("ursohacked:aiissick").
		WithPort("9000").
		WithPermitWrite(true).
		WithCommand("docker", "run", "-it", "--rm", "ghcr.io/zeeno-atl/claude-code:latest").
		BuildHandler()
}

// Example usage function showing how to integrate with existing HTTP server
func ExampleUsage() {
	// Create a custom handler
	handler, err := NewGottyHandler().
		WithCommand("bash").
		WithPort("8080").
		WithCredential("user:pass").
		WithPermitWrite(true).
		BuildHandler()
	
	if err != nil {
		panic(err)
	}

	// Use it in your existing HTTP server
	http.Handle("/terminal", handler)
	
	// Or create the specific Docker Claude Code handler
	dockerHandler, err := CreateDockerClaudeCodeHandler()
	if err != nil {
		panic(err)
	}
	
	http.Handle("/claude-terminal", dockerHandler)
}