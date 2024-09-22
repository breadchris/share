package main

import (
	. "github.com/breadchris/share/html2"
)

func AdminPage() *Node {
	return Html(
		Attrs(map[string]string{"lang": "en"}),
		Head(
			Meta(Attrs(map[string]string{"charset": "UTF-8"})),
			Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
			Title(T("admin")),
			Link(Rel("stylesheet"), Href("https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css")),
			Link(Rel("stylesheet"), Href("https://cdn.jsdelivr.net/npm/daisyui@1.14.0/dist/full.css")),
			Style(T(`
				h1 { font-size: 2em; }
				h2 { font-size: 1.5em; }
				h3 { font-size: 1.17em; }
				h4 { font-size: 1.00em; }
				h5 { font-size: 0.8em; }
				a {
					color: blue;
					text-decoration: underline;
				}
			`)),
		),
		Body(),
	)
}
