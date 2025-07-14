# VibeKanban Protocol Buffers & ConnectRPC Implementation

## Overview

VibeKanban is a task management system built with a modern type-safe architecture using Protocol Buffers (protobuf) for schema definition and ConnectRPC for client-server communication. This document outlines the complete implementation structure.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (TypeScript)  │    │   (Go)          │    │   (SQLite)      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ ConnectRPC      │◄──►│ ConnectRPC      │◄──►│ GORM Models     │
│ Client          │    │ Service         │    │                 │
│                 │    │                 │    │                 │
│ @connectrpc/    │    │ connectrpc.com/ │    │ • VibeProject   │
│ connect-web     │    │ connect         │    │ • VibeTask      │
│                 │    │                 │    │ • VibeTaskAttempt│
│ Protobuf-ES v2  │    │ Protobuf Go     │    │ • VibeExecution │
│ Generated Types │    │ Generated Types │    │   Process       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Protocol Buffer Schema

**Location**: `proto/vibekanban/vibekanban.proto`

### Core Data Models

#### Project
- **ID**: Unique identifier
- **Name**: Human-readable project name
- **GitRepoPath**: Absolute path to git repository
- **SetupScript**: Script to run for project setup
- **DevScript**: Script to run development server
- **DefaultBranch**: Default git branch (usually "main")
- **Config**: Project-specific configuration (JSON)
- **Tasks**: Associated tasks
- **Timestamps**: Created/Updated

#### Task
- **ID**: Unique identifier
- **Title**: Task title
- **Description**: Detailed description
- **Status**: Enum (TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED)
- **Priority**: Enum (LOW, MEDIUM, HIGH)
- **ProjectID**: Foreign key to project
- **Labels**: Array of string labels
- **Metadata**: Additional data (JSON)
- **Attempts**: Task execution attempts
- **Timestamps**: Created/Updated

#### TaskAttempt
- **ID**: Unique identifier
- **TaskID**: Foreign key to task
- **WorktreePath**: Git worktree path for isolated execution
- **Branch**: Git branch for this attempt
- **BaseBranch**: Branch this was created from
- **MergeCommit**: Commit hash if merged
- **Executor**: AI agent used (claude, gemini, etc.)
- **Status**: Enum (PENDING, RUNNING, COMPLETED, FAILED)
- **PRURL**: GitHub PR URL if created
- **Processes**: Execution processes
- **Sessions**: Executor sessions
- **Timestamps**: Start/End times, Created/Updated

#### ExecutionProcess
- **ID**: Unique identifier
- **AttemptID**: Foreign key to attempt
- **Type**: Enum (SETUP_SCRIPT, CODING_AGENT, DEV_SERVER)
- **Status**: Enum (PENDING, RUNNING, COMPLETED, FAILED, KILLED)
- **Command**: Command executed
- **ProcessID**: System process ID
- **Output**: Stdout/Stderr
- **ExitCode**: Process exit code
- **Port**: Network port (for dev server)
- **URL**: Service URL
- **Timestamps**: Start/End times, Created/Updated

### Service Operations

The service defines 21 RPC methods across 6 categories:

#### Project Operations (5 methods)
- `GetProject` - Fetch single project with tasks
- `ListProjects` - List all user projects
- `CreateProject` - Create new project
- `UpdateProject` - Update project fields
- `DeleteProject` - Delete project and cascaded data

#### Task Operations (4 methods)
- `GetTasks` - List tasks for a project
- `CreateTask` - Create new task
- `UpdateTask` - Update task fields/status
- `DeleteTask` - Delete task

#### Task Attempt Operations (5 methods)
- `GetTaskAttempts` - List attempts for a task
- `CreateTaskAttempt` - Create new execution attempt
- `StartTaskAttempt` - Start attempt (create worktree)
- `GetAttemptDiff` - Get git diff for attempt
- `MergeAttempt` - Merge completed attempt

#### Git Operations (2 methods)
- `GetProjectBranches` - List repository branches
- `CreateProjectBranch` - Create new branch

#### Process Operations (2 methods)
- `GetProcesses` - List processes for attempt
- `KillProcess` - Terminate running process

#### Debug Operations (2 methods)
- `GetAttemptStatus` - Detailed attempt status
- `GetDebugProcesses` - All processes for debugging

## Code Generation Workflow

### 1. Protobuf Schema Definition
```bash
# Schema location
proto/vibekanban/vibekanban.proto
```

### 2. Code Generation with buf
**Configuration**: `buf.gen.yaml` (v2 format)

```yaml
version: v2
plugins:
  - local: protoc-gen-go              # Go types
    out: gen
    opt: paths=source_relative
  - local: protoc-gen-connect-go      # Go ConnectRPC service
    out: gen
    opt: paths=source_relative
  - local: protoc-gen-es              # TypeScript types
    opt:
    - target=ts
    include_imports: true
    out: ./gen
```

### 3. Generated Files
```
gen/proto/vibekanban/
├── vibekanban.pb.go                    # Go protobuf types
├── vibekanban_pb.ts                    # TypeScript protobuf types
└── vibekanbanconnect/
    └── vibekanban.connect.go           # Go ConnectRPC service interface
```

### 4. Generation Command
```bash
# Run code generation
go generate .
# OR directly with buf
buf generate
```

## Backend Implementation

### Service Structure

**Location**: `vibekanban/service.go`

```go
type Service struct {
    vibekanbanconnect.UnimplementedVibeKanbanServiceHandler
    *VibeKanbanService // Embed existing business logic
}

// Implements all 21 RPC methods defined in protobuf
func (s *Service) GetProject(ctx context.Context, req *connect.Request[vibekanban.GetProjectRequest]) (*connect.Response[vibekanban.GetProjectResponse], error)
// ... other methods
```

### Key Implementation Patterns

#### 1. Authentication
```go
func (s *Service) getUserID(ctx context.Context) (string, error) {
    return s.VibeKanbanService.session.GetUserID(ctx)
}
```

#### 2. Error Handling
```go
if err == gorm.ErrRecordNotFound {
    return nil, connect.NewError(connect.CodeNotFound, err)
}
return nil, connect.NewError(connect.CodeInternal, err)
```

#### 3. Model Conversion
```go
func (s *Service) projectToProto(project *models.VibeProject) *vibekanban.Project {
    // Convert GORM model to protobuf message
}

func stringToTaskStatus(status string) vibekanban.TaskStatus {
    // Convert string enum to protobuf enum
}
```

#### 4. Business Logic Reuse
- Existing HTTP handlers in `vibekanban.go` contain business logic
- ConnectRPC service delegates to shared business logic functions
- Pattern: Extract logic to `business_logic.go`, call from both HTTP and ConnectRPC

### Data Flow
1. **Request**: Frontend sends ConnectRPC request
2. **Authentication**: Extract user ID from session context
3. **Validation**: Validate request parameters
4. **Business Logic**: Call shared business logic functions
5. **Database**: GORM operations with proper relationships
6. **Conversion**: Convert GORM models to protobuf messages
7. **Response**: Return typed ConnectRPC response

## Frontend Integration

### Client Setup

**Location**: `vibekanban/VibeKanban.tsx`

```typescript
import { createConnectTransport } from '@connectrpc/connect-web';
import { createClient } from '@connectrpc/connect';
import { VibeKanbanService } from '../gen/proto/vibekanban/vibekanban_pb';

// Create transport and client
const transport = createConnectTransport({
  baseUrl: '/vibekanban',
});
const client = createClient(VibeKanbanService, transport);
```

### Type-Safe API Calls

```typescript
// Create new task
const request = new CreateTaskRequest({
  projectId: projectId,
  title: formData.title,
  priority: priorityToEnum(formData.priority),
  labels: labels,
});

const response = await client.createTask(request);
if (response.task) {
  onTaskCreated(response.task);
}
```

### Enum Handling

```typescript
// Convert between protobuf enums and string representations
function statusToEnum(status: string): TaskStatus {
  switch (status) {
    case 'todo': return TaskStatus.TODO;
    case 'inprogress': return TaskStatus.IN_PROGRESS;
    // ...
  }
}
```

## Database Schema

### GORM Models

**Location**: `models/models.go`

- **VibeProject**: Projects with git integration
- **VibeTask**: Tasks with status/priority tracking
- **VibeTaskAttempt**: Execution attempts with git worktrees
- **VibeExecutionProcess**: Process execution tracking
- **VibeExecutorSession**: AI agent conversation history

### Relationships
- Project → Tasks (One-to-Many)
- Task → Attempts (One-to-Many)
- Attempt → Processes (One-to-Many)
- Attempt → Sessions (One-to-Many)

### JSON Fields
```go
Config   *JSONField[map[string]interface{}] // Project config
Metadata *JSONField[map[string]interface{}] // Task metadata
Messages *JSONField[[]interface{}]          // Conversation history
```

## Git Integration

### GitService

**Location**: `vibekanban/git.go`

```go
type GitService struct {
    baseWorkdir string // Base directory for worktrees
}

// Key operations
func (g *GitService) CreateWorktree(repoPath, branchName, baseBranch string) (string, error)
func (g *GitService) GetBranches(repoPath string) ([]string, error)
func (g *GitService) GetBranchDiff(repoPath, baseBranch, targetBranch string) (string, error)
func (g *GitService) MergeBranch(repoPath, sourceBranch, targetBranch string) (string, error)
```

### Worktree Isolation
- Each task attempt gets isolated git worktree
- Unique branch per attempt: `task-{taskID}-{attemptID}`
- Clean separation prevents conflicts between concurrent attempts

## Process Management

### ProcessManager

**Location**: `vibekanban/process.go`

- **Setup Scripts**: Project initialization
- **Coding Agents**: AI-powered code generation
- **Dev Servers**: Development environment
- **Process Tracking**: Real-time monitoring

## Security & Authentication

### Session-Based Auth
- User sessions managed by `session.SessionManager`
- All operations require valid user session
- Resource access verified through user ownership

### Data Isolation
- All database queries filtered by `user_id`
- Cross-user data access prevented at service layer
- Git operations isolated to user's repositories

## Development Workflow

### 1. Schema Changes
1. Update `proto/vibekanban/vibekanban.proto`
2. Run `go generate .` or `buf generate`
3. Update service implementations
4. Update frontend type usage

### 2. Adding New Operations
1. Define RPC method in protobuf
2. Generate code
3. Implement in `service.go`
4. Add business logic to `business_logic.go` if reusable
5. Update frontend to use new method

### 3. Testing
```bash
# Run Go tests
go test ./vibekanban/...

# Test frontend integration
npm run build  # Build TypeScript components
```

## Performance Considerations

### Database
- Proper indexing on foreign keys
- Selective preloading for relationships
- Pagination for large result sets

### Protobuf
- Efficient binary serialization
- Smaller payload sizes vs JSON
- Type safety prevents runtime errors

### ConnectRPC
- HTTP/2 multiplexing
- Streaming support for real-time updates
- Built-in compression

## Monitoring & Debugging

### Debug Endpoints
- `/debug/attempts/{id}/status` - Detailed attempt status
- `/debug/processes` - All running processes

### Logging
- Debug prints for worktree operations
- Process execution tracking
- Error context preservation

## Future Enhancements

### Real-time Updates
- ConnectRPC streaming for live process output
- WebSocket fallback for browser compatibility

### Collaboration
- Multi-user project access
- Real-time attempt status sharing

### CI/CD Integration
- Automated testing for attempts
- GitHub Actions integration
- Deployment automation

## Summary

VibeKanban's protobuf/ConnectRPC implementation provides:

1. **Type Safety**: End-to-end type safety from database to UI
2. **Performance**: Efficient binary serialization and HTTP/2
3. **Maintainability**: Generated code reduces boilerplate
4. **Evolution**: Schema-first design enables safe API evolution
5. **Developer Experience**: IDE auto-completion and compile-time checks

The architecture successfully bridges modern web development practices with robust backend systems, providing a scalable foundation for collaborative AI-powered development workflows.