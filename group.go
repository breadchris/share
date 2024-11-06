package main

import (
	"context"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"net/http"
)

type Group struct {
	Name  string
	Users []string
}

func NewGroup(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		var group Group
		if id != "" {
			if err := d.Docs.WithCollection("groups").Get(id, group); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		ctx := context.WithValue(r.Context(), "baseURL", r.URL.Path)
		switch r.Method {
		case http.MethodGet:
			if id == "" {
				DefaultLayout(
					Div(
						Class("max-w-2xl mx-auto"),
						BuildFormCtx(BuildCtx{
							CurrentFieldPath: "",
							Name:             "group",
						}, group),
						Button(Type("submit"), Text("create")),
					),
				).RenderPageCtx(ctx, w, r)
				return
			}
			DefaultLayout(Div()).RenderPageCtx(ctx, w, r)
		case http.MethodPost:
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			for k, v := range r.Form {
				println(k, v)
			}
		}
	})
	return mux
}
