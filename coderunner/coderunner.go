package coderunner

import (
	"net/http"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
)

func New(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Id("code-runner"),
				Attr("data-props", `{"darkMode": true, "language": "typescript"}`),
			),
			Link(Href("/static/coderunner/CodeRunner.css"), Rel("stylesheet")),
			Script(Src("https://cdn.tailwindcss.com")),
			Script(Src("https://unpkg.com/esbuild-wasm@0.25.5/lib/browser.min.js")),
			Script(Src("/static/coderunner/CodeRunner.js"), Type("module")),
		).RenderPage(w, r)
	})
	return m
}
