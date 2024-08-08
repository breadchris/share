package main

import (
	"fmt"
	"github.com/breadchris/share/session"
	"github.com/sashabaranov/go-openai"
	"html/template"
	"net/http"
	"strings"
	"sync"
)

type Message struct {
	Author  string `json:"author"`
	Content string `json:"content"`
}

var messages []Message
var mu sync.Mutex
var clients = make(map[chan Message]struct{})

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

func (s *Chat) chatHandler(w http.ResponseWriter, r *http.Request) {
	_, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "User not logged in", http.StatusForbidden)
		return
	}

	t := template.Must(template.ParseFiles("chat.html"))
	mu.Lock()
	defer mu.Unlock()
	t.Execute(w, messages)
}

func (s *Chat) sendHandler(w http.ResponseWriter, r *http.Request) {
	id, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "User not logged in", http.StatusForbidden)
		return
	}
	u := users[id]

	addMsg := func(m Message) {
		mu.Lock()
		messages = append(messages, m)
		mu.Unlock()
		notifyClients(m)
	}

	if r.Method == "POST" {
		r.ParseForm()
		content := r.FormValue("content")

		addMsg(Message{Author: u.Email, Content: content})

		if strings.HasPrefix(content, "/ask") {
			req := openai.ChatCompletionRequest{
				Model: openai.GPT4o20240513,
				Messages: []openai.ChatCompletionMessage{
					{Role: "system", Content: "You are a helpful assistant."},
					{Role: "user", Content: content},
				},
			}
			resp, err := s.l.client.CreateChatCompletion(r.Context(), req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			addMsg(Message{Author: "ChatGPT", Content: resp.Choices[0].Message.Content})
		}
	}
}

func sseHandler(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	messageChan := make(chan Message)
	clients[messageChan] = struct{}{}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	for {
		select {
		case msg := <-messageChan:
			lines := strings.Split(msg.Content, "\n\n")
			for _, c := range lines {
				h := fmt.Sprintf(`<div class="chat chat-start"><span class="font-semibold">%s:</span><span>%s</span></div>`, msg.Author, c)
				fmt.Fprintf(w, "data: %s\n\n", h)
				flusher.Flush()
			}
		case <-r.Context().Done():
			delete(clients, messageChan)
			return
		}
	}
}

func notifyClients(m Message) {
	mu.Lock()
	defer mu.Unlock()
	for client := range clients {
		client <- m
	}
}
