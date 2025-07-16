package extensionmcp

import (
	"context"
	"fmt"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
)

// NetworkRequest represents a network request captured by the extension
type NetworkRequest struct {
	ID            string            `json:"id"`
	URL           string            `json:"url"`
	Method        string            `json:"method"`
	Status        int               `json:"status,omitempty"`
	StatusText    string            `json:"status_text,omitempty"`
	RequestTime   time.Time         `json:"request_time"`
	ResponseTime  *time.Time        `json:"response_time,omitempty"`
	Duration      *time.Duration    `json:"duration,omitempty"`
	TabID         int               `json:"tab_id"`
	Type          string            `json:"type,omitempty"` // xhr, fetch, document, etc.
	Headers       map[string]string `json:"headers,omitempty"`
	ResponseHeaders map[string]string `json:"response_headers,omitempty"`
	RequestBody   string            `json:"request_body,omitempty"`
	ResponseBody  string            `json:"response_body,omitempty"`
	Error         string            `json:"error,omitempty"`
}

// NewGetNetworkRequestsTool creates the get-network-requests MCP tool
func NewGetNetworkRequestsTool() mcp.Tool {
	return mcp.NewTool("get-network-requests",
		mcp.WithDescription("Get recent network requests from the currently connected browser tab"),
		mcp.WithString("tab_id",
			mcp.Description("Optional tab ID to get network requests from. If not provided, uses the currently active tab"),
		),
		mcp.WithString("url_filter",
			mcp.Description("Filter requests by URL pattern (supports wildcards, e.g., '*api*', '*.json')"),
		),
		mcp.WithString("method_filter",
			mcp.Description("Filter requests by HTTP method: 'GET', 'POST', 'PUT', 'DELETE', etc."),
		),
		mcp.WithString("status_filter",
			mcp.Description("Filter requests by status code or range: '200', '4xx', '5xx', etc."),
		),
		mcp.WithNumber("limit",
			mcp.Description("Maximum number of network requests to return (default: 50, max: 200)"),
		),
		mcp.WithString("since",
			mcp.Description("ISO timestamp to get requests since (e.g., '2025-01-16T10:00:00Z')"),
		),
	)
}

// handleGetNetworkRequests handles the get-network-requests tool request
func (s *ExtensionMCPServer) handleGetNetworkRequests(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	tabID := request.GetString("tab_id", "")
	urlFilter := request.GetString("url_filter", "")
	methodFilter := request.GetString("method_filter", "")
	statusFilter := request.GetString("status_filter", "")
	limit := request.GetInt("limit", 50)
	since := request.GetString("since", "")
	
	// Validate limit
	if limit > 200 {
		limit = 200
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
		"action": "get_network_requests",
		"tab_id": tabID,
		"url_filter": urlFilter,
		"method_filter": methodFilter,
		"status_filter": statusFilter,
		"limit": limit,
	}
	
	if sinceTime != nil {
		request_data["since"] = sinceTime.Unix()
	}
	
	response, err := s.sendExtensionRequest(request_data)
	if err != nil {
		return nil, fmt.Errorf("failed to get network requests from extension: %v", err)
	}
	
	// Parse response
	var requests []NetworkRequest
	if response["success"] == true {
		if requestsData, ok := response["requests"].([]interface{}); ok {
			for _, reqData := range requestsData {
				if reqMap, ok := reqData.(map[string]interface{}); ok {
					req := NetworkRequest{}
					if id, ok := reqMap["id"].(string); ok {
						req.ID = id
					}
					if url, ok := reqMap["url"].(string); ok {
						req.URL = url
					}
					if method, ok := reqMap["method"].(string); ok {
						req.Method = method
					}
					if status, ok := reqMap["status"].(float64); ok {
						req.Status = int(status)
					}
					if statusText, ok := reqMap["status_text"].(string); ok {
						req.StatusText = statusText
					}
					if requestTime, ok := reqMap["request_time"].(float64); ok {
						req.RequestTime = time.Unix(int64(requestTime/1000), 0)
					}
					if responseTime, ok := reqMap["response_time"].(float64); ok {
						rt := time.Unix(int64(responseTime/1000), 0)
						req.ResponseTime = &rt
						duration := rt.Sub(req.RequestTime)
						req.Duration = &duration
					}
					if tabIDNum, ok := reqMap["tab_id"].(float64); ok {
						req.TabID = int(tabIDNum)
					}
					if reqType, ok := reqMap["type"].(string); ok {
						req.Type = reqType
					}
					if errorMsg, ok := reqMap["error"].(string); ok {
						req.Error = errorMsg
					}
					requests = append(requests, req)
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
	responseText := fmt.Sprintf("Found %d network requests", len(requests))
	if tabID != "" {
		responseText += fmt.Sprintf(" for tab %s", tabID)
	}
	if urlFilter != "" {
		responseText += fmt.Sprintf(" matching URL pattern '%s'", urlFilter)
	}
	if methodFilter != "" {
		responseText += fmt.Sprintf(" with method '%s'", methodFilter)
	}
	if statusFilter != "" {
		responseText += fmt.Sprintf(" with status '%s'", statusFilter)
	}
	responseText += ":\n\n"
	
	for _, req := range requests {
		statusInfo := ""
		if req.Status > 0 {
			statusInfo = fmt.Sprintf(" [%d %s]", req.Status, req.StatusText)
		}
		
		timing := ""
		if req.Duration != nil {
			timing = fmt.Sprintf(" (%dms)", req.Duration.Milliseconds())
		}
		
		errorInfo := ""
		if req.Error != "" {
			errorInfo = fmt.Sprintf(" ERROR: %s", req.Error)
		}
		
		responseText += fmt.Sprintf("[%s] %s %s%s%s%s\n",
			req.RequestTime.Format("15:04:05"),
			req.Method,
			req.URL,
			statusInfo,
			timing,
			errorInfo,
		)
	}
	
	if len(requests) == 0 {
		responseText = "No network requests found matching the criteria."
	}
	
	return mcp.NewToolResultText(responseText), nil
}

// NewGetRequestDetailsTool creates the get-request-details MCP tool
func NewGetRequestDetailsTool() mcp.Tool {
	return mcp.NewTool("get-request-details",
		mcp.WithDescription("Get detailed information about a specific network request, including headers and body"),
		mcp.WithString("request_id",
			mcp.Required(),
			mcp.Description("The ID of the network request to get details for"),
		),
		mcp.WithBoolean("include_body",
			mcp.Description("Whether to include request and response body data (default: false)"),
		),
	)
}

// handleGetRequestDetails handles the get-request-details tool request
func (s *ExtensionMCPServer) handleGetRequestDetails(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	requestID := request.GetString("request_id", "")
	includeBody := request.GetBool("include_body", false)
	
	if requestID == "" {
		return mcp.NewToolResultError("request_id parameter is required"), nil
	}
	
	// Send request to extension via WebSocket
	request_data := map[string]interface{}{
		"action": "get_request_details",
		"request_id": requestID,
		"include_body": includeBody,
	}
	
	response, err := s.sendExtensionRequest(request_data)
	if err != nil {
		return nil, fmt.Errorf("failed to get request details from extension: %v", err)
	}
	
	// Parse response
	if response["success"] == true {
		if requestData, ok := response["request"].(map[string]interface{}); ok {
			req := NetworkRequest{}
			
			// Parse all fields (similar to above but more detailed)
			if id, ok := requestData["id"].(string); ok {
				req.ID = id
			}
			if url, ok := requestData["url"].(string); ok {
				req.URL = url
			}
			if method, ok := requestData["method"].(string); ok {
				req.Method = method
			}
			if status, ok := requestData["status"].(float64); ok {
				req.Status = int(status)
			}
			if statusText, ok := requestData["status_text"].(string); ok {
				req.StatusText = statusText
			}
			if requestTime, ok := requestData["request_time"].(float64); ok {
				req.RequestTime = time.Unix(int64(requestTime/1000), 0)
			}
			if responseTime, ok := requestData["response_time"].(float64); ok {
				rt := time.Unix(int64(responseTime/1000), 0)
				req.ResponseTime = &rt
				duration := rt.Sub(req.RequestTime)
				req.Duration = &duration
			}
			if tabIDNum, ok := requestData["tab_id"].(float64); ok {
				req.TabID = int(tabIDNum)
			}
			if reqType, ok := requestData["type"].(string); ok {
				req.Type = reqType
			}
			if errorMsg, ok := requestData["error"].(string); ok {
				req.Error = errorMsg
			}
			if requestBody, ok := requestData["request_body"].(string); ok {
				req.RequestBody = requestBody
			}
			if responseBody, ok := requestData["response_body"].(string); ok {
				req.ResponseBody = responseBody
			}
			
			// Parse headers
			if headers, ok := requestData["headers"].(map[string]interface{}); ok {
				req.Headers = make(map[string]string)
				for k, v := range headers {
					if strVal, ok := v.(string); ok {
						req.Headers[k] = strVal
					}
				}
			}
			if responseHeaders, ok := requestData["response_headers"].(map[string]interface{}); ok {
				req.ResponseHeaders = make(map[string]string)
				for k, v := range responseHeaders {
					if strVal, ok := v.(string); ok {
						req.ResponseHeaders[k] = strVal
					}
				}
			}
			
			// Format detailed response
			responseText := fmt.Sprintf("Request Details for ID: %s\n\n", req.ID)
			responseText += fmt.Sprintf("URL: %s\n", req.URL)
			responseText += fmt.Sprintf("Method: %s\n", req.Method)
			
			if req.Status > 0 {
				responseText += fmt.Sprintf("Status: %d %s\n", req.Status, req.StatusText)
			}
			
			responseText += fmt.Sprintf("Request Time: %s\n", req.RequestTime.Format("2006-01-02 15:04:05"))
			
			if req.ResponseTime != nil {
				responseText += fmt.Sprintf("Response Time: %s\n", req.ResponseTime.Format("2006-01-02 15:04:05"))
				responseText += fmt.Sprintf("Duration: %dms\n", req.Duration.Milliseconds())
			}
			
			if req.Type != "" {
				responseText += fmt.Sprintf("Type: %s\n", req.Type)
			}
			
			if req.Error != "" {
				responseText += fmt.Sprintf("Error: %s\n", req.Error)
			}
			
			// Request headers
			if len(req.Headers) > 0 {
				responseText += "\nRequest Headers:\n"
				for k, v := range req.Headers {
					responseText += fmt.Sprintf("  %s: %s\n", k, v)
				}
			}
			
			// Response headers
			if len(req.ResponseHeaders) > 0 {
				responseText += "\nResponse Headers:\n"
				for k, v := range req.ResponseHeaders {
					responseText += fmt.Sprintf("  %s: %s\n", k, v)
				}
			}
			
			// Request body
			if includeBody && req.RequestBody != "" {
				responseText += "\nRequest Body:\n"
				responseText += req.RequestBody + "\n"
			}
			
			// Response body
			if includeBody && req.ResponseBody != "" {
				responseText += "\nResponse Body:\n"
				responseText += req.ResponseBody + "\n"
			}
			
			return mcp.NewToolResultText(responseText), nil
		}
		
		return mcp.NewToolResultError("Request not found"), nil
	} else {
		errorMsg := "Unknown error"
		if msg, ok := response["error"].(string); ok {
			errorMsg = msg
		}
		return mcp.NewToolResultError(fmt.Sprintf("Extension error: %s", errorMsg)), nil
	}
}