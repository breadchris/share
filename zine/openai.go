package zine

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func GenerateImage(prompt string, outputPath string, apiKey string) error {
	// Create the request payload
	payload := map[string]interface{}{
		"model":  "dall-e-3",
		"prompt": prompt,
		"n":      1,
		"size":   "1024x1792",
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("error marshalling payload: %v", err)
	}

	// Make the HTTP request
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/images/generations", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return fmt.Errorf("error creating request: %v", err)
	}

	// Set the necessary headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	// Check for a non-200 status code
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("error generating image: %s", string(body))
	}

	// Parse the response
	var response map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return fmt.Errorf("error decoding response: %v", err)
	}

	// Extract the image URL from the response
	imageURL := response["data"].([]interface{})[0].(map[string]interface{})["url"].(string)

	// Download the image
	imageResp, err := http.Get(imageURL)
	if err != nil {
		return fmt.Errorf("error downloading image: %v", err)
	}
	defer imageResp.Body.Close()

	// Create the output file
	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("error creating file: %v", err)
	}
	defer file.Close()

	// Write the image to the file
	_, err = io.Copy(file, imageResp.Body)
	if err != nil {
		return fmt.Errorf("error saving image: %v", err)
	}

	fmt.Printf("Image saved to %s\n", outputPath)
	return nil
}
