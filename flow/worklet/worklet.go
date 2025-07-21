package worklet

import (
	"time"

	"github.com/google/uuid"
	"github.com/breadchris/flow/models"
)

type Status string

const (
	StatusCreating  Status = "creating"
	StatusRunning   Status = "running"
	StatusStopped   Status = "stopped"
	StatusError     Status = "error"
	StatusBuilding  Status = "building"
	StatusDeploying Status = "deploying"
)

type Worklet struct {
	models.Model
	Name        string                        `json:"name" gorm:"not null"`
	Description string                        `json:"description"`
	Status      Status                        `json:"status" gorm:"not null"`
	GitRepo     string                        `json:"git_repo" gorm:"not null"`
	Branch      string                        `json:"branch" gorm:"not null"`
	BasePrompt  string                        `json:"base_prompt" gorm:"type:text"`
	WebURL      string                        `json:"web_url"`
	Port        int                           `json:"port"`
	Environment *models.JSONField[map[string]string] `json:"environment"`
	UserID      string                        `json:"user_id" gorm:"index;not null"`
	ContainerID string                        `json:"container_id" gorm:"index"`
	SessionID   string                        `json:"session_id" gorm:"index"`
	LastPrompt  string                        `json:"last_prompt" gorm:"type:text"`
	LastError   string                        `json:"last_error" gorm:"type:text"`
	BuildLogs   string                        `json:"build_logs" gorm:"type:text"`
	User        *models.User                  `gorm:"foreignKey:UserID"`
	Container   *models.Container             `gorm:"foreignKey:ContainerID"`
}

type WorkletPrompt struct {
	models.Model
	WorkletID string `json:"worklet_id" gorm:"index;not null"`
	Prompt    string `json:"prompt" gorm:"type:text;not null"`
	Response  string `json:"response" gorm:"type:text"`
	Status    string `json:"status" gorm:"not null"`
	UserID    string `json:"user_id" gorm:"index;not null"`
	Worklet   *Worklet `gorm:"foreignKey:WorkletID"`
	User      *models.User `gorm:"foreignKey:UserID"`
}

type CreateWorkletRequest struct {
	Name        string            `json:"name" binding:"required"`
	Description string            `json:"description"`
	GitRepo     string            `json:"git_repo" binding:"required"`
	Branch      string            `json:"branch"`
	BasePrompt  string            `json:"base_prompt"`
	Environment map[string]string `json:"environment"`
}

type PromptRequest struct {
	Prompt string `json:"prompt" binding:"required"`
}

type WorkletResponse struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Status      Status            `json:"status"`
	GitRepo     string            `json:"git_repo"`
	Branch      string            `json:"branch"`
	WebURL      string            `json:"web_url"`
	Port        int               `json:"port"`
	Environment map[string]string `json:"environment"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	LastPrompt  string            `json:"last_prompt"`
	LastError   string            `json:"last_error"`
}

func (w *Worklet) ToResponse() WorkletResponse {
	var env map[string]string
	if w.Environment != nil {
		env = w.Environment.Data
	}
	
	return WorkletResponse{
		ID:          w.ID,
		Name:        w.Name,
		Description: w.Description,
		Status:      w.Status,
		GitRepo:     w.GitRepo,
		Branch:      w.Branch,
		WebURL:      w.WebURL,
		Port:        w.Port,
		Environment: env,
		CreatedAt:   w.CreatedAt,
		UpdatedAt:   w.UpdatedAt,
		LastPrompt:  w.LastPrompt,
		LastError:   w.LastError,
	}
}

func NewWorklet(req CreateWorkletRequest, userID string) *Worklet {
	branch := req.Branch
	if branch == "" {
		branch = "main"
	}
	
	return &Worklet{
		Model:       models.Model{ID: uuid.New().String()},
		Name:        req.Name,
		Description: req.Description,
		Status:      StatusCreating,
		GitRepo:     req.GitRepo,
		Branch:      branch,
		BasePrompt:  req.BasePrompt,
		Environment: models.MakeJSONField(req.Environment),
		UserID:      userID,
		SessionID:   uuid.New().String(),
	}
}