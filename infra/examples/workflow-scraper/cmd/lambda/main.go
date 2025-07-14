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
	"../../../infra/lambda-docker/runtime"
	"../../../infra/lambda-docker/workflow"
)

// ScrapeWorkflowRequest represents the workflow request for scraping
type ScrapeWorkflowRequest struct {
	Workflow *workflow.Workflow `json:"workflow"`
	Input    ScrapeInput        `json:"input"`
}

// ScrapeInput represents the input for the scraper workflow
type ScrapeInput struct {
	URLs        []string          `json:"urls"`
	Selector    string            `json:"selector,omitempty"`
	WaitFor     string            `json:"waitFor,omitempty"`
	Screenshot  bool              `json:"screenshot,omitempty"`
	ExtractData bool              `json:"extractData,omitempty"`
	Headers     map[string]string `json:"headers,omitempty"`
}

// ScrapeOutput represents the output from the scraper
type ScrapeOutput struct {
	URL           string                 `json:"url"`
	Title         string                 `json:"title"`
	Content       string                 `json:"content"`
	ExtractedData map[string]interface{} `json:"extractedData,omitempty"`
	Screenshot    string                 `json:"screenshot,omitempty"`
	Metadata      map[string]interface{} `json:"metadata"`
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
		chromedp.UserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"),
	}

	allocCtx, _ := chromedp.NewExecAllocator(context.Background(), opts...)
	ctx, _ := chromedp.NewContext(allocCtx)

	return &ScraperService{ctx: ctx}
}

// ScrapeURL scrapes a single URL
func (s *ScraperService) ScrapeURL(url string, input ScrapeInput) (*ScrapeOutput, error) {
	timeoutCtx, cancel := context.WithTimeout(s.ctx, 30*time.Second)
	defer cancel()

	var title, content string
	var screenshot []byte

	actions := []chromedp.Action{
		chromedp.Navigate(url),
		chromedp.Sleep(2 * time.Second),
	}

	// Wait for specific element if requested
	if input.WaitFor != "" {
		actions = append(actions, chromedp.WaitVisible(input.WaitFor, chromedp.ByQuery))
	}

	// Get page content
	if input.Selector != "" {
		actions = append(actions, chromedp.OuterHTML(input.Selector, &content, chromedp.ByQuery))
	} else {
		actions = append(actions, chromedp.OuterHTML("html", &content))
	}

	// Get title
	actions = append(actions, chromedp.Title(&title))

	// Take screenshot if requested
	if input.Screenshot {
		actions = append(actions, chromedp.FullScreenshot(&screenshot, 90))
	}

	err := chromedp.Run(timeoutCtx, actions...)
	if err != nil {
		return nil, fmt.Errorf("chrome scraping failed: %v", err)
	}

	output := &ScrapeOutput{
		URL:     url,
		Title:   title,
		Content: content,
		Metadata: map[string]interface{}{
			"timestamp": time.Now().Unix(),
			"method":    "chrome",
		},
	}

	if input.Screenshot && len(screenshot) > 0 {
		output.Screenshot = fmt.Sprintf("data:image/png;base64,%s", screenshot)
	}

	// Extract structured data if requested
	if input.ExtractData {
		output.ExtractedData = s.extractStructuredData(content)
	}

	return output, nil
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

// handleWorkflowRequest handles the workflow request
func handleWorkflowRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var workflowRequest ScrapeWorkflowRequest
	
	// Parse request body
	if err := json.Unmarshal([]byte(request.Body), &workflowRequest); err != nil {
		return errorResponse(400, fmt.Sprintf("Invalid JSON: %v", err))
	}

	// Validate input
	if workflowRequest.Workflow == nil {
		return errorResponse(400, "Missing workflow configuration")
	}

	if len(workflowRequest.Input.URLs) == 0 {
		return errorResponse(400, "At least one URL is required")
	}

	// Create workflow handler
	handler, err := runtime.NewWorkflowHandler()
	if err != nil {
		return errorResponse(500, fmt.Sprintf("Failed to create handler: %v", err))
	}

	// Process each URL
	scraper := NewScraperService()
	var results []ScrapeOutput
	
	for _, url := range workflowRequest.Input.URLs {
		output, err := scraper.ScrapeURL(url, workflowRequest.Input)
		if err != nil {
			log.Printf("Failed to scrape %s: %v", url, err)
			continue
		}
		results = append(results, *output)
	}

	// Create workflow request with scraped data
	workflowReq := &workflow.WorkflowRequest{
		Workflow: workflowRequest.Workflow,
		Input: map[string]interface{}{
			"data": results,
		},
		Context: map[string]interface{}{
			"timestamp": time.Now().Unix(),
			"date":      time.Now().Format("2006-01-02"),
		},
	}

	// Execute workflow
	executor, err := runtime.NewRuntimeExecutor()
	if err != nil {
		return errorResponse(500, fmt.Sprintf("Failed to create executor: %v", err))
	}

	response, err := executor.ExecuteWorkflow(ctx, workflowReq)
	if err != nil {
		return errorResponse(500, fmt.Sprintf("Workflow execution failed: %v", err))
	}

	return successResponse(response)
}

// errorResponse creates an error response
func errorResponse(statusCode int, message string) (events.APIGatewayProxyResponse, error) {
	body := map[string]string{
		"error": message,
	}
	bodyJSON, _ := json.Marshal(body)

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Body:       string(bodyJSON),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

// successResponse creates a success response
func successResponse(data interface{}) (events.APIGatewayProxyResponse, error) {
	bodyJSON, err := json.Marshal(data)
	if err != nil {
		return errorResponse(500, fmt.Sprintf("Failed to marshal response: %v", err))
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(bodyJSON),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func main() {
	lambda.Start(handleWorkflowRequest)
}