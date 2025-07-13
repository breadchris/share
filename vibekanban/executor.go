package vibekanban

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"time"

	"github.com/google/uuid"
)

// ExecutorConfig represents different AI executor types
type ExecutorConfig int

const (
	ExecutorEcho ExecutorConfig = iota
	ExecutorClaude
	ExecutorAmp
	ExecutorGemini
	ExecutorOpencode
)

func (e ExecutorConfig) String() string {
	switch e {
	case ExecutorEcho:
		return "echo"
	case ExecutorClaude:
		return "claude"
	case ExecutorAmp:
		return "amp"
	case ExecutorGemini:
		return "gemini"
	case ExecutorOpencode:
		return "opencode"
	default:
		return "unknown"
	}
}

// ExecutorType represents the specific type of execution to perform
type ExecutorType interface {
	Config() ExecutorConfig
	IsFollowup() bool
}

// CodingAgentType represents a new coding agent execution
type CodingAgentType struct {
	ExecutorConfig ExecutorConfig
}

func (c CodingAgentType) Config() ExecutorConfig { return c.ExecutorConfig }
func (c CodingAgentType) IsFollowup() bool       { return false }

// FollowupCodingAgentType represents a follow-up execution with session continuity
type FollowupCodingAgentType struct {
	ExecutorConfig ExecutorConfig
	SessionID      string
	Prompt         string
}

func (f FollowupCodingAgentType) Config() ExecutorConfig { return f.ExecutorConfig }
func (f FollowupCodingAgentType) IsFollowup() bool       { return true }

// SetupScriptType represents setup script execution
type SetupScriptType struct {
	Script string
}

func (s SetupScriptType) Config() ExecutorConfig { return ExecutorEcho }
func (s SetupScriptType) IsFollowup() bool       { return false }

// DevServerType represents dev server execution
type DevServerType struct {
	Script string
}

func (d DevServerType) Config() ExecutorConfig { return ExecutorEcho }
func (d DevServerType) IsFollowup() bool       { return false }

// ActionType represents the type of action being performed by a tool
type ActionType struct {
	Type        string            `json:"type"`
	Path        string            `json:"path,omitempty"`
	Command     string            `json:"command,omitempty"`
	Query       string            `json:"query,omitempty"`
	URL         string            `json:"url,omitempty"`
	Description string            `json:"description,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// NewFileReadAction creates a file read action
func NewFileReadAction(path string) ActionType {
	return ActionType{Type: "file_read", Path: path}
}

// NewFileWriteAction creates a file write action
func NewFileWriteAction(path string) ActionType {
	return ActionType{Type: "file_write", Path: path}
}

// NewCommandRunAction creates a command run action
func NewCommandRunAction(command string) ActionType {
	return ActionType{Type: "command_run", Command: command}
}

// NewSearchAction creates a search action
func NewSearchAction(query string) ActionType {
	return ActionType{Type: "search", Query: query}
}

// NewWebFetchAction creates a web fetch action
func NewWebFetchAction(url string) ActionType {
	return ActionType{Type: "web_fetch", URL: url}
}

// NewTaskCreateAction creates a task creation action
func NewTaskCreateAction(description string) ActionType {
	return ActionType{Type: "task_create", Description: description}
}

// NewOtherAction creates a generic action
func NewOtherAction(description string) ActionType {
	return ActionType{Type: "other", Description: description}
}

// NormalizedEntryType represents the type of entry in a conversation
type NormalizedEntryType struct {
	Type       string     `json:"type"`
	ToolName   string     `json:"tool_name,omitempty"`
	ActionType ActionType `json:"action_type,omitempty"`
}

// NormalizedEntry represents a single entry in a normalized conversation
type NormalizedEntry struct {
	Timestamp *time.Time           `json:"timestamp,omitempty"`
	Type      NormalizedEntryType  `json:"entry_type"`
	Content   string               `json:"content"`
	Metadata  *json.RawMessage     `json:"metadata,omitempty"`
}

// NormalizedConversation represents a normalized conversation for different executor formats
type NormalizedConversation struct {
	Entries      []NormalizedEntry `json:"entries"`
	SessionID    *string           `json:"session_id,omitempty"`
	ExecutorType string            `json:"executor_type"`
	Prompt       *string           `json:"prompt,omitempty"`
	Summary      *string           `json:"summary,omitempty"`
}

// SpawnContext provides context information for spawn failures
type SpawnContext struct {
	ExecutorType      string
	Command           string
	Args              []string
	WorkingDir        string
	TaskID            *uuid.UUID
	TaskTitle         *string
	AdditionalContext *string
}

// WithExecutorType sets the executor type
func (s SpawnContext) WithExecutorType(executorType string) SpawnContext {
	s.ExecutorType = executorType
	return s
}

// WithTask adds task context
func (s SpawnContext) WithTask(taskID uuid.UUID, taskTitle *string) SpawnContext {
	s.TaskID = &taskID
	s.TaskTitle = taskTitle
	return s
}

// WithContext adds additional context
func (s SpawnContext) WithContext(context string) SpawnContext {
	s.AdditionalContext = &context
	return s
}

// SpawnError creates an executor error from spawn context
func (s SpawnContext) SpawnError(err error) ExecutorError {
	return ExecutorError{
		Type:    "spawn_failed",
		Message: fmt.Sprintf("Failed to spawn %s: %v", s.ExecutorType, err),
		Context: &s,
		Cause:   err,
	}
}

// NewSpawnContextFromCommand creates a SpawnContext from a command
func NewSpawnContextFromCommand(cmd *exec.Cmd, executorType string) SpawnContext {
	args := []string{}
	if len(cmd.Args) > 1 {
		args = cmd.Args[1:]
	}
	
	return SpawnContext{
		ExecutorType: executorType,
		Command:      cmd.Path,
		Args:         args,
		WorkingDir:   cmd.Dir,
	}
}

// ExecutorError represents an error from executor operations
type ExecutorError struct {
	Type    string        `json:"type"`
	Message string        `json:"message"`
	Context *SpawnContext `json:"context,omitempty"`
	Cause   error         `json:"-"`
}

func (e ExecutorError) Error() string {
	return e.Message
}

func (e ExecutorError) Unwrap() error {
	return e.Cause
}

// NewExecutorError creates a new executor error
func NewExecutorError(errorType, message string) ExecutorError {
	return ExecutorError{
		Type:    errorType,
		Message: message,
	}
}

// NewSpawnFailedError creates a spawn failed error
func NewSpawnFailedError(err error, context SpawnContext) ExecutorError {
	return ExecutorError{
		Type:    "spawn_failed",
		Message: fmt.Sprintf("Failed to spawn %s: %v", context.ExecutorType, err),
		Context: &context,
		Cause:   err,
	}
}

// Executor interface for different AI executors
type Executor interface {
	// Spawn starts the executor process and returns the running process
	Spawn(ctx context.Context, taskID uuid.UUID, worktreePath string) (*exec.Cmd, error)
	
	// NormalizeLogs processes raw logs and converts them to normalized conversation format
	NormalizeLogs(logs string, worktreePath string) (*NormalizedConversation, error)
	
	// GetExecutorType returns the type of this executor
	GetExecutorType() ExecutorConfig
}

// CreateExecutor creates an executor instance based on the configuration
func CreateExecutor(config ExecutorConfig) Executor {
	switch config {
	case ExecutorClaude:
		return &ClaudeExecutor{}
	case ExecutorEcho:
		return &EchoExecutor{}
	default:
		// Default to echo for unknown types
		return &EchoExecutor{}
	}
}

// CreateFollowupExecutor creates a follow-up executor with session continuity
func CreateFollowupExecutor(config ExecutorConfig, sessionID string, prompt string) Executor {
	switch config {
	case ExecutorClaude:
		return &ClaudeFollowupExecutor{
			SessionID: sessionID,
			Prompt:    prompt,
		}
	default:
		// Default to regular executor for unsupported follow-up types
		return CreateExecutor(config)
	}
}

// EchoExecutor is a simple executor for testing
type EchoExecutor struct{}

func (e *EchoExecutor) Spawn(ctx context.Context, taskID uuid.UUID, worktreePath string) (*exec.Cmd, error) {
	cmd := exec.CommandContext(ctx, "echo", fmt.Sprintf("Echo executor for task %s", taskID))
	cmd.Dir = worktreePath
	return cmd, nil
}

func (e *EchoExecutor) NormalizeLogs(logs string, worktreePath string) (*NormalizedConversation, error) {
	entries := []NormalizedEntry{
		{
			Type: NormalizedEntryType{Type: "assistant_message"},
			Content: logs,
		},
	}
	
	return &NormalizedConversation{
		Entries:      entries,
		ExecutorType: "echo",
	}, nil
}

func (e *EchoExecutor) GetExecutorType() ExecutorConfig {
	return ExecutorEcho
}