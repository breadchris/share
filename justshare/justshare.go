package justshare

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
)

type CreateContentRequest struct {
	Type     string                 `json:"type"` // text, image, audio, clipboard, url
	Data     string                 `json:"data"` // Text content or base64 for files
	GroupID  string                 `json:"group_id"`
	Tags     []string               `json:"tags,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

type CreateGroupRequest struct {
	Name string `json:"name"`
}

type JoinGroupRequest struct {
	JoinCode string `json:"join_code"`
}

type ContentResponse struct {
	*models.Content
	TagNames []string         `json:"tag_names,omitempty"`
	UserInfo *models.User     `json:"user_info,omitempty"`
}

type TimelineResponse struct {
	Content    []*ContentResponse `json:"content"`
	NextOffset int                `json:"next_offset"`
	HasMore    bool               `json:"has_more"`
}

func New(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	// Main JustShare page
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Id("justshare-app"),
			),
			Link(Href("/static/justshare/JustShare.css"), Rel("stylesheet")),
			Script(Src("https://cdn.tailwindcss.com")),
			Script(Src("/static/justshare/JustShare.js"), Type("module")),
		).RenderPage(w, r)
	})

	// Content endpoints
	m.HandleFunc("/api/content", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "POST":
			handleCreateContent(w, r, d)
		case "GET":
			handleGetTimeline(w, r, d)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/api/content/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			handleGetContent(w, r, d)
		case "DELETE":
			handleDeleteContent(w, r, d)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Group endpoints
	m.HandleFunc("/api/groups", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "POST":
			handleCreateGroup(w, r, d)
		case "GET":
			handleGetUserGroups(w, r, d)
		default:
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

	// File upload endpoint for media content
	m.HandleFunc("/api/upload", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			handleFileUpload(w, r, d)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	return m
}

func handleCreateContent(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	// TODO: Get user from session
	userID := "test-user" // Placeholder

	var req CreateContentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}

	if req.Type == "" || req.Data == "" || req.GroupID == "" {
		http.Error(w, `{"error":"type, data, and group_id are required"}`, http.StatusBadRequest)
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
	}
	if !validTypes[req.Type] {
		http.Error(w, `{"error":"invalid content type"}`, http.StatusBadRequest)
		return
	}

	// Create content
	content := &models.Content{
		Model: models.Model{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Type:     req.Type,
		Data:     req.Data,
		GroupID:  req.GroupID,
		UserID:   userID,
		Metadata: models.MakeJSONField(req.Metadata),
	}

	if err := d.DB.Create(content).Error; err != nil {
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

	// Create response
	response := &ContentResponse{
		Content:  content,
		UserInfo: content.User,
	}
	for _, tag := range content.Tags {
		response.TagNames = append(response.TagNames, tag.Name)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleGetTimeline(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	groupID := r.URL.Query().Get("group_id")
	offsetStr := r.URL.Query().Get("offset")
	limitStr := r.URL.Query().Get("limit")

	if groupID == "" {
		http.Error(w, `{"error":"group_id is required"}`, http.StatusBadRequest)
		return
	}

	offset, _ := strconv.Atoi(offsetStr)
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 20 // Default limit
	}

	var contents []*models.Content
	query := d.DB.Where("group_id = ?", groupID).
		Preload("Tags").
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
	// TODO: Get user from session
	userID := "test-user" // Placeholder

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

func handleCreateGroup(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	// TODO: Get user from session
	userID := "test-user" // Placeholder

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
	// TODO: Get user from session
	userID := "test-user" // Placeholder

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
	err := d.DB.First(&existingMembership, "user_id = ? AND group_id = ?", userID, group.ID).Error
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
	// TODO: Get user from session
	userID := "test-user" // Placeholder

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
	// TODO: Get user from session
	userID := "test-user" // Placeholder

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
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: background 0.2s;
            margin: 8px;
        }
        .button:hover {
            background: #2563eb;
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
    
    <script>
        // Auto-redirect to app after 3 seconds if user doesn't click
        setTimeout(function() {
            if (window.location.pathname !== '/justshare/') {
                window.location.href = '/justshare/?join=%s';
            }
        }, 5000);
    </script>
</body>
</html>`, group.Name, group.Name, joinCode, joinCode, joinCode)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(html))
}
