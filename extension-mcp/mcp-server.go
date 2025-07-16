package extensionmcp

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	deps2 "github.com/breadchris/share/deps"
	"github.com/mark3labs/mcp-go/server"
)

// ExtensionMCPServer manages the MCP server for browser extension integration
type ExtensionMCPServer struct {
	deps deps2.Deps
	server *server.MCPServer
}

// New creates a new ExtensionMCPServer and sets up all the MCP tools
func New(deps deps2.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	
	// Create MCP server instance
	mcpServer := server.NewMCPServer(
		"browser-extension-mcp",
		"1.0.0",
		server.WithToolCapabilities(false),
	)
	
	extensionServer := &ExtensionMCPServer{
		deps: deps,
		server: mcpServer,
	}
	
	// Register all MCP tools
	extensionServer.registerTools()
	
	// Initialize WebSocket bridge for extension communication
	InitWebSocketBridge(mux)
	
	// Handle MCP requests over HTTP
	mux.HandleFunc("/stdio", func(w http.ResponseWriter, r *http.Request) {
		if err := server.ServeStdio(mcpServer); err != nil {
			slog.Error("MCP server error", "error", err)
			http.Error(w, fmt.Sprintf("MCP server error: %v", err), http.StatusInternalServerError)
		}
	})
	
	// Handle status endpoint
	mux.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		
		status := map[string]interface{}{
			"status":     "ready",
			"server":     "browser-extension-mcp",
			"version":    "1.0.0",
			"websocket":  GetConnectionStatus(),
		}
		
		if jsonData, err := json.Marshal(status); err == nil {
			w.Write(jsonData)
		} else {
			w.Write([]byte(`{"status":"ready","server":"browser-extension-mcp","version":"1.0.0","error":"failed to marshal status"}`))
		}
	})
	
	return mux
}

// registerTools registers all MCP tools with the server
func (s *ExtensionMCPServer) registerTools() {
	// Console log tools
	s.server.AddTool(NewGetConsoleLogsTool(), s.handleGetConsoleLogs)
	s.server.AddTool(NewClearConsoleLogsTool(), s.handleClearConsoleLogs)
	
	// Network monitoring tools
	s.server.AddTool(NewGetNetworkRequestsTool(), s.handleGetNetworkRequests)
	s.server.AddTool(NewGetRequestDetailsTool(), s.handleGetRequestDetails)
	
	// Tab management tools
	s.server.AddTool(NewListTabsTool(), s.handleListTabs)
	s.server.AddTool(NewConnectTabTool(), s.handleConnectTab)
	s.server.AddTool(NewGetTabInfoTool(), s.handleGetTabInfo)
}