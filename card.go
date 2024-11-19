package main

import (
	"net/http"
	"strings"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
)

func Card(d deps.Deps, registry *CommandRegistry) *http.ServeMux {
	registry.Register("edit", func(message string) []string {
		return []string{
			Div(
				Id("content"),
				Attr("hx-swap-oob", "innerHTML"),
				Form(
					Id("save-form"),
					Attr("ws-send", "submit"),
					P(
						Class("mt-2"),
						TextArea(
							Class("w-full"),
							Attr("rows", "5"),
							Attr("autofocus", ""),
							Name("save"),
							T(message),
						),
					),
					Input(
						Id("save-form-button"),
						Attr("hidden", ""),
						Class("mt-4 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"),
						Type("submit"),
						Value("Save"),
					),
				)).Render(),
			Div(
				Id("edit-form"),
				Class("mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded md:w-[250px] mx-auto my-10"),
				Attr("onclick", "document.getElementById('save-form-button').click()"),
				T("Save"),
			).Render(),
		}
	})

	registry.Register(("save"), func(message string) []string {
		return []string{
			contentSection(message).Render(),
			editCardForm(message).Render(),
		}
	})

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		isMobile := strings.Contains(r.Header.Get("User-Agent"), "Android") || strings.Contains(r.Header.Get("User-Agent"), "iPhone")

		NewWebsocketPage(createCard(isMobile).Children).RenderPage(w, r)
	})
	return mux
}

func createCard(isMobile bool) *Node {
	cardStyle := Class("mx-auto my-10 rounded-lg shadow-lg md:w-[250px] md:h-[350px] md:aspect-auto")
	if isMobile {
		cardStyle = Class("mx-auto my-10 w-[90vw] aspect-[5/7] rounded-lg shadow-lg")
	}
	message := "This is the text on the card!"
	return Div(
		Div(
			ReloadNode("websocket.go"),
			cardStyle,
			// Image Section
			Div(
				Class("w-full h-[60%] bg-gray-200 rounded-t-lg overflow-hidden"),
				Img(
					Class("w-full h-full object-cover"),
					Attr("src", "https://via.placeholder.com/250x210"),
					Attr("alt", "Pokemon"),
				),
			),
			// Content Section
			contentSection(message),
		),
		// Edit Button
		editCardForm(message),
	)
}
func contentSection(message string) *Node {
	return Div(
		Id("content"),
		Class("p-4"),
		P(
			Class("mt-2"),
			T(message),
		),
	)
}

func editCardForm(message string) *Node {
	return Div(
		Id("edit-form"),
		Div(Class("mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded md:w-[250px] mx-auto my-10"),
			Attr("onclick", "document.getElementById('edit-form-button').click()"),
			T("Edit Card")),
		Form(
			Class("mx-auto my-10 rounded-lg shadow-lg md:w-[250px]"),
			Attr("ws-send", "submit"),
			Input(
				Type("hidden"),
				Name("edit"),
				Attr("readonly", ""),
				Value(message),
			),
			Input(
				Id("edit-form-button"),
				Class("mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"),
				Attr("hidden", ""),
				Type("submit"),
				Value("Edit Card"),
			),
		))
}
