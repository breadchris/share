package main

import (
	"fmt"
	"github.com/breadchris/share/config"
	"os"
	"testing"

	"github.com/breadchris/share/db"
	"github.com/breadchris/share/models"
)

// TestExtractImages extracts images from saved HTML content by content ID
func TestExtractImages(t *testing.T) {
	// Initialize database connection
	c := config.New()
	database := db.LoadDB(c.DB)

	contentID := "8c4e543b-9b3f-4051-9207-fb96ba2cddec"

	// Fetch content by ID
	var content models.Content
	if err := database.Where("id = ? AND type = ?", contentID, "page").First(&content).Error; err != nil {
		t.Fatalf("failed to fetch content with ID %s: %v", contentID, err)
	}

	fmt.Printf("Found content: %s\n", content.Metadata.Data["title"])
	fmt.Printf("URL: %s\n", content.Metadata.Data["url"])

	// Extract HTML from metadata
	html := content.Metadata.Data["html"]
	if html == "" {
		t.Fatalf("no HTML content found for content ID %s", contentID)
	}

	// Create output directory
	outputDir := fmt.Sprintf("./data/extension/images/%s", contentID)
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		t.Fatalf("failed to create output directory %s: %v", outputDir, err)
	}

	pi := PageInfo{
		HTML: html.(string),
		URL:  content.Metadata.Data["url"].(string),
	}

	// Extract and save images
	images, err := extractAndSaveImagesWithProxy(pi, outputDir, nil)
	if err != nil {
		t.Fatalf("failed to extract and save images: %v", err)
	}

	fmt.Printf("\nExtracted %d images:\n", len(images))
	for i, img := range images {
		fmt.Printf("%d. %s\n", i+1, img)
	}

	// Update content metadata with extracted images
	metadata := content.Metadata
	content.Metadata.Data["images"] = images

	if err := database.Model(&content).Update("metadata", metadata).Error; err != nil {
		t.Fatalf("failed to update content metadata: %v", err)
	}

	fmt.Println("\nImage extraction completed successfully!")
	fmt.Printf("Images saved to: %s\n", outputDir)
}
