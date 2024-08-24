package main

import (
	"encoding/json"
	. "github.com/breadchris/share/html"
)

type Message struct {
	ID       string `json:"id"`
	Author   string `json:"author"`
	Content  string `json:"content"`
	ThreadID string `json:"thread_id"`
}

type chatState struct {
	Messages []Message `json:"messages"`
}

func RenderChat(s []byte) (string, error) {
	var cs chatState
	err := json.Unmarshal(s, &cs)
	if err != nil {
		return "", nil
	}
	return Html(
		Attr("lang", "en"),
		Head(
			Meta(Charset("UTF-8")),
			Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
			Title(T("Chat")),
			Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css"), Rel("stylesheet"), Type("text/css")),
			Script(Src("https://cdn.tailwindcss.com")),
			Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
			Script(Src("https://unpkg.com/htmx-ext-sse@2.2.1/sse.js")),
		),
		Body(Class("bg-gray-100"),
			Div(Class("container mx-auto p-4"),
				H1(Class("text-2xl font-bold mb-4"), T("Chat Room")),
				P(Id("result")),
				Form(
					HxPost("/chat/send"),
					HxTarget("#result"),
					Class("bg-white p-4 rounded-lg shadow-md"),
					Div(Class("mb-4"),
						Label(For("content"), Class("block text-sm font-medium text-gray-700"), T("Message")),
						TextArea(Id("content"), Name("content"), Class("mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md")),
					),
					Div(
						Class("flex flex-row space-x-4"),
						Button(Type("submit"), Class("btn"), T("Send")),
						Button(Class("btn"), T("AI"), HxTarget("#chat"), HxGet("/chat/ai"), HxSwap("afterbegin")),
					),
				),
				Div(Class("bg-white p-4 rounded-lg shadow-md mb-4"),
					Id("chat"),
					Attr("hx-ext", "sse"),
					Attr("sse-connect", "/chat/sse"),
					Attr("sse-swap", "message"),
					Attr("hx-swap", "afterbegin"),
					RenderMessages(cs.Messages),
				),
				Script(T(`
					document.body.addEventListener('htmx:sseBeforeMessage', function (e) {
						console.log(e);
					})
				`)),
			),
		),
	).Render(), nil
}

func RenderMessages(messages []Message) *Node {
	var nodes []NodeOption
	for _, msg := range messages {
		nodes = append(nodes, Div(Class("chat chat-start"),
			Span(Class("font-semibold"), T(msg.Author+":")),
			Span(T(msg.Content)),
		))
	}
	return Div(nodes...)
}
