package coderunner

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/evanw/esbuild/pkg/api"
	"github.com/go-git/go-git/v5"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/google/go-github/v66/github"
)

type BuildCache struct {
	BuiltAt    time.Time `json:"builtAt"`
	SourcePath string    `json:"sourcePath"`
	BuildPath  string    `json:"buildPath"`
	Hash       string    `json:"hash"`
}

type FileInfo struct {
	Name         string    `json:"name"`
	Path         string    `json:"path"`
	IsDir        bool      `json:"isDir"`
	Size         int64     `json:"size"`
	LastModified time.Time `json:"lastModified"`
}

type SaveFileRequest struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

func New(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	// Main coderunner page
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Id("code-runner"),
				Attr("data-props", `{"darkMode": true, "language": "typescript"}`),
			),
			Link(Href("/static/coderunner/CodeRunner.css"), Rel("stylesheet")),
			Script(Src("https://cdn.tailwindcss.com")),
			Script(Src("https://unpkg.com/esbuild-wasm@0.25.5/lib/browser.min.js")),
			Script(Src("/static/coderunner/CodeRunner.js"), Type("module")),
		).RenderPage(w, r)
	})

	// API endpoints - these will receive the full path including /coderunner prefix
	m.HandleFunc("/api/files", func(w http.ResponseWriter, r *http.Request) {
		handleFiles(w, r)
	})
	m.HandleFunc("/api/files/", func(w http.ResponseWriter, r *http.Request) {
		handleFileContent(w, r)
	})
	m.HandleFunc("/api/build/", func(w http.ResponseWriter, r *http.Request) {
		handleBuild(w, r)
	})
	m.HandleFunc("/api/delete/", func(w http.ResponseWriter, r *http.Request) {
		handleDeleteFile(w, r)
	})

	// GitHub user info endpoint
	m.HandleFunc("/user", func(w http.ResponseWriter, r *http.Request) {
		// Get GitHub user data from session
		gitHubUser, err := d.Session.GetGitHubUser(r.Context())
		if err != nil {
			http.Error(w, `{"error":"not authenticated"}`, http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		response := map[string]string{
			"username": gitHubUser.GithubUsername,
			"provider": "github",
			"email":    gitHubUser.Email,
		}
		json.NewEncoder(w).Encode(response)
	})

	// GitHub repositories endpoint - now uses real GitHub API
	m.HandleFunc("/repositories", func(w http.ResponseWriter, r *http.Request) {
		// Get GitHub user data from session
		gitHubUser, err := d.Session.GetGitHubUser(r.Context())
		if err != nil {
			http.Error(w, `{"error":"not authenticated"}`, http.StatusUnauthorized)
			return
		}

		if gitHubUser.AccessToken == "" {
			http.Error(w, `{"error":"no access token found"}`, http.StatusUnauthorized)
			return
		}

		// Create GitHub client with user's access token
		client := github.NewClient(nil).WithAuthToken(gitHubUser.AccessToken)

		// Fetch repositories using GitHub API
		opt := &github.RepositoryListByAuthenticatedUserOptions{
			ListOptions: github.ListOptions{PerPage: 100}, // Increased to get more repos
			Sort:        "updated",                        // Sort by last updated
			Direction:   "desc",                           // Most recently updated first
		}

		var allRepos []*github.Repository
		for {
			repos, resp, err := client.Repositories.ListByAuthenticatedUser(r.Context(), opt)
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error":"failed to fetch repositories: %v"}`, err), http.StatusInternalServerError)
				return
			}

			allRepos = append(allRepos, repos...)
			if resp.NextPage == 0 {
				break
			}
			opt.Page = resp.NextPage
		}

		// Format repositories for frontend
		formattedRepos := make([]map[string]interface{}, 0, len(allRepos))
		for _, repo := range allRepos {
			// Skip forks if desired (optional)
			// if repo.GetFork() { continue }

			repoData := map[string]interface{}{
				"name":        repo.GetName(),
				"full_name":   repo.GetFullName(),
				"description": repo.GetDescription(),
				"private":     repo.GetPrivate(),
				"language":    repo.GetLanguage(),
				"updated_at":  repo.GetUpdatedAt().Format(time.RFC3339),
				"html_url":    repo.GetHTMLURL(),
				"clone_url":   repo.GetCloneURL(),
			}
			formattedRepos = append(formattedRepos, repoData)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(formattedRepos)
	})

	// GitHub repository selection endpoint
	m.HandleFunc("/select-repo", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Repository string `json:"repository"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		if req.Repository == "" {
			http.Error(w, "Repository is required", http.StatusBadRequest)
			return
		}

		// Update repository selection in session
		if err := d.Session.UpdateGitHubUserRepo(r.Context(), req.Repository); err != nil {
			http.Error(w, `{"error":"failed to update repository selection"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"success":    true,
			"repository": req.Repository,
			"message":    "Repository selected successfully",
		}
		json.NewEncoder(w).Encode(response)
	})

	// GitHub repository clone endpoint
	m.HandleFunc("/clone-repo", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get GitHub user data from session
		gitHubUser, err := d.Session.GetGitHubUser(r.Context())
		if err != nil {
			http.Error(w, `{"error":"not authenticated"}`, http.StatusUnauthorized)
			return
		}

		if gitHubUser.Repo == "" {
			http.Error(w, `{"error":"no repository selected"}`, http.StatusBadRequest)
			return
		}

		// Parse repository full name (owner/repo)
		repoParts := strings.Split(gitHubUser.Repo, "/")
		if len(repoParts) != 2 {
			http.Error(w, `{"error":"invalid repository format"}`, http.StatusBadRequest)
			return
		}

		repoName := repoParts[1]
		repoURL := fmt.Sprintf("https://github.com/%s.git", gitHubUser.Repo)

		// Create user directory path: ./data/coderunner/src/@username/repositories/reponame
		userDir := fmt.Sprintf("./data/coderunner/src/@%s", gitHubUser.GithubUsername)
		repoDir := filepath.Join(userDir, "repositories", repoName)

		// Ensure the user and repositories directory exists
		if err := os.MkdirAll(filepath.Dir(repoDir), 0755); err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"failed to create directories: %v"}`, err), http.StatusInternalServerError)
			return
		}

		var cloneResult string
		if _, err := os.Stat(repoDir); err != nil {
			// Repository doesn't exist, clone it
			fmt.Printf("Cloning repository %s into %s\n", repoURL, repoDir)

			cloneOptions := &git.CloneOptions{
				URL:      repoURL,
				Progress: os.Stdout,
			}

			// Add authentication if we have an access token
			if gitHubUser.AccessToken != "" {
				cloneOptions.Auth = &githttp.BasicAuth{
					Username: gitHubUser.GithubUsername,
					Password: gitHubUser.AccessToken,
				}
			}

			_, err := git.PlainClone(repoDir, false, cloneOptions)
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error":"failed to clone repository: %v"}`, err), http.StatusInternalServerError)
				return
			}
			cloneResult = "Repository cloned successfully"
		} else {
			// Repository exists, pull latest changes
			fmt.Printf("Pulling latest changes for repository %s\n", repoURL)

			repo, err := git.PlainOpen(repoDir)
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error":"failed to open repository: %v"}`, err), http.StatusInternalServerError)
				return
			}

			workTree, err := repo.Worktree()
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error":"failed to get worktree: %v"}`, err), http.StatusInternalServerError)
				return
			}

			pullAuth := &git.PullOptions{
				RemoteName: "origin",
			}
			if gitHubUser.AccessToken != "" {
				pullAuth.Auth = &githttp.BasicAuth{
					Username: gitHubUser.GithubUsername,
					Password: gitHubUser.AccessToken,
				}
			}

			err = workTree.Pull(pullAuth)
			if err != nil && err != git.NoErrAlreadyUpToDate {
				http.Error(w, fmt.Sprintf(`{"error":"failed to pull repository: %v"}`, err), http.StatusInternalServerError)
				return
			}

			if err == git.NoErrAlreadyUpToDate {
				cloneResult = "Repository is already up to date"
			} else {
				cloneResult = "Repository updated successfully"
			}
		}

		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"success":    true,
			"repository": gitHubUser.Repo,
			"message":    cloneResult,
			"path":       repoDir,
		}
		json.NewEncoder(w).Encode(response)
	})

	return m
}

// handleFiles handles GET (list files) and POST (save file) requests
func handleFiles(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		handleListFiles(w, r)
	case "POST":
		handleSaveFile(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleListFiles returns the directory structure as JSON
func handleListFiles(w http.ResponseWriter, r *http.Request) {
	srcDir := "./data/coderunner/src"

	files, err := buildFileTree(srcDir)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read files: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(files)
}

// handleSaveFile saves content to the specified path
func handleSaveFile(w http.ResponseWriter, r *http.Request) {
	var req SaveFileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate and sanitize the path
	if req.Path == "" {
		http.Error(w, "Path is required", http.StatusBadRequest)
		return
	}

	// Remove any path traversal attempts
	cleanPath := filepath.Clean(req.Path)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Ensure path starts with username (e.g., "@breadchris/")
	if !strings.HasPrefix(cleanPath, "@") {
		http.Error(w, "Path must start with username (e.g., @breadchris/filename.tsx)", http.StatusBadRequest)
		return
	}

	// Build full path
	fullPath := filepath.Join("./data/coderunner/src", cleanPath)

	// Create directory if it doesn't exist
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create directory: %v", err), http.StatusInternalServerError)
		return
	}

	// Write the file
	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		http.Error(w, fmt.Sprintf("Failed to write file: %v", err), http.StatusInternalServerError)
		return
	}

	// Return success response
	response := map[string]interface{}{
		"success": true,
		"path":    req.Path,
		"message": "File saved successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleFileContent serves individual file content
func handleFileContent(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract path from URL
	urlPath := strings.TrimPrefix(r.URL.Path, "/api/files/")
	if urlPath == "" {
		http.Error(w, "File path is required", http.StatusBadRequest)
		return
	}

	// Validate and sanitize the path
	cleanPath := filepath.Clean(urlPath)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Build full path
	fullPath := filepath.Join("./data/coderunner/src", cleanPath)

	// Check if file exists and is not a directory
	info, err := os.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "File not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Error accessing file: %v", err), http.StatusInternalServerError)
		}
		return
	}

	if info.IsDir() {
		http.Error(w, "Path is a directory", http.StatusBadRequest)
		return
	}

	// Read and return file content
	content, err := os.ReadFile(fullPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read file: %v", err), http.StatusInternalServerError)
		return
	}

	// Set appropriate content type
	contentType := "text/plain"
	ext := filepath.Ext(fullPath)
	switch ext {
	case ".tsx", ".ts":
		contentType = "application/typescript"
	case ".jsx", ".js":
		contentType = "application/javascript"
	case ".json":
		contentType = "application/json"
	case ".css":
		contentType = "text/css"
	case ".html":
		contentType = "text/html"
	}

	w.Header().Set("Content-Type", contentType)
	w.Write(content)
}

// handleBuild builds the requested file using esbuild and returns the built code
func handleBuild(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract path from URL
	buildPath := strings.TrimPrefix(r.URL.Path, "/api/build/")
	if buildPath == "" {
		http.Error(w, "Build path is required", http.StatusBadRequest)
		return
	}

	// Validate and sanitize the path
	cleanPath := filepath.Clean(buildPath)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Ensure path starts with username
	if !strings.HasPrefix(cleanPath, "@") {
		http.Error(w, "Path must start with username (e.g., @breadchris/filename.tsx)", http.StatusBadRequest)
		return
	}

	// Build source and output paths
	srcPath := filepath.Join("./data/coderunner/src", cleanPath)
	buildDir := "./data/coderunner/build"
	outputPath := filepath.Join(buildDir, cleanPath+".js")

	// Check if source file exists
	if _, err := os.Stat(srcPath); os.IsNotExist(err) {
		http.Error(w, "Source file not found", http.StatusNotFound)
		return
	}

	// Create build directory if it doesn't exist
	outputDir := filepath.Dir(outputPath)
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create build directory: %v", err), http.StatusInternalServerError)
		return
	}

	// Check if we have a cached build that's still valid
	if isCachedBuildValid(srcPath, outputPath) {
		// Serve cached build
		cachedContent, err := os.ReadFile(outputPath)
		if err == nil {
			w.Header().Set("Content-Type", "application/javascript")
			w.Header().Set("X-Build-Cache", "hit")
			w.Write(cachedContent)
			return
		}
	}

	// Build with esbuild
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{srcPath},
		Loader: map[string]api.Loader{
			".js":  api.LoaderJS,
			".jsx": api.LoaderJSX,
			".ts":  api.LoaderTS,
			".tsx": api.LoaderTSX,
			".css": api.LoaderCSS,
		},
		Outfile:         outputPath,
		Format:          api.FormatESModule,
		Bundle:          true,
		Write:           true,
		TreeShaking:     api.TreeShakingTrue,
		Target:          api.ES2017,
		JSX:             api.JSXAutomatic,
		JSXImportSource: "react",
		LogLevel:        api.LogLevelSilent, // Suppress logs for API calls
	})

	// Check for build errors
	if len(result.Errors) > 0 {
		errorMessages := make([]string, len(result.Errors))
		for i, err := range result.Errors {
			errorMessages[i] = err.Text
		}

		errorResponse := map[string]interface{}{
			"error":   "Build failed",
			"details": errorMessages,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(errorResponse)
		return
	}

	// Read the built file
	builtContent, err := os.ReadFile(outputPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read built file: %v", err), http.StatusInternalServerError)
		return
	}

	// Return the built code
	w.Header().Set("Content-Type", "application/javascript")
	w.Header().Set("X-Build-Cache", "miss")
	w.Write(builtContent)
}

// buildFileTree recursively builds a tree of files and directories
func buildFileTree(dir string) ([]FileInfo, error) {
	var files []FileInfo

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Continue walking even if we can't access a file
		}

		// Skip the root directory itself
		if path == dir {
			return nil
		}

		// Skip hidden files and directories (starting with .)
		if strings.HasPrefix(info.Name(), ".") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		// Calculate relative path from src directory
		relPath, err := filepath.Rel(dir, path)
		if err != nil {
			return nil
		}

		fileInfo := FileInfo{
			Name:         info.Name(),
			Path:         filepath.ToSlash(relPath), // Ensure forward slashes for web
			IsDir:        info.IsDir(),
			Size:         info.Size(),
			LastModified: info.ModTime(),
		}

		files = append(files, fileInfo)
		return nil
	})

	if err != nil {
		return nil, err
	}

	return files, nil
}

// isCachedBuildValid checks if the cached build is newer than the source file
func isCachedBuildValid(srcPath, outputPath string) bool {
	srcInfo, err := os.Stat(srcPath)
	if err != nil {
		return false
	}

	outputInfo, err := os.Stat(outputPath)
	if err != nil {
		return false
	}

	// Cached build is valid if it's newer than the source
	return outputInfo.ModTime().After(srcInfo.ModTime())
}

// handleDeleteFile deletes a file from the filesystem
func handleDeleteFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract path from URL
	urlPath := strings.TrimPrefix(r.URL.Path, "/api/delete/")
	if urlPath == "" {
		http.Error(w, "File path is required", http.StatusBadRequest)
		return
	}

	// Validate and sanitize the path
	cleanPath := filepath.Clean(urlPath)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Ensure path starts with username (e.g., "@breadchris/")
	if !strings.HasPrefix(cleanPath, "@") {
		http.Error(w, "Path must start with username (e.g., @breadchris/filename.tsx)", http.StatusBadRequest)
		return
	}

	// Build full path
	fullPath := filepath.Join("./data/coderunner/src", cleanPath)

	// Check if file exists
	info, err := os.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "File not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Error accessing file: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Don't allow deleting directories
	if info.IsDir() {
		http.Error(w, "Cannot delete directories", http.StatusBadRequest)
		return
	}

	// Delete the file
	if err := os.Remove(fullPath); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete file: %v", err), http.StatusInternalServerError)
		return
	}

	// Return success response
	response := map[string]interface{}{
		"success": true,
		"path":    cleanPath,
		"message": "File deleted successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
