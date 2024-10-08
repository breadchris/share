package main

import (
	"bytes"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/breadchris"
	"github.com/breadchris/share/code"
	"github.com/breadchris/share/editor/config"
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/editor/playground"
	"github.com/breadchris/share/html"
	"github.com/breadchris/share/session"
	"github.com/breadchris/share/symbol"
	"github.com/evanw/esbuild/pkg/api"
	"github.com/gomarkdown/markdown"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/protoflow-labs/protoflow/pkg/util/reload"
	ignore "github.com/sabhiram/go-gitignore"
	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"github.com/urfave/cli/v2"
	"go/format"
	"go/printer"
	"go/token"
	"html/template"
	"io"
	"io/ioutil"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"reflect"
	"strconv"
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
	OpenAIKey          string        `json:"openai_key"`
	SMTP               SMTPConfig    `json:"smtp"`
	Spotify            SpotifyConfig `json:"spotify"`
	ExternalURL        string        `json:"external_url"`
	SessionSecret      string        `json:"session_secret"`
	GoogleClientID     string        `json:"google_client_id"`
	GoogleClientSecret string        `json:"google_client_secret"`
}

type ZineConfig struct {
}

func LoadConfig() AppConfig {
	appConfig := AppConfig{
		SessionSecret: "secret",
	}

	configFile, err := os.Open("data/config.json")
	if err != nil {
		log.Fatalf("Failed to open dbconfig file: %v", err)
	}
	defer configFile.Close()

	err = json.NewDecoder(configFile).Decode(&appConfig)
	if err != nil {
		log.Fatalf("Failed to decode dbconfig file: %v", err)
	}
	return appConfig
}

func startServer(useTLS bool, port int) {
	appConfig := LoadConfig()

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
	z := NewZineMaker()

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
	p("/llm", SetupChatgpt(oai))
	p("/chat", c.NewMux())

	lm := leaps.RegisterRoutes(leaps.NewLogger())
	p("/leaps", lm.Mux)

	//text.Setup(upgrader)
	//go watchPaths()
	go func() {
		paths := []string{
			"./breadchris/editor.tsx",
		}
		if err := WatchFilesAndFolders(paths, func(s string) {
			result := api.Build(api.BuildOptions{
				EntryPoints: paths,
				Loader: map[string]api.Loader{
					".js":    api.LoaderJS,
					".jsx":   api.LoaderJSX,
					".ts":    api.LoaderTS,
					".tsx":   api.LoaderTSX,
					".woff":  api.LoaderFile,
					".woff2": api.LoaderFile,
					".ttf":   api.LoaderFile,
					".eot":   api.LoaderFile,
					".css":   api.LoaderCSS,
				},
				//Outfile:   "graph.js",
				Outdir:    "breadchris/static",
				Bundle:    true,
				Write:     true,
				Sourcemap: api.SourceMapInline,
				LogLevel:  api.LogLevelInfo,
			})

			for _, warning := range result.Warnings {
				fmt.Println(warning.Text)
			}

			for _, e := range result.Errors {
				fmt.Println(e.Text)
			}

			for _, f := range result.OutputFiles {
				fmt.Println(f.Path)
			}
		}); err != nil {
			log.Fatalf("Failed to watch files: %v", err)
		}
	}()
	go func() {
		paths := []string{
			"./graph/graph.tsx",
			"./code/monaco.tsx",
		}
		if err := WatchFilesAndFolders(paths, func(s string) {
			result := api.Build(api.BuildOptions{
				EntryPoints: paths,
				Loader: map[string]api.Loader{
					".js":    api.LoaderJS,
					".jsx":   api.LoaderJSX,
					".ts":    api.LoaderTS,
					".tsx":   api.LoaderTSX,
					".woff":  api.LoaderFile,
					".woff2": api.LoaderFile,
					".ttf":   api.LoaderFile,
					".eot":   api.LoaderFile,
					".css":   api.LoaderCSS,
				},
				//Outfile:   "graph.js",
				Outdir:    "dist/",
				Bundle:    true,
				Write:     true,
				Sourcemap: api.SourceMapInline,
				LogLevel:  api.LogLevelInfo,
			})

			for _, warning := range result.Warnings {
				fmt.Println(warning.Text)
			}

			for _, e := range result.Errors {
				fmt.Println(e.Text)
			}

			for _, f := range result.OutputFiles {
				fmt.Println(f.Path)
			}
		}); err != nil {
			log.Fatalf("Failed to watch files: %v", err)
		}
	}()
	//go func() {
	//	paths := []string{
	//		"./graph/graph.tsx",
	//	}
	//	if err := WatchFilesAndFolders(paths, graph.Build); err != nil {
	//		log.Fatalf("Failed to watch files: %v", err)
	//	}
	//}()

	p("/breadchris", breadchris.New("/breadchris"))

	p("/reload", setupReload("./scratch.go"))

	p("/code", code.New(lm))

	z.SetupZineRoutes()

	db, err := html.NewDBAny("data/testdb/")
	if err != nil {
		log.Fatalf("Failed to create db: %v", err)
	}

	getScriptFunc := func(path, name string) (reflect.Value, error) {
		i := interp.New(interp.Options{
			GoPath: "/dev/null",
		})

		i.Use(stdlib.Symbols)
		i.Use(symbol.Symbols)

		if _, err := i.EvalPath(path); err != nil {
			return reflect.Value{}, err
		}

		v, err := i.Eval(name)
		if err != nil {
			return reflect.Value{}, err
		}
		return v, nil
	}

	http.HandleFunc("/scratch", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			db.Set(uuid.NewString(), map[string]any{
				"ID":    0,
				"Value": r.FormValue("value"),
			})

			v, err := getScriptFunc("./scratch.go", "main.RenderList")
			if err != nil {
				http.Error(w, "Failed to get script func", http.StatusInternalServerError)
				return
			}
			rf := v.Interface().(func(db *html.DBAny) *html.Node)
			n := rf(db)
			n.RenderPage(w, r)
			return
		}

		v, err := getScriptFunc("./scratch.go", "main.RenderComponents")
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to get script func: %v", err), http.StatusInternalServerError)
			return
		}

		rf := v.Interface().(func(db *html.DBAny) *html.Node)
		n := rf(db)
		n.RenderPage(w, r)
	})

	http.HandleFunc("/register", a.handleRegister)
	http.HandleFunc("/login", a.handleLogin)
	http.HandleFunc("/invite", a.handleInvite)
	http.HandleFunc("/auth/google", a.startGoogleAuth)
	http.HandleFunc("/auth/google/callback", a.handleGoogleCallback)
	http.HandleFunc("/blog", a.blogHandler)
	http.HandleFunc("/blog/react", a.reactHandler)
	http.HandleFunc("/account", a.accountHandler)
	http.HandleFunc("/files", fileHandler)
	http.HandleFunc("/modify", modifyHandler)
	http.HandleFunc("/extension", extensionHandler)

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
		http.ListenAndServe(fmt.Sprintf("localhost:%d", port), h)
	}
}

func main() {
	app := &cli.App{
		Name: "share",
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name: "debug",
			},
		},
		Action: func(context *cli.Context) error {
			if context.Bool("debug") {
				liveReload()
			}
			startServer(false, 8080)
			return nil
		},
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
			{
				Name: "editor",
				Action: func(c *cli.Context) error {
					m := leaps.RegisterRoutes(leaps.NewLogger())

					cfg := config.DefaultConfig()
					cfg.Build.PackagesFile = "./editor/packages.json"
					cfg.HTTP.Addr = "localhost:8000"
					playground.StartEditor(cfg, m.Mux)
					return nil
				},
			},
			{
				Name: "leaps",
				Action: func(c *cli.Context) error {
					leaps.NewLeaps()
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

func liveReload() error {
	c := reload.Config{
		Cmd:      []string{"go", "run", "."},
		Targets:  []string{"./breadchris", "./chat.go"},
		Patterns: []string{"**/*.go", "*.go"},
	}
	return reload.Reload(c)
}

var u = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type ExtensionRequest struct {
	Name    string `json:"name"`
	Element string `json:"element"`
}

func extensionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, fmt.Sprintf("Method %s not allowed", r.Method), http.StatusMethodNotAllowed)
		return
	}

	var req ExtensionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Failed to decode request: %v", err), http.StatusBadRequest)
		return
	}

	if req.Element == "" {
		http.Error(w, "Element is required", http.StatusBadRequest)
		return
	}

	n, err := html.ParseHTMLString(req.Element)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to parse element: %v", err), http.StatusInternalServerError)
		return
	}

	var buf bytes.Buffer

	fset := token.NewFileSet()

	// TODO breadchris https://github.com/segmentio/golines
	cfg := &printer.Config{
		Mode:     printer.TabIndent,
		Tabwidth: 4,
	}

	err = cfg.Fprint(&buf, fset, html.RenderGoFunction(fset, "Render"+strings.Title(req.Name), n.RenderGoCode(fset)))
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to format code: %v", err), http.StatusInternalServerError)
		return
	}

	formattedCode, err := format.Source(buf.Bytes())
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to format code: %v", err), http.StatusInternalServerError)
		return
	}

	f, err := os.OpenFile("scratch.go", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to open scratch.go: %v", err), http.StatusInternalServerError)
		return
	}

	if _, err = f.Write([]byte("\n" + string(formattedCode))); err != nil {
		http.Error(w, fmt.Sprintf("Failed to write to scratch.go: %v", err), http.StatusInternalServerError)
		return
	}

	if _, err := exec.LookPath("golines"); err != nil {
		println("golines is not installed: go install github.com/segmentio/golines@latest")
		http.Error(w, fmt.Sprintf("golines is not installed: %v", err), http.StatusInternalServerError)
		return
	}

	cmd := exec.Command("golines", "-w", "scratch.go")
	if err := cmd.Run(); err != nil {
		http.Error(w, fmt.Sprintf("Failed to run golines: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

type ModifyRequest struct {
	Class     string `json:"class"`
	DataGodom string `json:"dataGodom"`
}

func modifyHandler(w http.ResponseWriter, r *http.Request) {
	var req ModifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	fmt.Printf("Class: %s, DataGodom: %s\n", req.Class, req.DataGodom)

	parts := strings.Split(req.DataGodom, ":")
	if len(parts) != 2 {
		slog.Error("invalid data godom", "dataGodom", req.DataGodom)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	line, err := strconv.Atoi(parts[1])
	if err != nil {
		slog.Error("error converting line to int", "err", err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if err = html.ModifyFunction(parts[0], req.Class, line, -1); err != nil {
		slog.Error("error modifying function", "err", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func convertMovToMp4(inputFile, outputFile string) error {
	cmd := exec.Command("ffmpeg", "-i", inputFile, "-c:v", "libx264", "-c:a", "aac", outputFile)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to convert video: %w", err)
	}
	return nil
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		w.Write([]byte(html.Upload().Render()))
		return
	case "POST":
		r.ParseMultipartForm(10 << 20)

		f, h, err := r.FormFile("file")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer f.Close()

		//if !strings.HasPrefix(h.Header.Get("Content-Type"), "image/") {
		//	http.Error(w, "must be image", http.StatusBadRequest)
		//	return
		//}

		if h.Size > 10*1024*1024 {
			http.Error(w, "File is too large must be < 10mb", http.StatusBadRequest)
			return
		}

		ext := filepath.Ext(h.Filename)

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

		if ext == ".mov" {
			outputFile := "data/uploads/" + uuid.NewString() + ".mp4"
			if err := convertMovToMp4(name, outputFile); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if err = os.Remove(name); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Write([]byte("/" + outputFile))
			return
		}
		// TODO https
		w.Write([]byte(fmt.Sprintf("/%s", name)))
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

	fmt.Printf("path: %s\n", r.URL.Path)

	if r.URL.Path == "/" {
		Index().RenderPage(w, r)
		return
	}

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

	fileInfo, err := os.ReadDir(path)
	if err == nil {
		type File struct {
			Name  string
			IsDir bool
		}
		var fileNames []File
		for _, file := range fileInfo {
			fileNames = append(fileNames, File{file.Name(), file.IsDir()})
		}

		indexPath := filepath.Join(path, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			http.ServeFile(w, r, indexPath)
			return
		}

		indexTemplate, err := template.ParseFiles("dir.html")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		err = indexTemplate.Execute(w, map[string]any{
			"files": fileNames,
		})
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
