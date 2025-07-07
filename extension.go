package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/go-shiori/dom"
	"github.com/go-shiori/go-readability"
	"gorm.io/gorm"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
)

type PageInfo struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	Title     string `json:"title"`
	HTML      string `json:"html"`
	CreatedAt int64  `json:"created_at"`
	Article   string `json:"article"`
	HitCount  int    `json:"hit_count"`
}

func NewExtension(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	// Get default user and group for extension usage
	defaultUserID := "extension-user"
	defaultGroupID := "extension-group"

	// Ensure default user exists
	var user models.User
	if err := d.DB.FirstOrCreate(&user, models.User{ID: defaultUserID, Username: "extension"}).Error; err != nil {
		slog.Error("failed to create default user", "error", err)
	}

	// Ensure default group exists
	var group models.Group
	if err := d.DB.FirstOrCreate(&group, models.Group{ID: defaultGroupID, Name: "Extension Pages"}).Error; err != nil {
		slog.Error("failed to create default group", "error", err)
	}

	m.HandleFunc("/save", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			var pageInfo PageInfo
			ur := r.FormValue("url")
			if ur != "" {
				err := json.NewDecoder(r.Body).Decode(&pageInfo)
				if err != nil {
					http.Error(w, err.Error(), http.StatusBadRequest)
					return
				}
			} else {
				pageInfo.URL = ur
			}

			getArticle := func(pageInfo PageInfo) (*readability.Article, error) {
				r := strings.NewReader(pageInfo.HTML)
				doc, err := dom.Parse(r)
				if err != nil {
					return nil, err
				}
				u, err := url.Parse(pageInfo.URL)
				if err != nil {
					return nil, err
				}
				a, err := readability.FromDocument(doc, u)
				if err != nil {
					return nil, err
				}
				return &a, nil
			}

			article, err := getArticle(pageInfo)
			if err != nil {
				slog.Debug("failed to get article", "error", err)
			} else {
				pageInfo.Article = article.TextContent
			}

			// Check if page already exists
			var existingContent models.Content
			result := d.DB.Where("type = ? AND group_id = ? AND data LIKE ?", "page", defaultGroupID, "%"+pageInfo.URL+"%").First(&existingContent)
			
			hitCount := 1
			if result.Error == nil {
				// Page exists, increment hit count
				if existingContent.Metadata != nil {
					if count, ok := existingContent.Metadata.Data["hit_count"].(float64); ok {
						hitCount = int(count) + 1
					}
				}
			}

			// Create metadata for the page
			metadata := map[string]interface{}{
				"url":       pageInfo.URL,
				"title":     pageInfo.Title,
				"html":      pageInfo.HTML,
				"hit_count": hitCount,
			}

			// Create or update content
			content := models.NewContent("page", pageInfo.Article, defaultGroupID, defaultUserID, metadata)

			if result.Error == nil {
				// Update existing content
				content.ID = existingContent.ID
				content.CreatedAt = existingContent.CreatedAt
				if err := d.DB.Save(content).Error; err != nil {
					http.Error(w, fmt.Sprintf("Failed to update content: %v", err), http.StatusInternalServerError)
					return
				}
			} else {
				// Create new content
				if err := d.DB.Create(content).Error; err != nil {
					http.Error(w, fmt.Sprintf("Failed to create content: %v", err), http.StatusInternalServerError)
					return
				}
			}

			// Convert back to PageInfo for response
			responsePageInfo := PageInfo{
				ID:        content.ID,
				URL:       pageInfo.URL,
				Title:     pageInfo.Title,
				HTML:      pageInfo.HTML,
				CreatedAt: content.CreatedAt.Unix(),
				Article:   pageInfo.Article,
				HitCount:  hitCount,
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(responsePageInfo)
		} else {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		ctx := context.WithValue(r.Context(), "baseURL", "/extension")

		switch r.Method {
		case http.MethodGet:
			if id != "" {
				var content models.Content
				if err := d.DB.Where("id = ? AND type = ?", id, "page").First(&content).Error; err != nil {
					http.Error(w, "Page not found", http.StatusNotFound)
					return
				}

				title := "Page"
				if content.Metadata != nil {
					if t, ok := content.Metadata.Data["title"].(string); ok {
						title = t
					}
				}

				DefaultLayout(
					Div(
						Class("mx-auto w-3/4 pt-6 space-y-6"),
						P(Class("text-xl"), T(title)),
						P(Raw(content.Data)),
					),
				).RenderPageCtx(ctx, w, r)
				return
			}

			DefaultLayout(
				Div(
					Class("mx-auto mt-16 w-3/4 pt-6 space-y-6"),
					Form(
						Class("space-y-2"),
						HxPost("/save"),
						Input(
							Class("input w-full"),
							Name("url"),
							Placeholder("url"),
						),
						Div(
							Input(
								Type("submit"),
								Value("Submit"),
								Class("btn btn-primary"),
							),
						),
					),
					RenderMasonry(d.DB, defaultGroupID),
				),
			).RenderPageCtx(ctx, w, r)
			return
		}
	})

	return m
}

func RenderMasonry(db *gorm.DB, groupID string) *Node {
	var cards []*Node
	var contents []models.Content
	
	// Get all page contents from the database
	if err := db.Where("type = ? AND group_id = ?", "page", groupID).Order("created_at DESC").Find(&contents).Error; err != nil {
		slog.Error("failed to fetch page contents", "error", err)
		return Div(Class("board-grid justify-center mt-6 space-y-6"))
	}

	for _, content := range contents {
		if content.Metadata == nil {
			continue
		}
		
		pageURL, _ := content.Metadata.Data["url"].(string)
		pageTitle, _ := content.Metadata.Data["title"].(string)
		
		if pageURL == "" {
			continue
		}
		
		ur, err := url.Parse(pageURL)
		if err != nil {
			slog.Error("failed to parse URL", "error", err)
			continue
		}
		
		card := Div(
			Div(
				Class("flex flex-col"),
				A(Href(pageURL), Class("text-md font-bold leading-6"), T(pageTitle)),
				Div(
					Class("text-sm text-gray-500 ml-2 "),
					T(fmt.Sprintf("%s %s", content.CreatedAt.Format("2006-01-02"), ur.Hostname())),
				),
				If(content.Data != "",
					Div(
						Class("w-full p-4"),
						A(Href("/"+content.ID), T(shortText(200, content.Data))),
					),
					Nil(),
				),
			),
		)
		cards = append(cards, card)
	}
	return Div(
		Class("board-grid justify-center mt-6 space-y-6"),
		Ch(cards),
	)
}

func shortText(n int, s string) string {
	if n < len(s) {
		return s[:n]
	}
	return s
}
