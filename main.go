package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/html"
	"github.com/breadchris/share/session"
	"github.com/gomarkdown/markdown"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	ignore "github.com/sabhiram/go-gitignore"
	"github.com/urfave/cli/v2"
	"html/template"
	"io"
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

type SMTPConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type SpotifyConfig struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

type AppConfig struct {
	OpenAIKey   string        `json:"openai_key"`
	SMTP        SMTPConfig    `json:"smtp"`
	Spotify     SpotifyConfig `json:"spotify"`
	ExternalURL string        `json:"external_url"`
}

func loadConfig() AppConfig {
	// load the app config
	var appConfig AppConfig
	configFile, err := os.Open("data/config.json")
	if err != nil {
		log.Fatalf("Failed to open config file: %v", err)
	}
	defer configFile.Close()

	err = json.NewDecoder(configFile).Decode(&appConfig)
	if err != nil {
		log.Fatalf("Failed to decode config file: %v", err)
	}
	return appConfig
}

func startServer(useTLS bool, port int) {
	appConfig := loadConfig()

	loadJSON(dataFile, &entries)
	var newEntries []Entry
	for _, e := range entries {
		if e.ID == "" {
			e.ID = uuid.New().String()
		}
		newEntries = append(newEntries, e)
	}
	entries = newEntries
	saveJSON(dataFile, entries)

	s, err := session.New()
	if err != nil {
		log.Fatalf("Failed to create session store: %v", err)
	}
	e := NewSMTPEmail(&appConfig)
	a := NewAuth(s, e, appConfig)

	p := func(p string, s *http.ServeMux) {
		http.Handle(p+"/", http.StripPrefix(p, s))
	}

	setupWebauthn()
	setupPrompt()
	setupCursor()
	setupRecipe()
	fileUpload()
	setupSpotify(appConfig)
	oai := NewOpenAIService(appConfig)
	c := NewChat(s, oai)
	p("/llm", setupChatgpt(oai))
	p("/chat", c.NewMux())

	//text.Setup(upgrader)
	go watchPaths()

	http.HandleFunc("/register", a.handleRegister)
	http.HandleFunc("/login", a.handleLogin)
	http.HandleFunc("/invite", a.handleInvite)
	http.HandleFunc("/qr", handleQR)
	http.HandleFunc("/blog", a.blogHandler)
	http.HandleFunc("/blog/react", a.reactHandler)
	http.HandleFunc("/account", a.accountHandler)
	http.HandleFunc("/code", a.codeHandler)
	http.HandleFunc("/", fileServerHandler)

	dir := "data/justshare.io-ssl-bundle"
	interCertFile := path.Join(dir, "intermediate.cert.pem")
	certFile := path.Join(dir, "domain.cert.pem")
	keyFile := path.Join(dir, "private.key.pem")

	h := s.LoadAndSave(http.DefaultServeMux)

	if useTLS {
		tlsConfig := NewTLSConfig(interCertFile, certFile, keyFile)

		server := &http.Server{
			Addr:      fmt.Sprintf(":%d", port),
			TLSConfig: tlsConfig,
			Handler:   h,
		}

		log.Printf("Starting HTTPS server on port: %d", port)
		err := server.ListenAndServeTLS(certFile, keyFile)
		if err != nil {
			log.Fatalf("Failed to start HTTPS server: %v", err)
		}
	} else {
		log.Printf("Starting HTTP server on port: %d", port)
		http.ListenAndServe(fmt.Sprintf(":%d", port), h)
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
					&cli.IntFlag{
						Name:  "port",
						Value: 8080,
					},
				},
				Action: func(c *cli.Context) error {
					startServer(c.Bool("tls"), c.Int("port"))
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

var u = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		w.Write([]byte(html.Upload().Render()))
		return
	case "POST":
		f, _, err := r.FormFile("file")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer f.Close()

		fn := r.FormValue("filename")
		ext := filepath.Ext(fn)
		name := "data/uploads/" + uuid.NewString() + ext
		o, err := os.Create(name)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer o.Close()

		if _, err = io.Copy(o, f); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte(html.Div(html.A(html.Href(name), html.T("share"))).Render()))
		return
	}
	w.Write([]byte("invalid method"))
}

func websocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := u.Upgrade(w, r, nil)
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

	f, err := os.Create("./data/uploads/" + filename)
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
	host := r.Host

	type l struct {
		Name string
		Path string
	}

	pathLookup := map[string]l{
		"/": {
			Path: "html/index.go",
			Name: "html.Index",
		},
		"/breadchris": {
			Path: "html/blog.go",
			Name: "html.RenderBlog",
		},
	}

	for p, f := range pathLookup {
		if r.URL.Path == p {
			if p == "/" {
				w.Write([]byte(html.Index()))
				return
			}
			i, err := runCode(f.Path)
			if err != nil {
				println("Error running code", err.Error())
				return
			}

			v, err := i.Eval(f.Name)
			if err != nil {
				println("Error evaluating code", err.Error())
				return
			}

			r := v.Interface().(func() string)
			w.Write([]byte(r()))
			return
		}
	}

	fmt.Printf("path: %s\n", r.URL.Path)

	// the host is in the form: *.justshare.io, extract the subdomain

	subdomain := strings.Split(host, ".")[0]
	isRoot := subdomain == "justshare" || strings.HasPrefix(subdomain, "l")

	if r.Method == "PUT" {
		// update file with content from request body
		c, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// remove the leading slash
		p := r.URL.Path[1:]
		if !isRoot {
			p = path.Join(subdomain, p)
		}
		f, err := os.OpenFile(p, os.O_RDWR, 0644)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_, err = io.Copy(f, strings.NewReader(string(c)))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		return
	}

	if isRoot {
		fileServe(r, w, r.URL.Path)
		return
	}

	fileServe(r, w, path.Join(subdomain, r.URL.Path))
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

// TODO breadchris auth
func fileUpload() {
	err := os.MkdirAll("./data/uploads", os.ModePerm)
	if err != nil {
		log.Fatalf("Failed to create uploads directory: %v", err)
	}

	http.HandleFunc("/upload", uploadHandler)
}

func recipeHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("data/recipes/index.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func fileServe(r *http.Request, w http.ResponseWriter, baseDir string) {
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
