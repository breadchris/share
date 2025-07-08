package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/go-shiori/dom"
	"github.com/go-shiori/go-readability"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

type PageInfo struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	Title     string `json:"title"`
	HTML      string `json:"html"`
	CreatedAt int64  `json:"created_at"`
	Article   string `json:"article"`
	HitCount  int    `json:"hit_count"`
}

type ProxyRequest struct {
	ID      string            `json:"id"`
	URL     string            `json:"url"`
	Method  string            `json:"method"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
	Options ProxyOptions      `json:"options"`
}

type ProxyOptions struct {
	IncludeCredentials bool     `json:"include_credentials"`
	WaitForJS         bool     `json:"wait_for_js"`
	ScreenshotAfter   bool     `json:"screenshot_after"`
	CookieDomains     []string `json:"cookie_domains"`
}

type ProxyResponse struct {
	RequestID  string            `json:"requestId"`
	Response   ProxyResult       `json:"response"`
	ReceivedAt time.Time        `json:"received_at"`
}

type ProxyResult struct {
	Success    bool              `json:"success"`
	Status     int               `json:"status"`
	StatusText string            `json:"statusText"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
	URL        string            `json:"url"`
	Error      string            `json:"error,omitempty"`
}

type ExtensionWebSocketMessage struct {
	Type      string      `json:"type"`
	ID        string      `json:"id,omitempty"`
	RequestID string      `json:"requestId,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

type ExtensionConnection struct {
	conn       *websocket.Conn
	id         string
	connected  time.Time
	lastPing   time.Time
	send       chan ExtensionWebSocketMessage
	stats      ConnectionStats
}

type ConnectionStats struct {
	RequestCount int       `json:"requestCount"`
	LastActivity time.Time `json:"lastActivity"`
}

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from the extension
		return true
	},
}

func NewExtension(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	// Get default user and group for extension usage
	defaultUserID := "extension-user"
	defaultGroupID := "extension-group"

	// Ensure default user exists
	var user models.User
	if err := d.DB.FirstOrCreate(&user, models.User{ID: defaultUserID, Username: "extension"}).Error; err != nil {
		slog.Error("failed to create default user", "error", err)
	}

	// Ensure default group exists
	var group models.Group
	if err := d.DB.FirstOrCreate(&group, models.Group{ID: defaultGroupID, Name: "Extension Pages", JoinCode: "extension-group-join"}).Error; err != nil {
		slog.Error("failed to create default group", "error", err)
	}

	// Initialize proxy request management and connection hub
	proxyManager := NewProxyManager()
	connectionHub := NewConnectionHub()

	// WebSocket endpoint for extension communication
	m.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocketConnection(w, r, proxyManager, connectionHub)
	})

	m.HandleFunc("/save", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			var pageInfo PageInfo
			ur := r.FormValue("url")
			if ur != "" {
				err := json.NewDecoder(r.Body).Decode(&pageInfo)
				if err != nil {
					http.Error(w, err.Error(), http.StatusBadRequest)
					return
				}
			} else {
				pageInfo.URL = ur
			}

			getArticle := func(pageInfo PageInfo) (*readability.Article, error) {
				r := strings.NewReader(pageInfo.HTML)
				doc, err := dom.Parse(r)
				if err != nil {
					return nil, err
				}
				u, err := url.Parse(pageInfo.URL)
				if err != nil {
					return nil, err
				}
				a, err := readability.FromDocument(doc, u)
				if err != nil {
					return nil, err
				}
				return &a, nil
			}

			article, err := getArticle(pageInfo)
			if err != nil {
				slog.Debug("failed to get article", "error", err)
			} else {
				pageInfo.Article = article.TextContent
			}

			// Check if page already exists
			var existingContent models.Content
			result := d.DB.Where("type = ? AND group_id = ? AND data LIKE ?", "page", defaultGroupID, "%"+pageInfo.URL+"%").First(&existingContent)

			hitCount := 1
			if result.Error == nil {
				// Page exists, increment hit count
				if existingContent.Metadata != nil {
					if count, ok := existingContent.Metadata.Data["hit_count"].(float64); ok {
						hitCount = int(count) + 1
					}
				}
			}

			// Create metadata for the page
			metadata := map[string]interface{}{
				"url":       pageInfo.URL,
				"title":     pageInfo.Title,
				"html":      pageInfo.HTML,
				"hit_count": hitCount,
			}

			// Create or update content first
			content := models.NewContent("page", pageInfo.Article, defaultGroupID, defaultUserID, metadata)

			if result.Error == nil {
				// Update existing content
				content.ID = existingContent.ID
				content.CreatedAt = existingContent.CreatedAt
				if err := d.DB.Save(content).Error; err != nil {
					http.Error(w, fmt.Sprintf("Failed to update content: %v", err), http.StatusInternalServerError)
					return
				}
			} else {
				// Create new content
				if err := d.DB.Create(content).Error; err != nil {
					http.Error(w, fmt.Sprintf("Failed to create content: %v", err), http.StatusInternalServerError)
					return
				}
			}

			// Server-side processing based on domain patterns (after content is saved)
			if shouldProcessHTML(pageInfo.URL) {
				extractedImages, err := extractAndSaveImagesWithProxy(pageInfo, content.ID, proxyManager, d)
				if err != nil {
					slog.Error("failed to extract images", "error", err, "url", pageInfo.URL)
				} else if len(extractedImages) > 0 {
					// Update content with extracted images
					metadata["extracted_images"] = extractedImages
					content.Metadata = models.MakeJSONField[map[string]interface{}](metadata)
					if err := d.DB.Save(content).Error; err != nil {
						slog.Error("failed to save extracted images metadata", "error", err)
					} else {
						slog.Info("extracted images", "count", len(extractedImages), "url", pageInfo.URL)
					}
				}
			}

			// Convert back to PageInfo for response
			responsePageInfo := PageInfo{
				ID:        content.ID,
				URL:       pageInfo.URL,
				Title:     pageInfo.Title,
				HTML:      pageInfo.HTML,
				CreatedAt: content.CreatedAt.Unix(),
				Article:   pageInfo.Article,
				HitCount:  hitCount,
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(responsePageInfo)
		} else {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		}
	})

	m.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		ctx := context.WithValue(r.Context(), "baseURL", "/extension")

		switch r.Method {
		case http.MethodGet:
			if id != "" {
				var content models.Content
				if err := d.DB.Where("id = ? AND type = ?", id, "page").First(&content).Error; err != nil {
					http.Error(w, "Page not found", http.StatusNotFound)
					return
				}

				title := "Page"
				if content.Metadata != nil {
					if t, ok := content.Metadata.Data["title"].(string); ok {
						title = t
					}
				}

				DefaultLayout(
					Div(
						Class("mx-auto w-3/4 pt-6 space-y-6"),
						P(Class("text-xl"), T(title)),
						P(Raw(content.Data)),
					),
				).RenderPageCtx(ctx, w, r)
				return
			}

			DefaultLayout(
				Div(
					Class("mx-auto mt-16 w-3/4 pt-6 space-y-6"),
					Form(
						Class("space-y-2"),
						HxPost("/save"),
						Input(
							Class("input w-full"),
							Name("url"),
							Placeholder("url"),
						),
						Div(
							Input(
								Type("submit"),
								Value("Submit"),
								Class("btn btn-primary"),
							),
						),
					),
					RenderMasonry(d.DB, defaultGroupID),
				),
			).RenderPageCtx(ctx, w, r)
			return
		}
	})

	return m
}

func RenderMasonry(db *gorm.DB, groupID string) *Node {
	var cards []*Node
	var contents []models.Content

	// Get all page contents from the database
	if err := db.Where("type = ? AND group_id = ?", "page", groupID).Order("created_at DESC").Find(&contents).Error; err != nil {
		slog.Error("failed to fetch page contents", "error", err)
		return Div(Class("board-grid justify-center mt-6 space-y-6"))
	}

	for _, content := range contents {
		if content.Metadata == nil {
			continue
		}

		pageURL, _ := content.Metadata.Data["url"].(string)
		pageTitle, _ := content.Metadata.Data["title"].(string)

		if pageURL == "" {
			continue
		}

		ur, err := url.Parse(pageURL)
		if err != nil {
			slog.Error("failed to parse URL", "error", err)
			continue
		}

		card := Div(
			Div(
				Class("flex flex-col"),
				A(Href(pageURL), Class("text-md font-bold leading-6"), T(pageTitle)),
				Div(
					Class("text-sm text-gray-500 ml-2 "),
					T(fmt.Sprintf("%s %s", content.CreatedAt.Format("2006-01-02"), ur.Hostname())),
				),
				If(content.Data != "",
					Div(
						Class("w-full p-4"),
						A(Href("/"+content.ID), T(shortText(200, content.Data))),
					),
					Nil(),
				),
			),
		)
		cards = append(cards, card)
	}
	return Div(
		Class("board-grid justify-center mt-6 space-y-6"),
		Ch(cards),
	)
}

func shortText(n int, s string) string {
	if n < len(s) {
		return s[:n]
	}
	return s
}

// shouldProcessHTML checks if the given URL should be processed for content extraction
func shouldProcessHTML(urlStr string) bool {
	u, err := url.Parse(urlStr)
	if err != nil {
		return false
	}

	// Define domain patterns for processing
	patterns := []string{
		`^mobbin\.com$`,
		`^.*\.mobbin\.com$`,
	}

	for _, pattern := range patterns {
		matched, err := regexp.MatchString(pattern, u.Hostname())
		if err == nil && matched {
			return true
		}
	}

	return false
}

// extractAndSaveImages extracts images from HTML content and saves them to content-specific directory
func extractAndSaveImages(pageInfo PageInfo, contentID string, d deps.Deps) ([]string, error) {
	if pageInfo.HTML == "" {
		return nil, fmt.Errorf("no HTML content to process")
	}

	// Parse HTML
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(pageInfo.HTML))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	u, err := url.Parse(pageInfo.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse URL: %w", err)
	}

	var extractedImages []string

	// Extract images based on domain-specific logic
	if isMobbinDomain(u.Hostname()) {
		images := extractMobbinImages(doc, u)
		extractedImages = append(extractedImages, images...)
	}

	// If no domain-specific logic matched, use generic image extraction
	if len(extractedImages) == 0 {
		images := extractGenericImages(doc, u)
		extractedImages = append(extractedImages, images...)
	}

	if len(extractedImages) == 0 {
		return nil, nil
	}

	// Use the provided content ID for directory creation
	contentDir := filepath.Join("./data/content", contentID)

	// Create content directory
	if err := os.MkdirAll(contentDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create content directory: %w", err)
	}

	var savedImages []string

	// Download and save images
	for i, imgURL := range extractedImages {
		if i >= 10 { // Limit to 10 images to avoid excessive downloads
			break
		}

		savedPath, err := downloadAndSaveImage(imgURL, contentDir, i)
		if err != nil {
			slog.Error("failed to download image", "url", imgURL, "error", err)
			continue
		}

		savedImages = append(savedImages, savedPath)
	}

	return savedImages, nil
}

// extractAndSaveImagesWithProxy extracts images using the browser extension proxy for authenticated requests
func extractAndSaveImagesWithProxy(pageInfo PageInfo, contentID string, proxyManager *ProxyManager, d deps.Deps) ([]string, error) {
	if pageInfo.HTML == "" {
		return nil, fmt.Errorf("no HTML content to process")
	}
	
	// Parse HTML
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(pageInfo.HTML))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}
	
	u, err := url.Parse(pageInfo.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse URL: %w", err)
	}
	
	var extractedImages []string
	
	// Extract images based on domain-specific logic
	if isMobbinDomain(u.Hostname()) {
		images := extractMobbinImages(doc, u)
		extractedImages = append(extractedImages, images...)
	}
	
	// If no domain-specific logic matched, use generic image extraction
	if len(extractedImages) == 0 {
		images := extractGenericImages(doc, u)
		extractedImages = append(extractedImages, images...)
	}
	
	if len(extractedImages) == 0 {
		return nil, nil
	}
	
	// Use the provided content ID for directory creation
	contentDir := filepath.Join("./data/content", contentID)
	
	// Create content directory
	if err := os.MkdirAll(contentDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create content directory: %w", err)
	}
	
	var savedImages []string
	
	// Download images using proxy for authenticated requests
	for i, imgURL := range extractedImages {
		if i >= 10 { // Limit to 10 images to avoid excessive downloads
			break
		}
		
		savedPath, err := downloadImageWithProxy(imgURL, contentDir, i, proxyManager)
		if err != nil {
			slog.Error("failed to download image via proxy", "url", imgURL, "error", err)
			// Fallback to direct download
			savedPath, err = downloadAndSaveImage(imgURL, contentDir, i)
			if err != nil {
				slog.Error("failed to download image directly", "url", imgURL, "error", err)
				continue
			}
		}
		
		savedImages = append(savedImages, savedPath)
	}
	
	return savedImages, nil
}

// isMobbinDomain checks if the hostname is a Mobbin domain
func isMobbinDomain(hostname string) bool {
	return hostname == "mobbin.com" || strings.HasSuffix(hostname, ".mobbin.com")
}

// extractMobbinImages extracts images specifically from Mobbin pages
func extractMobbinImages(doc *goquery.Document, baseURL *url.URL) []string {
	var images []string

	// Look for common Mobbin image selectors
	selectors := []string{
		"img[src*='mobbin']",
		"img[data-src*='mobbin']",
		"img[src*='screenshot']",
		"img[data-src*='screenshot']",
		"img.screenshot",
		"img[alt*='screenshot']",
		"img[alt*='screen']",
		"div[style*='background-image'] img",
	}

	for _, selector := range selectors {
		doc.Find(selector).Each(func(i int, s *goquery.Selection) {
			if src, exists := s.Attr("src"); exists {
				if absoluteURL := resolveURL(baseURL, src); absoluteURL != "" {
					images = append(images, absoluteURL)
				}
			}
			if dataSrc, exists := s.Attr("data-src"); exists {
				if absoluteURL := resolveURL(baseURL, dataSrc); absoluteURL != "" {
					images = append(images, absoluteURL)
				}
			}
		})
	}

	return removeDuplicates(images)
}

// extractGenericImages extracts images using generic selectors
func extractGenericImages(doc *goquery.Document, baseURL *url.URL) []string {
	var images []string

	doc.Find("img").Each(func(i int, s *goquery.Selection) {
		if src, exists := s.Attr("src"); exists {
			if absoluteURL := resolveURL(baseURL, src); absoluteURL != "" {
				images = append(images, absoluteURL)
			}
		}
		if dataSrc, exists := s.Attr("data-src"); exists {
			if absoluteURL := resolveURL(baseURL, dataSrc); absoluteURL != "" {
				images = append(images, absoluteURL)
			}
		}
	})

	return removeDuplicates(images)
}

// resolveURL converts relative URLs to absolute URLs
func resolveURL(baseURL *url.URL, href string) string {
	if href == "" {
		return ""
	}

	u, err := url.Parse(href)
	if err != nil {
		return ""
	}

	resolved := baseURL.ResolveReference(u)
	return resolved.String()
}

// removeDuplicates removes duplicate URLs from slice
func removeDuplicates(urls []string) []string {
	seen := make(map[string]bool)
	var result []string

	for _, url := range urls {
		if !seen[url] {
			seen[url] = true
			result = append(result, url)
		}
	}

	return result
}

// downloadAndSaveImage downloads an image and saves it to the specified directory
func downloadAndSaveImage(imageURL, contentDir string, index int) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", imageURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set user agent to avoid bot blocking
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bad status: %s", resp.Status)
	}

	// Determine file extension from Content-Type or URL
	ext := ".jpg" // default
	contentType := resp.Header.Get("Content-Type")
	switch {
	case strings.Contains(contentType, "png"):
		ext = ".png"
	case strings.Contains(contentType, "gif"):
		ext = ".gif"
	case strings.Contains(contentType, "webp"):
		ext = ".webp"
	case strings.HasSuffix(imageURL, ".png"):
		ext = ".png"
	case strings.HasSuffix(imageURL, ".gif"):
		ext = ".gif"
	case strings.HasSuffix(imageURL, ".webp"):
		ext = ".webp"
	}

	// Create filename
	filename := fmt.Sprintf("image_%d%s", index, ext)
	filepath := filepath.Join(contentDir, filename)

	// Create file
	file, err := os.Create(filepath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// Copy response body to file
	_, err = io.Copy(file, resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to save image: %w", err)
	}

	return filepath, nil
}

// downloadImageWithProxy downloads an image using the browser extension proxy for authenticated requests
func downloadImageWithProxy(imageURL, contentDir string, index int, proxyManager *ProxyManager) (string, error) {
	// Determine file extension from URL
	ext := ".jpg" // default
	if strings.HasSuffix(imageURL, ".png") {
		ext = ".png"
	} else if strings.HasSuffix(imageURL, ".gif") {
		ext = ".gif"
	} else if strings.HasSuffix(imageURL, ".webp") {
		ext = ".webp"
	}
	
	// Create filename
	filename := fmt.Sprintf("image_%d%s", index, ext)
	filePath := filepath.Join(contentDir, filename)
	
	// Make proxy request to download image
	headers := map[string]string{
		"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
		"Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
		"Accept-Language": "en-US,en;q=0.9",
	}
	
	options := ProxyOptions{
		IncludeCredentials: true, // Include cookies and auth headers
	}
	
	result, err := proxyManager.MakeProxyRequest(imageURL, "GET", headers, "", options)
	if err != nil {
		return "", fmt.Errorf("proxy request failed: %w", err)
	}
	
	if !result.Success {
		return "", fmt.Errorf("proxy request unsuccessful: %s", result.Error)
	}
	
	if result.Status != 200 {
		return "", fmt.Errorf("bad status: %d %s", result.Status, result.StatusText)
	}
	
	// Update file extension based on Content-Type from response
	if contentType, exists := result.Headers["content-type"]; exists {
		switch {
		case strings.Contains(contentType, "png"):
			ext = ".png"
		case strings.Contains(contentType, "gif"):
			ext = ".gif"
		case strings.Contains(contentType, "webp"):
			ext = ".webp"
		case strings.Contains(contentType, "jpeg") || strings.Contains(contentType, "jpg"):
			ext = ".jpg"
		}
		
		// Update filename with correct extension
		filename = fmt.Sprintf("image_%d%s", index, ext)
		filePath = filepath.Join(contentDir, filename)
	}
	
	// Create file
	file, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()
	
	// Write response body to file
	_, err = file.WriteString(result.Body)
	if err != nil {
		return "", fmt.Errorf("failed to save image: %w", err)
	}
	
	slog.Info("Downloaded image via proxy", "url", imageURL, "path", filePath)
	return filePath, nil
}

// ProxyManager handles communication between backend and extension for proxy requests
type ProxyManager struct {
	pendingRequests   map[string]*ProxyRequest
	completedRequests map[string]ProxyResult
	requestChannels   map[string]chan ProxyResult
	requestCounts     map[string]int  // Track requests per domain for rate limiting
	lastRequestTime   map[string]time.Time  // Track last request time per domain
	connectionHub     *ConnectionHub  // WebSocket connection hub
	mu                sync.RWMutex
}

// Security configuration
const (
	MaxRequestsPerDomain = 50         // Max requests per domain per hour
	MinRequestInterval   = time.Second * 2  // Minimum interval between requests to same domain
)

func NewProxyManager() *ProxyManager {
	return &ProxyManager{
		pendingRequests:   make(map[string]*ProxyRequest),
		completedRequests: make(map[string]ProxyResult),
		requestChannels:   make(map[string]chan ProxyResult),
		requestCounts:     make(map[string]int),
		lastRequestTime:   make(map[string]time.Time),
	}
}

func (pm *ProxyManager) AddRequest(request *ProxyRequest) chan ProxyResult {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	
	// Create response channel for this request
	responseChan := make(chan ProxyResult, 1)
	
	pm.pendingRequests[request.ID] = request
	pm.requestChannels[request.ID] = responseChan
	
	slog.Info("Added proxy request", "id", request.ID, "url", request.URL)
	
	return responseChan
}

func (pm *ProxyManager) GetPendingRequests() []*ProxyRequest {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	
	requests := make([]*ProxyRequest, 0, len(pm.pendingRequests))
	for _, request := range pm.pendingRequests {
		requests = append(requests, request)
	}
	
	return requests
}

func (pm *ProxyManager) CompleteRequest(requestID string, result ProxyResult) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	
	// Remove from pending
	delete(pm.pendingRequests, requestID)
	
	// Store result
	pm.completedRequests[requestID] = result
	
	// Send to response channel if exists
	if responseChan, exists := pm.requestChannels[requestID]; exists {
		select {
		case responseChan <- result:
			slog.Info("Sent proxy response to channel", "id", requestID)
		default:
			slog.Warn("Response channel full or closed", "id", requestID)
		}
		
		// Clean up channel
		close(responseChan)
		delete(pm.requestChannels, requestID)
	}
	
	slog.Info("Completed proxy request", "id", requestID, "success", result.Success)
}

func (pm *ProxyManager) SetConnectionHub(hub *ConnectionHub) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.connectionHub = hub
}

// MakeProxyRequest creates a proxy request and waits for the response
func (pm *ProxyManager) MakeProxyRequest(targetURL, method string, headers map[string]string, body string, options ProxyOptions) (*ProxyResult, error) {
	// Validate and sanitize the request
	if err := pm.validateProxyRequest(targetURL, method, headers, body, options); err != nil {
		return nil, fmt.Errorf("proxy request validation failed: %w", err)
	}
	
	// Apply rate limiting
	if err := pm.checkRateLimit(targetURL); err != nil {
		return nil, fmt.Errorf("rate limit exceeded: %w", err)
	}
	
	// Generate unique request ID
	requestID := generateRequestID()
	
	request := &ProxyRequest{
		ID:      requestID,
		URL:     targetURL,
		Method:  method,
		Headers: headers,
		Body:    body,
		Options: options,
	}
	
	// Send request via WebSocket to extension
	if pm.connectionHub == nil {
		return nil, fmt.Errorf("no WebSocket connection available")
	}
	
	// Add request and get response channel
	responseChan := pm.AddRequest(request)
	
	// Send request via WebSocket
	message := ExtensionWebSocketMessage{
		Type:      "proxy_request",
		ID:        requestID,
		Timestamp: time.Now().Unix(),
		Data:      request,
	}
	
	pm.connectionHub.BroadcastMessage(message)
	slog.Info("Sent proxy request via WebSocket", "id", requestID, "url", targetURL)
	
	// Wait for response with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	
	select {
	case result := <-responseChan:
		return &result, nil
	case <-ctx.Done():
		// Clean up timed-out request
		pm.mu.Lock()
		delete(pm.pendingRequests, requestID)
		if responseChan, exists := pm.requestChannels[requestID]; exists {
			close(responseChan)
			delete(pm.requestChannels, requestID)
		}
		pm.mu.Unlock()
		
		return nil, fmt.Errorf("proxy request timed out after 60 seconds")
	}
}

func generateRequestID() string {
	// Generate a unique request ID
	return fmt.Sprintf("req_%d_%s", time.Now().UnixNano(), randomString(8))
}

func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[len(charset)/2] // Simple approach, could use crypto/rand for better randomness
	}
	return string(b)
}

// validateProxyRequest validates and sanitizes proxy requests for security
func (pm *ProxyManager) validateProxyRequest(targetURL, method string, headers map[string]string, body string, options ProxyOptions) error {
	// Validate URL
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}
	
	// Check if domain is allowed
	if !isAllowedProxyDomain(parsedURL.Hostname()) {
		return fmt.Errorf("domain not allowed for proxy requests: %s", parsedURL.Hostname())
	}
	
	// Validate HTTP method
	allowedMethods := []string{"GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"}
	methodValid := false
	for _, allowed := range allowedMethods {
		if method == allowed {
			methodValid = true
			break
		}
	}
	if !methodValid {
		return fmt.Errorf("HTTP method not allowed: %s", method)
	}
	
	// Validate headers - prevent malicious headers
	for key, value := range headers {
		key = strings.ToLower(key)
		if key == "host" || key == "content-length" {
			return fmt.Errorf("header not allowed: %s", key)
		}
		if len(value) > 4096 {
			return fmt.Errorf("header value too long for %s", key)
		}
	}
	
	// Validate body size
	if len(body) > 1024*1024 { // 1MB limit
		return fmt.Errorf("request body too large: %d bytes", len(body))
	}
	
	// Validate scheme (only HTTPS for security)
	if parsedURL.Scheme != "https" {
		return fmt.Errorf("only HTTPS URLs are allowed, got: %s", parsedURL.Scheme)
	}
	
	return nil
}

// checkRateLimit enforces rate limiting per domain
func (pm *ProxyManager) checkRateLimit(targetURL string) error {
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return err
	}
	
	domain := parsedURL.Hostname()
	now := time.Now()
	
	pm.mu.Lock()
	defer pm.mu.Unlock()
	
	// Check minimum interval between requests
	if lastTime, exists := pm.lastRequestTime[domain]; exists {
		if now.Sub(lastTime) < MinRequestInterval {
			return fmt.Errorf("rate limit: minimum interval of %v between requests to %s", MinRequestInterval, domain)
		}
	}
	
	// Clean up old request counts (older than 1 hour)
	pm.cleanupOldRequestCounts()
	
	// Check maximum requests per hour
	if count, exists := pm.requestCounts[domain]; exists && count >= MaxRequestsPerDomain {
		return fmt.Errorf("rate limit: maximum of %d requests per hour exceeded for %s", MaxRequestsPerDomain, domain)
	}
	
	// Update counters
	pm.requestCounts[domain]++
	pm.lastRequestTime[domain] = now
	
	return nil
}

// cleanupOldRequestCounts removes request counts older than 1 hour
func (pm *ProxyManager) cleanupOldRequestCounts() {
	cutoff := time.Now().Add(-time.Hour)
	
	for domain, lastTime := range pm.lastRequestTime {
		if lastTime.Before(cutoff) {
			delete(pm.requestCounts, domain)
			delete(pm.lastRequestTime, domain)
		}
	}
}

// isAllowedProxyDomain checks if a domain is allowed for proxy requests
func isAllowedProxyDomain(hostname string) bool {
	allowedDomains := []string{
		"mobbin.com",
		"figma.com",
		"dribbble.com",
		"behance.net",
		"awwwards.com",
		"uxplanet.org",
		"pinterest.com",
		"unsplash.com",
		"design.google",
		"material.io",
	}
	
	for _, domain := range allowedDomains {
		if hostname == domain || strings.HasSuffix(hostname, "."+domain) {
			return true
		}
	}
	
	return false
}

// ConnectionHub manages WebSocket connections from extensions
type ConnectionHub struct {
	connections map[string]*ExtensionConnection
	mu          sync.RWMutex
}

func NewConnectionHub() *ConnectionHub {
	return &ConnectionHub{
		connections: make(map[string]*ExtensionConnection),
	}
}

func (hub *ConnectionHub) AddConnection(conn *ExtensionConnection) {
	hub.mu.Lock()
	defer hub.mu.Unlock()
	hub.connections[conn.id] = conn
	slog.Info("Extension connected", "id", conn.id, "total", len(hub.connections))
}

func (hub *ConnectionHub) RemoveConnection(id string) {
	hub.mu.Lock()
	defer hub.mu.Unlock()
	if conn, exists := hub.connections[id]; exists {
		close(conn.send)
		delete(hub.connections, id)
		slog.Info("Extension disconnected", "id", id, "total", len(hub.connections))
	}
}

func (hub *ConnectionHub) GetConnection(id string) (*ExtensionConnection, bool) {
	hub.mu.RLock()
	defer hub.mu.RUnlock()
	conn, exists := hub.connections[id]
	return conn, exists
}

func (hub *ConnectionHub) GetAllConnections() []*ExtensionConnection {
	hub.mu.RLock()
	defer hub.mu.RUnlock()
	
	connections := make([]*ExtensionConnection, 0, len(hub.connections))
	for _, conn := range hub.connections {
		connections = append(connections, conn)
	}
	return connections
}

func (hub *ConnectionHub) BroadcastMessage(message ExtensionWebSocketMessage) {
	hub.mu.RLock()
	defer hub.mu.RUnlock()
	
	for _, conn := range hub.connections {
		select {
		case conn.send <- message:
		default:
			// Connection send channel is full, skip
			slog.Warn("Skipping message to connection", "id", conn.id)
		}
	}
}

// handleWebSocketConnection handles WebSocket connections from extensions
func handleWebSocketConnection(w http.ResponseWriter, r *http.Request, proxyManager *ProxyManager, hub *ConnectionHub) {
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("WebSocket upgrade failed", "error", err)
		return
	}

	// Create extension connection
	connectionID := generateConnectionID()
	extConn := &ExtensionConnection{
		conn:      conn,
		id:        connectionID,
		connected: time.Now(),
		lastPing:  time.Now(),
		send:      make(chan ExtensionWebSocketMessage, 256),
		stats:     ConnectionStats{},
	}

	// Add to hub
	hub.AddConnection(extConn)
	defer hub.RemoveConnection(connectionID)

	// Update proxy manager to use this connection
	proxyManager.SetConnectionHub(hub)

	// Start goroutines for reading and writing
	go extConn.writePump()
	go extConn.readPump(proxyManager)

	// Send welcome message
	welcome := ExtensionWebSocketMessage{
		Type:      "connected",
		ID:        connectionID,
		Timestamp: time.Now().Unix(),
		Data: map[string]interface{}{
			"connectionId": connectionID,
			"serverTime":   time.Now().Unix(),
		},
	}
	
	select {
	case extConn.send <- welcome:
	default:
		slog.Warn("Failed to send welcome message")
	}

	// Keep connection alive until it closes
	<-extConn.send
}

func (conn *ExtensionConnection) readPump(proxyManager *ProxyManager) {
	defer func() {
		conn.conn.Close()
	}()

	conn.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.conn.SetPongHandler(func(string) error {
		conn.lastPing = time.Now()
		conn.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var message ExtensionWebSocketMessage
		err := conn.conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("WebSocket read error", "error", err)
			}
			break
		}

		conn.stats.LastActivity = time.Now()

		switch message.Type {
		case "proxy_response":
			if message.RequestID != "" {
				if result, ok := message.Data.(map[string]interface{}); ok {
					proxyResult := parseProxyResult(result)
					proxyManager.CompleteRequest(message.RequestID, proxyResult)
					conn.stats.RequestCount++
				}
			}
		case "ping":
			// Send pong
			pong := ExtensionWebSocketMessage{
				Type:      "pong",
				Timestamp: time.Now().Unix(),
			}
			select {
			case conn.send <- pong:
			default:
				// Channel full, connection might be dead
				return
			}
		}
	}
}

func (conn *ExtensionConnection) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		conn.conn.Close()
	}()

	for {
		select {
		case message, ok := <-conn.send:
			conn.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				conn.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := conn.conn.WriteJSON(message); err != nil {
				slog.Error("WebSocket write error", "error", err)
				return
			}

		case <-ticker.C:
			conn.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := conn.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func generateConnectionID() string {
	return fmt.Sprintf("ext_%d_%s", time.Now().UnixNano(), randomString(6))
}

func parseProxyResult(data map[string]interface{}) ProxyResult {
	result := ProxyResult{}

	if success, ok := data["success"].(bool); ok {
		result.Success = success
	}
	if status, ok := data["status"].(float64); ok {
		result.Status = int(status)
	}
	if statusText, ok := data["statusText"].(string); ok {
		result.StatusText = statusText
	}
	if body, ok := data["body"].(string); ok {
		result.Body = body
	}
	if url, ok := data["url"].(string); ok {
		result.URL = url
	}
	if errorMsg, ok := data["error"].(string); ok {
		result.Error = errorMsg
	}
	if headers, ok := data["headers"].(map[string]interface{}); ok {
		result.Headers = make(map[string]string)
		for k, v := range headers {
			if str, ok := v.(string); ok {
				result.Headers[k] = str
			}
		}
	}

	return result
}
