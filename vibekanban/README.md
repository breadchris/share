# Vibe Kanban

A task orchestration and management tool for AI coding agents, rewritten in Go and TypeScript/React following the patterns from the original [vibe-kanban](https://github.com/BloopAI/vibe-kanban.git) project.

## Features Implemented

### Backend (Go)

1. **Database Models** (`models.go`)
   - `VibeProject`: Git repository projects with setup/dev scripts
   - `VibeTask`: Individual coding tasks with status tracking
   - `VibeTaskAttempt`: Execution attempts with git worktree isolation
   - `VibeExecutionProcess`: Process management for setup, AI agents, and dev servers
   - `VibeExecutorSession`: AI agent session tracking
   - `VibeAgentConfig` & `VibeMCPServer`: Configuration management

2. **API Endpoints** (`vibekanban.go`)
   - Project CRUD operations
   - Task management with status updates
   - Task attempt creation and execution
   - Git operations (branches, diff, merge)
   - Process management (setup, agents, dev servers)

3. **Git Integration** (`git.go`)
   - Worktree creation and management for isolated task execution
   - Branch creation and switching
   - Diff generation and commit operations
   - Merge operations with automatic cleanup

4. **Process Management** (`process.go`)
   - AI agent execution (Claude, Gemini, Amp, etc.)
   - Setup script execution
   - Development server management
   - Real-time output streaming
   - Process lifecycle management

### Frontend (TypeScript/React)

1. **Main Application** (`VibeKanbanApp.tsx`)
   - Project selection and navigation
   - Task details panel integration
   - User interface coordination

2. **Project Management** (`ProjectList.tsx`)
   - Project listing with task summaries
   - New project creation dialog
   - Project deletion with confirmation

3. **Kanban Board** (`VibeKanban.tsx`)
   - Drag-and-drop task management
   - Status-based columns (Todo, In Progress, In Review, Done)
   - Task cards with priority indicators
   - Quick task starting functionality

4. **Task Details Panel** (`TaskDetailsPanel.tsx`)
   - Tabbed interface for task information
   - Git diff viewer for code changes
   - Process logs with real-time output
   - AI conversation interface
   - Attempt history and management

## Architecture

### Database Schema
- Uses GORM for ORM with auto-migration
- JSONField generic type for flexible metadata storage
- Relationship mapping between projects, tasks, attempts, and processes

### Git Workflow
- Each task attempt creates an isolated git worktree
- Changes are committed and can be merged back to main branch
- Support for GitHub PR creation (API endpoints ready)

### Process Execution
- Managed process lifecycle with status tracking
- Real-time output capture and streaming
- Support for multiple AI agent types
- Development server management with port allocation

### API Design
- RESTful endpoints following `/api/vibe-kanban` prefix
- Consistent error handling and response formats
- User authentication integration points
- CORS and middleware support ready

## Integration with Main Application

The vibe-kanban system integrates with the main share application through:

1. **Database**: Uses the existing GORM database with new model additions
2. **Routing**: Mounts under `/api/vibe-kanban` prefix
3. **Authentication**: Ready for user context integration
4. **File System**: Uses temporary directories for git worktrees

## Usage

### Setting up a Project

1. Create a new project with local git repository path
2. Configure setup and dev scripts
3. Set default branch for new task attempts

### Managing Tasks

1. Create tasks with descriptions and priorities
2. Start task attempts to begin AI-assisted work
3. Monitor progress through the kanban board
4. Review changes in the diff tab
5. Track process execution in the logs tab
6. Interact with AI agents through the conversation tab

### AI Agent Integration

The system supports multiple AI coding agents:
- Claude (via `@anthropic-ai/claude-cli`)
- Gemini (via `@google-ai/gemini-cli`) 
- Amp (direct binary)
- Configurable through `VibeAgentConfig`

## Next Steps

Remaining features to implement:
1. GitHub OAuth authentication flow
2. Configuration management for AI agents and MCP servers
3. Enhanced drag-and-drop functionality
4. WebSocket support for real-time updates
5. Session persistence and recovery
6. Performance optimization and caching

## Dependencies

### Go Packages
- `github.com/gin-gonic/gin` - HTTP framework
- `gorm.io/gorm` - ORM
- `github.com/go-git/go-git/v5` - Git operations
- `github.com/google/uuid` - UUID generation

### Frontend Packages
- `react` - UI framework
- `react-dnd` - Drag and drop functionality
- `react-dnd-html5-backend` - HTML5 backend for react-dnd
- `tailwindcss` - Styling

The implementation follows the existing patterns in the share repository and provides a solid foundation for AI-assisted software development workflows.