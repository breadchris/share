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
		fmt.Printf("DEBUG: Coderunner main handler received path: %s\n", r.URL.Path)
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
		fmt.Printf("DEBUG: API files handler received path: %s, method: %s\n", r.URL.Path, r.Method)
		handleFiles(w, r)
	})
	m.HandleFunc("/api/files/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("DEBUG: API files/ handler received path: %s, method: %s\n", r.URL.Path, r.Method)
		handleFileContent(w, r)
	})
	m.HandleFunc("/api/build/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("DEBUG: API build/ handler received path: %s, method: %s\n", r.URL.Path, r.Method)
		handleBuild(w, r)
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

	println("DEBUG: handleListFiles", srcDir)

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

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		fullPath := filepath.Join(dir, entry.Name())
		info, err := entry.Info()
		if err != nil {
			continue
		}

		// Calculate relative path from src directory
		relPath, err := filepath.Rel("./data/coderunner/src", fullPath)
		if err != nil {
			continue
		}

		fileInfo := FileInfo{
			Name:         entry.Name(),
			Path:         filepath.ToSlash(relPath), // Ensure forward slashes for web
			IsDir:        entry.IsDir(),
			Size:         info.Size(),
			LastModified: info.ModTime(),
		}

		files = append(files, fileInfo)
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
