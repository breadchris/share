package main

import (
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"net/http"
)

func NewMusic(_ deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Div(Id("music")),
				Script(Attr("type", "module"), Src("/static/music.js")),
			),
		).RenderPage(w, r)
	})
	return mux
}
