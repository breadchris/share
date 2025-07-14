package vibekanban

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/breadchris/share/coderunner"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/breadchris/share/session"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VibeKanbanService struct {
	db             *gorm.DB
	session        *session.SessionManager
	gitService     *GitService
	processManager *ProcessManager
}

func NewVibeKanbanService(database *gorm.DB, sessionManager *session.SessionManager) *VibeKanbanService {
	return &VibeKanbanService{
		db:             database,
		session:        sessionManager,
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
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
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
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
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
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
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
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
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
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
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
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
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
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
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
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
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
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
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
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" {
		writeError(w, http.StatusBadRequest, "Project ID and Task ID are required")
		return
	}

	// Verify task exists and user has access
	var task models.VibeTask
	result := s.db.Where("id = ? AND project_id = ? AND user_id = ?", taskID, projectID, userID).
		First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task")
		}
		return
	}

	// Get task attempts with associated processes
	var attempts []models.VibeTaskAttempt
	result = s.db.Where("task_id = ?", taskID).
		Preload("Processes").
		Order("created_at DESC").
		Find(&attempts)

	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch task attempts")
		return
	}

	writeJSON(w, http.StatusOK, attempts)
}

func (s *VibeKanbanService) createTaskAttempt(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" {
		writeError(w, http.StatusBadRequest, "Project ID and Task ID are required")
		return
	}

	var req struct {
		Executor   string `json:"executor"`    // claude, gemini, amp, etc
		BaseBranch string `json:"base_branch"` // branch to base this attempt on
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate executor
	if req.Executor == "" {
		req.Executor = "claude" // Default executor
	}

	// Verify task exists and user has access
	var task models.VibeTask
	result := s.db.Where("id = ? AND project_id = ? AND user_id = ?", taskID, projectID, userID).
		Preload("Project").
		First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task")
		}
		return
	}

	// Set base branch default
	if req.BaseBranch == "" {
		req.BaseBranch = task.Project.DefaultBranch
	}

	// Generate unique branch name for this attempt
	attemptID := uuid.New().String()
	branchName := fmt.Sprintf("task-%s-%s", taskID, attemptID[:8])

	// Create task attempt record
	attempt := models.VibeTaskAttempt{
		Model: models.Model{
			ID: attemptID,
		},
		TaskID:     taskID,
		Executor:   req.Executor,
		BaseBranch: req.BaseBranch,
		Branch:     branchName,
		Status:     "pending",
		UserID:     userID,
	}

	result = s.db.Create(&attempt)
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create task attempt")
		return
	}

	// Load the created attempt with associations
	s.db.Preload("Processes").Find(&attempt, "id = ?", attemptID)

	writeJSON(w, http.StatusCreated, attempt)
}

func (s *VibeKanbanService) getProjectBranches(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" {
		writeError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	// Verify project exists and user has access
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

	// Validate git repository
	if err := s.gitService.ValidateRepository(project.GitRepoPath); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid git repository: %v", err))
		return
	}

	// Get branches
	branches, err := s.gitService.GetBranches(project.GitRepoPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get branches: %v", err))
		return
	}

	// Get repository status
	status, err := s.gitService.GetRepositoryStatus(project.GitRepoPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get repository status: %v", err))
		return
	}

	response := map[string]interface{}{
		"project_id":      projectID,
		"branches":        branches,
		"current_branch":  status.CurrentBranch,
		"commit_hash":     status.CommitHash,
		"is_clean":        status.IsClean,
		"modified_files":  status.ModifiedFiles,
		"added_files":     status.AddedFiles,
		"deleted_files":   status.DeletedFiles,
	}

	writeJSON(w, http.StatusOK, response)
}

func (s *VibeKanbanService) createProjectBranch(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" {
		writeError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	var req struct {
		BranchName string `json:"branch_name"` // Name of new branch
		BaseBranch string `json:"base_branch"` // Branch to create from
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.BranchName == "" {
		writeError(w, http.StatusBadRequest, "Branch name is required")
		return
	}

	// Verify project exists and user has access
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

	// Use default branch if base branch not specified
	baseBranch := req.BaseBranch
	if baseBranch == "" {
		baseBranch = project.DefaultBranch
	}

	// Validate git repository
	if err := s.gitService.ValidateRepository(project.GitRepoPath); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid git repository: %v", err))
		return
	}

	// Create the branch
	err = s.gitService.CreateBranch(project.GitRepoPath, req.BranchName, baseBranch)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create branch: %v", err))
		return
	}

	response := map[string]interface{}{
		"project_id":   projectID,
		"branch_name":  req.BranchName,
		"base_branch":  baseBranch,
		"message":      "Branch created successfully",
	}

	writeJSON(w, http.StatusCreated, response)
}

func (s *VibeKanbanService) startTaskAttempt(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	attemptID := extractPathParam(r, "attempt_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" || attemptID == "" {
		writeError(w, http.StatusBadRequest, "Project ID, Task ID, and Attempt ID are required")
		return
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task attempt not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task attempt")
		}
		return
	}

	// Check if already running
	if attempt.Status == "running" {
		writeError(w, http.StatusConflict, "Task attempt is already running")
		return
	}

	// Create git worktree for this attempt
	fmt.Printf("Debug: Creating worktree for attempt %s, branch %s from %s\n", attemptID, attempt.Branch, attempt.BaseBranch)
	worktreePath, err := s.gitService.CreateWorktree(
		attempt.Task.Project.GitRepoPath,
		attempt.Branch,
		attempt.BaseBranch,
	)
	if err != nil {
		// Mark attempt as failed if worktree creation fails
		now := time.Now()
		attempt.Status = "failed"
		attempt.EndTime = &now
		s.db.Save(&attempt)
		
		fmt.Printf("Debug: Failed to create worktree for attempt %s: %v\n", attemptID, err)
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create worktree: %v", err))
		return
	}
	fmt.Printf("Debug: Successfully created worktree at %s\n", worktreePath)

	// Update attempt with worktree path and running status
	now := time.Now()
	attempt.WorktreePath = worktreePath
	attempt.Status = "running"
	attempt.StartTime = &now

	result = s.db.Save(&attempt)
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update task attempt")
		return
	}

	// Update parent task status to "inprogress"
	result = s.db.Model(&models.VibeTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"status":     "inprogress",
		"updated_at": now,
	})
	if result.Error != nil {
		fmt.Printf("Debug: Failed to update task status: %v\n", result.Error)
		// Don't fail the request, but log the error
	}

	// Start the process manager for this attempt
	err = s.processManager.StartExecution(
		attemptID,
		taskID,
		projectID,
		attempt.Executor,
		worktreePath,
	)
	if err != nil {
		// If process startup fails, revert attempt status
		attempt.Status = "failed"
		attempt.EndTime = &now
		s.db.Save(&attempt)
		
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to start execution: %v", err))
		return
	}

	fmt.Printf("Debug: Successfully started task attempt %s for task %s\n", attemptID, taskID)
	writeJSON(w, http.StatusOK, attempt)
}

func (s *VibeKanbanService) getAttemptDiff(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	attemptID := extractPathParam(r, "attempt_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" || attemptID == "" {
		writeError(w, http.StatusBadRequest, "Project ID, Task ID, and Attempt ID are required")
		return
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task attempt not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task attempt")
		}
		return
	}

	// Get git diff for this attempt
	diff, err := s.gitService.GetBranchDiff(
		attempt.Task.Project.GitRepoPath,
		attempt.BaseBranch,
		attempt.Branch,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get git diff: %v", err))
		return
	}

	response := map[string]interface{}{
		"attempt_id":  attemptID,
		"branch":      attempt.Branch,
		"base_branch": attempt.BaseBranch,
		"diff":        diff,
	}

	writeJSON(w, http.StatusOK, response)
}

func (s *VibeKanbanService) mergeAttempt(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	attemptID := extractPathParam(r, "attempt_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" || attemptID == "" {
		writeError(w, http.StatusBadRequest, "Project ID, Task ID, and Attempt ID are required")
		return
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task attempt not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task attempt")
		}
		return
	}

	// Verify attempt is completed
	if attempt.Status != "completed" {
		writeError(w, http.StatusBadRequest, "Can only merge completed attempts")
		return
	}

	// Merge the branch
	mergeCommit, err := s.gitService.MergeBranch(
		attempt.Task.Project.GitRepoPath,
		attempt.Branch,
		attempt.BaseBranch,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to merge branch: %v", err))
		return
	}

	// Update attempt with merge commit
	attempt.MergeCommit = mergeCommit
	result = s.db.Save(&attempt)
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update task attempt")
		return
	}

	// Update task status to completed
	now := time.Now()
	result = s.db.Model(&attempt.Task).Updates(map[string]interface{}{
		"status":     "done",
		"updated_at": now,
	})
	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update task status")
		return
	}

	response := map[string]interface{}{
		"attempt_id":   attemptID,
		"merge_commit": mergeCommit,
		"branch":       attempt.Branch,
		"base_branch":  attempt.BaseBranch,
		"status":       "merged",
	}

	writeJSON(w, http.StatusOK, response)
}

func (s *VibeKanbanService) startSetupScript(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	attemptID := extractPathParam(r, "attempt_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" || attemptID == "" {
		writeError(w, http.StatusBadRequest, "Project ID, Task ID, and Attempt ID are required")
		return
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task attempt not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task attempt")
		}
		return
	}

	// Check if setup script exists
	if attempt.Task.Project.SetupScript == "" {
		writeError(w, http.StatusBadRequest, "No setup script configured for this project")
		return
	}

	// Start setup script
	process, err := s.processManager.StartSetupScript(attemptID, attempt.Task.Project.SetupScript, attempt.WorktreePath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to start setup script: %v", err))
		return
	}

	writeJSON(w, http.StatusOK, process)
}

func (s *VibeKanbanService) startCodingAgent(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	attemptID := extractPathParam(r, "attempt_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" || attemptID == "" {
		writeError(w, http.StatusBadRequest, "Project ID, Task ID, and Attempt ID are required")
		return
	}

	var req struct {
		Executor string `json:"executor,omitempty"` // Optional: override default executor
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task attempt not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task attempt")
		}
		return
	}

	// Use request executor or default to attempt executor
	executor := req.Executor
	if executor == "" {
		executor = attempt.Executor
	}

	// Start coding agent directly
	err = s.processManager.StartCodingAgentDirect(attemptID, taskID, projectID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to start coding agent: %v", err))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":    "Coding agent started successfully",
		"attempt_id": attemptID,
		"executor":   executor,
	})
}

func (s *VibeKanbanService) startDevServer(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	attemptID := extractPathParam(r, "attempt_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" || attemptID == "" {
		writeError(w, http.StatusBadRequest, "Project ID, Task ID, and Attempt ID are required")
		return
	}

	var req struct {
		Port int `json:"port,omitempty"` // Optional: custom port
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task attempt not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task attempt")
		}
		return
	}

	// Check if dev script exists
	if attempt.Task.Project.DevScript == "" {
		writeError(w, http.StatusBadRequest, "No dev script configured for this project")
		return
	}

	// Use default port if not specified
	port := req.Port
	if port == 0 {
		port = 3000 // Default port
	}

	// Start dev server
	process, err := s.processManager.StartDevServer(attemptID, attempt.Task.Project.DevScript, attempt.WorktreePath, port)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to start dev server: %v", err))
		return
	}

	writeJSON(w, http.StatusOK, process)
}

func (s *VibeKanbanService) startFollowupExecution(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	attemptID := extractPathParam(r, "attempt_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" || attemptID == "" {
		writeError(w, http.StatusBadRequest, "Project ID, Task ID, and Attempt ID are required")
		return
	}

	var req struct {
		Prompt string `json:"prompt"` // Follow-up prompt
	}

	if err := parseJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Prompt == "" {
		writeError(w, http.StatusBadRequest, "Prompt is required for follow-up execution")
		return
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task attempt not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task attempt")
		}
		return
	}

	// Start follow-up execution
	err = s.processManager.StartFollowupExecutionDirect(attemptID, taskID, projectID, req.Prompt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to start follow-up execution: %v", err))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":    "Follow-up execution started successfully",
		"attempt_id": attemptID,
		"prompt":     req.Prompt,
	})
}

func (s *VibeKanbanService) getProcesses(w http.ResponseWriter, r *http.Request) {
	projectID := extractPathParam(r, "project_id")
	taskID := extractPathParam(r, "task_id")
	attemptID := extractPathParam(r, "attempt_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if projectID == "" || taskID == "" || attemptID == "" {
		writeError(w, http.StatusBadRequest, "Project ID, Task ID, and Attempt ID are required")
		return
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task attempt not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task attempt")
		}
		return
	}

	// Get processes from database
	var processes []models.VibeExecutionProcess
	result = s.db.Where("attempt_id = ?", attemptID).
		Order("created_at ASC").
		Find(&processes)

	if result.Error != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch processes")
		return
	}

	writeJSON(w, http.StatusOK, processes)
}

func (s *VibeKanbanService) killProcess(w http.ResponseWriter, r *http.Request) {
	processID := extractPathParam(r, "process_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if processID == "" {
		writeError(w, http.StatusBadRequest, "Process ID is required")
		return
	}

	// Verify process exists and user has access through attempt
	var process models.VibeExecutionProcess
	result := s.db.Where("id = ?", processID).
		Preload("Attempt").
		First(&process)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Process not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch process")
		}
		return
	}

	// Verify user has access to this process through the attempt
	if process.Attempt.UserID != userID {
		writeError(w, http.StatusForbidden, "Access denied to this process")
		return
	}

	// Kill the process
	err = s.processManager.KillProcess(processID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to kill process: %v", err))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":    "Process killed successfully",
		"process_id": processID,
	})
}

func (s *VibeKanbanService) getProcessOutput(w http.ResponseWriter, r *http.Request) {
	processID := extractPathParam(r, "process_id")
	userID, err := s.session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if processID == "" {
		writeError(w, http.StatusBadRequest, "Process ID is required")
		return
	}

	// Verify process exists and user has access through attempt
	var process models.VibeExecutionProcess
	result := s.db.Where("id = ?", processID).
		Preload("Attempt").
		First(&process)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Process not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch process")
		}
		return
	}

	// Verify user has access to this process through the attempt
	if process.Attempt.UserID != userID {
		writeError(w, http.StatusForbidden, "Access denied to this process")
		return
	}

	// Get process output from process manager (for live processes)
	stdout, stderr, err := s.processManager.GetProcessOutput(processID)
	if err != nil {
		// If process is not in memory, use database output
		response := map[string]interface{}{
			"process_id": processID,
			"status":     process.Status,
			"stdout":     process.StdOut,
			"stderr":     process.StdErr,
			"exit_code":  process.ExitCode,
			"start_time": process.StartTime,
			"end_time":   process.EndTime,
		}
		writeJSON(w, http.StatusOK, response)
		return
	}

	// Return live output
	response := map[string]interface{}{
		"process_id": processID,
		"status":     process.Status,
		"stdout":     stdout,
		"stderr":     stderr,
		"exit_code":  process.ExitCode,
		"start_time": process.StartTime,
		"end_time":   process.EndTime,
	}

	writeJSON(w, http.StatusOK, response)
}

// Debug endpoint to check attempt status
func (s *VibeKanbanService) getAttemptStatus(w http.ResponseWriter, r *http.Request) {
	attemptID := extractPathParam(r, "attempt_id")
	if attemptID == "" {
		writeError(w, http.StatusBadRequest, "Attempt ID is required")
		return
	}

	// Get attempt with all related data
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ?", attemptID).
		Preload("Task").
		Preload("Task.Project").
		Preload("Processes").
		First(&attempt)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			writeError(w, http.StatusNotFound, "Task attempt not found")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to fetch task attempt")
		}
		return
	}

	// Get live processes from process manager
	liveProcesses := s.processManager.GetProcessesByAttempt(attemptID)

	response := map[string]interface{}{
		"attempt_id":      attemptID,
		"status":          attempt.Status,
		"executor":        attempt.Executor,
		"branch":          attempt.Branch,
		"base_branch":     attempt.BaseBranch,
		"worktree_path":   attempt.WorktreePath,
		"start_time":      attempt.StartTime,
		"end_time":        attempt.EndTime,
		"task":            attempt.Task,
		"project":         attempt.Task.Project,
		"db_processes":    attempt.Processes,
		"live_processes":  len(liveProcesses),
	}

	writeJSON(w, http.StatusOK, response)
}

// Debug endpoint to get all running processes
func (s *VibeKanbanService) getDebugProcesses(w http.ResponseWriter, r *http.Request) {
	// Get a summary of all running processes
	s.processManager.mu.RLock()
	defer s.processManager.mu.RUnlock()
	
	var processes []map[string]interface{}
	for id, process := range s.processManager.processes {
		processes = append(processes, map[string]interface{}{
			"id":          id,
			"attempt_id":  process.AttemptID,
			"type":        process.Type,
			"status":      process.Status,
			"command":     process.Command,
			"start_time":  process.StartTime,
			"end_time":    process.EndTime,
			"exit_code":   process.ExitCode,
		})
	}
	
	response := map[string]interface{}{
		"total_processes": len(processes),
		"processes":       processes,
	}
	
	writeJSON(w, http.StatusOK, response)
}

// New creates a new HTTP ServeMux with all vibe-kanban routes
func New(d deps.Deps) *http.ServeMux {
	service := NewVibeKanbanService(d.DB, d.Session)
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		coderunner.ServeReactApp(w, r, "vibekanban/VibeKanbanApp.tsx", "VibeKanbanApp")
	})

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
	
	// Debug endpoints for monitoring task execution
	mux.HandleFunc("GET /debug/attempts/{attempt_id}/status", service.getAttemptStatus)
	mux.HandleFunc("GET /debug/processes", service.getDebugProcesses)

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
