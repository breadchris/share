package claude

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GitService handles git operations for Claude sessions
type GitService struct {
	baseWorkdir string // Base directory for worktrees
}

// NewGitService creates a new GitService instance
func NewGitService() *GitService {
	baseWorkdir := filepath.Join("./data", "claude-git-worktrees")
	
	// Convert to absolute path to avoid issues with relative path resolution
	absBaseWorkdir, err := filepath.Abs(baseWorkdir)
	if err != nil {
		fmt.Printf("Warning: Failed to get absolute path for baseWorkdir, using relative: %v\n", err)
		absBaseWorkdir = baseWorkdir
	}
	
	os.MkdirAll(absBaseWorkdir, 0755)
	fmt.Printf("Debug: GitService baseWorkdir set to: %s\n", absBaseWorkdir)
	
	return &GitService{
		baseWorkdir: absBaseWorkdir,
	}
}

// CreateWorktree creates a new git worktree for isolated Claude session execution
func (g *GitService) CreateWorktree(repoPath, branchName, baseBranch string) (string, error) {
	// Generate unique worktree path
	worktreeID := uuid.NewString()
	worktreePath := filepath.Join(g.baseWorkdir, worktreeID)

	fmt.Printf("Debug: CreateWorktree called with repoPath: %s, branchName: %s, baseBranch: %s\n", repoPath, branchName, baseBranch)
	fmt.Printf("Debug: Generated worktreeID: %s\n", worktreeID)
	fmt.Printf("Debug: Generated worktreePath: %s\n", worktreePath)

	// Validate that worktreePath is absolute
	if !filepath.IsAbs(worktreePath) {
		return "", fmt.Errorf("worktreePath must be absolute, got: %s", worktreePath)
	}

	// Open the main repository (for validation)
	_, err := git.PlainOpen(repoPath)
	if err != nil {
		return "", fmt.Errorf("failed to open repository: %w", err)
	}

	// Create worktree using git CLI for better compatibility
	cmd := exec.Command("git", "worktree", "add", "-b", branchName, worktreePath, baseBranch)
	cmd.Dir = repoPath
	
	fmt.Printf("Debug: Running git command from directory: %s\n", cmd.Dir)
	fmt.Printf("Debug: Git command: git worktree add -b %s %s %s\n", branchName, worktreePath, baseBranch)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Debug: Git worktree command failed. Output: %s\n", string(output))
		return "", fmt.Errorf("failed to create worktree: %s, error: %w", string(output), err)
	}

	fmt.Printf("Debug: Git worktree command succeeded. Output: %s\n", string(output))
	fmt.Printf("Debug: Created worktree at: %s\n", worktreePath)

	return worktreePath, nil
}

// RemoveWorktree removes a git worktree
func (g *GitService) RemoveWorktree(repoPath, worktreePath string) error {
	// Remove worktree using git CLI
	cmd := exec.Command("git", "worktree", "remove", worktreePath, "--force")
	cmd.Dir = repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to remove worktree: %s, error: %w", string(output), err)
	}

	return nil
}

// GetBranches returns a list of branches in the repository
func (g *GitService) GetBranches(repoPath string) ([]string, error) {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	branches, err := repo.Branches()
	if err != nil {
		return nil, fmt.Errorf("failed to get branches: %w", err)
	}

	var branchNames []string
	err = branches.ForEach(func(ref *plumbing.Reference) error {
		branchName := ref.Name().Short()
		branchNames = append(branchNames, branchName)
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to iterate branches: %w", err)
	}

	return branchNames, nil
}

// CreateBranch creates a new branch in the repository
func (g *GitService) CreateBranch(repoPath, branchName, baseBranch string) error {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return fmt.Errorf("failed to open repository: %w", err)
	}

	// Get the base branch reference
	baseBranchRef, err := repo.Reference(plumbing.ReferenceName("refs/heads/"+baseBranch), true)
	if err != nil {
		return fmt.Errorf("failed to get base branch reference: %w", err)
	}

	// Create new branch reference
	newBranchRef := plumbing.NewHashReference(plumbing.ReferenceName("refs/heads/"+branchName), baseBranchRef.Hash())
	err = repo.Storer.SetReference(newBranchRef)
	if err != nil {
		return fmt.Errorf("failed to create branch: %w", err)
	}

	return nil
}

// GetDiff returns the git diff for a worktree
func (g *GitService) GetDiff(worktreePath string) (string, error) {
	cmd := exec.Command("git", "diff", "HEAD")
	cmd.Dir = worktreePath
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get diff: %w", err)
	}

	return string(output), nil
}

// GetDiffFromBaseBranch returns the diff between the current branch and base branch
func (g *GitService) GetDiffFromBaseBranch(worktreePath, baseBranch string) (string, error) {
	cmd := exec.Command("git", "diff", baseBranch+"..HEAD")
	cmd.Dir = worktreePath
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get diff from base branch: %w", err)
	}

	return string(output), nil
}

// GetBranchDiff returns the diff between two branches in a repository
func (g *GitService) GetBranchDiff(repoPath, baseBranch, targetBranch string) (string, error) {
	cmd := exec.Command("git", "diff", fmt.Sprintf("%s..%s", baseBranch, targetBranch))
	cmd.Dir = repoPath
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get branch diff: %w", err)
	}

	return string(output), nil
}

// CommitChanges commits all changes in the worktree
func (g *GitService) CommitChanges(worktreePath, message string) (string, error) {
	// Stage all changes
	stageCmd := exec.Command("git", "add", ".")
	stageCmd.Dir = worktreePath
	if output, err := stageCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("failed to stage changes: %s, error: %w", string(output), err)
	}

	// Commit changes
	commitCmd := exec.Command("git", "commit", "-m", message)
	commitCmd.Dir = worktreePath
	output, err := commitCmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to commit changes: %s, error: %w", string(output), err)
	}

	// Get the commit hash
	hashCmd := exec.Command("git", "rev-parse", "HEAD")
	hashCmd.Dir = worktreePath
	hashOutput, err := hashCmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get commit hash: %w", err)
	}

	return strings.TrimSpace(string(hashOutput)), nil
}

// PushBranch pushes the current branch to origin
func (g *GitService) PushBranch(worktreePath, branchName string) error {
	cmd := exec.Command("git", "push", "origin", branchName)
	cmd.Dir = worktreePath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to push branch: %s, error: %w", string(output), err)
	}

	return nil
}

// GetCommitInfo returns information about a commit
func (g *GitService) GetCommitInfo(repoPath, commitHash string) (*CommitInfo, error) {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	hash := plumbing.NewHash(commitHash)
	commit, err := repo.CommitObject(hash)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit object: %w", err)
	}

	return &CommitInfo{
		Hash:      commit.Hash.String(),
		Message:   commit.Message,
		Author:    commit.Author.Name,
		Email:     commit.Author.Email,
		Timestamp: commit.Author.When,
	}, nil
}

// GetRepositoryStatus returns the current status of the repository
func (g *GitService) GetRepositoryStatus(repoPath string) (*RepositoryStatus, error) {
	// Get current branch using git CLI
	branchCmd := exec.Command("git", "branch", "--show-current")
	branchCmd.Dir = repoPath
	branchOutput, err := branchCmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get current branch: %w", err)
	}
	currentBranch := strings.TrimSpace(string(branchOutput))

	// Get current commit hash
	// Use git rev-parse HEAD with fallback for new worktrees
	hashCmd := exec.Command("git", "rev-parse", "HEAD")
	hashCmd.Dir = repoPath
	hashOutput, err := hashCmd.Output()
	commitHash := ""
	if err != nil {
		// Check if this is a new worktree with no commits
		// Try to get the commit from the branch ref
		refCmd := exec.Command("git", "rev-parse", currentBranch)
		refCmd.Dir = repoPath
		refOutput, refErr := refCmd.Output()
		if refErr != nil {
			// This is likely a brand new worktree with no commits
			commitHash = ""
		} else {
			commitHash = strings.TrimSpace(string(refOutput))
		}
	} else {
		commitHash = strings.TrimSpace(string(hashOutput))
	}

	// Get repository status using git status --porcelain
	statusCmd := exec.Command("git", "status", "--porcelain")
	statusCmd.Dir = repoPath
	statusOutput, err := statusCmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get status: %w", err)
	}

	// Parse status output
	var modifiedFiles, addedFiles, deletedFiles []string
	isClean := true
	
	if len(statusOutput) > 0 {
		isClean = false
		lines := strings.Split(string(statusOutput), "\n")
		for _, line := range lines {
			if len(line) < 3 {
				continue
			}
			
			// Git status format: XY filename
			// X = index status, Y = worktree status
			indexStatus := line[0]
			worktreeStatus := line[1]
			filename := strings.TrimSpace(line[3:])
			
			// Check index (staged) status
			switch indexStatus {
			case 'A':
				addedFiles = append(addedFiles, filename)
			case 'M':
				modifiedFiles = append(modifiedFiles, filename)
			case 'D':
				deletedFiles = append(deletedFiles, filename)
			}
			
			// Check worktree (unstaged) status
			// Only add if not already in staged
			switch worktreeStatus {
			case 'M':
				if indexStatus != 'M' {
					modifiedFiles = append(modifiedFiles, filename)
				}
			case 'D':
				if indexStatus != 'D' {
					deletedFiles = append(deletedFiles, filename)
				}
			case '?':
				// Untracked files - we'll treat as added
				if indexStatus != 'A' {
					addedFiles = append(addedFiles, filename)
				}
			}
		}
	}

	return &RepositoryStatus{
		CurrentBranch: currentBranch,
		CommitHash:    commitHash,
		IsClean:       isClean,
		ModifiedFiles: modifiedFiles,
		AddedFiles:    addedFiles,
		DeletedFiles:  deletedFiles,
	}, nil
}

// ValidateRepository checks if the path contains a valid Git repository
func (g *GitService) ValidateRepository(repoPath string) error {
	_, err := git.PlainOpen(repoPath)
	if err != nil {
		return fmt.Errorf("invalid git repository: %w", err)
	}
	return nil
}

// CleanupOldWorktrees removes worktrees older than the specified duration
func (g *GitService) CleanupOldWorktrees(maxAge time.Duration) error {
	entries, err := os.ReadDir(g.baseWorkdir)
	if err != nil {
		return fmt.Errorf("failed to read worktree directory: %w", err)
	}

	cutoff := time.Now().Add(-maxAge)
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoff) {
			worktreePath := filepath.Join(g.baseWorkdir, entry.Name())
			os.RemoveAll(worktreePath) // Best effort cleanup
		}
	}

	return nil
}

// CleanupOrphanedWorktrees removes worktrees that exist on disk but are not referenced by any active sessions
func (g *GitService) CleanupOrphanedWorktrees(db *gorm.DB) error {
	// Read all worktree directories
	entries, err := os.ReadDir(g.baseWorkdir)
	if err != nil {
		return fmt.Errorf("failed to read worktree directory: %w", err)
	}

	// Get all worktree paths from database for active sessions
	var activeWorktreePaths []string
	
	if db != nil {
		// Query to get all non-empty worktree paths from active Claude sessions
		result := db.Raw("SELECT DISTINCT JSON_EXTRACT(metadata, '$.worktree_path') as worktree_path FROM claude_sessions WHERE JSON_EXTRACT(metadata, '$.worktree_path') IS NOT NULL AND JSON_EXTRACT(metadata, '$.worktree_path') != ''").Scan(&activeWorktreePaths)
		if result.Error != nil {
			fmt.Printf("Debug: Failed to query active worktree paths: %v\n", result.Error)
			// Continue with cleanup based on directory listing only
		} else {
			fmt.Printf("Debug: Found %d active worktree paths in database\n", len(activeWorktreePaths))
		}
	}

	// Convert active paths to map for faster lookup
	activePaths := make(map[string]bool)
	for _, path := range activeWorktreePaths {
		activePaths[path] = true
	}

	// Check each directory in baseWorkdir
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		worktreePath := filepath.Join(g.baseWorkdir, entry.Name())
		
		// Skip if this worktree is referenced by an active session
		if activePaths[worktreePath] {
			fmt.Printf("Debug: Keeping active worktree: %s\n", worktreePath)
			continue
		}

		// Check if the directory looks like a valid worktree (has .git file)
		gitFile := filepath.Join(worktreePath, ".git")
		if _, err := os.Stat(gitFile); os.IsNotExist(err) {
			fmt.Printf("Debug: Removing non-git directory: %s\n", worktreePath)
			os.RemoveAll(worktreePath)
			continue
		}

		// This appears to be an orphaned worktree - remove it
		fmt.Printf("Debug: Removing orphaned worktree: %s\n", worktreePath)
		if err := os.RemoveAll(worktreePath); err != nil {
			fmt.Printf("Debug: Failed to remove orphaned worktree %s: %v\n", worktreePath, err)
			// Continue with other worktrees
		}
	}

	return nil
}

// Data structures

type CommitInfo struct {
	Hash      string    `json:"hash"`
	Message   string    `json:"message"`
	Author    string    `json:"author"`
	Email     string    `json:"email"`
	Timestamp time.Time `json:"timestamp"`
}

type RepositoryStatus struct {
	CurrentBranch string   `json:"current_branch"`
	CommitHash    string   `json:"commit_hash"`
	IsClean       bool     `json:"is_clean"`
	ModifiedFiles []string `json:"modified_files"`
	AddedFiles    []string `json:"added_files"`
	DeletedFiles  []string `json:"deleted_files"`
}

// GitSessionInfo represents git-related information for a Claude session
type GitSessionInfo struct {
	RepositoryPath string `json:"repository_path"`
	WorktreePath   string `json:"worktree_path"`
	BranchName     string `json:"branch_name"`
	BaseBranch     string `json:"base_branch"`
	CommitHash     string `json:"commit_hash,omitempty"`
	HasChanges     bool   `json:"has_changes"`
}