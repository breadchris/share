package wasmcode

import (
	"github.com/breadchris/share/llm"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"net/url"
)

func WSProxy(w http.ResponseWriter, r *http.Request) {
	clientConn, err := llm.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading WebSocket for client: %v", err)
		return
	}
	defer clientConn.Close()

	u, err := url.Parse("ws://localhost:1234")
	if err != nil {
		log.Printf("Error parsing WebSocket server URL: %v", err)
		return
	}

	serverConn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		log.Printf("Error connecting to WebSocket server: %v", err)
		return
	}
	defer serverConn.Close()

	done := make(chan struct{})

	go func() {
		copyWebSocket(clientConn, serverConn)
	}()

	go func() {
		copyWebSocket(serverConn, clientConn)
	}()

	<-done
}

func copyWebSocket(src, dst *websocket.Conn) {
	for {
		messageType, message, err := src.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err) {
				log.Printf("Unexpected WebSocket close error: %v", err)
			}
		}

		err = dst.WriteMessage(messageType, message)
		if err != nil {
			log.Printf("Error writing message to WebSocket: %v", err)
		}
	}
}
