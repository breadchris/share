package graph

import (
	. "github.com/breadchris/share/html"
	"net/http"
)


func New() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(
			Html(
				Div(T("hello"),
				Div(T("something")),
			)).Render()))
	})
	mux.HandleFunc("/something", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(
			Html(
				DaisyUI,
				RenderTabs([]Tab{
					{
						Title: "hello",
						Content: Div(T("hello")),
					},
				}),
			).Render(),
		))
	})
	return mux
}
