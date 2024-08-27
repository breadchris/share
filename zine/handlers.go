package zine

import (
	"fmt"
	"io"
	"net/http"
	"os"

	. "github.com/breadchris/share/html"
)

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
	fmt.Println("1")
	// Handle file upload
	file, handler, err := r.FormFile("uploadfile")
	if err != nil && err != http.ErrMissingFile {
		http.Error(w, "Error retrieving the file", http.StatusInternalServerError)
		return
	}
	if err != http.ErrMissingFile {
		fmt.Println("err: ", err)
		defer file.Close()
	}

	var filePath string
	var image *Node
	var htmlContent string
	if handler != nil {
		// Save the uploaded file
		filePath = "./static/" + handler.Filename
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
			image = Img(Attr("src", "/static/"+handler.Filename), Attr("alt", "Uploaded Image"))
		}
		htmlContent = Div(image, P(T(content))).Render()
	} else {
		htmlContent = P(T(content)).Render()
	}

	// Combine the text and image HTML

	// fmt.Sprintf("%s\n%s", content, imageHTML)

	w.Write([]byte(htmlContent))
}
