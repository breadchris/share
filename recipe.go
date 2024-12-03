package main

import (
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/db"
	. "github.com/breadchris/share/html"
	"log"
	"net/http"
	"os"
	"path"
)

const recipeIndex = "data/recipe.bleve"

func setupRecipe() {
	index, err := db.NewSearchIndex("data/recipe.bleve")
	if err != nil {
		log.Fatalf("Failed to load search index: %v", err)
	}

	h := &Handler{
		index: index,
	}

	http.HandleFunc("/recipe", recipeHandler)
	http.HandleFunc("/recipe/search", h.searchHandler)
}

type Handler struct {
	index *db.SearchIndex
}

func (s *Handler) searchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	res, err := s.index.Search(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var results []*Node
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
		results = append(results,
			Div(Class("border p-4 mb-4 bg-white rounded shadow"),
				H1(Class("text-xl font-semibold"), T(data["name"].(string))),
				P(T(data["source"].(string))),
				A(Class("text-blue-500"), Href(fmt.Sprintf("/data/recipes/%s", h.ID)), T("Read more")),
			))
	}

	w.Header().Set("Content-Type", "text/html")
	if len(results) == 0 {
		P(T("No results found")).RenderPage(w, r)
		return
	}
	Div(Ch(results)).RenderPage(w, r)
}
