package main

//go:generate npx buf generate proto

import (
	"crypto/md5"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/ai"
	"github.com/breadchris/share/ainet"
	"github.com/breadchris/share/list"
	"github.com/breadchris/share/op"
	"github.com/breadchris/share/registry"
	"github.com/breadchris/share/sqlnotebook"
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
	"strconv"
	"strings"

	"github.com/breadchris/share/x"
	"github.com/breadchris/share/xctf"
	"github.com/evanw/esbuild/pkg/api"

	"github.com/breadchris/share/breadchris"
	"github.com/breadchris/share/code"
	config2 "github.com/breadchris/share/config"
	. "github.com/breadchris/share/db"
	deps2 "github.com/breadchris/share/deps"
	"github.com/breadchris/share/editor/config"
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/editor/playground"
	"github.com/breadchris/share/graph"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/llm"
	"github.com/breadchris/share/paint"
	"github.com/breadchris/share/session"
	"github.com/breadchris/share/test"
	"github.com/breadchris/share/user"
	"github.com/breadchris/share/wasmcode"
	socket "github.com/breadchris/share/websocket"
	"github.com/fsnotify/fsnotify"
	"github.com/gomarkdown/markdown"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/protoflow-labs/protoflow/pkg/util/reload"
	ignore "github.com/sabhiram/go-gitignore"
	"github.com/samber/lo"
	"github.com/sashabaranov/go-openai"
	"github.com/urfave/cli/v2"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func startXCTF(port int) error {
	appConfig := config2.New()

	s, err := session.New()
	if err != nil {
		log.Fatalf("Failed to create session store: %v", err)
	}
	db := LoadDB(appConfig.DB)
	e := NewSMTPEmail(&appConfig)
	a := NewAuth(s, e, appConfig, db)

	oai := openai.NewClient(appConfig.OpenAIKey)
	docs := NewSqliteDocumentStore("data/docs.db")

	aip := ai.New(appConfig, db)

	p := func(p string, f func(d deps2.Deps) *http.ServeMux) {
		deps := deps2.Deps{
			DB:      db,
			Docs:    docs,
			Session: s,
			AIProxy: aip,
			AI:      oai,
			Config:  appConfig,
			BaseURL: func() string {
				if p == "" {
					return "/"
				}
				return p
			}(),
		}
		m := http.NewServeMux()
		m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			//code.DynamicHTTPMux(f)(deps).ServeHTTP(w, r)
			f(deps).ServeHTTP(w, r)
		})
		http.Handle(p+"/", http.StripPrefix(p, m))
	}

	fileUpload()

	p("", xctf.New)
	p("/user", user.New)

	http.HandleFunc("/register", a.handleRegister)
	http.HandleFunc("/account", a.accountHandler)
	http.HandleFunc("/login", a.handleLogin)
	http.HandleFunc("/logout", a.handleLogout)
	http.HandleFunc("/auth/google", a.startGoogleAuth)
	http.HandleFunc("/auth/google/callback", a.handleGoogleCallback)
	http.HandleFunc("/static/", serveFiles("static"))
	http.HandleFunc("/data/", serveFiles("data"))

	h := s.LoadAndSave(http.DefaultServeMux)

	log.Printf("Starting HTTP server on port: %d", port)
	return http.ListenAndServe(fmt.Sprintf("0.0.0.0:%d", port), h)
}

func startServer(useTLS bool, port int) {
	appConfig := config2.New()

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
	db := LoadDB(appConfig.DB)
	e := NewSMTPEmail(&appConfig)
	a := NewAuth(s, e, appConfig, db)

	p := func(p string, s *http.ServeMux) {
		http.Handle(p+"/", http.StripPrefix(p, s))
	}

	setupWebauthn()
	setupCursor()
	//setupRecipe()
	fileUpload()

	// TODO breadchris enable this
	//go scheduleScraping()
	reg := socket.NewCommandRegistry()

	recipeIdx, err := NewSearchIndex(smittenIndex)
	if err != nil {
		panic(err)
	}

	oai := openai.NewClient(appConfig.OpenAIKey)
	lm := leaps.RegisterRoutes(leaps.NewLogger())
	docs := NewSqliteDocumentStore("data/docs.db")
	aip := ai.New(appConfig, db)
	deps := deps2.Deps{
		DB:                db,
		Docs:              docs,
		Session:           s,
		Leaps:             lm,
		AIProxy:           aip,
		AI:                oai,
		Config:            appConfig,
		WebsocketRegistry: reg,
		Search: deps2.SearchIndex{
			Recipe: recipeIdx,
		},
	}

	shouldInterpret := true
	//shouldInterpret := false
	interpreted := func(f func(d deps2.Deps) *http.ServeMux, files ...string) *http.ServeMux {
		m := http.NewServeMux()
		m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if shouldInterpret {
				code.DynamicHTTPMux(f, files...)(deps).ServeHTTP(w, r)
			} else {
				f(deps).ServeHTTP(w, r)
			}
		})
		return m
	}

	socket.SetupHandlers(reg)

	//discord.NewConfig
	//discord.NewDiscordSession
	//discord.NewBot
	//discord.NewHandler
	//discord.NewSession

	p("/debug", interpreted(func(d deps2.Deps) *http.ServeMux {
		m := http.NewServeMux()
		m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			shouldInterpret = !shouldInterpret
			switch r.Method {
			case http.MethodPost:
				shouldInterpret = r.FormValue("debug") == "on"
			case http.MethodGet:
				DefaultLayout(
					Div(T("debug")),
					Form(
						HxPost("/debug"),
						Input(Type("checkbox"), Value(func() string {
							if shouldInterpret {
								return "on"
							}
							return "off"
						}()), T("debug")),
						Input(Type("submit"), Value("Submit")),
					),
				).RenderPage(w, r)
			}
		})
		return m
	}))
	p("/dungeon", interpreted(xctf.NewDungeon))
	p("/sqlnotebook", interpreted(sqlnotebook.New))
	p("/list", interpreted(list.New))
	p("/xctf", interpreted(xctf.New))
	p("/recipe", interpreted(NewRecipe))
	p("/articles", interpreted(NewArticle))
	p("/zine", interpreted(NewZine))
	// p("/card", interpreted(NewCard))
	p("/ai", interpreted(NewAI))
	p("/card", interpreted(NewCard2))
	p("/op", interpreted(op.New))
	p("/websocket", interpreted(func(deps deps2.Deps) *http.ServeMux {
		return socket.WebsocketUI(reg)
	}))
	p("/ainet", interpreted(ainet.New))
	p("/test", interpreted(test.New))
	p("/user", interpreted(user.New))
	p("/paint", interpreted(paint.New))
	p("/notes", interpreted(NewNotes))
	p("/llm", interpreted(llm.NewChatGPT))
	p("/mood", interpreted(NewMood))
	p("/chat", interpreted(NewChat))
	p("/spotify", setupSpotify(deps))
	p("/leaps", lm.Mux)
	p("/vote", interpreted(NewVote))
	p("/breadchris", interpreted(breadchris.New))
	p("/reload", setupReload([]string{"./scratch.go", "./vote.go", "./eventcalendar.go", "./websocket/websocket.go", "./card.go", "./ai.go", "./tarot.go"}))
	p("/code", interpreted(wasmcode.New))
	p("/extension", interpreted(NewExtension))
	p("/git", interpreted(NewGit))
	p("/music", interpreted(NewMusic))
	p("/stripe", interpreted(NewStripe))
	p("/everout", interpreted(NewEverout))
	p("/graph", interpreted(graph.New))
	p("/pipeport", interpreted(NewPipePort))
	p("/nolanisslow", interpreted(NewNolan))
	//p("/calendar", interpreted(calendar.NewCalendar))
	p("/calendar", interpreted(NewCalendar))
	p("/registry", interpreted(registry.New))
	g := NewGithub(deps)
	p("/github", interpreted(g.Routes))
	p("/filecode", func() *http.ServeMux {
		m := http.NewServeMux()
		m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			_, err := s.GetUserID(r.Context())
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
			}
			interpreted(code.New).ServeHTTP(w, r)
		})
		return m
	}())

	p("/repl", interpreted(func(d deps2.Deps) *http.ServeMux {
		m := http.NewServeMux()
		m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			DefaultLayout(
				Div(T("repl")),
			).RenderPage(w, r)
		})
		return m
	}))

	http.HandleFunc("/register", a.handleRegister)
	http.HandleFunc("/account", a.accountHandler)
	http.HandleFunc("/login", a.handleLogin)
	http.HandleFunc("/logout", a.handleLogout)
	http.HandleFunc("/invite", a.handleInvite)
	http.HandleFunc("/auth/google", a.startGoogleAuth)
	http.HandleFunc("/auth/google/callback", a.handleGoogleCallback)
	http.HandleFunc("/blog/react", a.reactHandler)
	http.HandleFunc("/blog/{id...}", a.blogHandler)
	http.HandleFunc("/files", fileHandler)
	http.HandleFunc("/modify", modifyHandler)

	http.HandleFunc("/static/", serveFiles("static"))
	http.HandleFunc("/data/", serveFiles("data"))

	rel := make(chan struct{})
	http.HandleFunc("/esbuild", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Transfer-Encoding", "chunked")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming not supported", http.StatusInternalServerError)
			return
		}

		for {
			select {
			case <-rel:
				fmt.Fprintf(w, "data: change\n\n")
				flusher.Flush()
			case <-r.Context().Done():
				return
			}
		}
	})

	p("", interpreted(NewRecipe))

	go func() {
		paths := []string{
			"./breadchris/editor.tsx",
			"./breadchris/CodeBlock.tsx",
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
					".png":   api.LoaderFile,
					".woff2": api.LoaderFile,
					".ttf":   api.LoaderFile,
					".eot":   api.LoaderFile,
					".css":   api.LoaderCSS,
				},
				Outdir:      "breadchris/static",
				Bundle:      true,
				TreeShaking: api.TreeShakingTrue,
				//MinifyWhitespace:  true,
				//MinifyIdentifiers: true,
				//MinifySyntax:      true,
				//Splitting:         true,
				Format:    api.FormatESModule,
				Write:     true,
				Sourcemap: api.SourceMapExternal,
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
		entrypoints := []string{
			"./graph/graph.tsx",
			"./graph/nodes.tsx",
			"./graph/code.ts",
			//"./xctf/graph.tsx",
			//"./code/monaco.tsx",
			//"./code/playground.ts",
			"./music.tsx",
			//"./wasmcode/monaco.tsx",
			//"./wasmcode/analyzer/analyzer.worker.ts",
			//"./wasmcode/language/language.worker.ts",
		}
		paths := make([]string, len(entrypoints))
		copy(paths, entrypoints)
		if err := filepath.Walk("./wasmcode", func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if filepath.Ext(path) == ".ts" || filepath.Ext(path) == ".tsx" {
				paths = append(paths, path)
			}
			return nil
		}); err != nil {
			log.Fatalf("Failed to walk wasmcode: %v", err)
		}
		if err := WatchFilesAndFolders(paths, func(s string) {
			result := api.Build(api.BuildOptions{
				EntryPoints: entrypoints,
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
					".png":   api.LoaderFile,
				},
				Outdir:      "static/",
				Format:      api.FormatESModule,
				Bundle:      true,
				Write:       true,
				TreeShaking: api.TreeShakingTrue,
				//MinifyWhitespace:  true,
				//MinifyIdentifiers: true,
				//MinifySyntax:      true,
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

			if err = x.CopyPaths([]string{
				"static/wasmcode",
				"static/analyzer@v1.wasm",
				"static/leapclient.js",
				"static/leap-bind-textarea.js",
				"static/node_modules",
			}, "breadchris/static"); err != nil {
				log.Fatalf("Failed to copy paths: %v", err)
			}

			rel <- struct{}{}
		}); err != nil {
			log.Fatalf("Failed to watch files: %v", err)
		}
	}()
	// non-module code
	go func() {
		entrypoints := []string{
			"./code/playground.ts",
			"./recipe.tsx",
		}
		if err := WatchFilesAndFolders(entrypoints, func(s string) {
			result := api.Build(api.BuildOptions{
				EntryPoints: entrypoints,
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
				Outdir:      "static/",
				Bundle:      true,
				Write:       true,
				TreeShaking: api.TreeShakingTrue,
				//MinifyWhitespace:  true,
				//MinifyIdentifiers: true,
				//MinifySyntax:      true,
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
		http.ListenAndServe(fmt.Sprintf("0.0.0.0:%d", port), h)
	}
}

func neuter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") {
			http.NotFound(w, r)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func serveFiles(dir string) http.HandlerFunc {
	fileServer := neuter(http.FileServer(http.Dir(dir)))

	return func(w http.ResponseWriter, r *http.Request) {
		filePath := filepath.Join(".", r.URL.Path)

		if filepath.Ext(filePath) == ".jpg" || filepath.Ext(filePath) == ".jpeg" || filepath.Ext(filePath) == ".png" {
			f, err := os.Open(filePath)
			if err != nil {
				http.NotFound(w, r)
				return
			}
			defer f.Close()

			stat, err := f.Stat()
			if err != nil || stat.IsDir() {
				http.NotFound(w, r)
				return
			}

			etag := generateETag(stat)

			if match := r.Header.Get("If-None-Match"); match == etag {
				w.WriteHeader(http.StatusNotModified)
				return
			}

			w.Header().Set("ETag", etag)
		}

		http.StripPrefix("/"+dir, fileServer).ServeHTTP(w, r)
	}
}

func generateETag(info os.FileInfo) string {
	h := md5.New()
	io.WriteString(h, info.Name())
	io.WriteString(h, strconv.FormatInt(info.Size(), 10))
	io.WriteString(h, info.ModTime().String())
	return `"` + hex.EncodeToString(h.Sum(nil)) + `"`
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
				Name: "xctf",
				Flags: []cli.Flag{
					&cli.IntFlag{
						Name:  "port",
						Value: 8080,
					},
				},
				Action: func(c *cli.Context) error {
					return startXCTF(c.Int("port"))
				},
			},
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
				Name: "food",
				Action: func(c *cli.Context) error {
					db := LoadDB("sqlite://data/db.sqlite")

					println("loading food data")
					//f, err := loadBrandedFoodData()
					//if err != nil {
					//	return err
					//}
					f, err := loadSRData()
					if err != nil {
						return err
					}

					println("saving food data")
					//if err := saveFoods(db, f); err != nil {
					//	return err
					//}
					if err := saveSRFoods(db, f); err != nil {
						return err
					}
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
			NewPipePortCli(),
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

	if err = ModifyFunction(parts[0], req.Class, line, -1); err != nil {
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
		w.Write([]byte(Upload("/upload").Render()))
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

type DirFile struct {
	Name  string
	IsDir bool
}

func fileServe(r *http.Request, w http.ResponseWriter, baseDir string) {
	path := r.URL.Path
	path = path[1:]

	fileInfo, err := os.ReadDir(path)
	if err == nil {
		var fileNames []DirFile
		for _, file := range fileInfo {
			fileNames = append(fileNames, DirFile{file.Name(), file.IsDir()})
		}

		indexPath := filepath.Join(path, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			http.ServeFile(w, r, indexPath)
			return
		}

		FileListPage(fileNames).RenderPage(w, r)
		return
	}
	http.ServeFile(w, r, path)
}

func FileListPage(files []DirFile) *Node {
	return Html(
		Attr("lang", "en"),
		Head(
			Meta(Attr("charset", "UTF-8")),
			Meta(Attr("name", "viewport"), Attr("content", "width=device-width, initial-scale=1.0")),
			Title(T("File List")),
			Link(
				Href("https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"),
				Attr("rel", "stylesheet"),
			),
		),
		Body(Class("bg-gray-100"),
			Div(Class("container mx-auto p-4"),
				H1(Class("text-2xl font-bold mb-4"), T("File List")),
				Ul(Class("list-disc list-inside bg-white p-4 rounded shadow"),
					Ch(
						lo.Map(files, func(f DirFile, i int) *Node {
							href := f.Name
							if f.IsDir {
								href += "/"
							}
							return Li(Class("py-1"),
								A(Href(href), T(f.Name)),
							)
						}),
					),
				),
			),
		),
	)
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

func WatchFilesAndFolders(paths []string, callback func(string)) error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("failed to create watcher: %w", err)
	}
	defer watcher.Close()

	// Add the paths to the watcher
	for _, path := range paths {
		absPath, err := filepath.Abs(path)
		if err != nil {
			return fmt.Errorf("failed to get absolute path for %s: %w", path, err)
		}

		err = watcher.Add(absPath)
		if err != nil {
			return fmt.Errorf("failed to add %s to watcher: %w", absPath, err)
		}
	}

	done := make(chan bool)

	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				if event.Op != fsnotify.Write {
					continue
				}

				absPath, err := filepath.Abs(event.Name)
				if err != nil {
					log.Printf("failed to get absolute path for %s: %v", event.Name, err)
					continue
				}
				callback(absPath)

			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Printf("error: %v", err)
			}
		}
	}()

	<-done
	return nil
}

//http.HandleFunc("/gopls", func(w http.ResponseWriter, r *http.Request) {
//	println("gopls")
//	c, err := upgrader.Upgrade(w, r, nil)
//	if err != nil {
//		log.Println(err)
//		return
//	}
//	defer c.Close()
//
//	cmd := exec.Command("gopls", "-rpc.trace", "-v")
//	stdin, err := cmd.StdinPipe()
//	if err != nil {
//		log.Println("Failed to get stdin pipe:", err)
//		return
//	}
//	stdout, err := cmd.StdoutPipe()
//	if err != nil {
//		log.Println("Failed to get stdout pipe:", err)
//		return
//	}
//	cmd.Stderr = os.Stderr
//
//	if err := cmd.Start(); err != nil {
//		log.Println("Failed to start gopls:", err)
//		return
//	}
//	scanner := bufio.NewScanner(stdout)
//	go func() {
//		var buffer bytes.Buffer
//		for scanner.Scan() {
//			line := scanner.Text()
//			if strings.TrimSpace(line) == "" {
//				break
//			}
//			buffer.WriteString(line + "\n")
//		}
//		if err := scanner.Err(); err != nil {
//			fmt.Fprintf(os.Stderr, "Error reading from stdout: %v\n", err)
//			return
//		}
//		fmt.Printf("Response Header:\n%s\n", buffer.String())
//
//		responseBody := bufio.NewReader(stdout)
//		response, err := responseBody.ReadString('}')
//		if err != nil && err != io.EOF {
//			fmt.Fprintf(os.Stderr, "Error reading response body: %v\n", err)
//			return
//		}
//
//		fmt.Printf("Response Body:\n%s\n", response)
//		buf := make([]byte, 2048)
//		for {
//			n, err := stdout.Read(buf)
//			println(n)
//			if err != nil {
//				if err == io.EOF {
//					continue
//				}
//				log.Println("Failed to read from gopls:", err)
//				break
//			}
//			if n > 0 {
//				c.WriteMessage(websocket.TextMessage, buf[:n])
//			}
//		}
//	}()
//
//	for {
//		_, message, err := c.ReadMessage()
//		if err != nil {
//			log.Println("WebSocket read error:", err)
//			break
//		}
//
//		content := fmt.Sprintf("Content-Length: %d\r\n\r\n%s", len(message), message)
//		if _, err := io.WriteString(stdin, content); err != nil {
//			fmt.Fprintf(os.Stderr, "Failed to write to stdin: %v\n", err)
//			return
//		}
//	}
//
//	if err := cmd.Wait(); err != nil {
//		log.Println("gopls process ended with error:", err)
//	}
//})
