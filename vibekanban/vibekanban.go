package vibekanban

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VibeKanbanService struct {
	db             *gorm.DB
	gitService     *GitService
	processManager *ProcessManager
}

func NewVibeKanbanService(database *gorm.DB) *VibeKanbanService {
	return &VibeKanbanService{
		db:             database,
		gitService:     NewGitService(),
		processManager: NewProcessManager(database),
	}
}

// HTTP Helper Functions

// writeJSON writes a JSON response with the given status code and data
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
	}
}

// writeError writes a JSON error response with the given status code and message
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// parseJSON parses JSON from request body into the provided interface
func parseJSON(r *http.Request, v interface{}) error {
	if r.Header.Get("Content-Type") != "application/json" {
		return fmt.Errorf("content-type must be application/json")
	}
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

// getUserID extracts user ID from request (from headers, JWT, or context)
func getUserID(r *http.Request) string {
	// For now, get from header - in real implementation this would be from JWT/auth middleware
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		// Try getting from context if set by middleware
		if userIDCtx := r.Context().Value("user_id"); userIDCtx != nil {
			if uid, ok := userIDCtx.(string); ok {
				return uid
			}
		}
	}
	return userID
}

// extractPathParam extracts a parameter from the URL path
// For Go 1.22+ this can use r.PathValue(), for older versions we need manual parsing
func extractPathParam(r *http.Request, param string) string {
	// Try Go 1.22+ PathValue first
	if value := r.PathValue(param); value != "" {
		return value
	}
	
	// Fallback for older Go versions - simple path parsing
	path := strings.TrimPrefix(r.URL.Path, "/")
	parts := strings.Split(path, "/")
	
	// Handle common patterns
	switch param {
	case "id":
		// /projects/{id} - projects/123
		if len(parts) >= 2 && parts[0] == "projects" {
			return parts[1]
		}
	case "project_id":
		// /projects/{project_id}/tasks - projects/123/tasks
		if len(parts) >= 1 && parts[0] == "projects" {
			return parts[1]
		}
	case "task_id":
		// /projects/{project_id}/tasks/{task_id} - projects/123/tasks/456
		if len(parts) >= 4 && parts[0] == "projects" && parts[2] == "tasks" {
			return parts[3]
		}
	case "attempt_id":
		// /projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}
		if len(parts) >= 6 && parts[4] == "attempts" {
			return parts[5]
		}
	case "process_id":
		// /processes/{process_id}
		if len(parts) >= 2 && parts[0] == "processes" {
			return parts[1]
		}
	}
	
	return ""
}

// Project endpoints

func (s *VibeKanbanService) getProjects(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var projects []models.VibeProject
	result := s.db.Where("user_id = ?", userID).Preload("Tasks").Find(&projects)
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch projects")
		return
	}

	writeJSON(w, http.StatusOK, projects)
}

func (s *VibeKanbanService) createProject(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req struct {
		Name          string                 `json:"name"`
		GitRepoPath   string                 `json:"git_repo_path"`
		SetupScript   string                 `json:"setup_script"`
		DevScript     string                 `json:"dev_script"`
		DefaultBranch string                 `json:"default_branch"`
		Config        map[string]interface{} `json:"config"`
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate required fields
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if req.GitRepoPath == "" {
		writeError(w, http.StatusBadRequest, "git_repo_path is required")
		return
	}

	// Validate git repo path
	if !filepath.IsAbs(req.GitRepoPath) {
		writeError(w, http.StatusBadRequest, "Git repository path must be absolute")
		return
	}

	project := models.VibeProject{
		Model: models.Model{
			ID: uuid.NewString(),
		},
		Name:          req.Name,
		GitRepoPath:   req.GitRepoPath,
		SetupScript:   req.SetupScript,
		DevScript:     req.DevScript,
		DefaultBranch: req.DefaultBranch,
		UserID:        userID,
		Config:        models.MakeJSONField(req.Config),
	}

	if project.DefaultBranch == "" {
		project.DefaultBranch = "main"
	}

	result := s.db.Create(&project)
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create project")
		return
	}

	writeJSON(w, http.StatusCreated, project)
}

func (s *VibeKanbanService) getProject(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "id")
	userID := getUserID(r)
	
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	
	if projectID == "" {
		writeError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).
		Preload("Tasks").
		Preload("Tasks.Attempts").
		First(&project)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Project not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch project")
		}
		return
	}

	writeJSON(w, http.StatusOK, project)
}

func (s *VibeKanbanService) updateProject(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "id")
	userID := getUserID(r)
	
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	
	if projectID == "" {
		writeError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	var req struct {
		Name          string                 `json:"name"`
		GitRepoPath   string                 `json:"git_repo_path"`
		SetupScript   string                 `json:"setup_script"`
		DevScript     string                 `json:"dev_script"`
		DefaultBranch string                 `json:"default_branch"`
		Config        map[string]interface{} `json:"config"`
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Project not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch project")
		}
		return
	}

	// Update fields
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.GitRepoPath != "" {
		if !filepath.IsAbs(req.GitRepoPath) {
			writeError(w, http.StatusBadRequest, "Git repository path must be absolute")
			return
		}
		project.GitRepoPath = req.GitRepoPath
	}
	project.SetupScript = req.SetupScript
	project.DevScript = req.DevScript
	if req.DefaultBranch != "" {
		project.DefaultBranch = req.DefaultBranch
	}
	if req.Config != nil {
		project.Config = models.MakeJSONField(req.Config)
	}

	result = s.db.Save(&project)
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update project")
		return
	}

	writeJSON(w, http.StatusOK, project)
}

func (s *VibeKanbanService) deleteProject(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "id")
	userID := getUserID(r)
	
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	
	if projectID == "" {
		writeError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).Delete(&models.VibeProject{})
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete project")
		return
	}

	if result.RowsAffected == 0 {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Project deleted successfully"})
}

// Task endpoints

func (s *VibeKanbanService) getTasks(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	userID := getUserID(r)
	
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	
	if projectID == "" {
		writeError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	// Verify project belongs to user
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Project not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to verify project")
		}
		return
	}

	var tasks []models.VibeTask
	result = s.db.Where("project_id = ?", projectID).
		Preload("Attempts").
		Preload("Attempts.Processes").
		Preload("Attempts.Sessions").
		Find(&tasks)

	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch tasks")
		return
	}

	writeJSON(w, http.StatusOK, tasks)
}

func (s *VibeKanbanService) createTask(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	userID := getUserID(r)
	
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	
	if projectID == "" {
		writeError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	// Verify project belongs to user
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Project not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to verify project")
		}
		return
	}

	var req struct {
		Title       string                 `json:"title"`
		Description string                 `json:"description"`
		Status      string                 `json:"status"`
		Priority    string                 `json:"priority"`
		Labels      []string               `json:"labels"`
		Metadata    map[string]interface{} `json:"metadata"`
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}

	task := models.VibeTask{
		Model: models.Model{
			ID: uuid.NewString(),
		},
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		ProjectID:   projectID,
		UserID:      userID,
		Labels:      req.Labels,
		Metadata:    models.MakeJSONField(req.Metadata),
	}

	if task.Status == "" {
		task.Status = "todo"
	}
	if task.Priority == "" {
		task.Priority = "medium"
	}

	result = s.db.Create(&task)
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create task")
		return
	}

	writeJSON(w, http.StatusCreated, task)
}

func (s *VibeKanbanService) updateTask(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	userID := getUserID(r)
	
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	
	if projectID == "" {
		writeError(w, http.StatusBadRequest, "Project ID is required")
		return
	}
	
	if taskID == "" {
		writeError(w, http.StatusBadRequest, "Task ID is required")
		return
	}

	var req struct {
		Title       string                 `json:"title"`
		Description string                 `json:"description"`
		Status      string                 `json:"status"`
		Priority    string                 `json:"priority"`
		Labels      []string               `json:"labels"`
		Metadata    map[string]interface{} `json:"metadata"`
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var task models.VibeTask
	result := s.db.Where("id = ? AND project_id = ? AND user_id = ?", taskID, projectID, userID).First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task")
		}
		return
	}

	// Update fields
	if req.Title != "" {
		task.Title = req.Title
	}
	task.Description = req.Description
	if req.Status != "" {
		task.Status = req.Status
	}
	if req.Priority != "" {
		task.Priority = req.Priority
	}
	if req.Labels != nil {
		task.Labels = req.Labels
	}
	if req.Metadata != nil {
		task.Metadata = models.MakeJSONField(req.Metadata)
	}

	result = s.db.Save(&task)
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update task")
		return
	}

	writeJSON(w, http.StatusOK, task)
}

func (s *VibeKanbanService) deleteTask(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	userID := getUserID(r)
	
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	
	if projectID == "" {
		writeError(w, http.StatusBadRequest, "Project ID is required")
		return
	}
	
	if taskID == "" {
		writeError(w, http.StatusBadRequest, "Task ID is required")
		return
	}

	result := s.db.Where("id = ? AND project_id = ? AND user_id = ?", taskID, projectID, userID).Delete(&models.VibeTask{})
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete task")
		return
	}

	if result.RowsAffected == 0 {
		writeError(w, http.StatusNotFound, "Task not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Task deleted successfully"})
}

// Stub functions for remaining endpoints (to be implemented later)

func (s *VibeKanbanService) getTaskAttempts(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Task attempts endpoint not yet implemented")
}

func (s *VibeKanbanService) createTaskAttempt(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Create task attempt endpoint not yet implemented")
}

func (s *VibeKanbanService) getProjectBranches(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Get project branches endpoint not yet implemented")
}

func (s *VibeKanbanService) createProjectBranch(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Create project branch endpoint not yet implemented")
}

func (s *VibeKanbanService) startTaskAttempt(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Start task attempt endpoint not yet implemented")
}

func (s *VibeKanbanService) getAttemptDiff(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Get attempt diff endpoint not yet implemented")
}

func (s *VibeKanbanService) mergeAttempt(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Merge attempt endpoint not yet implemented")
}

func (s *VibeKanbanService) startSetupScript(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Start setup script endpoint not yet implemented")
}

func (s *VibeKanbanService) startCodingAgent(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Start coding agent endpoint not yet implemented")
}

func (s *VibeKanbanService) startDevServer(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Start dev server endpoint not yet implemented")
}

func (s *VibeKanbanService) startFollowupExecution(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Start followup execution endpoint not yet implemented")
}

func (s *VibeKanbanService) getProcesses(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Get processes endpoint not yet implemented")
}

func (s *VibeKanbanService) killProcess(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Kill process endpoint not yet implemented")
}

func (s *VibeKanbanService) getProcessOutput(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Get process output endpoint not yet implemented")
}

// New creates a new HTTP ServeMux with all vibe-kanban routes
func New(d deps.Deps) *http.ServeMux {
	service := NewVibeKanbanService(d.DB)
	mux := http.NewServeMux()
	
	// Project endpoints
	mux.HandleFunc("GET /projects", service.getProjects)
	mux.HandleFunc("POST /projects", service.createProject)
	mux.HandleFunc("GET /projects/{id}", service.getProject)
	mux.HandleFunc("PUT /projects/{id}", service.updateProject)
	mux.HandleFunc("DELETE /projects/{id}", service.deleteProject)
	
	// Task endpoints
	mux.HandleFunc("GET /projects/{project_id}/tasks", service.getTasks)
	mux.HandleFunc("POST /projects/{project_id}/tasks", service.createTask)
	mux.HandleFunc("PUT /projects/{project_id}/tasks/{task_id}", service.updateTask)
	mux.HandleFunc("DELETE /projects/{project_id}/tasks/{task_id}", service.deleteTask)
	
	// Task Attempt endpoints (stubbed for now)
	mux.HandleFunc("GET /projects/{project_id}/tasks/{task_id}/attempts", service.getTaskAttempts)
	mux.HandleFunc("POST /projects/{project_id}/tasks/{task_id}/attempts", service.createTaskAttempt)
	mux.HandleFunc("POST /projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/start", service.startTaskAttempt)
	mux.HandleFunc("GET /projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/diff", service.getAttemptDiff)
	mux.HandleFunc("POST /projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/merge", service.mergeAttempt)
	
	// Git endpoints (stubbed for now)
	mux.HandleFunc("GET /projects/{id}/branches", service.getProjectBranches)
	mux.HandleFunc("POST /projects/{id}/branches", service.createProjectBranch)
	
	// Process endpoints (stubbed for now)
	mux.HandleFunc("POST /projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/processes/setup", service.startSetupScript)
	mux.HandleFunc("POST /projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/processes/agent", service.startCodingAgent)
	mux.HandleFunc("POST /projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/processes/devserver", service.startDevServer)
	mux.HandleFunc("POST /projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/processes/followup", service.startFollowupExecution)
	mux.HandleFunc("GET /projects/{project_id}/tasks/{task_id}/attempts/{attempt_id}/processes", service.getProcesses)
	mux.HandleFunc("DELETE /processes/{process_id}", service.killProcess)
	mux.HandleFunc("GET /processes/{process_id}/output", service.getProcessOutput)
	
	return mux
}