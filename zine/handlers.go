package zine

import (
	"fmt"
	"io"
	"net/http"
	"os"

	. "github.com/breadchris/share/html2"
)

func (z *ZineMaker) GenerateZineImage(w http.ResponseWriter, r *http.Request) {
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
	err = captureDivScreenshotFromHTML(content, divID, "./data/images/zine.png")
	if err != nil {
		http.Error(w, "Error generating the image", http.StatusInternalServerError)
		return
	}

	image := Img(Attr("src", "/data/images/zine.png"), Attr("alt", "Generated Zine")).Render()

	w.Write([]byte(image))
}

func (z *ZineMaker) CreatePanelHandler(w http.ResponseWriter, r *http.Request) {
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
		filePath = "./data/images/" + handler.Filename
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
			image = Img(Image(), Attr("src", "/data/images/"+handler.Filename), Attr("alt", "Uploaded Image"))
		}
		htmlContent = Div(image, P(T(content))).Render()
	} else {
		htmlContent = P(T(content)).Render()
	}
	w.Write([]byte(htmlContent))
}
