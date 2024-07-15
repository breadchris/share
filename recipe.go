package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path"
)

const recipeIndex = "data/recipe.bleve"

func setupRecipe() {
	index, err := NewSearchIndex("data/recipe.bleve")
	if err != nil {
		log.Fatalf("Failed to load search index: %v", err)
	}

	h := &Handler{
		index: index,
	}

	http.HandleFunc("/recipe", recipeHandler)
	http.HandleFunc("/recipe/search", h.searchHandler)
}

// SearchResult represents a single search result item
type SearchResult struct {
	Title       string
	Description string
	URL         string
}

type Handler struct {
	index *SearchIndex
}

func (s *Handler) searchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	var results []SearchResult

	res, err := s.index.Search(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, h := range res.Hits {
		f, err := os.ReadFile(path.Join("data/recipes", h.ID))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var data map[string]any
		err = json.Unmarshal(f, &data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		results = append(results, SearchResult{
			Title:       data["name"].(string),
			Description: data["source"].(string),
			URL:         fmt.Sprintf("/data/recipes/%s", h.ID),
		})
	}

	w.Header().Set("Content-Type", "text/html")
	searchTmpl := template.Must(template.ParseFiles("searchresults.html"))
	err = searchTmpl.Execute(w, results)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
