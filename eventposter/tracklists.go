package eventposter

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"golang.org/x/net/html"
)

// TracklistSearchResult represents a DJ set from 1001tracklists
type TracklistSearchResult struct {
	Title         string   `json:"title"`
	Artist        string   `json:"artist"`
	Date          string   `json:"date"`
	Event         string   `json:"event"`
	URL           string   `json:"url"`
	ViewCount     int      `json:"view_count"`
	TracksIDed    int      `json:"tracks_ided"`
	TotalTracks   int      `json:"total_tracks"`
	Duration      string   `json:"duration"`
	MusicStyles   []string `json:"music_styles"`
	CreatedBy     string   `json:"created_by"`
	HasVideo      bool     `json:"has_video"`
	HasSoundCloud bool     `json:"has_soundcloud"`
	ArtworkURL    string   `json:"artwork_url"`
}

// Search1001Tracklists searches for DJ sets on 1001tracklists.com and returns parsed results
func Search1001Tracklists(query string) ([]TracklistSearchResult, error) {
	htmlContent, err := search1001TracklistsRaw(query)
	if err != nil {
		return nil, err
	}
	
	return parseSearchResults(htmlContent)
}

// SearchTracklistsForArtists searches for DJ sets for multiple artists
func SearchTracklistsForArtists(artists []string) (map[string][]TracklistSearchResult, error) {
	results := make(map[string][]TracklistSearchResult)
	
	for _, artist := range artists {
		if artist == "" {
			continue
		}
		
		// Search for this specific artist
		artistResults, err := Search1001Tracklists(artist)
		if err != nil {
			// Don't fail the entire search if one artist fails
			continue
		}
		
		// Filter results to only include sets that actually match the artist
		var filteredResults []TracklistSearchResult
		for _, result := range artistResults {
			if strings.Contains(strings.ToLower(result.Artist), strings.ToLower(artist)) ||
			   strings.Contains(strings.ToLower(result.Title), strings.ToLower(artist)) {
				filteredResults = append(filteredResults, result)
			}
		}
		
		if len(filteredResults) > 0 {
			results[artist] = filteredResults
		}
	}
	
	return results, nil
}

// search1001TracklistsRaw performs the raw HTTP request and returns HTML
func search1001TracklistsRaw(query string) (string, error) {
	searchURL := "https://www.1001tracklists.com/search/result.php"
	
	// Build form data
	formData := url.Values{}
	formData.Set("main_search", query)
	formData.Set("search_selection", "9")
	formData.Set("orderby", "added")
	
	// Create request
	req, err := http.NewRequest("POST", searchURL, strings.NewReader(formData.Encode()))
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	
	// Set headers
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Pragma", "no-cache")
	req.Header.Set("Sec-Ch-Ua", `"Chromium";v="137", "Not/A)Brand";v="24"`)
	req.Header.Set("Sec-Ch-Ua-Mobile", "?0")
	req.Header.Set("Sec-Ch-Ua-Platform", `"macOS"`)
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "same-origin")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://www.1001tracklists.com/search/result.php")
	
	// Execute request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()
	
	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading response: %w", err)
	}
	
	return string(body), nil
}

// parseSearchResults parses the HTML response and extracts DJ set information
func parseSearchResults(htmlContent string) ([]TracklistSearchResult, error) {
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		return nil, fmt.Errorf("parsing HTML: %w", err)
	}
	
	var results []TracklistSearchResult
	
	// Find all search result items
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "div" {
			// Check if this is a search result item
			if hasClass(n, "bItm") && hasClass(n, "action") && hasClass(n, "oItm") {
				if result := parseResultItem(n); result != nil {
					results = append(results, *result)
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)
	
	return results, nil
}

// parseResultItem extracts information from a single search result div
func parseResultItem(n *html.Node) *TracklistSearchResult {
	result := &TracklistSearchResult{
		MusicStyles: []string{},
	}
	
	// Extract data-id for URL construction
	dataID := getAttr(n, "data-id")
	if dataID == "" {
		return nil
	}
	
	// Extract artwork URL
	if img := findFirstElement(n, "img"); img != nil {
		result.ArtworkURL = getAttr(img, "data-src")
		if result.ArtworkURL == "" {
			result.ArtworkURL = getAttr(img, "src")
		}
	}
	
	// Extract title and URL from the link
	if titleLink := findFirstElementWithClass(n, "a", ""); titleLink != nil {
		result.Title = getTextContent(titleLink)
		href := getAttr(titleLink, "href")
		if href != "" {
			result.URL = "https://www.1001tracklists.com" + href
		}
	}
	
	// Parse the media row for metadata
	mediaRow := findFirstElementWithClass(n, "div", "mediaRow")
	if mediaRow != nil {
		parseMediaRow(mediaRow, result)
	}
	
	// Extract artist and event from title
	parseArtistAndEvent(result)
	
	return result
}

// parseMediaRow extracts metadata from the media row div
func parseMediaRow(n *html.Node, result *TracklistSearchResult) {
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if c.Type == html.ElementNode && c.Data == "div" {
			title := getAttr(c, "title")
			text := strings.TrimSpace(getTextContent(c))
			
			switch title {
			case "tracklist views":
				if count := getAttr(c, "data-count"); count != "" {
					// Handle numbers with 'k' suffix (e.g., "3.2k")
					count = strings.TrimSpace(count)
					if strings.HasSuffix(count, "k") {
						numStr := strings.TrimSuffix(count, "k")
						if val, err := strconv.ParseFloat(numStr, 64); err == nil {
							result.ViewCount = int(val * 1000)
						}
					} else {
						if val, err := strconv.Atoi(count); err == nil {
							result.ViewCount = val
						}
					}
				}
			case "tracklist date":
				result.Date = text
			case "IDed tracks / total tracks":
				if parts := strings.Split(text, "/"); len(parts) == 2 {
					if val, err := strconv.Atoi(parts[0]); err == nil {
						result.TracksIDed = val
					}
					if val, err := strconv.Atoi(parts[1]); err == nil {
						result.TotalTracks = val
					}
				}
			case "play time":
				result.Duration = text
			case "creator":
				if userLink := findFirstElement(c, "a"); userLink != nil {
					result.CreatedBy = getTextContent(userLink)
				}
			case "musicstyle(s)":
				// Split by comma but also handle styles that may not have spaces after commas
				styleText := strings.TrimSpace(text)
				// First try to split by ", " then by just ","
				var styles []string
				if strings.Contains(styleText, ", ") {
					styles = strings.Split(styleText, ", ")
				} else {
					// Also check for space-separated styles
					styles = strings.Fields(styleText)
				}
				for _, style := range styles {
					style = strings.TrimSpace(style)
					if style != "" {
						result.MusicStyles = append(result.MusicStyles, style)
					}
				}
			}
			
			// Check for media icons by looking at the <i> elements
			if icon := findFirstElement(c, "i"); icon != nil {
				iconTitle := getAttr(icon, "title")
				switch iconTitle {
				case "with youtube video":
					result.HasVideo = true
				case "with soundcloud link":
					result.HasSoundCloud = true
				}
			}
		}
	}
}

// parseArtistAndEvent extracts artist and event info from the title
func parseArtistAndEvent(result *TracklistSearchResult) {
	title := result.Title
	
	// Common pattern: "Artist @ Venue/Stage, Event, Location"
	if idx := strings.Index(title, " @ "); idx != -1 {
		result.Artist = title[:idx]
		result.Event = title[idx+3:]
	} else if idx := strings.Index(title, " - "); idx != -1 {
		// Alternative pattern: "Artist - Event"
		result.Artist = title[:idx]
		result.Event = title[idx+3:]
	} else {
		// Fallback: use the whole title
		result.Artist = title
	}
}

// Helper functions for HTML parsing

func hasClass(n *html.Node, class string) bool {
	for _, attr := range n.Attr {
		if attr.Key == "class" {
			classes := strings.Fields(attr.Val)
			for _, c := range classes {
				if c == class {
					return true
				}
			}
		}
	}
	return false
}

func getAttr(n *html.Node, key string) string {
	for _, attr := range n.Attr {
		if attr.Key == key {
			return attr.Val
		}
	}
	return ""
}

func findFirstElement(n *html.Node, tag string) *html.Node {
	if n.Type == html.ElementNode && n.Data == tag {
		return n
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if found := findFirstElement(c, tag); found != nil {
			return found
		}
	}
	return nil
}

func findFirstElementWithClass(n *html.Node, tag, class string) *html.Node {
	if n.Type == html.ElementNode && n.Data == tag {
		if class == "" || hasClass(n, class) {
			return n
		}
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if found := findFirstElementWithClass(c, tag, class); found != nil {
			return found
		}
	}
	return nil
}

func getTextContent(n *html.Node) string {
	if n.Type == html.TextNode {
		return strings.TrimSpace(n.Data)
	}
	var text string
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		text += getTextContent(c)
	}
	return strings.TrimSpace(text)
}