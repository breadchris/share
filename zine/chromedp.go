package zine

import (
	"context"
	"fmt"
	"os"

	"github.com/chromedp/chromedp"
)

func captureDivScreenshotFromHTML(htmlContent, divID, screenshotPath string) error {
	fmt.Println("Taking image")
	// Create a new context
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// Write the HTML content to a file
	err := os.WriteFile("./zine/zine.html", []byte(htmlContent), 0644)
	// defer os.Remove(tempFile.Name())

	// Build the full file URL
	fileURL := "http://localhost:8080/zine/zine.html"
	fmt.Println("fileURL: ", fileURL)
	fmt.Println(fileURL)
	// Run the task to capture the screenshot
	var buf []byte
	err = chromedp.Run(ctx,
		chromedp.Navigate(fileURL),
		chromedp.WaitVisible(fmt.Sprintf("#%s", divID)),
		chromedp.Screenshot(fmt.Sprintf("#%s", divID), &buf, chromedp.NodeVisible),
	)
	if err != nil {
		return fmt.Errorf("failed to capture screenshot: %w", err)
	}

	// Save the screenshot
	err = os.WriteFile(screenshotPath, buf, 0644)
	if err != nil {
		return fmt.Errorf("failed to save screenshot: %w", err)
	}

	return nil
}

// func main() {
// 	// Example usage
// 	htmlContent := `<html><body><div id="myDiv" style="width: 300px; height: 200px; background-color: blue;"></div></body></html>`
// 	divID := "myDiv"
// 	screenshotPath := "screenshot.png"

// 	err := captureDivScreenshotFromHTML(htmlContent, divID, screenshotPath)
// 	if err != nil {
// 		log.Fatal(err)
// 	}

// 	fmt.Println("Screenshot saved to", screenshotPath)
// }
