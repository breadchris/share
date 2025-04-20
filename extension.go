package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/go-shiori/dom"
	"github.com/go-shiori/go-readability"
	"github.com/google/uuid"
	"log/slog"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
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

type State struct {
	PageInfos map[string]PageInfo `json:"page_infos"`
}

func NewExtension(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	var state State
	if err := d.Docs.Get("extension", &state); err != nil {
		state = State{
			PageInfos: make(map[string]PageInfo),
		}
		if err := d.Docs.Set("extension", state); err != nil {
			slog.Error("failed to initialize extension state", "error", err)
		}
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

			pageInfo.CreatedAt = time.Now().Unix()

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

			prevPageInfo, ok := state.PageInfos[pageInfo.URL]
			if ok {
				pageInfo.HitCount = prevPageInfo.HitCount + 1
			} else {
				pageInfo.HitCount = 1
			}
			pageInfo.ID = uuid.NewString()
			state.PageInfos[pageInfo.URL] = pageInfo

			if err := d.Docs.Set("extension", state); err != nil {
				http.Error(w, fmt.Sprintf("Failed to save state: %v", err), http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(pageInfo)
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
				var pi PageInfo
				for _, pageInfo := range state.PageInfos {
					if pageInfo.ID == id {
						pi = pageInfo
						break
					}
				}

				if pi.ID == "" {
					http.Error(w, "Page not found", http.StatusNotFound)
					return
				}

				DefaultLayout(
					Div(
						Class("mx-auto w-3/4 pt-6 space-y-6"),
						P(Class("text-xl"), T(pi.Title)),
						P(Raw(pi.Article)),
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
					RenderMasonry(state),
				),
			).RenderPageCtx(ctx, w, r)
			return
		}
	})

	return m
}

func RenderMasonry(state State) *Node {
	var cards []*Node
	var pi []PageInfo
	for _, pageInfo := range state.PageInfos {
		pi = append(pi, pageInfo)
	}
	sort.Slice(pi, func(i, j int) bool {
		return pi[i].CreatedAt > pi[j].CreatedAt
	})
	for _, pageInfo := range pi {
		ur, err := url.Parse(pageInfo.URL)
		if err != nil {
			slog.Error("failed to parse URL", "error", err)
			continue
		}
		card := Div(
			Div(
				Class("flex flex-col"),
				A(Href(pageInfo.URL), Class("text-md font-bold leading-6"), T(pageInfo.Title)),
				Div(
					Class("text-sm text-gray-500 ml-2 "),
					T(fmt.Sprintf("%s %s", time.Unix(pageInfo.CreatedAt, 0).Format("2006-01-02"), ur.Hostname())),
				),
				If(pageInfo.Article != "",
					Div(
						Class("w-full p-4"),
						A(Href("/"+pageInfo.ID), T(shortText(200, pageInfo.Article))),
					),
					Nil(),
				),
			),
			//Class(""),
			//	Div(
			//		Class("text-gray-800 p-2 basis-14"),
			//		Div(
			//			Class("flex justify-between"),
			//		),
			//	),
			//),
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
