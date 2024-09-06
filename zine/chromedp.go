package zine

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/chromedp/chromedp"
)

type Versions struct {
	Screenshots []string `json:"screenshots"`
}

// captureDivScreenshotFromHTML captures a screenshot of a specific zine section and saves it.
func captureDivScreenshotFromHTML(htmlContent, zineId string) (error, string) {

	// Create a new context for ChromeDP
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// Create the directory for the zine images if it doesn't exist
	zineDir := fmt.Sprintf("./data/images/%s", zineId)
	if err := os.MkdirAll(zineDir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create zine directory: %w", err), ""
	}

	// Path to the versions.json file
	versionsFile := filepath.Join(zineDir, "versions.json")

	// Load the versions.json file (or create it if it doesn't exist)
	var versions Versions
	if _, err := os.Stat(versionsFile); os.IsNotExist(err) {
		// If the file doesn't exist, create it
		versions = Versions{Screenshots: []string{}}
	} else {
		// If the file exists, load the current versions
		file, err := os.ReadFile(versionsFile)
		if err != nil {
			return fmt.Errorf("failed to read versions.json: %w", err), ""
		}
		err = json.Unmarshal(file, &versions)
		if err != nil {
			return fmt.Errorf("failed to parse versions.json: %w", err), ""
		}
	}

	// Get the next version number (the length of the screenshots array)
	version := len(versions.Screenshots) + 1
	screenshotName := fmt.Sprintf("zine-%d.png", version)
	screenshotPath := filepath.Join(zineDir, screenshotName)

	// Write the HTML content to a file (optional, to be used for Chrome navigation)
	err := os.WriteFile(fmt.Sprintf("./zine/%s.html", zineId), []byte(htmlContent), 0644)
	if err != nil {
		return fmt.Errorf("failed to write HTML file: %w", err), ""
	}

	// Build the full file URL for ChromeDP
	fileURL := fmt.Sprintf("http://justshare.io/zine/%s.html", zineId)

	// Capture the screenshot using ChromeDP
	var buf []byte
	err = chromedp.Run(ctx,
		chromedp.Navigate(fileURL),
		chromedp.WaitVisible(fmt.Sprintf("#%s", zineId)),
		chromedp.Screenshot(fmt.Sprintf("#%s", zineId), &buf, chromedp.NodeVisible),
	)
	if err != nil {
		return fmt.Errorf("failed to capture screenshot: %w", err), ""
	}

	// Save the screenshot to the appropriate directory
	err = os.WriteFile(screenshotPath, buf, 0644)
	if err != nil {
		return fmt.Errorf("failed to save screenshot: %w", err), ""
	}

	// Update the versions.json file
	versions.Screenshots = append(versions.Screenshots, screenshotName)
	versionsData, err := json.MarshalIndent(versions, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal versions: %w", err), ""
	}
	err = os.WriteFile(versionsFile, versionsData, 0644)
	if err != nil {
		return fmt.Errorf("failed to write versions.json: %w", err), ""
	}

	return nil, screenshotPath
}
