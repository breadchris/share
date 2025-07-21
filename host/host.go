package host

import (
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/models"
	"net/http"
	"strings"

	"github.com/breadchris/share/coderunner"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"gorm.io/gorm"
)

// Service manages host mappings
type Service struct {
	db *gorm.DB
}

// NewService creates a new host service
func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// GetByDomain retrieves a host mapping by domain
func (s *Service) GetByDomain(domain string) (*models.HostMapping, error) {
	// Normalize domain (remove port if present)
	if idx := strings.Index(domain, ":"); idx != -1 {
		domain = domain[:idx]
	}

	var mapping models.HostMapping
	err := s.db.Where("domain = ? AND is_active = ?", domain, true).First(&mapping).Error
	if err != nil {
		return nil, err
	}
	return &mapping, nil
}

// Create adds a new host mapping
func (s *Service) Create(mapping *models.HostMapping) error {
	return s.db.Create(mapping).Error
}

// Update modifies an existing host mapping
func (s *Service) Update(mapping *models.HostMapping) error {
	return s.db.Save(mapping).Error
}

// Delete removes a host mapping (soft delete by setting is_active to false)
func (s *Service) Delete(id uint) error {
	return s.db.Model(&models.HostMapping{}).Where("id = ?", id).Update("is_active", false).Error
}

// List retrieves all active host mappings
func (s *Service) List() ([]models.HostMapping, error) {
	var mappings []models.HostMapping
	err := s.db.Where("is_active = ?", true).Order("domain ASC").Find(&mappings).Error
	return mappings, err
}

// New creates the HTTP handlers for the host management interface
func New(d deps.Deps) *http.ServeMux {
	service := NewService(d.DB)
	mux := http.NewServeMux()

	// Main host management page
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		mappings, err := service.List()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		DefaultLayout(
			Div(Class("container mx-auto p-6"),
				H1(Class("text-3xl font-bold mb-6"), T("Host Management")),

				// Add new host form
				Div(Class("bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6"),
					H2(Class("text-xl font-semibold mb-4"), T("Add New Host Mapping")),
					Form(HxPost("/host/create"), HxTarget("#host-list"), HxSwap("beforeend"),
						Div(Class("grid grid-cols-1 md:grid-cols-2 gap-4"),
							Div(
								Label(Class("block text-gray-700 text-sm font-bold mb-2"), For("domain"), T("Domain")),
								Input(
									Type("text"),
									Name("domain"),
									Id("domain"),
									Class("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"),
									Placeholder("example.com"),
								),
							),
							Div(
								Label(Class("block text-gray-700 text-sm font-bold mb-2"), For("component_path"), T("Component Path")),
								Input(
									Type("text"),
									Name("component_path"),
									Id("component_path"),
									Class("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"),
									Placeholder("vibekanban/VibeKanbanApp.tsx"),
								),
							),
							Div(
								Label(Class("block text-gray-700 text-sm font-bold mb-2"), For("title"), T("Title")),
								Input(
									Type("text"),
									Name("title"),
									Id("title"),
									Class("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"),
									Placeholder("Site Title"),
								),
							),
							Div(
								Label(Class("block text-gray-700 text-sm font-bold mb-2"), For("description"), T("Description")),
								Input(
									Type("text"),
									Name("description"),
									Id("description"),
									Class("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"),
									Placeholder("Site Description"),
								),
							),
						),
						Div(Class("mt-4"),
							Button(
								Type("submit"),
								Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"),
								T("Add Host Mapping"),
							),
						),
					),
				),

				// Host list
				Div(Class("bg-white shadow-md rounded px-8 pt-6 pb-8"),
					H2(Class("text-xl font-semibold mb-4"), T("Current Host Mappings")),
					Div(Id("host-list"),
						RenderHostList(mappings),
					),
				),
			),
		).RenderPage(w, r)
	})

	// API endpoints
	mux.HandleFunc("/create", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		mapping := &models.HostMapping{
			Domain:        r.FormValue("domain"),
			ComponentPath: r.FormValue("component_path"),
			Title:         r.FormValue("title"),
			Description:   r.FormValue("description"),
			IsActive:      true,
		}

		if err := service.Create(mapping); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(Div(Class("text-red-500"), T("Error: "+err.Error())).Render()))
			return
		}

		// Return the new row
		w.Write([]byte(RenderHostRow(mapping).Render()))
	})

	mux.HandleFunc("/update", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var mapping models.HostMapping
		if err := json.NewDecoder(r.Body).Decode(&mapping); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := service.Update(&mapping); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(mapping)
	})

	mux.HandleFunc("/delete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			ID uint `json:"id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := service.Delete(req.ID); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	})

	mux.HandleFunc("/list", func(w http.ResponseWriter, r *http.Request) {
		mappings, err := service.List()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mappings)
	})

	return mux
}

// RenderHostList renders the list of host mappings
func RenderHostList(mappings []models.HostMapping) *Node {
	if len(mappings) == 0 {
		return Div(Class("text-gray-500 text-center py-4"), T("No host mappings configured"))
	}

	return Div(Class("overflow-x-auto"),
		Table(Class("min-w-full table-auto"),
			Thead(Class("bg-gray-50"),
				Tr(
					Th(Class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"), T("Domain")),
					Th(Class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"), T("Component Path")),
					Th(Class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"), T("Title")),
					Th(Class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"), T("Actions")),
				),
			),
			Tbody(Class("bg-white divide-y divide-gray-200"),
				func() *Node {
					var rows []*Node
					for _, m := range mappings {
						rows = append(rows, RenderHostRow(&m))
					}
					return Ch(rows)
				}(),
			),
		),
	)
}

// RenderHostRow renders a single host mapping row
func RenderHostRow(mapping *models.HostMapping) *Node {
	return Tr(Id(fmt.Sprintf("host-%d", mapping.ID)),
		Td(Class("px-6 py-4 whitespace-nowrap"), T(mapping.Domain)),
		Td(Class("px-6 py-4 whitespace-nowrap"), T(mapping.ComponentPath)),
		Td(Class("px-6 py-4 whitespace-nowrap"), T(mapping.Title)),
		Td(Class("px-6 py-4 whitespace-nowrap"),
			Button(
				Class("text-red-600 hover:text-red-900"),
				HxPost(fmt.Sprintf("/host/delete")),
				Attr("hx-confirm", fmt.Sprintf("Are you sure you want to delete the mapping for %s?", mapping.Domain)),
				HxTarget(fmt.Sprintf("#host-%d", mapping.ID)),
				HxSwap("outerHTML"),
				HxVals(fmt.Sprintf(`{"id": %d}`, mapping.ID)),
				T("Delete"),
			),
		),
	)
}

// ServeComponent serves a React component based on the host header
func ServeComponent(hostService *Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		host := r.Host

		// Check if this is the root domain (localhost, etc.)
		if isRootDomain(host) {
			// Let the default handler take care of it
			http.NotFound(w, r)
			return
		}

		// Look up the host mapping
		mapping, err := hostService.GetByDomain(host)
		if err != nil {
			// No mapping found, return 404
			http.NotFound(w, r)
			return
		}

		// Extract component name from path
		componentName := strings.TrimSuffix(
			strings.TrimSuffix(mapping.ComponentPath, ".tsx"),
			".jsx",
		)
		parts := strings.Split(componentName, "/")
		if len(parts) > 0 {
			componentName = parts[len(parts)-1]
		}

		// Serve the React component
		coderunner.ServeReactApp(w, r, mapping.ComponentPath, componentName)
	}
}

// isRootDomain checks if the host is the root domain (localhost, IP, or configured root domain)
func isRootDomain(host string) bool {
	// Remove port if present
	if idx := strings.Index(host, ":"); idx != -1 {
		host = host[:idx]
	}

	rootDomains := []string{
		"localhost",
		"127.0.0.1",
		"0.0.0.0",
		"justshare.io",
		"www.justshare.io",
	}

	for _, domain := range rootDomains {
		if host == domain {
			return true
		}
	}

	return false
}
