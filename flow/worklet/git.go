package worklet

import (
	"crypto/sha256"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
)

type GitClient struct {
	baseDir string
}

func NewGitClient() *GitClient {
	baseDir := "/tmp/worklet-repos"
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		slog.Error("Failed to create base directory", "error", err, "dir", baseDir)
	}
	
	return &GitClient{
		baseDir: baseDir,
	}
}

func (g *GitClient) CloneRepository(repoURL, branch string) (string, error) {
	repoPath := g.getRepoPath(repoURL, branch)
	
	if _, err := os.Stat(repoPath); err == nil {
		slog.Info("Repository already exists, pulling latest changes", "path", repoPath)
		if err := g.pullRepository(repoPath, branch); err != nil {
			slog.Error("Failed to pull repository, will re-clone", "error", err)
			if err := os.RemoveAll(repoPath); err != nil {
				return "", fmt.Errorf("failed to remove existing repo: %w", err)
			}
		} else {
			return repoPath, nil
		}
	}
	
	slog.Info("Cloning repository", "url", repoURL, "branch", branch, "path", repoPath)
	
	cloneOptions := &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
	}
	
	if branch != "" && branch != "main" && branch != "master" {
		cloneOptions.ReferenceName = plumbing.NewBranchReferenceName(branch)
		cloneOptions.SingleBranch = true
	}
	
	if g.isPrivateRepo(repoURL) {
		token := os.Getenv("GITHUB_TOKEN")
		if token != "" {
			cloneOptions.Auth = &http.BasicAuth{
				Username: "token",
				Password: token,
			}
		}
	}
	
	_, err := git.PlainClone(repoPath, false, cloneOptions)
	if err != nil {
		return "", fmt.Errorf("failed to clone repository: %w", err)
	}
	
	return repoPath, nil
}

func (g *GitClient) pullRepository(repoPath, branch string) error {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return fmt.Errorf("failed to open repository: %w", err)
	}
	
	workTree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}
	
	pullOptions := &git.PullOptions{
		RemoteName: "origin",
	}
	
	if branch != "" && branch != "main" && branch != "master" {
		pullOptions.ReferenceName = plumbing.NewBranchReferenceName(branch)
	}
	
	err = workTree.Pull(pullOptions)
	if err != nil && err != git.NoErrAlreadyUpToDate {
		return fmt.Errorf("failed to pull repository: %w", err)
	}
	
	return nil
}

func (g *GitClient) GetRepoPath(repoURL, branch string) string {
	return g.getRepoPath(repoURL, branch)
}

func (g *GitClient) getRepoPath(repoURL, branch string) string {
	repoName := g.extractRepoName(repoURL)
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(repoURL+branch)))[:8]
	return filepath.Join(g.baseDir, fmt.Sprintf("%s-%s-%s", repoName, branch, hash))
}

func (g *GitClient) extractRepoName(repoURL string) string {
	parts := strings.Split(repoURL, "/")
	if len(parts) == 0 {
		return "unknown"
	}
	
	repoName := parts[len(parts)-1]
	if strings.HasSuffix(repoName, ".git") {
		repoName = strings.TrimSuffix(repoName, ".git")
	}
	
	return repoName
}

func (g *GitClient) isPrivateRepo(repoURL string) bool {
	return strings.Contains(repoURL, "github.com") && 
		   !strings.Contains(repoURL, "https://github.com") &&
		   !strings.Contains(repoURL, "git://")
}

func (g *GitClient) CommitChanges(repoPath, message, userEmail, userName string) error {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return fmt.Errorf("failed to open repository: %w", err)
	}
	
	workTree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}
	
	status, err := workTree.Status()
	if err != nil {
		return fmt.Errorf("failed to get status: %w", err)
	}
	
	if status.IsClean() {
		return nil
	}
	
	_, err = workTree.Add(".")
	if err != nil {
		return fmt.Errorf("failed to add changes: %w", err)
	}
	
	signature := &object.Signature{
		Name:  userName,
		Email: userEmail,
		When:  time.Now(),
	}
	
	_, err = workTree.Commit(message, &git.CommitOptions{
		Author: signature,
	})
	if err != nil {
		return fmt.Errorf("failed to commit changes: %w", err)
	}
	
	return nil
}

func (g *GitClient) CreateBranch(repoPath, branchName string) error {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return fmt.Errorf("failed to open repository: %w", err)
	}
	
	headRef, err := repo.Head()
	if err != nil {
		return fmt.Errorf("failed to get HEAD reference: %w", err)
	}
	
	branchRef := plumbing.NewHashReference(plumbing.NewBranchReferenceName(branchName), headRef.Hash())
	
	err = repo.Storer.SetReference(branchRef)
	if err != nil {
		return fmt.Errorf("failed to create branch reference: %w", err)
	}
	
	workTree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}
	
	err = workTree.Checkout(&git.CheckoutOptions{
		Branch: branchRef.Name(),
	})
	if err != nil {
		return fmt.Errorf("failed to checkout branch: %w", err)
	}
	
	return nil
}

func (g *GitClient) GetCurrentBranch(repoPath string) (string, error) {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return "", fmt.Errorf("failed to open repository: %w", err)
	}
	
	headRef, err := repo.Head()
	if err != nil {
		return "", fmt.Errorf("failed to get HEAD reference: %w", err)
	}
	
	if headRef.Name().IsBranch() {
		return headRef.Name().Short(), nil
	}
	
	return "", fmt.Errorf("not on a branch")
}

func (g *GitClient) HasUncommittedChanges(repoPath string) (bool, error) {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return false, fmt.Errorf("failed to open repository: %w", err)
	}
	
	workTree, err := repo.Worktree()
	if err != nil {
		return false, fmt.Errorf("failed to get worktree: %w", err)
	}
	
	status, err := workTree.Status()
	if err != nil {
		return false, fmt.Errorf("failed to get status: %w", err)
	}
	
	return !status.IsClean(), nil
}

func (g *GitClient) CleanupOldRepos(maxAge time.Duration) error {
	entries, err := os.ReadDir(g.baseDir)
	if err != nil {
		return fmt.Errorf("failed to read base directory: %w", err)
	}
	
	cutoff := time.Now().Add(-maxAge)
	
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		
		path := filepath.Join(g.baseDir, entry.Name())
		info, err := entry.Info()
		if err != nil {
			slog.Error("Failed to get file info", "error", err, "path", path)
			continue
		}
		
		if info.ModTime().Before(cutoff) {
			slog.Info("Removing old repository", "path", path)
			if err := os.RemoveAll(path); err != nil {
				slog.Error("Failed to remove old repository", "error", err, "path", path)
			}
		}
	}
	
	return nil
}