package coderunner

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/breadchris/share/coderunner/claude"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/evanw/esbuild/pkg/api"
	"github.com/go-git/go-git/v5"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/google/go-github/v66/github"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
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
	FileCount    int       `json:"fileCount"` // Number of files in directory (0 for regular files)
}

type SaveFileRequest struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

func New(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	// Main coderunner page - now shows Switch Homepage
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Id("switch-homepage"),
			),
			Script(Type("importmap"), Raw(`
			{
				"imports": {
					"react": "https://esm.sh/react@18",
					"react-dom": "https://esm.sh/react-dom@18",
					"react-dom/client": "https://esm.sh/react-dom@18/client",
					"react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime"
				}
			}
			`)),
			Script(Src("https://cdn.tailwindcss.com")),
			Script(Src("/coderunner/module/@breadchris/SwitchHomepage.tsx"), Type("module")),
			Div(Id("root")),
			LoadModule("@breadchris/SwitchHomepage.tsx", "SwitchHomepage"),
		).RenderPage(w, r)
	})

	m.HandleFunc("/claude", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Script(Type("importmap"), Raw(`
			{
				"imports": {
					"react": "https://esm.sh/react@18",
					"react-dom": "https://esm.sh/react-dom@18",
					"react-dom/client": "https://esm.sh/react-dom@18/client",
					"react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime"
				}
			}
			`)),
			Script(Src("https://cdn.tailwindcss.com")),
			Div(Id("root")),
			LoadModule("claude/ClaudeWebInterface.tsx", "ClaudeWebInterface"),
		).RenderPage(w, r)
	})

	// Editor route - original CodeRunner
	m.HandleFunc("/editor", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Id("code-runner"),
				Attr("data-props", `{"darkMode": true, "language": "typescript"}`),
			),
			Script(Src("https://cdn.tailwindcss.com")),
			Script(Src("https://unpkg.com/esbuild-wasm@0.25.5/lib/browser.min.js")),
			Script(Src("/coderunner/module/coderunner/"), Type("module")),
		).RenderPage(w, r)
	})

	// Browse route - Component Browser
	m.HandleFunc("/browse", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Id("component-browser"),
			),
			Script(Type("importmap"), Raw(`
			{
				"imports": {
					"react": "https://esm.sh/react@18",
					"react-dom": "https://esm.sh/react-dom@18",
					"react-dom/client": "https://esm.sh/react-dom@18/client",
					"react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime"
				}
			}
			`)),
			Script(Src("https://cdn.tailwindcss.com")),
			Script(Src("/coderunner/module/@breadchris/ComponentBrowser.tsx"), Type("module")),
			Div(Id("root")),
			LoadModule("@breadchris/ComponentBrowser.tsx", "ComponentBrowser"),
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

		// Create user directory path: ./coderunner/src/@username/repositories/reponame
		userDir := fmt.Sprintf("./coderunner/src/@%s", gitHubUser.GithubUsername)
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

	// Component renderer endpoint
	m.HandleFunc("/render/", func(w http.ResponseWriter, r *http.Request) {
		handleRenderComponent(w, r)
	})

	// Full renderer endpoint with CSS file support
	m.HandleFunc("/fullrender/", func(w http.ResponseWriter, r *http.Request) {
		handleFullRenderComponent(w, r)
	})

	// ES Module endpoint - serves compiled JavaScript as ES modules
	m.HandleFunc("/module/", func(w http.ResponseWriter, r *http.Request) {
		handleServeModule(w, r)
	})

	// CSS file serving endpoint for fullrender
	m.HandleFunc("/fullrender/css/", func(w http.ResponseWriter, r *http.Request) {
		handleServeCSS(w, r)
	})

	// JavaScript file serving endpoint for fullrender
	m.HandleFunc("/fullrender/js/", func(w http.ResponseWriter, r *http.Request) {
		handleServeJS(w, r)
	})

	// Claude endpoints
	claudeService := claude.NewClaudeService(d)

	// WebSocket endpoint for Claude streaming
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins in development
		},
	}

	m.HandleFunc("/claude/ws", func(w http.ResponseWriter, r *http.Request) {
		// Handle HEAD requests for authentication testing
		if r.Method == "HEAD" {
			_, err := d.Session.GetUserID(r.Context())
			if err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			w.WriteHeader(http.StatusOK)
			return
		}

		// Handle WebSocket upgrade requests
		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session
		userID, err := d.Session.GetUserID(r.Context())
		if err != nil {
			// For WebSocket connections, we can't redirect, so return JSON error
			// The frontend will handle this and redirect to login
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error":    "authentication_required",
				"message":  "Please log in to access Claude",
				"redirect": "/login",
			})
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			http.Error(w, "Failed to upgrade WebSocket", http.StatusInternalServerError)
			return
		}

		claudeService.HandleWebSocket(conn, userID)
	})

	// List Claude sessions
	m.HandleFunc("/claude/sessions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		userID, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		sessions, err := claudeService.GetSessions(userID)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to get sessions: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(sessions)
	})

	// Get specific Claude session
	m.HandleFunc("/claude/sessions/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		userID, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		sessionID := strings.TrimPrefix(r.URL.Path, "/claude/sessions/")
		if sessionID == "" {
			http.Error(w, "Session ID required", http.StatusBadRequest)
			return
		}

		session, err := claudeService.GetSession(sessionID, userID)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to get session: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(session)
	})

	// Pinned Files API endpoints
	// GET /api/config/pinned-files - Get user's pinned files
	m.HandleFunc("/api/config/pinned-files", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session
		userID, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, `{"error":"not authenticated"}`, http.StatusUnauthorized)
			return
		}

		// Get pinned files from database
		var pinnedFiles []models.PinnedFile
		if err := d.DB.Where("user_id = ?", userID).Find(&pinnedFiles).Error; err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"failed to get pinned files: %v"}`, err), http.StatusInternalServerError)
			return
		}

		// Extract file paths
		filePaths := make([]string, len(pinnedFiles))
		for i, pf := range pinnedFiles {
			filePaths[i] = pf.FilePath
		}

		w.Header().Set("Content-Type", "application/json")
		response := map[string][]string{
			"pinnedFiles": filePaths,
		}
		json.NewEncoder(w).Encode(response)
	})

	// PUT /api/config/pinned-files/{filePath} - Toggle pin status for a file
	m.HandleFunc("/api/config/pinned-files/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "PUT" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get user ID from session
		userID, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, `{"error":"not authenticated"}`, http.StatusUnauthorized)
			return
		}

		// Extract file path from URL
		filePath := strings.TrimPrefix(r.URL.Path, "/api/config/pinned-files/")
		if filePath == "" {
			http.Error(w, `{"error":"file path is required"}`, http.StatusBadRequest)
			return
		}

		// Decode URL-encoded file path
		decodedPath, err := url.QueryUnescape(filePath)
		if err != nil {
			http.Error(w, `{"error":"invalid file path"}`, http.StatusBadRequest)
			return
		}

		// Check if file is already pinned
		var existingPin models.PinnedFile
		err = d.DB.Where("user_id = ? AND file_path = ?", userID, decodedPath).First(&existingPin).Error

		if err != nil && err.Error() != "record not found" {
			// Database error
			http.Error(w, fmt.Sprintf(`{"error":"database error: %v"}`, err), http.StatusInternalServerError)
			return
		}

		var isPinned bool
		if err != nil && err.Error() == "record not found" {
			// File not pinned, create new pin
			newPin := models.PinnedFile{
				Model: models.Model{
					ID:        uuid.New().String(),
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				},
				UserID:   userID,
				FilePath: decodedPath,
			}

			if err := d.DB.Create(&newPin).Error; err != nil {
				http.Error(w, fmt.Sprintf(`{"error":"failed to pin file: %v"}`, err), http.StatusInternalServerError)
				return
			}
			isPinned = true
		} else {
			// File is pinned, remove pin
			if err := d.DB.Delete(&existingPin).Error; err != nil {
				http.Error(w, fmt.Sprintf(`{"error":"failed to unpin file: %v"}`, err), http.StatusInternalServerError)
				return
			}
			isPinned = false
		}

		w.Header().Set("Content-Type", "application/json")
		response := map[string]bool{
			"isPinned": isPinned,
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
	srcDir := "./coderunner/src"

	// Check for path parameter to list specific directory
	queryPath := r.URL.Query().Get("path")
	depth := 1 // Default to immediate children only
	if depthStr := r.URL.Query().Get("depth"); depthStr != "" {
		if d, err := strconv.Atoi(depthStr); err == nil && d > 0 {
			depth = d
		}
	}

	var files []FileInfo
	var err error

	if queryPath != "" {
		// List specific directory
		files, err = buildDirectoryListing(srcDir, queryPath, depth)
	} else {
		// List all files (backwards compatibility) but limit to depth 1 for performance
		files, err = buildDirectoryListing(srcDir, "", 1)
	}

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

	// Build full path
	fullPath := filepath.Join("./coderunner/src", cleanPath)

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
	fullPath := filepath.Join("./coderunner/src", cleanPath)

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

	// Build source and output paths
	srcPath := filepath.Join("./coderunner/src", cleanPath)
	buildDir := "./coderunner/build"
	outputPath := filepath.Join(buildDir, cleanPath+".js")

	println("Building file:", srcPath, "to", outputPath)

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
		LogLevel:        api.LogLevelInfo, // Enable logs to see build details
		TsconfigRaw: `{
			"compilerOptions": {
				"jsx": "react-jsx",
				"allowSyntheticDefaultImports": true,
				"esModuleInterop": true,
				"moduleResolution": "node",
				"target": "ES2017",
				"lib": ["ES2017", "DOM", "DOM.Iterable"],
				"allowJs": true,
				"skipLibCheck": true,
				"strict": false,
				"forceConsistentCasingInFileNames": true,
				"noEmit": true,
				"incremental": true,
				"resolveJsonModule": true,
				"isolatedModules": true
			}
		}`,
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

// buildDirectoryListing lists files in a specific directory with controlled depth
func buildDirectoryListing(baseDir, relativePath string, maxDepth int) ([]FileInfo, error) {
	var files []FileInfo

	// Build the target directory path
	targetDir := baseDir
	if relativePath != "" {
		// Validate and sanitize the relative path
		cleanPath := filepath.Clean(relativePath)
		if strings.Contains(cleanPath, "..") {
			return nil, fmt.Errorf("invalid path")
		}
		targetDir = filepath.Join(baseDir, cleanPath)
	}

	// Check if directory exists
	if _, err := os.Stat(targetDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("directory not found")
	}

	// Read directory contents
	entries, err := os.ReadDir(targetDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		// Skip hidden files and directories (starting with .)
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue // Skip files we can't read
		}

		// Build the relative path from the base src directory
		var relPath string
		if relativePath == "" {
			relPath = entry.Name()
		} else {
			relPath = filepath.ToSlash(filepath.Join(relativePath, entry.Name()))
		}

		fileInfo := FileInfo{
			Name:         entry.Name(),
			Path:         relPath,
			IsDir:        entry.IsDir(),
			Size:         info.Size(),
			LastModified: info.ModTime(),
			FileCount:    0, // Default to 0 for files
		}

		// If it's a directory, count the files inside it (one level deep)
		//if entry.IsDir() {
		//	fileInfo.FileCount = countFilesInDirectory(filepath.Join(targetDir, entry.Name()))
		//}

		files = append(files, fileInfo)

		// If it's a directory and we haven't reached max depth, recurse
		if entry.IsDir() && maxDepth >= 1 {
			childFiles, err := buildDirectoryListing(baseDir, relPath, maxDepth-1)
			if err == nil {
				files = append(files, childFiles...)
			}
		}
	}

	return files, nil
}

// countFilesInDirectory counts the number of files (not directories) in a directory one level deep
func countFilesInDirectory(dirPath string) int {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return 0 // Return 0 if we can't read the directory
	}

	count := 0
	for _, entry := range entries {
		// Skip hidden files and directories (starting with .)
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		// Count both files and subdirectories for UI display purposes
		// This gives a better sense of "content" in the directory
		count++
	}

	return count
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
			FileCount:    0, // Default to 0 for files, could be enhanced later for directories
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

	// Build full path
	fullPath := filepath.Join("./coderunner/src", cleanPath)

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

// handleRenderComponent builds and renders a React component in a simple HTML page
func handleRenderComponent(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract path from URL
	componentPath := strings.TrimPrefix(r.URL.Path, "/render/")
	if componentPath == "" {
		http.Error(w, "Component path is required", http.StatusBadRequest)
		return
	}

	// Get component name from query parameter (optional)
	componentName := r.URL.Query().Get("component")
	if componentName == "" {
		componentName = "App" // Default to App component
	}

	// Validate and sanitize the path
	cleanPath := filepath.Clean(componentPath)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Build source path
	srcPath := filepath.Join("./coderunner/src", cleanPath)

	// Check if source file exists
	if _, err := os.Stat(srcPath); os.IsNotExist(err) {
		http.Error(w, "Source file not found", http.StatusNotFound)
		return
	}

	// Read the source code to build
	sourceCode, err := os.ReadFile(srcPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read source file: %v", err), http.StatusInternalServerError)
		return
	}

	// Build with esbuild to get the compiled JavaScript
	result := api.Build(api.BuildOptions{
		Stdin: &api.StdinOptions{
			Contents:   string(sourceCode),
			ResolveDir: filepath.Dir(srcPath),
			Sourcefile: filepath.Base(srcPath),
			Loader:     api.LoaderTSX,
		},
		Loader: map[string]api.Loader{
			".js":  api.LoaderJS,
			".jsx": api.LoaderJSX,
			".ts":  api.LoaderTS,
			".tsx": api.LoaderTSX,
			".css": api.LoaderCSS,
		},
		Format:          api.FormatESModule,
		Bundle:          true,
		Write:           false,
		TreeShaking:     api.TreeShakingTrue,
		Target:          api.ESNext,
		JSX:             api.JSXAutomatic,
		JSXImportSource: "react",
		LogLevel:        api.LogLevelSilent,
		External:        []string{"react", "react-dom", "react-player"},
		TsconfigRaw: `{
			"compilerOptions": {
				"jsx": "react-jsx",
				"allowSyntheticDefaultImports": true,
				"esModuleInterop": true,
				"moduleResolution": "node",
				"target": "ESNext",
				"lib": ["ESNext", "DOM", "DOM.Iterable"],
				"allowJs": true,
				"skipLibCheck": true,
				"strict": false,
				"forceConsistentCasingInFileNames": true,
				"noEmit": true,
				"incremental": true,
				"resolveJsonModule": true,
				"isolatedModules": true
			}
		}`,
	})

	// Check for build errors
	if len(result.Errors) > 0 {
		errorMessages := make([]string, len(result.Errors))
		for i, err := range result.Errors {
			errorMessages[i] = fmt.Sprintf("%s:%d:%d: %s", err.Location.File, err.Location.Line, err.Location.Column, err.Text)
		}

		// Use the BuildErrorPage helper
		w.WriteHeader(http.StatusBadRequest)
		BuildErrorPage(componentPath, errorMessages).RenderPage(w, r)
		return
	}

	// Verify build succeeded
	if len(result.OutputFiles) == 0 {
		http.Error(w, "No output generated from build", http.StatusInternalServerError)
		return
	}

	// Generate the HTML page using Go HTML format
	page := ReactComponentPage(componentName,
		ComponentLoader(componentPath, componentName, true),
	)

	// Render the page
	page.RenderPage(w, r)
}


// handleServeModule builds and serves a React component as an ES module
func handleServeModule(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract path from URL
	componentPath := strings.TrimPrefix(r.URL.Path, "/module/")
	if componentPath == "" {
		http.Error(w, "Component path is required", http.StatusBadRequest)
		return
	}

	// Validate and sanitize the path
	cleanPath := filepath.Clean(componentPath)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Build source path
	srcPath := filepath.Join("./coderunner/src", cleanPath)

	// Check if source file exists
	if _, err := os.Stat(srcPath); os.IsNotExist(err) {
		http.Error(w, "Source file not found", http.StatusNotFound)
		return
	}

	// Read the source code to build
	sourceCode, err := os.ReadFile(srcPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read source file: %v", err), http.StatusInternalServerError)
		return
	}

	// Build with esbuild to get the compiled JavaScript as ES module
	result := api.Build(api.BuildOptions{
		Stdin: &api.StdinOptions{
			Contents:   string(sourceCode),
			ResolveDir: filepath.Dir(srcPath),
			Sourcefile: filepath.Base(srcPath),
			Loader:     api.LoaderTSX,
		},
		Loader: map[string]api.Loader{
			".js":  api.LoaderJS,
			".jsx": api.LoaderJSX,
			".ts":  api.LoaderTS,
			".tsx": api.LoaderTSX,
			".css": api.LoaderCSS,
		},
		Format:          api.FormatESModule,
		Bundle:          true,
		Write:           false,
		TreeShaking:     api.TreeShakingTrue,
		Target:          api.ESNext,
		JSX:             api.JSXAutomatic,
		JSXImportSource: "react",
		LogLevel:        api.LogLevelSilent,
		External:        []string{"react", "react-dom", "react-dom/client", "react/jsx-runtime"},
		TsconfigRaw: `{
			"compilerOptions": {
				"jsx": "react-jsx",
				"allowSyntheticDefaultImports": true,
				"esModuleInterop": true,
				"moduleResolution": "node",
				"target": "ESNext",
				"lib": ["ESNext", "DOM", "DOM.Iterable"],
				"allowJs": true,
				"skipLibCheck": true,
				"strict": false,
				"forceConsistentCasingInFileNames": true,
				"noEmit": true,
				"incremental": true,
				"resolveJsonModule": true,
				"isolatedModules": true
			}
		}`,
	})

	// Check for build errors
	if len(result.Errors) > 0 {
		errorMessages := make([]string, len(result.Errors))
		for i, err := range result.Errors {
			errorMessages[i] = fmt.Sprintf("%s:%d:%d: %s", err.Location.File, err.Location.Line, err.Location.Column, err.Text)
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

	// Get the compiled JavaScript
	if len(result.OutputFiles) == 0 {
		http.Error(w, "No output generated from build", http.StatusInternalServerError)
		return
	}

	compiledJS := string(result.OutputFiles[0].Contents)

	// Return the ES module code
	w.Header().Set("Content-Type", "application/javascript")
	w.Header().Set("Cache-Control", "no-cache") // Prevent caching during development
	w.Write([]byte(compiledJS))
}

// handleFullRenderComponent builds and renders a React component with separate CSS file output
func handleFullRenderComponent(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract path from URL
	componentPath := strings.TrimPrefix(r.URL.Path, "/fullrender/")
	if componentPath == "" {
		http.Error(w, "Component path is required", http.StatusBadRequest)
		return
	}

	// Get component name from query parameter (optional)
	componentName := r.URL.Query().Get("component")
	if componentName == "" {
		componentName = "App" // Default to App component
	}

	// Validate and sanitize the path
	cleanPath := filepath.Clean(componentPath)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Build source path
	srcPath := filepath.Join("./coderunner/src", cleanPath)

	// Check if source file exists
	if _, err := os.Stat(srcPath); os.IsNotExist(err) {
		http.Error(w, "Source file not found", http.StatusNotFound)
		return
	}

	// Create output directory for this component
	outputDir := filepath.Join("./coderunner/build/fullrender", cleanPath)
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create output directory: %v", err), http.StatusInternalServerError)
		return
	}

	// Build with esbuild to output separate CSS files
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{srcPath},
		Outdir:      outputDir,
		Loader: map[string]api.Loader{
			".js":  api.LoaderJS,
			".jsx": api.LoaderJSX,
			".ts":  api.LoaderTS,
			".tsx": api.LoaderTSX,
			".css": api.LoaderCSS,
		},
		Format:          api.FormatESModule,
		Bundle:          true,
		Write:           true,
		TreeShaking:     api.TreeShakingTrue,
		Target:          api.ESNext,
		JSX:             api.JSXAutomatic,
		JSXImportSource: "react",
		LogLevel:        api.LogLevelSilent,
		External:        []string{"react", "react-dom", "react-dom/client", "react/jsx-runtime"},
		AssetNames:      "[name]-[hash]",
		EntryNames:      "[name]",
		TsconfigRaw: `{
			"compilerOptions": {
				"jsx": "react-jsx",
				"allowSyntheticDefaultImports": true,
				"esModuleInterop": true,
				"moduleResolution": "node",
				"target": "ESNext",
				"lib": ["ESNext", "DOM", "DOM.Iterable"],
				"allowJs": true,
				"skipLibCheck": true,
				"strict": false,
				"forceConsistentCasingInFileNames": true,
				"noEmit": true,
				"incremental": true,
				"resolveJsonModule": true,
				"isolatedModules": true
			}
		}`,
	})

	// Check for build errors
	if len(result.Errors) > 0 {
		errorMessages := make([]string, len(result.Errors))
		for i, err := range result.Errors {
			errorMessages[i] = fmt.Sprintf("%s:%d:%d: %s", err.Location.File, err.Location.Line, err.Location.Column, err.Text)
		}

		// Use the BuildErrorPage helper
		w.WriteHeader(http.StatusBadRequest)
		BuildErrorPage(componentPath, errorMessages).RenderPage(w, r)
		return
	}

	// Find generated files in the output directory
	files, err := os.ReadDir(outputDir)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read output directory: %v", err), http.StatusInternalServerError)
		return
	}

	var jsFile, cssFiles []string
	for _, file := range files {
		if !file.IsDir() {
			fileName := file.Name()
			ext := filepath.Ext(fileName)
			if ext == ".js" {
				jsFile = append(jsFile, fileName)
			} else if ext == ".css" {
				cssFiles = append(cssFiles, fileName)
			}
		}
	}

	if len(jsFile) == 0 {
		http.Error(w, "No JavaScript output generated", http.StatusInternalServerError)
		return
	}

	// Generate the HTML page using Go HTML format
	page := ReactComponentPageWithCSS(componentName, cleanPath, jsFile[0], cssFiles)

	// Render the page
	page.RenderPage(w, r)
}

// handleServeCSS serves CSS files from the fullrender build output
func handleServeCSS(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract path from URL: /fullrender/css/component/path/filename.css
	urlPath := strings.TrimPrefix(r.URL.Path, "/fullrender/css/")
	if urlPath == "" {
		http.Error(w, "CSS file path is required", http.StatusBadRequest)
		return
	}

	// Validate and sanitize the path
	cleanPath := filepath.Clean(urlPath)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Build full path to CSS file
	cssPath := filepath.Join("./coderunner/build/fullrender", cleanPath)

	// Check if file exists and is a CSS file
	info, err := os.Stat(cssPath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "CSS file not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Error accessing CSS file: %v", err), http.StatusInternalServerError)
		}
		return
	}

	if info.IsDir() || filepath.Ext(cssPath) != ".css" {
		http.Error(w, "Path is not a CSS file", http.StatusBadRequest)
		return
	}

	// Read and serve CSS file
	cssContent, err := os.ReadFile(cssPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read CSS file: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/css")
	w.Header().Set("Cache-Control", "no-cache") // Prevent caching during development
	w.Write(cssContent)
}

// handleServeJS serves JavaScript files from the fullrender build output
func handleServeJS(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract path from URL: /fullrender/js/component/path/filename.js
	urlPath := strings.TrimPrefix(r.URL.Path, "/fullrender/js/")
	if urlPath == "" {
		http.Error(w, "JavaScript file path is required", http.StatusBadRequest)
		return
	}

	// Validate and sanitize the path
	cleanPath := filepath.Clean(urlPath)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Build full path to JavaScript file
	jsPath := filepath.Join("./coderunner/build/fullrender", cleanPath)

	// Check if file exists and is a JavaScript file
	info, err := os.Stat(jsPath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "JavaScript file not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Error accessing JavaScript file: %v", err), http.StatusInternalServerError)
		}
		return
	}

	if info.IsDir() || filepath.Ext(jsPath) != ".js" {
		http.Error(w, "Path is not a JavaScript file", http.StatusBadRequest)
		return
	}

	// Read and serve JavaScript file
	jsContent, err := os.ReadFile(jsPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read JavaScript file: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/javascript")
	w.Header().Set("Cache-Control", "no-cache") // Prevent caching during development
	w.Write(jsContent)
}
