package zine

import (
	"fmt"
	"io"
	"net/http"
	"os"

	. "github.com/breadchris/share/html"
)

func (z *ZineMaker) GenerateZineImage(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	zineId := r.Form.Get("div_id")

	// Get the HTML content from the request
	content := r.FormValue(zineId)
	screenshotPath := ""
	// Generate the image
	err, screenshotPath = captureDivScreenshotFromHTML(content, zineId)
	if err != nil {
		http.Error(w, "Error generating the image", http.StatusInternalServerError)
		return
	}
	screenshotPath = "/" + screenshotPath
	fmt.Printf("Generated image: %s\n", screenshotPath)

	image := Div(Id("zine-image"), Class("mt-4"),
		Img(Attr("src", screenshotPath), Attr("alt", "Generated Zine")),
	).Render()

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
