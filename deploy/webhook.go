package deploy

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"io"
	"log/slog"
	"net/http"
	"strings"
)

// GitHubWebhookPayload represents the GitHub webhook payload
type GitHubWebhookPayload struct {
	Ref        string `json:"ref"`
	Repository struct {
		Name     string `json:"name"`
		FullName string `json:"full_name"`
		CloneURL string `json:"clone_url"`
	} `json:"repository"`
	HeadCommit struct {
		ID      string `json:"id"`
		Message string `json:"message"`
		Author  struct {
			Name  string `json:"name"`
			Email string `json:"email"`
		} `json:"author"`
	} `json:"head_commit"`
	Pusher struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	} `json:"pusher"`
}

// handleWebhook processes GitHub webhook requests
func (dm *DeploymentManager) handleWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if deployment is enabled
	if !dm.deps.Config.DeploymentEnabled() {
		slog.Warn("Webhook received but deployment is disabled")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Deployment disabled"}`))
		return
	}

	// Read the request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		slog.Error("Failed to read webhook body", "error", err)
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Validate webhook signature
	signature := r.Header.Get("X-Hub-Signature-256")
	if !dm.validateWebhookSignature(body, signature) {
		slog.Warn("Invalid webhook signature")
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	// Parse the webhook payload
	var payload GitHubWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		slog.Error("Failed to parse webhook payload", "error", err)
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	// Check if this is a push to master
	if payload.Ref != "refs/heads/master" && payload.Ref != "refs/heads/main" {
		slog.Info("Ignoring push to non-master branch", "ref", payload.Ref)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Ignoring non-master branch"}`))
		return
	}

	// Check if we're already deploying
	dm.mu.Lock()
	if dm.isDeploying {
		dm.mu.Unlock()
		slog.Warn("Deployment already in progress, ignoring webhook")
		w.WriteHeader(http.StatusConflict)
		w.Write([]byte(`{"message":"Deployment already in progress"}`))
		return
	}
	dm.isDeploying = true
	dm.mu.Unlock()

	slog.Info("Processing webhook deployment",
		"commit", payload.HeadCommit.ID,
		"author", payload.HeadCommit.Author.Name,
		"message", payload.HeadCommit.Message)

	// Start deployment in background
	go func() {
		defer func() {
			dm.mu.Lock()
			dm.isDeploying = false
			dm.mu.Unlock()
		}()

		// Use webhook user as deployment trigger (or system for webhook)
		userID := "webhook-" + payload.Pusher.Name
		if err := dm.performDeployment(payload.HeadCommit.ID, userID); err != nil {
			slog.Error("Deployment failed", "error", err, "commit", payload.HeadCommit.ID)
		}
	}()

	// Return success immediately
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Deployment started","commit":"` + payload.HeadCommit.ID + `"}`))
}

// validateWebhookSignature validates the GitHub webhook signature
func (dm *DeploymentManager) validateWebhookSignature(body []byte, signature string) bool {
	if dm.deps.Config.WebhookSecret() == "" {
		slog.Warn("No webhook secret configured, skipping signature validation")
		return true // Allow if no secret is configured (for development)
	}

	if signature == "" {
		return false
	}

	// GitHub sends signature as "sha256=<hex>"
	if !strings.HasPrefix(signature, "sha256=") {
		return false
	}

	expectedSignature := signature[7:] // Remove "sha256=" prefix

	// Calculate HMAC-SHA256
	mac := hmac.New(sha256.New, []byte(dm.deps.Config.WebhookSecret()))
	mac.Write(body)
	calculatedSignature := hex.EncodeToString(mac.Sum(nil))

	// Compare signatures using constant time comparison
	return hmac.Equal([]byte(expectedSignature), []byte(calculatedSignature))
}

// handleManualDeployRequest handles manual deployment requests from the UI
func (dm *DeploymentManager) handleManualDeployRequest(w http.ResponseWriter, r *http.Request) {
	// Get user ID from session
	userID, err := dm.deps.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if we're already deploying
	dm.mu.Lock()
	if dm.isDeploying {
		dm.mu.Unlock()
		w.Header().Set("HX-Target", "#deployment-result")
		Div(
			Class("alert alert-warning"),
			T("⚠️ Deployment already in progress"),
		).RenderPage(w, r)
		return
	}
	dm.isDeploying = true
	dm.mu.Unlock()

	// Start deployment in background
	go func() {
		defer func() {
			dm.mu.Lock()
			dm.isDeploying = false
			dm.mu.Unlock()
		}()

		// Get latest commit hash (we'll implement this in process.go)
		commitHash, err := dm.getLatestCommitHash()
		if err != nil {
			slog.Error("Failed to get latest commit", "error", err)
			return
		}

		if err := dm.performDeployment(commitHash, userID); err != nil {
			slog.Error("Manual deployment failed", "error", err, "user", userID)
		}
	}()

	// Return immediate response
	w.Header().Set("HX-Target", "#deployment-result")
	Div(
		Class("alert alert-info"),
		T("🚀 Deployment started! Check the dashboard for progress."),
	).RenderPage(w, r)
}

// handleLogs serves deployment logs
func (dm *DeploymentManager) handleLogs(w http.ResponseWriter, r *http.Request) {
	deploymentID := r.PathValue("id")
	if deploymentID == "" {
		http.Error(w, "Missing deployment ID", http.StatusBadRequest)
		return
	}

	var deployment models.Deployment
	if err := dm.deps.DB.First(&deployment, "id = ?", deploymentID).Error; err != nil {
		http.Error(w, "Deployment not found", http.StatusNotFound)
		return
	}

	// Return logs as plain text or HTML based on Accept header
	if strings.Contains(r.Header.Get("Accept"), "text/html") {
		DefaultLayout(
			Div(
				Class("container mx-auto p-6"),
				H1(Class("text-2xl font-bold mb-4"), T("Deployment Logs")),
				Div(Class("mb-4"),
					P(T("Deployment ID: "+deployment.ID)),
					P(T("Commit: "+deployment.CommitHash)),
					P(T("Status: "+deployment.Status)),
				),
				Pre(
					Class("bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96"),
					T(deployment.Logs),
				),
				A(Class("btn btn-primary mt-4"), Href("/deploy"), T("Back to Dashboard")),
			),
		).RenderPage(w, r)
	} else {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(deployment.Logs))
	}
}

// handleRollback handles rollback requests
func (dm *DeploymentManager) handleRollback(w http.ResponseWriter, r *http.Request) {
	deploymentID := r.PathValue("id")
	if deploymentID == "" {
		http.Error(w, "Missing deployment ID", http.StatusBadRequest)
		return
	}

	// Get user ID from session
	userID, err := dm.deps.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var targetDeployment models.Deployment
	if err := dm.deps.DB.First(&targetDeployment, "id = ?", deploymentID).Error; err != nil {
		http.Error(w, "Deployment not found", http.StatusNotFound)
		return
	}

	if targetDeployment.Status != string(StatusSuccess) {
		http.Error(w, "Can only rollback to successful deployments", http.StatusBadRequest)
		return
	}

	// Check if we're already deploying
	dm.mu.Lock()
	if dm.isDeploying {
		dm.mu.Unlock()
		http.Error(w, "Deployment already in progress", http.StatusConflict)
		return
	}
	dm.isDeploying = true
	dm.mu.Unlock()

	slog.Info("Starting rollback", "target_deployment", deploymentID, "commit", targetDeployment.CommitHash, "user", userID)

	// Start rollback in background
	go func() {
		defer func() {
			dm.mu.Lock()
			dm.isDeploying = false
			dm.mu.Unlock()
		}()

		if err := dm.performRollback(targetDeployment.CommitHash, userID, deploymentID); err != nil {
			slog.Error("Rollback failed", "error", err, "target_deployment", deploymentID)
		}
	}()

	// Return success response
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Rollback started","target_deployment":"` + deploymentID + `"}`))
}
