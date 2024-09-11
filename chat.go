package main

import (
	"context"
	"fmt"
	"github.com/breadchris/share/session"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"github.com/sashabaranov/go-openai"
	"io"
	"net/http"
	"strings"
	"sync"
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
	l *OpenAIService
}

func NewChat(
	s *session.SessionManager,
	l *OpenAIService,
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
	resp, err := s.l.client.CreateChatCompletionStream(ctx, req)
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
				//fmt.Fprintf(w, "event: ai\ndata: %s\n\n", msg.Content)
				//flusher.Flush()
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
