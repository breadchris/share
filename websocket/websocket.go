package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"reflect"
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

type CommandFunc func(string, string, bool) []string
type CommandFunc2 func(string, *Hub, map[string]interface{})
type GenericCommandFunc func(interface{}, http.ResponseWriter, *http.Request) []string

type CommandRegistry struct {
	handlers  map[string]CommandFunc
	handlers2 map[string]GenericCommandFunc
	handlers3 map[string]CommandFunc2
	Types     map[string]interface{}
	mu        sync.RWMutex
}

func NewCommandRegistry() *CommandRegistry {
	return &CommandRegistry{
		handlers:  make(map[string]CommandFunc),
		handlers2: make(map[string]GenericCommandFunc),
		handlers3: make(map[string]CommandFunc2),
		Types:     make(map[string]interface{}),
	}
}

func (cr *CommandRegistry) Register(command string, handler CommandFunc) {
	cr.mu.Lock()
	defer cr.mu.Unlock()
	cr.handlers[command] = handler
}

func (cr *CommandRegistry) Register2(command string, handler CommandFunc2) {
	cr.mu.Lock()
	defer cr.mu.Unlock()
	fmt.Println("Registering command", command)
	cr.handlers3[command] = handler
}

func (cr *CommandRegistry) RegisterGeneric(input interface{}, handler GenericCommandFunc) {
	command := getType(input)
	cr.mu.Lock()
	defer cr.mu.Unlock()
	cr.Types[command] = input

	if handler != nil {
		fmt.Println("handler is not nil")
		cr.handlers2[command] = handler
	} else {
		fmt.Println("handler is nil")
		cr.handlers2[command] = func(input interface{}, w http.ResponseWriter, r *http.Request) []string {
			fmt.Println("input", input)
			return []string{
				Div(Id("content-container"), TypeToForm(input)).Render(),
			}
		}
	}
}

type WebsocketClient struct {
	conn     *websocket.Conn
	send     chan []byte
	registry *CommandRegistry
}

type Hub struct {
	clients    map[*WebsocketClient]bool
	Broadcast  chan []byte
	register   chan *WebsocketClient
	unregister chan *WebsocketClient
	mu         sync.Mutex
}

var hub = Hub{
	clients:    make(map[*WebsocketClient]bool),
	Broadcast:  make(chan []byte),
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
	fmt.Println("WebsocketUI")
	go hub.run()
	SetupHandlers(registry)
	mux := http.NewServeMux()

	mux.HandleFunc("/ws", websocketHandler2(registry))

	mux.HandleFunc("/load", func(w http.ResponseWriter, r *http.Request) {

	})

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
	registry.Register("1", func(message string, pageId string, isMobile bool) []string {
		return []string{
			Div(
				Id("container-1"),
				Attr("hx-swap-oob", "innerHTML"),
				T("container 1"),
			).Render(),
		}
	})

	registry.Register("2", func(message string, pageId string, isMobile bool) []string {
		return []string{
			Div(
				Id("container-2"),
				Attr("hx-swap-oob", "innerHTML"),
				T("container 2"),
			).Render(),
		}
	})

	registry.Register("ping", func(message string, pageId string, isMobile bool) []string {
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
		case message := <-h.Broadcast:
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

func (c *WebsocketClient) readPump3(w http.ResponseWriter, r *http.Request) {
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

		fmt.Println("msgMap", msgMap)
		delete(msgMap, "HEADERS")

		for key, value := range msgMap {
			fmt.Println(fmt.Sprintf("key: %s, value: %s", key, value))
			c.registry.mu.RLock()
			handler, ok := c.registry.handlers3[key]
			c.registry.mu.RUnlock()
			if ok {
				fmt.Println("key", key)
				fmt.Println("value", value)
				handler(value.(string), &hub, msgMap)
			}
		}

		// for _, cmdMsg := range cmdMsgs {
		// 	hub.Broadcast <- []byte(cmdMsg)
		// 	// c.send <- []byte(cmdMsg)
		// }
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
		// client.readPump(w, r)
		// client.readPump2(w, r)
		client.readPump3(w, r)
	}
}

func getType[T any](myvar T) string {
	if t := reflect.TypeOf(myvar); t.Kind() == reflect.Ptr {
		return "*" + t.Elem().Name()
	} else {
		return t.Name()
	}
}

func TypeToForm[F any](input F) *Node {
	fields := GetFieldsWithTypeAndValue(input)

	// idStr := ""
	// if id, ok := fields["ID"]; ok {
	// 	delete(fields, "ID")
	// 	idStr = id.Value.(string)
	// }

	typeName := getType(input)

	form := Form(
		Id(typeName),
		Attr("ws-send", "submit"),
		Input(
			Type("text"),
			Attr("hidden", ""),
			Name("typeName"),
			Value(typeName),
		),
	)

	for field := range fields {
		// fieldDetail := fields[field]
		// fmt.Println(fieldDetail.Value)
		form.Children = append(form.Children,
			Label(T(field)),
			Input(
				Class("toggle"),
				Type("checkbox"),
				Name(field),
			),
		)
	}
	form.Children = append(form.Children, Input(
		Class("mt-4 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"),
		Type("submit"),
		Value("Submit"),
	),
	)
	return form
}

type FieldDetail struct {
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
}

func GetFieldsWithTypeAndValue[T any](input T) map[string]FieldDetail {
	fieldsWithDetails := make(map[string]FieldDetail)

	// Get the type and value of the input
	val := reflect.ValueOf(input)
	typ := reflect.TypeOf(input)

	// Ensure the input is a struct or a pointer to a struct
	if val.Kind() == reflect.Ptr {
		val = val.Elem() // Dereference pointer
		typ = typ.Elem() // Get the underlying struct type
	}

	if val.Kind() != reflect.Struct {
		return nil // Not a struct, return nil
	}

	// Iterate through the fields
	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		fieldValue := val.Field(i)

		// Handle unexported fields
		if !fieldValue.CanInterface() {
			continue
		}

		// Add field details
		fieldsWithDetails[field.Name] = FieldDetail{
			Type:  field.Type.String(),
			Value: fieldValue.Interface(),
		}
	}

	return fieldsWithDetails
}

func SetFieldsWithTypeAndValue[T any](input T, fields map[string]FieldDetail) T {
	// Get the type and value of the input
	val := reflect.ValueOf(input)
	typ := reflect.TypeOf(input)

	// Ensure the input is a struct or a pointer to a struct
	if val.Kind() == reflect.Ptr {
		val = val.Elem() // Dereference pointer
		typ = typ.Elem() // Get the underlying struct type
	}

	if val.Kind() != reflect.Struct {
		return input // Not a struct, return nil
	}

	// Iterate through the fields
	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		fieldValue := val.Field(i)

		// Handle unexported fields
		if !fieldValue.CanInterface() {
			continue
		}

		// Add field details
		if fieldDetail, ok := fields[field.Name]; ok {
			if fieldDetail.Value == nil {
				fieldDetail.Value = ""
				log.Println("fieldDetail.Value is nil")
			}
			if fieldDetail.Value == "" {
				log.Println("fieldDetail.Value is empty")
			} else {
				fieldValue.Set(reflect.ValueOf(fieldDetail.Value))
			}
		}
	}

	return input
}
