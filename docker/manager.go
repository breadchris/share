package docker

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"gorm.io/gorm"
)

type Manager struct {
	db      *gorm.DB
	clients sync.Map // map[string]*client.Client
	mutex   sync.RWMutex
}

func NewManager(db *gorm.DB) *Manager {
	return &Manager{
		db: db,
	}
}

func (m *Manager) GetClient(hostID string) (deps.DockerClient, error) {
	// Check if we already have a client for this host
	if cli, ok := m.clients.Load(hostID); ok {
		return &Client{cli: cli.(*client.Client)}, nil
	}

	// Get host configuration from database
	var host models.DockerHost
	if err := m.db.First(&host, "id = ?", hostID).Error; err != nil {
		return nil, fmt.Errorf("failed to get Docker host: %w", err)
	}

	// Create new client
	cli, err := m.createClient(&host)
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}

	// Store client for reuse
	m.clients.Store(hostID, cli)

	return &Client{cli: cli}, nil
}

func (m *Manager) createClient(host *models.DockerHost) (*client.Client, error) {
	opts := []client.Opt{
		client.WithHost(host.Endpoint),
		client.WithAPIVersionNegotiation(),
	}

	// Configure TLS if enabled
	if host.TLSVerify {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: false,
		}

		if host.TLSCA != "" || host.TLSCert != "" || host.TLSKey != "" {
			// TODO: Load certificates from host configuration
			// For now, use default TLS configuration
		}

		httpClient := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: tlsConfig,
			},
		}
		opts = append(opts, client.WithHTTPClient(httpClient))
	}

	return client.NewClientWithOpts(opts...)
}

func (m *Manager) ListContainers(hostID, userID string) ([]deps.ContainerInfo, error) {
	cli, err := m.GetClient(hostID)
	if err != nil {
		return nil, err
	}

	return cli.ListContainers()
}

func (m *Manager) CreateContainer(hostID, userID string, config deps.ContainerConfig) (*deps.ContainerInfo, error) {
	cli, err := m.GetClient(hostID)
	if err != nil {
		return nil, err
	}

	info, err := cli.CreateContainer(config)
	if err != nil {
		return nil, err
	}

	// Store container information in database
	container := &models.Container{
		Model: models.Model{
			ID: info.ID,
		},
		ContainerID:  info.ID,
		Name:         info.Name,
		Image:        info.Image,
		Status:       info.Status,
		Command:      info.Command,
		Ports:        models.MakeJSONField(info.Ports),
		Environment:  models.MakeJSONField(info.Env),
		UserID:       userID,
		DockerHostID: hostID,
	}

	if err := m.db.Create(container).Error; err != nil {
		return nil, fmt.Errorf("failed to store container in database: %w", err)
	}

	return info, nil
}

func (m *Manager) StartContainer(hostID, containerID string) error {
	cli, err := m.GetClient(hostID)
	if err != nil {
		return err
	}

	err = cli.StartContainer(containerID)
	if err != nil {
		return err
	}

	// Update container status in database
	return m.db.Model(&models.Container{}).
		Where("container_id = ? AND docker_host_id = ?", containerID, hostID).
		Update("status", "running").Error
}

func (m *Manager) StopContainer(hostID, containerID string) error {
	cli, err := m.GetClient(hostID)
	if err != nil {
		return err
	}

	err = cli.StopContainer(containerID)
	if err != nil {
		return err
	}

	// Update container status in database
	return m.db.Model(&models.Container{}).
		Where("container_id = ? AND docker_host_id = ?", containerID, hostID).
		Update("status", "stopped").Error
}

func (m *Manager) RemoveContainer(hostID, containerID string) error {
	cli, err := m.GetClient(hostID)
	if err != nil {
		return err
	}

	err = cli.RemoveContainer(containerID)
	if err != nil {
		return err
	}

	// Remove container from database
	return m.db.Where("container_id = ? AND docker_host_id = ?", containerID, hostID).
		Delete(&models.Container{}).Error
}

func (m *Manager) GetLogs(hostID, containerID string) (string, error) {
	cli, err := m.GetClient(hostID)
	if err != nil {
		return "", err
	}

	return cli.GetLogs(containerID)
}

// Client wraps the Docker client and implements the DockerClient interface
type Client struct {
	cli *client.Client
}

func (c *Client) ListContainers() ([]deps.ContainerInfo, error) {
	containers, err := c.cli.ContainerList(context.Background(), container.ListOptions{
		All: true,
	})
	if err != nil {
		return nil, err
	}

	var result []deps.ContainerInfo
	for _, container := range containers {
		name := ""
		if len(container.Names) > 0 {
			name = strings.TrimPrefix(container.Names[0], "/")
		}

		result = append(result, deps.ContainerInfo{
			ID:      container.ID[:12], // Short ID
			Name:    name,
			Image:   container.Image,
			Status:  container.Status,
			Command: container.Command,
			Ports:   convertPorts(container.Ports),
			Env:     make(map[string]string), // Environment not available in list
		})
	}

	return result, nil
}

func (c *Client) CreateContainer(config deps.ContainerConfig) (*deps.ContainerInfo, error) {
	// Convert environment map to slice
	var env []string
	for key, value := range config.Env {
		env = append(env, fmt.Sprintf("%s=%s", key, value))
	}

	// Create container configuration
	containerConfig := &container.Config{
		Image:      config.Image,
		Cmd:        config.Command,
		Env:        env,
		WorkingDir: config.WorkingDir,
	}

	hostConfig := &container.HostConfig{
		AutoRemove: config.AutoRemove,
		// TODO: Add port and volume mappings
	}

	resp, err := c.cli.ContainerCreate(context.Background(), containerConfig, hostConfig, nil, nil, config.Name)
	if err != nil {
		return nil, err
	}

	return &deps.ContainerInfo{
		ID:      resp.ID[:12],
		Name:    config.Name,
		Image:   config.Image,
		Status:  "created",
		Command: strings.Join(config.Command, " "),
		Ports:   config.Ports,
		Env:     config.Env,
	}, nil
}

func (c *Client) StartContainer(containerID string) error {
	return c.cli.ContainerStart(context.Background(), containerID, container.StartOptions{})
}

func (c *Client) StopContainer(containerID string) error {
	return c.cli.ContainerStop(context.Background(), containerID, container.StopOptions{})
}

func (c *Client) RemoveContainer(containerID string) error {
	return c.cli.ContainerRemove(context.Background(), containerID, container.RemoveOptions{
		Force: true,
	})
}

func (c *Client) GetLogs(containerID string) (string, error) {
	reader, err := c.cli.ContainerLogs(context.Background(), containerID, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       "100", // Last 100 lines
	})
	if err != nil {
		return "", err
	}
	defer reader.Close()

	// TODO: Properly read and format logs
	return "Container logs not fully implemented", nil
}

func convertPorts(ports []types.Port) map[string]string {
	result := make(map[string]string)
	for _, port := range ports {
		if port.PublicPort > 0 {
			key := fmt.Sprintf("%d/%s", port.PrivatePort, port.Type)
			value := fmt.Sprintf("%s:%d", port.IP, port.PublicPort)
			result[key] = value
		}
	}
	return result
}