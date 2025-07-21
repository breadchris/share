package worklet

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/breadchris/flow/claude"
)

type ClaudeClient struct {
	claudeService *claude.Service
}

func NewClaudeClient() *ClaudeClient {
	config := claude.Config{
		Debug:    true,
		DebugDir: "/tmp/worklet-claude",
		Tools:    []string{"Read", "Write", "Bash"},
	}
	return &ClaudeClient{
		claudeService: claude.NewService(config),
	}
}

func (c *ClaudeClient) ApplyPrompt(ctx context.Context, repoPath, prompt string) error {
	if prompt == "" {
		return nil
	}

	slog.Info("Applying prompt to worklet", "repoPath", repoPath)

	// Create a new Claude session with the repository as working directory
	process, err := c.claudeService.CreateSessionWithOptions(repoPath)
	if err != nil {
		return fmt.Errorf("failed to create Claude session: %w", err)
	}

	// Send the prompt to Claude
	if err := c.claudeService.SendMessage(process, prompt); err != nil {
		return fmt.Errorf("failed to send prompt to Claude: %w", err)
	}

	// Wait for Claude to process the prompt (simple implementation)
	if err := c.waitForResponse(ctx, process); err != nil {
		return fmt.Errorf("error waiting for Claude response: %w", err)
	}

	slog.Info("Claude session completed")
	return nil
}

func (c *ClaudeClient) ProcessPrompt(ctx context.Context, repoPath, prompt string) (string, error) {
	slog.Info("Processing prompt for worklet", "repoPath", repoPath)

	// Create a new Claude session with repository as working directory
	process, err := c.claudeService.CreateSessionWithOptions(repoPath)
	if err != nil {
		return "", fmt.Errorf("failed to create Claude session: %w", err)
	}

	// Send the prompt to Claude
	if err := c.claudeService.SendMessage(process, prompt); err != nil {
		return "", fmt.Errorf("failed to send prompt to Claude: %w", err)
	}

	// Collect response from Claude
	response, err := c.collectResponse(ctx, process)
	if err != nil {
		return "", fmt.Errorf("error collecting Claude response: %w", err)
	}

	slog.Info("Claude prompt processed successfully")
	return response, nil
}

func (c *ClaudeClient) waitForResponse(ctx context.Context, process *claude.Process) error {
	timeout := time.After(5 * time.Minute)
	messageChan := c.claudeService.ReceiveMessages(process)

	for {
		select {
		case <-timeout:
			return fmt.Errorf("timeout waiting for Claude response")
		case msg, ok := <-messageChan:
			if !ok {
				return fmt.Errorf("message channel closed")
			}
			// Check for completion or tool use completion
			if msg.Type == "completion" || (msg.Type == "tool_use" && msg.Subtype == "result") {
				return nil
			}
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

func (c *ClaudeClient) collectResponse(ctx context.Context, process *claude.Process) (string, error) {
	timeout := time.After(5 * time.Minute)
	messageChan := c.claudeService.ReceiveMessages(process)
	var responseBuilder strings.Builder

	for {
		select {
		case <-timeout:
			return "", fmt.Errorf("timeout waiting for Claude response")
		case msg, ok := <-messageChan:
			if !ok {
				return responseBuilder.String(), nil
			}
			// Collect text content from Claude's response
			if msg.Type == "text" {
				responseBuilder.WriteString(string(msg.Message))
			}
			// Check for completion
			if msg.Type == "completion" {
				return responseBuilder.String(), nil
			}
		case <-ctx.Done():
			return "", ctx.Err()
		}
	}
}

func (c *ClaudeClient) CreatePR(ctx context.Context, repoPath, branchName, title, description string) error {
	slog.Info("Creating PR for worklet", "repoPath", repoPath, "branch", branchName)

	if !c.isGitRepo(repoPath) {
		return fmt.Errorf("not a git repository")
	}

	if err := c.createBranch(repoPath, branchName); err != nil {
		return fmt.Errorf("failed to create branch: %w", err)
	}

	if err := c.commitChanges(repoPath, title); err != nil {
		return fmt.Errorf("failed to commit changes: %w", err)
	}

	if err := c.pushBranch(repoPath, branchName); err != nil {
		return fmt.Errorf("failed to push branch: %w", err)
	}

	if err := c.createGitHubPR(repoPath, branchName, title, description); err != nil {
		return fmt.Errorf("failed to create GitHub PR: %w", err)
	}

	return nil
}

func (c *ClaudeClient) isGitRepo(repoPath string) bool {
	_, err := os.Stat(filepath.Join(repoPath, ".git"))
	return err == nil
}

func (c *ClaudeClient) createBranch(repoPath, branchName string) error {
	cmd := exec.Command("git", "checkout", "-b", branchName)
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to create branch: %s", string(output))
	}

	return nil
}

func (c *ClaudeClient) commitChanges(repoPath, message string) error {
	addCmd := exec.Command("git", "add", ".")
	addCmd.Dir = repoPath

	if output, err := addCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to add changes: %s", string(output))
	}

	statusCmd := exec.Command("git", "status", "--porcelain")
	statusCmd.Dir = repoPath

	statusOutput, err := statusCmd.Output()
	if err != nil {
		return fmt.Errorf("failed to check git status: %w", err)
	}

	if len(strings.TrimSpace(string(statusOutput))) == 0 {
		slog.Info("No changes to commit")
		return nil
	}

	commitCmd := exec.Command("git", "commit", "-m", message)
	commitCmd.Dir = repoPath

	if output, err := commitCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to commit changes: %s", string(output))
	}

	return nil
}

func (c *ClaudeClient) pushBranch(repoPath, branchName string) error {
	cmd := exec.Command("git", "push", "-u", "origin", branchName)
	cmd.Dir = repoPath

	token := os.Getenv("GITHUB_TOKEN")
	if token != "" {
		cmd.Env = append(os.Environ(), fmt.Sprintf("GITHUB_TOKEN=%s", token))
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to push branch: %s", string(output))
	}

	return nil
}

func (c *ClaudeClient) createGitHubPR(repoPath, branchName, title, description string) error {
	if !c.isGitHubCLIAvailable() {
		return fmt.Errorf("GitHub CLI (gh) is not available")
	}

	cmd := exec.Command("gh", "pr", "create", "--title", title, "--body", description, "--head", branchName)
	cmd.Dir = repoPath

	token := os.Getenv("GITHUB_TOKEN")
	if token != "" {
		cmd.Env = append(os.Environ(), fmt.Sprintf("GITHUB_TOKEN=%s", token))
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to create PR: %s", string(output))
	}

	slog.Info("Created PR successfully", "output", string(output))

	return nil
}

func (c *ClaudeClient) isGitHubCLIAvailable() bool {
	cmd := exec.Command("gh", "--version")
	return cmd.Run() == nil
}

func (c *ClaudeClient) GetSessionStatus(sessionID string) (string, error) {
	// The new claude interface doesn't expose session lookup by ID
	// We would need to track sessions externally or return a generic status
	return "unknown", nil
}

func (c *ClaudeClient) CloseSession(sessionID string) error {
	c.claudeService.StopSession(sessionID)
	return nil
}

func (c *ClaudeClient) ListSessions() ([]string, error) {
	// The new claude interface doesn't expose session listing
	// Sessions are managed internally by the service
	return []string{}, nil
}

func (c *ClaudeClient) CleanupOldSessions(maxAge time.Duration) error {
	// The new claude interface doesn't expose session listing
	// Session cleanup is handled internally by the service
	slog.Info("Session cleanup not needed with new claude interface")
	return nil
}
