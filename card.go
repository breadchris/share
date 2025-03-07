package main

import (
	"net/http"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
)

func NewCard(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				T("qwe"))).RenderPage(w, r)
	}))
	return mux
}
