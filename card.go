package main

import (
	"path/filepath"
	"slices"

	. "github.com/breadchris/share/html"
)

func Card() {
	card := Div(Id("card"), T("Card"), Class("text-black"))
	page := NewWebsocketPage(card.Children)
	page.RenderPage(w, r)
}

