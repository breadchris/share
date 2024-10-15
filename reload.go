package main

import (
	"encoding/json"
	"fmt"
	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

var webClients = make(map[*websocket.Conn]bool)
var broadcast = make(chan string)

func setupReload(filePaths []string) *http.ServeMux {
	go fileWatcher(filePaths)
	mux := http.NewServeMux()
	mux.HandleFunc("/", wsHandler)
	return mux
}

func fileWatcher(filePaths []string) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal(err)
	}
	defer watcher.Close()

	for _, fileToWatch := range filePaths {
		err = watcher.Add(fileToWatch)
		if err != nil {
			log.Fatal(err)
		}
	}

	for {
		select {
		case event := <-watcher.Events:
			if event.Op&fsnotify.Write == fsnotify.Write {
				fmt.Println("File modified:", event.Name)
				notifyWebClients(event.Name)
			}
		case err := <-watcher.Errors:
			log.Println("Error:", err)
		}
	}
}

type WebSocketMessage struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

func notifyWebClients(fileName string) {
	msg := WebSocketMessage{
		Type: "reload",
		Data: fileName,
	}

	b, err := json.Marshal(msg)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}

	for client := range webClients {
		err := client.WriteMessage(websocket.TextMessage, b)
		if err != nil {
			log.Println("Write error:", err)
			client.Close()
			delete(webClients, client)
		}
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	webClients[conn] = true

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			delete(webClients, conn)
			break
		}
	}
}
