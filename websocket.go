package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
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

type CommandRegistry struct {
	handlers map[string]CommandFunc
	mu       sync.RWMutex
}

func NewCommandRegistry() *CommandRegistry {
	return &CommandRegistry{
		handlers: make(map[string]CommandFunc),
	}
}

func (cr *CommandRegistry) Register(command string, handler CommandFunc) {
	cr.mu.Lock()
	defer cr.mu.Unlock()
	cr.handlers[command] = handler
}

type WebsocketClient struct {
	conn     *websocket.Conn
	send     chan []byte
	registry *CommandRegistry
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

func NewWebsocketPage(children []*Node) *Node {
	return Html(
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
			Ch(children),
		)),
	)
}

func WebsocketUI(d deps.Deps, registry *CommandRegistry) *http.ServeMux {
	go hub.run()
	setupHandlers(registry)
	mux := http.NewServeMux()

	mux.HandleFunc("/ws", websocketHandler2(registry))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		body := Div(
			ReloadNode("websocket.go"),
			P(T("Websocket")),
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
		)

		NewWebsocketPage(body.Children).RenderPage(w, r)
	})
	return mux
}


func setupHandlers(registry *CommandRegistry) {
	registry.Register("1", func() string {
		return Div(
			Id("container-1"),
			Attr("hx-swap-oob", "innerHTML"),
			T("container 1"),
		).Render()
	})

	registry.Register("2", func() string {
		return Div(
			Id("container-2"),
			Attr("hx-swap-oob", "innerHTML"),
			T("container 2"),
		).Render()
	})

	registry.Register("ping", func() string {
		return Div(
			Id("container-1"),
			Attr("hx-swap-oob", "innerHTML"),
			T("Pong"),
		).Render()
	})
}


func (cr *CommandRegistry) Run(command string) string {
	cr.mu.RLock()
	handler, ok := cr.handlers[command]
	cr.mu.RUnlock()
	if ok {
		return handler()
	} else {
		log.Println("Unknown command:", command)
		return Div(
			Id("container-1"),
			Attr("hx-swap-oob", "innerHTML"),
			T("Unknown command"),
		).Render()
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
		cmdMsg := c.registry.Run(command)
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

func websocketHandler2(registry *CommandRegistry) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Websocket connection")
		conn, err := websockerUpgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}

		client := &WebsocketClient{
			conn:     conn,
			send:     make(chan []byte, 256),
			registry: registry,
		}
		hub.register <- client

		go client.writePump()
		client.readPump(w, r)
	}
}

func Card(d deps.Deps, registry *CommandRegistry) *http.ServeMux {
	registry.Register("edit", func() string {
		return Div(
			Id("content"),
			Attr("hx-swap-oob", "innerHTML"),
			Input(
				Type("text"),
			),
		).Render()
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
	return Div(
		Div(
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
			Div(
				Id("content"),
				Class("p-4"),
				H2(
					Class("text-xl font-bold"),
					T("Pokemon Name"),
				),
				P(
					Class("text-sm mt-2"),
					T("This is a description of the Pokemon card."),
				),
			),
			// Edit Button
			Form(
				Attr("ws-send", "submit"),
				Input(
					Type("hidden"),
					Name("command"),
					Value("edit"),
				),
				Input(
					Class("mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"),
					Type("submit"),
					Value("Edit Card"),
				),
			),
		),
	)
}
