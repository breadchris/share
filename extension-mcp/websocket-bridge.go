package extensionmcp

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"log/slog"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from browser extensions
		origin := r.Header.Get("Origin")
		return origin == "" || origin == "chrome-extension://" || origin == "moz-extension://"
	},
}

// WebSocketBridge manages the WebSocket connection to the browser extension
type WebSocketBridge struct {
	conn     *websocket.Conn
	mu       sync.RWMutex
	requests map[string]chan map[string]interface{}
	isConnected bool
}

var bridge *WebSocketBridge
var bridgeMu sync.RWMutex

// InitWebSocketBridge sets up the WebSocket endpoint for extension communication
func InitWebSocketBridge(mux *http.ServeMux) {
	mux.HandleFunc("/extension-ws", handleWebSocketConnection)
}

// handleWebSocketConnection handles incoming WebSocket connections from browser extensions
func handleWebSocketConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("WebSocket upgrade failed", "error", err)
		return
	}
	defer conn.Close()

	slog.Info("Browser extension connected via WebSocket")

	bridgeMu.Lock()
	bridge = &WebSocketBridge{
		conn:     conn,
		requests: make(map[string]chan map[string]interface{}),
		isConnected: true,
	}
	bridgeMu.Unlock()

	// Handle incoming messages from extension
	for {
		var message map[string]interface{}
		err := conn.ReadJSON(&message)
		if err != nil {
			slog.Error("WebSocket read error", "error", err)
			break
		}

		// Handle different message types
		if msgType, ok := message["type"].(string); ok {
			switch msgType {
			case "response":
				handleExtensionResponse(message)
			case "log":
				handleExtensionLog(message)
			case "notification":
				handleExtensionNotification(message)
			default:
				slog.Warn("Unknown message type from extension", "type", msgType)
			}
		}
	}

	// Clean up when connection closes
	bridgeMu.Lock()
	if bridge != nil {
		bridge.isConnected = false
		// Close all pending request channels
		for _, ch := range bridge.requests {
			close(ch)
		}
		bridge = nil
	}
	bridgeMu.Unlock()

	slog.Info("Browser extension disconnected")
}

// handleExtensionResponse processes response messages from the extension
func handleExtensionResponse(message map[string]interface{}) {
	requestID, ok := message["request_id"].(string)
	if !ok {
		slog.Warn("Extension response missing request_id")
		return
	}

	bridgeMu.RLock()
	if bridge != nil {
		bridge.mu.RLock()
		responseChan, exists := bridge.requests[requestID]
		bridge.mu.RUnlock()

		if exists {
			select {
			case responseChan <- message:
				// Response sent successfully
			case <-time.After(5 * time.Second):
				slog.Warn("Timeout sending response to waiting request", "request_id", requestID)
			}

			// Clean up the request channel
			bridge.mu.Lock()
			delete(bridge.requests, requestID)
			bridge.mu.Unlock()
		} else {
			slog.Warn("No waiting request found for response", "request_id", requestID)
		}
	}
	bridgeMu.RUnlock()
}

// handleExtensionLog processes log messages from the extension
func handleExtensionLog(message map[string]interface{}) {
	if level, ok := message["level"].(string); ok {
		if logMessage, ok := message["message"].(string); ok {
			switch level {
			case "error":
				slog.Error("Extension log", "message", logMessage)
			case "warn":
				slog.Warn("Extension log", "message", logMessage)
			case "info":
				slog.Info("Extension log", "message", logMessage)
			default:
				slog.Debug("Extension log", "level", level, "message", logMessage)
			}
		}
	}
}

// handleExtensionNotification processes notification messages from the extension
func handleExtensionNotification(message map[string]interface{}) {
	if notificationType, ok := message["notification_type"].(string); ok {
		slog.Info("Extension notification", "type", notificationType, "data", message["data"])
	}
}

// sendExtensionRequest sends a request to the browser extension and waits for response
func (s *ExtensionMCPServer) sendExtensionRequest(requestData map[string]interface{}) (map[string]interface{}, error) {
	bridgeMu.RLock()
	currentBridge := bridge
	bridgeMu.RUnlock()

	if currentBridge == nil || !currentBridge.isConnected {
		return nil, fmt.Errorf("no browser extension connected")
	}

	// Generate unique request ID
	requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())
	requestData["request_id"] = requestID
	requestData["type"] = "request"

	// Create response channel
	responseChan := make(chan map[string]interface{}, 1)
	
	currentBridge.mu.Lock()
	currentBridge.requests[requestID] = responseChan
	currentBridge.mu.Unlock()

	// Send request to extension
	currentBridge.mu.RLock()
	err := currentBridge.conn.WriteJSON(requestData)
	currentBridge.mu.RUnlock()

	if err != nil {
		// Clean up on send error
		currentBridge.mu.Lock()
		delete(currentBridge.requests, requestID)
		currentBridge.mu.Unlock()
		return nil, fmt.Errorf("failed to send request to extension: %v", err)
	}

	// Wait for response with timeout
	select {
	case response := <-responseChan:
		// Remove the WebSocket-specific fields from response
		if response["type"] != nil {
			delete(response, "type")
		}
		if response["request_id"] != nil {
			delete(response, "request_id")
		}
		return response, nil
	case <-time.After(30 * time.Second):
		// Clean up on timeout
		currentBridge.mu.Lock()
		delete(currentBridge.requests, requestID)
		currentBridge.mu.Unlock()
		return nil, fmt.Errorf("timeout waiting for extension response")
	}
}

// GetConnectionStatus returns the current WebSocket connection status
func GetConnectionStatus() map[string]interface{} {
	bridgeMu.RLock()
	defer bridgeMu.RUnlock()

	status := map[string]interface{}{
		"connected":       false,
		"pending_requests": 0,
	}

	if bridge != nil && bridge.isConnected {
		status["connected"] = true
		bridge.mu.RLock()
		status["pending_requests"] = len(bridge.requests)
		bridge.mu.RUnlock()
	}

	return status
}

// SendNotificationToExtension sends a notification to the browser extension
func SendNotificationToExtension(notificationType string, data interface{}) error {
	bridgeMu.RLock()
	currentBridge := bridge
	bridgeMu.RUnlock()

	if currentBridge == nil || !currentBridge.isConnected {
		return fmt.Errorf("no browser extension connected")
	}

	notification := map[string]interface{}{
		"type":              "notification",
		"notification_type": notificationType,
		"data":              data,
		"timestamp":         time.Now().Unix(),
	}

	currentBridge.mu.RLock()
	err := currentBridge.conn.WriteJSON(notification)
	currentBridge.mu.RUnlock()

	return err
}