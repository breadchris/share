package kanban

import (
	"net/http"

	"github.com/breadchris/share/coderunner"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/gen/proto/kanban/kanbanconnect"
	"github.com/bufbuild/connect-go"
)

// TODO merge https://github.com/traefik/yaegi/pull/1684/files with fork

// New creates a new HTTP handler for the kanban service
func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	// Serve the React component at the root path
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			// Serve the KanbanBoard.tsx from this package
			coderunner.ServeReactApp(w, r, "kanban/KanbanBoard.tsx", "KanbanBoard")
			return
		}
		http.NotFound(w, r)
	})

	// Create service instance with dependencies
	service := NewService(d.DB)

	// Register the service with Connect interceptors
	interceptors := connect.WithInterceptors(
	// Add interceptors as needed (auth, logging, etc.)
	)

	// Create and mount the handler for API endpoints
	path, handler := kanbanconnect.NewKanbanServiceHandler(service, interceptors)
	mux.Handle(path, handler)

	return mux
}
