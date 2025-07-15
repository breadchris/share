package vibekanban

import (
	"fmt"
	"path/filepath"
	"time"

	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Business logic functions extracted from HTTP handlers
// These can be reused by both HTTP and ConnectRPC services

// Project business logic

<<<<<<< HEAD
func (s *Service) listProjectsLogic(userID string) ([]models.VibeProject, error) {
=======
func (s *VibeKanbanService) listProjectsLogic(userID string) ([]models.VibeProject, error) {
>>>>>>> ca39096 (update)
	var projects []models.VibeProject
	result := s.db.Where("user_id = ?", userID).Find(&projects)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch projects: %w", result.Error)
	}
	return projects, nil
}

<<<<<<< HEAD
func (s *Service) getProjectLogic(projectID, userID string) (*models.VibeProject, error) {
=======
func (s *VibeKanbanService) getProjectLogic(projectID, userID string) (*models.VibeProject, error) {
>>>>>>> ca39096 (update)
	if projectID == "" {
		return nil, fmt.Errorf("project ID is required")
	}

	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).
		Preload("Tasks").
		Preload("Tasks.Attempts").
		First(&project)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("project not found")
		}
		return nil, fmt.Errorf("failed to fetch project: %w", result.Error)
	}

	return &project, nil
}

type CreateProjectRequest struct {
	Name          string
	GitRepoPath   string
	SetupScript   string
	DevScript     string
	DefaultBranch string
	Config        map[string]interface{}
}

<<<<<<< HEAD
func (s *Service) createProjectLogic(req CreateProjectRequest, userID string) (*models.VibeProject, error) {
=======
func (s *VibeKanbanService) createProjectLogic(req CreateProjectRequest, userID string) (*models.VibeProject, error) {
>>>>>>> ca39096 (update)
	// Validate required fields
	if req.Name == "" {
		return nil, fmt.Errorf("name is required")
	}
	if req.GitRepoPath == "" {
		return nil, fmt.Errorf("git_repo_path is required")
	}

	// Validate git repo path
	if !filepath.IsAbs(req.GitRepoPath) {
		return nil, fmt.Errorf("git repository path must be absolute")
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
		return nil, fmt.Errorf("failed to create project: %w", result.Error)
	}

	return &project, nil
}

type UpdateProjectRequest struct {
	Name          string
	GitRepoPath   string
	SetupScript   string
	DevScript     string
	DefaultBranch string
	Config        map[string]interface{}
}

<<<<<<< HEAD
func (s *Service) updateProjectLogic(projectID, userID string, req UpdateProjectRequest) (*models.VibeProject, error) {
=======
func (s *VibeKanbanService) updateProjectLogic(projectID, userID string, req UpdateProjectRequest) (*models.VibeProject, error) {
>>>>>>> ca39096 (update)
	if projectID == "" {
		return nil, fmt.Errorf("project ID is required")
	}

	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("project not found")
		}
		return nil, fmt.Errorf("failed to fetch project: %w", result.Error)
	}

	// Update fields
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.GitRepoPath != "" {
		if !filepath.IsAbs(req.GitRepoPath) {
			return nil, fmt.Errorf("git repository path must be absolute")
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
		return nil, fmt.Errorf("failed to update project: %w", result.Error)
	}

	return &project, nil
}

<<<<<<< HEAD
func (s *Service) deleteProjectLogic(projectID, userID string) error {
=======
func (s *VibeKanbanService) deleteProjectLogic(projectID, userID string) error {
>>>>>>> ca39096 (update)
	if projectID == "" {
		return fmt.Errorf("project ID is required")
	}

	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).Delete(&models.VibeProject{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete project: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("project not found")
	}

	return nil
}

// Task business logic

<<<<<<< HEAD
func (s *Service) getTasksLogic(projectID, userID string) ([]models.VibeTask, error) {
=======
func (s *VibeKanbanService) getTasksLogic(projectID, userID string) ([]models.VibeTask, error) {
>>>>>>> ca39096 (update)
	if projectID == "" {
		return nil, fmt.Errorf("project ID is required")
	}

	// Verify project belongs to user
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("project not found")
		}
		return nil, fmt.Errorf("failed to verify project: %w", result.Error)
	}

	var tasks []models.VibeTask
	result = s.db.Where("project_id = ?", projectID).
		Preload("Attempts").
		Preload("Attempts.Processes").
		Preload("Attempts.Sessions").
		Find(&tasks)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch tasks: %w", result.Error)
	}

	return tasks, nil
}

type CreateTaskRequest struct {
	Title       string
	Description string
	Status      string
	Priority    string
	Labels      []string
	Metadata    map[string]interface{}
}

<<<<<<< HEAD
func (s *Service) createTaskLogic(projectID, userID string, req CreateTaskRequest) (*models.VibeTask, error) {
=======
func (s *VibeKanbanService) createTaskLogic(projectID, userID string, req CreateTaskRequest) (*models.VibeTask, error) {
>>>>>>> ca39096 (update)
	if projectID == "" {
		return nil, fmt.Errorf("project ID is required")
	}

	// Verify project belongs to user
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("project not found")
		}
		return nil, fmt.Errorf("failed to verify project: %w", result.Error)
	}

	if req.Title == "" {
		return nil, fmt.Errorf("title is required")
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
		return nil, fmt.Errorf("failed to create task: %w", result.Error)
	}

	return &task, nil
}

type UpdateTaskRequest struct {
	Title       string
	Description string
	Status      string
	Priority    string
	Labels      []string
	Metadata    map[string]interface{}
}

<<<<<<< HEAD
func (s *Service) updateTaskLogic(taskID, userID string, req UpdateTaskRequest) (*models.VibeTask, error) {
=======
func (s *VibeKanbanService) updateTaskLogic(taskID, userID string, req UpdateTaskRequest) (*models.VibeTask, error) {
>>>>>>> ca39096 (update)
	if taskID == "" {
		return nil, fmt.Errorf("task ID is required")
	}

	var task models.VibeTask
	result := s.db.Where("id = ? AND user_id = ?", taskID, userID).First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("task not found")
		}
		return nil, fmt.Errorf("failed to fetch task: %w", result.Error)
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
		return nil, fmt.Errorf("failed to update task: %w", result.Error)
	}

	return &task, nil
}

<<<<<<< HEAD
func (s *Service) deleteTaskLogic(taskID, userID string) error {
=======
func (s *VibeKanbanService) deleteTaskLogic(taskID, userID string) error {
>>>>>>> ca39096 (update)
	if taskID == "" {
		return fmt.Errorf("task ID is required")
	}

	result := s.db.Where("id = ? AND user_id = ?", taskID, userID).Delete(&models.VibeTask{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete task: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("task not found")
	}

	return nil
}

// Task Attempt business logic

<<<<<<< HEAD
func (s *Service) getTaskAttemptsLogic(taskID, userID string) ([]models.VibeTaskAttempt, error) {
=======
func (s *VibeKanbanService) getTaskAttemptsLogic(taskID, userID string) ([]models.VibeTaskAttempt, error) {
>>>>>>> ca39096 (update)
	if taskID == "" {
		return nil, fmt.Errorf("task ID is required")
	}

	// Verify task exists and user has access
	var task models.VibeTask
	result := s.db.Where("id = ? AND user_id = ?", taskID, userID).First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("task not found")
		}
		return nil, fmt.Errorf("failed to fetch task: %w", result.Error)
	}

	// Get task attempts with associated processes
	var attempts []models.VibeTaskAttempt
	result = s.db.Where("task_id = ?", taskID).
		Preload("Processes").
		Order("created_at DESC").
		Find(&attempts)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch task attempts: %w", result.Error)
	}

	return attempts, nil
}

type CreateTaskAttemptRequest struct {
	Executor   string
	BaseBranch string
}

<<<<<<< HEAD
func (s *Service) createTaskAttemptLogic(taskID, userID string, req CreateTaskAttemptRequest) (*models.VibeTaskAttempt, error) {
=======
func (s *VibeKanbanService) createTaskAttemptLogic(taskID, userID string, req CreateTaskAttemptRequest) (*models.VibeTaskAttempt, error) {
>>>>>>> ca39096 (update)
	if taskID == "" {
		return nil, fmt.Errorf("task ID is required")
	}

	// Validate executor
	if req.Executor == "" {
		req.Executor = "claude" // Default executor
	}

	// Verify task exists and user has access
	var task models.VibeTask
	result := s.db.Where("id = ? AND user_id = ?", taskID, userID).
		Preload("Project").
		First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("task not found")
		}
		return nil, fmt.Errorf("failed to fetch task: %w", result.Error)
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
		return nil, fmt.Errorf("failed to create task attempt: %w", result.Error)
	}

	// Load the created attempt with associations
	s.db.Preload("Processes").Find(&attempt, "id = ?", attemptID)

	return &attempt, nil
}

<<<<<<< HEAD
func (s *Service) startTaskAttemptLogic(attemptID, taskID, userID string) (*models.VibeTaskAttempt, error) {
=======
func (s *VibeKanbanService) startTaskAttemptLogic(attemptID, taskID, userID string) (*models.VibeTaskAttempt, error) {
>>>>>>> ca39096 (update)
	if attemptID == "" || taskID == "" {
		return nil, fmt.Errorf("attempt ID and task ID are required")
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("task attempt not found")
		}
		return nil, fmt.Errorf("failed to fetch task attempt: %w", result.Error)
	}

	// Check if already running
	if attempt.Status == "running" {
		return nil, fmt.Errorf("task attempt is already running")
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
		return nil, fmt.Errorf("failed to create worktree: %w", err)
	}
	fmt.Printf("Debug: Successfully created worktree at %s\n", worktreePath)

	// Update attempt with worktree path and running status
	now := time.Now()
	attempt.WorktreePath = worktreePath
	attempt.Status = "running"
	attempt.StartTime = &now

	result = s.db.Save(&attempt)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update task attempt: %w", result.Error)
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
		attempt.Task.ProjectID,
		attempt.Executor,
		worktreePath,
	)
	if err != nil {
		// If process startup fails, revert attempt status
		attempt.Status = "failed"
		attempt.EndTime = &now
		s.db.Save(&attempt)

		return nil, fmt.Errorf("failed to start execution: %w", err)
	}

	fmt.Printf("Debug: Successfully started task attempt %s for task %s\n", attemptID, taskID)
	return &attempt, nil
}

// Git operations business logic

<<<<<<< HEAD
func (s *Service) getProjectBranchesLogic(projectID, userID string) (map[string]interface{}, error) {
=======
func (s *VibeKanbanService) getProjectBranchesLogic(projectID, userID string) (map[string]interface{}, error) {
>>>>>>> ca39096 (update)
	if projectID == "" {
		return nil, fmt.Errorf("project ID is required")
	}

	// Verify project exists and user has access
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("project not found")
		}
		return nil, fmt.Errorf("failed to fetch project: %w", result.Error)
	}

	// Validate git repository
	if err := s.gitService.ValidateRepository(project.GitRepoPath); err != nil {
		return nil, fmt.Errorf("invalid git repository: %w", err)
	}

	// Get branches
	branches, err := s.gitService.GetBranches(project.GitRepoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get branches: %w", err)
	}

	// Get repository status
	status, err := s.gitService.GetRepositoryStatus(project.GitRepoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get repository status: %w", err)
	}

	response := map[string]interface{}{
		"project_id":     projectID,
		"branches":       branches,
		"current_branch": status.CurrentBranch,
		"commit_hash":    status.CommitHash,
		"is_clean":       status.IsClean,
		"modified_files": status.ModifiedFiles,
		"added_files":    status.AddedFiles,
		"deleted_files":  status.DeletedFiles,
	}

	return response, nil
}

type CreateProjectBranchRequest struct {
	BranchName string
	BaseBranch string
}

<<<<<<< HEAD
func (s *Service) createProjectBranchLogic(projectID, userID string, req CreateProjectBranchRequest) (map[string]interface{}, error) {
=======
func (s *VibeKanbanService) createProjectBranchLogic(projectID, userID string, req CreateProjectBranchRequest) (map[string]interface{}, error) {
>>>>>>> ca39096 (update)
	if projectID == "" {
		return nil, fmt.Errorf("project ID is required")
	}

	if req.BranchName == "" {
		return nil, fmt.Errorf("branch name is required")
	}

	// Verify project exists and user has access
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("project not found")
		}
		return nil, fmt.Errorf("failed to fetch project: %w", result.Error)
	}

	// Use default branch if base branch not specified
	baseBranch := req.BaseBranch
	if baseBranch == "" {
		baseBranch = project.DefaultBranch
	}

	// Validate git repository
	if err := s.gitService.ValidateRepository(project.GitRepoPath); err != nil {
		return nil, fmt.Errorf("invalid git repository: %w", err)
	}

	// Create the branch
	err := s.gitService.CreateBranch(project.GitRepoPath, req.BranchName, baseBranch)
	if err != nil {
		return nil, fmt.Errorf("failed to create branch: %w", err)
	}

	response := map[string]interface{}{
		"project_id":  projectID,
		"branch_name": req.BranchName,
		"base_branch": baseBranch,
		"message":     "Branch created successfully",
	}

	return response, nil
}

<<<<<<< HEAD
func (s *Service) getAttemptDiffLogic(attemptID, taskID, userID string) (map[string]interface{}, error) {
=======
func (s *VibeKanbanService) getAttemptDiffLogic(attemptID, taskID, userID string) (map[string]interface{}, error) {
>>>>>>> ca39096 (update)
	if attemptID == "" || taskID == "" {
		return nil, fmt.Errorf("attempt ID and task ID are required")
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("task attempt not found")
		}
		return nil, fmt.Errorf("failed to fetch task attempt: %w", result.Error)
	}

	// Get git diff for this attempt
	diff, err := s.gitService.GetBranchDiff(
		attempt.Task.Project.GitRepoPath,
		attempt.BaseBranch,
		attempt.Branch,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get git diff: %w", err)
	}

	response := map[string]interface{}{
		"attempt_id":  attemptID,
		"branch":      attempt.Branch,
		"base_branch": attempt.BaseBranch,
		"diff":        diff,
	}

	return response, nil
}

<<<<<<< HEAD
func (s *Service) mergeAttemptLogic(attemptID, taskID, userID string, commitMessage string) (map[string]interface{}, error) {
=======
func (s *VibeKanbanService) mergeAttemptLogic(attemptID, taskID, userID string, commitMessage string) (map[string]interface{}, error) {
>>>>>>> ca39096 (update)
	if attemptID == "" || taskID == "" {
		return nil, fmt.Errorf("attempt ID and task ID are required")
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND task_id = ? AND user_id = ?", attemptID, taskID, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("task attempt not found")
		}
		return nil, fmt.Errorf("failed to fetch task attempt: %w", result.Error)
	}

	// Verify attempt is completed
	if attempt.Status != "completed" {
		return nil, fmt.Errorf("can only merge completed attempts")
	}

	// Merge the branch
	mergeCommit, err := s.gitService.MergeBranch(
		attempt.Task.Project.GitRepoPath,
		attempt.Branch,
		attempt.BaseBranch,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to merge branch: %w", err)
	}

	// Update attempt with merge commit
	attempt.MergeCommit = mergeCommit
	result = s.db.Save(&attempt)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update task attempt: %w", result.Error)
	}

	// Update task status to completed
	now := time.Now()
	result = s.db.Model(&attempt.Task).Updates(map[string]interface{}{
		"status":     "done",
		"updated_at": now,
	})
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update task status: %w", result.Error)
	}

	response := map[string]interface{}{
		"attempt_id":   attemptID,
		"merge_commit": mergeCommit,
		"branch":       attempt.Branch,
		"base_branch":  attempt.BaseBranch,
		"status":       "merged",
	}

	return response, nil
<<<<<<< HEAD
}
=======
}
>>>>>>> ca39096 (update)
