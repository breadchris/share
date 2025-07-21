package worklet

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
)

type DockerClient struct {
	client *client.Client
}

func NewDockerClient() *DockerClient {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		slog.Error("Failed to create Docker client", "error", err)
		return nil
	}
	
	return &DockerClient{
		client: cli,
	}
}

func (d *DockerClient) BuildAndRun(ctx context.Context, repoPath string, worklet *Worklet) (string, int, error) {
	if d.client == nil {
		return "", 0, fmt.Errorf("docker client not initialized")
	}
	
	imageName := fmt.Sprintf("worklet-%s", worklet.ID)
	
	if err := d.buildImage(ctx, repoPath, imageName, worklet); err != nil {
		return "", 0, fmt.Errorf("failed to build image: %w", err)
	}
	
	containerID, port, err := d.runContainer(ctx, imageName, worklet)
	if err != nil {
		return "", 0, fmt.Errorf("failed to run container: %w", err)
	}
	
	return containerID, port, nil
}

func (d *DockerClient) buildImage(ctx context.Context, repoPath, imageName string, worklet *Worklet) error {
	dockerfile := d.generateDockerfile(repoPath)
	
	dockerfilePath := filepath.Join(repoPath, "Dockerfile.worklet")
	if err := os.WriteFile(dockerfilePath, []byte(dockerfile), 0644); err != nil {
		return fmt.Errorf("failed to write Dockerfile: %w", err)
	}
	defer os.Remove(dockerfilePath)
	
	buildContext, err := d.createBuildContext(repoPath)
	if err != nil {
		return fmt.Errorf("failed to create build context: %w", err)
	}
	defer buildContext.Close()
	
	buildOptions := types.ImageBuildOptions{
		Tags:       []string{imageName},
		Dockerfile: "Dockerfile.worklet",
		Remove:     true,
		Context:    buildContext,
	}
	
	buildResponse, err := d.client.ImageBuild(ctx, buildContext, buildOptions)
	if err != nil {
		return fmt.Errorf("failed to build image: %w", err)
	}
	defer buildResponse.Body.Close()
	
	buildLogs, err := io.ReadAll(buildResponse.Body)
	if err != nil {
		slog.Error("Failed to read build logs", "error", err)
	} else {
		worklet.BuildLogs = string(buildLogs)
	}
	
	return nil
}

func (d *DockerClient) runContainer(ctx context.Context, imageName string, worklet *Worklet) (string, int, error) {
	port, err := d.findFreePort()
	if err != nil {
		return "", 0, fmt.Errorf("failed to find free port: %w", err)
	}
	
	containerPort := nat.Port("3000/tcp")
	hostBinding := nat.PortBinding{
		HostIP:   "0.0.0.0",
		HostPort: fmt.Sprintf("%d", port),
	}
	
	env := []string{
		"NODE_ENV=development",
		"PORT=3000",
	}
	
	if worklet.Environment != nil {
		for key, value := range worklet.Environment.Data {
			env = append(env, fmt.Sprintf("%s=%s", key, value))
		}
	}
	
	containerConfig := &container.Config{
		Image:        imageName,
		ExposedPorts: nat.PortSet{containerPort: struct{}{}},
		Env:          env,
		WorkingDir:   "/app",
		Cmd:          []string{"npm", "start"},
	}
	
	hostConfig := &container.HostConfig{
		PortBindings: nat.PortMap{
			containerPort: []nat.PortBinding{hostBinding},
		},
		RestartPolicy: container.RestartPolicy{
			Name: "unless-stopped",
		},
	}
	
	networkConfig := &network.NetworkingConfig{}
	
	containerName := fmt.Sprintf("worklet-%s", worklet.ID)
	
	resp, err := d.client.ContainerCreate(ctx, containerConfig, hostConfig, networkConfig, nil, containerName)
	if err != nil {
		return "", 0, fmt.Errorf("failed to create container: %w", err)
	}
	
	if err := d.client.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", 0, fmt.Errorf("failed to start container: %w", err)
	}
	
	time.Sleep(2 * time.Second)
	
	if !d.isContainerHealthy(ctx, resp.ID) {
		return "", 0, fmt.Errorf("container failed to start properly")
	}
	
	return resp.ID, port, nil
}

func (d *DockerClient) StopContainer(containerID string) error {
	if d.client == nil {
		return fmt.Errorf("docker client not initialized")
	}
	
	ctx := context.Background()
	timeoutSeconds := 10
	
	return d.client.ContainerStop(ctx, containerID, container.StopOptions{
		Timeout: &timeoutSeconds,
	})
}

func (d *DockerClient) RemoveContainer(containerID string) error {
	if d.client == nil {
		return fmt.Errorf("docker client not initialized")
	}
	
	ctx := context.Background()
	
	return d.client.ContainerRemove(ctx, containerID, container.RemoveOptions{
		Force: true,
	})
}

func (d *DockerClient) RestartContainer(containerID string) error {
	if d.client == nil {
		return fmt.Errorf("docker client not initialized")
	}
	
	ctx := context.Background()
	timeoutSeconds := 10
	
	return d.client.ContainerRestart(ctx, containerID, container.StopOptions{
		Timeout: &timeoutSeconds,
	})
}

func (d *DockerClient) generateDockerfile(repoPath string) string {
	hasPackageJson := false
	hasRequirementsTxt := false
	hasGoMod := false
	
	if _, err := os.Stat(filepath.Join(repoPath, "package.json")); err == nil {
		hasPackageJson = true
	}
	if _, err := os.Stat(filepath.Join(repoPath, "requirements.txt")); err == nil {
		hasRequirementsTxt = true
	}
	if _, err := os.Stat(filepath.Join(repoPath, "go.mod")); err == nil {
		hasGoMod = true
	}
	
	var dockerfile strings.Builder
	
	if hasPackageJson {
		dockerfile.WriteString(`FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
`)
	} else if hasRequirementsTxt {
		dockerfile.WriteString(`FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 3000
CMD ["python", "app.py"]
`)
	} else if hasGoMod {
		dockerfile.WriteString(`FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 3000
CMD ["./main"]
`)
	} else {
		dockerfile.WriteString(`FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`)
	}
	
	return dockerfile.String()
}

func (d *DockerClient) createBuildContext(repoPath string) (io.ReadCloser, error) {
	return os.Open(repoPath)
}

func (d *DockerClient) findFreePort() (int, error) {
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		return 0, err
	}
	defer listener.Close()
	
	return listener.Addr().(*net.TCPAddr).Port, nil
}

func (d *DockerClient) isContainerHealthy(ctx context.Context, containerID string) bool {
	inspect, err := d.client.ContainerInspect(ctx, containerID)
	if err != nil {
		return false
	}
	
	return inspect.State.Running
}