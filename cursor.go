package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// Event represents a generic event from the client.
type Event struct {
	ClientID string      `json:"client_id"`
	Type     string      `json:"type"`
	Data     interface{} `json:"data"`
	Color    string      `json:"color"`
}

// Client represents a connected client.
type Client struct {
	ID    string
	Conn  *websocket.Conn
	Color string
}

// Server maintains the set of active clients and broadcasts messages to them.
type Server struct {
	Clients  map[string]*Client
	Mutex    sync.Mutex
	Colors   []string
	ColorIdx int
}

// NewServer creates a new Server instance.
func NewServer() *Server {
	colors := []string{"red", "blue", "green", "purple", "orange", "yellow", "pink", "cyan"}
	return &Server{
		Clients:  make(map[string]*Client),
		Colors:   colors,
		ColorIdx: 0,
	}
}

// AddClient adds a new client to the server.
func (s *Server) AddClient(client *Client) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	client.Color = s.Colors[s.ColorIdx%len(s.Colors)]
	s.ColorIdx++
	s.Clients[client.ID] = client
}

// RemoveClient removes a client from the server.
func (s *Server) RemoveClient(clientID string) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	delete(s.Clients, clientID)
}

// BroadcastEvent sends the event to all connected clients.
func (s *Server) BroadcastEvent(event Event) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	for _, client := range s.Clients {
		if client.ID != event.ClientID {
			err := client.Conn.WriteJSON(event)
			if err != nil {
				log.Printf("Error sending event to client %s: %v", client.ID, err)
			}
		}
	}
}

func setupCursor() {
	server := NewServer()
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("Error upgrading to WebSocket: %v", err)
			return
		}
		defer conn.Close()

		clientID := r.RemoteAddr
		client := &Client{ID: clientID, Conn: conn}
		server.AddClient(client)
		defer server.RemoveClient(clientID)

		for {
			var event Event
			err := conn.ReadJSON(&event)
			if err != nil {
				log.Printf("Error reading event: %v", err)
				break
			}
			event.ClientID = clientID
			event.Color = client.Color
			server.BroadcastEvent(event)
		}
	})
}
