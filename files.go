package main

import (
	"fmt"
	html "github.com/breadchris/share/html2"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
)

func FileList(dir string) *html.Node {
	ul := html.Ul(html.Class("menu menu-xs bg-base-200 rounded-lg w-full max-w-xs"))

	// Walk through the directory and handle files/directories recursively
	err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Create relative path to display neatly in the UI
		relativePath, err := filepath.Rel(dir, path)
		if err != nil {
			relativePath = path
		}

		if path == dir {
			return nil
		}

		if d.IsDir() {
			details := html.Details(html.Open(false),
				html.Summary(
					html.Svg(html.Class("h-4 w-4"), html.Path(html.Attr("d", "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"))),
					html.T(d.Name()),
				),
				FileList(path),
			)
			ul.Children = append(ul.Children, html.Li(details))
		} else {
			fileItem := html.Li(
				html.A(
					html.Svg(html.Class("h-4 w-4"), html.Path(html.Attr("d", "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z")),
						html.T(relativePath),
					),
				),
			)
			ul.Children = append(ul.Children, fileItem)
		}

		return nil
	})

	if err != nil {
		ul.Children = append(ul.Children, html.Li(html.T(fmt.Sprintf("Error listing directory: %v", err))))
	}

	return ul
}

func fileHandler(w http.ResponseWriter, r *http.Request) {
	dir := r.URL.Query().Get("dir")
	if dir == "" {
		http.Error(w, "Missing 'dir' query parameter", http.StatusBadRequest)
		return
	}

	// Check if the directory exists
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		http.Error(w, "Directory does not exist", http.StatusBadRequest)
		return
	}

	// Render the file listing using the HTML library
	fileListHTML := FileList(dir)

	// Render the full HTML page
	pageHTML := html.Html(
		html.Head(
			html.Title(html.T("File Listing")),
			html.Link(html.Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css"), html.Rel("stylesheet"), html.Type("text/css")),
			html.Link(html.Attr("rel", "stylesheet"), html.Attr("href", "https://cdn.tailwindcss.com")),
		),
		html.Body(
			html.H1(html.T("Directory Listing")),
			fileListHTML,
		),
	)

	// Write the rendered HTML to the response
	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, pageHTML.Render())
}
