package user

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// WebSocket message types
type WSMessage struct {
	ID   string      `json:"id"`
	Path string      `json:"path"`
	Data interface{} `json:"data"`
}

type WSResponse struct {
	ID    string      `json:"id"`
	Data  interface{} `json:"data,omitempty"`
	Error string      `json:"error,omitempty"`
}

type WSEvent struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for demo
	},
}

// Connection represents a WebSocket connection
type Connection struct {
	conn *websocket.Conn
	send chan []byte
	hub  *Hub
	mu   sync.Mutex
}

// Hub manages WebSocket connections
type Hub struct {
	connections map[*Connection]bool
	register    chan *Connection
	unregister  chan *Connection
	broadcast   chan []byte
	mu          sync.RWMutex
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		connections: make(map[*Connection]bool),
		register:    make(chan *Connection),
		unregister:  make(chan *Connection),
		broadcast:   make(chan []byte),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.register:
			h.mu.Lock()
			h.connections[conn] = true
			h.mu.Unlock()
			log.Printf("WebSocket client connected. Total: %d", len(h.connections))

		case conn := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.connections[conn]; ok {
				delete(h.connections, conn)
				close(conn.send)
			}
			h.mu.Unlock()
			log.Printf("WebSocket client disconnected. Total: %d", len(h.connections))

		case message := <-h.broadcast:
			h.mu.RLock()
			for conn := range h.connections {
				select {
				case conn.send <- message:
				default:
					delete(h.connections, conn)
					close(conn.send)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Global hub instance
var defaultHub = NewHub()

func init() {
	go defaultHub.Run()
}

// WebSocketHandler handles WebSocket connections
func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Connection{
		conn: conn,
		send: make(chan []byte, 256),
		hub:  defaultHub,
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}

// readPump handles incoming WebSocket messages
func (c *Connection) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		var msg WSMessage
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Route message to appropriate handler
		response := c.routeMessage(msg)

		// Send response back to client
		if err := c.conn.WriteJSON(response); err != nil {
			log.Printf("WebSocket write error: %v", err)
			break
		}
	}
}

// writePump handles outgoing WebSocket messages
func (c *Connection) writePump() {
	defer c.conn.Close()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}

// routeMessage routes WebSocket messages to appropriate API functions
func (c *Connection) routeMessage(msg WSMessage) WSResponse {
	ctx := context.Background()

	// Convert data to JSON bytes for unmarshaling
	dataBytes, err := json.Marshal(msg.Data)
	if err != nil {
		return WSResponse{
			ID:    msg.ID,
			Error: fmt.Sprintf("Invalid data format: %v", err),
		}
	}

	switch msg.Path {
	case "/createtodo":
		var req CreateTodoRequest
		if err := json.Unmarshal(dataBytes, &req); err != nil {
			return WSResponse{ID: msg.ID, Error: fmt.Sprintf("Invalid request: %v", err)}
		}

		resp, err := CreateTodo(ctx, req)
		if err != nil {
			return WSResponse{ID: msg.ID, Error: err.Error()}
		}
		return WSResponse{ID: msg.ID, Data: resp}

	case "/listtodos":
		var req ListTodosRequest
		if err := json.Unmarshal(dataBytes, &req); err != nil {
			return WSResponse{ID: msg.ID, Error: fmt.Sprintf("Invalid request: %v", err)}
		}

		resp, err := ListTodos(ctx, req)
		if err != nil {
			return WSResponse{ID: msg.ID, Error: err.Error()}
		}
		return WSResponse{ID: msg.ID, Data: resp}

	case "/gettodo":
		var req GetTodoRequest
		if err := json.Unmarshal(dataBytes, &req); err != nil {
			return WSResponse{ID: msg.ID, Error: fmt.Sprintf("Invalid request: %v", err)}
		}

		resp, err := GetTodo(ctx, req)
		if err != nil {
			return WSResponse{ID: msg.ID, Error: err.Error()}
		}
		return WSResponse{ID: msg.ID, Data: resp}

	case "/updatetodo":
		var req UpdateTodoRequest
		if err := json.Unmarshal(dataBytes, &req); err != nil {
			return WSResponse{ID: msg.ID, Error: fmt.Sprintf("Invalid request: %v", err)}
		}

		resp, err := UpdateTodo(ctx, req)
		if err != nil {
			return WSResponse{ID: msg.ID, Error: err.Error()}
		}

		// Broadcast update event to all connected clients
		c.broadcastEvent("todo_updated", resp.Todo)

		return WSResponse{ID: msg.ID, Data: resp}

	case "/deletetodo":
		var req DeleteTodoRequest
		if err := json.Unmarshal(dataBytes, &req); err != nil {
			return WSResponse{ID: msg.ID, Error: fmt.Sprintf("Invalid request: %v", err)}
		}

		resp, err := DeleteTodo(ctx, req)
		if err != nil {
			return WSResponse{ID: msg.ID, Error: err.Error()}
		}

		// Broadcast delete event to all connected clients
		c.broadcastEvent("todo_deleted", map[string]string{"id": req.ID})

		return WSResponse{ID: msg.ID, Data: resp}

	default:
		return WSResponse{
			ID:    msg.ID,
			Error: fmt.Sprintf("Unknown path: %s", msg.Path),
		}
	}
}

// broadcastEvent sends an event to all connected clients
func (c *Connection) broadcastEvent(event string, data interface{}) {
	eventMsg := WSEvent{
		Event: event,
		Data:  data,
	}

	eventBytes, err := json.Marshal(eventMsg)
	if err != nil {
		log.Printf("Error marshaling event: %v", err)
		return
	}

	c.hub.broadcast <- eventBytes
}

// BroadcastEvent allows external code to broadcast events
func BroadcastEvent(event string, data interface{}) {
	eventMsg := WSEvent{
		Event: event,
		Data:  data,
	}

	eventBytes, err := json.Marshal(eventMsg)
	if err != nil {
		log.Printf("Error marshaling event: %v", err)
		return
	}

	defaultHub.broadcast <- eventBytes
}
