package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/gorilla/websocket"
)

var websockerUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins
	CheckOrigin: func(r *http.Request) bool { return true },
}

type CommandFunc func() string

var commandHandlers = make(map[string]CommandFunc)

type WebsocketClient struct {
	conn *websocket.Conn
	send chan []byte
}

type Hub struct {
	clients    map[*WebsocketClient]bool
	broadcast  chan []byte
	register   chan *WebsocketClient
	unregister chan *WebsocketClient
	mu         sync.Mutex
}

var hub = Hub{
	clients:    make(map[*WebsocketClient]bool),
	broadcast:  make(chan []byte),
	register:   make(chan *WebsocketClient),
	unregister: make(chan *WebsocketClient),
}

func WebsocketUI(d deps.Deps) *http.ServeMux {
	setupHandlers()
	mux := http.NewServeMux()

	mux.HandleFunc("/ws", websocketHandler2)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		Html(
			Head(
				Title(T("Websocket Test")),
				Script(
					Src("https://unpkg.com/htmx.org@1.9.12"),
				),
				Script(
					Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
				),
				TailwindCSS,
			),
			Body(Div(
				Attr("hx-ext", "ws"),
				Attr("ws-connect", "/websocket/ws"),
				ReloadNode("websocket.go"),
				T("Websocket"),
				Form(
					Attr("ws-send", "submit"),
					Input(
						Type("text"),
						Name("command"),
					),
					Input(
						Type("submit"),
						Value("Send"),
					),
				),
				Div(
					Id("container-1"),
					Attr("hx-swap-oob", "innerHTML"),
				),

				Div(
					Id("container-2"),
					Attr("hx-swap-oob", "innerHTML"),
				),
			),
			)).RenderPage(w, r)
	})
	return mux
}

func setupHandlers() {
	commandHandlers["1"] = func() string {
		message := Div(
			Id("container-1"),
			Attr("hx-swap-oob", "innerHTML"),
			T("container 1"),
		).Render()
		return message
	}

	commandHandlers["2"] = func() string {
		message := Div(
			Id("container-2"),
			Attr("hx-swap-oob", "innerHTML"),
			T("container 2"),
		).Render()
		return message
	}

	commandHandlers["ping"] = func() string {
		message := Div(
			Id("container-1"),
			Attr("hx-swap-oob", "innerHTML"),
			T("Pong"),
		).Render()
		return message
	}
}

func runCommand(command string) string {
	if handler, ok := commandHandlers[command]; ok {
		return handler()
	} else {
		log.Println("Unknown command:", command)
		message := Div(
			Id("container-1"),
			Attr("hx-swap-oob", "innerHTML"),
			T("Unknown command"),
		).Render()
		return message
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (c *WebsocketClient) readPump(w http.ResponseWriter, r *http.Request) {
	defer func() {
		hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Println("ReadMessage error:", err)
			break
		}
		// Parse the incoming JSON message
		var msgMap map[string]interface{}
		err = json.Unmarshal(message, &msgMap)
		if err != nil {
			log.Println("JSON Unmarshal error:", err)
			continue
		}
		// Extract the command field
		data, ok := msgMap["command"]
		if !ok {
			log.Println("command field not found")
			continue
		}
		// Get the command from the command field
		command, ok := data.(string)
		if !ok {
			log.Println("command is not a string")
			continue
		}
		fmt.Println("Command:", command)
		cmdMsg := runCommand(command)
		c.send <- []byte(cmdMsg)
	}
}

func (c *WebsocketClient) writePump() {
	defer c.conn.Close()
	for message := range c.send {
		err := c.conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Println("WriteMessage error:", err)
			break
		}
	}
}

func websocketHandler2(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Websocket connection")
	conn, err := websockerUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	client := &WebsocketClient{
		conn: conn,
		send: make(chan []byte, 256),
	}
	hub.register <- client

	go client.writePump()
	client.readPump(w, r)
}
