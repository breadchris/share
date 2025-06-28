package deps

import (
	"github.com/breadchris/share/ai"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/db"
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/session"
	"github.com/breadchris/share/websocket"
	"github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

type Deps struct {
	Dir               string
	DB                *gorm.DB
	Docs              *db.DocumentStore
	Session           *session.SessionManager
	Leaps             *leaps.Leaps
	AI                *openai.Client
	AIProxy           *ai.AI
	Config            config.AppConfig
	WebsocketRegistry *websocket.CommandRegistry
	BaseURL           string
	Search            SearchIndex
	Docker            DockerManager
}

type SearchIndex struct {
	Recipe *db.SearchIndex
}

type DockerManager interface {
	GetClient(hostID string) (DockerClient, error)
	ListContainers(hostID, userID string) ([]ContainerInfo, error)
	CreateContainer(hostID, userID string, config ContainerConfig) (*ContainerInfo, error)
	StartContainer(hostID, containerID string) error
	StopContainer(hostID, containerID string) error
	RemoveContainer(hostID, containerID string) error
	GetLogs(hostID, containerID string) (string, error)
}

type DockerClient interface {
	ListContainers() ([]ContainerInfo, error)
	CreateContainer(config ContainerConfig) (*ContainerInfo, error)
	StartContainer(containerID string) error
	StopContainer(containerID string) error
	RemoveContainer(containerID string) error
	GetLogs(containerID string) (string, error)
}

type ContainerInfo struct {
	ID      string            `json:"id"`
	Name    string            `json:"name"`
	Image   string            `json:"image"`
	Status  string            `json:"status"`
	Command string            `json:"command"`
	Ports   map[string]string `json:"ports"`
	Env     map[string]string `json:"environment"`
}

type ContainerConfig struct {
	Image      string            `json:"image"`
	Name       string            `json:"name"`
	Command    []string          `json:"command"`
	Env        map[string]string `json:"environment"`
	Ports      map[string]string `json:"ports"`
	Volumes    map[string]string `json:"volumes"`
	WorkingDir string            `json:"working_dir"`
	AutoRemove bool              `json:"auto_remove"`
}
