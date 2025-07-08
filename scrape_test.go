package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/db"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/chromedp/chromedp"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"io"
	"io/fs"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
	"time"
)

func TestScrape(t *testing.T) {
	c := NewCrawler()

	err := c.Crawl("https://smittenkitchen.com/")
	if err != nil {
		t.Error(err)
	}
}
func parseRecipe(d deps.Deps, path string) (*models.Recipe, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	doc, err := goquery.NewDocumentFromReader(f)
	if err != nil {
		return nil, err
	}

	var (
		t string
	)

	s := doc.Find(".jetpack-recipe-content").Each(func(i int, s *goquery.Selection) {
		t += s.Text()
	})
	if s.Length() == 0 {
		s = doc.Find(".entry-content").Each(func(i int, s *goquery.Selection) {
			s.Find("p").Each(func(i int, s *goquery.Selection) {
				t += s.Text()
			})
		})
		if s.Length() == 0 {
			println("No content found")
		}
	}

	dr, err := dataToRecipe(context.Background(), d, t)
	if err != nil {
		return nil, err
	}

	r := models.Recipe{
		Name:        dr.Name,
		Ingredients: dr.Ingredients,
		Directions:  dr.Directions,
		Equipment:   dr.Equipment,
	}
	return &r, nil
}

func TestParse(to *testing.T) {
	c := config.New()
	newDB := db.LoadDB(c.DB)

	de := deps.Deps{
		AI: openai.NewClient(c.OpenAIKey),
		DB: newDB,
	}

	basePath := "/Users/hacked/Documents/GitHub/share/data/sites/raw/"
	dir, err := filepath.Abs("/Users/hacked/Documents/GitHub/share/data/sites/raw/smittenkitchen.com")
	if err != nil {
		panic(err)
	}
	//dir, err := filepath.Abs(filepath.Join(basePath, "smittenkitchen.com/2008/10/beef-leek-and-barley-soup/"))
	//if err != nil {
	//	panic(err)
	//}

	err = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			return nil
		}

		if filepath.Ext(path) != ".html" {
			return nil
		}

		source := strings.Replace(path, basePath, "", 1)

		var re models.Recipe
		if err = de.DB.First(&re, "url = ?", source).Error; err == nil {
			//println("updating recipe:", source)
			return nil
		}

		println("Parsing file:", path)
		r, err := parseRecipe(de, path)
		if err != nil {
			fmt.Printf("Error parsing file %s: %v\n", path, err)
			return nil
		}
		if r == nil {
			println("No recipe found")
			return nil
		}

		//u, err := url.Parse(source)
		//if err != nil {
		//	println("Error parsing URL:", err)
		//	return err
		//}

		if r.Model.ID == "" {
			// creating new recipe
			r.Model.ID = uuid.NewString()
		}

		for i := range r.Ingredients {
			r.Ingredients[i].ID = uuid.NewString()
			r.Ingredients[i].RecipeID = r.Model.ID
		}

		for i := range r.Directions {
			r.Directions[i].ID = uuid.NewString()
			r.Directions[i].RecipeID = r.Model.ID
		}

		for i := range r.Equipment {
			r.Equipment[i].ID = uuid.NewString()
			r.Equipment[i].RecipeID = r.Model.ID
		}

		r.Domain = "smittenkitchen.com"
		r.URL = source
		if err = de.DB.Save(r).Error; err != nil {
			println("Error saving recipe:", err)
			return err
		}
		return nil
	})
	if err != nil {
		to.Error(err)
	}
}

func TestRecipeIndexSmitten(t *testing.T) {
	index, err := db.NewSearchIndex(smittenIndex)
	if err != nil {
		fmt.Println("Error:", err)
	}

	r, err := index.Search("Pastry")
	if err != nil {
		fmt.Println("Error:", err)
	}
	fmt.Println(r.String())
}

func TestRecipes(t *testing.T) {
	c := config.New()
	newDB := db.LoadDB(c.DB)

	de := deps.Deps{
		DB: newDB,
	}

	var recipes []models.Recipe
	res := de.DB.Preload("Ingredients").Preload("Equipment").Preload("Directions").Where("domain = ?", "smittenkitchen.com").Find(&recipes)
	if res.Error != nil {
		fmt.Println("Error:", res.Error)
	}

	b, err := json.Marshal(recipes)
	if err != nil {
		t.Fatalf("%v", err)
	}

	req, err := http.NewRequest(http.MethodPut, "https://justshare.io/recipe/source/upload", bytes.NewReader(b))
	if err != nil {
		t.Fatalf("%v", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("%v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("%v", err)
	}
}

func TestLoadAllRecipesSmitten(t *testing.T) {
	c := config.New()
	newDB := db.LoadDB(c.DB)

	de := deps.Deps{
		DB: newDB,
	}

	index, err := db.NewSearchIndex(smittenIndex)
	if err != nil {
		fmt.Println("Error:", err)
	}

	var recipes []models.Recipe
	res := de.DB.Preload("Ingredients").Preload("Equipment").Preload("Directions").Where("domain = ?", "smittenkitchen.com").Find(&recipes)
	if res.Error != nil {
		fmt.Println("Error:", res.Error)
	}

	count := 0
	batch := index.Index.NewBatch()
	for _, recipe := range recipes {
		count += 1
		if count%100 == 0 {
			fmt.Printf("Current file: %s\n", recipe.Name)
			fmt.Printf("Processed %d files\n", count)
			err = index.Batch(batch)
			if err != nil {
				fmt.Println("Error:", err)
			}
			batch = index.Index.NewBatch()
		}

		err = batch.Index(recipe.ID, recipe)
		if err != nil {
			fmt.Println("Error:", err)
		}
	}

	if err = index.Batch(batch); err != nil {
		fmt.Println("Error:", err)
	}
}

func TestScrapeMobbinMidjourney(t *testing.T) {
	// Specific Midjourney design screens URL from the user
	targetURL := "https://mobbin.com/apps/midjourney-web-db42c7b7-845e-4a40-aad3-485b1725fddc/44a94e67-6ab7-4f49-be48-d803db60bdef/screens"

	// Create directory for downloaded images
	outputDir := "data/mobbin/midjourney"
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		t.Fatalf("Failed to create output directory: %v", err)
	}

	// Use a custom Chrome session that can handle cookies and authentication
	html, err := scrapeWithChromeAndCookies(targetURL)
	if err != nil {
		t.Fatalf("Failed to scrape %s: %v", targetURL, err)
	}

	// Save the HTML content for debugging
	htmlFile := filepath.Join(outputDir, "page_content.html")
	if err := os.WriteFile(htmlFile, []byte(html), 0644); err != nil {
		fmt.Printf("Warning: Failed to save HTML content: %v\n", err)
	} else {
		fmt.Printf("Saved page content to: %s\n", htmlFile)
	}

	// Parse HTML to extract image URLs
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	if err != nil {
		t.Fatalf("Failed to parse HTML: %v", err)
	}

	// Log page title and some basic info
	title := doc.Find("title").Text()
	fmt.Printf("Page title: %s\n", title)

	// Count all images on the page for debugging
	allImgCount := doc.Find("img").Length()
	fmt.Printf("Total img elements found: %d\n", allImgCount)

	// Track downloaded images
	downloadedCount := 0
	imageURLs := make(map[string]bool) // Track unique URLs

	// Find image elements - looking for Midjourney design screenshots
	// Mobbin typically uses img tags with various patterns
	doc.Find("img").Each(func(i int, s *goquery.Selection) {
		imgURL, exists := s.Attr("src")
		if !exists {
			// Try data-src for lazy loaded images
			imgURL, exists = s.Attr("data-src")
			if !exists {
				// Try srcset attribute
				imgURL, exists = s.Attr("srcset")
				if !exists {
					return
				}
				// Extract first URL from srcset
				parts := strings.Split(imgURL, ",")
				if len(parts) > 0 {
					imgURL = strings.TrimSpace(strings.Split(parts[0], " ")[0])
				}
			}
		}

		// Log first few images for debugging
		if i < 5 {
			alt, _ := s.Attr("alt")
			class, _ := s.Attr("class")
			fmt.Printf("Image %d: URL=%s, Alt=%s, Class=%s\n", i, imgURL, alt, class)
		}

		// Skip small images, icons, logos, avatars
		if strings.Contains(strings.ToLower(imgURL), "icon") ||
			strings.Contains(strings.ToLower(imgURL), "logo") ||
			strings.Contains(strings.ToLower(imgURL), "avatar") ||
			strings.Contains(imgURL, "32x32") ||
			strings.Contains(imgURL, "16x16") {
			return
		}

		// Skip if empty or data URL
		if imgURL == "" || strings.HasPrefix(imgURL, "data:") {
			return
		}

		// Make URL absolute if needed
		if !strings.HasPrefix(imgURL, "http") {
			baseURL, _ := url.Parse(targetURL)
			imgURLParsed, err := baseURL.Parse(imgURL)
			if err != nil {
				fmt.Printf("Error parsing relative URL %s: %v\n", imgURL, err)
				return
			}
			imgURL = imgURLParsed.String()
		}

		// Skip if we've already seen this URL
		if imageURLs[imgURL] {
			return
		}
		imageURLs[imgURL] = true

		// Download the image
		filename := fmt.Sprintf("midjourney_design_%03d", downloadedCount+1)
		if err := downloadImageWithHeaders(imgURL, outputDir, filename); err != nil {
			fmt.Printf("Failed to download image %s: %v\n", imgURL, err)
		} else {
			downloadedCount++
			fmt.Printf("Downloaded [%d]: %s\n", downloadedCount, imgURL)
		}
	})

	// Look for CSS background images
	doc.Find("div, section, article").Each(func(i int, s *goquery.Selection) {
		style, exists := s.Attr("style")
		if !exists {
			return
		}

		// Extract URL from background-image: url(...)
		re := regexp.MustCompile(`url\(['"]?([^'"]+)['"]?\)`)
		matches := re.FindStringSubmatch(style)
		if len(matches) > 1 {
			imgURL := matches[1]

			// Skip small images
			if strings.Contains(strings.ToLower(imgURL), "icon") ||
				strings.Contains(strings.ToLower(imgURL), "logo") {
				return
			}

			// Make URL absolute if needed
			if !strings.HasPrefix(imgURL, "http") {
				baseURL, _ := url.Parse(targetURL)
				imgURLParsed, err := baseURL.Parse(imgURL)
				if err != nil {
					fmt.Printf("Error parsing relative URL %s: %v\n", imgURL, err)
					return
				}
				imgURL = imgURLParsed.String()
			}

			// Skip if we've already seen this URL
			if imageURLs[imgURL] {
				return
			}
			imageURLs[imgURL] = true

			// Download the image
			filename := fmt.Sprintf("midjourney_bg_%03d", downloadedCount+1)
			if err := downloadImageWithHeaders(imgURL, outputDir, filename); err != nil {
				fmt.Printf("Failed to download background image %s: %v\n", imgURL, err)
			} else {
				downloadedCount++
				fmt.Printf("Downloaded BG [%d]: %s\n", downloadedCount, imgURL)
			}
		}
	})

	// Look for modern lazy-loaded images with data attributes
	doc.Find("[data-src], [data-lazy], [data-original]").Each(func(i int, s *goquery.Selection) {
		var imgURL string
		var exists bool

		if imgURL, exists = s.Attr("data-src"); !exists {
			if imgURL, exists = s.Attr("data-lazy"); !exists {
				imgURL, exists = s.Attr("data-original")
			}
		}

		if exists && imgURL != "" && !strings.HasPrefix(imgURL, "data:") {
			// Make URL absolute if needed
			if !strings.HasPrefix(imgURL, "http") {
				baseURL, _ := url.Parse(targetURL)
				imgURLParsed, err := baseURL.Parse(imgURL)
				if err != nil {
					return
				}
				imgURL = imgURLParsed.String()
			}

			// Skip if we've already seen this URL
			if imageURLs[imgURL] {
				return
			}
			imageURLs[imgURL] = true

			// Download the image
			filename := fmt.Sprintf("midjourney_lazy_%03d", downloadedCount+1)
			if err := downloadImageWithHeaders(imgURL, outputDir, filename); err != nil {
				fmt.Printf("Failed to download lazy image %s: %v\n", imgURL, err)
			} else {
				downloadedCount++
				fmt.Printf("Downloaded LAZY [%d]: %s\n", downloadedCount, imgURL)
			}
		}
	})

	// Check if page has login/auth indicators
	loginIndicators := []string{"login", "sign in", "authentication", "auth", "register", "please log in"}
	bodyText := strings.ToLower(doc.Find("body").Text())
	for _, indicator := range loginIndicators {
		if strings.Contains(bodyText, indicator) {
			fmt.Printf("⚠️  Page may require authentication (found: '%s')\n", indicator)
			break
		}
	}

	fmt.Printf("\n✅ Total unique images downloaded: %d\n", downloadedCount)
	fmt.Printf("📁 Images saved to: %s\n", outputDir)
	fmt.Printf("📄 HTML saved to: %s\n", htmlFile)

	if downloadedCount == 0 {
		fmt.Println("ℹ️  No images were downloaded. Possible reasons:")
		fmt.Println("   - Page requires authentication/login")
		fmt.Println("   - Images are loaded dynamically via JavaScript")
		fmt.Println("   - Different CSS selectors are used")
		fmt.Printf("   - Check the saved HTML file: %s\n", htmlFile)
	}
}

// Custom scraper function that can handle authentication and cookies
func scrapeWithChromeAndCookies(targetURL string) (string, error) {
	// Create Chrome context with appropriate options
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", false), // Make visible for debugging auth issues
		chromedp.Flag("disable-gpu", false),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-web-security", true),
		chromedp.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"),
	)

	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	// Add timeout
	ctx, cancel = context.WithTimeout(ctx, 60*time.Second) // Longer timeout for auth
	defer cancel()

	var html string

	err := chromedp.Run(ctx,
		// First, go to the main mobbin.com page to establish session
		chromedp.Navigate("https://mobbin.com"),
		chromedp.Sleep(2*time.Second),

		// Check if we can find a login button and get its state
		chromedp.Evaluate(`
			console.log('Current URL:', window.location.href);
			console.log('Page title:', document.title);
			// Check if there are any login indicators
			const loginBtns = document.querySelectorAll('[href*="login"], [href*="auth"], button:contains("Login"), a:contains("Login")');
			console.log('Login buttons found:', loginBtns.length);
			
			// Check if we can find user profile indicators (already logged in)
			const profileEls = document.querySelectorAll('[data-testid*="profile"], [aria-label*="profile"], [class*="profile"]');
			console.log('Profile elements found:', profileEls.length);
			
			// Log if we see any authentication state
			const isLoggedIn = profileEls.length > 0;
			console.log('Appears to be logged in:', isLoggedIn);
			
			// Return the login state
			isLoggedIn;
		`, nil),

		// Try to navigate to the target URL
		chromedp.Navigate(targetURL),

		// Wait longer for dynamic content
		chromedp.Sleep(5*time.Second),

		// Log the current URL to see if we were redirected
		chromedp.Evaluate(`
			console.log('Target URL loaded:', window.location.href);
			console.log('Page title after navigation:', document.title);
			
			// Check for auth wall indicators
			const authWall = document.body.innerText.toLowerCase();
			const needsAuth = authWall.includes('login') || authWall.includes('sign in') || authWall.includes('authenticate');
			console.log('Appears to need authentication:', needsAuth);
			
			// If there are images, log how many
			const images = document.querySelectorAll('img');
			console.log('Images found on page:', images.length);
			
			// Look for specific Midjourney content
			const midjourneyText = authWall.includes('midjourney');
			console.log('Contains Midjourney content:', midjourneyText);
		`, nil),

		// Try to scroll to trigger any lazy loading
		chromedp.Evaluate(`
			// Scroll to trigger lazy loading
			window.scrollTo(0, document.body.scrollHeight);
		`, nil),
		chromedp.Sleep(3*time.Second),

		// Scroll back up
		chromedp.Evaluate(`window.scrollTo(0, 0);`, nil),
		chromedp.Sleep(2*time.Second),

		// Get the final HTML
		chromedp.OuterHTML("html", &html),
	)

	if err != nil {
		return "", fmt.Errorf("failed to scrape with Chrome: %v", err)
	}

	return html, nil
}

// Helper function to download images with proper headers
func downloadImageWithHeaders(url, outputDir, filename string) error {
	// Create HTTP client with timeout and proper headers
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Create request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	// Add headers similar to browser request
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Referer", "https://mobbin.com/")
	req.Header.Set("Sec-Fetch-Dest", "image")
	req.Header.Set("Sec-Fetch-Mode", "no-cors")
	req.Header.Set("Sec-Fetch-Site", "cross-site")

	// Make request
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	// Determine file extension from content type or URL
	ext := filepath.Ext(url)
	if ext == "" || ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" {
		// Use extension from URL if it's an image extension
	} else {
		// Determine from content type
		contentType := resp.Header.Get("Content-Type")
		switch contentType {
		case "image/jpeg", "image/jpg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/gif":
			ext = ".gif"
		case "image/webp":
			ext = ".webp"
		case "image/svg+xml":
			ext = ".svg"
		default:
			ext = ".jpg" // default
		}
	}

	// Create file
	filePath := filepath.Join(outputDir, filename+ext)
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	// Copy response body to file
	_, err = io.Copy(file, resp.Body)
	return err
}

// Alternative test function that uses HTTP client with manual cookies (if available)
func TestScrapeMobbinMidjourneyWithCookies(t *testing.T) {
	t.Skip("Skipping by default - requires manual cookie setup") // Remove this line when you have cookies

	// You would need to extract cookies from your browser session
	// For example, from Developer Tools > Application > Storage > Cookies
	targetURL := "https://mobbin.com/apps/midjourney-web-db42c7b7-845e-4a40-aad3-485b1725fddc/44a94e67-6ab7-4f49-be48-d803db60bdef/screens"

	// Create directory for downloaded images
	outputDir := "data/mobbin/midjourney_authenticated"
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		t.Fatalf("Failed to create output directory: %v", err)
	}

	// Create HTTP client with cookies
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Create request with headers matching your browser
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	// Add headers from your browser request
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Pragma", "no-cache")
	req.Header.Set("Priority", "u=0, i")
	req.Header.Set("Sec-CH-UA", `"Not?A_Brand";v="99", "Chromium";v="130"`)
	req.Header.Set("Sec-CH-UA-Mobile", "?0")
	req.Header.Set("Sec-CH-UA-Platform", `"macOS"`)
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "same-origin")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")

	// TODO: Add your actual cookies here - you'd need to extract them from your browser
	// Example: req.Header.Set("Cookie", "session_id=your_session_id; auth_token=your_auth_token")
	// You can get these from Browser DevTools > Application > Storage > Cookies > mobbin.com

	fmt.Println("⚠️  This test requires manual cookie setup")
	fmt.Println("📝 To use this test:")
	fmt.Println("   1. Go to mobbin.com in your browser and log in")
	fmt.Println("   2. Open Developer Tools > Application > Storage > Cookies")
	fmt.Println("   3. Copy all cookies and add them to the req.Header.Set('Cookie', ...) line above")
	fmt.Println("   4. Remove the t.Skip() line at the beginning of this function")

	// Make the request
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	htmlBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Failed to read response: %v", err)
	}

	html := string(htmlBytes)

	// Save the HTML content for debugging
	htmlFile := filepath.Join(outputDir, "authenticated_page_content.html")
	if err := os.WriteFile(htmlFile, htmlBytes, 0644); err != nil {
		fmt.Printf("Warning: Failed to save HTML content: %v\n", err)
	} else {
		fmt.Printf("Saved authenticated page content to: %s\n", htmlFile)
	}

	// Parse HTML to extract image URLs
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	if err != nil {
		t.Fatalf("Failed to parse HTML: %v", err)
	}

	// Log page title and some basic info
	title := doc.Find("title").Text()
	fmt.Printf("Page title: %s\n", title)

	// Count all images on the page for debugging
	allImgCount := doc.Find("img").Length()
	fmt.Printf("Total img elements found: %d\n", allImgCount)

	// Look for Midjourney-specific content
	bodyText := strings.ToLower(doc.Find("body").Text())
	if strings.Contains(bodyText, "midjourney") {
		fmt.Println("✅ Found Midjourney content on page")
	} else {
		fmt.Println("❌ No Midjourney content found - may need authentication")
	}

	// Extract and download images (same logic as the main test)
	downloadedCount := 0
	imageURLs := make(map[string]bool)

	doc.Find("img").Each(func(i int, s *goquery.Selection) {
		imgURL, exists := s.Attr("src")
		if !exists {
			imgURL, exists = s.Attr("data-src")
			if !exists {
				return
			}
		}

		if imgURL == "" || strings.HasPrefix(imgURL, "data:") {
			return
		}

		// Skip icons and logos
		if strings.Contains(strings.ToLower(imgURL), "icon") ||
			strings.Contains(strings.ToLower(imgURL), "logo") {
			return
		}

		// Make URL absolute
		if !strings.HasPrefix(imgURL, "http") {
			baseURL, _ := url.Parse(targetURL)
			imgURLParsed, err := baseURL.Parse(imgURL)
			if err != nil {
				return
			}
			imgURL = imgURLParsed.String()
		}

		// Skip duplicates
		if imageURLs[imgURL] {
			return
		}
		imageURLs[imgURL] = true

		// Download with authentication headers
		filename := fmt.Sprintf("midjourney_auth_%03d", downloadedCount+1)
		if err := downloadImageWithAuthHeaders(imgURL, outputDir, filename, req.Header); err != nil {
			fmt.Printf("Failed to download image %s: %v\n", imgURL, err)
		} else {
			downloadedCount++
			fmt.Printf("Downloaded [%d]: %s\n", downloadedCount, imgURL)
		}
	})

	fmt.Printf("\n✅ Total unique images downloaded: %d\n", downloadedCount)
	fmt.Printf("📁 Images saved to: %s\n", outputDir)
}

// Helper function to download images with authentication headers
func downloadImageWithAuthHeaders(url, outputDir, filename string, headers http.Header) error {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	// Copy authentication headers
	for key, values := range headers {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// Override some headers specific to image requests
	req.Header.Set("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
	req.Header.Set("Sec-Fetch-Dest", "image")
	req.Header.Set("Sec-Fetch-Mode", "no-cors")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	// Determine file extension
	ext := filepath.Ext(url)
	if ext == "" {
		contentType := resp.Header.Get("Content-Type")
		switch contentType {
		case "image/jpeg", "image/jpg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/gif":
			ext = ".gif"
		case "image/webp":
			ext = ".webp"
		case "image/svg+xml":
			ext = ".svg"
		default:
			ext = ".jpg"
		}
	}

	// Create file
	filePath := filepath.Join(outputDir, filename+ext)
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	// Copy response body to file
	_, err = io.Copy(file, resp.Body)
	return err
}

// Legacy helper function to download images (keeping for compatibility)
func downloadImage(url, outputDir, filename string) error {
	return downloadImageWithHeaders(url, outputDir, filename)
}
