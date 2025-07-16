package generator

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Generate creates TypeScript API bindings from Go package
func Generate(config *Config) error {
	// Step 1: Parse Go package and extract types and functions
	info, err := analyzePackage(config.InputPath)
	if err != nil {
		return fmt.Errorf("failed to analyze package: %v", err)
	}

	// Step 2: Generate TypeScript types from Go structs and aliases
	typesContent := generateTypesFromAST(info)

	// Step 3: Generate API client functions
	clientContent := generateAPIClientFromFunctions(info.Functions, config.BaseURL)

	// Step 4: Generate WebSocket client (conditional)
	var wsClientContent string
	if config.EnableWebSocket {
		wsClientContent = generateWebSocketClient(info.Functions, config.BaseURL)
	}

	// Step 5: Generate Go handler registration code
	handlerContent := generateGoHandlerCode(info.Functions, config.BaseURL, config.EnableWebSocket)

	// Step 6: Generate WebSocket Go code (conditional)
	var wsGoContent string
	if config.EnableWebSocket {
		wsGoContent = generateWebSocketGoCode(info.Functions, config.BaseURL)
	}

	// Step 7: Write TypeScript API file
	outputFile := filepath.Join(config.OutputPath, "api.ts")
	tsContent := combineContent(typesContent, clientContent, wsClientContent, "")
	if err := os.WriteFile(outputFile, []byte(tsContent), 0644); err != nil {
		return fmt.Errorf("failed to write output file: %v", err)
	}

	// Step 8: Write Go handlers file
	handlersFile := filepath.Join(config.OutputPath, "handlers.go")
	if err := os.WriteFile(handlersFile, []byte(handlerContent), 0644); err != nil {
		return fmt.Errorf("failed to write handlers file: %v", err)
	}

	// Step 9: Write WebSocket Go file (conditional)
	if config.EnableWebSocket {
		wsGoFile := filepath.Join(config.OutputPath, "websocket.go")
		if err := os.WriteFile(wsGoFile, []byte(wsGoContent), 0644); err != nil {
			return fmt.Errorf("failed to write websocket file: %v", err)
		}
	}

	return nil
}

// PackageInfo holds all extracted information from Go package
type PackageInfo struct {
	StructTypes map[string]*ast.StructType
	TypeAliases map[string]ast.Expr
	Constants   map[string][]string
	Functions   []FunctionInfo
}

// analyzePackage parses Go package and extracts both struct types and API functions
func analyzePackage(inputPath string) (*PackageInfo, error) {
	fset := token.NewFileSet()
	pkgs, err := parser.ParseDir(fset, inputPath, nil, parser.ParseComments)
	if err != nil {
		return nil, fmt.Errorf("failed to parse package: %v", err)
	}

	info := &PackageInfo{
		StructTypes: make(map[string]*ast.StructType),
		TypeAliases: make(map[string]ast.Expr),
		Constants:   make(map[string][]string),
		Functions:   []FunctionInfo{},
	}

	// Extract struct types, type aliases, constants, and function information
	for _, pkg := range pkgs {
		for fileName, file := range pkg.Files {
			ast.Inspect(file, func(n ast.Node) bool {
				switch node := n.(type) {
				case *ast.GenDecl:
					// Extract types and constants
					for _, spec := range node.Specs {
						switch s := spec.(type) {
						case *ast.TypeSpec:
							if structType, ok := s.Type.(*ast.StructType); ok {
								info.StructTypes[s.Name.Name] = structType
							} else {
								// Type alias
								info.TypeAliases[s.Name.Name] = s.Type
							}
						case *ast.ValueSpec:
							// Constants
							if node.Tok == 85 { // CONST token
								for i, _ := range s.Names {
									if i < len(s.Values) {
										if lit, ok := s.Values[i].(*ast.BasicLit); ok {
											typeName := ""
											if s.Type != nil {
												typeName = getTypeString(s.Type)
											}
											if typeName != "" {
												info.Constants[typeName] = append(info.Constants[typeName], strings.Trim(lit.Value, `"`))
											}
										}
									}
								}
							}
						}
					}
				case *ast.FuncDecl:
					// Extract API functions with file location
					if funcInfo := extractFunctionInfo(node, fset, fileName); funcInfo != nil {
						info.Functions = append(info.Functions, *funcInfo)
					}
				}
				return true
			})
		}
	}

	return info, nil
}

// extractFunctionInfo extracts function info from AST
func extractFunctionInfo(funcDecl *ast.FuncDecl, fset *token.FileSet, fileName string) *FunctionInfo {
	// Determine the parameter index for the request type
	// Skip context.Context parameter if it's the first parameter
	paramStartIndex := 0
	totalParams := funcDecl.Type.Params.NumFields()
	
	if totalParams > 1 && isContextType(funcDecl.Type.Params.List[0].Type) {
		paramStartIndex = 1
	}

	// Check if function matches pattern: 
	// func Name([ctx context.Context,] req Type) (resp Type, error)
	expectedParams := 1 + paramStartIndex
	if totalParams != expectedParams || funcDecl.Type.Results.NumFields() != 2 {
		return nil
	}

	// Check if second return type is error
	if len(funcDecl.Type.Results.List) < 2 {
		return nil
	}

	if ident, ok := funcDecl.Type.Results.List[1].Type.(*ast.Ident); !ok || ident.Name != "error" {
		return nil
	}

	funcName := funcDecl.Name.Name
	reqType := getTypeString(funcDecl.Type.Params.List[paramStartIndex].Type)
	respType := getTypeString(funcDecl.Type.Results.List[0].Type)

	// Get file location information
	pos := fset.Position(funcDecl.Pos())
	
	return &FunctionInfo{
		Name:         funcName,
		RequestType:  reqType,
		ResponseType: respType,
		Endpoint:     strings.ToLower(funcName),
		FilePath:     fileName,
		LineNumber:   pos.Line,
	}
}

// isContextType checks if the given AST expression represents context.Context
func isContextType(expr ast.Expr) bool {
	switch t := expr.(type) {
	case *ast.SelectorExpr:
		// Check for context.Context
		if ident, ok := t.X.(*ast.Ident); ok {
			return ident.Name == "context" && t.Sel.Name == "Context"
		}
	case *ast.Ident:
		// Check for imported context as Context (less common)
		return t.Name == "Context"
	}
	return false
}

// getTypeString converts AST type to string
func getTypeString(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.SelectorExpr:
		return fmt.Sprintf("%s.%s", getTypeString(t.X), t.Sel.Name)
	case *ast.StarExpr:
		return getTypeString(t.X)
	default:
		return "unknown"
	}
}

// generateTypesFromAST generates TypeScript interfaces from Go struct AST
func generateTypesFromAST(info *PackageInfo) string {
	var sb strings.Builder

	sb.WriteString("// Generated TypeScript API bindings\n")
	sb.WriteString("// DO NOT EDIT - This file is automatically generated\n\n")

	// Generate type aliases first
	for name, typeExpr := range info.TypeAliases {
		sb.WriteString(fmt.Sprintf("export type %s = ", name))
		writeTypeScript(&sb, typeExpr)
		sb.WriteString(";\n\n")
	}

	// Generate interfaces for each struct
	for name, structType := range info.StructTypes {
		sb.WriteString(fmt.Sprintf("export interface %s {\n", name))
		writeFields(&sb, structType.Fields.List, "    ")
		sb.WriteString("}\n\n")
	}

	return sb.String()
}

// writeFields writes TypeScript fields from Go struct fields
func writeFields(sb *strings.Builder, fields []*ast.Field, indent string) {
	validJSNameRegexp := regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

	for _, field := range fields {
		// Skip unexported fields
		if len(field.Names) == 0 || len(field.Names[0].Name) == 0 || field.Names[0].Name[0] < 'A' || field.Names[0].Name[0] > 'Z' {
			continue
		}

		fieldName := field.Names[0].Name
		optional := false
		var tsName string

		// Check for json tag
		if field.Tag != nil {
			tagValue := field.Tag.Value
			if strings.Contains(tagValue, "json:") {
				// Simple json tag parsing
				start := strings.Index(tagValue, `json:"`) + 6
				if start > 5 {
					end := strings.Index(tagValue[start:], `"`)
					if end > 0 {
						jsonTag := tagValue[start : start+end]
						if jsonTag == "-" {
							continue // Skip fields with json:"-"
						}
						parts := strings.Split(jsonTag, ",")
						tsName = parts[0]
						for _, part := range parts[1:] {
							if part == "omitempty" {
								optional = true
							}
						}
					}
				}
			}
		}

		if tsName == "" {
			tsName = fieldName
		}

		// Handle pointer types as optional
		if _, isPointer := field.Type.(*ast.StarExpr); isPointer {
			optional = true
		}

		sb.WriteString(indent)

		// Quote field name if it's not a valid JS identifier
		if !validJSNameRegexp.MatchString(tsName) {
			sb.WriteString(fmt.Sprintf(`"%s"`, tsName))
		} else {
			sb.WriteString(tsName)
		}

		if optional {
			sb.WriteString("?")
		}

		sb.WriteString(": ")
		writeTypeScript(sb, field.Type)
		sb.WriteString(";\n")
	}
}

// writeTypeScript converts Go AST type to TypeScript type
func writeTypeScript(sb *strings.Builder, expr ast.Expr) {
	switch t := expr.(type) {
	case *ast.Ident:
		switch t.Name {
		case "bool":
			sb.WriteString("boolean")
		case "int", "int8", "int16", "int32", "int64", "uint", "uint8", "uint16", "uint32", "uint64", "float32", "float64":
			sb.WriteString("number")
		case "string":
			sb.WriteString("string")
		default:
			sb.WriteString(t.Name)
		}
	case *ast.ArrayType:
		// Check for []byte -> string
		if ident, ok := t.Elt.(*ast.Ident); ok && ident.Name == "byte" {
			sb.WriteString("string")
		} else {
			writeTypeScript(sb, t.Elt)
			sb.WriteString("[]")
		}
	case *ast.StarExpr:
		writeTypeScript(sb, t.X)
		sb.WriteString(" | undefined")
	case *ast.SelectorExpr:
		// Handle qualified types like time.Time
		qualifier := getTypeString(t.X)
		typeName := t.Sel.Name
		switch qualifier + "." + typeName {
		case "time.Time":
			sb.WriteString("string")
		default:
			sb.WriteString(qualifier + "." + typeName)
		}
	case *ast.MapType:
		sb.WriteString("{ [key: ")
		writeTypeScript(sb, t.Key)
		sb.WriteString("]: ")
		writeTypeScript(sb, t.Value)
		sb.WriteString(" }")
	case *ast.InterfaceType:
		sb.WriteString("any")
	default:
		sb.WriteString("any")
	}
}

// generateAPIClientFromFunctions generates TypeScript API client functions
func generateAPIClientFromFunctions(functions []FunctionInfo, baseURL string) string {
	var sb strings.Builder

	// Write interfaces for fetch options and response
	sb.WriteString(`
// API Client Functions

export interface FetchOptions {
    baseURL?: string;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface Response<T> {
    data: T;
    status: number;
    statusText: string;
}

`)

	// Generate individual API functions
	for _, fn := range functions {
		// Add IDE navigation comment
		sb.WriteString(fmt.Sprintf(`// Go: file://%s:%d
export async function %s(req: %s, options: FetchOptions = {}): Promise<Response<%s>> {
    const url = `+"`${options.baseURL || '%s'}/%s`"+`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        throw new Error(`+"`HTTP error! status: ${response.status}`"+`);
    }

    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText
    };
}

`, fn.FilePath, fn.LineNumber, fn.Name, fn.RequestType, fn.ResponseType, baseURL, fn.Endpoint))
	}

	return sb.String()
}

// generateWebSocketClient generates TypeScript WebSocket client
func generateWebSocketClient(functions []FunctionInfo, baseURL string) string {
	var sb strings.Builder

	sb.WriteString(`
// WebSocket Client

export interface WSMessage {
    id: string;
    path: string;
    data: any;
}

export interface WSResponse {
    id: string;
    data?: any;
    error?: string;
}

export interface WSEvent {
    event: string;
    data: any;
}

export type EventHandler<T = any> = (data: T) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private reconnectInterval = 1000;
    private maxReconnectInterval = 30000;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
    private eventHandlers = new Map<string, EventHandler[]>();
    private url: string;

    constructor(baseURL: string = '` + baseURL + `') {
        this.url = baseURL.replace(/^http/, 'ws') + '/ws';
        this.connect();
    }

    private connect(): void {
        try {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.reconnectInterval = 1000;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.id) {
                        // Response to a request
                        const pending = this.pendingRequests.get(data.id);
                        if (pending) {
                            this.pendingRequests.delete(data.id);
                            if (data.error) {
                                pending.reject(new Error(data.error));
                            } else {
                                pending.resolve(data.data);
                            }
                        }
                    } else if (data.event) {
                        // Server event
                        this.handleEvent(data);
                    }
                } catch (err) {
                    console.error('WebSocket message parse error:', err);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.handleDisconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.handleDisconnect();
        }
    }

    private handleDisconnect(): void {
        this.ws = null;
        
        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
            reject(new Error('WebSocket disconnected'));
        });
        this.pendingRequests.clear();

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(` + "`Reconnecting WebSocket (attempt ${this.reconnectAttempts})`" + `);
                this.connect();
            }, this.reconnectInterval);
            
            // Exponential backoff
            this.reconnectInterval = Math.min(
                this.reconnectInterval * 2,
                this.maxReconnectInterval
            );
        }
    }

    private handleEvent(event: WSEvent): void {
        const handlers = this.eventHandlers.get(event.event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event.data);
                } catch (err) {
                    console.error(` + "`Event handler error for ${event.event}:`" + `, err);
                }
            });
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    private sendMessage<T>(path: string, data: any): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const id = this.generateId();
            const message: WSMessage = { id, path, data };

            this.pendingRequests.set(id, { resolve, reject });

            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                this.pendingRequests.delete(id);
                reject(error);
            }
        });
    }

    // Event subscription methods
    on<T = any>(event: string, handler: EventHandler<T>): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(handler);
    }

    off<T = any>(event: string, handler: EventHandler<T>): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    // Close the WebSocket connection
    close(): void {
        this.maxReconnectAttempts = 0; // Prevent reconnection
        if (this.ws) {
            this.ws.close();
        }
    }

    // Check if WebSocket is connected
    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

`)

	// Generate WebSocket API methods
	for _, fn := range functions {
		sb.WriteString(fmt.Sprintf(`    // WebSocket version of %s
    async %s(req: %s): Promise<%s> {
        return this.sendMessage<%s>('/%s', req);
    }

`, fn.Name, strings.ToLower(fn.Name[:1])+fn.Name[1:], fn.RequestType, fn.ResponseType, fn.ResponseType, fn.Endpoint))
	}

	sb.WriteString(`}

// Create a singleton WebSocket client instance
export const wsClient = new WebSocketClient();

`)

	return sb.String()
}

// generateWebSocketGoCode generates the complete websocket.go file
func generateWebSocketGoCode(functions []FunctionInfo, baseURL string) string {
	var sb strings.Builder

	// Package declaration and imports
	sb.WriteString(`package user

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
	ID   string      ` + "`json:\"id\"`" + `
	Path string      ` + "`json:\"path\"`" + `
	Data interface{} ` + "`json:\"data\"`" + `
}

type WSResponse struct {
	ID    string      ` + "`json:\"id\"`" + `
	Data  interface{} ` + "`json:\"data,omitempty\"`" + `
	Error string      ` + "`json:\"error,omitempty\"`" + `
}

type WSEvent struct {
	Event string      ` + "`json:\"event\"`" + `
	Data  interface{} ` + "`json:\"data\"`" + `
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for demo
	},
}

// Connection represents a WebSocket connection
type Connection struct {
	conn   *websocket.Conn
	send   chan []byte
	hub    *Hub
	mu     sync.Mutex
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
`)

	// Generate routing cases for each function
	for _, fn := range functions {
		sb.WriteString(fmt.Sprintf(`	case "/%s":
		var req %s
		if err := json.Unmarshal(dataBytes, &req); err != nil {
			return WSResponse{ID: msg.ID, Error: fmt.Sprintf("Invalid request: %%v", err)}
		}
		
		resp, err := %s(ctx, req)
		if err != nil {
			return WSResponse{ID: msg.ID, Error: err.Error()}
		}
		
`, fn.Endpoint, fn.RequestType, fn.Name))

		// Add event broadcasting for state-changing operations
		if strings.Contains(strings.ToLower(fn.Name), "update") {
			sb.WriteString(fmt.Sprintf(`		// Broadcast update event to all connected clients
		c.broadcastEvent("%s_updated", resp)
		
`, strings.ToLower(fn.Name[:len(fn.Name)-6]))) // Remove "Update" suffix
		} else if strings.Contains(strings.ToLower(fn.Name), "delete") {
			sb.WriteString(fmt.Sprintf(`		// Broadcast delete event to all connected clients
		c.broadcastEvent("%s_deleted", map[string]string{"id": req.ID})
		
`, strings.ToLower(fn.Name[:len(fn.Name)-6]))) // Remove "Delete" suffix
		}

		sb.WriteString(`		return WSResponse{ID: msg.ID, Data: resp}

`)
	}

	sb.WriteString(`	default:
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
`)

	return sb.String()
}

// generateGoHandlerCode generates Go code for registering HTTP handlers
func generateGoHandlerCode(functions []FunctionInfo, baseURL string, enableWebSocket bool) string {
	var sb strings.Builder

	sb.WriteString(`package user

import (
	"context"
	"encoding/json"
	"net/http"
	
	"github.com/breadchris/share/pkg/httpcontext"
)

// RegisterHandlers registers all HTTP API endpoints with the provided ServeMux
func RegisterHandlers(mux *http.ServeMux) {
`)

	// Generate handler registration for each function
	for _, fn := range functions {
		sb.WriteString(fmt.Sprintf(`	mux.HandleFunc("%s/%s", handle%s)
`, baseURL, fn.Endpoint, fn.Name))
	}

	sb.WriteString(`}

// HTTP handler functions
`)

	// Generate individual handler functions
	for _, fn := range functions {
		sb.WriteString(fmt.Sprintf(`
func handle%s(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req %s
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Create context with HTTP request and response writer
	ctx := httpcontext.WithHTTP(context.Background(), w, r)

	// Call the API function
	resp, err := %s(ctx, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
`, fn.Name, fn.RequestType, fn.Name))
	}

	// Conditionally add WebSocket registration
	if enableWebSocket {
		sb.WriteString(`
// RegisterWebSocketHandler registers the WebSocket endpoint
func RegisterWebSocketHandler(mux *http.ServeMux) {
	mux.HandleFunc("` + baseURL + `/ws", WebSocketHandler)
}
`)
	}

	return sb.String()
}

// combineContent merges types, API client, WebSocket client, and Go handler code into single file
func combineContent(typesContent, clientContent, wsClientContent, handlerContent string) string {
	return typesContent + clientContent + wsClientContent + handlerContent
}