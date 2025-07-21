# Worklet Package Requirements

This document outlines the requirements and functionality of the worklet package that enables prototype generation from git repositories.

## Overview

A worklet is a containerized prototype environment that accepts a git repository, branch, and prompt to create an interactive prototype accessible via web URL. Worklets support continuous prompting to iterate on the prototype and can generate pull requests with changes.

## Core Requirements

### 1. Worklet Lifecycle Management

- **Create**: Accept git repo URL, branch, and initial prompt
- **Deploy**: Clone repository, build Docker container, start web server
- **Update**: Accept new prompts, apply changes via Claude, rebuild
- **Expose**: Provide web URL for prototype access
- **Manage**: Start/stop/restart worklet containers

### 2. Git Repository Integration

- Clone public and private repositories (with GitHub token support)
- Support for different branches
- Automatic detection of project type (Node.js, Python, Go, static HTML)
- Commit changes made by Claude
- Create and push feature branches
- Generate pull requests via GitHub CLI

### 3. Docker Containerization

- **Automatic Dockerfile generation** based on project type:
  - Node.js projects: Use `node:18-alpine`, install dependencies, expose port 3000
  - Python projects: Use `python:3.9-slim`, install requirements, expose port 3000
  - Go projects: Multi-stage build with `golang:1.21-alpine`, compile binary
  - Static sites: Use `nginx:alpine` for serving HTML/CSS/JS
- Dynamic port allocation to avoid conflicts
- Container health monitoring
- Automatic restart on code changes

### 4. Claude Integration

- **Session Management**: Persistent Claude sessions tied to worklet lifecycle
- **Prompt Processing**: Accept natural language prompts for prototype modifications
- **Code Generation**: Use Claude to modify files based on prompts
- **Context Preservation**: Maintain conversation history and codebase context
- **Error Handling**: Graceful handling of Claude API failures

### 5. Web Access and Proxying

- **Reverse Proxy**: Route web traffic to running containers
- **URL Generation**: Provide accessible URLs for prototype viewing
- **Static File Serving**: Handle cases where container serves static files
- **Health Checks**: Monitor container availability and respond appropriately

## API Endpoints

### Worklet Management

- `POST /api/worklet/worklets` - Create new worklet
- `GET /api/worklet/worklets` - List user's worklets
- `GET /api/worklet/worklets/{id}` - Get worklet details
- `DELETE /api/worklet/worklets/{id}` - Delete worklet
- `POST /api/worklet/worklets/{id}/start` - Start worklet
- `POST /api/worklet/worklets/{id}/stop` - Stop worklet  
- `POST /api/worklet/worklets/{id}/restart` - Restart worklet

### Interaction

- `POST /api/worklet/worklets/{id}/prompt` - Send prompt to running worklet
- `POST /api/worklet/worklets/{id}/pr` - Create pull request from current state
- `GET /api/worklet/worklets/{id}/proxy/*` - Proxy to running prototype
- `GET /api/worklet/worklets/{id}/logs` - Get build and error logs
- `GET /api/worklet/worklets/{id}/status` - Get worklet status

## Worklet States

- **creating**: Initial state when worklet is being set up
- **building**: Docker image is being built
- **deploying**: Container is being started
- **running**: Worklet is active and accepting prompts
- **stopped**: Worklet has been manually stopped
- **error**: Worklet encountered an error and cannot continue

## Data Models

### Worklet

```go
type Worklet struct {
    ID          string    // Unique identifier
    Name        string    // User-friendly name
    Description string    // Optional description
    Status      Status    // Current state
    GitRepo     string    // Git repository URL
    Branch      string    // Git branch (defaults to "main")
    BasePrompt  string    // Initial prompt applied at creation
    WebURL      string    // URL to access prototype
    Port        int       // Assigned port number
    Environment map[string]string // Environment variables
    UserID      string    // Owner user ID
    ContainerID string    // Docker container ID
    SessionID   string    // Claude session ID
    LastPrompt  string    // Most recent prompt
    LastError   string    // Last error encountered
    BuildLogs   string    // Docker build output
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

### WorkletPrompt

```go
type WorkletPrompt struct {
    ID        string    // Unique identifier
    WorkletID string    // Associated worklet
    Prompt    string    // User prompt
    Response  string    // Claude response
    Status    string    // processing/completed/error
    UserID    string    // Requesting user
    CreatedAt time.Time
}
```

## Configuration Requirements

### Environment Variables

- `GITHUB_TOKEN`: For private repository access and PR creation
- `DOCKER_HOST`: Docker daemon connection (optional, defaults to local)
- `WORKLET_BASE_DIR`: Directory for repository clones (defaults to `/tmp/worklet-repos`)

### Dependencies

- **Docker**: Required for container management
- **Git**: For repository operations
- **GitHub CLI (gh)**: For pull request creation
- **Claude CLI**: For AI-powered code modifications

## Security Considerations

- **User Isolation**: Each worklet runs in its own container with limited resources
- **Port Management**: Dynamic port allocation prevents conflicts
- **Token Security**: GitHub tokens are passed securely via environment variables
- **File System**: Repository clones are isolated in temporary directories
- **Resource Limits**: Container resource constraints to prevent abuse

## Performance Considerations

- **Caching**: Repository clones are cached and reused when possible
- **Cleanup**: Automatic cleanup of old repositories and inactive containers
- **Session Management**: Claude sessions are reused for efficiency
- **Port Pool**: Efficient port allocation and release

## Error Handling

- **Build Failures**: Capture and expose Docker build errors
- **Runtime Errors**: Monitor container health and restart if needed
- **Git Errors**: Handle authentication and network issues gracefully
- **Claude Errors**: Retry failed prompts and maintain session state

## Usage Example

1. **Create worklet**: 
   ```bash
   curl -X POST /api/worklet/worklets \
     -H "Content-Type: application/json" \
     -H "X-User-ID: user123" \
     -d '{
       "name": "My App Prototype",
       "git_repo": "https://github.com/user/repo.git",
       "branch": "main",
       "base_prompt": "Convert this into a modern React app with Tailwind CSS"
     }'
   ```

2. **Send prompts**:
   ```bash
   curl -X POST /api/worklet/worklets/{id}/prompt \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Add a dark mode toggle to the header"}'
   ```

3. **Access prototype**: Visit the returned `web_url`

4. **Create PR**:
   ```bash
   curl -X POST /api/worklet/worklets/{id}/pr \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Add dark mode feature",
       "description": "Added dark mode toggle as requested"
     }'
   ```

## Future Enhancements

- **Multi-language support**: Extend beyond Node.js/Python/Go
- **Custom Dockerfiles**: Allow users to provide their own container definitions
- **Resource monitoring**: Track CPU/memory usage per worklet
- **Collaboration**: Share worklets between users
- **Version history**: Track and rollback prototype changes
- **Integration**: Connect with design tools like Figma
- **Deployment**: One-click deployment to cloud platforms