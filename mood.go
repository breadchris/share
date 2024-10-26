package main

import (
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"net/http"
)

func NewMood(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		state := MoodState{
			Contents: []MoodContent{
				{
					Title:       "Title 1",
					Description: "Description 1",
					Likes:       10,
				},
			},
		}
		RenderMood(state).RenderPage(w, r)
	})
	return m
}

type MoodContent struct {
	Title       string
	Description string
	Likes       int
}

type MoodState struct {
	Contents []MoodContent
}

func RenderMood(state MoodState) *Node {
	var cards []*Node
	for _, pageInfo := range state.Contents {
		card := Div(
			Class("bg-white rounded-lg shadow-md hover:shadow-lg card"),
			Style_("grid-row-end: span 8;"),
			Div(
				Class("flex flex-col"),
				Div(
					Class("w-full aspect-video p-4"),
					P(T(shortText(200, pageInfo.Description))),
				),
				Div(
					Class("text-gray-800 p-2 basis-14"),
					Div(
						Class("flex justify-between"),
						P(Class("text-md font-bold leading-6 "), Text(pageInfo.Title)), // Dynamic Title
						Div(
							Class("flex items-center justify-between text-sm text-gray-500 space-x-1"),
							Div(
								Class("flex gap-1 mt-1"),
								Span(Text(fmt.Sprintf("%d", pageInfo.Likes))), // Dynamic HitCount
								Svg(
									StrokeWidth("1.5"),
									Stroke("currentColor"),
									Class("w-5 h-5"),
									Xmlns("http://www.w3.org/2000/svg"),
									Fill("none"),
									ViewBox("0 0 24 24"),
									Path(
										StrokeLinecap("round"),
										StrokeLinejoin("round"),
										D("M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"),
									),
								),
							),
						),
					),
				),
			),
		)
		cards = append(cards, card)
	}

	return Div(
		Style(T(`
.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 300px);
  grid-auto-rows: 20px;
  grid-row-gap: 10px;
  grid-column-gap: 16px;
}

.card {
  grid-row-end: span 10;
  margin-bottom: 10px;
}
`)),
		Class("board-grid justify-center mt-6"),
		Ch(cards),
	)
}
