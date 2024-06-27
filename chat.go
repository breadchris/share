package main

import (
	"html/template"
	"net/http"
	"sync"
)

type Message struct {
	Author  string
	Content string
}

var messages []Message
var mu sync.Mutex

func clearHandler(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()
	messages = []Message{}
}

func chatHandler(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.ParseFiles("chat.html"))
	mu.Lock()
	defer mu.Unlock()
	tmpl.Execute(w, messages)
}

func sendHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		author := r.FormValue("author")
		content := r.FormValue("content")

		mu.Lock()
		messages = append(messages, Message{Author: author, Content: content})
		mu.Unlock()
	}
}
