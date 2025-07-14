package vibekanban

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
)

type GitService struct {
	baseWorkdir string // Base directory for worktrees
}

func NewGitService() *GitService {
	baseWorkdir := filepath.Join(os.TempDir(), "vibe-kanban-worktrees")
	os.MkdirAll(baseWorkdir, 0755)
	return &GitService{
		baseWorkdir: baseWorkdir,
	}
}

// CreateWorktree creates a new git worktree for isolated task execution
func (g *GitService) CreateWorktree(repoPath, branchName, baseBranch string) (string, error) {
	// Generate unique worktree path
	worktreeID := uuid.NewString()
	worktreePath := filepath.Join(g.baseWorkdir, worktreeID)

	// Open the main repository (for validation)
	_, err := git.PlainOpen(repoPath)
	if err != nil {
		return "", fmt.Errorf("failed to open repository: %w", err)
	}

	// Create worktree using git CLI for better compatibility
	cmd := exec.Command("git", "worktree", "add", "-b", branchName, worktreePath, baseBranch)
	cmd.Dir = repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to create worktree: %s, error: %w", string(output), err)
	}

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

// MergeBranch merges a branch into the base branch
func (g *GitService) MergeBranch(repoPath, branchName, baseBranch string) (string, error) {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return "", fmt.Errorf("failed to open repository: %w", err)
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return "", fmt.Errorf("failed to get worktree: %w", err)
	}

	// Checkout base branch
	err = worktree.Checkout(&git.CheckoutOptions{
		Branch: plumbing.ReferenceName("refs/heads/" + baseBranch),
	})
	if err != nil {
		return "", fmt.Errorf("failed to checkout base branch: %w", err)
	}

	// Get the branch reference to merge (for validation)
	_, err = repo.Reference(plumbing.ReferenceName("refs/heads/"+branchName), true)
	if err != nil {
		return "", fmt.Errorf("failed to get branch reference: %w", err)
	}

	// Perform merge using git CLI for better merge strategies
	cmd := exec.Command("git", "merge", branchName, "--no-ff", "-m", fmt.Sprintf("Merge branch '%s'", branchName))
	cmd.Dir = repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to merge branch: %s, error: %w", string(output), err)
	}

	// Get the merge commit hash
	hashCmd := exec.Command("git", "rev-parse", "HEAD")
	hashCmd.Dir = repoPath
	hashOutput, err := hashCmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get merge commit hash: %w", err)
	}

	return strings.TrimSpace(string(hashOutput)), nil
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
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, fmt.Errorf("failed to get worktree: %w", err)
	}

	status, err := worktree.Status()
	if err != nil {
		return nil, fmt.Errorf("failed to get status: %w", err)
	}

	head, err := repo.Head()
	if err != nil {
		return nil, fmt.Errorf("failed to get HEAD: %w", err)
	}

	var modifiedFiles, addedFiles, deletedFiles []string
	for file, stat := range status {
		switch stat.Staging {
		case git.Added:
			addedFiles = append(addedFiles, file)
		case git.Modified:
			modifiedFiles = append(modifiedFiles, file)
		case git.Deleted:
			deletedFiles = append(deletedFiles, file)
		}

		switch stat.Worktree {
		case git.Modified:
			if stat.Staging != git.Modified {
				modifiedFiles = append(modifiedFiles, file)
			}
		case git.Deleted:
			if stat.Staging != git.Deleted {
				deletedFiles = append(deletedFiles, file)
			}
		}
	}

	return &RepositoryStatus{
		CurrentBranch: head.Name().Short(),
		CommitHash:    head.Hash().String(),
		IsClean:       status.IsClean(),
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