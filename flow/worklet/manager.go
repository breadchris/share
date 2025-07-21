package worklet

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/breadchris/flow/deps"
	"github.com/breadchris/flow/models"
	"gorm.io/gorm"
)

type Manager struct {
	db           *gorm.DB
	deps         *deps.Deps
	worklets     map[string]*Worklet
	mu           sync.RWMutex
	dockerClient *DockerClient
	gitClient    *GitClient
	webServer    *WebServer
	claudeClient *ClaudeClient
}

func NewManager(deps *deps.Deps) *Manager {
	return &Manager{
		db:           deps.DB,
		deps:         deps,
		worklets:     make(map[string]*Worklet),
		dockerClient: NewDockerClient(),
		gitClient:    NewGitClient(),
		webServer:    NewWebServer(),
		claudeClient: NewClaudeClient(),
	}
}

func (m *Manager) CreateWorklet(ctx context.Context, req CreateWorkletRequest, userID string) (*Worklet, error) {
	worklet := NewWorklet(req, userID)
	
	if err := m.db.Create(worklet).Error; err != nil {
		return nil, fmt.Errorf("failed to create worklet in database: %w", err)
	}
	
	m.mu.Lock()
	m.worklets[worklet.ID] = worklet
	m.mu.Unlock()
	
	go m.deployWorklet(ctx, worklet)
	
	return worklet, nil
}

func (m *Manager) GetWorklet(workletID string) (*Worklet, error) {
	m.mu.RLock()
	worklet, exists := m.worklets[workletID]
	m.mu.RUnlock()
	
	if !exists {
		var dbWorklet Worklet
		if err := m.db.First(&dbWorklet, "id = ?", workletID).Error; err != nil {
			return nil, fmt.Errorf("worklet not found: %w", err)
		}
		
		m.mu.Lock()
		m.worklets[workletID] = &dbWorklet
		m.mu.Unlock()
		
		return &dbWorklet, nil
	}
	
	return worklet, nil
}

func (m *Manager) ListWorklets(userID string) ([]*Worklet, error) {
	var worklets []*Worklet
	if err := m.db.Where("user_id = ?", userID).Find(&worklets).Error; err != nil {
		return nil, fmt.Errorf("failed to list worklets: %w", err)
	}
	
	return worklets, nil
}

func (m *Manager) ProcessPrompt(ctx context.Context, workletID string, prompt string, userID string) (*WorkletPrompt, error) {
	worklet, err := m.GetWorklet(workletID)
	if err != nil {
		return nil, err
	}
	
	if worklet.Status != StatusRunning {
		return nil, fmt.Errorf("worklet is not running, current status: %s", worklet.Status)
	}
	
	workletPrompt := &WorkletPrompt{
		Model:     models.Model{ID: generateID()},
		WorkletID: workletID,
		Prompt:    prompt,
		Status:    "processing",
		UserID:    userID,
	}
	
	if err := m.db.Create(workletPrompt).Error; err != nil {
		return nil, fmt.Errorf("failed to create worklet prompt: %w", err)
	}
	
	go m.processPromptAsync(ctx, worklet, workletPrompt)
	
	return workletPrompt, nil
}

func (m *Manager) StopWorklet(workletID string) error {
	worklet, err := m.GetWorklet(workletID)
	if err != nil {
		return err
	}
	
	if worklet.ContainerID != "" {
		if err := m.dockerClient.StopContainer(worklet.ContainerID); err != nil {
			slog.Error("Failed to stop container", "error", err, "containerID", worklet.ContainerID)
		}
	}
	
	worklet.Status = StatusStopped
	worklet.UpdatedAt = time.Now()
	
	if err := m.db.Save(worklet).Error; err != nil {
		return fmt.Errorf("failed to update worklet status: %w", err)
	}
	
	return nil
}

func (m *Manager) RestartWorklet(ctx context.Context, workletID string) error {
	worklet, err := m.GetWorklet(workletID)
	if err != nil {
		return err
	}
	
	if err := m.StopWorklet(workletID); err != nil {
		slog.Error("Failed to stop worklet before restart", "error", err)
	}
	
	worklet.Status = StatusCreating
	worklet.UpdatedAt = time.Now()
	
	if err := m.db.Save(worklet).Error; err != nil {
		return fmt.Errorf("failed to update worklet status: %w", err)
	}
	
	go m.deployWorklet(ctx, worklet)
	
	return nil
}

func (m *Manager) DeleteWorklet(workletID string) error {
	worklet, err := m.GetWorklet(workletID)
	if err != nil {
		return err
	}
	
	if err := m.StopWorklet(workletID); err != nil {
		slog.Error("Failed to stop worklet before deletion", "error", err)
	}
	
	if worklet.ContainerID != "" {
		if err := m.dockerClient.RemoveContainer(worklet.ContainerID); err != nil {
			slog.Error("Failed to remove container", "error", err, "containerID", worklet.ContainerID)
		}
	}
	
	if err := m.db.Delete(worklet).Error; err != nil {
		return fmt.Errorf("failed to delete worklet: %w", err)
	}
	
	m.mu.Lock()
	delete(m.worklets, workletID)
	m.mu.Unlock()
	
	return nil
}

func (m *Manager) deployWorklet(ctx context.Context, worklet *Worklet) {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("Panic in deployWorklet", "error", r, "workletID", worklet.ID)
			m.updateWorkletStatus(worklet, StatusError, fmt.Sprintf("Deployment panic: %v", r))
		}
	}()
	
	m.updateWorkletStatus(worklet, StatusBuilding, "")
	
	repoPath, err := m.gitClient.CloneRepository(worklet.GitRepo, worklet.Branch)
	if err != nil {
		m.updateWorkletStatus(worklet, StatusError, fmt.Sprintf("Failed to clone repository: %v", err))
		return
	}
	
	m.updateWorkletStatus(worklet, StatusDeploying, "")
	
	containerID, port, err := m.dockerClient.BuildAndRun(ctx, repoPath, worklet)
	if err != nil {
		m.updateWorkletStatus(worklet, StatusError, fmt.Sprintf("Failed to build and run container: %v", err))
		return
	}
	
	worklet.ContainerID = containerID
	worklet.Port = port
	worklet.WebURL = fmt.Sprintf("http://localhost:%d", port)
	
	if worklet.BasePrompt != "" {
		if err := m.claudeClient.ApplyPrompt(ctx, repoPath, worklet.BasePrompt); err != nil {
			slog.Error("Failed to apply base prompt", "error", err, "workletID", worklet.ID)
		}
	}
	
	m.updateWorkletStatus(worklet, StatusRunning, "")
	
	slog.Info("Worklet deployed successfully", "workletID", worklet.ID, "url", worklet.WebURL)
}

func (m *Manager) processPromptAsync(ctx context.Context, worklet *Worklet, workletPrompt *WorkletPrompt) {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("Panic in processPromptAsync", "error", r, "workletID", worklet.ID)
			workletPrompt.Status = "error"
			workletPrompt.Response = fmt.Sprintf("Processing panic: %v", r)
			m.db.Save(workletPrompt)
		}
	}()
	
	repoPath := m.gitClient.GetRepoPath(worklet.GitRepo, worklet.Branch)
	
	response, err := m.claudeClient.ProcessPrompt(ctx, repoPath, workletPrompt.Prompt)
	if err != nil {
		workletPrompt.Status = "error"
		workletPrompt.Response = fmt.Sprintf("Failed to process prompt: %v", err)
		slog.Error("Failed to process prompt", "error", err, "workletID", worklet.ID)
	} else {
		workletPrompt.Status = "completed"
		workletPrompt.Response = response
		
		worklet.LastPrompt = workletPrompt.Prompt
		worklet.UpdatedAt = time.Now()
		m.db.Save(worklet)
		
		if err := m.dockerClient.RestartContainer(worklet.ContainerID); err != nil {
			slog.Error("Failed to restart container after prompt", "error", err, "workletID", worklet.ID)
		}
	}
	
	m.db.Save(workletPrompt)
}

func (m *Manager) updateWorkletStatus(worklet *Worklet, status Status, errorMsg string) {
	worklet.Status = status
	worklet.LastError = errorMsg
	worklet.UpdatedAt = time.Now()
	
	if err := m.db.Save(worklet).Error; err != nil {
		slog.Error("Failed to update worklet status", "error", err, "workletID", worklet.ID)
	}
	
	m.mu.Lock()
	m.worklets[worklet.ID] = worklet
	m.mu.Unlock()
}

func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}