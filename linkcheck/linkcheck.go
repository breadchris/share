package main

import (
	"flag"
	"fmt"
	"golang.org/x/net/html"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"regexp"
	"strings"
	"syscall"
	"time"
)

// runCrawlWithErrorHandling executes the crawl and handles errors
func runCrawlWithErrorHandling(config Config) int {
	defer func() {
		if r := recover(); r != nil {
			fmt.Fprintln(os.Stderr, "INTERNAL ERROR: Sorry! Please open https://github.com/filiph/linkcheck/issues/new and report the following error:\n")
			fmt.Fprintln(os.Stderr, r)
			fmt.Fprintln(os.Stderr, "Stack trace:", r)
		}
	}()

	// Simulate crawl execution (replace this with your actual crawl function)
	if err := startCrawl(config); err != nil {
		fmt.Fprintln(os.Stderr, "Error during crawl:", err)
		return 2 // Exit with code 2 on error
	}

	return 0
}

func startCrawl(config Config) error {
	// Parse and validate arguments
	validateArguments(&config)

	// Initialize the crawl results
	results := CrawlResults{}

	// Perform the crawl
	for _, rawURL := range config.URLs {
		url, err := sanitizeURL(rawURL)
		if err != nil {
			return fmt.Errorf("invalid URL: %w", err)
		}

		client := initializeHTTPClient()

		// Perform the crawl
		crawlResult, err := crawlURL(url, config, client)
		if err != nil {
			return fmt.Errorf("error crawling URL %s: %w", url, err)
		}

		results.Links = append(results.Links, crawlResult)
	}

	// Analyze and print the results
	analyzeCrawlResults(&results)
	printCrawlSummary(&results)
	generateReport(&results)

	return nil
}

func crawlURL(url string, config Config, client *http.Client) (LinkResult, error) {
	linkResult := LinkResult{URL: url}

	// Perform the HTTP request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return linkResult, fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("User-Agent", "linkcheck/"+appVersion)
	resp, err := client.Do(req)
	if err != nil {
		return linkResult, fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()

	linkResult.StatusCode = resp.StatusCode

	// Check if the link is broken
	if isBrokenLink(resp.StatusCode) {
		linkResult.IsBroken = true
	}

	return linkResult, nil
}

type Config struct {
	HelpFlag                         bool
	VersionFlag                      bool
	ExternalFlag                     bool
	ShowRedirects                    bool
	CheckAnchors                     bool
	InputFile                        string
	SkipFile                         string
	Hosts                            []string
	AnsiFlag                         bool
	ConnectionFailuresAsWarningsFlag bool
	DebugFlag                        bool
	URLs                             []string
}

const (
	defaultUrl  = "http://localhost:8080/"
	appVersion  = "3.1.0"
	helpMessage = "Linkcheck will crawl given site and check links.\n" +
		"usage: linkcheck [switches] [url]\n"
)

func parseArguments() Config {
	var config Config

	flag.BoolVar(&config.HelpFlag, "h", false, "Prints usage help")
	flag.BoolVar(&config.VersionFlag, "v", false, "Prints version")
	flag.BoolVar(&config.ExternalFlag, "e", false, "Check external (remote) links, too. Defaults to checking internal links only.")
	flag.BoolVar(&config.ShowRedirects, "show-redirects", false, "Also report all links that point at a redirected URL")
	flag.BoolVar(&config.CheckAnchors, "check-anchors", true, "Report links pointing at a missing anchor")
	flag.StringVar(&config.InputFile, "input-file", "", "Get list of URLs from the specified text file (one URL per line)")
	flag.StringVar(&config.SkipFile, "skip-file", "", "Get list of URLs to skip from a text file (one RegExp pattern per line)")
	flag.Var((*stringSlice)(&config.Hosts), "hosts", "Paths to check as globs for hosts, separated by commas")
	flag.BoolVar(&config.AnsiFlag, "nice", true, "Use ANSI terminal capabilities for nicer input. Disable if output appears broken.")
	flag.BoolVar(&config.ConnectionFailuresAsWarningsFlag, "connection-failures-as-warnings", false, "Report connection failures as warnings rather than errors")
	flag.BoolVar(&config.DebugFlag, "d", false, "Debug mode (very verbose)")

	// Parse command-line arguments
	flag.Parse()
	config.URLs = flag.Args()

	return config
}

func validateArguments(config *Config) {
	if config.HelpFlag {
		fmt.Println(helpMessage)
		flag.PrintDefaults()
		os.Exit(0)
	}

	if config.VersionFlag {
		fmt.Printf("linkcheck version %s\n", appVersion)
		os.Exit(0)
	}

	// Set default URL if none is provided
	if len(config.URLs) == 0 {
		fmt.Println("No URL given, checking", defaultUrl)
		config.URLs = append(config.URLs, defaultUrl)
	}

	// Validate input file and skip file paths if provided
	if config.InputFile != "" {
		if _, err := os.Stat(config.InputFile); os.IsNotExist(err) {
			fmt.Printf("Error: input file '%s' not found\n", config.InputFile)
			os.Exit(2)
		}
	}

	if config.SkipFile != "" {
		if _, err := os.Stat(config.SkipFile); os.IsNotExist(err) {
			fmt.Printf("Error: skip file '%s' not found\n", config.SkipFile)
			os.Exit(2)
		}
	}
}

// Helper type to parse comma-separated list of hosts
type stringSlice []string

func (s *stringSlice) String() string {
	return fmt.Sprint(*s)
}

func (s *stringSlice) Set(value string) error {
	*s = append(*s, value)
	return nil
}

// sanitizeURL trims whitespace, handles port-only URLs, and adds http:// if no scheme is provided.
func sanitizeURL(rawURL string) (string, error) {
	rawURL = strings.TrimSpace(rawURL)
	if strings.HasPrefix(rawURL, ":") { // Port-only URL
		rawURL = "http://localhost" + rawURL
	} else if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "http://" + rawURL
	}

	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("invalid URL format: %w", err)
	}

	return parsedURL.String(), nil
}

// resolveURL resolves a relative URL against a base URL.
func resolveURL(baseURL, relativePath string) (string, error) {
	base, err := url.Parse(baseURL)
	if err != nil {
		return "", fmt.Errorf("invalid base URL: %w", err)
	}

	rel, err := url.Parse(relativePath)
	if err != nil {
		return "", fmt.Errorf("invalid relative URL: %w", err)
	}

	return base.ResolveReference(rel).String(), nil
}

// parseHTML extracts links from an HTML document.
func parseHTML(r io.Reader) ([]string, error) {
	var links []string
	tokenizer := html.NewTokenizer(r)

	for {
		tt := tokenizer.Next()
		switch {
		case tt == html.ErrorToken:
			if tokenizer.Err() == io.EOF {
				return links, nil
			}
			return nil, tokenizer.Err()
		case tt == html.StartTagToken, tt == html.SelfClosingTagToken:
			tagName, hasAttr := tokenizer.TagName()
			tag := string(tagName)

			// Check if tag can contain URLs
			if tag == "a" || tag == "link" || tag == "iframe" || tag == "img" {
				for hasAttr {
					key, val, moreAttr := tokenizer.TagAttr()
					attr := string(key)
					if (tag == "a" && attr == "href") || attr == "src" {
						links = append(links, string(val))
					}
					hasAttr = moreAttr
				}
			}
		}
	}
}

// parseCSS uses a regex to find URLs in CSS content.
func parseCSS(content string) []string {
	var links []string
	re := regexp.MustCompile(`url\(["']?([^"')]+)["']?\)`)
	matches := re.FindAllStringSubmatch(content, -1)

	for _, match := range matches {
		if len(match) > 1 {
			links = append(links, strings.TrimSpace(match[1]))
		}
	}
	return links
}

// LinkResult represents a link crawl result
type LinkResult struct {
	URL        string
	StatusCode int
	IsBroken   bool
	IsSkipped  bool
	Redirects  []string
}

// CrawlResults stores the results of the crawling process
type CrawlResults struct {
	Links        []LinkResult
	TotalChecked int
	BrokenCount  int
	SkippedCount int
}

// analyzeCrawlResults analyzes the results and updates counts for total checked, broken, and skipped links
func analyzeCrawlResults(results *CrawlResults) {
	results.TotalChecked = len(results.Links)
	for _, link := range results.Links {
		if link.IsBroken {
			results.BrokenCount++
		}
		if link.IsSkipped {
			results.SkippedCount++
		}
	}
	fmt.Printf("Total Links Checked: %d\n", results.TotalChecked)
	fmt.Printf("Broken Links: %d\n", results.BrokenCount)
	fmt.Printf("Skipped Links: %d\n", results.SkippedCount)
}

// printCrawlSummary outputs a concise summary of crawl results
func printCrawlSummary(results *CrawlResults) {
	fmt.Println("\n--- Crawl Summary ---")
	fmt.Printf("Total Links Checked: %d\n", results.TotalChecked)
	fmt.Printf("Broken Links: %d\n", results.BrokenCount)
	fmt.Printf("Skipped Links: %d\n", results.SkippedCount)

	if results.BrokenCount == 0 {
		fmt.Println("All links are healthy!")
	} else {
		fmt.Println("Some links are broken. See detailed report below.")
	}
}

// generateReport creates a detailed report of crawl results
func generateReport(results *CrawlResults) {
	fmt.Println("\n--- Detailed Report ---")
	for _, link := range results.Links {
		status := "Healthy"
		if link.IsBroken {
			status = "Broken"
		} else if link.IsSkipped {
			status = "Skipped"
		}

		fmt.Printf("URL: %s\n", link.URL)
		fmt.Printf("Status: %s (Code: %d)\n", status, link.StatusCode)

		if len(link.Redirects) > 0 {
			fmt.Println("Redirect Path:")
			for _, redirect := range link.Redirects {
				fmt.Printf("  -> %s\n", redirect)
			}
		}
		fmt.Println()
	}
}

func filterLinks(links []Link, skipPatterns []*regexp.Regexp) []Link {
	var filteredLinks []Link

	for _, link := range links {
		skip := false
		for _, pattern := range skipPatterns {
			if pattern.MatchString(link.URL) {
				skip = true
				break
			}
		}
		if !skip {
			filteredLinks = append(filteredLinks, link)
		}
	}

	return filteredLinks
}

func isBrokenLink(statusCode int) bool {
	// Generally, HTTP status codes 400 and above indicate issues.
	return statusCode >= 400
}

func parseRobotsTxt(baseURL, userAgent string) ([]string, error) {
	resp, err := http.Get(baseURL + "/robots.txt")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	allowedPaths := []string{}
	deniedPaths := []string{}
	parseRules := false
	for _, line := range strings.Split(resp.Body, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "User-agent:") {
			// If it's a specific user-agent rule, check if it matches
			if strings.Contains(line, userAgent) || strings.Contains(line, "*") {
				parseRules = true
			} else {
				parseRules = false
			}
		} else if parseRules {
			if strings.HasPrefix(line, "Disallow:") {
				path := strings.TrimSpace(strings.TrimPrefix(line, "Disallow:"))
				deniedPaths = append(deniedPaths, path)
			} else if strings.HasPrefix(line, "Allow:") {
				path := strings.TrimSpace(strings.TrimPrefix(line, "Allow:"))
				allowedPaths = append(allowedPaths, path)
			}
		}
	}

	return deniedPaths, nil
}

func normalizeAnchor(anchor string) string {
	decodedAnchor, err := url.QueryUnescape(anchor)
	if err != nil {
		return anchor // If decoding fails, return the original anchor.
	}
	return decodedAnchor
}

// handleSignals listens for interrupt and termination signals
// to perform graceful shutdown.
func handleSignals(shutdownChan chan<- struct{}) {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		fmt.Printf("\nReceived signal: %s. Initiating graceful shutdown...\n", sig)
		close(shutdownChan)
	}()
}

// initializeHTTPClient configures and returns an HTTP client with timeouts and user-agent settings.
func initializeHTTPClient() *http.Client {
	return &http.Client{
		Timeout: 10 * time.Second, // Adjust as needed
		Transport: &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   5 * time.Second,
				KeepAlive: 30 * time.Second,
			}).DialContext,
			TLSHandshakeTimeout:   5 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
			IdleConnTimeout:       90 * time.Second,
			MaxIdleConns:          100,
		},
	}
}

// createShutdownChannel creates and returns a shutdown channel for signaling app termination.
func createShutdownChannel() chan struct{} {
	return make(chan struct{})
}

func main() {
	// Initialize the HTTP client
	client := initializeHTTPClient()

	// Create shutdown channel
	shutdownChan := createShutdownChannel()

	// Handle signals for graceful shutdown
	handleSignals(shutdownChan)

	// Your application logic here
	fmt.Println("Starting application...")
	select {
	case <-shutdownChan:
		fmt.Println("Shutdown signal received. Cleaning up...")
		// Perform any necessary cleanup here before exiting
		time.Sleep(1 * time.Second) // Example delay for cleanup (adjust as needed)
		fmt.Println("Cleanup complete. Exiting.")
	}
}
