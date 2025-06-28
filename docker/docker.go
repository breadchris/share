package docker

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	db := d.DB

	// Container management endpoints
	mux.HandleFunc("/containers/{id...}", func(w http.ResponseWriter, r *http.Request) {
		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var user models.User
		if err := db.First(&user, "id = ?", u).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		id := r.PathValue("id")

		switch r.Method {
		case http.MethodGet:
			handleGetContainers(w, r, db, user, id)
		case http.MethodPost:
			handleCreateContainer(w, r, db, user, d.Docker)
		case http.MethodDelete:
			handleDeleteContainer(w, r, db, user, id, d.Docker)
		}
	})

	// Docker hosts management
	mux.HandleFunc("/hosts/{id...}", func(w http.ResponseWriter, r *http.Request) {
		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var user models.User
		if err := db.First(&user, "id = ?", u).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		id := r.PathValue("id")

		switch r.Method {
		case http.MethodGet:
			handleGetHosts(w, r, db, user, id)
		case http.MethodPost:
			handleCreateHost(w, r, db, user)
		case http.MethodPut:
			handleUpdateHost(w, r, db, user, id)
		case http.MethodDelete:
			handleDeleteHost(w, r, db, user, id)
		}
	})

	// Container logs endpoint
	mux.HandleFunc("/containers/{id}/logs", func(w http.ResponseWriter, r *http.Request) {
		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		id := r.PathValue("id")
		handleContainerLogs(w, r, db, u, id)
	})

	// Container actions (start, stop, restart)
	mux.HandleFunc("/containers/{id}/actions/{action}", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		id := r.PathValue("id")
		action := r.PathValue("action")
		handleContainerAction(w, r, db, u, id, action)
	})

	// Main dashboard
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "baseURL", "/docker")

		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var user models.User
		if err := db.First(&user, "id = ?", u).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		switch r.Method {
		case http.MethodGet:
			renderDashboard(ctx, w, r, db, user)
		}
	})

	return mux
}

func handleGetContainers(w http.ResponseWriter, r *http.Request, db *gorm.DB, user models.User, id string) {
	if id != "" {
		// Get specific container
		var container models.Container
		if err := db.Preload("DockerHost").First(&container, "id = ? AND user_id = ?", id, user.ID).Error; err != nil {
			http.Error(w, "Container not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(container)
		return
	}

	// List all containers for user
	var containers []models.Container
	if err := db.Preload("DockerHost").Where("user_id = ?", user.ID).Find(&containers).Error; err != nil {
		http.Error(w, "Failed to get containers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(containers)
}

func handleCreateContainer(w http.ResponseWriter, r *http.Request, db *gorm.DB, user models.User, docker deps.DockerManager) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get form data
	hostID := r.FormValue("host_id")
	image := r.FormValue("image")
	name := r.FormValue("name")

	if hostID == "" || image == "" || name == "" {
		http.Error(w, "Missing required fields: host_id, image, name", http.StatusBadRequest)
		return
	}

	// Create container configuration
	config := deps.ContainerConfig{
		Image:   image,
		Name:    name,
		Command: []string{}, // Default empty command
		Env:     make(map[string]string),
		Ports:   make(map[string]string),
	}

	// Create container using Docker manager
	containerInfo, err := docker.CreateContainer(hostID, user.ID, config)
	if err != nil {
		http.Error(w, "Failed to create container: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(containerInfo)
}

func handleDeleteContainer(w http.ResponseWriter, r *http.Request, db *gorm.DB, user models.User, id string, docker deps.DockerManager) {
	// Get container from database to check ownership and get host ID
	var container models.Container
	if err := db.First(&container, "id = ? AND user_id = ?", id, user.ID).Error; err != nil {
		http.Error(w, "Container not found", http.StatusNotFound)
		return
	}

	// Remove container using Docker manager
	if err := docker.RemoveContainer(container.DockerHostID, container.ContainerID); err != nil {
		http.Error(w, "Failed to remove container: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted", "id": id})
}

func handleGetHosts(w http.ResponseWriter, r *http.Request, db *gorm.DB, user models.User, id string) {
	if id != "" {
		// Get specific host
		var host models.DockerHost
		if err := db.First(&host, "id = ? AND user_id = ?", id, user.ID).Error; err != nil {
			http.Error(w, "Docker host not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(host)
		return
	}

	// List all hosts for user
	var hosts []models.DockerHost
	if err := db.Where("user_id = ?", user.ID).Find(&hosts).Error; err != nil {
		http.Error(w, "Failed to get Docker hosts: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hosts)
}

func handleCreateHost(w http.ResponseWriter, r *http.Request, db *gorm.DB, user models.User) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	name := r.FormValue("name")
	endpoint := r.FormValue("endpoint")
	tlsVerify := r.FormValue("tls_verify") == "on"

	if name == "" || endpoint == "" {
		http.Error(w, "Missing required fields: name, endpoint", http.StatusBadRequest)
		return
	}

	host := models.DockerHost{
		Model: models.Model{
			ID: uuid.NewString(),
		},
		Name:      name,
		Endpoint:  endpoint,
		TLSVerify: tlsVerify,
		UserID:    user.ID,
	}

	if err := db.Create(&host).Error; err != nil {
		http.Error(w, "Failed to create Docker host: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(host)
}

func handleUpdateHost(w http.ResponseWriter, r *http.Request, db *gorm.DB, user models.User, id string) {
	// TODO: Implement Docker host update
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "not implemented"})
}

func handleDeleteHost(w http.ResponseWriter, r *http.Request, db *gorm.DB, user models.User, id string) {
	if err := db.Where("id = ? AND user_id = ?", id, user.ID).Delete(&models.DockerHost{}).Error; err != nil {
		http.Error(w, "Failed to delete Docker host: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted", "id": id})
}

func handleContainerLogs(w http.ResponseWriter, r *http.Request, db *gorm.DB, userID, containerID string) {
	// TODO: Implement container logs retrieval
	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte("Container logs not implemented yet"))
}

func handleContainerAction(w http.ResponseWriter, r *http.Request, db *gorm.DB, userID, containerID, action string) {
	// TODO: Implement container actions (start, stop, restart)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "not implemented",
		"action":    action,
		"container": containerID,
	})
}

func renderDashboard(ctx context.Context, w http.ResponseWriter, r *http.Request, db *gorm.DB, user models.User) {
	DefaultLayout(
		Div(
			Class("p-5 max-w-6xl mx-auto"),
			Div(Class("text-sm text-center m-10"), T("Docker Management - "+user.Username)),
			Div(Class("divider")),

			// Containers section
			Div(Class("mb-8"),
				Div(Class("text-lg mb-4"), Text("Containers")),
				Div(Id("containers-list"), Class("bg-base-200 p-4 rounded"),
					Text("Loading containers..."),
				),
			),

			// Docker hosts section
			Div(Class("mb-8"),
				Div(Class("text-lg mb-4"), Text("Docker Hosts")),
				Div(Id("hosts-list"), Class("bg-base-200 p-4 rounded"),
					Text("Loading hosts..."),
				),
				Form(
					Class("flex flex-col space-y-4 mt-4"),
					Div(Text("Add Docker Host")),
					Input(Class("input w-full"), Type("text"), Name("name"), Placeholder("Host Name")),
					Input(Class("input w-full"), Type("text"), Name("endpoint"), Placeholder("Docker Endpoint (e.g., unix:///var/run/docker.sock)")),
					Div(Class("flex items-center space-x-2"),
						Input(Type("checkbox"), Name("tls_verify"), Id("tls_verify")),
						Label(For("tls_verify"), Text("Enable TLS Verification")),
					),
					Button(Class("btn"), Type("submit"), Text("Add Host")),
				),
			),
		),
	).RenderPageCtx(ctx, w, r)
}
