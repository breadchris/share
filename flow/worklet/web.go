package worklet

import (
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"sync"
	"time"
)

type WebServer struct {
	proxies map[string]*httputil.ReverseProxy
	mu      sync.RWMutex
}

func NewWebServer() *WebServer {
	return &WebServer{
		proxies: make(map[string]*httputil.ReverseProxy),
	}
}

func (ws *WebServer) CreateProxy(workletID string, targetURL string) error {
	ws.mu.Lock()
	defer ws.mu.Unlock()
	
	target, err := url.Parse(targetURL)
	if err != nil {
		return fmt.Errorf("invalid target URL: %w", err)
	}
	
	proxy := httputil.NewSingleHostReverseProxy(target)
	
	proxy.ModifyResponse = func(r *http.Response) error {
		r.Header.Set("X-Worklet-ID", workletID)
		r.Header.Set("X-Worklet-Proxy", "true")
		return nil
	}
	
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		slog.Error("Proxy error", "error", err, "workletID", workletID)
		http.Error(w, fmt.Sprintf("Worklet proxy error: %v", err), http.StatusBadGateway)
	}
	
	ws.proxies[workletID] = proxy
	
	return nil
}

func (ws *WebServer) GetProxy(workletID string) (*httputil.ReverseProxy, bool) {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	
	proxy, exists := ws.proxies[workletID]
	return proxy, exists
}

func (ws *WebServer) RemoveProxy(workletID string) {
	ws.mu.Lock()
	defer ws.mu.Unlock()
	
	delete(ws.proxies, workletID)
}

func (ws *WebServer) ServeWorklet(w http.ResponseWriter, r *http.Request, workletID string) {
	proxy, exists := ws.GetProxy(workletID)
	if !exists {
		http.Error(w, "Worklet not found or not running", http.StatusNotFound)
		return
	}
	
	if !ws.isWorkletHealthy(workletID) {
		http.Error(w, "Worklet is not healthy", http.StatusServiceUnavailable)
		return
	}
	
	proxy.ServeHTTP(w, r)
}

func (ws *WebServer) isWorkletHealthy(workletID string) bool {
	return true
}

func (ws *WebServer) CreateWorkletHandler(workletID string, targetPort int) http.HandlerFunc {
	targetURL := fmt.Sprintf("http://localhost:%d", targetPort)
	
	if err := ws.CreateProxy(workletID, targetURL); err != nil {
		slog.Error("Failed to create proxy", "error", err, "workletID", workletID)
		return func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Failed to create proxy", http.StatusInternalServerError)
		}
	}
	
	return func(w http.ResponseWriter, r *http.Request) {
		ws.ServeWorklet(w, r, workletID)
	}
}

func (ws *WebServer) CreateWorkletPreviewHandler(workletID string, repoPath string) http.HandlerFunc {
	fileServer := http.FileServer(http.Dir(repoPath))
	
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Worklet-ID", workletID)
		w.Header().Set("X-Worklet-Preview", "true")
		
		if r.URL.Path == "/" {
			indexPath := "/index.html"
			if ws.fileExists(repoPath + indexPath) {
				r.URL.Path = indexPath
			}
		}
		
		fileServer.ServeHTTP(w, r)
	}
}

func (ws *WebServer) fileExists(path string) bool {
	return false
}

func (ws *WebServer) HealthCheck(workletID string, targetURL string) error {
	client := &http.Client{
		Timeout: 5 * time.Second,
	}
	
	resp, err := client.Get(targetURL)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode >= 400 {
		return fmt.Errorf("health check failed with status: %d", resp.StatusCode)
	}
	
	return nil
}

func (ws *WebServer) GetWorkletStats(workletID string) map[string]interface{} {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	
	stats := map[string]interface{}{
		"proxy_exists": false,
		"last_check":   time.Now(),
	}
	
	if _, exists := ws.proxies[workletID]; exists {
		stats["proxy_exists"] = true
	}
	
	return stats
}

func (ws *WebServer) ListActiveProxies() []string {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	
	var workletIDs []string
	for workletID := range ws.proxies {
		workletIDs = append(workletIDs, workletID)
	}
	
	return workletIDs
}

func (ws *WebServer) CleanupInactiveProxies(activeWorkletIDs []string) {
	ws.mu.Lock()
	defer ws.mu.Unlock()
	
	activeSet := make(map[string]bool)
	for _, id := range activeWorkletIDs {
		activeSet[id] = true
	}
	
	for workletID := range ws.proxies {
		if !activeSet[workletID] {
			delete(ws.proxies, workletID)
			slog.Info("Removed inactive proxy", "workletID", workletID)
		}
	}
}