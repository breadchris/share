package main

import (
	"fmt"
	"net/http"
	"os"
	"testing"
)

func TestMain(t *testing.T) {
	// Parse and validate arguments
	config, err := parseArguments()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error parsing arguments:", err)
		os.Exit(1)
	}

	// Run the crawl with error handling
	exitCode := runCrawlWithErrorHandling(config)
	os.Exit(exitCode)
}

func TestParse(t *testing.T) {
	// Sample usage for sanitizeURL
	url, err := sanitizeURL(" :8080")
	if err != nil {
		fmt.Println("Error sanitizing URL:", err)
	} else {
		fmt.Println("Sanitized URL:", url)
	}

	// Sample usage for resolveURL
	fullURL, err := resolveURL("http://example.com", "/about")
	if err != nil {
		fmt.Println("Error resolving URL:", err)
	} else {
		fmt.Println("Resolved URL:", fullURL)
	}

	// Sample usage for parseHTML
	resp, err := http.Get("http://example.com")
	if err != nil {
		fmt.Println("Error fetching HTML:", err)
		return
	}
	defer resp.Body.Close()

	links, err := parseHTML(resp.Body)
	if err != nil {
		fmt.Println("Error parsing HTML:", err)
	} else {
		fmt.Println("HTML Links found:", links)
	}

	// Sample usage for parseCSS
	cssContent := `body { background: url('background.jpg'); }`
	cssLinks := parseCSS(cssContent)
	fmt.Println("CSS Links found:", cssLinks)
}

func TestCrawl(t *testing.T) {
	results := &CrawlResults{
		Links: []LinkResult{
			{URL: "http://example.com", StatusCode: 200, IsBroken: false},
			{URL: "http://broken-link.com", StatusCode: 404, IsBroken: true},
			{URL: "http://skipped-link.com", StatusCode: 0, IsSkipped: true},
		},
	}

	// Analyze and output the results
	analyzeCrawlResults(results)
	printCrawlSummary(results)
	generateReport(results)
}
