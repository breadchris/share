package main

//go:generate buf generate --path proto

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"path"
	"path/filepath"

	"github.com/breadchris/share/ai"
	"github.com/breadchris/share/aiapi"
	"github.com/breadchris/share/ainet"
	"github.com/breadchris/share/bread"
	"github.com/breadchris/share/breadchris"
	"github.com/breadchris/share/claudemd"
	"github.com/breadchris/share/code"
	"github.com/breadchris/share/coderunner"
	config2 "github.com/breadchris/share/config"
	. "github.com/breadchris/share/db"
	deps2 "github.com/breadchris/share/deps"
	"github.com/breadchris/share/docker"
	"github.com/breadchris/share/editor/config"
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/editor/playground"
	"github.com/breadchris/share/example"
	"github.com/breadchris/share/graph"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/justshare"
	"github.com/breadchris/share/list"
	"github.com/breadchris/share/llm"
	"github.com/breadchris/share/op"
	"github.com/breadchris/share/paint"
	"github.com/breadchris/share/registry"
	"github.com/breadchris/share/session"
	"github.com/breadchris/share/slackbot"
	"github.com/breadchris/share/sqlnotebook"
	"github.com/breadchris/share/test"
	"github.com/breadchris/share/user"
	"github.com/breadchris/share/wasmcode"
	socket "github.com/breadchris/share/websocket"
	"github.com/breadchris/share/xctf"
	"github.com/evanw/esbuild/pkg/api"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/protoflow-labs/protoflow/pkg/util/reload"
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
			Dir:     os.Getenv("PWD"),
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

	p("/xctf", xctf.New)
	p("/user", user.New)
	p("", justshare.New)

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

	handler := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	slog.SetDefault(slog.New(handler))

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
	dockerManager := docker.NewManager(db)
	deps := deps2.Deps{
		DB:                db,
		Docs:              docs,
		Session:           s,
		Leaps:             lm,
		AIProxy:           aip,
		AI:                oai,
		Config:            appConfig,
		WebsocketRegistry: reg,
		Docker:            dockerManager,
		Search: deps2.SearchIndex{
			Recipe: recipeIdx,
		},
	}

	// Initialize and start Slack bot if configured
	if slackBot, err := slackbot.New(deps); err == nil {
		go func() {
			if err := slackBot.Start(context.Background()); err != nil {
				slog.Error("Slack bot failed", "error", err)
			}
		}()
		slog.Info("Slack bot started")
	} else {
		slog.Debug("Slack bot not started", "reason", err.Error())
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
	p("/ai", interpreted(aiapi.New))
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
	p("", interpreted(justshare.New))

	p("/coderunner", interpreted(coderunner.New))
	p("/example", interpreted(example.New))
	p("/claudemd", interpreted(claudemd.New))
	p("/docker", interpreted(docker.New))
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

	// go bread.Dev()
	p("/bread", interpreted(bread.New))

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

	// p("", interpreted(NewRecipe))

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
			// "./graph/graph.tsx",
			// "./graph/nodes.tsx",
			// "./graph/code.ts",
			//"./xctf/graph.tsx",
			//"./code/monaco.tsx",
			//"./code/playground.ts",
			// "./music.tsx",
			"./coderunner/CodeRunner.tsx",
			//"./wasmcode/monaco.tsx",
			//"./wasmcode/analyzer/analyzer.worker.ts",
			//"./wasmcode/language/language.worker.ts",
		}
		paths := make([]string, len(entrypoints))
		copy(paths, entrypoints)
		if err := filepath.Walk("./coderunner", func(path string, info os.FileInfo, err error) error {
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
				Outdir:      "static/coderunner",
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

			// if err = x.CopyPaths([]string{
			// 	"static/wasmcode",
			// 	"static/analyzer@v1.wasm",
			// 	"static/leapclient.js",
			// 	"static/leap-bind-textarea.js",
			// 	"static/node_modules",
			// }, "breadchris/static"); err != nil {
			// 	log.Fatalf("Failed to copy paths: %v", err)
			// }

			// rel <- struct{}{}
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
