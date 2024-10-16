package main

import (
	"context"
	"fmt"
	"github.com/breadchris/share/llm"
	"github.com/samber/lo"
	"io"
	"net/http"
	"strings"
	"sync"

	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/session"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"github.com/sashabaranov/go-openai"
)

var (
	nodeLookup  = make(map[string]MessageNode)
	edgeLookup  = make(map[string]map[string]Edge)
	reverseEdge = make(map[string]map[string]Edge)
	mu          sync.Mutex
	chatClients = make(map[chan MessageNode]struct{})
)

type Edge struct {
	Audiences []string
}

func init() {
	nodeLookup["root"] = MessageNode{
		ID:      "root",
		Author:  "system",
		Content: "welcome!",
	}
}

type Chat struct {
	s *session.SessionManager
	l *llm.OpenAIService
}

func NewChat(
	s *session.SessionManager,
	l *llm.OpenAIService,
) *Chat {
	return &Chat{
		s: s,
		l: l,
	}
}

func (s *Chat) NewMux() *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("/", s.chatHandler)
	m.HandleFunc("/send", s.sendHandler)
	m.HandleFunc("/sse", sseHandler)
	return m
}

func graphToFlattenedGraph(nodeID string) (FlattenedGraph, error) {
	node := nodeLookup[nodeID]

	var fg FlattenedGraph
	fg.Node = node
	for id := range edgeLookup[nodeID] {
		child, ok := nodeLookup[id]
		if !ok {
			return FlattenedGraph{}, fmt.Errorf("node %s not found", id)
		}
		fgc, err := graphToFlattenedGraph(id)
		if err != nil {
			return FlattenedGraph{}, err
		}
		fgc.Node = child
		fg.Children = append(fg.Children, fgc)
	}
	return fg, nil
}

func (s *Chat) chatHandler(w http.ResponseWriter, r *http.Request) {
	_, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "User not logged in", http.StatusForbidden)
		return
	}

	id := r.FormValue("id")
	if id == "" {
		id = "root"
	}

	g, err := graphToFlattenedGraph(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var nodesFrom []string
	for k := range reverseEdge[id] {
		nodesFrom = append(nodesFrom, k)
	}
	var nodesTo []string
	for k := range edgeLookup[id] {
		nodesTo = append(nodesTo, k)
	}

	cs := chatState{
		Graph:     g,
		ParentID:  id,
		NodesFrom: nodesFrom,
		NodesTo:   nodesTo,
	}
	sb, err := RenderChat(cs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write([]byte(sb))
}

func (s *Chat) sendHandler(w http.ResponseWriter, r *http.Request) {
	id, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "User not logged in", http.StatusForbidden)
		return
	}
	u := users[id]

	var parentNodeID string
	if r.Method == "POST" {
		r.ParseForm()
		content := r.FormValue("content")
		parentNodeID = r.FormValue("parent_id")
		if parentNodeID == "" {
			parentNodeID = "root"
		}

		messageNode := MessageNode{
			ID:      uuid.NewString(),
			Author:  u.Email,
			Content: content,
			Type:    "chat",
		}

		mu.Lock()
		nodeLookup[messageNode.ID] = messageNode
		if _, ok := edgeLookup[parentNodeID]; !ok {
			edgeLookup[parentNodeID] = make(map[string]Edge)
		}
		edgeLookup[parentNodeID][messageNode.ID] = Edge{}
		if _, ok := reverseEdge[messageNode.ID]; !ok {
			reverseEdge[messageNode.ID] = make(map[string]Edge)
		}
		reverseEdge[messageNode.ID][parentNodeID] = Edge{}
		mu.Unlock()

		notifyClients(messageNode)

		if ai := r.FormValue("ai"); ai == "on" {
			go s.handleAIResponse(context.TODO(), content, messageNode.ID)
		}
	}
}

func (s *Chat) handleAIResponse(ctx context.Context, userInput, parentNodeID string) error {
	req := openai.ChatCompletionRequest{
		Model:     openai.GPT4o20240513,
		MaxTokens: 1024,
		Messages: []openai.ChatCompletionMessage{
			{Role: "system", Content: "You are a helpful assistant."},
			{Role: "user", Content: userInput},
		},
	}
	resp, err := s.l.Client.CreateChatCompletionStream(ctx, req)
	if err != nil {
		return err
	}
	defer resp.Close()

	var c string
	for {
		re, err := resp.Recv()
		if errors.Is(err, io.EOF) {
			aiNode := MessageNode{
				ID:      uuid.NewString(),
				Author:  "ChatGPT",
				Content: c,
				Type:    "ai-done",
			}

			mu.Lock()
			nodeLookup[aiNode.ID] = aiNode
			if _, ok := edgeLookup[parentNodeID]; !ok {
				edgeLookup[parentNodeID] = make(map[string]Edge)
			}
			edgeLookup[parentNodeID][aiNode.ID] = Edge{}
			if _, ok := reverseEdge[aiNode.ID]; !ok {
				reverseEdge[aiNode.ID] = make(map[string]Edge)
			}
			reverseEdge[aiNode.ID][parentNodeID] = Edge{}
			mu.Unlock()

			notifyClients(aiNode)
			break
		}

		if err != nil {
			return err
		}

		c += re.Choices[0].Delta.Content
		notifyClients(MessageNode{
			Type:    "ai",
			Content: re.Choices[0].Delta.Content,
		})
	}
	return nil
}

func sseHandler(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	messageChan := make(chan MessageNode)
	mu.Lock()
	chatClients[messageChan] = struct{}{}
	mu.Unlock()

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	for {
		select {
		case msg := <-messageChan:
			if msg.Type == "ai" {

			} else {
				lines := strings.Split(msg.Content, "\n\n")
				for _, c := range lines {
					msg.Content = c
					fmt.Fprintf(w, "event: chat\ndata: %s\n\n", RenderMsg(FlattenedGraph{
						Node: msg,
					}).Render())
					flusher.Flush()
				}
			}
		case <-r.Context().Done():
			delete(chatClients, messageChan)
			return
		}
	}
}

func notifyClients(m MessageNode) {
	mu.Lock()
	defer mu.Unlock()

	for client := range chatClients {
		client <- m
	}
}

type MessageNode struct {
	ID      string `json:"id"`
	Author  string `json:"author"`
	Content string `json:"content"`
	Type    string `json:"type"`
}

type FlattenedGraph struct {
	Node     MessageNode      `json:"node"`
	Children []FlattenedGraph `json:"children"`
}

type chatState struct {
	Graph     FlattenedGraph `json:"graph"`
	ParentID  string         `json:"parent_id"`
	NodesFrom []string       `json:"nodes_from"`
	NodesTo   []string       `json:"nodes_to"`
}

func RenderChat(cs chatState) (string, error) {
	form := Form(
		HxPost("/chat/send"),
		HxTarget("#result"),
		Class("rounded-lg shadow-md"),
		Div(Class("mb-4"),
			TextArea(Id("content"), Name("content"), Class("w-full sm:text-sm")),
		),
		Input(Type("hidden"), Name("parent_id"), Value(cs.ParentID)),

		Label(For("ai"), Class("text-sm font-medium text-gray-700"), T("ask AI")),
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
			Div(Class("container mx-auto p-2"),
				form,
				Div(Class("p-4 rounded-lg mb-4"),
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

	btn := Button(Class("btn btn-ghost p-2"), Attr("onclick", "my_modal_1.showModal()"), gear)
	_ = Dialog(Id("my_modal_1"), Class("btn btn-ghost p-px items-end"),
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
		//modal,
		A(Href("/chat?id="+m.Node.ID), Class("font-semibold"), T(m.Node.Author+":")),
		Span(T(m.Node.Content)),
	)
}
