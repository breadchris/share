package deploy

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
)

// DeploymentStatus represents the current state of a deployment
type DeploymentStatus string

const (
	StatusPending    DeploymentStatus = "pending"
	StatusBuilding   DeploymentStatus = "building"
	StatusDeploying  DeploymentStatus = "deploying"
	StatusSuccess    DeploymentStatus = "success"
	StatusFailed     DeploymentStatus = "failed"
	StatusRolledBack DeploymentStatus = "rolled_back"
)

// DeploymentManager handles deployment operations
type DeploymentManager struct {
	deps           deps.Deps
	currentProcess *ProcessInfo
	mu             sync.RWMutex
	isDeploying    bool
}

// ProcessInfo holds information about a running server process
type ProcessInfo struct {
	PID          int         `json:"pid"`
	Port         int         `json:"port"`
	StartTime    time.Time   `json:"start_time"`
	HealthURL    string      `json:"health_url"`
	Process      *os.Process `json:"-"`
	DeploymentID string      `json:"deployment_id"`
}

// NewDeploymentManager creates a new deployment manager
func NewDeploymentManager(d deps.Deps) *DeploymentManager {
	return &DeploymentManager{
		deps:        d,
		isDeploying: false,
	}
}

// New creates the HTTP mux for deployment management
func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	manager := NewDeploymentManager(d)

	// Webhook endpoint for GitHub
	mux.HandleFunc("/webhook", manager.handleWebhook)

	// Health check endpoint
	mux.HandleFunc("/health", manager.handleHealth)

	// Management interface endpoints
	mux.HandleFunc("/", manager.handleDashboard)
	mux.HandleFunc("/deploy", manager.handleManualDeployRequest)
	mux.HandleFunc("/rollback/{id}", manager.handleRollback)
	mux.HandleFunc("/logs/{id}", manager.handleLogs)
	mux.HandleFunc("/status", manager.handleStatus)

	return mux
}

// handleDashboard serves the main deployment management interface
func (dm *DeploymentManager) handleDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := context.WithValue(r.Context(), "baseURL", "/deploy")

	// Check admin access
	u, err := dm.deps.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user models.User
	if err := dm.deps.DB.First(&user, "id = ?", u).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Check if user is admin
	isAdmin := false
	for _, admin := range dm.deps.Config.Admins {
		if admin == user.Username {
			isAdmin = true
			break
		}
	}

	if !isAdmin {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	switch r.Method {
	case http.MethodGet:
		dm.renderDashboard(ctx, w, r)
	case http.MethodPost:
		dm.handleManualDeployRequest(w, r)
	}
}

// renderDashboard renders the deployment management dashboard
func (dm *DeploymentManager) renderDashboard(ctx context.Context, w http.ResponseWriter, r *http.Request) {
	// Get recent deployments
	var deployments []models.Deployment
	dm.deps.DB.Order("start_time DESC").Limit(10).Find(&deployments)

	// Get current process info
	dm.mu.RLock()
	currentProcess := dm.currentProcess
	isDeploying := dm.isDeploying
	dm.mu.RUnlock()

	DefaultLayout(
		Div(
			Class("container mx-auto p-6"),
			H1(Class("text-3xl font-bold mb-6"), T("Deployment Management")),

			// Current Status Card
			Div(
				Class("card bg-base-100 shadow-xl mb-6"),
				Div(
					Class("card-body"),
					H2(Class("card-title"), T("Current Status")),
					dm.renderCurrentStatus(currentProcess, isDeploying),
				),
			),

			// Manual Deploy Section
			Div(
				Class("card bg-base-100 shadow-xl mb-6"),
				Div(
					Class("card-body"),
					H2(Class("card-title"), T("Manual Deployment")),
					P(Class("mb-4"), T("Trigger a deployment from the latest master branch")),
					Form(
						HxPost("/deploy"),
						HxTarget("#deployment-result"),
						HxSwap("innerHTML"),
						Button(
							Class("btn btn-primary"),
							Type("submit"),
							If(isDeploying, Attr("disabled", "true"), nil),
							T(func() string {
								if isDeploying {
									return "Deploying..."
								}
								return "Deploy Now"
							}()),
						),
					),
					Div(Id("deployment-result"), Class("mt-4")),
				),
			),

			// Recent Deployments
			Div(
				Class("card bg-base-100 shadow-xl"),
				Div(
					Class("card-body"),
					H2(Class("card-title"), T("Recent Deployments")),
					dm.renderDeploymentHistory(deployments),
				),
			),
		),
	).RenderPageCtx(ctx, w, r)
}

// renderCurrentStatus renders the current process status
func (dm *DeploymentManager) renderCurrentStatus(process *ProcessInfo, isDeploying bool) *Node {
	if isDeploying {
		return Div(
			Class("alert alert-warning"),
			T("🔄 Deployment in progress..."),
		)
	}

	if process == nil {
		return Div(
			Class("alert alert-error"),
			T("❌ No active process detected"),
		)
	}

	uptime := time.Since(process.StartTime).Round(time.Second)

	return Div(
		Class("stats shadow"),
		Div(
			Class("stat"),
			Div(Class("stat-title"), T("Process ID")),
			Div(Class("stat-value text-primary"), T(strconv.Itoa(process.PID))),
		),
		Div(
			Class("stat"),
			Div(Class("stat-title"), T("Port")),
			Div(Class("stat-value text-secondary"), T(strconv.Itoa(process.Port))),
		),
		Div(
			Class("stat"),
			Div(Class("stat-title"), T("Uptime")),
			Div(Class("stat-value text-accent"), T(uptime.String())),
		),
		Div(
			Class("stat"),
			Div(Class("stat-title"), T("Status")),
			Div(Class("stat-value text-success"), T("✅ Running")),
		),
	)
}

// renderDeploymentHistory renders the deployment history table
func (dm *DeploymentManager) renderDeploymentHistory(deployments []models.Deployment) *Node {
	if len(deployments) == 0 {
		return P(Class("text-gray-500"), T("No deployments found"))
	}

	var rows []*Node
	for _, deployment := range deployments {
		statusClass := dm.getStatusClass(DeploymentStatus(deployment.Status))
		duration := ""
		if deployment.EndTime != nil {
			duration = deployment.EndTime.Sub(deployment.StartTime).Round(time.Second).String()
		} else {
			duration = "In progress"
		}

		rows = append(rows, Tr(
			Td(T(deployment.ID[:8])),         // Short ID
			Td(T(deployment.CommitHash[:7])), // Short commit hash
			Td(
				Span(Class("badge "+statusClass), T(string(deployment.Status))),
			),
			Td(T(deployment.StartTime.Format("2006-01-02 15:04:05"))),
			Td(T(duration)),
			Td(
				Div(Class("flex space-x-2"),
					A(
						Class("btn btn-xs btn-outline"),
						Href("/deploy/logs/"+deployment.ID),
						T("Logs"),
					),
					If(deployment.Status == string(StatusSuccess),
						Button(
							Class("btn btn-xs btn-warning"),
							HxPost("/deploy/rollback/"+deployment.ID),
							//HxConfirm("Are you sure you want to rollback to this deployment?"),
							T("Rollback"),
						),
						nil,
					),
				),
			),
		))
	}

	return Div(
		Class("overflow-x-auto"),
		Table(
			Class("table table-zebra w-full"),
			Thead(
				Tr(
					Th(T("ID")),
					Th(T("Commit")),
					Th(T("Status")),
					Th(T("Started")),
					Th(T("Duration")),
					Th(T("Actions")),
				),
			),
			Tbody(Ch(rows)),
		),
	)
}

// getStatusClass returns the appropriate CSS class for a deployment status
func (dm *DeploymentManager) getStatusClass(status DeploymentStatus) string {
	switch status {
	case StatusSuccess:
		return "badge-success"
	case StatusFailed:
		return "badge-error"
	case StatusPending, StatusBuilding, StatusDeploying:
		return "badge-warning"
	case StatusRolledBack:
		return "badge-info"
	default:
		return "badge-ghost"
	}
}

// handleHealth provides a health check endpoint
func (dm *DeploymentManager) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`))
}

// handleStatus returns current deployment status as JSON
func (dm *DeploymentManager) handleStatus(w http.ResponseWriter, r *http.Request) {
	dm.mu.RLock()
	currentProcess := dm.currentProcess
	isDeploying := dm.isDeploying
	dm.mu.RUnlock()

	status := map[string]interface{}{
		"is_deploying":    isDeploying,
		"current_process": currentProcess,
		"timestamp":       time.Now().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(status); err != nil {
		http.Error(w, "Failed to encode status", http.StatusInternalServerError)
		return
	}
}

// createDeployment creates a new deployment record in the database
func (dm *DeploymentManager) createDeployment(commitHash, userID string) (*models.Deployment, error) {
	deployment := &models.Deployment{
		Model: models.Model{
			ID: uuid.New().String(),
		},
		CommitHash: commitHash,
		Status:     string(StatusPending),
		StartTime:  time.Now(),
		UserID:     userID,
	}

	if err := dm.deps.DB.Create(deployment).Error; err != nil {
		return nil, fmt.Errorf("failed to create deployment record: %w", err)
	}

	return deployment, nil
}

// updateDeployment updates a deployment record
func (dm *DeploymentManager) updateDeployment(deployment *models.Deployment) error {
	return dm.deps.DB.Save(deployment).Error
}

// appendLog appends a log message to a deployment
func (dm *DeploymentManager) appendLog(deployment *models.Deployment, message string) {
	timestamp := time.Now().Format("15:04:05")
	logLine := fmt.Sprintf("[%s] %s\n", timestamp, message)
	deployment.Logs += logLine

	slog.Info("Deployment log", "deployment_id", deployment.ID, "message", message)
}
