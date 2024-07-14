package text

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/breadchris/share/yjs"
	"github.com/gorilla/websocket"
)

// Event represents a generic event from the client.
type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// SetNameEvent represents the data structure for a set name event.
type SetNameEvent struct {
	ClientID string `json:"client_id"`
	Name     string `json:"name"`
}

type Server struct {
	clients     map[string]*websocket.Conn
	clientNames map[string]string
	doc         *yjs.Document
	mutex       sync.Mutex
}

func NewServer() *Server {
	initialText := ""
	doc := yjs.NewTextDocument(&initialText)
	return &Server{
		clients:     make(map[string]*websocket.Conn),
		clientNames: make(map[string]string),
		doc:         doc,
	}
}

func (s *Server) AddClient(clientID string, conn *websocket.Conn) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.clients[clientID] = conn
}

func (s *Server) RemoveClient(clientID string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	delete(s.clients, clientID)
	delete(s.clientNames, clientID)
}

func (s *Server) BroadcastUpdate(update string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	for clientID, conn := range s.clients {
		err := conn.WriteMessage(websocket.TextMessage, []byte(update))
		if err != nil {
			log.Printf("Error sending update to client %s: %v", clientID, err)
		}
	}
}

func (s *Server) BroadcastEvent(event Event) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	for clientID, conn := range s.clients {
		err := conn.WriteJSON(event)
		if err != nil {
			log.Printf("Error sending event to client %s: %v", clientID, err)
		}
	}
}

func (s *Server) HandleSetName(event SetNameEvent) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.clientNames[event.ClientID] = event.Name

	// Broadcast the name change event to all clients
	s.BroadcastEvent(Event{
		Type: "nameChange",
		Data: event,
	})
}

func Setup(upgrader websocket.Upgrader) {
	server := NewServer()

	http.HandleFunc("/text/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("Error upgrading to WebSocket: %v", err)
			return
		}
		defer conn.Close()

		clientID := r.RemoteAddr
		server.AddClient(clientID, conn)
		defer server.RemoveClient(clientID)

		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Printf("Error reading message: %v", err)
				break
			}

			// Unmarshal the received message into an Event struct
			var event Event
			err = json.Unmarshal(message, &event)
			if err != nil {
				log.Printf("Error unmarshalling message: %v", err)
				continue
			}

			switch event.Type {
			case "setName":
				var setNameEvent SetNameEvent
				err = json.Unmarshal(message, &setNameEvent)
				if err != nil {
					log.Printf("Error unmarshalling setName event: %v", err)
					continue
				}
				setNameEvent.ClientID = clientID
				server.HandleSetName(setNameEvent)
			case "textUpdate":
				err = server.doc.ApplyUpdate(event.Data.(string))
				if err != nil {
					log.Printf("Error applying update: %v", err)
					break
				}

				update, err := server.doc.ToString()
				if err != nil {
					log.Printf("Error getting document state: %v", err)
					break
				}

				server.BroadcastUpdate(update)
			}
		}
	})
}
