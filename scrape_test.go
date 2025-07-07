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
	// Create scraper with Chrome configuration for dynamic content
	scraperConfig := ScrapeConfig{
		Client:   ClientChrome,
		Fallback: true,
		UseCache: false,
	}
	
	scraper := NewScraper(scraperConfig)
	
	// Mobbin Midjourney design gallery URL
	targetURL := "https://mobbin.com/apps/midjourney"
	
	// Create directory for downloaded images
	outputDir := "data/mobbin/midjourney"
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		t.Fatalf("Failed to create output directory: %v", err)
	}
	
	// Scrape the page
	resp, err := scraper.Scrape(targetURL)
	if err != nil {
		t.Fatalf("Failed to scrape %s: %v", targetURL, err)
	}
	
	// Save the HTML content for debugging
	htmlFile := filepath.Join(outputDir, "page_content.html")
	if err := os.WriteFile(htmlFile, []byte(resp.Content), 0644); err != nil {
		fmt.Printf("Warning: Failed to save HTML content: %v\n", err)
	} else {
		fmt.Printf("Saved page content to: %s\n", htmlFile)
	}
	
	// Parse HTML to extract image URLs
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(resp.Content))
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
	
	// Find image elements (adjust selector based on actual Mobbin structure)
	// Common patterns: img tags, background images in style attributes
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
		
		// Log all images for debugging (first 10)
		if i < 10 {
			alt, _ := s.Attr("alt")
			fmt.Printf("Image %d: URL=%s, Alt=%s\n", i, imgURL, alt)
		}
		
		// Skip small images (likely icons/logos)
		if strings.Contains(imgURL, "icon") || strings.Contains(imgURL, "logo") {
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
		
		// Download the image
		if err := downloadImage(imgURL, outputDir, fmt.Sprintf("midjourney_design_%d", i)); err != nil {
			fmt.Printf("Failed to download image %s: %v\n", imgURL, err)
		} else {
			downloadedCount++
			fmt.Printf("Downloaded: %s\n", imgURL)
		}
	})
	
	// Also check for background images in div elements
	doc.Find("div[style*='background-image']").Each(func(i int, s *goquery.Selection) {
		style, _ := s.Attr("style")
		// Extract URL from background-image: url(...)
		re := regexp.MustCompile(`url\(['"]?([^'"]+)['"]?\)`)
		matches := re.FindStringSubmatch(style)
		if len(matches) > 1 {
			imgURL := matches[1]
			
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
			
			// Download the image
			if err := downloadImage(imgURL, outputDir, fmt.Sprintf("midjourney_bg_%d", i)); err != nil {
				fmt.Printf("Failed to download background image %s: %v\n", imgURL, err)
			} else {
				downloadedCount++
				fmt.Printf("Downloaded background image: %s\n", imgURL)
			}
		}
	})
	
	// Also try to find images in other common patterns for modern web apps
	doc.Find("div[data-testid*='image'], div[class*='image'], figure img, picture img").Each(func(i int, s *goquery.Selection) {
		imgURL, exists := s.Attr("src")
		if !exists {
			imgURL, exists = s.Attr("data-src")
			if !exists {
				return
			}
		}
		
		if imgURL != "" && !strings.HasPrefix(imgURL, "data:") {
			fmt.Printf("Alternative selector image %d: %s\n", i, imgURL)
			
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
			
			// Download the image
			if err := downloadImage(imgURL, outputDir, fmt.Sprintf("alt_selector_%d", i)); err != nil {
				fmt.Printf("Failed to download alt selector image %s: %v\n", imgURL, err)
			} else {
				downloadedCount++
				fmt.Printf("Downloaded (alt selector): %s\n", imgURL)
			}
		}
	})
	
	// Check if page has login/auth indicators
	loginIndicators := []string{"login", "sign in", "authentication", "auth", "register"}
	bodyText := strings.ToLower(doc.Find("body").Text())
	for _, indicator := range loginIndicators {
		if strings.Contains(bodyText, indicator) {
			fmt.Printf("⚠️  Page may require authentication (found: %s)\n", indicator)
			break
		}
	}
	
	fmt.Printf("\nTotal images downloaded: %d\n", downloadedCount)
	
	// Don't fail the test if no images found - just report results
	if downloadedCount == 0 {
		fmt.Println("ℹ️  No images were downloaded. Check the saved HTML file to understand the page structure.")
		fmt.Printf("📁 Check: %s\n", htmlFile)
	}
}

// Helper function to download images
func downloadImage(url, outputDir, filename string) error {
	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	
	// Make request
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}
	
	// Determine file extension from content type or URL
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
