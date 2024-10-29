package main

import (
	"log"
	"net/http"
	"sync"

	. "github.com/breadchris/share/html"
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
	http.HandleFunc("/cursors", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Script(T(`
var ws = new WebSocket("ws://" + window.location.host + "/cursors/ws");

var cursors = {};

ws.onmessage = function(event) {
    var data = JSON.parse(event.data);
    var cursor = cursors[data.client_id];

    if (!cursor) {
        // Create a new cursor if it doesn't exist
        var cursorElement = document.createElement("div");
        cursorElement.id = data.client_id;
        cursorElement.style.position = "absolute";
        cursorElement.style.width = "10px";
        cursorElement.style.height = "10px";
        cursorElement.style.borderRadius = "50%";
        cursorElement.style.backgroundColor = data.color;
        document.body.appendChild(cursorElement);

        cursor = cursors[data.client_id] = {
            element: cursorElement,
            currentX: data.data.x,
            currentY: data.data.y,
            targetX: data.data.x,
            targetY: data.data.y,
        };
    }

    // Update the target position
    cursor.targetX = data.data.x;
    cursor.targetY = data.data.y;
};

// Smoothly transition the cursor positions
function smoothMove() {
    Object.keys(cursors).forEach(function(clientId) {
        var cursor = cursors[clientId];
        // Calculate the difference between the current and target positions
        var dx = cursor.targetX - cursor.currentX;
        var dy = cursor.targetY - cursor.currentY;

        // Apply a smoothing factor (e.g., 0.1) to make the movement gradual
        cursor.currentX += dx * 0.1;
        cursor.currentY += dy * 0.1;

        // Update the cursor's position on the page
        cursor.element.style.left = cursor.currentX + "px";
        cursor.element.style.top = cursor.currentY + "px";
    });

    // Continue the animation loop
    requestAnimationFrame(smoothMove);
}

// Start the animation loop
smoothMove();

// touch
document.addEventListener("touchmove", function(event) {
	  ws.send(JSON.stringify({
	    type: "mousemove",
	    data: {x: event.touches[0].clientX, y: event.touches[0].clientY}
	  }));
});

document.addEventListener("mousemove", function(event) {
	  ws.send(JSON.stringify({
	    type: "mousemove",
	    data: {x: event.clientX, y: event.clientY}
	  }));
});

document.addEventListener("keydown", function(event) {
	  ws.send(JSON.stringify({
	    type: "keydown",
	    data: {key: event.key}
	  }));
});

document.addEventListener("keyup", function(event) {
	  ws.send(JSON.stringify({
	    type: "keyup",
	    data: {key: event.key}
	  }));
});

document.addEventListener("click", function(event) {
	  ws.send(JSON.stringify({
	    type: "click",
	    data: {x: event.clientX, y: event.clientY}
	  }));
});
`)),
			),
		).RenderPage(w, r)
	})
	http.HandleFunc("/cursors/ws", func(w http.ResponseWriter, r *http.Request) {
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
