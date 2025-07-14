package vibekanban

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ClaudeExecutor implements the Executor interface for Claude AI
type ClaudeExecutor struct{}

// ClaudeFollowupExecutor implements follow-up execution with session continuity
type ClaudeFollowupExecutor struct {
	SessionID string
	Prompt    string
}

// ClaudeStreamMessage represents a single JSON message from Claude's stream output
type ClaudeStreamMessage struct {
	Type      string          `json:"type"`
	Subtype   string          `json:"subtype,omitempty"`
	SessionID string          `json:"session_id,omitempty"`
	Model     string          `json:"model,omitempty"`
	Message   json.RawMessage `json:"message,omitempty"`
	Data      json.RawMessage `json:"data,omitempty"`
}

// ClaudeMessage represents the structure of Claude's message content
type ClaudeMessage struct {
	ID      string                `json:"id"`
	Type    string                `json:"type"`
	Role    string                `json:"role"`
	Model   string                `json:"model"`
	Content []ClaudeContentBlock  `json:"content"`
}

// ClaudeContentBlock represents a content block within a Claude message
type ClaudeContentBlock struct {
	Type  string          `json:"type"`
	Text  string          `json:"text,omitempty"`
	Name  string          `json:"name,omitempty"`
	Input json.RawMessage `json:"input,omitempty"`
}

func (c *ClaudeExecutor) Spawn(ctx context.Context, taskID uuid.UUID, worktreePath string) (*exec.Cmd, error) {
	fmt.Printf("Debug: ClaudeExecutor.Spawn called with taskID: %s, worktreePath: %s\n", taskID.String(), worktreePath)
	
	// Validate worktree path exists
	if _, err := os.Stat(worktreePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("worktree path does not exist: %s", worktreePath)
	}
	
	// Check if npx is available
	if _, err := exec.LookPath("npx"); err != nil {
		fmt.Printf("Debug: npx not found in PATH, Claude executor will fail: %v\n", err)
		return nil, fmt.Errorf("npx not found in PATH - please install Node.js and npm: %w", err)
	}
	
	// Optionally check if Claude CLI is available (this takes time, so only in debug mode)
	if os.Getenv("CLAUDE_DEBUG") == "true" {
		fmt.Printf("Debug: Checking if Claude CLI is available...\n")
		checkCmd := exec.Command("npx", "@anthropic-ai/claude-code@latest", "--version")
		if err := checkCmd.Run(); err != nil {
			fmt.Printf("Debug: Claude CLI check failed (this is okay): %v\n", err)
		} else {
			fmt.Printf("Debug: Claude CLI is available\n")
		}
	}
	
	// Create a basic prompt - specific task details will be provided via stdin
	prompt := fmt.Sprintf("Task ID: %s\nPlease help with this task.", taskID.String())
	fmt.Printf("Debug: Created prompt for Claude: %s\n", prompt)

	// Create Claude command
	claudeCommand := "npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --verbose --output-format=stream-json"
	fmt.Printf("Debug: Claude command: %s\n", claudeCommand)
	
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(ctx, "cmd", "/C", claudeCommand)
	} else {
		cmd = exec.CommandContext(ctx, "sh", "-c", claudeCommand)
	}
	
	cmd.Dir = worktreePath
	// Set up environment with proper PATH and NODE settings
	env := os.Environ()
	env = append(env, "NODE_NO_WARNINGS=1")
	env = append(env, "FORCE_COLOR=0") // Disable colors for cleaner output
	cmd.Env = env
	
	fmt.Printf("Debug: Command setup complete, working directory: %s\n", cmd.Dir)
	
	// Set up pipes for better error handling
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdin pipe: %w", err)
	}
	
	// Don't start the command here - let the process manager handle it
	// Just return the configured command
	fmt.Printf("Debug: Claude command configured successfully\n")
	
	// Store stdin and prompt for later use
	go func() {
		// Wait a bit for the process to start, then write prompt
		time.Sleep(100 * time.Millisecond)
		defer stdin.Close()
		fmt.Printf("Debug: Writing prompt to Claude stdin\n")
		if _, err := stdin.Write([]byte(prompt + "\n")); err != nil {
			fmt.Printf("Debug: Failed to write prompt to Claude stdin: %v\n", err)
		} else {
			fmt.Printf("Debug: Successfully wrote prompt to Claude stdin\n")
		}
	}()
	
	return cmd, nil
}

func (c *ClaudeExecutor) NormalizeLogs(logs string, worktreePath string) (*NormalizedConversation, error) {
	var entries []NormalizedEntry
	var sessionID *string
	
	scanner := bufio.NewScanner(strings.NewReader(logs))
	
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		
		// Try to parse as JSON
		var msg ClaudeStreamMessage
		if err := json.Unmarshal([]byte(line), &msg); err != nil {
			// If not JSON, add as raw text
			entries = append(entries, NormalizedEntry{
				Type: NormalizedEntryType{Type: "system_message"},
				Content: fmt.Sprintf("Raw output: %s", line),
			})
			continue
		}
		
		// Extract session ID
		if sessionID == nil && msg.SessionID != "" {
			sessionID = &msg.SessionID
		}
		
		// Process different message types
		switch msg.Type {
		case "system":
			if msg.Subtype == "init" {
				rawMsg := json.RawMessage(line)
				entries = append(entries, NormalizedEntry{
					Type: NormalizedEntryType{Type: "system_message"},
					Content: fmt.Sprintf("System initialized with model: %s", msg.Model),
					Metadata: &rawMsg,
				})
			}
			
		case "assistant":
			if len(msg.Message) > 0 {
				var claudeMsg ClaudeMessage
				if err := json.Unmarshal(msg.Message, &claudeMsg); err == nil {
					c.processAssistantMessage(claudeMsg, &entries, worktreePath, line)
				}
			}
			
		case "user":
			if len(msg.Message) > 0 {
				var claudeMsg ClaudeMessage
				if err := json.Unmarshal(msg.Message, &claudeMsg); err == nil {
					c.processUserMessage(claudeMsg, &entries, line)
				}
			}
			
		case "result":
			// Skip result entries as requested in the original Rust code
			continue
			
		default:
			// Add unrecognized JSON
			rawMsg := json.RawMessage(line)
			entries = append(entries, NormalizedEntry{
				Type: NormalizedEntryType{Type: "system_message"},
				Content: fmt.Sprintf("Unrecognized JSON: %s", line),
				Metadata: &rawMsg,
			})
		}
	}
	
	return &NormalizedConversation{
		Entries:      entries,
		SessionID:    sessionID,
		ExecutorType: "claude",
	}, nil
}

func (c *ClaudeExecutor) processAssistantMessage(msg ClaudeMessage, entries *[]NormalizedEntry, worktreePath, rawLine string) {
	for _, content := range msg.Content {
		switch content.Type {
		case "text":
			rawMsg := json.RawMessage(rawLine)
			*entries = append(*entries, NormalizedEntry{
				Type: NormalizedEntryType{Type: "assistant_message"},
				Content: content.Text,
				Metadata: &rawMsg,
			})
			
		case "tool_use":
			actionType := c.extractActionType(content.Name, content.Input, worktreePath)
			contentStr := c.generateConciseContent(content.Name, content.Input, actionType, worktreePath)
			
			rawMsg := json.RawMessage(rawLine)
			*entries = append(*entries, NormalizedEntry{
				Type: NormalizedEntryType{
					Type: "tool_use",
					ToolName: content.Name,
					ActionType: actionType,
				},
				Content: contentStr,
				Metadata: &rawMsg,
			})
		}
	}
}

func (c *ClaudeExecutor) processUserMessage(msg ClaudeMessage, entries *[]NormalizedEntry, rawLine string) {
	for _, content := range msg.Content {
		if content.Type == "text" {
			rawMsg := json.RawMessage(rawLine)
			*entries = append(*entries, NormalizedEntry{
				Type: NormalizedEntryType{Type: "user_message"},
				Content: content.Text,
				Metadata: &rawMsg,
			})
		}
	}
}

func (c *ClaudeExecutor) extractActionType(toolName string, input json.RawMessage, worktreePath string) ActionType {
	var inputMap map[string]interface{}
	if err := json.Unmarshal(input, &inputMap); err != nil {
		return NewOtherAction(fmt.Sprintf("Tool: %s", toolName))
	}
	
	switch strings.ToLower(toolName) {
	case "read":
		if filePath, ok := inputMap["file_path"].(string); ok {
			return NewFileReadAction(c.makePathRelative(filePath, worktreePath))
		}
		return NewOtherAction("File read operation")
		
	case "edit", "write", "multiedit":
		if filePath, ok := inputMap["file_path"].(string); ok {
			return NewFileWriteAction(c.makePathRelative(filePath, worktreePath))
		}
		if path, ok := inputMap["path"].(string); ok {
			return NewFileWriteAction(c.makePathRelative(path, worktreePath))
		}
		return NewOtherAction("File write operation")
		
	case "bash":
		if command, ok := inputMap["command"].(string); ok {
			return NewCommandRunAction(command)
		}
		return NewOtherAction("Command execution")
		
	case "grep":
		if pattern, ok := inputMap["pattern"].(string); ok {
			return NewSearchAction(pattern)
		}
		return NewOtherAction("Search operation")
		
	case "webfetch":
		if url, ok := inputMap["url"].(string); ok {
			return NewWebFetchAction(url)
		}
		return NewOtherAction("Web fetch operation")
		
	case "task":
		if desc, ok := inputMap["description"].(string); ok {
			return NewTaskCreateAction(desc)
		}
		if prompt, ok := inputMap["prompt"].(string); ok {
			return NewTaskCreateAction(prompt)
		}
		return NewOtherAction("Task creation")
		
	default:
		return NewOtherAction(fmt.Sprintf("Tool: %s", toolName))
	}
}

func (c *ClaudeExecutor) generateConciseContent(toolName string, input json.RawMessage, actionType ActionType, worktreePath string) string {
	switch actionType.Type {
	case "file_read":
		return fmt.Sprintf("`%s`", actionType.Path)
	case "file_write":
		return fmt.Sprintf("`%s`", actionType.Path)
	case "command_run":
		return fmt.Sprintf("`%s`", actionType.Command)
	case "search":
		return fmt.Sprintf("`%s`", actionType.Query)
	case "web_fetch":
		return fmt.Sprintf("`%s`", actionType.URL)
	case "task_create":
		return actionType.Description
	default:
		return c.generateSpecialToolContent(toolName, input, worktreePath)
	}
}

func (c *ClaudeExecutor) generateSpecialToolContent(toolName string, input json.RawMessage, worktreePath string) string {
	var inputMap map[string]interface{}
	if err := json.Unmarshal(input, &inputMap); err != nil {
		return toolName
	}
	
	switch strings.ToLower(toolName) {
	case "todoread", "todowrite":
		return c.generateTodoContent(inputMap)
	case "ls":
		return c.generateLsContent(inputMap, worktreePath)
	case "glob":
		return c.generateGlobContent(inputMap, worktreePath)
	case "codebase_search_agent":
		if query, ok := inputMap["query"].(string); ok {
			return fmt.Sprintf("Search: %s", query)
		}
		return "Codebase search"
	default:
		return toolName
	}
}

func (c *ClaudeExecutor) generateTodoContent(inputMap map[string]interface{}) string {
	todos, ok := inputMap["todos"].([]interface{})
	if !ok || len(todos) == 0 {
		return "Managing TODO list"
	}
	
	var todoItems []string
	for _, todo := range todos {
		todoMap, ok := todo.(map[string]interface{})
		if !ok {
			continue
		}
		
		content, ok := todoMap["content"].(string)
		if !ok {
			continue
		}
		
		status, _ := todoMap["status"].(string)
		priority, _ := todoMap["priority"].(string)
		
		statusEmoji := "📝"
		switch status {
		case "completed":
			statusEmoji = "✅"
		case "in_progress":
			statusEmoji = "🔄"
		case "pending", "todo":
			statusEmoji = "⏳"
		}
		
		if priority == "" {
			priority = "medium"
		}
		
		todoItems = append(todoItems, fmt.Sprintf("%s %s (%s)", statusEmoji, content, priority))
	}
	
	if len(todoItems) == 0 {
		return "Managing TODO list"
	}
	
	return fmt.Sprintf("TODO List:\n%s", strings.Join(todoItems, "\n"))
}

func (c *ClaudeExecutor) generateLsContent(inputMap map[string]interface{}, worktreePath string) string {
	path, ok := inputMap["path"].(string)
	if !ok {
		return "List directory"
	}
	
	relativePath := c.makePathRelative(path, worktreePath)
	if relativePath == "" {
		return "List directory"
	}
	
	return fmt.Sprintf("List directory: `%s`", relativePath)
}

func (c *ClaudeExecutor) generateGlobContent(inputMap map[string]interface{}, worktreePath string) string {
	pattern, _ := inputMap["pattern"].(string)
	if pattern == "" {
		pattern = "*"
	}
	
	if path, ok := inputMap["path"].(string); ok {
		relativePath := c.makePathRelative(path, worktreePath)
		return fmt.Sprintf("Find files: `%s` in `%s`", pattern, relativePath)
	}
	
	return fmt.Sprintf("Find files: `%s`", pattern)
}

func (c *ClaudeExecutor) makePathRelative(path, worktreePath string) string {
	// If path is already relative, return as is
	if !filepath.IsAbs(path) {
		return path
	}
	
	// Try to make path relative to worktree
	if rel, err := filepath.Rel(worktreePath, path); err == nil {
		return rel
	}
	
	// If we can't make it relative, return the original path
	return path
}

func (c *ClaudeExecutor) GetExecutorType() ExecutorConfig {
	return ExecutorClaude
}

// ClaudeFollowupExecutor implementation
func (cf *ClaudeFollowupExecutor) Spawn(ctx context.Context, taskID uuid.UUID, worktreePath string) (*exec.Cmd, error) {
	// Create Claude command with resume flag
	claudeCommand := fmt.Sprintf("npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --verbose --output-format=stream-json --resume=%s", cf.SessionID)
	
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(ctx, "cmd", "/C", claudeCommand)
	} else {
		cmd = exec.CommandContext(ctx, "sh", "-c", claudeCommand)
	}
	
	cmd.Dir = worktreePath
	cmd.Env = append(cmd.Env, "NODE_NO_WARNINGS=1")
	
	// Set up pipes
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdin pipe: %w", err)
	}
	
	// Start the command
	if err := cmd.Start(); err != nil {
		stdin.Close()
		return nil, fmt.Errorf("failed to start Claude followup: %w", err)
	}
	
	// Write prompt to stdin in a goroutine
	go func() {
		defer stdin.Close()
		if _, err := stdin.Write([]byte(cf.Prompt)); err != nil {
			fmt.Printf("Debug: Failed to write followup prompt to Claude stdin: %v\n", err)
		}
	}()
	
	return cmd, nil
}

func (cf *ClaudeFollowupExecutor) NormalizeLogs(logs string, worktreePath string) (*NormalizedConversation, error) {
	// Reuse the same logic as the main ClaudeExecutor
	mainExecutor := &ClaudeExecutor{}
	return mainExecutor.NormalizeLogs(logs, worktreePath)
}

func (cf *ClaudeFollowupExecutor) GetExecutorType() ExecutorConfig {
	return ExecutorClaude
}

// Note: Task details will be provided by the process manager when creating the executor session