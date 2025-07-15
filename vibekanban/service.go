package vibekanban

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	"github.com/breadchris/share/gen/proto/vibekanban/vibekanbanconnect"
	"github.com/breadchris/share/vibekanban/process"
	"strings"
	"time"

	"github.com/breadchris/share/gen/proto/vibekanban"
	"github.com/breadchris/share/models"
	"github.com/breadchris/share/session"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"
)

// Service implements the VibeKanbanService ConnectRPC service
type Service struct {
	vibekanbanconnect.UnimplementedVibeKanbanServiceHandler
	db             *gorm.DB
	session        *session.SessionManager
	gitService     *GitService
	processManager *process.ProcessManager
}

var _ vibekanbanconnect.VibeKanbanServiceHandler = (*Service)(nil)

// NewService creates a new VibeKanban service instance
func NewService(database *gorm.DB, sessionManager *session.SessionManager) *Service {
	return &Service{
		db:             database,
		session:        sessionManager,
		gitService:     NewGitService(),
		processManager: process.NewProcessManager(database),
	}
}

// Helper function to get user ID from context
func (s *Service) getUserID(ctx context.Context) (string, error) {
	return s.session.GetUserID(ctx)
}

// Conversion helpers from GORM models to protobuf messages

func (s *Service) projectToProto(project *models.VibeProject) *vibekanban.Project {
	p := &vibekanban.Project{
		Id:            project.ID,
		Name:          project.Name,
		GitRepoPath:   project.GitRepoPath,
		SetupScript:   project.SetupScript,
		DevScript:     project.DevScript,
		DefaultBranch: project.DefaultBranch,
		UserId:        project.UserID,
		Config:        make(map[string]string),
		CreatedAt:     timestamppb.New(project.CreatedAt),
		UpdatedAt:     timestamppb.New(project.UpdatedAt),
	}

	// Convert config if it exists
	if project.Config != nil && project.Config.Data != nil {
		for k, v := range project.Config.Data {
			if str, ok := v.(string); ok {
				p.Config[k] = str
			}
		}
	}

	// Convert tasks if loaded
	for _, task := range project.Tasks {
		p.Tasks = append(p.Tasks, s.taskToProto(&task))
	}

	return p
}

func (s *Service) taskToProto(task *models.VibeTask) *vibekanban.Task {
	t := &vibekanban.Task{
		Id:          task.ID,
		Title:       task.Title,
		Description: task.Description,
		Status:      stringToTaskStatus(task.Status),
		Priority:    stringToTaskPriority(task.Priority),
		ProjectId:   task.ProjectID,
		UserId:      task.UserID,
		Labels:      task.Labels,
		Metadata:    make(map[string]string),
		CreatedAt:   timestamppb.New(task.CreatedAt),
		UpdatedAt:   timestamppb.New(task.UpdatedAt),
	}

	// Convert metadata if it exists
	if task.Metadata != nil && task.Metadata.Data != nil {
		for k, v := range task.Metadata.Data {
			if str, ok := v.(string); ok {
				t.Metadata[k] = str
			}
		}
	}

	// Convert attempts if loaded
	for _, attempt := range task.Attempts {
		t.Attempts = append(t.Attempts, s.attemptToProto(&attempt))
	}

	return t
}

func (s *Service) attemptToProto(attempt *models.VibeTaskAttempt) *vibekanban.TaskAttempt {
	a := &vibekanban.TaskAttempt{
		Id:           attempt.ID,
		TaskId:       attempt.TaskID,
		WorktreePath: attempt.WorktreePath,
		Branch:       attempt.Branch,
		BaseBranch:   attempt.BaseBranch,
		MergeCommit:  attempt.MergeCommit,
		Executor:     attempt.Executor,
		Status:       stringToAttemptStatus(attempt.Status),
		PrUrl:        attempt.PRURL,
		UserId:       attempt.UserID,
		CreatedAt:    timestamppb.New(attempt.CreatedAt),
		UpdatedAt:    timestamppb.New(attempt.UpdatedAt),
	}

	if attempt.StartTime != nil {
		a.StartTime = timestamppb.New(*attempt.StartTime)
	}
	if attempt.EndTime != nil {
		a.EndTime = timestamppb.New(*attempt.EndTime)
	}

	// Convert processes if loaded
	for _, process := range attempt.Processes {
		a.Processes = append(a.Processes, s.processToProto(&process))
	}

	return a
}

func (s *Service) processToProto(process *models.VibeExecutionProcess) *vibekanban.ExecutionProcess {
	p := &vibekanban.ExecutionProcess{
		Id:        process.ID,
		AttemptId: process.AttemptID,
		Type:      stringToProcessType(process.Type),
		Status:    stringToProcessStatus(process.Status),
		Command:   process.Command,
		ProcessId: int32(process.ProcessID),
		Stdout:    process.StdOut,
		Stderr:    process.StdErr,
		ExitCode:  int32(0), // TODO: handle nil properly
		Port:      int32(process.Port),
		Url:       process.URL,
		Metadata:  make(map[string]string),
		CreatedAt: timestamppb.New(process.CreatedAt),
		UpdatedAt: timestamppb.New(process.UpdatedAt),
	}

	if process.StartTime != nil {
		p.StartTime = timestamppb.New(*process.StartTime)
	}
	if process.EndTime != nil {
		p.EndTime = timestamppb.New(*process.EndTime)
	}

	// Convert metadata if it exists
	if process.Metadata != nil && process.Metadata.Data != nil {
		for k, v := range process.Metadata.Data {
			if str, ok := v.(string); ok {
				p.Metadata[k] = str
			}
		}
	}

	return p
}

// Enum conversion helpers
func stringToTaskStatus(status string) vibekanban.TaskStatus {
	switch strings.ToLower(status) {
	case "todo":
		return vibekanban.TaskStatus_TASK_STATUS_TODO
	case "inprogress":
		return vibekanban.TaskStatus_TASK_STATUS_IN_PROGRESS
	case "inreview":
		return vibekanban.TaskStatus_TASK_STATUS_IN_REVIEW
	case "done":
		return vibekanban.TaskStatus_TASK_STATUS_DONE
	case "cancelled":
		return vibekanban.TaskStatus_TASK_STATUS_CANCELLED
	default:
		return vibekanban.TaskStatus_TASK_STATUS_TODO
	}
}

func taskStatusToString(status vibekanban.TaskStatus) string {
	switch status {
	case vibekanban.TaskStatus_TASK_STATUS_TODO:
		return "todo"
	case vibekanban.TaskStatus_TASK_STATUS_IN_PROGRESS:
		return "inprogress"
	case vibekanban.TaskStatus_TASK_STATUS_IN_REVIEW:
		return "inreview"
	case vibekanban.TaskStatus_TASK_STATUS_DONE:
		return "done"
	case vibekanban.TaskStatus_TASK_STATUS_CANCELLED:
		return "cancelled"
	default:
		return "todo"
	}
}

func stringToTaskPriority(priority string) vibekanban.TaskPriority {
	switch strings.ToLower(priority) {
	case "low":
		return vibekanban.TaskPriority_TASK_PRIORITY_LOW
	case "medium":
		return vibekanban.TaskPriority_TASK_PRIORITY_MEDIUM
	case "high":
		return vibekanban.TaskPriority_TASK_PRIORITY_HIGH
	default:
		return vibekanban.TaskPriority_TASK_PRIORITY_MEDIUM
	}
}

func taskPriorityToString(priority vibekanban.TaskPriority) string {
	switch priority {
	case vibekanban.TaskPriority_TASK_PRIORITY_LOW:
		return "low"
	case vibekanban.TaskPriority_TASK_PRIORITY_MEDIUM:
		return "medium"
	case vibekanban.TaskPriority_TASK_PRIORITY_HIGH:
		return "high"
	default:
		return "medium"
	}
}

func stringToAttemptStatus(status string) vibekanban.AttemptStatus {
	switch strings.ToLower(status) {
	case "pending":
		return vibekanban.AttemptStatus_ATTEMPT_STATUS_PENDING
	case "running":
		return vibekanban.AttemptStatus_ATTEMPT_STATUS_RUNNING
	case "completed":
		return vibekanban.AttemptStatus_ATTEMPT_STATUS_COMPLETED
	case "failed":
		return vibekanban.AttemptStatus_ATTEMPT_STATUS_FAILED
	default:
		return vibekanban.AttemptStatus_ATTEMPT_STATUS_PENDING
	}
}

func attemptStatusToString(status vibekanban.AttemptStatus) string {
	switch status {
	case vibekanban.AttemptStatus_ATTEMPT_STATUS_PENDING:
		return "pending"
	case vibekanban.AttemptStatus_ATTEMPT_STATUS_RUNNING:
		return "running"
	case vibekanban.AttemptStatus_ATTEMPT_STATUS_COMPLETED:
		return "completed"
	case vibekanban.AttemptStatus_ATTEMPT_STATUS_FAILED:
		return "failed"
	default:
		return "pending"
	}
}

func stringToProcessType(processType string) vibekanban.ProcessType {
	switch strings.ToLower(processType) {
	case "setupscript":
		return vibekanban.ProcessType_PROCESS_TYPE_SETUP_SCRIPT
	case "codingagent":
		return vibekanban.ProcessType_PROCESS_TYPE_CODING_AGENT
	case "devserver":
		return vibekanban.ProcessType_PROCESS_TYPE_DEV_SERVER
	default:
		return vibekanban.ProcessType_PROCESS_TYPE_CODING_AGENT
	}
}

func processTypeToString(processType vibekanban.ProcessType) string {
	switch processType {
	case vibekanban.ProcessType_PROCESS_TYPE_SETUP_SCRIPT:
		return "setupscript"
	case vibekanban.ProcessType_PROCESS_TYPE_CODING_AGENT:
		return "codingagent"
	case vibekanban.ProcessType_PROCESS_TYPE_DEV_SERVER:
		return "devserver"
	default:
		return "codingagent"
	}
}

func stringToProcessStatus(status string) vibekanban.ProcessStatus {
	switch strings.ToLower(status) {
	case "pending":
		return vibekanban.ProcessStatus_PROCESS_STATUS_PENDING
	case "running":
		return vibekanban.ProcessStatus_PROCESS_STATUS_RUNNING
	case "completed":
		return vibekanban.ProcessStatus_PROCESS_STATUS_COMPLETED
	case "failed":
		return vibekanban.ProcessStatus_PROCESS_STATUS_FAILED
	case "killed":
		return vibekanban.ProcessStatus_PROCESS_STATUS_KILLED
	default:
		return vibekanban.ProcessStatus_PROCESS_STATUS_PENDING
	}
}

// Project operations
func (s *Service) GetProject(ctx context.Context, req *connect.Request[vibekanban.GetProjectRequest]) (*connect.Response[vibekanban.GetProjectResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	project, err := s.getProjectLogic(req.Msg.Id, userID)
	if err != nil {
		if err.Error() == "project not found" {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		if err.Error() == "project ID is required" {
			return nil, connect.NewError(connect.CodeInvalidArgument, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&vibekanban.GetProjectResponse{
		Project: s.projectToProto(project),
	}), nil
}

func (s *Service) ListProjects(ctx context.Context, req *connect.Request[vibekanban.ListProjectsRequest]) (*connect.Response[vibekanban.ListProjectsResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	projects, err := s.listProjectsLogic(userID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	var protoProjects []*vibekanban.Project
	for _, project := range projects {
		protoProjects = append(protoProjects, s.projectToProto(&project))
	}

	return connect.NewResponse(&vibekanban.ListProjectsResponse{
		Projects:   protoProjects,
		TotalCount: int32(len(projects)),
	}), nil
}

func (s *Service) CreateProject(ctx context.Context, req *connect.Request[vibekanban.CreateProjectRequest]) (*connect.Response[vibekanban.CreateProjectResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	// Convert config map
	configMap := make(map[string]interface{})
	for k, v := range req.Msg.Config {
		configMap[k] = v
	}

	createReq := CreateProjectRequest{
		Name:          req.Msg.Name,
		GitRepoPath:   req.Msg.GitRepoPath,
		SetupScript:   req.Msg.SetupScript,
		DevScript:     req.Msg.DevScript,
		DefaultBranch: req.Msg.DefaultBranch,
		Config:        configMap,
	}

	project, err := s.createProjectLogic(createReq, userID)
	if err != nil {
		if err.Error() == "name is required" || err.Error() == "git_repo_path is required" || err.Error() == "git repository path must be absolute" {
			return nil, connect.NewError(connect.CodeInvalidArgument, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&vibekanban.CreateProjectResponse{
		Project: s.projectToProto(project),
	}), nil
}

func (s *Service) UpdateProject(ctx context.Context, req *connect.Request[vibekanban.UpdateProjectRequest]) (*connect.Response[vibekanban.UpdateProjectResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.Id == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("project ID is required"))
	}

	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.Id, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("project not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch project: %w", result.Error))
	}

	// Update fields
	if req.Msg.Name != "" {
		project.Name = req.Msg.Name
	}
	if req.Msg.GitRepoPath != "" {
		project.GitRepoPath = req.Msg.GitRepoPath
	}
	project.SetupScript = req.Msg.SetupScript
	project.DevScript = req.Msg.DevScript
	if req.Msg.DefaultBranch != "" {
		project.DefaultBranch = req.Msg.DefaultBranch
	}

	// Convert config map
	if len(req.Msg.Config) > 0 {
		configMap := make(map[string]interface{})
		for k, v := range req.Msg.Config {
			configMap[k] = v
		}
		project.Config = models.MakeJSONField(configMap)
	}

	result = s.db.Save(&project)
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update project: %w", result.Error))
	}

	return connect.NewResponse(&vibekanban.UpdateProjectResponse{
		Project: s.projectToProto(&project),
	}), nil
}

func (s *Service) DeleteProject(ctx context.Context, req *connect.Request[vibekanban.DeleteProjectRequest]) (*connect.Response[emptypb.Empty], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.Id == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("project ID is required"))
	}

	result := s.db.Where("id = ? AND user_id = ?", req.Msg.Id, userID).Delete(&models.VibeProject{})
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete project: %w", result.Error))
	}

	if result.RowsAffected == 0 {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("project not found"))
	}

	return connect.NewResponse(&emptypb.Empty{}), nil
}

// Task operations
func (s *Service) GetTasks(ctx context.Context, req *connect.Request[vibekanban.GetTasksRequest]) (*connect.Response[vibekanban.GetTasksResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	tasks, err := s.getTasksLogic(req.Msg.ProjectId, userID)
	if err != nil {
		if err.Error() == "project not found" {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		if err.Error() == "project ID is required" {
			return nil, connect.NewError(connect.CodeInvalidArgument, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	var protoTasks []*vibekanban.Task
	for _, task := range tasks {
		protoTasks = append(protoTasks, s.taskToProto(&task))
	}

	return connect.NewResponse(&vibekanban.GetTasksResponse{
		Tasks:      protoTasks,
		TotalCount: int32(len(tasks)),
	}), nil
}

func (s *Service) CreateTask(ctx context.Context, req *connect.Request[vibekanban.CreateTaskRequest]) (*connect.Response[vibekanban.CreateTaskResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.ProjectId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("project ID is required"))
	}

	if req.Msg.Title == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("task title is required"))
	}

	// Verify project belongs to user
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.ProjectId, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("project not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to verify project: %w", result.Error))
	}

	task := models.VibeTask{
		Title:       req.Msg.Title,
		Description: req.Msg.Description,
		Status:      "todo",
		Priority:    taskPriorityToString(req.Msg.Priority),
		ProjectID:   req.Msg.ProjectId,
		UserID:      userID,
		Labels:      req.Msg.Labels,
	}

	// Convert metadata map
	if len(req.Msg.Metadata) > 0 {
		metadataMap := make(map[string]interface{})
		for k, v := range req.Msg.Metadata {
			metadataMap[k] = v
		}
		task.Metadata = models.MakeJSONField(metadataMap)
	}

	result = s.db.Create(&task)
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create task: %w", result.Error))
	}

	return connect.NewResponse(&vibekanban.CreateTaskResponse{
		Task: s.taskToProto(&task),
	}), nil
}

func (s *Service) UpdateTask(ctx context.Context, req *connect.Request[vibekanban.UpdateTaskRequest]) (*connect.Response[vibekanban.UpdateTaskResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.Id == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("task ID is required"))
	}

	var task models.VibeTask
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.Id, userID).First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("task not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch task: %w", result.Error))
	}

	// Update fields
	if req.Msg.Title != "" {
		task.Title = req.Msg.Title
	}
	if req.Msg.Description != "" {
		task.Description = req.Msg.Description
	}
	if req.Msg.Status != vibekanban.TaskStatus_TASK_STATUS_UNSPECIFIED {
		task.Status = taskStatusToString(req.Msg.Status)
	}
	if req.Msg.Priority != vibekanban.TaskPriority_TASK_PRIORITY_UNSPECIFIED {
		task.Priority = taskPriorityToString(req.Msg.Priority)
	}
	if len(req.Msg.Labels) > 0 {
		task.Labels = req.Msg.Labels
	}

	// Convert metadata map
	if len(req.Msg.Metadata) > 0 {
		metadataMap := make(map[string]interface{})
		for k, v := range req.Msg.Metadata {
			metadataMap[k] = v
		}
		task.Metadata = models.MakeJSONField(metadataMap)
	}

	result = s.db.Save(&task)
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update task: %w", result.Error))
	}

	return connect.NewResponse(&vibekanban.UpdateTaskResponse{
		Task: s.taskToProto(&task),
	}), nil
}

func (s *Service) DeleteTask(ctx context.Context, req *connect.Request[vibekanban.DeleteTaskRequest]) (*connect.Response[emptypb.Empty], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.Id == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("task ID is required"))
	}

	result := s.db.Where("id = ? AND user_id = ?", req.Msg.Id, userID).Delete(&models.VibeTask{})
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete task: %w", result.Error))
	}

	if result.RowsAffected == 0 {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("task not found"))
	}

	return connect.NewResponse(&emptypb.Empty{}), nil
}

// Task attempt operations
func (s *Service) CreateTaskAttempt(ctx context.Context, req *connect.Request[vibekanban.CreateTaskAttemptRequest]) (*connect.Response[vibekanban.CreateTaskAttemptResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.TaskId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("task ID is required"))
	}

	// Verify task belongs to user
	var task models.VibeTask
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.TaskId, userID).First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("task not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to verify task: %w", result.Error))
	}

	now := time.Now()
	attempt := models.VibeTaskAttempt{
		TaskID:     req.Msg.TaskId,
		Executor:   req.Msg.Executor,
		BaseBranch: req.Msg.BaseBranch,
		Status:     "pending",
		UserID:     userID,
		StartTime:  &now,
	}

	if attempt.Executor == "" {
		attempt.Executor = "claude"
	}
	if attempt.BaseBranch == "" {
		attempt.BaseBranch = "main"
	}

	result = s.db.Create(&attempt)
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create attempt: %w", result.Error))
	}

	return connect.NewResponse(&vibekanban.CreateTaskAttemptResponse{
		Attempt: s.attemptToProto(&attempt),
	}), nil
}

func (s *Service) StartTaskAttempt(ctx context.Context, req *connect.Request[vibekanban.StartTaskAttemptRequest]) (*connect.Response[vibekanban.StartTaskAttemptResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.AttemptId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("attempt ID is required"))
	}

	// Extract task ID from attempt - we need to look it up
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.AttemptId, userID).First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("task attempt not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch task attempt: %w", result.Error))
	}

	updatedAttempt, err := s.startTaskAttemptLogic(req.Msg.AttemptId, attempt.TaskID, userID)
	if err != nil {
		if err.Error() == "task attempt not found" {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		if err.Error() == "task attempt is already running" {
			return nil, connect.NewError(connect.CodeAlreadyExists, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(&vibekanban.StartTaskAttemptResponse{
		Attempt: s.attemptToProto(updatedAttempt),
	}), nil
}

// Task attempt operations - implementation
func (s *Service) GetTaskAttempts(ctx context.Context, req *connect.Request[vibekanban.GetTaskAttemptsRequest]) (*connect.Response[vibekanban.GetTaskAttemptsResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.TaskId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("task ID is required"))
	}

	// Verify task exists and user has access
	var task models.VibeTask
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.TaskId, userID).First(&task)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("task not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to verify task: %w", result.Error))
	}

	// Get task attempts with associated processes and sessions
	var attempts []models.VibeTaskAttempt
	query := s.db.Where("task_id = ?", req.Msg.TaskId).
		Preload("Processes").
		Preload("Sessions").
		Order("created_at DESC")

	// Handle pagination
	if req.Msg.PageSize > 0 {
		query = query.Limit(int(req.Msg.PageSize))
	}
	if req.Msg.PageToken != "" {
		// Simple offset-based pagination for now
		// In production, consider cursor-based pagination
		query = query.Offset(int(req.Msg.PageSize))
	}

	result = query.Find(&attempts)
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch task attempts: %w", result.Error))
	}

	// Convert to protobuf messages
	var protoAttempts []*vibekanban.TaskAttempt
	for _, attempt := range attempts {
		protoAttempts = append(protoAttempts, s.attemptToProto(&attempt))
	}

	return connect.NewResponse(&vibekanban.GetTaskAttemptsResponse{
		Attempts:   protoAttempts,
		TotalCount: int32(len(attempts)),
	}), nil
}

func (s *Service) GetAttemptDiff(ctx context.Context, req *connect.Request[vibekanban.GetAttemptDiffRequest]) (*connect.Response[vibekanban.GetAttemptDiffResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.AttemptId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("attempt ID is required"))
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.AttemptId, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("task attempt not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch task attempt: %w", result.Error))
	}

	// Get git diff for this attempt
	diff, err := s.gitService.GetBranchDiff(
		attempt.Task.Project.GitRepoPath,
		attempt.BaseBranch,
		attempt.Branch,
	)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to get git diff: %w", err))
	}

	// Extract modified files from diff (simple implementation)
	var files []string
	lines := strings.Split(diff, "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "diff --git") {
			// Extract file paths from "diff --git a/file b/file" format
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				// Remove a/ prefix from file path
				file := strings.TrimPrefix(parts[2], "a/")
				files = append(files, file)
			}
		}
	}

	return connect.NewResponse(&vibekanban.GetAttemptDiffResponse{
		Diff:  diff,
		Files: files,
	}), nil
}

func (s *Service) MergeAttempt(ctx context.Context, req *connect.Request[vibekanban.MergeAttemptRequest]) (*connect.Response[vibekanban.MergeAttemptResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.AttemptId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("attempt ID is required"))
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.AttemptId, userID).
		Preload("Task").
		Preload("Task.Project").
		First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("task attempt not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch task attempt: %w", result.Error))
	}

	// Verify attempt is completed
	if attempt.Status != "completed" {
		return nil, connect.NewError(connect.CodeFailedPrecondition, fmt.Errorf("can only merge completed attempts"))
	}

	// Merge the branch
	mergeCommit, err := s.gitService.MergeBranch(
		attempt.Task.Project.GitRepoPath,
		attempt.Branch,
		attempt.BaseBranch,
	)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to merge branch: %w", err))
	}

	// Update attempt with merge commit
	attempt.MergeCommit = mergeCommit
	result = s.db.Save(&attempt)
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update task attempt: %w", result.Error))
	}

	// Update task status to completed
	now := time.Now()
	result = s.db.Model(&attempt.Task).Updates(map[string]interface{}{
		"status":     "done",
		"updated_at": now,
	})
	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update task status: %w", result.Error))
	}

	// Get PR URL from commit message or metadata (if available)
	prURL := attempt.PRURL
	if prURL == "" {
		// Could implement GitHub PR creation logic here
		prURL = ""
	}

	return connect.NewResponse(&vibekanban.MergeAttemptResponse{
		MergeCommit: mergeCommit,
		PrUrl:       prURL,
	}), nil
}

// Git operations
func (s *Service) GetProjectBranches(ctx context.Context, req *connect.Request[vibekanban.GetProjectBranchesRequest]) (*connect.Response[vibekanban.GetProjectBranchesResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.ProjectId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("project ID is required"))
	}

	// Verify project exists and user has access
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.ProjectId, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("project not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch project: %w", result.Error))
	}

	// Validate git repository
	if err := s.gitService.ValidateRepository(project.GitRepoPath); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("invalid git repository: %w", err))
	}

	// Get branches
	branches, err := s.gitService.GetBranches(project.GitRepoPath)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to get branches: %w", err))
	}

	// Get repository status to find current branch
	status, err := s.gitService.GetRepositoryStatus(project.GitRepoPath)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to get repository status: %w", err))
	}

	return connect.NewResponse(&vibekanban.GetProjectBranchesResponse{
		Branches:      branches,
		CurrentBranch: status.CurrentBranch,
	}), nil
}

func (s *Service) CreateProjectBranch(ctx context.Context, req *connect.Request[vibekanban.CreateProjectBranchRequest]) (*connect.Response[vibekanban.CreateProjectBranchResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.ProjectId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("project ID is required"))
	}

	if req.Msg.BranchName == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("branch name is required"))
	}

	// Verify project exists and user has access
	var project models.VibeProject
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.ProjectId, userID).First(&project)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("project not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch project: %w", result.Error))
	}

	// Use default branch if base branch not specified
	baseBranch := req.Msg.BaseBranch
	if baseBranch == "" {
		baseBranch = project.DefaultBranch
	}

	// Validate git repository
	if err := s.gitService.ValidateRepository(project.GitRepoPath); err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("invalid git repository: %w", err))
	}

	// Create the branch
	err = s.gitService.CreateBranch(project.GitRepoPath, req.Msg.BranchName, baseBranch)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create branch: %w", err))
	}

	return connect.NewResponse(&vibekanban.CreateProjectBranchResponse{
		BranchName: req.Msg.BranchName,
	}), nil
}

// Process operations
func (s *Service) GetProcesses(ctx context.Context, req *connect.Request[vibekanban.GetProcessesRequest]) (*connect.Response[vibekanban.GetProcessesResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.AttemptId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("attempt ID is required"))
	}

	// Verify attempt exists and user has access
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.AttemptId, userID).First(&attempt)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("task attempt not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch task attempt: %w", result.Error))
	}

	// Get processes from database
	var processes []models.VibeExecutionProcess
	result = s.db.Where("attempt_id = ?", req.Msg.AttemptId).
		Order("created_at ASC").
		Find(&processes)

	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch processes: %w", result.Error))
	}

	// Convert to protobuf messages
	var protoProcesses []*vibekanban.ExecutionProcess
	for _, process := range processes {
		protoProcesses = append(protoProcesses, s.processToProto(&process))
	}

	return connect.NewResponse(&vibekanban.GetProcessesResponse{
		Processes: protoProcesses,
	}), nil
}

func (s *Service) KillProcess(ctx context.Context, req *connect.Request[vibekanban.KillProcessRequest]) (*connect.Response[emptypb.Empty], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.ProcessId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("process ID is required"))
	}

	// Verify process exists and user has access through attempt
	var process models.VibeExecutionProcess
	result := s.db.Where("id = ?", req.Msg.ProcessId).
		Preload("Attempt").
		First(&process)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("process not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch process: %w", result.Error))
	}

	// Verify user has access to this process through the attempt
	if process.Attempt.UserID != userID {
		return nil, connect.NewError(connect.CodePermissionDenied, fmt.Errorf("access denied to this process"))
	}

	// Kill the process using the process manager
	err = s.processManager.KillProcess(req.Msg.ProcessId)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to kill process: %w", err))
	}

	return connect.NewResponse(&emptypb.Empty{}), nil
}

// Debug operations
func (s *Service) GetAttemptStatus(ctx context.Context, req *connect.Request[vibekanban.GetAttemptStatusRequest]) (*connect.Response[vibekanban.GetAttemptStatusResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	if req.Msg.AttemptId == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("attempt ID is required"))
	}

	// Get attempt with all related data
	var attempt models.VibeTaskAttempt
	result := s.db.Where("id = ? AND user_id = ?", req.Msg.AttemptId, userID).
		Preload("Task").
		Preload("Task.Project").
		Preload("Processes").
		First(&attempt)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("task attempt not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch task attempt: %w", result.Error))
	}

	// Convert processes to protobuf messages
	var protoProcesses []*vibekanban.ExecutionProcess
	for _, process := range attempt.Processes {
		protoProcesses = append(protoProcesses, s.processToProto(&process))
	}

	return connect.NewResponse(&vibekanban.GetAttemptStatusResponse{
		Attempt:   s.attemptToProto(&attempt),
		Processes: protoProcesses,
	}), nil
}

func (s *Service) GetDebugProcesses(ctx context.Context, req *connect.Request[vibekanban.GetDebugProcessesRequest]) (*connect.Response[vibekanban.GetDebugProcessesResponse], error) {
	userID, err := s.getUserID(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("not logged in"))
	}

	// Get all processes for user's attempts from database
	var processes []models.VibeExecutionProcess
	result := s.db.
		Joins("JOIN vibe_task_attempts ON vibe_execution_processes.attempt_id = vibe_task_attempts.id").
		Where("vibe_task_attempts.user_id = ?", userID).
		Order("vibe_execution_processes.created_at DESC").
		Find(&processes)

	if result.Error != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch debug processes: %w", result.Error))
	}

	// Convert to protobuf messages
	var protoProcesses []*vibekanban.ExecutionProcess
	for _, process := range processes {
		protoProcesses = append(protoProcesses, s.processToProto(&process))
	}

	return connect.NewResponse(&vibekanban.GetDebugProcessesResponse{
		Processes: protoProcesses,
	}), nil
}
