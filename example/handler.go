package example

import (
	"net/http"

	"github.com/breadchris/share/coderunner"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/gen/proto/example/exampleconnect"
	"github.com/bufbuild/connect-go"
)

// New creates a new HTTP handler for the example service
// Following the deps pattern used in the rest of the codebase
func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	
	// Serve the React component at the root path
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			coderunner.ServeReactApp(w, r, "example/ExampleClient", "ExampleClient")
			return
		}
		http.NotFound(w, r)
	})
	
	// Create service instance
	service := NewService()
	
	// Register the service with Connect interceptors
	interceptors := connect.WithInterceptors(
		// Add any interceptors you need (logging, auth, etc.)
	)
	
	// Create and mount the handler for API endpoints
	path, handler := exampleconnect.NewExampleServiceHandler(service, interceptors)
	mux.Handle(path, handler)
	
	return mux
}