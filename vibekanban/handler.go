package vibekanban

import (
	"connectrpc.com/connect"
	"github.com/breadchris/share/gen/proto/vibekanban/vibekanbanconnect"
	"net/http"

	"github.com/breadchris/share/coderunner"
	"github.com/breadchris/share/deps"
)

// New creates a new HTTP handler for the vibekanban service
// Following the deps pattern used in the rest of the codebase
func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	// Serve the React component at the root path
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			coderunner.ServeReactApp(w, r, "vibekanban/VibeKanbanApp", "VibeKanbanApp")
			return
		}
		http.NotFound(w, r)
	})

	// Create service instance
	service := NewService(d.DB, d.Session)

	// Register the service with Connect interceptors
	interceptors := connect.WithInterceptors(
	// Add any interceptors you need (logging, auth, etc.)
	// For now, keep it simple without additional interceptors
	)

	// Create and mount the handler for API endpoints
	path, handler := vibekanbanconnect.NewVibeKanbanServiceHandler(service, interceptors)
	mux.Handle(path, handler)

	return mux
}
