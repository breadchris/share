package main

import (
	. "github.com/breadchris/share/html2"
	"github.com/samber/lo"
)

type MessageNode struct {
	ID	string	`json:"id"`
	Author	string	`json:"author"`
	Content	string	`json:"content"`
	Type	string	`json:"type"`
}

type FlattenedGraph struct {
	Node		MessageNode		`json:"node"`
	Children	[]FlattenedGraph	`json:"children"`
}

type chatState struct {
	Graph		FlattenedGraph	`json:"graph"`
	ParentID	string		`json:"parent_id"`
	NodesFrom	[]string	`json:"nodes_from"`
	NodesTo		[]string	`json:"nodes_to"`
}

func RenderChat(cs chatState) (string, error) {
	form := Form(
		HxPost("/chat/send"),
		HxTarget("#result"),
		Class("bg-white p-4 rounded-lg shadow-md"),
		Div(Class("mb-4"),
			Label(For("content"), Class("block text-sm font-medium text-gray-700"), T("Message")),
			TextArea(Id("content"), Name("content"), Class("mt-1 p-6 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md m-3")),
		),
		Input(Type("hidden"), Name("parent_id"), Value(cs.ParentID)),

		Label(For("ai"), Class("block text-sm font-medium text-gray-700"), T("ask AI")),
		Input(Type("checkbox"), Class("toggle"), Name("ai")),
		Div(
			Class("flex flex-row space-x-4"),
			Button(Type("submit"), Class("btn"), T("Send")),
		),
		P(Id("result")),
	)

	head := Head(
		Meta(Charset("UTF-8")),
		Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
		Title(T("Chat")),
		Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css"), Rel("stylesheet"), Type("text/css")),
		Script(Src("https://cdn.tailwindcss.com")),
		Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
		Script(Src("https://unpkg.com/htmx-ext-sse@2.2.1/sse.js")),
	)

	return Html(
		Attr("lang", "en"),
		head,
		Body(Class("bg-gray-100 vsc-initialized"),
			Div(Class("container mx-auto p-4"),
				H1(Class("text-2xl font-bold mb-4"), T("Chat Room")),
				form,
				Div(Class("bg-white p-4 rounded-lg shadow-md mb-4"),
					Id("chat"),
					Attr("hx-ext", "sse"),
					Attr("sse-connect", "/chat/sse"),
					Div(
						Attr("sse-swap", "ai"),
						Attr("hx-swap", "beforeend"),
					),
					Div(
						Attr("sse-swap", "chat"),
						Attr("hx-swap", "afterbegin"),
					),
					Div(
						Ch(lo.Map(cs.NodesFrom, func(node string, i int) *Node {
							return A(Href("/chat?id="+node), T(node))
						})),
					),

					RenderGraph(cs.Graph),
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

func RenderParentOptions(graph FlattenedGraph) []*Node {
	var options []*Node
	for _, msg := range graph.Children {
		options = append(options, Option(Value(msg.Node.ID), T(msg.Node.Author+": "+msg.Node.Content)))
	}
	return options
}

func RenderGraph(graph FlattenedGraph) *Node {
	return Div(Class("ml-2"),
		RenderMsg(graph),
		Ch(
			lo.Map(
				graph.Children,
				func(node FlattenedGraph, i int) *Node {
					return RenderGraph(node)
				},
			),
		),
	)
}

func RenderMsg(m FlattenedGraph) *Node {
	gear := Svg(
		Attr("xmlns", "http://www.w3.org/2000/svg"),
		Attr("fill", "none"),
		Attr("viewBox", "0 0 24 24"),
		Attr("stroke-width", "1.5"),
		Attr("stroke", "currentColor"),
		Class("size-3"),
		Path(
			Attr("stroke-linecap", "round"),
			Attr("stroke-linejoin", "round"),
			Attr("d", "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"),
		),
		Path(
			Attr("stroke-linecap", "round"),
			Attr("stroke-linejoin", "round"),
			Attr("d", "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"),
		),
	)

	btn := Button(Class("btn btn-ghost p-px"), Attr("onclick", "my_modal_1.showModal()"), gear)
	modal := Dialog(Id("my_modal_1"), Class("modal"),
		Div(Class("modal-box"),
			H3(Class("text-lg font-bold"), T("Hello!")),
			P(Class("py-4"), T("Press ESC key or click the button below to close")),
			Div(Class("modal-action"),
				Form(Method("dialog"),
					Button(Class("btn"), T("Close")),
				),
			),
		),
	)
	return Div(Class("chat chat-start mb-4"),
		btn,
		modal,
		A(Href("/chat?id="+m.Node.ID), Class("font-semibold"), T(m.Node.Author+":")),
		Span(T(m.Node.Content)),
	)
}
