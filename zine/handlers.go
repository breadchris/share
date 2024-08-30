package zine

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	. "github.com/breadchris/share/html"
)

func GenerateImageHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the form data
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Get the content from the form
	prompt := r.FormValue("content")
	if prompt == "" {
		http.Error(w, "No content provided", http.StatusBadRequest)
		return
	}

	now := strconv.Itoa(time.Now().Nanosecond())
	imageName := fmt.Sprintf("generated_image%s.png", now)
	// Define the output path for the generated image
	outputPath := fmt.Sprintf("./zine/" + imageName)

	// Call the GenerateImage function
	err := GenerateImage(prompt, outputPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error generating image: %v", err), http.StatusInternalServerError)
		return
	}
	image := Img(Image(), Attr("src", "/zine/"+imageName), Attr("alt", "Uploaded Image"))

	w.Write([]byte(image.Render()))
}

func GenerateZineImage(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Generating zine image")

	err := r.ParseForm()
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Get the HTML content from the request
	content := r.FormValue("new-zine")
	divID := r.FormValue("div_id")
	fmt.Println("content: ", content)
	// Generate the image
	err = captureDivScreenshotFromHTML(content, divID, "./data/zine.png")
	if err != nil {
		http.Error(w, "Error generating the image", http.StatusInternalServerError)
		return
	}

	image := Img(Attr("src", "/data/zine.png"), Attr("alt", "Generated Zine")).Render()

	w.Write([]byte(image))
}

func CreatePanelHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Parse form data
	err := r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	// Handle text content
	content := r.FormValue("content")

	// Handle file upload
	file, handler, err := r.FormFile("uploadfile")
	if err != nil && err != http.ErrMissingFile {
		http.Error(w, "Error retrieving the file", http.StatusInternalServerError)
		return
	}
	if err != http.ErrMissingFile {
		defer file.Close()
	}

	var filePath string
	var image *Node
	var htmlContent string
	if handler != nil {
		// Save the uploaded file
		filePath = "./data/" + handler.Filename
		out, err := os.Create(filePath)
		if err != nil {
			http.Error(w, "Error saving the file", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		_, err = io.Copy(out, file)
		if err != nil {
			http.Error(w, "Error writing the file", http.StatusInternalServerError)
			return
		}
		if filePath != "" {
			image = Img(Image(), Attr("src", "/data/"+handler.Filename), Attr("alt", "Uploaded Image"))
		}
		htmlContent = Div(image, P(T(content))).Render()
	} else {
		htmlContent = P(T(content)).Render()
	}
	w.Write([]byte(htmlContent))
}
