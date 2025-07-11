package awesomelist

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/go-git/go-git/v5"
	"github.com/google/go-github/v66/github"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

// AwesomeListCrawler handles crawling awesome lists
type AwesomeListCrawler struct {
	db         *gorm.DB
	githubClient *github.Client
	baseDataDir  string
}

// NewAwesomeListCrawler creates a new awesome list crawler
func NewAwesomeListCrawler(db *gorm.DB, githubToken string) *AwesomeListCrawler {
	var client *github.Client
	if githubToken != "" {
		ts := oauth2.StaticTokenSource(
			&oauth2.Token{AccessToken: githubToken},
		)
		tc := oauth2.NewClient(context.Background(), ts)
		client = github.NewClient(tc)
	} else {
		client = github.NewClient(nil) // Anonymous client with rate limits
	}
	
	return &AwesomeListCrawler{
		db:           db,
		githubClient: client,
		baseDataDir:  "./data/awesomelist",
	}
}

// CrawlAwesomeList crawls a single awesome list repository
func (c *AwesomeListCrawler) CrawlAwesomeList(ctx context.Context, repoURL string) error {
	// Parse the repository URL
	parsedURL, err := url.Parse(repoURL)
	if err != nil {
		return errors.Wrapf(err, "failed to parse repository URL: %s", repoURL)
	}

	// Extract owner and repo name from GitHub URL
	pathParts := strings.Split(strings.Trim(parsedURL.Path, "/"), "/")
	if len(pathParts) < 2 {
		return errors.Errorf("invalid GitHub repository URL: %s", repoURL)
	}
	
	owner := pathParts[0]
	repo := pathParts[1]
	
	// Check if we already have this awesome list
	var existingContent models.Content
	err = c.db.Where("type = ? AND data = ?", "awesome-list", repoURL).First(&existingContent).Error
	if err == nil {
		// Already exists, check if we should update
		if time.Since(existingContent.UpdatedAt) < 24*time.Hour {
			return nil // Skip if updated recently
		}
	}

	// Clone the repository
	repoDir, err := c.cloneRepository(repoURL)
	if err != nil {
		return errors.Wrapf(err, "failed to clone repository: %s", repoURL)
	}

	// Parse the README.md file
	readmePath := filepath.Join(repoDir, "README.md")
	links, categories, err := c.parseReadme(readmePath)
	if err != nil {
		return errors.Wrapf(err, "failed to parse README.md for: %s", repoURL)
	}

	// Get repository metadata from GitHub API
	ghRepo, _, err := c.githubClient.Repositories.Get(ctx, owner, repo)
	if err != nil {
		return errors.Wrapf(err, "failed to get repository metadata for: %s/%s", owner, repo)
	}

	// Create or update the awesome list content
	metadata := map[string]interface{}{
		"github_url":      repoURL,
		"owner":           owner,
		"repo":            repo,
		"description":     "",
		"stars":           0,
		"forks":           0,
		"last_updated":    time.Now(),
		"categories":      categories,
		"link_count":      len(links),
		"clone_path":      repoDir,
	}

	if ghRepo != nil {
		if ghRepo.Description != nil {
			metadata["description"] = *ghRepo.Description
		}
		if ghRepo.StargazersCount != nil {
			metadata["stars"] = *ghRepo.StargazersCount
		}
		if ghRepo.ForksCount != nil {
			metadata["forks"] = *ghRepo.ForksCount
		}
	}

	// Create or update the main awesome list content
	if err == gorm.ErrRecordNotFound {
		// Create new content
		content := models.NewContent("awesome-list", repoURL, "default", "system", metadata)
		if err := c.db.Create(content).Error; err != nil {
			return errors.Wrapf(err, "failed to create awesome list content for: %s", repoURL)
		}
		existingContent = *content
	} else {
		// Update existing content
		existingContent.Metadata = models.MakeJSONField(metadata)
		existingContent.UpdatedAt = time.Now()
		if err := c.db.Save(&existingContent).Error; err != nil {
			return errors.Wrapf(err, "failed to update awesome list content for: %s", repoURL)
		}
	}

	// Store individual links as separate content entries
	for _, link := range links {
		linkMetadata := map[string]interface{}{
			"parent_awesome_list": existingContent.ID,
			"category":            link.Category,
			"title":               link.Title,
			"url":                 link.URL,
			"description":         link.Description,
		}

		linkContent := models.NewContent("awesome-link", link.URL, "default", "system", linkMetadata)
		linkContent.ParentContentID = &existingContent.ID
		
		// Check if link already exists
		var existingLink models.Content
		err = c.db.Where("type = ? AND data = ? AND parent_content_id = ?", 
			"awesome-link", link.URL, existingContent.ID).First(&existingLink).Error
		
		if err == gorm.ErrRecordNotFound {
			if err := c.db.Create(linkContent).Error; err != nil {
				// Log error but don't fail the entire operation
				fmt.Printf("Warning: failed to create link content for %s: %v\n", link.URL, err)
			}
		}
	}

	return nil
}

// cloneRepository clones a git repository to the local filesystem
func (c *AwesomeListCrawler) cloneRepository(repoURL string) (string, error) {
	if err := os.MkdirAll(c.baseDataDir, 0755); err != nil {
		return "", errors.Wrapf(err, "failed to create data directory: %s", c.baseDataDir)
	}

	repoDir := filepath.Join(c.baseDataDir, uuid.NewString())
	
	// Check if directory already exists (shouldn't happen with UUID, but just in case)
	if _, err := os.Stat(repoDir); err == nil {
		return repoDir, nil // Already exists
	}

	cloneOptions := &git.CloneOptions{
		URL:          repoURL,
		SingleBranch: true,
		Depth:        1, // Shallow clone for better performance
	}

	_, err := git.PlainClone(repoDir, false, cloneOptions)
	if err != nil {
		return "", errors.Wrapf(err, "failed to clone repository: %s", repoURL)
	}

	return repoDir, nil
}

// AwesomeLink represents a link found in an awesome list
type AwesomeLink struct {
	Category    string
	Title       string
	URL         string
	Description string
}

// parseReadme parses a README.md file and extracts awesome list links
func (c *AwesomeListCrawler) parseReadme(readmePath string) ([]AwesomeLink, []string, error) {
	content, err := os.ReadFile(readmePath)
	if err != nil {
		return nil, nil, errors.Wrapf(err, "failed to read README.md: %s", readmePath)
	}

	// Try to parse as HTML first, but fall back to regex if we don't find meaningful content
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(content)))
	if err != nil {
		// Fallback to regex-based parsing if HTML parsing fails
		return c.parseReadmeWithRegex(string(content))
	}

	var links []AwesomeLink
	var categories []string
	currentCategory := "General"

	// Find all headings and links
	doc.Find("h1, h2, h3, h4, h5, h6, a").Each(func(i int, s *goquery.Selection) {
		tagName := s.Get(0).Data
		
		// Update current category based on headings
		if strings.HasPrefix(tagName, "h") {
			currentCategory = strings.TrimSpace(s.Text())
			if currentCategory != "" && !contains(categories, currentCategory) {
				categories = append(categories, currentCategory)
			}
		}
		
		// Extract links
		if tagName == "a" {
			href, exists := s.Attr("href")
			if exists && href != "" {
				title := strings.TrimSpace(s.Text())
				description := ""
				
				// Try to get description from parent or sibling elements
				if parent := s.Parent(); parent != nil {
					description = strings.TrimSpace(parent.Text())
					if len(description) > 200 {
						description = description[:200] + "..."
					}
				}
				
				links = append(links, AwesomeLink{
					Category:    currentCategory,
					Title:       title,
					URL:         href,
					Description: description,
				})
			}
		}
	})

	// If HTML parsing didn't find meaningful content, fall back to regex parsing
	if len(links) == 0 && len(categories) == 0 {
		return c.parseReadmeWithRegex(string(content))
	}

	return links, categories, nil
}

// parseReadmeWithRegex provides a fallback regex-based parsing for README files
func (c *AwesomeListCrawler) parseReadmeWithRegex(content string) ([]AwesomeLink, []string, error) {
	var links []AwesomeLink
	var categories []string
	
	// Regex patterns for markdown links and headings
	linkRegex := regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
	headingRegex := regexp.MustCompile(`^#+\s+(.+)$`)
	
	lines := strings.Split(content, "\n")
	currentCategory := "General"
	
	for _, line := range lines {
		line = strings.TrimSpace(line)
		
		// Check for headings
		if headingMatches := headingRegex.FindStringSubmatch(line); headingMatches != nil {
			currentCategory = strings.TrimSpace(headingMatches[1])
			if currentCategory != "" && !contains(categories, currentCategory) {
				categories = append(categories, currentCategory)
			}
		}
		
		// Check for links
		linkMatches := linkRegex.FindAllStringSubmatch(line, -1)
		for _, match := range linkMatches {
			if len(match) >= 3 {
				title := strings.TrimSpace(match[1])
				url := strings.TrimSpace(match[2])
				
				// Skip relative links and anchors
				if strings.HasPrefix(url, "#") || strings.HasPrefix(url, "./") || strings.HasPrefix(url, "../") {
					continue
				}
				
				links = append(links, AwesomeLink{
					Category:    currentCategory,
					Title:       title,
					URL:         url,
					Description: "",
				})
			}
		}
	}
	
	return links, categories, nil
}

// contains checks if a string slice contains a specific string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// New creates the HTTP handler for the awesome list crawler
func New(d deps.Deps) *http.ServeMux {
	// Get GitHub token from config
	githubToken := ""
	if d.Config.Github.ClientSecret != "" {
		githubToken = d.Config.Github.ClientSecret // Use as personal access token
	}
	
	crawler := NewAwesomeListCrawler(d.DB, githubToken)
	
	m := http.NewServeMux()
	
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			crawler.handleListAwesomeLists(w, r, d)
		case http.MethodPost:
			crawler.handleCrawlAwesomeList(w, r, d)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	
	m.HandleFunc("/crawl", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		crawler.handleCrawlAwesomeList(w, r, d)
	})
	
	return m
}

// handleListAwesomeLists displays all crawled awesome lists
func (c *AwesomeListCrawler) handleListAwesomeLists(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	var awesomeLists []models.Content
	err := c.db.Where("type = ?", "awesome-list").Order("updated_at DESC").Find(&awesomeLists).Error
	if err != nil {
		http.Error(w, "Failed to fetch awesome lists", http.StatusInternalServerError)
		return
	}

	ctx := context.WithValue(r.Context(), "baseURL", "/awesomelist")
	DefaultLayout(
		Div(
			Class("container mx-auto p-4"),
			H1(Class("text-3xl font-bold mb-6"), Text("Awesome Lists")),
			P(Class("text-gray-600 mb-8"), Text("Discover and explore curated awesome lists from GitHub")),
			
			// Crawl form
			Form(
				Class("mb-8 p-4 bg-gray-50 rounded-lg"),
				Action("/crawl"),
				Method("POST"),
				Div(
					Class("flex gap-2"),
					Input(
						Type("url"),
						Name("repo_url"),
						Placeholder("https://github.com/sindresorhus/awesome"),
						Class("flex-1 px-3 py-2 border border-gray-300 rounded"),
						Attr("required", "required"),
					),
					Button(
						Type("submit"),
						Class("px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"),
						Text("Crawl List"),
					),
				),
			),
			
			// Display awesome lists
			c.renderAwesomeListsGrid(awesomeLists),
		),
	).RenderPageCtx(ctx, w, r)
}

// handleCrawlAwesomeList handles crawling a new awesome list
func (c *AwesomeListCrawler) handleCrawlAwesomeList(w http.ResponseWriter, r *http.Request, d deps.Deps) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	repoURL := r.FormValue("repo_url")
	if repoURL == "" {
		http.Error(w, "Repository URL is required", http.StatusBadRequest)
		return
	}

	// Start crawling in background
	go func() {
		if err := c.CrawlAwesomeList(context.Background(), repoURL); err != nil {
			fmt.Printf("Error crawling awesome list %s: %v\n", repoURL, err)
		}
	}()

	// Redirect back to the main page
	http.Redirect(w, r, "/awesomelist", http.StatusSeeOther)
}

// renderAwesomeListsGrid renders the grid of awesome lists
func (c *AwesomeListCrawler) renderAwesomeListsGrid(awesomeLists []models.Content) *Node {
	if len(awesomeLists) == 0 {
		return Div(
			Class("text-center py-8"),
			P(Class("text-gray-500"), Text("No awesome lists found. Start by crawling one!")),
		)
	}

	var cards []*Node
	for _, list := range awesomeLists {
		cards = append(cards, c.renderAwesomeListCard(list))
	}

	return Div(
		Class("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"),
		Ch(cards),
	)
}

// renderAwesomeListCard renders a single awesome list card
func (c *AwesomeListCrawler) renderAwesomeListCard(list models.Content) *Node {
	var title, description string
	var stars, linkCount int
	
	if list.Metadata != nil {
		metadata := list.Metadata.Data
		if repo, ok := metadata["repo"].(string); ok {
			title = repo
		}
		if desc, ok := metadata["description"].(string); ok {
			description = desc
		}
		if s, ok := metadata["stars"].(float64); ok {
			stars = int(s)
		}
		if lc, ok := metadata["link_count"].(float64); ok {
			linkCount = int(lc)
		}
	}

	if title == "" {
		title = list.Data
	}

	return Div(
		Class("bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"),
		Div(
			Class("flex items-start justify-between mb-4"),
			H3(Class("text-xl font-semibold"), Text(title)),
			Div(
				Class("flex items-center text-yellow-500"),
				Text("⭐ " + fmt.Sprintf("%d", stars)),
			),
		),
		P(Class("text-gray-600 mb-4"), Text(description)),
		Div(
			Class("flex items-center justify-between text-sm text-gray-500"),
			Span(Text(fmt.Sprintf("%d links", linkCount))),
			Span(Text("Updated: " + list.UpdatedAt.Format("Jan 2, 2006"))),
		),
	)
}