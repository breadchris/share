package worklet

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/breadchris/flow/deps"
	"github.com/gorilla/mux"
)

type WorkletHandler struct {
	manager *Manager
	deps    *deps.Deps
}

func NewWorkletHandler(deps *deps.Deps) *WorkletHandler {
	return &WorkletHandler{
		manager: NewManager(deps),
		deps:    deps,
	}
}

func (h *WorkletHandler) RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/worklets", h.CreateWorklet).Methods("POST")
	router.HandleFunc("/worklets", h.ListWorklets).Methods("GET")
	router.HandleFunc("/worklets/{id}", h.GetWorklet).Methods("GET")
	router.HandleFunc("/worklets/{id}", h.DeleteWorklet).Methods("DELETE")
	router.HandleFunc("/worklets/{id}/start", h.StartWorklet).Methods("POST")
	router.HandleFunc("/worklets/{id}/stop", h.StopWorklet).Methods("POST")
	router.HandleFunc("/worklets/{id}/restart", h.RestartWorklet).Methods("POST")
	router.HandleFunc("/worklets/{id}/prompt", h.ProcessPrompt).Methods("POST")
	router.HandleFunc("/worklets/{id}/pr", h.CreatePR).Methods("POST")
	router.HandleFunc("/worklets/{id}/proxy", h.ProxyToWorklet).Methods("GET", "POST", "PUT", "DELETE", "PATCH")
	router.HandleFunc("/worklets/{id}/proxy/{path:.*}", h.ProxyToWorklet).Methods("GET", "POST", "PUT", "DELETE", "PATCH")
	router.HandleFunc("/worklets/{id}/logs", h.GetLogs).Methods("GET")
	router.HandleFunc("/worklets/{id}/status", h.GetStatus).Methods("GET")
}

// New returns a *http.ServeMux with worklet routes following the main.go pattern
func New(deps *deps.Deps) *http.ServeMux {
	h := NewWorkletHandler(deps)
	m := http.NewServeMux()
	
	// Convert mux.Router patterns to http.ServeMux patterns
	m.HandleFunc("POST /worklets", h.CreateWorklet)
	m.HandleFunc("GET /worklets", h.ListWorklets)
	m.HandleFunc("GET /worklets/{id}", h.GetWorklet)
	m.HandleFunc("DELETE /worklets/{id}", h.DeleteWorklet)
	m.HandleFunc("POST /worklets/{id}/start", h.StartWorklet)
	m.HandleFunc("POST /worklets/{id}/stop", h.StopWorklet)
	m.HandleFunc("POST /worklets/{id}/restart", h.RestartWorklet)
	m.HandleFunc("POST /worklets/{id}/prompt", h.ProcessPrompt)
	m.HandleFunc("POST /worklets/{id}/pr", h.CreatePR)
	m.HandleFunc("/worklets/{id}/proxy", h.ProxyToWorklet)
	m.HandleFunc("/worklets/{id}/proxy/{path...}", h.ProxyToWorklet)
	m.HandleFunc("GET /worklets/{id}/logs", h.GetLogs)
	m.HandleFunc("GET /worklets/{id}/status", h.GetStatus)
	
	return m
}

func (h *WorkletHandler) CreateWorklet(w http.ResponseWriter, r *http.Request) {
	var req CreateWorkletRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}
	
	if req.GitRepo == "" {
		http.Error(w, "Git repository is required", http.StatusBadRequest)
		return
	}
	
	userID := h.getUserID(r)
	
	worklet, err := h.manager.CreateWorklet(r.Context(), req, userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create worklet: %v", err), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(worklet.ToResponse())
}

func (h *WorkletHandler) ListWorklets(w http.ResponseWriter, r *http.Request) {
	userID := h.getUserID(r)
	
	worklets, err := h.manager.ListWorklets(userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list worklets: %v", err), http.StatusInternalServerError)
		return
	}
	
	var responses []WorkletResponse
	for _, worklet := range worklets {
		responses = append(responses, worklet.ToResponse())
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responses)
}

func (h *WorkletHandler) GetWorklet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	worklet, err := h.manager.GetWorklet(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Worklet not found: %v", err), http.StatusNotFound)
		return
	}
	
	userID := h.getUserID(r)
	if worklet.UserID != userID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(worklet.ToResponse())
}

func (h *WorkletHandler) DeleteWorklet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	worklet, err := h.manager.GetWorklet(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Worklet not found: %v", err), http.StatusNotFound)
		return
	}
	
	userID := h.getUserID(r)
	if worklet.UserID != userID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	if err := h.manager.DeleteWorklet(id); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete worklet: %v", err), http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

func (h *WorkletHandler) StartWorklet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	if err := h.manager.RestartWorklet(r.Context(), id); err != nil {
		http.Error(w, fmt.Sprintf("Failed to start worklet: %v", err), http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "starting"})
}

func (h *WorkletHandler) StopWorklet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	if err := h.manager.StopWorklet(id); err != nil {
		http.Error(w, fmt.Sprintf("Failed to stop worklet: %v", err), http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "stopped"})
}

func (h *WorkletHandler) RestartWorklet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	if err := h.manager.RestartWorklet(r.Context(), id); err != nil {
		http.Error(w, fmt.Sprintf("Failed to restart worklet: %v", err), http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "restarting"})
}

func (h *WorkletHandler) ProcessPrompt(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	var req PromptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	if req.Prompt == "" {
		http.Error(w, "Prompt is required", http.StatusBadRequest)
		return
	}
	
	userID := h.getUserID(r)
	
	workletPrompt, err := h.manager.ProcessPrompt(r.Context(), id, req.Prompt, userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to process prompt: %v", err), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workletPrompt)
}

func (h *WorkletHandler) CreatePR(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		BranchName  string `json:"branch_name"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	if req.Title == "" {
		req.Title = fmt.Sprintf("Worklet changes from %s", id)
	}
	
	if req.BranchName == "" {
		req.BranchName = fmt.Sprintf("worklet-%s-%d", id, time.Now().Unix())
	}
	
	worklet, err := h.manager.GetWorklet(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Worklet not found: %v", err), http.StatusNotFound)
		return
	}
	
	userID := h.getUserID(r)
	if worklet.UserID != userID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	repoPath := h.manager.gitClient.GetRepoPath(worklet.GitRepo, worklet.Branch)
	
	if err := h.manager.claudeClient.CreatePR(r.Context(), repoPath, req.BranchName, req.Title, req.Description); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create PR: %v", err), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":      "created",
		"branch_name": req.BranchName,
		"title":       req.Title,
	})
}

func (h *WorkletHandler) ProxyToWorklet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	worklet, err := h.manager.GetWorklet(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Worklet not found: %v", err), http.StatusNotFound)
		return
	}
	
	if worklet.Status != StatusRunning {
		http.Error(w, fmt.Sprintf("Worklet is not running, status: %s", worklet.Status), http.StatusServiceUnavailable)
		return
	}
	
	h.manager.webServer.ServeWorklet(w, r, id)
}

func (h *WorkletHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	worklet, err := h.manager.GetWorklet(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Worklet not found: %v", err), http.StatusNotFound)
		return
	}
	
	userID := h.getUserID(r)
	if worklet.UserID != userID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	logs := map[string]string{
		"build_logs": worklet.BuildLogs,
		"last_error": worklet.LastError,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *WorkletHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	
	worklet, err := h.manager.GetWorklet(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Worklet not found: %v", err), http.StatusNotFound)
		return
	}
	
	userID := h.getUserID(r)
	if worklet.UserID != userID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	status := map[string]interface{}{
		"status":      worklet.Status,
		"created_at":  worklet.CreatedAt,
		"updated_at":  worklet.UpdatedAt,
		"web_url":     worklet.WebURL,
		"last_prompt": worklet.LastPrompt,
		"last_error":  worklet.LastError,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func (h *WorkletHandler) getUserID(r *http.Request) string {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		userID = "default-user"
	}
	return userID
}

func (h *WorkletHandler) validateWorkletAccess(r *http.Request, worklet *Worklet) error {
	userID := h.getUserID(r)
	if worklet.UserID != userID {
		return fmt.Errorf("unauthorized access to worklet")
	}
	return nil
}

func (h *WorkletHandler) parseIntParam(r *http.Request, param string, defaultValue int) int {
	value := r.URL.Query().Get(param)
	if value == "" {
		return defaultValue
	}
	
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	
	return intValue
}