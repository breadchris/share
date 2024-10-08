package game

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Color struct {
	H int `json:"h"`
	S int `json:"s"`
	L int `json:"l"`
}

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

var (
	players      = make(map[string]*Player)
	npcs         = make(map[string]*Player)
	playersMutex sync.Mutex
	projectiles  = make(map[string]*Projectile)

	// Colors for players
	colors = []Color{
		{H: 0, S: 100, L: 50},   // Red
		{H: 120, S: 100, L: 50}, // Green
		{H: 240, S: 100, L: 50}, // Blue
		{H: 60, S: 100, L: 50},  // Yellow
		{H: 180, S: 100, L: 50}, // Cyan
		{H: 300, S: 100, L: 50}, // Magenta
	}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Client struct {
	conn *websocket.Conn
	send chan []byte
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
}

var hub = Hub{
	clients:    make(map[*Client]bool),
	broadcast:  make(chan []byte),
	register:   make(chan *Client),
	unregister: make(chan *Client),
}

func Setup() {
	initializeNPCs() // Initialize NPCs before starting the server

	go hub.run()

	go gameLoop() // Start the game loop in a separate goroutine

	http.HandleFunc("/game/move", moveHandler)
	http.HandleFunc("/game", homeHandler)
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

func homeHandler(w http.ResponseWriter, r *http.Request) {
	// Assign a unique ID to the client if they don't have one
	cookie, err := r.Cookie("player_id")
	if err != nil || cookie.Value == "" {
		playerID := uuid.New().String()
		http.SetCookie(w, &http.Cookie{
			Name:  "player_id",
			Value: playerID,
		})
		// Initialize the player
		playersMutex.Lock()
		playersMutex.Unlock()
		// Save the position to a file
		savePosition(playerID)
	}

	page := MovementPage(players, npcs)
	os.WriteFile("page.html", []byte(page.Render()), 0644)
	http.ServeFile(w, r, "page.html")
}

func moveHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	client := &Client{conn: conn, send: make(chan []byte, 256)}
	hub.register <- client

	go client.writePump()
	client.readPump(w, r)
}

func (c *Client) readPump(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("player_id")
	if err != nil {
		fmt.Println("Player ID not found", http.StatusBadRequest)
		return
	}
	playerID := cookie.Value

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
		// Extract the chat_message field
		data, ok := msgMap["chat_message"]
		if !ok {
			log.Println("chat_message field not found")
			continue
		}
		// Get the command from the chat_message field
		command, ok := data.(string)
		if !ok {
			log.Println("chat_message is not a string")
			continue
		}

		updatePlayer(playerID, command)
		Draw()
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()
	for message := range c.send {
		err := c.conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Println("WriteMessage error:", err)
			break
		}
	}
}
