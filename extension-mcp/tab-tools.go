package extensionmcp

import (
	"context"
	"fmt"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
)

// TabInfo represents information about a browser tab
type TabInfo struct {
	ID           int    `json:"id"`
	URL          string `json:"url"`
	Title        string `json:"title"`
	Active       bool   `json:"active"`
	WindowID     int    `json:"window_id"`
	Index        int    `json:"index"`
	Status       string `json:"status"` // loading, complete
	FaviconURL   string `json:"favicon_url,omitempty"`
	Incognito    bool   `json:"incognito"`
	Highlighted  bool   `json:"highlighted"`
	Selected     bool   `json:"selected"`
	Pinned       bool   `json:"pinned"`
	Audible      bool   `json:"audible"`
	Muted        bool   `json:"muted"`
	LastAccessed int64  `json:"last_accessed,omitempty"`
}

// NewListTabsTool creates the list-tabs MCP tool
func NewListTabsTool() mcp.Tool {
	return mcp.NewTool("list-tabs",
		mcp.WithDescription("List all open browser tabs with their basic information"),
		mcp.WithBoolean("active_only",
			mcp.Description("Only return the currently active tab (default: false)"),
		),
		mcp.WithString("url_filter",
			mcp.Description("Filter tabs by URL pattern (supports wildcards, e.g., '*github*', '*.com')"),
		),
		mcp.WithString("title_filter",
			mcp.Description("Filter tabs by title pattern (supports wildcards)"),
		),
		mcp.WithBoolean("include_incognito",
			mcp.Description("Include incognito tabs in results (default: true)"),
		),
	)
}

// handleListTabs handles the list-tabs tool request
func (s *ExtensionMCPServer) handleListTabs(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	activeOnly := request.GetBool("active_only", false)
	urlFilter := request.GetString("url_filter", "")
	titleFilter := request.GetString("title_filter", "")
	includeIncognito := request.GetBool("include_incognito", true)

	// Send request to extension via WebSocket
	request_data := map[string]interface{}{
		"action":           "list_tabs",
		"active_only":      activeOnly,
		"url_filter":       urlFilter,
		"title_filter":     titleFilter,
		"include_incognito": includeIncognito,
	}

	response, err := s.sendExtensionRequest(request_data)
	if err != nil {
		return nil, fmt.Errorf("failed to get tabs from extension: %v", err)
	}

	// Parse response
	var tabs []TabInfo
	if response["success"] == true {
		if tabsData, ok := response["tabs"].([]interface{}); ok {
			for _, tabData := range tabsData {
				if tabMap, ok := tabData.(map[string]interface{}); ok {
					tab := TabInfo{}
					if id, ok := tabMap["id"].(float64); ok {
						tab.ID = int(id)
					}
					if url, ok := tabMap["url"].(string); ok {
						tab.URL = url
					}
					if title, ok := tabMap["title"].(string); ok {
						tab.Title = title
					}
					if active, ok := tabMap["active"].(bool); ok {
						tab.Active = active
					}
					if windowID, ok := tabMap["window_id"].(float64); ok {
						tab.WindowID = int(windowID)
					}
					if index, ok := tabMap["index"].(float64); ok {
						tab.Index = int(index)
					}
					if status, ok := tabMap["status"].(string); ok {
						tab.Status = status
					}
					if faviconURL, ok := tabMap["favicon_url"].(string); ok {
						tab.FaviconURL = faviconURL
					}
					if incognito, ok := tabMap["incognito"].(bool); ok {
						tab.Incognito = incognito
					}
					if highlighted, ok := tabMap["highlighted"].(bool); ok {
						tab.Highlighted = highlighted
					}
					if selected, ok := tabMap["selected"].(bool); ok {
						tab.Selected = selected
					}
					if pinned, ok := tabMap["pinned"].(bool); ok {
						tab.Pinned = pinned
					}
					if audible, ok := tabMap["audible"].(bool); ok {
						tab.Audible = audible
					}
					if muted, ok := tabMap["muted"].(bool); ok {
						tab.Muted = muted
					}
					if lastAccessed, ok := tabMap["last_accessed"].(float64); ok {
						tab.LastAccessed = int64(lastAccessed)
					}
					tabs = append(tabs, tab)
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
	responseText := fmt.Sprintf("Found %d tab(s)", len(tabs))
	if activeOnly {
		responseText += " (active only)"
	}
	if urlFilter != "" {
		responseText += fmt.Sprintf(" matching URL pattern '%s'", urlFilter)
	}
	if titleFilter != "" {
		responseText += fmt.Sprintf(" matching title pattern '%s'", titleFilter)
	}
	responseText += ":\n\n"

	for _, tab := range tabs {
		statusIcon := ""
		if tab.Active {
			statusIcon += "🔵 "
		}
		if tab.Pinned {
			statusIcon += "📌 "
		}
		if tab.Audible {
			statusIcon += "🔊 "
		} else if tab.Muted {
			statusIcon += "🔇 "
		}
		if tab.Incognito {
			statusIcon += "🕵️ "
		}

		loadingStatus := ""
		if tab.Status == "loading" {
			loadingStatus = " [loading...]"
		}

		responseText += fmt.Sprintf("[%d] %s%s%s\n    %s\n",
			tab.ID,
			statusIcon,
			tab.Title,
			loadingStatus,
			tab.URL,
		)
	}

	if len(tabs) == 0 {
		responseText = "No tabs found matching the criteria."
	}

	return mcp.NewToolResultText(responseText), nil
}

// NewConnectTabTool creates the connect-tab MCP tool
func NewConnectTabTool() mcp.Tool {
	return mcp.NewTool("connect-tab",
		mcp.WithDescription("Connect to a specific browser tab for console log and network monitoring"),
		mcp.WithString("tab_id",
			mcp.Required(),
			mcp.Description("The ID of the tab to connect to"),
		),
	)
}

// handleConnectTab handles the connect-tab tool request
func (s *ExtensionMCPServer) handleConnectTab(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	tabID := request.GetString("tab_id", "")

	if tabID == "" {
		return mcp.NewToolResultError("tab_id parameter is required"), nil
	}

	// Send request to extension via WebSocket
	request_data := map[string]interface{}{
		"action": "connect_tab",
		"tab_id": tabID,
	}

	response, err := s.sendExtensionRequest(request_data)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to tab via extension: %v", err)
	}

	// Parse response
	if response["success"] == true {
		var tabInfo TabInfo
		if tabData, ok := response["tab"].(map[string]interface{}); ok {
			if id, ok := tabData["id"].(float64); ok {
				tabInfo.ID = int(id)
			}
			if url, ok := tabData["url"].(string); ok {
				tabInfo.URL = url
			}
			if title, ok := tabData["title"].(string); ok {
				tabInfo.Title = title
			}
		}

		responseText := fmt.Sprintf("Successfully connected to tab %s\n", tabID)
		if tabInfo.Title != "" {
			responseText += fmt.Sprintf("Title: %s\n", tabInfo.Title)
		}
		if tabInfo.URL != "" {
			responseText += fmt.Sprintf("URL: %s\n", tabInfo.URL)
		}
		responseText += "\nYou can now use get-console-logs and get-network-requests tools to monitor this tab."

		return mcp.NewToolResultText(responseText), nil
	} else {
		errorMsg := "Unknown error"
		if msg, ok := response["error"].(string); ok {
			errorMsg = msg
		}
		return mcp.NewToolResultError(fmt.Sprintf("Extension error: %s", errorMsg)), nil
	}
}

// NewGetTabInfoTool creates the get-tab-info MCP tool
func NewGetTabInfoTool() mcp.Tool {
	return mcp.NewTool("get-tab-info",
		mcp.WithDescription("Get detailed information about a specific browser tab"),
		mcp.WithString("tab_id",
			mcp.Required(),
			mcp.Description("The ID of the tab to get information about"),
		),
		mcp.WithBoolean("include_console_count",
			mcp.Description("Include count of recent console messages (default: false)"),
		),
		mcp.WithBoolean("include_network_count",
			mcp.Description("Include count of recent network requests (default: false)"),
		),
	)
}

// handleGetTabInfo handles the get-tab-info tool request
func (s *ExtensionMCPServer) handleGetTabInfo(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	tabID := request.GetString("tab_id", "")
	includeConsoleCount := request.GetBool("include_console_count", false)
	includeNetworkCount := request.GetBool("include_network_count", false)

	if tabID == "" {
		return mcp.NewToolResultError("tab_id parameter is required"), nil
	}

	// Send request to extension via WebSocket
	request_data := map[string]interface{}{
		"action":                "get_tab_info",
		"tab_id":                tabID,
		"include_console_count": includeConsoleCount,
		"include_network_count": includeNetworkCount,
	}

	response, err := s.sendExtensionRequest(request_data)
	if err != nil {
		return nil, fmt.Errorf("failed to get tab info from extension: %v", err)
	}

	// Parse response
	if response["success"] == true {
		if tabData, ok := response["tab"].(map[string]interface{}); ok {
			tab := TabInfo{}
			if id, ok := tabData["id"].(float64); ok {
				tab.ID = int(id)
			}
			if url, ok := tabData["url"].(string); ok {
				tab.URL = url
			}
			if title, ok := tabData["title"].(string); ok {
				tab.Title = title
			}
			if active, ok := tabData["active"].(bool); ok {
				tab.Active = active
			}
			if windowID, ok := tabData["window_id"].(float64); ok {
				tab.WindowID = int(windowID)
			}
			if index, ok := tabData["index"].(float64); ok {
				tab.Index = int(index)
			}
			if status, ok := tabData["status"].(string); ok {
				tab.Status = status
			}
			if faviconURL, ok := tabData["favicon_url"].(string); ok {
				tab.FaviconURL = faviconURL
			}
			if incognito, ok := tabData["incognito"].(bool); ok {
				tab.Incognito = incognito
			}
			if highlighted, ok := tabData["highlighted"].(bool); ok {
				tab.Highlighted = highlighted
			}
			if selected, ok := tabData["selected"].(bool); ok {
				tab.Selected = selected
			}
			if pinned, ok := tabData["pinned"].(bool); ok {
				tab.Pinned = pinned
			}
			if audible, ok := tabData["audible"].(bool); ok {
				tab.Audible = audible
			}
			if muted, ok := tabData["muted"].(bool); ok {
				tab.Muted = muted
			}
			if lastAccessed, ok := tabData["last_accessed"].(float64); ok {
				tab.LastAccessed = int64(lastAccessed)
			}

			// Format detailed response
			responseText := fmt.Sprintf("Tab Information for ID: %d\n\n", tab.ID)
			responseText += fmt.Sprintf("Title: %s\n", tab.Title)
			responseText += fmt.Sprintf("URL: %s\n", tab.URL)
			responseText += fmt.Sprintf("Status: %s\n", tab.Status)
			responseText += fmt.Sprintf("Window ID: %d\n", tab.WindowID)
			responseText += fmt.Sprintf("Tab Index: %d\n", tab.Index)

			// Status indicators
			var statusFlags []string
			if tab.Active {
				statusFlags = append(statusFlags, "Active")
			}
			if tab.Pinned {
				statusFlags = append(statusFlags, "Pinned")
			}
			if tab.Highlighted {
				statusFlags = append(statusFlags, "Highlighted")
			}
			if tab.Selected {
				statusFlags = append(statusFlags, "Selected")
			}
			if tab.Incognito {
				statusFlags = append(statusFlags, "Incognito")
			}
			if tab.Audible {
				statusFlags = append(statusFlags, "Audible")
			}
			if tab.Muted {
				statusFlags = append(statusFlags, "Muted")
			}

			if len(statusFlags) > 0 {
				responseText += fmt.Sprintf("Flags: %s\n", fmt.Sprintf("%v", statusFlags))
			}

			if tab.FaviconURL != "" {
				responseText += fmt.Sprintf("Favicon: %s\n", tab.FaviconURL)
			}

			if tab.LastAccessed > 0 {
				lastAccessTime := time.Unix(tab.LastAccessed/1000, 0)
				responseText += fmt.Sprintf("Last Accessed: %s\n", lastAccessTime.Format("2006-01-02 15:04:05"))
			}

			// Additional counts if requested
			if includeConsoleCount {
				if count, ok := response["console_count"].(float64); ok {
					responseText += fmt.Sprintf("Console Messages: %d\n", int(count))
				}
			}

			if includeNetworkCount {
				if count, ok := response["network_count"].(float64); ok {
					responseText += fmt.Sprintf("Network Requests: %d\n", int(count))
				}
			}

			return mcp.NewToolResultText(responseText), nil
		}

		return mcp.NewToolResultError("Tab not found"), nil
	} else {
		errorMsg := "Unknown error"
		if msg, ok := response["error"].(string); ok {
			errorMsg = msg
		}
		return mcp.NewToolResultError(fmt.Sprintf("Extension error: %s", errorMsg)), nil
	}
}