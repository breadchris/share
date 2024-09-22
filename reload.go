package main

import (
	"fmt"
	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

var webClients = make(map[*websocket.Conn]bool)
var broadcast = make(chan string)

func setupReload(filePath string) *http.ServeMux {
	go fileWatcher(filePath)
	mux := http.NewServeMux()
	mux.HandleFunc("/", wsHandler)
	return mux
}

func fileWatcher(fileToWatch string) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal(err)
	}
	defer watcher.Close()

	err = watcher.Add(fileToWatch)
	if err != nil {
		log.Fatal(err)
	}

	for {
		select {
		case event := <-watcher.Events:
			if event.Op&fsnotify.Write == fsnotify.Write {
				fmt.Println("File modified:", event.Name)
				notifyWebClients()
			}
		case err := <-watcher.Errors:
			log.Println("Error:", err)
		}
	}
}

func notifyWebClients() {
	for client := range webClients {
		err := client.WriteMessage(websocket.TextMessage, []byte("reload"))
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
