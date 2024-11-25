package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	. "github.com/breadchris/share/html"
	"github.com/gorilla/websocket"
)

var websockerUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins
	CheckOrigin: func(r *http.Request) bool { return true },
}

type CommandFunc func(string, string) []string

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

func WebsocketUI(registry *CommandRegistry) *http.ServeMux {
	go hub.run()
	SetupHandlers(registry)
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

func SetupHandlers(registry *CommandRegistry) {
	registry.Register("1", func(message string, pageId string) []string {
		return []string{
			Div(
				Id("container-1"),
				Attr("hx-swap-oob", "innerHTML"),
				T("container 1"),
			).Render(),
		}
	})

	registry.Register("2", func(message string, pageId string) []string {
		return []string{
			Div(
				Id("container-2"),
				Attr("hx-swap-oob", "innerHTML"),
				T("container 2"),
			).Render(),
		}
	})

	registry.Register("ping", func(message string, pageId string) []string {
		return []string{
			Div(
				Id("container-1"),
				Attr("hx-swap-oob", "innerHTML"),
				T("Pong"),
			).Render(),
		}
	})
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
		var msgMap map[string]interface{}

		err = json.Unmarshal(message, &msgMap)
		if err != nil {
			log.Println("JSON Unmarshal error:", err)
			return
		}

		pageId := ""
		// get msgMap["HEADERS"].(map[string]interface{})["HX-Current-URL"].(string), "/card/")[1] if it exists
		if headers, ok := msgMap["HEADERS"].(map[string]interface{}); ok {
			if currentURL, ok := headers["HX-Current-URL"].(string); ok {
				splitUrl := strings.Split(currentURL, "/")
				pageId = splitUrl[len(splitUrl)-1]
			}
			delete(msgMap, "HEADERS")
		}

		if ID, ok := msgMap["id"].(string); ok {
			pageId = ID
			delete(msgMap, "id")
		}

		for key, value := range msgMap {
			fmt.Println("Key:", key, "Value:", value)
			fmt.Println("Registry:", c.registry.handlers)
			// Get the command from the command field
			msg, ok := value.(string)
			if !ok {
				msg = ""
			}
			cmdMsgs := []string{}

			c.registry.mu.RLock()
			handler, ok := c.registry.handlers[key]
			c.registry.mu.RUnlock()
			if ok {
				cmdMsgs = handler(msg, pageId)
			} else {
				cmdMsgs = []string{Div(
					Id("container-1"),
					Attr("hx-swap-oob", "innerHTML"),
					T("Unknown command"),
				).Render(),
				}
			}

			for _, cmdMsg := range cmdMsgs {
				hub.broadcast <- []byte(cmdMsg)
				// c.send <- []byte(cmdMsg)
			}
		}
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
