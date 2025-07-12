package vibekanban

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/breadchris/share/db"
	"github.com/breadchris/share/models"
	"github.com/gin-gonic/gin"
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

// Project endpoints

func (s *VibeKanbanService) GetProjects(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var projects []models.VibeProject
	result := s.db.Where("user_id = ?", userID).Preload("Tasks").Find(&projects)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	c.JSON(http.StatusOK, projects)
}

func (s *VibeKanbanService) CreateProject(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		Name          string                 `json:"name" binding:"required"`
		GitRepoPath   string                 `json:"git_repo_path" binding:"required"`
		SetupScript   string                 `json:"setup_script"`
		DevScript     string                 `json:"dev_script"`
		DefaultBranch string                 `json:"default_branch"`
		Config        map[string]interface{} `json:"config"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate git repo path
	if !filepath.IsAbs(req.GitRepoPath) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Git repository path must be absolute"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}

	c.JSON(http.StatusCreated, project)
}

func (s *VibeKanbanService) GetProject(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetString("user_id")

	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).
		Preload("Tasks").
		Preload("Tasks.Attempts").
		First(&project)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch project"})
		}
		return
	}

	c.JSON(http.StatusOK, project)
}

func (s *VibeKanbanService) UpdateProject(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetString("user_id")

	var req struct {
		Name          string                 `json:"name"`
		GitRepoPath   string                 `json:"git_repo_path"`
		SetupScript   string                 `json:"setup_script"`
		DevScript     string                 `json:"dev_script"`
		DefaultBranch string                 `json:"default_branch"`
		Config        map[string]interface{} `json:"config"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch project"})
		}
		return
	}

	// Update fields
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.GitRepoPath != "" {
		if !filepath.IsAbs(req.GitRepoPath) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Git repository path must be absolute"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
		return
	}

	c.JSON(http.StatusOK, project)
}

func (s *VibeKanbanService) DeleteProject(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetString("user_id")

	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).Delete(&models.VibeProject{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

// Task endpoints

func (s *VibeKanbanService) GetTasks(c *gin.Context) {
	projectID := c.Param("project_id")
	userID := c.GetString("user_id")

	// Verify project belongs to user
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify project"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

func (s *VibeKanbanService) CreateTask(c *gin.Context) {
	projectID := c.Param("project_id")
	userID := c.GetString("user_id")

	// Verify project belongs to user
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify project"})
		}
		return
	}

	var req struct {
		Title       string                 `json:"title" binding:"required"`
		Description string                 `json:"description"`
		Status      string                 `json:"status"`
		Priority    string                 `json:"priority"`
		Labels      []string               `json:"labels"`
		Metadata    map[string]interface{} `json:"metadata"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	c.JSON(http.StatusCreated, task)
}

func (s *VibeKanbanService) UpdateTask(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	userID := c.GetString("user_id")

	var req struct {
		Title       string                 `json:"title"`
		Description string                 `json:"description"`
		Status      string                 `json:"status"`
		Priority    string                 `json:"priority"`
		Labels      []string               `json:"labels"`
		Metadata    map[string]interface{} `json:"metadata"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var task models.VibeTask
	result := s.db.Where("id = ? AND project_id = ? AND user_id = ?", taskID, projectID, userID).First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch task"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	c.JSON(http.StatusOK, task)
}

func (s *VibeKanbanService) DeleteTask(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	userID := c.GetString("user_id")

	result := s.db.Where("id = ? AND project_id = ? AND user_id = ?", taskID, projectID, userID).Delete(&models.VibeTask{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

// Task Attempt endpoints

func (s *VibeKanbanService) GetTaskAttempts(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	userID := c.GetString("user_id")

	// Verify task belongs to user
	var task models.VibeTask
	result := s.db.Where("id = ? AND project_id = ? AND user_id = ?", taskID, projectID, userID).First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify task"})
		}
		return
	}

	var attempts []models.VibeTaskAttempt
	result = s.db.Where("task_id = ?", taskID).
		Preload("Processes").
		Preload("Sessions").
		Find(&attempts)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attempts"})
		return
	}

	c.JSON(http.StatusOK, attempts)
}

func (s *VibeKanbanService) CreateTaskAttempt(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	userID := c.GetString("user_id")

	// Verify task belongs to user
	var task models.VibeTask
	result := s.db.Where("id = ? AND project_id = ? AND user_id = ?", taskID, projectID, userID).First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify task"})
		}
		return
	}

	var req struct {
		Executor      string                 `json:"executor" binding:"required"`
		BaseBranch    string                 `json:"base_branch"`
		Configuration map[string]interface{} `json:"configuration"`
		Metadata      map[string]interface{} `json:"metadata"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	attempt := models.VibeTaskAttempt{
		Model: models.Model{
			ID: uuid.NewString(),
		},
		TaskID:        taskID,
		Executor:      req.Executor,
		BaseBranch:    req.BaseBranch,
		Status:        "pending",
		UserID:        userID,
		Configuration: models.MakeJSONField(req.Configuration),
		Metadata:      models.MakeJSONField(req.Metadata),
	}

	if attempt.BaseBranch == "" {
		// Get project to use default branch
		var project models.VibeProject
		s.db.Where("id = ?", projectID).First(&project)
		attempt.BaseBranch = project.DefaultBranch
	}

	result = s.db.Create(&attempt)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create attempt"})
		return
	}

	c.JSON(http.StatusCreated, attempt)
}

// Git endpoints

func (s *VibeKanbanService) GetProjectBranches(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetString("user_id")

	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch project"})
		}
		return
	}

	branches, err := s.gitService.GetBranches(project.GitRepoPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get branches: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"branches": branches})
}

func (s *VibeKanbanService) CreateProjectBranch(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetString("user_id")

	var req struct {
		BranchName string `json:"branch_name" binding:"required"`
		BaseBranch string `json:"base_branch" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch project"})
		}
		return
	}

	err := s.gitService.CreateBranch(project.GitRepoPath, req.BranchName, req.BaseBranch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create branch: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Branch created successfully"})
}

func (s *VibeKanbanService) StartTaskAttempt(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	attemptID := c.Param("attempt_id")
	userID := c.GetString("user_id")

	// Verify attempt belongs to user
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify attempt"})
		}
		return
	}

	if attempt.Task.Project.ID != projectID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project ID mismatch"})
		return
	}

	// Create worktree for isolated execution
	worktreePath, branchName, err := s.gitService.CreateWorktree(
		attempt.Task.Project.GitRepoPath,
		attempt.BaseBranch,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create worktree: %v", err)})
		return
	}

	// Update attempt with worktree info
	now := time.Now()
	attempt.WorktreePath = worktreePath
	attempt.Branch = branchName
	attempt.Status = "running"
	attempt.StartTime = &now

	result = s.db.Save(&attempt)
	if result.Error != nil {
		// Cleanup worktree on failure
		s.gitService.RemoveWorktree(attempt.Task.Project.GitRepoPath, worktreePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update attempt"})
		return
	}

	c.JSON(http.StatusOK, attempt)
}

func (s *VibeKanbanService) GetAttemptDiff(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	attemptID := c.Param("attempt_id")
	userID := c.GetString("user_id")

	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify attempt"})
		}
		return
	}

	if attempt.WorktreePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Worktree not initialized"})
		return
	}

	diff, err := s.gitService.GetDiffFromBaseBranch(attempt.WorktreePath, attempt.BaseBranch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get diff: %v", err)})
		return
	}

	// Cache the diff in the database
	attempt.GitDiff = diff
	s.db.Save(&attempt)

	c.JSON(http.StatusOK, gin.H{"diff": diff})
}

func (s *VibeKanbanService) MergeAttempt(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	attemptID := c.Param("attempt_id")
	userID := c.GetString("user_id")

	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify attempt"})
		}
		return
	}

	if attempt.WorktreePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Worktree not initialized"})
		return
	}

	// Commit changes in worktree
	commitMessage := fmt.Sprintf("Vibe Kanban Task: %s", attempt.Task.Title)
	commitHash, err := s.gitService.CommitChanges(attempt.WorktreePath, commitMessage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to commit changes: %v", err)})
		return
	}

	// Merge branch into base branch
	mergeCommitHash, err := s.gitService.MergeBranch(
		attempt.Task.Project.GitRepoPath,
		attempt.Branch,
		attempt.BaseBranch,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to merge branch: %v", err)})
		return
	}

	// Update attempt
	now := time.Now()
	attempt.MergeCommit = mergeCommitHash
	attempt.Status = "completed"
	attempt.EndTime = &now

	result = s.db.Save(&attempt)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update attempt"})
		return
	}

	// Update task status
	attempt.Task.Status = "done"
	s.db.Save(attempt.Task)

	// Cleanup worktree
	s.gitService.RemoveWorktree(attempt.Task.Project.GitRepoPath, attempt.WorktreePath)

	c.JSON(http.StatusOK, gin.H{
		"message":           "Changes merged successfully",
		"commit_hash":       commitHash,
		"merge_commit_hash": mergeCommitHash,
	})
}

// Process Management endpoints

func (s *VibeKanbanService) StartSetupScript(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	attemptID := c.Param("attempt_id")
	userID := c.GetString("user_id")

	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify attempt"})
		}
		return
	}

	if attempt.WorktreePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Worktree not initialized"})
		return
	}

	process, err := s.processManager.StartSetupScript(
		attemptID,
		attempt.Task.Project.SetupScript,
		attempt.WorktreePath,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to start setup script: %v", err)})
		return
	}

	c.JSON(http.StatusOK, process)
}

func (s *VibeKanbanService) StartCodingAgent(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	attemptID := c.Param("attempt_id")
	userID := c.GetString("user_id")

	var req struct {
		Prompt string `json:"prompt" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify attempt"})
		}
		return
	}

	if attempt.WorktreePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Worktree not initialized"})
		return
	}

	process, err := s.processManager.StartCodingAgent(
		attemptID,
		attempt.Executor,
		req.Prompt,
		attempt.WorktreePath,
		nil, // env vars
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to start coding agent: %v", err)})
		return
	}

	c.JSON(http.StatusOK, process)
}

func (s *VibeKanbanService) StartDevServer(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	attemptID := c.Param("attempt_id")
	userID := c.GetString("user_id")

	var req struct {
		Port int `json:"port"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify attempt"})
		}
		return
	}

	if attempt.WorktreePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Worktree not initialized"})
		return
	}

	port := req.Port
	if port == 0 {
		port = 3000 // default port
	}

	process, err := s.processManager.StartDevServer(
		attemptID,
		attempt.Task.Project.DevScript,
		attempt.WorktreePath,
		port,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to start dev server: %v", err)})
		return
	}

	c.JSON(http.StatusOK, process)
}

func (s *VibeKanbanService) GetProcesses(c *gin.Context) {
	projectID := c.Param("project_id")
	taskID := c.Param("task_id")
	attemptID := c.Param("attempt_id")
	userID := c.GetString("user_id")

	// Verify attempt belongs to user
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify attempt"})
		}
		return
	}

	var processes []models.VibeExecutionProcess
	result = s.db.Where("attempt_id = ?", attemptID).Find(&processes)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch processes"})
		return
	}

	c.JSON(http.StatusOK, processes)
}

func (s *VibeKanbanService) KillProcess(c *gin.Context) {
	processID := c.Param("process_id")
	userID := c.GetString("user_id")

	// Verify process belongs to user's attempt
	var process models.VibeExecutionProcess
	result := s.db.Where("id = ?", processID).
		Preload("Attempt").
		First(&process)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Process not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify process"})
		}
		return
	}

	if process.Attempt.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	err := s.processManager.KillProcess(processID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to kill process: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Process killed successfully"})
}

func (s *VibeKanbanService) GetProcessOutput(c *gin.Context) {
	processID := c.Param("process_id")
	userID := c.GetString("user_id")

	// Verify process belongs to user's attempt
	var process models.VibeExecutionProcess
	result := s.db.Where("id = ?", processID).
		Preload("Attempt").
		First(&process)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Process not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify process"})
		}
		return
	}

	if process.Attempt.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	stdout, stderr, err := s.processManager.GetProcessOutput(processID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get process output: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stdout": stdout,
		"stderr": stderr,
	})
}

// Mount routes
func (s *VibeKanbanService) RegisterRoutes(r *gin.RouterGroup) {
	// Projects
	projects := r.Group("/projects")
	{
		projects.GET("", s.GetProjects)
		projects.POST("", s.CreateProject)
		projects.GET("/:id", s.GetProject)
		projects.PUT("/:id", s.UpdateProject)
		projects.DELETE("/:id", s.DeleteProject)

		// Git operations for projects
		projects.GET("/:id/branches", s.GetProjectBranches)
		projects.POST("/:id/branches", s.CreateProjectBranch)

		// Tasks
		tasks := projects.Group("/:project_id/tasks")
		{
			tasks.GET("", s.GetTasks)
			tasks.POST("", s.CreateTask)
			tasks.PUT("/:task_id", s.UpdateTask)
			tasks.DELETE("/:task_id", s.DeleteTask)

			// Task attempts
			attempts := tasks.Group("/:task_id/attempts")
			{
				attempts.GET("", s.GetTaskAttempts)
				attempts.POST("", s.CreateTaskAttempt)
				attempts.POST("/:attempt_id/start", s.StartTaskAttempt)
				attempts.GET("/:attempt_id/diff", s.GetAttemptDiff)
				attempts.POST("/:attempt_id/merge", s.MergeAttempt)
			}
		}
	}
}

// Utility functions for integration with main.go

func SetupVibeKanbanRoutes(db *gorm.DB, r *gin.Engine) {
	service := NewVibeKanbanService(db)
	api := r.Group("/api/vibe-kanban")
	service.RegisterRoutes(api)
}