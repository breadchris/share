package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"time"
)

var (
	version   = "1.0.0"
	buildTime = time.Now().Format(time.RFC3339)
	gitCommit = os.Getenv("GIT_COMMIT")
	startTime = time.Now()
)

type Status struct {
	Status    string            `json:"status"`
	Version   string            `json:"version"`
	BuildTime string            `json:"build_time"`
	GitCommit string            `json:"git_commit,omitempty"`
	Uptime    string            `json:"uptime"`
	Hostname  string            `json:"hostname"`
	GoVersion string            `json:"go_version"`
	Platform  string            `json:"platform"`
	Env       map[string]string `json:"env,omitempty"`
}

type RequestInfo struct {
	Method    string      `json:"method"`
	URL       string      `json:"url"`
	Headers   http.Header `json:"headers"`
	RemoteIP  string      `json:"remote_ip"`
	UserAgent string      `json:"user_agent"`
	Hostname  string      `json:"hostname"`
	Timestamp string      `json:"timestamp"`
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Set up routes
	http.HandleFunc("/", loggingMiddleware(handler))
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/status", statusHandler)
	http.HandleFunc("/version", versionHandler)
	http.HandleFunc("/config", configHandler)
	http.HandleFunc("/debug/request", debugRequestHandler)

	log.Printf("🚀 Flow Worklet Example Server starting")
	log.Printf("📍 Port: %s", port)
	log.Printf("🔧 Version: %s", version)
	log.Printf("🏗️  Build: %s", buildTime)
	if gitCommit != "" {
		log.Printf("📝 Commit: %s", gitCommit)
	}
	log.Printf("🌍 Environment: %s", getEnv("ENV", "development"))

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("❌ Server failed to start:", err)
	}
}

func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response recorder to capture status code
		recorder := &responseRecorder{ResponseWriter: w, statusCode: 200}

		next(recorder, r)

		duration := time.Since(start)
		log.Printf("📥 %s %s - %d - %v - %s",
			r.Method, r.URL.Path, recorder.statusCode, duration, r.RemoteAddr)
	}
}

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func handler(w http.ResponseWriter, r *http.Request) {
	hostname, _ := os.Hostname()
	println("hello")
	env := getEnv("ENV", "development")

	// Different responses based on environment
	if env == "development" {
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `
<!DOCTYPE html>
<html>
<head>
    <title>Flow Worklet - Development</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .info { margin: 20px 0; }
        .label { font-weight: bold; color: #34495e; }
        .value { color: #27ae60; }
        .dev-badge { background: #e74c3c; color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; }
        .endpoints { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .endpoint { margin: 5px 0; }
        .endpoint a { color: #3498db; text-decoration: none; }
        .endpoint a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">🚀 LIVE RELOAD TEST Flow Worklet Example <span class="dev-badge">DEV</span></h1>
        
        <div class="info">
            <div><span class="label">Hostname:</span> <span class="value">%s</span></div>
            <div><span class="label">Version:</span> <span class="value">%s</span></div>
            <div><span class="label">Build Time:</span> <span class="value">%s</span></div>
            <div><span class="label">Uptime:</span> <span class="value">%s</span></div>
            <div><span class="label">Request Path:</span> <span class="value">%s</span></div>
            <div><span class="label">Environment:</span> <span class="value">%s</span></div>
        </div>
        
        <div class="endpoints">
            <h3>🔧 Development Endpoints:</h3>
            <div class="endpoint">🏥 <a href="/health">Health Check</a></div>
            <div class="endpoint">📊 <a href="/status">Full Status</a></div>
            <div class="endpoint">📋 <a href="/version">Version Info</a></div>
            <div class="endpoint">⚙️ <a href="/config">Configuration</a></div>
            <div class="endpoint">🐛 <a href="/debug/request">Debug Request</a></div>
        </div>
        
        <p><em>This is a development build with enhanced debugging features.</em></p>
    </div>
</body>
</html>`, hostname, version, buildTime, time.Since(startTime).Round(time.Second), r.URL.Path, env)
	} else {
		// Production response - minimal
		fmt.Fprintf(w, "Hello from Flow Worklet!\n")
		fmt.Fprintf(w, "Hostname: %s\n", hostname)
		fmt.Fprintf(w, "Version: %s\n", version)
		fmt.Fprintf(w, "Path: %s\n", r.URL.Path)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"uptime":    time.Since(startTime).Round(time.Second).String(),
	}

	json.NewEncoder(w).Encode(health)
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	hostname, _ := os.Hostname()
	w.Header().Set("Content-Type", "application/json")

	status := Status{
		Status:    "running",
		Version:   version,
		BuildTime: buildTime,
		GitCommit: gitCommit,
		Uptime:    time.Since(startTime).Round(time.Second).String(),
		Hostname:  hostname,
		GoVersion: runtime.Version(),
		Platform:  fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
	}

	// Include environment variables in development
	if getEnv("ENV", "development") == "development" {
		status.Env = map[string]string{
			"PORT":       getEnv("PORT", "8080"),
			"ENV":        getEnv("ENV", "development"),
			"GIT_COMMIT": gitCommit,
			"DEBUG_MODE": getEnv("DEBUG_MODE", "false"),
		}
	}

	json.NewEncoder(w).Encode(status)
}

func versionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	versionInfo := map[string]string{
		"version":    version,
		"build_time": buildTime,
		"git_commit": gitCommit,
		"go_version": runtime.Version(),
	}

	json.NewEncoder(w).Encode(versionInfo)
}

func configHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	config := map[string]interface{}{
		"port":        getEnv("PORT", "8080"),
		"environment": getEnv("ENV", "development"),
		"debug_mode":  getEnv("DEBUG_MODE", "false") == "true",
		"log_level":   getEnv("LOG_LEVEL", "info"),
	}

	json.NewEncoder(w).Encode(config)
}

func debugRequestHandler(w http.ResponseWriter, r *http.Request) {
	hostname, _ := os.Hostname()
	w.Header().Set("Content-Type", "application/json")

	requestInfo := RequestInfo{
		Method:    r.Method,
		URL:       r.URL.String(),
		Headers:   r.Header,
		RemoteIP:  r.RemoteAddr,
		UserAgent: r.UserAgent(),
		Hostname:  hostname,
		Timestamp: time.Now().Format(time.RFC3339),
	}

	json.NewEncoder(w).Encode(requestInfo)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
