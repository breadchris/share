package claudemd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreateClaudeDocRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Content     string   `json:"content"`
	TagNames    []string `json:"tag_names"`
	IsPublic    bool     `json:"is_public"`
}

type UpdateClaudeDocRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Content     string   `json:"content"`
	TagNames    []string `json:"tag_names"`
	IsPublic    bool     `json:"is_public"`
}

type ClaudeDocResponse struct {
	models.ClaudeDoc
	ID             string   `json:"id"`
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	IsPublic       bool     `json:"is_public"`
	Downloads      int      `json:"downloads"`
	Stars          int      `json:"stars"`
	Views          int      `json:"views"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
	AuthorName     string   `json:"author_name"`
	AuthorUsername string   `json:"author_username"`
	IsStarred      bool     `json:"is_starred"`
	TagNames       []string `json:"tag_names"`
}

type ClaudeDocListResponse struct {
	Docs       []ClaudeDocResponse `json:"docs"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	PerPage    int                 `json:"per_page"`
	TotalPages int                 `json:"total_pages"`
}

func loadModule(componentPath, componentName string) *Node {
	return Script(Type("module"), Raw(`
        try {
            // Import the compiled component module from the /module/ endpoint
            const componentModule = await import('/coderunner/module/`+componentPath+`');
            
            // Import React and ReactDOM
            const React = await import('react');
            const ReactDOM = await import('react-dom/client');
            
            // Try to get the component to render
            let ComponentToRender;
            
            // First try the specified component name
            if (componentModule.`+componentName+`) {
				console.log('Rendering component:', componentModule.`+componentName+`);
                ComponentToRender = componentModule.`+componentName+`;
            }
            // Then try default export
            else if (componentModule.default) {
				console.log('Rendering default component:', componentModule.default);
                ComponentToRender = componentModule.default;
            }
            else {
                throw new Error('No component found. Make sure to export a component named "`+componentName+`" or a default export.');
            }
            
            // Render the component
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(ComponentToRender));
            
        } catch (error) {
            console.error('Runtime Error:', error);
            document.getElementById('root').innerHTML = 
                '<div class="error">' +
                '<h3>Runtime Error:</h3>' +
                '<pre>' + error.message + '</pre>' +
                '<pre>' + (error.stack || '') + '</pre>' +
                '</div>';
        }
    </script>
`))
}

func New(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Id("claude-md-browser"),
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
			//Link(Href("/static/claudemd/ClaudeDocBrowser.css"), Rel("stylesheet")),
			Script(Src("https://cdn.tailwindcss.com")),
			Script(Src("/coderunner/module/@breadchris/ClaudeDocApp.tsx"), Type("module")),
			Div(Id("root")),
			loadModule("@breadchris/ClaudeDocApp.tsx", "ClaudeDocApp"),
		).RenderPage(w, r)
	})

	// API endpoints
	m.HandleFunc("/api/docs", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			handleListDocs(w, r, d)
		case "POST":
			handleCreateDoc(w, r, d)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/api/docs/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/docs/")
		parts := strings.Split(path, "/")

		if len(parts) == 1 && parts[0] != "" {
			// Single doc operations: GET, PUT, DELETE /api/docs/{id}
			docID := parts[0]
			switch r.Method {
			case "GET":
				handleGetDoc(w, r, d, docID)
			case "PUT":
				handleUpdateDoc(w, r, d, docID)
			case "DELETE":
				handleDeleteDoc(w, r, d, docID)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		} else if len(parts) >= 2 {
			// Doc actions: POST/DELETE /api/docs/{id}/{action}
			docID := parts[0]
			action := parts[1]

			switch action {
			case "star":
				handleStarDoc(w, r, d, docID)
			case "download":
				handleDownloadDoc(w, r, d, docID)
			case "visibility":
				handleToggleVisibility(w, r, d, docID)
			default:
				http.Error(w, "Invalid action", http.StatusBadRequest)
			}
		} else {
			http.Error(w, "Invalid path", http.StatusBadRequest)
		}
	})

	m.HandleFunc("/api/search", func(w http.ResponseWriter, r *http.Request) {
		handleSearchDocs(w, r, d)
	})

	m.HandleFunc("/api/tags", func(w http.ResponseWriter, r *http.Request) {
		handleGetTags(w, r, d)
	})

	m.HandleFunc("/api/user/docs", func(w http.ResponseWriter, r *http.Request) {
		handleGetUserDocs(w, r, d)
	})

	return m
}

func handleListDocs(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage := 20

	tags := r.URL.Query().Get("tags")
	var tagList []string
	if tags != "" {
		tagList = strings.Split(tags, ",")
	}

	var docs []models.ClaudeDoc
	query := d.DB.Preload("User").Preload("Tags").Preload("Content").Where("is_public = ?", true)

	// Filter by tags if provided
	if len(tagList) > 0 {
		query = query.Joins("JOIN claude_doc_tags ON claude_docs.id = claude_doc_tags.claude_doc_id").
			Joins("JOIN tags ON claude_doc_tags.tag_id = tags.id").
			Where("tags.name IN ?", tagList).
			Group("claude_docs.id").
			Having("COUNT(DISTINCT tags.id) = ?", len(tagList))
	}

	var total int64
	query.Model(&models.ClaudeDoc{}).Count(&total)

	offset := (page - 1) * perPage
	if err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&docs).Error; err != nil {
		http.Error(w, "Failed to fetch documents", http.StatusInternalServerError)
		return
	}

	// Get current user ID for star status
	var currentUserID string
	if userID, err := d.Session.GetUserID(r.Context()); err == nil {
		currentUserID = userID
	}

	response := ClaudeDocListResponse{
		Docs:       make([]ClaudeDocResponse, len(docs)),
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: int((total + int64(perPage) - 1) / int64(perPage)),
	}

	for i, doc := range docs {
		response.Docs[i] = buildClaudeDocResponse(doc, currentUserID, d.DB)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleCreateDoc(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateClaudeDocRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	// Create content record
	content := models.Content{
		Model: models.Model{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
		},
		Type:   "claude_md",
		Data:   req.Content,
		UserID: userID,
		// Note: GroupID will need to be handled based on your app's group logic
		GroupID: "default", // You might want to make this configurable
	}

	if err := d.DB.Create(&content).Error; err != nil {
		http.Error(w, "Failed to create content", http.StatusInternalServerError)
		return
	}

	// Create CLAUDE.md document
	doc := models.ClaudeDoc{
		Model: models.Model{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
		},
		Title:       req.Title,
		Description: req.Description,
		ContentID:   content.ID,
		UserID:      userID,
		IsPublic:    req.IsPublic,
	}

	if err := d.DB.Create(&doc).Error; err != nil {
		http.Error(w, "Failed to create document", http.StatusInternalServerError)
		return
	}

	// Handle tags
	if len(req.TagNames) > 0 {
		if err := assignTagsToDoc(d.DB, &doc, req.TagNames, userID); err != nil {
			fmt.Printf("Warning: Failed to assign tags: %v\n", err)
		}
	}

	// Reload with associations
	d.DB.Preload("User").Preload("Tags").Preload("Content").First(&doc, doc.ID)

	response := buildClaudeDocResponse(doc, userID, d.DB)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleGetDoc(w http.ResponseWriter, r *http.Request, d deps.Deps, docID string) {
	var doc models.ClaudeDoc
	if err := d.DB.Preload("User").Preload("Tags").Preload("Content").First(&doc, "id = ?", docID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Document not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch document", http.StatusInternalServerError)
		}
		return
	}

	// Check if document is public or user owns it
	var currentUserID string
	if userID, err := d.Session.GetUserID(r.Context()); err == nil {
		currentUserID = userID
	}

	if !doc.IsPublic && doc.UserID != currentUserID {
		http.Error(w, "Document not found", http.StatusNotFound)
		return
	}

	// Increment view count
	d.DB.Model(&doc).Update("views", doc.Views+1)

	response := buildClaudeDocResponse(doc, currentUserID, d.DB)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleUpdateDoc(w http.ResponseWriter, r *http.Request, d deps.Deps, docID string) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var doc models.ClaudeDoc
	if err := d.DB.First(&doc, "id = ? AND user_id = ?", docID, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Document not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch document", http.StatusInternalServerError)
		}
		return
	}

	var req UpdateClaudeDocRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Update document
	doc.Title = req.Title
	doc.Description = req.Description
	doc.IsPublic = req.IsPublic
	doc.UpdatedAt = time.Now()

	if err := d.DB.Save(&doc).Error; err != nil {
		http.Error(w, "Failed to update document", http.StatusInternalServerError)
		return
	}

	// Update content
	if err := d.DB.Model(&models.Content{}).Where("id = ?", doc.ContentID).Update("data", req.Content).Error; err != nil {
		http.Error(w, "Failed to update content", http.StatusInternalServerError)
		return
	}

	// Update tags
	if err := assignTagsToDoc(d.DB, &doc, req.TagNames, userID); err != nil {
		fmt.Printf("Warning: Failed to update tags: %v\n", err)
	}

	// Reload with associations
	d.DB.Preload("User").Preload("Tags").Preload("Content").First(&doc, doc.ID)

	response := buildClaudeDocResponse(doc, userID, d.DB)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleDeleteDoc(w http.ResponseWriter, r *http.Request, d deps.Deps, docID string) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var doc models.ClaudeDoc
	if err := d.DB.First(&doc, "id = ? AND user_id = ?", docID, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Document not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch document", http.StatusInternalServerError)
		}
		return
	}

	// Delete associated records
	d.DB.Where("claude_doc_id = ?", doc.ID).Delete(&models.ClaudeDocTag{})
	d.DB.Where("claude_doc_id = ?", doc.ID).Delete(&models.ClaudeDocStar{})
	d.DB.Delete(&doc)
	d.DB.Delete(&models.Content{}, doc.ContentID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func handleStarDoc(w http.ResponseWriter, r *http.Request, d deps.Deps, docID string) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var doc models.ClaudeDoc
	if err := d.DB.First(&doc, "id = ?", docID).Error; err != nil {
		http.Error(w, "Document not found", http.StatusNotFound)
		return
	}

	var star models.ClaudeDocStar
	err = d.DB.First(&star, "claude_doc_id = ? AND user_id = ?", docID, userID).Error

	if r.Method == "POST" {
		// Add star
		if err == nil {
			// Already starred
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]bool{"starred": true})
			return
		}

		star = models.ClaudeDocStar{
			Model: models.Model{
				ID:        uuid.NewString(),
				CreatedAt: time.Now(),
			},
			ClaudeDocID: docID,
			UserID:      userID,
		}

		if err := d.DB.Create(&star).Error; err != nil {
			http.Error(w, "Failed to star document", http.StatusInternalServerError)
			return
		}

		// Update star count
		d.DB.Model(&doc).Update("stars", doc.Stars+1)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"starred": true})
	} else if r.Method == "DELETE" {
		// Remove star
		if err != nil {
			// Not starred
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]bool{"starred": false})
			return
		}

		d.DB.Delete(&star)
		// Update star count
		d.DB.Model(&doc).Update("stars", doc.Stars-1)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"starred": false})
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleDownloadDoc(w http.ResponseWriter, r *http.Request, d deps.Deps, docID string) {
	var doc models.ClaudeDoc
	if err := d.DB.Preload("Content").First(&doc, "id = ?", docID).Error; err != nil {
		http.Error(w, "Document not found", http.StatusNotFound)
		return
	}

	// Check if document is public
	var currentUserID string
	if userID, err := d.Session.GetUserID(r.Context()); err == nil {
		currentUserID = userID
	}

	if !doc.IsPublic && doc.UserID != currentUserID {
		http.Error(w, "Document not found", http.StatusNotFound)
		return
	}

	// Increment download count
	d.DB.Model(&doc).Update("downloads", doc.Downloads+1)

	// Return the markdown content
	w.Header().Set("Content-Type", "text/markdown")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.md\"", doc.Title))
	w.Write([]byte(doc.Content.Data))
}

func handleSearchDocs(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	query := r.URL.Query().Get("q")
	tags := r.URL.Query().Get("tags")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage := 20

	var tagList []string
	if tags != "" {
		tagList = strings.Split(tags, ",")
	}

	var docs []models.ClaudeDoc
	dbQuery := d.DB.Preload("User").Preload("Tags").Preload("Content").Where("is_public = ?", true)

	// Text search
	if query != "" {
		dbQuery = dbQuery.Where("title ILIKE ? OR description ILIKE ?", "%"+query+"%", "%"+query+"%")
	}

	// Tag filtering
	if len(tagList) > 0 {
		dbQuery = dbQuery.Joins("JOIN claude_doc_tags ON claude_docs.id = claude_doc_tags.claude_doc_id").
			Joins("JOIN tags ON claude_doc_tags.tag_id = tags.id").
			Where("tags.name IN ?", tagList).
			Group("claude_docs.id").
			Having("COUNT(DISTINCT tags.id) = ?", len(tagList))
	}

	var total int64
	dbQuery.Model(&models.ClaudeDoc{}).Count(&total)

	offset := (page - 1) * perPage
	if err := dbQuery.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&docs).Error; err != nil {
		http.Error(w, "Search failed", http.StatusInternalServerError)
		return
	}

	// Get current user ID for star status
	var currentUserID string
	if userID, err := d.Session.GetUserID(r.Context()); err == nil {
		currentUserID = userID
	}

	response := ClaudeDocListResponse{
		Docs:       make([]ClaudeDocResponse, len(docs)),
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: int((total + int64(perPage) - 1) / int64(perPage)),
	}

	for i, doc := range docs {
		response.Docs[i] = buildClaudeDocResponse(doc, currentUserID, d.DB)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleGetTags(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	var tags []models.Tag
	if err := d.DB.Find(&tags).Error; err != nil {
		http.Error(w, "Failed to fetch tags", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func handleGetUserDocs(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var docs []models.ClaudeDoc
	if err := d.DB.Preload("User").Preload("Tags").Preload("Content").Where("user_id = ?", userID).Order("created_at DESC").Find(&docs).Error; err != nil {
		http.Error(w, "Failed to fetch documents", http.StatusInternalServerError)
		return
	}

	response := make([]ClaudeDocResponse, len(docs))
	for i, doc := range docs {
		response[i] = buildClaudeDocResponse(doc, userID, d.DB)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func buildClaudeDocResponse(doc models.ClaudeDoc, currentUserID string, db *gorm.DB) ClaudeDocResponse {
	response := ClaudeDocResponse{
		ClaudeDoc:   doc,
		ID:          doc.ID,
		Title:       doc.Title,
		Description: doc.Description,
		IsPublic:    doc.IsPublic,
		Downloads:   doc.Downloads,
		Stars:       doc.Stars,
		Views:       doc.Views,
		CreatedAt:   doc.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   doc.UpdatedAt.Format(time.RFC3339),
		IsStarred:   false,
		TagNames:    make([]string, len(doc.Tags)),
	}

	if doc.User != nil {
		response.AuthorName = doc.User.Username
		response.AuthorUsername = doc.User.Username
	}

	for i, tag := range doc.Tags {
		response.TagNames[i] = tag.Name
	}

	// Check if current user has starred this document
	if currentUserID != "" {
		var star models.ClaudeDocStar
		if err := db.First(&star, "claude_doc_id = ? AND user_id = ?", doc.ID, currentUserID).Error; err == nil {
			response.IsStarred = true
		}
	}

	return response
}

func assignTagsToDoc(db *gorm.DB, doc *models.ClaudeDoc, tagNames []string, userID string) error {
	// Remove existing tags
	db.Where("claude_doc_id = ?", doc.ID).Delete(&models.ClaudeDocTag{})

	for _, tagName := range tagNames {
		if tagName == "" {
			continue
		}

		// Find or create tag
		var tag models.Tag
		err := db.First(&tag, "name = ?", tagName).Error
		if err == gorm.ErrRecordNotFound {
			tag = models.Tag{
				Model: models.Model{
					ID:        uuid.NewString(),
					CreatedAt: time.Now(),
				},
				Name:   tagName,
				UserID: userID,
			}
			if err := db.Create(&tag).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		}

		// Create association
		docTag := models.ClaudeDocTag{
			ClaudeDocID: doc.ID,
			TagID:       tag.ID,
			CreatedAt:   time.Now(),
		}
		if err := db.Create(&docTag).Error; err != nil {
			return err
		}
	}

	return nil
}

func handleToggleVisibility(w http.ResponseWriter, r *http.Request, d deps.Deps, docID string) {
	userID, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var doc models.ClaudeDoc
	if err := d.DB.First(&doc, "id = ? AND user_id = ?", docID, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Document not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to fetch document", http.StatusInternalServerError)
		}
		return
	}

	if r.Method == "POST" {
		// Toggle visibility
		doc.IsPublic = !doc.IsPublic
		doc.UpdatedAt = time.Now()

		if err := d.DB.Save(&doc).Error; err != nil {
			http.Error(w, "Failed to update document", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"is_public": doc.IsPublic})
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
