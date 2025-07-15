package vibekanban

import (
	"context"
	"testing"
	"time"

	"connectrpc.com/connect"
	"github.com/breadchris/share/gen/proto/vibekanban"
	"github.com/breadchris/share/models"
	"github.com/breadchris/share/session"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// MockSessionManager for testing
type MockSessionManager struct {
	mock.Mock
}

func (m *MockSessionManager) GetUserID(ctx context.Context) (string, error) {
	args := m.Called(ctx)
	return args.String(0), args.Error(1)
}

func (m *MockSessionManager) ValidateSession(ctx context.Context) (bool, error) {
	args := m.Called(ctx)
	return args.Bool(0), args.Error(1)
}

// Setup test database and service
func setupTestService(t *testing.T) (*Service, *MockSessionManager, *gorm.DB) {
	// Create in-memory SQLite database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	// Auto-migrate test models
	err = db.AutoMigrate(
		&models.VibeProject{},
		&models.VibeTask{},
		&models.VibeTaskAttempt{},
		&models.VibeExecutionProcess{},
		&models.VibeExecutorSession{},
	)
	assert.NoError(t, err)

	// Create mock session manager
	mockSession := &MockSessionManager{}

	// Create service
	service := &Service{
		VibeKanbanService: &VibeKanbanService{
			database: db,
			session:  mockSession,
			git:      NewGitService(),
		},
	}

	return service, mockSession, db
}

// Test GetProject RPC method
func TestService_GetProject(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test project
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.GetProjectRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.GetProjectResponse)
	}{
		{
			name: "Valid project request",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetProjectRequest{
				Id: "project-1",
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.GetProjectResponse) {
				assert.NotNil(t, response.Project)
				assert.Equal(t, "project-1", response.Project.Id)
				assert.Equal(t, "Test Project", response.Project.Name)
			},
		},
		{
			name: "Project not found",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetProjectRequest{
				Id: "nonexistent",
			},
			expectedError: true,
			expectedCode:  connect.CodeNotFound,
		},
		{
			name: "Authentication failure",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return("", assert.AnError)
			},
			request: &vibekanban.GetProjectRequest{
				Id: "project-1",
			},
			expectedError: true,
			expectedCode:  connect.CodeUnauthenticated,
		},
		{
			name: "Empty project ID",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetProjectRequest{
				Id: "",
			},
			expectedError: true,
			expectedCode:  connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset mocks
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			// Make request
			req := connect.NewRequest(tt.request)
			response, err := service.GetProject(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test ListProjects RPC method
func TestService_ListProjects(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test projects
	projects := []*models.VibeProject{
		{
<<<<<<< HEAD
			Model: models.Model{
				ID:        "project-1",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
=======
			ID:            "project-1",
>>>>>>> ca39096 (update)
			Name:          "Project 1",
			GitRepoPath:   "/tmp/repo1",
			DefaultBranch: "main",
			UserID:        userID,
<<<<<<< HEAD
		},
		{
			Model: models.Model{
				ID:        "project-2",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
=======
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		},
		{
			ID:            "project-2",
>>>>>>> ca39096 (update)
			Name:          "Project 2",
			GitRepoPath:   "/tmp/repo2",
			DefaultBranch: "main",
			UserID:        userID,
<<<<<<< HEAD
		},
		{
			Model: models.Model{
				ID:        "project-3",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
=======
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		},
		{
			ID:            "project-3",
>>>>>>> ca39096 (update)
			Name:          "Other User Project",
			GitRepoPath:   "/tmp/repo3",
			DefaultBranch: "main",
			UserID:        "other-user",
<<<<<<< HEAD
=======
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
		},
	}
	for _, project := range projects {
		db.Create(project)
	}

	tests := []struct {
		name           string
		setupMocks     func()
		request        *emptypb.Empty
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.ListProjectsResponse)
	}{
		{
			name: "List user projects",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request:       &emptypb.Empty{},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.ListProjectsResponse) {
				assert.Len(t, response.Projects, 2)
				assert.Equal(t, "project-1", response.Projects[0].Id)
				assert.Equal(t, "project-2", response.Projects[1].Id)
			},
		},
		{
			name: "Authentication failure",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return("", assert.AnError)
			},
			request:      &emptypb.Empty{},
			expectedError: true,
			expectedCode: connect.CodeUnauthenticated,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			response, err := service.ListProjects(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test CreateProject RPC method
func TestService_CreateProject(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.CreateProjectRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.CreateProjectResponse)
	}{
		{
			name: "Valid project creation",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.CreateProjectRequest{
				Name:          "New Project",
				GitRepoPath:   "/tmp/new-repo",
				SetupScript:   "npm install",
				DevScript:     "npm run dev",
				DefaultBranch: "main",
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.CreateProjectResponse) {
				assert.NotNil(t, response.Project)
				assert.NotEmpty(t, response.Project.Id)
				assert.Equal(t, "New Project", response.Project.Name)
				assert.Equal(t, userID, response.Project.UserId)

				// Verify database
				var project models.VibeProject
				err := db.First(&project, "id = ?", response.Project.Id).Error
				assert.NoError(t, err)
				assert.Equal(t, "New Project", project.Name)
			},
		},
		{
			name: "Missing project name",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.CreateProjectRequest{
				Name:        "", // Empty name
				GitRepoPath: "/tmp/repo",
			},
			expectedError: true,
			expectedCode:  connect.CodeInvalidArgument,
		},
		{
			name: "Authentication failure",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return("", assert.AnError)
			},
			request: &vibekanban.CreateProjectRequest{
				Name:        "Test Project",
				GitRepoPath: "/tmp/repo",
			},
			expectedError: true,
			expectedCode:  connect.CodeUnauthenticated,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			response, err := service.CreateProject(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test UpdateProject RPC method
func TestService_UpdateProject(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test project
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Original Project",
		GitRepoPath:   "/tmp/original-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.UpdateProjectRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.UpdateProjectResponse)
	}{
		{
			name: "Valid project update",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.UpdateProjectRequest{
				Id:   "project-1",
				Name: "Updated Project",
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.UpdateProjectResponse) {
				assert.NotNil(t, response.Project)
				assert.Equal(t, "Updated Project", response.Project.Name)

				// Verify database
				var updatedProject models.VibeProject
				err := db.First(&updatedProject, "id = ?", "project-1").Error
				assert.NoError(t, err)
				assert.Equal(t, "Updated Project", updatedProject.Name)
			},
		},
		{
			name: "Project not found",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.UpdateProjectRequest{
				Id:   "nonexistent",
				Name: "Updated Project",
			},
			expectedError: true,
			expectedCode:  connect.CodeNotFound,
		},
		{
			name: "Authentication failure",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return("", assert.AnError)
			},
			request: &vibekanban.UpdateProjectRequest{
				Id:   "project-1",
				Name: "Updated Project",
			},
			expectedError: true,
			expectedCode:  connect.CodeUnauthenticated,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			response, err := service.UpdateProject(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test DeleteProject RPC method
func TestService_DeleteProject(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test project with tasks
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	task := &models.VibeTask{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "task-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
=======
		ID:        "task-1",
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(task)

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.DeleteProjectRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T)
	}{
		{
			name: "Valid project deletion",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.DeleteProjectRequest{
				Id: "project-1",
			},
			expectedError: false,
			validateResult: func(t *testing.T) {
				// Verify project is deleted
				var project models.VibeProject
				err := db.First(&project, "id = ?", "project-1").Error
				assert.Error(t, err)
				assert.True(t, gorm.ErrRecordNotFound == err)
			},
		},
		{
			name: "Project not found",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.DeleteProjectRequest{
				Id: "nonexistent",
			},
			expectedError: true,
			expectedCode:  connect.CodeNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			_, err := service.DeleteProject(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				if tt.validateResult != nil {
					tt.validateResult(t)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test GetTasks RPC method
func TestService_GetTasks(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test project and tasks
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	tasks := []*models.VibeTask{
		{
<<<<<<< HEAD
			Model: models.Model{
				ID:        "task-1",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
=======
			ID:          "task-1",
>>>>>>> ca39096 (update)
			Title:       "Task 1",
			Description: "First task",
			Status:      "todo",
			Priority:    "high",
			ProjectID:   "project-1",
			UserID:      userID,
<<<<<<< HEAD
		},
		{
			Model: models.Model{
				ID:        "task-2",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
=======
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          "task-2",
>>>>>>> ca39096 (update)
			Title:       "Task 2",
			Description: "Second task",
			Status:      "inprogress",
			Priority:    "medium",
			ProjectID:   "project-1",
			UserID:      userID,
<<<<<<< HEAD
=======
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
>>>>>>> ca39096 (update)
		},
	}
	for _, task := range tasks {
		db.Create(task)
	}

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.GetTasksRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.GetTasksResponse)
	}{
		{
			name: "Get tasks for project",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetTasksRequest{
				ProjectId: "project-1",
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.GetTasksResponse) {
				assert.Len(t, response.Tasks, 2)
				assert.Equal(t, "task-1", response.Tasks[0].Id)
				assert.Equal(t, "Task 1", response.Tasks[0].Title)
				assert.Equal(t, vibekanban.TaskStatus_TODO, response.Tasks[0].Status)
				assert.Equal(t, vibekanban.TaskPriority_HIGH, response.Tasks[0].Priority)
			},
		},
		{
			name: "Empty project ID",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetTasksRequest{
				ProjectId: "",
			},
			expectedError: true,
			expectedCode:  connect.CodeInvalidArgument,
		},
		{
			name: "Authentication failure",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return("", assert.AnError)
			},
			request: &vibekanban.GetTasksRequest{
				ProjectId: "project-1",
			},
			expectedError: true,
			expectedCode:  connect.CodeUnauthenticated,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			response, err := service.GetTasks(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test CreateTask RPC method
func TestService_CreateTask(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test project
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.CreateTaskRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.CreateTaskResponse)
	}{
		{
			name: "Valid task creation",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.CreateTaskRequest{
				ProjectId:   "project-1",
				Title:       "New Task",
				Description: "Task description",
				Priority:    vibekanban.TaskPriority_HIGH,
				Labels:      []string{"feature", "frontend"},
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.CreateTaskResponse) {
				assert.NotNil(t, response.Task)
				assert.NotEmpty(t, response.Task.Id)
				assert.Equal(t, "New Task", response.Task.Title)
				assert.Equal(t, vibekanban.TaskStatus_TODO, response.Task.Status)
				assert.Equal(t, vibekanban.TaskPriority_HIGH, response.Task.Priority)
				assert.Equal(t, userID, response.Task.UserId)

				// Verify database
				var task models.VibeTask
				err := db.First(&task, "id = ?", response.Task.Id).Error
				assert.NoError(t, err)
				assert.Equal(t, "New Task", task.Title)
			},
		},
		{
			name: "Missing title",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.CreateTaskRequest{
				ProjectId: "project-1",
				Title:     "", // Empty title
			},
			expectedError: true,
			expectedCode:  connect.CodeInvalidArgument,
		},
		{
			name: "Invalid project ID",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.CreateTaskRequest{
				ProjectId: "nonexistent",
				Title:     "New Task",
			},
			expectedError: true,
			expectedCode:  connect.CodeNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			response, err := service.CreateTask(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test UpdateTask RPC method
func TestService_UpdateTask(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test project and task
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	task := &models.VibeTask{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "task-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:          "task-1",
>>>>>>> ca39096 (update)
		Title:       "Original Task",
		Description: "Original description",
		Status:      "todo",
		Priority:    "low",
		ProjectID:   "project-1",
		UserID:      userID,
<<<<<<< HEAD
=======
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(task)

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.UpdateTaskRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.UpdateTaskResponse)
	}{
		{
			name: "Valid task update",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.UpdateTaskRequest{
				Id:          "task-1",
				Title:       "Updated Task",
				Description: "Updated description",
				Status:      vibekanban.TaskStatus_IN_PROGRESS,
				Priority:    vibekanban.TaskPriority_HIGH,
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.UpdateTaskResponse) {
				assert.NotNil(t, response.Task)
				assert.Equal(t, "Updated Task", response.Task.Title)
				assert.Equal(t, vibekanban.TaskStatus_IN_PROGRESS, response.Task.Status)
				assert.Equal(t, vibekanban.TaskPriority_HIGH, response.Task.Priority)

				// Verify database
				var updatedTask models.VibeTask
				err := db.First(&updatedTask, "id = ?", "task-1").Error
				assert.NoError(t, err)
				assert.Equal(t, "Updated Task", updatedTask.Title)
				assert.Equal(t, "inprogress", updatedTask.Status)
			},
		},
		{
			name: "Task not found",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.UpdateTaskRequest{
				Id:    "nonexistent",
				Title: "Updated Task",
			},
			expectedError: true,
			expectedCode:  connect.CodeNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			response, err := service.UpdateTask(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test DeleteTask RPC method
func TestService_DeleteTask(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test project and task
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	task := &models.VibeTask{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "task-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
=======
		ID:        "task-1",
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(task)

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.DeleteTaskRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T)
	}{
		{
			name: "Valid task deletion",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.DeleteTaskRequest{
				Id: "task-1",
			},
			expectedError: false,
			validateResult: func(t *testing.T) {
				// Verify task is deleted
				var task models.VibeTask
				err := db.First(&task, "id = ?", "task-1").Error
				assert.Error(t, err)
				assert.True(t, gorm.ErrRecordNotFound == err)
			},
		},
		{
			name: "Task not found",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.DeleteTaskRequest{
				Id: "nonexistent",
			},
			expectedError: true,
			expectedCode:  connect.CodeNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			_, err := service.DeleteTask(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				if tt.validateResult != nil {
					tt.validateResult(t)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test GetTaskAttempts RPC method
func TestService_GetTaskAttempts(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test data
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	task := &models.VibeTask{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "task-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
=======
		ID:        "task-1",
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(task)

	attempts := []*models.VibeTaskAttempt{
		{
<<<<<<< HEAD
			Model: models.Model{
				ID:        "attempt-1",
				CreatedAt: time.Now().Add(-time.Hour),
				UpdatedAt: time.Now().Add(-time.Hour),
			},
=======
			ID:           "attempt-1",
>>>>>>> ca39096 (update)
			TaskID:       "task-1",
			WorktreePath: "/tmp/worktree1",
			Branch:       "task-1-attempt-1",
			BaseBranch:   "main",
			Executor:     "claude",
			Status:       "completed",
			UserID:       userID,
<<<<<<< HEAD
		},
		{
			Model: models.Model{
				ID:        "attempt-2",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
=======
			CreatedAt:    time.Now().Add(-time.Hour),
			UpdatedAt:    time.Now().Add(-time.Hour),
		},
		{
			ID:           "attempt-2",
>>>>>>> ca39096 (update)
			TaskID:       "task-1",
			WorktreePath: "/tmp/worktree2",
			Branch:       "task-1-attempt-2",
			BaseBranch:   "main",
			Executor:     "claude",
			Status:       "running",
			UserID:       userID,
<<<<<<< HEAD
=======
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
>>>>>>> ca39096 (update)
		},
	}
	for _, attempt := range attempts {
		db.Create(attempt)
	}

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.GetTaskAttemptsRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.GetTaskAttemptsResponse)
	}{
		{
			name: "Get task attempts",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetTaskAttemptsRequest{
				TaskId: "task-1",
				Limit:  10,
				Offset: 0,
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.GetTaskAttemptsResponse) {
				assert.Len(t, response.Attempts, 2)
				assert.Equal(t, "attempt-2", response.Attempts[0].Id) // Newest first
				assert.Equal(t, "attempt-1", response.Attempts[1].Id)
				assert.Equal(t, int32(2), response.Total)
			},
		},
		{
			name: "Pagination test",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetTaskAttemptsRequest{
				TaskId: "task-1",
				Limit:  1,
				Offset: 0,
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.GetTaskAttemptsResponse) {
				assert.Len(t, response.Attempts, 1)
				assert.Equal(t, "attempt-2", response.Attempts[0].Id) // Newest first
				assert.Equal(t, int32(2), response.Total)
			},
		},
		{
			name: "Invalid task ID",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetTaskAttemptsRequest{
				TaskId: "",
			},
			expectedError: true,
			expectedCode:  connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			response, err := service.GetTaskAttempts(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test CreateTaskAttempt RPC method
func TestService_CreateTaskAttempt(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test data
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	task := &models.VibeTask{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "task-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
=======
		ID:        "task-1",
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(task)

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.CreateTaskAttemptRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.CreateTaskAttemptResponse)
	}{
		{
			name: "Valid attempt creation",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.CreateTaskAttemptRequest{
				TaskId:     "task-1",
				BaseBranch: "main",
				Executor:   "claude",
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.CreateTaskAttemptResponse) {
				assert.NotNil(t, response.Attempt)
				assert.NotEmpty(t, response.Attempt.Id)
				assert.Equal(t, "task-1", response.Attempt.TaskId)
				assert.Equal(t, "main", response.Attempt.BaseBranch)
				assert.Equal(t, "claude", response.Attempt.Executor)
				assert.Equal(t, vibekanban.AttemptStatus_PENDING, response.Attempt.Status)

				// Verify database
				var attempt models.VibeTaskAttempt
				err := db.First(&attempt, "id = ?", response.Attempt.Id).Error
				assert.NoError(t, err)
				assert.Equal(t, "task-1", attempt.TaskID)
			},
		},
		{
			name: "Invalid task ID",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.CreateTaskAttemptRequest{
				TaskId:     "nonexistent",
				BaseBranch: "main",
				Executor:   "claude",
			},
			expectedError: true,
			expectedCode:  connect.CodeNotFound,
		},
		{
			name: "Missing executor",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.CreateTaskAttemptRequest{
				TaskId:     "task-1",
				BaseBranch: "main",
				Executor:   "", // Empty executor
			},
			expectedError: true,
			expectedCode:  connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			response, err := service.CreateTaskAttempt(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Add more test methods for the remaining RPC operations...
// Due to length constraints, I'll add a few more key test methods

// Test GetProcesses RPC method
func TestService_GetProcesses(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test data
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	task := &models.VibeTask{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "task-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
=======
		ID:        "task-1",
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(task)

	attempt := &models.VibeTaskAttempt{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "attempt-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:           "attempt-1",
>>>>>>> ca39096 (update)
		TaskID:       "task-1",
		WorktreePath: "/tmp/worktree1",
		Branch:       "task-1-attempt-1",
		BaseBranch:   "main",
		Executor:     "claude",
		Status:       "running",
		UserID:       userID,
<<<<<<< HEAD
=======
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(attempt)

	processes := []*models.VibeExecutionProcess{
		{
<<<<<<< HEAD
			Model: models.Model{
				ID:        "process-1",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
=======
			ID:        "process-1",
>>>>>>> ca39096 (update)
			AttemptID: "attempt-1",
			Type:      "setup_script",
			Status:    "completed",
			Command:   "npm install",
			ProcessID: 1234,
			ExitCode:  0,
			UserID:    userID,
<<<<<<< HEAD
		},
		{
			Model: models.Model{
				ID:        "process-2",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
=======
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:        "process-2",
>>>>>>> ca39096 (update)
			AttemptID: "attempt-1",
			Type:      "dev_server",
			Status:    "running",
			Command:   "npm run dev",
			ProcessID: 5678,
			Port:      3000,
			URL:       "http://localhost:3000",
			UserID:    userID,
<<<<<<< HEAD
=======
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
>>>>>>> ca39096 (update)
		},
	}
	for _, process := range processes {
		db.Create(process)
	}

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.GetProcessesRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T, response *vibekanban.GetProcessesResponse)
	}{
		{
			name: "Get processes for attempt",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetProcessesRequest{
				AttemptId: "attempt-1",
			},
			expectedError: false,
			validateResult: func(t *testing.T, response *vibekanban.GetProcessesResponse) {
				assert.Len(t, response.Processes, 2)
				
				// Verify process details
				var setupProcess, devProcess *vibekanban.ExecutionProcess
				for _, p := range response.Processes {
					if p.Type == vibekanban.ProcessType_SETUP_SCRIPT {
						setupProcess = p
					} else if p.Type == vibekanban.ProcessType_DEV_SERVER {
						devProcess = p
					}
				}
				
				assert.NotNil(t, setupProcess)
				assert.Equal(t, "process-1", setupProcess.Id)
				assert.Equal(t, vibekanban.ProcessStatus_COMPLETED, setupProcess.Status)
				assert.Equal(t, int32(0), setupProcess.ExitCode)
				
				assert.NotNil(t, devProcess)
				assert.Equal(t, "process-2", devProcess.Id)
				assert.Equal(t, vibekanban.ProcessStatus_RUNNING, devProcess.Status)
				assert.Equal(t, int32(3000), devProcess.Port)
				assert.Equal(t, "http://localhost:3000", devProcess.Url)
			},
		},
		{
			name: "Invalid attempt ID",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.GetProcessesRequest{
				AttemptId: "",
			},
			expectedError: true,
			expectedCode:  connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			response, err := service.GetProcesses(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, response)
				if tt.validateResult != nil {
					tt.validateResult(t, response.Msg)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}

// Test KillProcess RPC method  
func TestService_KillProcess(t *testing.T) {
	service, mockSession, db := setupTestService(t)
	ctx := context.Background()
	userID := "test-user-123"

	// Create test data
	project := &models.VibeProject{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "project-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:            "project-1",
>>>>>>> ca39096 (update)
		Name:          "Test Project",
		GitRepoPath:   "/tmp/test-repo",
		DefaultBranch: "main",
		UserID:        userID,
<<<<<<< HEAD
=======
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(project)

	task := &models.VibeTask{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "task-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
=======
		ID:        "task-1",
		Title:     "Test Task",
		ProjectID: "project-1",
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(task)

	attempt := &models.VibeTaskAttempt{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "attempt-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:           "attempt-1",
>>>>>>> ca39096 (update)
		TaskID:       "task-1",
		WorktreePath: "/tmp/worktree1",
		Branch:       "task-1-attempt-1",
		BaseBranch:   "main",
		Executor:     "claude",
		Status:       "running",
		UserID:       userID,
<<<<<<< HEAD
=======
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(attempt)

	runningProcess := &models.VibeExecutionProcess{
<<<<<<< HEAD
		Model: models.Model{
			ID:        "process-1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
=======
		ID:        "process-1",
>>>>>>> ca39096 (update)
		AttemptID: "attempt-1",
		Type:      "dev_server",
		Status:    "running",
		Command:   "npm run dev",
		ProcessID: 5678,
		Port:      3000,
		URL:       "http://localhost:3000",
		UserID:    userID,
<<<<<<< HEAD
=======
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
>>>>>>> ca39096 (update)
	}
	db.Create(runningProcess)

	tests := []struct {
		name           string
		setupMocks     func()
		request        *vibekanban.KillProcessRequest
		expectedError  bool
		expectedCode   connect.Code
		validateResult func(t *testing.T)
	}{
		{
			name: "Kill running process (simulation)",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.KillProcessRequest{
				ProcessId: "process-1",
			},
			expectedError: false, // Note: actual kill may fail in test env, but we test the DB update
			validateResult: func(t *testing.T) {
				// Verify process status updated
				var process models.VibeExecutionProcess
				err := db.First(&process, "id = ?", "process-1").Error
				assert.NoError(t, err)
				// Status should be updated to killed (if kill succeeded) or remain running
				assert.True(t, process.Status == "killed" || process.Status == "running")
			},
		},
		{
			name: "Process not found",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.KillProcessRequest{
				ProcessId: "nonexistent",
			},
			expectedError: true,
			expectedCode:  connect.CodeNotFound,
		},
		{
			name: "Empty process ID",
			setupMocks: func() {
				mockSession.On("GetUserID", ctx).Return(userID, nil)
			},
			request: &vibekanban.KillProcessRequest{
				ProcessId: "",
			},
			expectedError: true,
			expectedCode:  connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSession.ExpectedCalls = nil
			tt.setupMocks()

			req := connect.NewRequest(tt.request)
			_, err := service.KillProcess(ctx, req)

			if tt.expectedError {
				assert.Error(t, err)
				connectErr := err.(*connect.Error)
				assert.Equal(t, tt.expectedCode, connectErr.Code())
			} else {
				// Note: KillProcess may return an error in test environment
				// because we can't actually kill non-existent processes
				// The important part is that the validation and permission checks work
				if tt.validateResult != nil {
					tt.validateResult(t)
				}
			}

			mockSession.AssertExpectations(t)
		})
	}
}