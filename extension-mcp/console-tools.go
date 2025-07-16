package extensionmcp

import (
	"context"
	"fmt"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
)

// ConsoleLogEntry represents a single console log entry
type ConsoleLogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Message   string    `json:"message"`
	URL       string    `json:"url"`
	TabID     int       `json:"tab_id"`
	Source    string    `json:"source,omitempty"`
}

// NewGetConsoleLogsTool creates the get-console-logs MCP tool
func NewGetConsoleLogsTool() mcp.Tool {
	return mcp.NewTool("get-console-logs",
		mcp.WithDescription("Get recent console log entries from the currently connected browser tab"),
		mcp.WithString("tab_id",
			mcp.Description("Optional tab ID to get logs from. If not provided, uses the currently active tab"),
		),
		mcp.WithString("log_level",
			mcp.Description("Filter logs by level: 'log', 'warn', 'error', 'info', 'debug'. If not provided, returns all levels"),
		),
		mcp.WithNumber("limit",
			mcp.Description("Maximum number of log entries to return (default: 50, max: 500)"),
		),
		mcp.WithString("since",
			mcp.Description("ISO timestamp to get logs since (e.g., '2025-01-16T10:00:00Z'). If not provided, returns recent logs"),
		),
	)
}

// handleGetConsoleLogs handles the get-console-logs tool request
func (s *ExtensionMCPServer) handleGetConsoleLogs(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	tabID := request.GetString("tab_id", "")
	logLevel := request.GetString("log_level", "")
	limit := request.GetInt("limit", 50)
	since := request.GetString("since", "")
	
	// Validate limit
	if limit > 500 {
		limit = 500
	}
	if limit < 1 {
		limit = 50
	}
	
	// Parse since timestamp if provided
	var sinceTime *time.Time
	if since != "" {
		if parsedTime, err := time.Parse(time.RFC3339, since); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("Invalid timestamp format for 'since': %s. Use ISO format like '2025-01-16T10:00:00Z'", since)), nil
		} else {
			sinceTime = &parsedTime
		}
	}
	
	// Send request to extension via WebSocket
	request_data := map[string]interface{}{
		"action": "get_console_logs",
		"tab_id": tabID,
		"log_level": logLevel,
		"limit": limit,
	}
	
	if sinceTime != nil {
		request_data["since"] = sinceTime.Unix()
	}
	
	response, err := s.sendExtensionRequest(request_data)
	if err != nil {
		return nil, fmt.Errorf("failed to get console logs from extension: %v", err)
	}
	
	// Parse response
	var logs []ConsoleLogEntry
	if response["success"] == true {
		if logsData, ok := response["logs"].([]interface{}); ok {
			for _, logData := range logsData {
				if logMap, ok := logData.(map[string]interface{}); ok {
					entry := ConsoleLogEntry{}
					if timestamp, ok := logMap["timestamp"].(float64); ok {
						entry.Timestamp = time.Unix(int64(timestamp/1000), 0)
					}
					if level, ok := logMap["level"].(string); ok {
						entry.Level = level
					}
					if message, ok := logMap["message"].(string); ok {
						entry.Message = message
					}
					if url, ok := logMap["url"].(string); ok {
						entry.URL = url
					}
					if tabIDNum, ok := logMap["tab_id"].(float64); ok {
						entry.TabID = int(tabIDNum)
					}
					if source, ok := logMap["source"].(string); ok {
						entry.Source = source
					}
					logs = append(logs, entry)
				}
			}
		}
	} else {
		errorMsg := "Unknown error"
		if msg, ok := response["error"].(string); ok {
			errorMsg = msg
		}
		return mcp.NewToolResultError(fmt.Sprintf("Extension error: %s", errorMsg)), nil
	}
	
	// Format response
	responseText := fmt.Sprintf("Found %d console log entries", len(logs))
	if tabID != "" {
		responseText += fmt.Sprintf(" for tab %s", tabID)
	}
	if logLevel != "" {
		responseText += fmt.Sprintf(" with level '%s'", logLevel)
	}
	responseText += ":\n\n"
	
	for _, log := range logs {
		responseText += fmt.Sprintf("[%s] %s: %s",
			log.Timestamp.Format("15:04:05"),
			log.Level,
			log.Message,
		)
		if log.URL != "" {
			responseText += fmt.Sprintf(" (from %s)", log.URL)
		}
		responseText += "\n"
	}
	
	if len(logs) == 0 {
		responseText = "No console logs found matching the criteria."
	}
	
	return mcp.NewToolResultText(responseText), nil
}

// NewClearConsoleLogsTool creates the clear-console-logs MCP tool
func NewClearConsoleLogsTool() mcp.Tool {
	return mcp.NewTool("clear-console-logs",
		mcp.WithDescription("Clear the console log buffer for the specified or current tab"),
		mcp.WithString("tab_id",
			mcp.Description("Optional tab ID to clear logs for. If not provided, clears logs for the currently active tab"),
		),
	)
}

// handleClearConsoleLogs handles the clear-console-logs tool request
func (s *ExtensionMCPServer) handleClearConsoleLogs(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	tabID := request.GetString("tab_id", "")
	
	// Send request to extension via WebSocket
	request_data := map[string]interface{}{
		"action": "clear_console_logs",
		"tab_id": tabID,
	}
	
	response, err := s.sendExtensionRequest(request_data)
	if err != nil {
		return nil, fmt.Errorf("failed to clear console logs: %v", err)
	}
	
	// Parse response
	if response["success"] == true {
		message := "Console logs cleared successfully"
		if tabID != "" {
			message += fmt.Sprintf(" for tab %s", tabID)
		} else {
			message += " for current tab"
		}
		return mcp.NewToolResultText(message), nil
	} else {
		errorMsg := "Unknown error"
		if msg, ok := response["error"].(string); ok {
			errorMsg = msg
		}
		return mcp.NewToolResultError(fmt.Sprintf("Failed to clear console logs: %s", errorMsg)), nil
	}
}

// sendExtensionRequest is implemented in websocket-bridge.go