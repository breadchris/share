package main

import (
	"net/http"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
)

func NewAI(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			get(d, w, r)
		}
	})
	return mux
}

func get(d deps.Deps, w http.ResponseWriter, r *http.Request) {
	body := Div(centerComponent(Div(
		Id("content-container"),
		T("Hello, World!"),
	)))

	NewWebsocketPage2(body.Children).RenderPage(w, r)
}

func centerComponent(node *Node) *Node {
	return Div(
		Class("flex items-center justify-center pt-20"),
		node,
	)
}

func NewWebsocketPage2(children []*Node) *Node {
	return Html(
		Attr("data-theme", "black"),
		Head(
			Title(T("EC")),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12"),
			),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
			),
			TailwindCSS,
			DaisyUI,
		),
		Body(Div(
			Attr("hx-ext", "ws"),
			Attr("ws-connect", "/websocket/ws"),
			Ch(children),
		)),
	)
}
