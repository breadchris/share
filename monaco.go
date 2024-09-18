package main

import (
	. "github.com/breadchris/share/html2"
)

type Code struct {
	C string
}

func RenderCode(code Code) *Node {
	return Div(
		Link(Rel("stylesheet"), Href("/dist/monaco.css")),
		Div(Class("w-full"), Attr("style", "height: 600px"), Id("monaco-editor")),
		Script(Attr("src", "/dist/monaco.js")),
	)
}
