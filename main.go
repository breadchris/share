package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"github.com/gomarkdown/markdown"
	"github.com/gorilla/websocket"
	ignore "github.com/sabhiram/go-gitignore"
	"github.com/urfave/cli/v2"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("blog.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func testHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "This is dynamically loaded content from the /test endpoint.")
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	_, filenameMsg, err := conn.ReadMessage()
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Failed to read filename"))
		return
	}
	filename := string(filenameMsg)

	f, err := os.Create("./uploads/" + filename)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Failed to create file"))
		return
	}
	defer f.Close()

	for {
		_, fileData, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure) {
				conn.WriteMessage(websocket.TextMessage, []byte("File uploaded successfully: "+filename))
				break
			}
			conn.WriteMessage(websocket.TextMessage, []byte("Failed to read file data"))
			return
		}

		if _, err := f.Write(fileData); err != nil {
			conn.WriteMessage(websocket.TextMessage, []byte("Failed to write file data"))
			return
		}
	}
}

// FileInfo is a struct that holds information about a file
type FileInfo struct {
	Name    string
	Size    string
	ModTime string
	IsDir   bool
	Path    string
}

func codeHandler(w http.ResponseWriter, r *http.Request) {
	path := "." + r.URL.Path
	info, err := os.Stat(path)
	if os.IsNotExist(err) {
		http.NotFound(w, r)
		return
	} else if err != nil {
		http.Error(w, "Unable to get file info", http.StatusInternalServerError)
		return
	}

	if !info.IsDir() {
		content, err := ioutil.ReadFile(path)
		if err != nil {
			http.Error(w, "Unable to read file", http.StatusInternalServerError)
			return
		}

		tmpl, err := template.New("template.html").Funcs(template.FuncMap{
			"safeHTML": func(s string) template.HTML { return template.HTML(s) },
		}).ParseFiles("template.html")
		if err != nil {
			http.Error(w, "Unable to load template", http.StatusInternalServerError)
			return
		}

		err = tmpl.Execute(w, struct {
			ReadmeContent string
			Files         []FileInfo
			FileContent   string
			IsFile        bool
			FileName      string
		}{
			FileContent: string(content),
			IsFile:      true,
			FileName:    info.Name(),
		})
		if err != nil {
			http.Error(w, "Unable to render template", http.StatusInternalServerError)
			return
		}
		return
	}

	files, err := os.ReadDir(path)
	if err != nil {
		http.Error(w, "Unable to read directory", http.StatusInternalServerError)
		return
	}

	gitignorePath := filepath.Join(path, ".gitignore")
	var gitIgnore *ignore.GitIgnore
	if _, err := os.Stat(gitignorePath); err == nil {
		gitIgnore, err = ignore.CompileIgnoreFile(gitignorePath)
		if err != nil {
			http.Error(w, "Unable to parse .gitignore", http.StatusInternalServerError)
			return
		}
	}

	p := r.URL.Path[1:]
	fileInfos := []FileInfo{}
	readmeContent := "hack the planet"
	for _, file := range files {
		np := filepath.Join(p, file.Name())
		if gitIgnore != nil && gitIgnore.MatchesPath(np) {
			continue
		}

		info, err := file.Info()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if strings.ToLower(info.Name()) == "readme.md" {
			content, err := ioutil.ReadFile(filepath.Join(path, info.Name()))
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			readmeContent = string(markdown.ToHTML(content, nil, nil))
		}

		fileInfos = append(fileInfos, FileInfo{
			Name:    info.Name(),
			Size:    formatSize(info.Size()),
			ModTime: info.ModTime().Format("2006-01-02 15:04"),
			IsDir:   file.IsDir(),
			Path:    filepath.Join(r.URL.Path, info.Name()),
		})
	}

	tmpl, err := template.New("template.html").Funcs(template.FuncMap{
		"safeHTML": func(s string) template.HTML { return template.HTML(s) },
	}).ParseFiles("template.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = tmpl.Execute(w, struct {
		ReadmeContent string
		Files         []FileInfo
		IsFile        bool
	}{
		ReadmeContent: readmeContent,
		Files:         fileInfos,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// fileServerHandler handles the file system view
func fileServerHandler(w http.ResponseWriter, r *http.Request) {
	path := "." + r.URL.Path
	http.ServeFile(w, r, path)
	return
}

// formatSize converts a file size to a human-readable string
func formatSize(size int64) string {
	if size < 1024 {
		return fmt.Sprintf("%d B", size)
	} else if size < 1024*1024 {
		return fmt.Sprintf("%d KB", size/1024)
	} else if size < 1024*1024*1024 {
		return fmt.Sprintf("%d MB", size/(1024*1024))
	}
	return fmt.Sprintf("%d GB", size/(1024*1024*1024))
}

func fileUpload() {
	os.MkdirAll("./uploads", os.ModePerm)

	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/test", testHandler)
	http.HandleFunc("/upload", uploadHandler)

	fmt.Println("Starting server at port 8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		fmt.Println(err)
	}
}

func recipeHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("recipe/index.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func fileServer(baseDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//path := filepath.Join(baseDir, r.URL.Path)
		path := r.URL.Path
		// remove the leading slash
		path = path[1:]

		fileInfo, err := ioutil.ReadDir(path)
		if err == nil {
			type File struct {
				Name  string
				IsDir bool
			}
			var fileNames []File
			for _, file := range fileInfo {
				fileNames = append(fileNames, File{file.Name(), file.IsDir()})
			}

			data := map[string]any{
				"files": fileNames,
			}

			indexPath := filepath.Join(path, "index.html")
			indexTemplate, err := template.ParseFiles(indexPath)
			if err == nil {
				indexTemplate.Execute(w, data)
				return
			}

			indexTemplate, err = template.ParseFiles("dir.html")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			err = indexTemplate.Execute(w, data)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			return
		}

		ext := filepath.Ext(path)
		if ext == ".html" {
			tmpl, err := template.ParseFiles(path)
			if err == nil {
				tmpl.Execute(w, nil)
				return
			}
		} else if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" {
			http.ServeFile(w, r, path)
			return
		} else if ext == ".json" {
			data := map[string]any{
				"home": "/data/recipes/",
			}

			jsonFile, err := os.Open(path)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer jsonFile.Close()

			byteValue, err := ioutil.ReadAll(jsonFile)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if err = json.Unmarshal(byteValue, &data); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			indexTemplate, err := template.ParseFiles("recipe.html")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			err = indexTemplate.Execute(w, data)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			return
		}
		http.ServeFile(w, r, path)
	}
}

// SearchResult represents a single search result item
type SearchResult struct {
	Title       string
	Description string
	URL         string
}

type Handler struct {
	index *SearchIndex
}

func (s *Handler) searchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	var results []SearchResult

	res, err := s.index.Search(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, h := range res.Hits {
		f, err := os.ReadFile(path.Join("data/recipes/nyt", h.ID))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var data map[string]any
		err = json.Unmarshal(f, &data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		results = append(results, SearchResult{
			Title:       data["name"].(string),
			Description: data["source"].(string),
			URL:         fmt.Sprintf("/data/recipes/nyt/%s", h.ID),
		})
	}

	w.Header().Set("Content-Type", "text/html")
	searchTmpl := template.Must(template.ParseFiles("searchresults.html"))
	err = searchTmpl.Execute(w, results)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func NewTLSConfig(
	interCertFile,
	certFile,
	keyFile string,
) *tls.Config {
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		log.Fatalf("Failed to load server certificate and key: %v", err)
	}

	intermediateCert, err := ioutil.ReadFile(interCertFile)
	if err != nil {
		log.Fatalf("Failed to load intermediate certificate: %v", err)
	}

	certPool := x509.NewCertPool()
	if !certPool.AppendCertsFromPEM(intermediateCert) {
		log.Fatalf("Failed to append intermediate certificate to cert pool")
	}

	return &tls.Config{
		Certificates: []tls.Certificate{cert},
		ClientCAs:    certPool,
	}
}

func loadIndex() http.HandlerFunc {
	index, err := NewSearchIndex("data/search")
	processFunc := func(name string, contents []byte) error {
		println(name)
		var data map[string]any

		err = json.Unmarshal(contents, &data)
		if err != nil {
			return err
		}

		return index.IndexDocument(name, data["name"])
	}

	_ = func() {
		println("loading recipes")
		err = WalkDirectory(os.DirFS("data/recipes/nyt"), ".", processFunc)
		if err != nil {
			log.Fatalf("Failed to walk directory: %v", err)
		}
		println("recipes loaded")
	}

	//go loadRecipes()

	h := &Handler{
		index: index,
	}
	return h.searchHandler
}

func startServer(useTLS bool) {
	http.HandleFunc("/chat", chatHandler)
	http.HandleFunc("/chat/send", sendHandler)
	http.HandleFunc("/chat/clear", clearHandler)

	loadEntries()
	http.HandleFunc("/blog", blogHandler)
	http.HandleFunc("/submit", submitHandler)
	http.HandleFunc("/recipe", recipeHandler)
	http.HandleFunc("/data/", fileServer("./data"))
	http.HandleFunc("/search", loadIndex())
	http.HandleFunc("/", fileServerHandler)

	dir := "data/justshare.io-ssl-bundle"
	interCertFile := path.Join(dir, "intermediate.cert.pem")
	certFile := path.Join(dir, "domain.cert.pem")
	keyFile := path.Join(dir, "private.key.pem")

	if useTLS {
		tlsConfig := NewTLSConfig(interCertFile, certFile, keyFile)

		server := &http.Server{
			Addr:      ":4443",
			TLSConfig: tlsConfig,
		}

		log.Println("Starting HTTPS server on port 4443")
		err := server.ListenAndServeTLS(certFile, keyFile)
		if err != nil {
			log.Fatalf("Failed to start HTTPS server: %v", err)
		}
	} else {
		log.Println("Starting HTTP server on port 8042")
		http.ListenAndServe(":8042", nil)
	}
}

func main() {
	app := &cli.App{
		Name: "share",
		Commands: []*cli.Command{
			{
				Name: "start",
				Flags: []cli.Flag{
					&cli.BoolFlag{
						Name: "tls",
					},
				},
				Action: func(c *cli.Context) error {
					startServer(c.Bool("tls"))
					return nil
				},
			},
		},
	}

	err := app.Run(os.Args)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
