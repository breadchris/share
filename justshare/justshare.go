package justshare

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/breadchris/share/coderunner"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreateContentRequest struct {
	Type            string                 `json:"type"` // text, image, audio, clipboard, url
	Data            string                 `json:"data"` // Text content or base64 for files
	GroupID         string                 `json:"group_id"`
	ParentContentID *string                `json:"parent_content_id,omitempty"` // For threading - nullable
	Tags            []string               `json:"tags,omitempty"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
}

type CreateGroupRequest struct {
	Name string `json:"name"`
}

type JoinGroupRequest struct {
	JoinCode string `json:"join_code"`
}

type ContentResponse struct {
	Content  *models.Content `json:"Content"`
	TagNames []string        `json:"tag_names,omitempty"`
	UserInfo *models.User    `json:"user_info,omitempty"`
}

type TimelineResponse struct {
	Content    []*ContentResponse `json:"content"`
	NextOffset int                `json:"next_offset"`
	HasMore    bool               `json:"has_more"`
}

type GroupMemberResponse struct {
	ID        string       `json:"id"`
	UserID    string       `json:"user_id"`
	GroupID   string       `json:"group_id"`
	Role      string       `json:"role"`
	CreatedAt time.Time    `json:"created_at"`
	User      *models.User `json:"user,omitempty"`
}

type GroupSettingsResponse struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	JoinCode  string                 `json:"join_code"`
	CreatedAt time.Time              `json:"created_at"`
	Members   []*GroupMemberResponse `json:"members"`
	UserRole  string                 `json:"user_role"`
}

type CreateAPIKeyRequest struct {
	Name   string   `json:"name"`
	Scopes []string `json:"scopes,omitempty"`
}

type APIKeyResponse struct {
	*models.ApiKey
	Token string `json:"token,omitempty"` // Only included in create response
}

// Context keys for storing user information
const (
	UserContextKey   = "user_id"
	APIKeyContextKey = "api_key"
)

// authenticateUser tries session first, then API key authentication
func authenticateUser(r *http.Request, d deps.Deps) (string, *models.ApiKey, error) {
	// First try session authentication
	if userID, err := d.Session.GetUserID(r.Context()); err == nil {
		return userID, nil, nil
	}

	// Try API key authentication
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", nil, fmt.Errorf("no authentication provided")
	}

	// Check for Bearer token format
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", nil, fmt.Errorf("invalid authorization header format")
	}

	token := parts[1]
	if !strings.HasPrefix(token, "ak_") {
		return "", nil, fmt.Errorf("invalid API key format")
	}

	// Validate the API key
	var apiKey models.ApiKey
	tokenHash := models.HashToken(token)
	err := d.DB.Where("token_hash = ? AND is_active = ?", tokenHash, true).First(&apiKey).Error
	if err != nil {
		return "", nil, fmt.Errorf("invalid or expired API key")
	}

	// Check expiration
	if apiKey.ExpiresAt != nil && apiKey.ExpiresAt.Before(time.Now()) {
		return "", nil, fmt.Errorf("API key has expired")
	}

	// Update last used timestamp
	apiKey.UpdateLastUsed()
	d.DB.Save(&apiKey)

	return apiKey.UserID, &apiKey, nil
}

// requireAuth middleware that supports both session and API key authentication
func requireAuth(d deps.Deps, handler func(http.ResponseWriter, *http.Request, deps.Deps)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, apiKey, err := authenticateUser(r, d)
		if err != nil {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		// Add user and API key info to context
		ctx := context.WithValue(r.Context(), UserContextKey, userID)
		if apiKey != nil {
			ctx = context.WithValue(ctx, APIKeyContextKey, apiKey)
		}
		r = r.WithContext(ctx)

		handler(w, r, d)
	}
}

// getUserID extracts user ID from context (works for both auth methods)
func getUserID(ctx context.Context) (string, error) {
	userID, ok := ctx.Value(UserContextKey).(string)
	if !ok || userID == "" {
		return "", fmt.Errorf("user not authenticated")
	}
	return userID, nil
}

// getAPIKey extracts API key from context (only for API key auth)
func getAPIKey(ctx context.Context) *models.ApiKey {
	apiKey, _ := ctx.Value(APIKeyContextKey).(*models.ApiKey)
	return apiKey
}

// checkAPIKeyScope verifies API key has required scope
func checkAPIKeyScope(ctx context.Context, requiredScope string) error {
	apiKey := getAPIKey(ctx)
	if apiKey == nil {
		// Session auth - allow all operations
		return nil
	}

	if !apiKey.HasScope(requiredScope) {
		return fmt.Errorf("insufficient permissions")
	}

	return nil
}

func New(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	// Main JustShare page
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		coderunner.ServeFullRenderComponent(w, r, "justshare/JustShare.tsx", "JustShare")
	})

	// Content endpoints
	m.HandleFunc("/api/content", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "POST":
			requireAuth(d, handleCreateContent)(w, r)
		case "GET":
			requireAuth(d, handleGetTimeline)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/api/content/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			requireAuth(d, handleGetContent)(w, r)
		case "DELETE":
			requireAuth(d, handleDeleteContent)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Thread replies endpoint
	m.HandleFunc("/api/content/{id}/replies", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			requireAuth(d, handleGetContentReplies)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Group endpoints
	m.HandleFunc("/api/groups", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "POST":
			requireAuth(d, handleCreateGroup)(w, r)
		case "GET":
			requireAuth(d, handleGetUserGroups)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Default group endpoint for mobile apps
	m.HandleFunc("/api/groups/default", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			requireAuth(d, handleGetDefaultGroup)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/api/groups/join", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			handleJoinGroup(w, r, d)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Group management endpoints
	m.HandleFunc("/api/groups/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/groups/")
		pathParts := strings.Split(path, "/")

		if len(pathParts) < 1 || pathParts[0] == "" {
			http.Error(w, "Group ID required", http.StatusBadRequest)
			return
		}

		groupID := pathParts[0]

		if len(pathParts) == 1 {
			// /api/groups/{groupID}
			switch r.Method {
			case "GET":
				handleGetGroupSettings(w, r, d, groupID)
			case "DELETE":
				handleDeleteGroup(w, r, d, groupID)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		} else if len(pathParts) == 2 && pathParts[1] == "members" {
			// /api/groups/{groupID}/members
			if r.Method == "GET" {
				handleGetGroupMembers(w, r, d, groupID)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		} else {
			http.Error(w, "Invalid endpoint", http.StatusNotFound)
		}
	})

	// QR Code join endpoint - redirects to the app with join code
	m.HandleFunc("/api/join", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			handleQRCodeJoin(w, r, d)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Tag endpoints
	m.HandleFunc("/api/tags/search", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			handleSearchTags(w, r, d)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// File manager endpoints
	m.HandleFunc("/api/files", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			requireAuth(d, handleGetFiles)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/api/files/folder", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			requireAuth(d, handleCreateFolder)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/api/files/move", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "PUT" {
			requireAuth(d, handleMoveFile)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/api/files/tree", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			requireAuth(d, handleGetFileTree)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// File upload endpoint for media content
	m.HandleFunc("/api/upload", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			handleFileUpload(w, r, d)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Authentication endpoints
	m.HandleFunc("/api/auth/user", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			handleAPIUser(w, r, d)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/api/auth/logout", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			handleAPILogout(w, r, d)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// API Key management endpoints
	m.HandleFunc("/api/auth/keys", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "POST":
			handleCreateAPIKey(w, r, d)
		case "GET":
			handleListAPIKeys(w, r, d)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/api/auth/keys/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/auth/keys/")
		keyID := strings.Split(path, "/")[0]

		if keyID == "" {
			http.Error(w, "API key ID required", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case "DELETE":
			handleRevokeAPIKey(w, r, d, keyID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	return m
}

func handleCreateContent(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := getUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if API key has write permissions
	if err := checkAPIKeyScope(r.Context(), "write"); err != nil {
		http.Error(w, `{"error":"insufficient permissions"}`, http.StatusForbidden)
		return
	}

	var req CreateContentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}

	if req.Type == "" || req.GroupID == "" {
		http.Error(w, `{"error":"type and group_id are required"}`, http.StatusBadRequest)
		return
	}

	// Validate content type
	validTypes := map[string]bool{
		"text":      true,
		"image":     true,
		"audio":     true,
		"clipboard": true,
		"url":       true,
		"file":      true,
		"document":  true,
	}
	if !validTypes[req.Type] {
		http.Error(w, `{"error":"invalid content type"}`, http.StatusBadRequest)
		return
	}

	// Verify user has access to the group
	_, err = checkGroupMembership(d.DB, userID, req.GroupID)
	if err != nil {
		http.Error(w, `{"error":"not a member of this group"}`, http.StatusForbidden)
		return
	}

	var content *models.Content

	// If this is a reply, validate parent content and create reply
	if req.ParentContentID != nil && *req.ParentContentID != "" {
		// Verify parent content exists and belongs to the same group
		var parentContent models.Content
		if err := d.DB.First(&parentContent, "id = ? AND group_id = ?", *req.ParentContentID, req.GroupID).Error; err != nil {
			http.Error(w, `{"error":"parent content not found or not in the same group"}`, http.StatusBadRequest)
			return
		}

		// Create reply content
		content = models.NewContentReply(req.Type, req.Data, req.GroupID, userID, *req.ParentContentID, req.Metadata)
	} else {
		// Create regular content
		content = models.NewContent(req.Type, req.Data, req.GroupID, userID, req.Metadata)
	}

	// Create the content in a transaction to handle reply count updates
	err = d.DB.Transaction(func(tx *gorm.DB) error {
		// Create the content
		if err := tx.Create(content).Error; err != nil {
			return err
		}

		// If this is a reply, increment the parent's reply count
		if req.ParentContentID != nil && *req.ParentContentID != "" {
			if err := tx.Model(&models.Content{}).Where("id = ?", *req.ParentContentID).UpdateColumn("reply_count", gorm.Expr("reply_count + ?", 1)).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to create content: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Handle tags if provided
	if len(req.Tags) > 0 {
		for _, tagName := range req.Tags {
			if strings.TrimSpace(tagName) == "" {
				continue
			}

			// Find or create tag
			var tag models.Tag
			err := d.DB.Where("name = ? AND user_id = ?", tagName, userID).First(&tag).Error
			if err != nil {
				// Create new tag
				tag = models.Tag{
					Model: models.Model{
						ID:        uuid.NewString(),
						CreatedAt: time.Now(),
						UpdatedAt: time.Now(),
					},
					Name:   tagName,
					UserID: userID,
				}
				if err := d.DB.Create(&tag).Error; err != nil {
					continue // Skip this tag if creation fails
				}
			}

			// Create content-tag association
			contentTag := models.ContentTag{
				ContentID: content.ID,
				TagID:     tag.ID,
				CreatedAt: time.Now(),
			}
			d.DB.Create(&contentTag)
		}
	}

	// Load content with tags and user for response
	d.DB.Preload("Tags").Preload("User").First(content, "id = ?", content.ID)

	// Check if content contains YouTube URL and process transcript asynchronously
	if shouldProcessYouTubeTranscript(content) {
		go processYouTubeTranscript(d, content)
	}

	// Create response with flattened structure to match frontend expectations
	var tagNames []string
	for _, tag := range content.Tags {
		tagNames = append(tagNames, tag.Name)
	}

	// Create a map that combines content fields with additional fields
	response := map[string]interface{}{
		"id":         content.ID,
		"type":       content.Type,
		"data":       content.Data,
		"group_id":   content.GroupID,
		"user_id":    content.UserID,
		"media_url":  content.MediaURL,
		"mime_type":  content.MimeType,
		"metadata":   content.Metadata,
		"created_at": content.CreatedAt,
		"updated_at": content.UpdatedAt,
		"tag_names":  tagNames,
		"user_info":  content.User,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleGetTimeline(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := getUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if API key has read permissions
	if err := checkAPIKeyScope(r.Context(), "read"); err != nil {
		http.Error(w, `{"error":"insufficient permissions"}`, http.StatusForbidden)
		return
	}

	groupID := r.URL.Query().Get("group_id")
	offsetStr := r.URL.Query().Get("offset")
	limitStr := r.URL.Query().Get("limit")
	includeReplies := r.URL.Query().Get("include_replies") == "true"

	if groupID == "" {
		http.Error(w, `{"error":"group_id is required"}`, http.StatusBadRequest)
		return
	}

	// Verify user has access to this group
	_, err = checkGroupMembership(d.DB, userID, groupID)
	if err != nil {
		http.Error(w, `{"error":"not a member of this group"}`, http.StatusForbidden)
		return
	}

	offset, _ := strconv.Atoi(offsetStr)
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 20 // Default limit
	}

	var contents []*models.Content
	query := d.DB.Where("group_id = ?", groupID)

	// By default, exclude replies from the main timeline
	if !includeReplies {
		query = query.Where("parent_content_id IS NULL")
	}

	query = query.Preload("Tags").
		Preload("User").
		Order("created_at DESC").
		Limit(limit + 1). // Get one extra to check if there are more
		Offset(offset)

	if err := query.Find(&contents).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to fetch timeline: %v"}`, err), http.StatusInternalServerError)
		return
	}

	hasMore := len(contents) > limit
	if hasMore {
		contents = contents[:limit] // Remove the extra item
	}

	// Convert to response format
	var contentResponses []*ContentResponse
	for _, content := range contents {
		response := &ContentResponse{
			Content:  content,
			UserInfo: content.User,
		}
		for _, tag := range content.Tags {
			response.TagNames = append(response.TagNames, tag.Name)
		}
		contentResponses = append(contentResponses, response)
	}

	timelineResponse := TimelineResponse{
		Content:    contentResponses,
		NextOffset: offset + limit,
		HasMore:    hasMore,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(timelineResponse)
}

func handleGetContent(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := getUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if API key has read permissions
	if err := checkAPIKeyScope(r.Context(), "read"); err != nil {
		http.Error(w, `{"error":"insufficient permissions"}`, http.StatusForbidden)
		return
	}

	// Extract content ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/content/")
	contentID := strings.Split(path, "/")[0]

	if contentID == "" {
		http.Error(w, `{"error":"content ID is required"}`, http.StatusBadRequest)
		return
	}

	var content models.Content
	if err := d.DB.Preload("Tags").Preload("User").First(&content, "id = ?", contentID).Error; err != nil {
		http.Error(w, `{"error":"content not found"}`, http.StatusNotFound)
		return
	}

	// Verify user has access to this content's group
	_, err = checkGroupMembership(d.DB, userID, content.GroupID)
	if err != nil {
		http.Error(w, `{"error":"access denied"}`, http.StatusForbidden)
		return
	}

	// Create response
	response := &ContentResponse{
		Content:  &content,
		UserInfo: content.User,
	}
	for _, tag := range content.Tags {
		response.TagNames = append(response.TagNames, tag.Name)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleDeleteContent(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := getUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if API key has write permissions
	if err := checkAPIKeyScope(r.Context(), "write"); err != nil {
		http.Error(w, `{"error":"insufficient permissions"}`, http.StatusForbidden)
		return
	}

	// Extract content ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/content/")
	contentID := strings.Split(path, "/")[0]

	if contentID == "" {
		http.Error(w, `{"error":"content ID is required"}`, http.StatusBadRequest)
		return
	}

	// Check if content exists and belongs to user
	var content models.Content
	if err := d.DB.First(&content, "id = ? AND user_id = ?", contentID, userID).Error; err != nil {
		http.Error(w, `{"error":"content not found or access denied"}`, http.StatusNotFound)
		return
	}

	// Delete associated content-tag relationships first
	if err := d.DB.Where("content_id = ?", contentID).Delete(&models.ContentTag{}).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to delete content tags: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Delete the content
	if err := d.DB.Delete(&content).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to delete content: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Optional: Clean up associated media files
	if content.MediaURL != "" {
		// Extract file path from URL and attempt to delete file
		if strings.HasPrefix(content.MediaURL, "/data/uploads/") {
			filePath := strings.TrimPrefix(content.MediaURL, "/")
			if err := os.Remove(filePath); err != nil {
				// Log but don't fail the request if file deletion fails
				fmt.Printf("Warning: failed to delete media file %s: %v\n", filePath, err)
			}
		}
	}

	response := map[string]interface{}{
		"success": true,
		"message": "Content deleted successfully",
		"id":      contentID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleGetContentReplies(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := getUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if API key has read permissions
	if err := checkAPIKeyScope(r.Context(), "read"); err != nil {
		http.Error(w, `{"error":"insufficient permissions"}`, http.StatusForbidden)
		return
	}

	// Extract content ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/content/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 || parts[1] != "replies" {
		http.Error(w, `{"error":"invalid URL format"}`, http.StatusBadRequest)
		return
	}
	contentID := parts[0]

	if contentID == "" {
		http.Error(w, `{"error":"content ID is required"}`, http.StatusBadRequest)
		return
	}

	// Verify the parent content exists and user has access
	var parentContent models.Content
	if err := d.DB.First(&parentContent, "id = ?", contentID).Error; err != nil {
		http.Error(w, `{"error":"content not found"}`, http.StatusNotFound)
		return
	}

	// Verify user has access to this content's group
	_, err = checkGroupMembership(d.DB, userID, parentContent.GroupID)
	if err != nil {
		http.Error(w, `{"error":"access denied"}`, http.StatusForbidden)
		return
	}

	// Parse pagination parameters
	offsetStr := r.URL.Query().Get("offset")
	limitStr := r.URL.Query().Get("limit")
	offset, _ := strconv.Atoi(offsetStr)
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 20 // Default limit
	}

	// Query replies
	var replies []*models.Content
	query := d.DB.Where("parent_content_id = ?", contentID).
		Preload("Tags").
		Preload("User").
		Order("created_at ASC"). // Replies in chronological order
		Limit(limit + 1).        // Get one extra to check if there are more
		Offset(offset)

	if err := query.Find(&replies).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to fetch replies: %v"}`, err), http.StatusInternalServerError)
		return
	}

	hasMore := len(replies) > limit
	if hasMore {
		replies = replies[:limit]
	}

	// Convert to response format
	var responses []*ContentResponse
	for _, reply := range replies {
		response := &ContentResponse{
			Content:  reply,
			UserInfo: reply.User,
		}
		for _, tag := range reply.Tags {
			response.TagNames = append(response.TagNames, tag.Name)
		}
		responses = append(responses, response)
	}

	// Create timeline-style response
	timelineResponse := &TimelineResponse{
		Content:    responses,
		NextOffset: offset + len(responses),
		HasMore:    hasMore,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(timelineResponse)
}

func handleGetDefaultGroup(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := getUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if API key has read permissions
	if err := checkAPIKeyScope(r.Context(), "read"); err != nil {
		http.Error(w, `{"error":"insufficient permissions"}`, http.StatusForbidden)
		return
	}

	// Find the user's personal group (first group where they are admin)
	var membership models.GroupMembership
	err = d.DB.Where("user_id = ? AND role = ?", userID, "admin").
		Preload("Group").
		Order("created_at ASC").
		First(&membership).Error

	if err != nil {
		// If no personal group exists, create one
		personalGroup := &models.Group{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			Name:      "Personal",
			JoinCode:  generateJoinCode(),
		}

		if err := d.DB.Create(personalGroup).Error; err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"failed to create personal group: %v"}`, err), http.StatusInternalServerError)
			return
		}

		// Add user as admin member
		newMembership := &models.GroupMembership{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			UserID:    userID,
			GroupID:   personalGroup.ID,
			Role:      "admin",
		}

		if err := d.DB.Create(newMembership).Error; err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"failed to create membership: %v"}`, err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(personalGroup)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(membership.Group)
}

func handleCreateGroup(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := getUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if API key has write permissions
	if err := checkAPIKeyScope(r.Context(), "write"); err != nil {
		http.Error(w, `{"error":"insufficient permissions"}`, http.StatusForbidden)
		return
	}

	var req CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, `{"error":"name is required"}`, http.StatusBadRequest)
		return
	}

	// Generate unique join code
	joinCode := generateJoinCode()

	group := &models.Group{
		ID:        uuid.NewString(),
		CreatedAt: time.Now(),
		Name:      req.Name,
		JoinCode:  joinCode,
	}

	if err := d.DB.Create(group).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to create group: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Add creator as member
	membership := &models.GroupMembership{
		ID:        uuid.NewString(),
		CreatedAt: time.Now(),
		UserID:    userID,
		GroupID:   group.ID,
		Role:      "admin",
	}

	if err := d.DB.Create(membership).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to create membership: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(group)
}

func handleJoinGroup(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req JoinGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}

	if req.JoinCode == "" {
		http.Error(w, `{"error":"join_code is required"}`, http.StatusBadRequest)
		return
	}

	// Find group by join code
	var group models.Group
	if err := d.DB.First(&group, "join_code = ?", req.JoinCode).Error; err != nil {
		http.Error(w, `{"error":"invalid join code"}`, http.StatusNotFound)
		return
	}

	// Check if user is already a member
	var existingMembership models.GroupMembership
	err = d.DB.First(&existingMembership, "user_id = ? AND group_id = ?", userID, group.ID).Error
	if err == nil {
		http.Error(w, `{"error":"already a member of this group"}`, http.StatusConflict)
		return
	}

	// Create membership
	membership := &models.GroupMembership{
		ID:        uuid.NewString(),
		CreatedAt: time.Now(),
		UserID:    userID,
		GroupID:   group.ID,
		Role:      "member",
	}

	if err := d.DB.Create(membership).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to join group: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(group)
}

func handleGetUserGroups(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := getUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if API key has read permissions
	if err := checkAPIKeyScope(r.Context(), "read"); err != nil {
		http.Error(w, `{"error":"insufficient permissions"}`, http.StatusForbidden)
		return
	}

	var groups []*models.Group
	query := d.DB.Joins("JOIN group_memberships ON groups.id = group_memberships.group_id").
		Where("group_memberships.user_id = ?", userID).
		Order("groups.created_at DESC")

	if err := query.Find(&groups).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to fetch groups: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// If user has no groups, create a default personal group
	if len(groups) == 0 {
		personalGroup := &models.Group{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			Name:      "Personal",
			JoinCode:  generateJoinCode(),
		}

		if err := d.DB.Create(personalGroup).Error; err == nil {
			// Add user as member
			membership := &models.GroupMembership{
				ID:        uuid.NewString(),
				CreatedAt: time.Now(),
				UserID:    userID,
				GroupID:   personalGroup.ID,
				Role:      "admin",
			}

			if err := d.DB.Create(membership).Error; err == nil {
				groups = append(groups, personalGroup)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

func handleSearchTags(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		// Return recent tags if no query
		var tags []*models.Tag
		if err := d.DB.Where("user_id = ?", userID).Order("updated_at DESC").Limit(10).Find(&tags).Error; err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"failed to fetch tags: %v"}`, err), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tags)
		return
	}

	var tags []*models.Tag
	searchQuery := "%" + strings.ToLower(query) + "%"
	if err := d.DB.Where("user_id = ? AND LOWER(name) LIKE ?", userID, searchQuery).Order("name").Limit(20).Find(&tags).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to search tags: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func handleFileUpload(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	// Parse multipart form with 10MB limit like main.go
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, `{"error":"failed to parse form"}`, http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"error":"no file provided"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Check file size limit (10MB like main.go)
	if header.Size > 10*1024*1024 {
		http.Error(w, `{"error":"File is too large, must be < 10MB"}`, http.StatusBadRequest)
		return
	}

	// Get file extension
	ext := filepath.Ext(header.Filename)

	// Generate unique filename following main.go pattern
	filename := uuid.NewString() + ext
	uploadDir := "data/uploads"
	uploadPath := filepath.Join(uploadDir, filename)

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to create upload directory: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Create the file
	dst, err := os.Create(uploadPath)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to create file: %v"}`, err), http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to save file: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Handle .mov to .mp4 conversion like main.go
	finalPath := uploadPath
	if ext == ".mov" {
		outputFile := filepath.Join(uploadDir, uuid.NewString()+".mp4")
		if err := convertMovToMp4(uploadPath, outputFile); err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"failed to convert video: %v"}`, err), http.StatusInternalServerError)
			return
		}
		if err = os.Remove(uploadPath); err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"failed to remove temp file: %v"}`, err), http.StatusInternalServerError)
			return
		}
		finalPath = outputFile
		filename = filepath.Base(outputFile)
	}

	// Return file info matching the expected response format
	response := map[string]interface{}{
		"filename":  filename,
		"url":       "/" + finalPath, // Absolute URL path like main.go
		"mime_type": header.Header.Get("Content-Type"),
		"size":      header.Size,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Video conversion function (matching main.go)
func convertMovToMp4(inputFile, outputFile string) error {
	// This would need the ffmpeg command like in main.go
	// For now, just copy the file since ffmpeg might not be available
	input, err := os.Open(inputFile)
	if err != nil {
		return err
	}
	defer input.Close()

	output, err := os.Create(outputFile)
	if err != nil {
		return err
	}
	defer output.Close()

	_, err = io.Copy(output, input)
	return err
}

func generateJoinCode() string {
	// Generate a 6-character alphanumeric code
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	code := make([]byte, 6)
	for i := range code {
		code[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(code)
}

func handleQRCodeJoin(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	joinCode := r.URL.Query().Get("code")
	if joinCode == "" {
		http.Error(w, "Join code is required", http.StatusBadRequest)
		return
	}

	// Validate that the join code exists
	var group models.Group
	if err := d.DB.First(&group, "join_code = ?", joinCode).Error; err != nil {
		http.Error(w, "Invalid join code", http.StatusNotFound)
		return
	}

	// Create HTML page that redirects to the main app with join code pre-filled
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join Group - %s</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 100%%;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        h1 {
            color: #1f2937;
            margin: 0 0 8px 0;
            font-size: 24px;
        }
        .group-name {
            color: #6b7280;
            margin: 0 0 24px 0;
            font-size: 16px;
        }
        .join-code {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 12px;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 18px;
            letter-spacing: 2px;
            margin: 16px 0;
            color: #374151;
        }
        .button {
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s;
            margin: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            min-width: 200px;
        }
        .button:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .button.secondary {
            background: #6b7280;
        }
        .button.secondary:hover {
            background: #4b5563;
        }
        .instructions {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            text-align: left;
            font-size: 14px;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">👥</div>
        <h1>Join Group</h1>
        <p class="group-name">%s</p>
        
        <div class="instructions">
            <strong>You've been invited to join this group!</strong><br>
            Click the button below to open JustShare and automatically join.
        </div>
        
        <div class="join-code">%s</div>
        
        <a href="/justshare/?join=%s" class="button">
            Open JustShare & Join
        </a>
        
        <br>
        
        <a href="/justshare/" class="button secondary">
            Open JustShare
        </a>
        
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            If you don't have the app, you can manually enter the join code above.
        </p>
    </div>
</body>
</html>`, group.Name, group.Name, joinCode, joinCode)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(html))
}

func handleAPILogout(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	d.Session.ClearUserID(r.Context())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success": true, "message": "Logged out successfully"}`))
}

func handleAPIUser(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error": "unauthorized"}`))
		return
	}

	var user models.User
	if err := d.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"error": "user not found"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	// Create user response matching frontend expectations
	response := map[string]interface{}{
		"id":         user.ID,
		"username":   user.Username,
		"email":      user.Username, // In this app, username is the email
		"created_at": user.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
	}

	json.NewEncoder(w).Encode(response)
}

// checkGroupMembership verifies user is a member and returns their role
func checkGroupMembership(db *gorm.DB, userID, groupID string) (string, error) {
	var membership models.GroupMembership
	err := db.Where("user_id = ? AND group_id = ?", userID, groupID).First(&membership).Error
	if err != nil {
		return "", err
	}
	return membership.Role, nil
}

func handleGetGroupMembers(w http.ResponseWriter, r *http.Request, d deps.Deps, groupID string) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if user is a member of the group
	_, err = checkGroupMembership(d.DB, userID, groupID)
	if err != nil {
		http.Error(w, `{"error":"not a member of this group"}`, http.StatusForbidden)
		return
	}

	// Get all group members with user info
	var memberships []models.GroupMembership
	if err := d.DB.Where("group_id = ?", groupID).Preload("User").Find(&memberships).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to fetch members: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Convert to response format
	var members []*GroupMemberResponse
	for _, membership := range memberships {
		member := &GroupMemberResponse{
			ID:        membership.ID,
			UserID:    membership.UserID,
			GroupID:   membership.GroupID,
			Role:      membership.Role,
			CreatedAt: membership.CreatedAt,
			User:      membership.User,
		}
		members = append(members, member)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(members)
}

func handleGetGroupSettings(w http.ResponseWriter, r *http.Request, d deps.Deps, groupID string) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if user is a member and get their role
	userRole, err := checkGroupMembership(d.DB, userID, groupID)
	if err != nil {
		http.Error(w, `{"error":"not a member of this group"}`, http.StatusForbidden)
		return
	}

	// Get group info
	var group models.Group
	if err := d.DB.Where("id = ?", groupID).First(&group).Error; err != nil {
		http.Error(w, `{"error":"group not found"}`, http.StatusNotFound)
		return
	}

	// Get all group members with user info
	var memberships []models.GroupMembership
	if err := d.DB.Where("group_id = ?", groupID).Preload("User").Find(&memberships).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to fetch members: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Convert to response format
	var members []*GroupMemberResponse
	for _, membership := range memberships {
		member := &GroupMemberResponse{
			ID:        membership.ID,
			UserID:    membership.UserID,
			GroupID:   membership.GroupID,
			Role:      membership.Role,
			CreatedAt: membership.CreatedAt,
			User:      membership.User,
		}
		members = append(members, member)
	}

	response := &GroupSettingsResponse{
		ID:        group.ID,
		Name:      group.Name,
		JoinCode:  group.JoinCode,
		CreatedAt: group.CreatedAt,
		Members:   members,
		UserRole:  userRole,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleCreateAPIKey(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req CreateAPIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, `{"error":"name is required"}`, http.StatusBadRequest)
		return
	}

	// Default scopes if not provided
	scopes := req.Scopes
	if len(scopes) == 0 {
		scopes = []string{"read", "write"}
	}

	// Create the API key
	apiKey := models.NewApiKey(req.Name, userID, scopes)

	if err := d.DB.Create(apiKey).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to create API key: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Return the key with the token (only time it's sent in plain text)
	response := &APIKeyResponse{
		ApiKey: apiKey,
		Token:  apiKey.Token,
	}

	// Clear the token from the model to prevent accidental exposure
	apiKey.Token = ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleListAPIKeys(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var apiKeys []*models.ApiKey
	if err := d.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&apiKeys).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to fetch API keys: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Convert to response format (without tokens)
	var responses []*APIKeyResponse
	for _, key := range apiKeys {
		responses = append(responses, &APIKeyResponse{
			ApiKey: key,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responses)
}

func handleRevokeAPIKey(w http.ResponseWriter, r *http.Request, d deps.Deps, keyID string) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if the API key exists and belongs to the user
	var apiKey models.ApiKey
	if err := d.DB.Where("id = ? AND user_id = ?", keyID, userID).First(&apiKey).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, `{"error":"API key not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf(`{"error":"failed to fetch API key: %v"}`, err), http.StatusInternalServerError)
		}
		return
	}

	// Deactivate the key instead of deleting it (for audit trail)
	apiKey.IsActive = false
	if err := d.DB.Save(&apiKey).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to revoke API key: %v"}`, err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": "API key revoked successfully",
		"id":      keyID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleDeleteGroup(w http.ResponseWriter, r *http.Request, d deps.Deps, groupID string) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if user is an admin of the group
	userRole, err := checkGroupMembership(d.DB, userID, groupID)
	if err != nil {
		http.Error(w, `{"error":"not a member of this group"}`, http.StatusForbidden)
		return
	}

	if userRole != "admin" {
		http.Error(w, `{"error":"only admins can delete groups"}`, http.StatusForbidden)
		return
	}

	// Check if group exists
	var group models.Group
	if err := d.DB.Where("id = ?", groupID).First(&group).Error; err != nil {
		http.Error(w, `{"error":"group not found"}`, http.StatusNotFound)
		return
	}

	// Start transaction for cascade deletion
	tx := d.DB.Begin()
	if tx.Error != nil {
		http.Error(w, `{"error":"failed to start transaction"}`, http.StatusInternalServerError)
		return
	}

	// Delete all content in the group
	if err := tx.Where("group_id = ?", groupID).Delete(&models.Content{}).Error; err != nil {
		tx.Rollback()
		http.Error(w, fmt.Sprintf(`{"error":"failed to delete group content: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Delete all group memberships
	if err := tx.Where("group_id = ?", groupID).Delete(&models.GroupMembership{}).Error; err != nil {
		tx.Rollback()
		http.Error(w, fmt.Sprintf(`{"error":"failed to delete group memberships: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Delete the group
	if err := tx.Delete(&group).Error; err != nil {
		tx.Rollback()
		http.Error(w, fmt.Sprintf(`{"error":"failed to delete group: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to commit transaction: %v"}`, err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": "Group deleted successfully",
		"id":      groupID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// shouldProcessYouTubeTranscript checks if content contains a YouTube URL that should be processed
func shouldProcessYouTubeTranscript(content *models.Content) bool {
	if content == nil {
		return false
	}

	// Check if content type is URL and contains YouTube URL
	if content.Type == "url" {
		return isYouTubeURL(content.Data)
	}

	// Check if text content contains YouTube URL
	if content.Type == "text" {
		return containsYouTubeURL(content.Data)
	}

	return false
}

// isYouTubeURL checks if a URL is a YouTube URL and extracts video ID
func isYouTubeURL(urlStr string) bool {
	videoID := extractYouTubeVideoID(urlStr)
	return videoID != ""
}

// containsYouTubeURL checks if text contains a YouTube URL
func containsYouTubeURL(text string) bool {
	// Simple regex to find YouTube URLs in text
	youtubeRegex := `(?i)(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})`
	matched, _ := regexp.MatchString(youtubeRegex, text)
	return matched
}

// extractYouTubeVideoID extracts the video ID from various YouTube URL formats
func extractYouTubeVideoID(urlStr string) string {
	if urlStr == "" {
		return ""
	}

	// Handle various YouTube URL patterns
	patterns := []string{
		`(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})`,
		`youtube\.com/watch.*[?&]v=([a-zA-Z0-9_-]{11})`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(urlStr)
		if len(matches) > 1 {
			return matches[1]
		}
	}

	return ""
}

// processYouTubeTranscript processes a YouTube video to extract transcript asynchronously
func processYouTubeTranscript(d deps.Deps, content *models.Content) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Panic in processYouTubeTranscript: %v\n", r)
		}
	}()

	// Extract YouTube URL from content
	var videoURL string
	if content.Type == "url" {
		videoURL = content.Data
	} else if content.Type == "text" {
		// Extract first YouTube URL from text
		youtubeRegex := `(?i)(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})`
		re := regexp.MustCompile(youtubeRegex)
		matches := re.FindStringSubmatch(content.Data)
		if len(matches) > 1 {
			videoURL = fmt.Sprintf("https://www.youtube.com/watch?v=%s", matches[1])
		}
	}

	if videoURL == "" {
		fmt.Printf("No valid YouTube URL found in content %s\n", content.ID)
		return
	}

	// Execute yt_transcript2.py script (following recipe.go pattern)
	cmd := exec.Command("python", "yt_transcript2.py", videoURL)
	cmd.Env = os.Environ()

	output, err := cmd.CombinedOutput()

	var transcriptText strings.Builder
	var videoTitle, channel string
	var hasTranscript bool

	if err != nil {
		// Script failed - analyze the error to provide helpful feedback
		errorOutput := string(output)
		fmt.Printf("Failed to run yt_transcript2.py for content %s: %v\nOutput: %s\n", content.ID, err, errorOutput)

		// Set basic info for error case
		videoTitle = "YouTube Video"

		// Provide specific error messages based on common failure patterns
		transcriptText.WriteString(fmt.Sprintf("📹 %s\n", videoTitle))
		transcriptText.WriteString(fmt.Sprintf("🔗 %s\n\n", videoURL))
		transcriptText.WriteString("⚠️ Transcript Unavailable\n\n")

		if strings.Contains(errorOutput, "Video unavailable") {
			transcriptText.WriteString("This video is not available (it may be private, deleted, or restricted in your region).")
		} else if strings.Contains(errorOutput, "MalformedFileError") || strings.Contains(errorOutput, "Invalid format") {
			transcriptText.WriteString("This video's captions are in an unsupported format or may be auto-generated captions that cannot be processed.")
		} else if strings.Contains(errorOutput, "No such file or directory") {
			transcriptText.WriteString("Transcript processing service is temporarily unavailable.")
		} else if strings.Contains(errorOutput, "ERROR: Sign in") || strings.Contains(errorOutput, "Sign in to confirm") {
			transcriptText.WriteString("This video requires sign-in to access captions.")
		} else if strings.Contains(errorOutput, "Subtitles are disabled") || strings.Contains(errorOutput, "No subtitles") {
			transcriptText.WriteString("This video does not have captions or subtitles available.")
		} else {
			transcriptText.WriteString("Unable to extract transcript due to technical limitations. This may happen with certain video types, restricted content, or temporary YouTube API issues.")
		}

		hasTranscript = false
	} else {
		// Parse JSON output
		start := bytes.IndexByte(output, '{')
		if start == -1 {
			fmt.Printf("No JSON found in yt_transcript2.py output for content %s\n", content.ID)

			// Fallback message when no JSON is found
			transcriptText.WriteString("📹 YouTube Video\n")
			transcriptText.WriteString(fmt.Sprintf("🔗 %s\n\n", videoURL))
			transcriptText.WriteString("⚠️ Transcript processing failed - no valid output received.")
			hasTranscript = false
		} else {
			output = output[start:]

			var transcriptData struct {
				Title      string `json:"title"`
				Channel    string `json:"channel"`
				Transcript []struct {
					Text       string `json:"text"`
					Offset     int    `json:"offset"`
					OffsetText string `json:"offsetText"`
					Duration   int    `json:"duration"`
				} `json:"transcript"`
			}

			if err := json.Unmarshal(output, &transcriptData); err != nil {
				fmt.Printf("Failed to parse yt_transcript2.py output for content %s: %v\n", content.ID, err)

				// Fallback message for JSON parsing errors
				transcriptText.WriteString("📹 YouTube Video\n")
				transcriptText.WriteString(fmt.Sprintf("🔗 %s\n\n", videoURL))
				transcriptText.WriteString("⚠️ Transcript data could not be processed due to formatting issues.")
				hasTranscript = false
			} else {
				// Success - format the transcript nicely
				videoTitle = transcriptData.Title
				channel = transcriptData.Channel

				if videoTitle == "" {
					videoTitle = "YouTube Video"
				}

				transcriptText.WriteString(fmt.Sprintf("📹 %s\n", videoTitle))
				if channel != "" {
					transcriptText.WriteString(fmt.Sprintf("👤 %s\n", channel))
				}
				transcriptText.WriteString(fmt.Sprintf("🔗 %s\n\n", videoURL))

				if len(transcriptData.Transcript) == 0 {
					transcriptText.WriteString("⚠️ No transcript content available for this video.")
					hasTranscript = false
				} else {
					transcriptText.WriteString("📝 Transcript:\n\n")
					for _, segment := range transcriptData.Transcript {
						transcriptText.WriteString(fmt.Sprintf("[%s] %s\n", segment.OffsetText, segment.Text))
					}
					hasTranscript = true
				}
			}
		}
	}

	// Create reply content with transcript or error message
	metadata := map[string]interface{}{
		"source":         "youtube_transcript",
		"video_url":      videoURL,
		"has_transcript": hasTranscript,
	}

	if videoTitle != "" {
		metadata["video_title"] = videoTitle
	}
	if channel != "" {
		metadata["channel"] = channel
	}

	replyContent := models.NewContentReply(
		"text",
		transcriptText.String(),
		content.GroupID,
		content.UserID,
		content.ID,
		metadata,
	)

	// Save reply content in database transaction
	err = d.DB.Transaction(func(tx *gorm.DB) error {
		// Create the reply content
		if err := tx.Create(replyContent).Error; err != nil {
			return err
		}

		// Increment parent's reply count
		if err := tx.Model(&models.Content{}).Where("id = ?", content.ID).UpdateColumn("reply_count", gorm.Expr("reply_count + ?", 1)).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		fmt.Printf("Failed to save transcript reply for content %s: %v\n", content.ID, err)
		return
	}

	fmt.Printf("Successfully processed YouTube transcript for content %s\n", content.ID)
}

// File manager handlers

func handleGetFiles(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID := r.Context().Value(UserContextKey).(string)
	groupID := r.URL.Query().Get("group_id")
	path := r.URL.Query().Get("path")

	if groupID == "" {
		http.Error(w, `{"error":"group_id is required"}`, http.StatusBadRequest)
		return
	}

	// Get user's group membership
	var membership models.GroupMembership
	if err := d.DB.Where("user_id = ? AND group_id = ?", userID, groupID).First(&membership).Error; err != nil {
		http.Error(w, `{"error":"not a member of this group"}`, http.StatusForbidden)
		return
	}

	// Query for files and folders in the specified path
	var contents []*models.Content
	query := d.DB.Where("group_id = ? AND (type = ? OR type = ?)", groupID, "document", "folder")

	// Filter by path if provided
	if path != "" {
		query = query.Where("JSON_EXTRACT(metadata, '$.path') LIKE ?", path+"%")
	}

	if err := query.Preload("User").Find(&contents).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to fetch files: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Convert to response format
	var fileResponses []map[string]interface{}
	for _, content := range contents {
		metadata := content.Metadata.Data
		response := map[string]interface{}{
			"id":         content.ID,
			"type":       content.Type,
			"created_at": content.CreatedAt,
			"updated_at": content.UpdatedAt,
			"metadata":   metadata,
		}
		fileResponses = append(fileResponses, response)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fileResponses)
}

func handleCreateFolder(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID := r.Context().Value(UserContextKey).(string)

	var req struct {
		GroupID  string                 `json:"group_id"`
		Name     string                 `json:"name"`
		Path     string                 `json:"path"`
		Metadata map[string]interface{} `json:"metadata"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Verify group membership
	var membership models.GroupMembership
	if err := d.DB.Where("user_id = ? AND group_id = ?", userID, req.GroupID).First(&membership).Error; err != nil {
		http.Error(w, `{"error":"not a member of this group"}`, http.StatusForbidden)
		return
	}

	// Create folder content
	content := models.NewContent("folder", "", req.GroupID, userID, req.Metadata)

	if err := d.DB.Create(content).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to create folder: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(content)
}

func handleMoveFile(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID := r.Context().Value(UserContextKey).(string)

	var req struct {
		ContentID string `json:"content_id"`
		NewPath   string `json:"new_path"`
		NewName   string `json:"new_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Get the content
	var content models.Content
	if err := d.DB.Where("id = ?", req.ContentID).First(&content).Error; err != nil {
		http.Error(w, `{"error":"content not found"}`, http.StatusNotFound)
		return
	}

	// Verify user has access to this content's group
	var membership models.GroupMembership
	if err := d.DB.Where("user_id = ? AND group_id = ?", userID, content.GroupID).First(&membership).Error; err != nil {
		http.Error(w, `{"error":"not authorized to modify this content"}`, http.StatusForbidden)
		return
	}

	// Update metadata
	metadata := content.Metadata.Data
	if req.NewPath != "" {
		metadata["path"] = req.NewPath
	}
	if req.NewName != "" {
		metadata["title"] = req.NewName
	}

	content.Metadata = models.MakeJSONField(metadata)

	if err := d.DB.Save(&content).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to move file: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"content": content,
	})
}

func handleGetFileTree(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID := r.Context().Value(UserContextKey).(string)
	groupID := r.URL.Query().Get("group_id")

	if groupID == "" {
		http.Error(w, `{"error":"group_id is required"}`, http.StatusBadRequest)
		return
	}

	// Verify group membership
	var membership models.GroupMembership
	if err := d.DB.Where("user_id = ? AND group_id = ?", userID, groupID).First(&membership).Error; err != nil {
		http.Error(w, `{"error":"not a member of this group"}`, http.StatusForbidden)
		return
	}

	// Get all folders for the group
	var folders []*models.Content
	if err := d.DB.Where("group_id = ? AND type = ?", groupID, "folder").Find(&folders).Error; err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to fetch folders: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Build tree structure
	tree := buildFileTree(folders)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tree)
}

// Helper function to build tree structure from flat folder list
func buildFileTree(folders []*models.Content) []map[string]interface{} {
	tree := []map[string]interface{}{}
	folderMap := make(map[string]map[string]interface{})

	// First pass: create map entries for all folders
	for _, folder := range folders {
		metadata := folder.Metadata.Data
		path := metadata["path"].(string)

		node := map[string]interface{}{
			"id":       folder.ID,
			"name":     metadata["title"],
			"path":     path,
			"children": []map[string]interface{}{},
		}
		folderMap[path] = node
	}

	// Second pass: build tree relationships
	for path, node := range folderMap {
		parentPath := path[:strings.LastIndex(path, "/")]
		if parentPath != "" && parentPath != path {
			if parent, exists := folderMap[parentPath]; exists {
				children := parent["children"].([]map[string]interface{})
				parent["children"] = append(children, node)
			} else {
				// Top-level folder
				tree = append(tree, node)
			}
		} else {
			// Root-level folder
			tree = append(tree, node)
		}
	}

	return tree
}
