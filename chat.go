package main

import (
	"encoding/json"
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

var messages []Message
var mu sync.Mutex
var chatClients = make(map[chan Message]struct{})

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

	cs := chatState{
		Messages: messages,
	}

	js, err := json.Marshal(cs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h, err := runCodeFunc("chatview.go", "main.RenderChat", js)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte(h))
}

func (s *Chat) sendHandler(w http.ResponseWriter, r *http.Request) {
	id, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "User not logged in", http.StatusForbidden)
		return
	}
	u := users[id]

	addMsg := func(m Message) {
		if m.Type == "chat" {
			notifyClients(m)
		}
	}

	if r.Method == "POST" {
		r.ParseForm()
		content := r.FormValue("content")
		ai := r.FormValue("ai")

		addMsg(Message{
			Author:  u.Email,
			Content: content,
			Type:    "chat",
		})

		if ai == "on" {
			req := openai.ChatCompletionRequest{
				Model:     openai.GPT4o20240513,
				MaxTokens: 1024,
				Messages: []openai.ChatCompletionMessage{
					{Role: "system", Content: "You are a helpful assistant."},
					{Role: "user", Content: content},
				},
			}
			resp, err := s.l.client.CreateChatCompletionStream(r.Context(), req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer resp.Close()

			var c string
			for {
				re, err := resp.Recv()
				if errors.Is(err, io.EOF) {
					notifyClients(Message{
						Author:  "ChatGPT",
						Content: c,
						Type:    "ai",
					})
					break
				}

				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				notifyClients(Message{
					Author:  "ChatGPT",
					Content: re.Choices[0].Delta.Content,
					Type:    "ai",
				})
				c += re.Choices[0].Delta.Content
			}
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
	mu.Lock()
	chatClients[messageChan] = struct{}{}
	mu.Unlock()

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	for {
		select {
		case msg := <-messageChan:
			if msg.Type == "chat" {
				lines := strings.Split(msg.Content, "\n\n")
				for _, c := range lines {
					m := Message{
						ID:      msg.ID,
						Author:  msg.Author,
						Content: c,
						Type:    msg.Type,
					}
					fmt.Fprintf(w, "event: chat\ndata: %s\n\n", RenderMsg(m))
					flusher.Flush()
				}
			}
			if msg.Type == "ai" {
				fmt.Fprintf(w, "event: ai\ndata: %s\n\n", msg.Content)
				flusher.Flush()
			}
		case <-r.Context().Done():
			delete(chatClients, messageChan)
			return
		}
	}
}

func notifyClients(m Message) {
	m.ID = uuid.NewString()
	mu.Lock()
	defer mu.Unlock()
	if m.Type == "chat" {
		messages = append(messages, m)
	}

	for client := range chatClients {
		client <- m
	}
}
