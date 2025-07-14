package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/chromedp/chromedp"
	"github.com/PuerkitoBio/goquery"
)

// ScrapeRequest represents the input for the scraper Lambda
type ScrapeRequest struct {
	URL         string            `json:"url"`
	Selector    string            `json:"selector,omitempty"`
	WaitFor     string            `json:"waitFor,omitempty"`
	Timeout     int               `json:"timeout,omitempty"`
	Screenshot  bool              `json:"screenshot,omitempty"`
	Headers     map[string]string `json:"headers,omitempty"`
	JavaScript  bool              `json:"javascript,omitempty"`
	ExtractData bool              `json:"extractData,omitempty"`
}

// ScrapeResponse represents the output from the scraper Lambda
type ScrapeResponse struct {
	Title       string                 `json:"title"`
	Content     string                 `json:"content"`
	Screenshot  string                 `json:"screenshot,omitempty"`
	Error       string                 `json:"error,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	ExtractedData map[string]interface{} `json:"extractedData,omitempty"`
}

// ScraperService handles web scraping operations
type ScraperService struct {
	ctx context.Context
}

// NewScraperService creates a new scraper service
func NewScraperService() *ScraperService {
	// Configure Chrome for Lambda environment
	opts := []chromedp.ExecAllocatorOption{
		chromedp.NoFirstRun,
		chromedp.NoDefaultBrowserCheck,
		chromedp.DisableGPU,
		chromedp.NoSandbox,
		chromedp.DisableDevShmUsage,
		chromedp.DisableExtensions,
		chromedp.DisablePlugins,
		chromedp.DisableImages,
		chromedp.Headless,
		chromedp.Flag("disable-background-timer-throttling", true),
		chromedp.Flag("disable-renderer-backgrounding", true),
		chromedp.Flag("disable-backgrounding-occluded-windows", true),
		chromedp.Flag("disable-background-networking", true),
		chromedp.Flag("disable-default-apps", true),
		chromedp.Flag("disable-sync", true),
		chromedp.Flag("disable-translate", true),
		chromedp.Flag("hide-scrollbars", true),
		chromedp.Flag("metrics-recording-only", true),
		chromedp.Flag("mute-audio", true),
		chromedp.Flag("no-first-run", true),
		chromedp.Flag("safebrowsing-disable-auto-update", true),
		chromedp.Flag("single-process", true),
		chromedp.Flag("no-zygote", true),
		chromedp.Flag("no-default-browser-check", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("enable-automation", true),
		chromedp.Flag("disable-background-timer-throttling", true),
		chromedp.Flag("disable-backgrounding-occluded-windows", true),
		chromedp.Flag("disable-renderer-backgrounding", true),
		chromedp.Flag("disable-features", "TranslateUI,VizDisplayCompositor"),
		chromedp.Flag("run-all-compositor-stages-before-draw", true),
		chromedp.Flag("disable-ipc-flooding-protection", true),
		chromedp.UserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"),
	}

	allocCtx, _ := chromedp.NewExecAllocator(context.Background(), opts...)
	ctx, _ := chromedp.NewContext(allocCtx)

	return &ScraperService{ctx: ctx}
}

// Scrape performs web scraping based on the request
func (s *ScraperService) Scrape(req ScrapeRequest) (*ScrapeResponse, error) {
	timeout := time.Duration(req.Timeout) * time.Second
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	timeoutCtx, cancel := context.WithTimeout(s.ctx, timeout)
	defer cancel()

	response := &ScrapeResponse{
		Metadata: make(map[string]interface{}),
	}

	if req.JavaScript {
		return s.scrapeWithChrome(timeoutCtx, req, response)
	}

	return s.scrapeWithHTTP(req, response)
}

// scrapeWithChrome performs browser-based scraping
func (s *ScraperService) scrapeWithChrome(ctx context.Context, req ScrapeRequest, resp *ScrapeResponse) (*ScrapeResponse, error) {
	var title, content string
	var screenshot []byte

	actions := []chromedp.Action{
		chromedp.Navigate(req.URL),
		chromedp.Sleep(2 * time.Second),
	}

	// Wait for specific element if requested
	if req.WaitFor != "" {
		actions = append(actions, chromedp.WaitVisible(req.WaitFor, chromedp.ByQuery))
	}

	// Get page content
	if req.Selector != "" {
		actions = append(actions, chromedp.OuterHTML(req.Selector, &content, chromedp.ByQuery))
	} else {
		actions = append(actions, chromedp.OuterHTML("html", &content))
	}

	// Get title
	actions = append(actions, chromedp.Title(&title))

	// Take screenshot if requested
	if req.Screenshot {
		actions = append(actions, chromedp.FullScreenshot(&screenshot, 90))
	}

	err := chromedp.Run(ctx, actions...)
	if err != nil {
		resp.Error = fmt.Sprintf("Chrome scraping failed: %v", err)
		return resp, nil
	}

	resp.Title = title
	resp.Content = content
	resp.Metadata["method"] = "chrome"
	resp.Metadata["url"] = req.URL
	resp.Metadata["timestamp"] = time.Now().Unix()

	if req.Screenshot && len(screenshot) > 0 {
		// Base64 encode screenshot (in production, you'd upload to S3)
		resp.Screenshot = fmt.Sprintf("data:image/png;base64,%s", screenshot)
	}

	// Extract structured data if requested
	if req.ExtractData {
		extractedData := s.extractStructuredData(content)
		resp.ExtractedData = extractedData
	}

	return resp, nil
}

// scrapeWithHTTP performs HTTP-based scraping (fallback)
func (s *ScraperService) scrapeWithHTTP(req ScrapeRequest, resp *ScrapeResponse) (*ScrapeResponse, error) {
	// This is a simplified HTTP scraping implementation
	// In practice, you'd use the existing scraper from the share repo
	resp.Error = "HTTP scraping not implemented in this example"
	resp.Metadata["method"] = "http"
	resp.Metadata["url"] = req.URL
	resp.Metadata["timestamp"] = time.Now().Unix()
	
	return resp, nil
}

// extractStructuredData extracts structured data from HTML content
func (s *ScraperService) extractStructuredData(content string) map[string]interface{} {
	data := make(map[string]interface{})
	
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(content))
	if err != nil {
		return data
	}

	// Extract common metadata
	data["title"] = doc.Find("title").Text()
	data["description"] = doc.Find("meta[name=description]").AttrOr("content", "")
	data["keywords"] = doc.Find("meta[name=keywords]").AttrOr("content", "")
	
	// Extract Open Graph data
	ogData := make(map[string]string)
	doc.Find("meta[property^=og:]").Each(func(i int, s *goquery.Selection) {
		property := s.AttrOr("property", "")
		content := s.AttrOr("content", "")
		if property != "" && content != "" {
			ogData[property] = content
		}
	})
	if len(ogData) > 0 {
		data["openGraph"] = ogData
	}

	// Extract links
	var links []map[string]string
	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		href := s.AttrOr("href", "")
		text := strings.TrimSpace(s.Text())
		if href != "" && text != "" {
			links = append(links, map[string]string{
				"href": href,
				"text": text,
			})
		}
	})
	if len(links) > 0 {
		data["links"] = links
	}

	// Extract images
	var images []map[string]string
	doc.Find("img[src]").Each(func(i int, s *goquery.Selection) {
		src := s.AttrOr("src", "")
		alt := s.AttrOr("alt", "")
		if src != "" {
			images = append(images, map[string]string{
				"src": src,
				"alt": alt,
			})
		}
	})
	if len(images) > 0 {
		data["images"] = images
	}

	return data
}

// handleRequest processes the Lambda request
func handleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req ScrapeRequest
	
	// Parse request body
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       fmt.Sprintf(`{"error": "Invalid JSON: %v"}`, err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Validate required fields
	if req.URL == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"error": "URL is required"}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Create scraper service
	scraper := NewScraperService()

	// Perform scraping
	response, err := scraper.Scrape(req)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf(`{"error": "Scraping failed: %v"}`, err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Marshal response
	responseBody, err := json.Marshal(response)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf(`{"error": "Response marshaling failed: %v"}`, err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}