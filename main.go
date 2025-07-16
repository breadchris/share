package main

// //go:generate buf generate --path proto

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/graveyard/list"
	"github.com/breadchris/share/graveyard/llm"
	"github.com/breadchris/share/graveyard/op"
	"github.com/breadchris/share/graveyard/paint"
	"github.com/breadchris/share/graveyard/registry"
	"github.com/breadchris/share/graveyard/sqlnotebook"
	"log"
	"log/slog"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/breadchris/share/ai"
	"github.com/breadchris/share/aiapi"
	"github.com/breadchris/share/awesomelist"
	"github.com/breadchris/share/bread"
	"github.com/breadchris/share/breadchris"
	"github.com/breadchris/share/code"
	"github.com/breadchris/share/coderunner"
	config2 "github.com/breadchris/share/config"
	. "github.com/breadchris/share/db"
	"github.com/breadchris/share/deploy"
	deps2 "github.com/breadchris/share/deps"
	"github.com/breadchris/share/docker"
	"github.com/breadchris/share/editor/config"
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/editor/playground"
	"github.com/breadchris/share/example"
	extensionmcp "github.com/breadchris/share/extension-mcp"
	"github.com/breadchris/share/graph"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/justshare"
	"github.com/breadchris/share/kanban"
	"github.com/breadchris/share/session"
	"github.com/breadchris/share/user"
	"github.com/breadchris/share/vibekanban"
	"github.com/breadchris/share/xctf"
	"github.com/evanw/esbuild/pkg/api"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/protoflow-labs/protoflow/pkg/util/reload"
	"github.com/sashabaranov/go-openai"
	"github.com/urfave/cli/v2"

	// Flow module imports
	flow_code "github.com/breadchris/flow/code"
	flow_config "github.com/breadchris/flow/config"
	flow_deps "github.com/breadchris/flow/deps"
	flow_slackbot "github.com/breadchris/flow/slackbot"
	flow_worklet "github.com/breadchris/flow/worklet"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func cspMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// CSP policy that allows Google Identity scripts and other required resources
		csp := "default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: *; " +
			"style-src 'self' 'unsafe-inline' *; " +
			"font-src 'self' *; " +
			"img-src 'self' data: *; " +
			"connect-src 'self' *; " +
			"frame-src 'self' *; " +
			"form-action 'self' *;"

		w.Header().Set("Content-Security-Policy", csp)
		next.ServeHTTP(w, r)
	})
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
	p("/vibekanban", vibekanban.NewHTTP)
	p("", justshare.New)

	http.HandleFunc("/register", a.handleRegister)
	http.HandleFunc("/account", a.accountHandler)
	http.HandleFunc("/login", a.handleLogin)
	http.HandleFunc("/logout", a.handleLogout)
	http.HandleFunc("/auth/google", a.startGoogleAuth)
	http.HandleFunc("/auth/google/callback", a.handleGoogleCallback)
	http.HandleFunc("/static/", serveFiles("static"))
	http.HandleFunc("/data/", serveFiles("data"))

	// Initialize snapshot manager
	snapshotManager := NewSnapshotManager(&appConfig, db)
	if err := snapshotManager.Start(port); err != nil {
		log.Printf("Failed to start snapshot manager: %v", err)
	}

	// Add snapshot control API endpoints
	http.HandleFunc("/api/snapshot/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(snapshotManager.GetStatus())
	})

	http.HandleFunc("/api/snapshot/start", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := snapshotManager.Start(port); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"status": "started"})
	})

	http.HandleFunc("/api/snapshot/stop", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := snapshotManager.Stop(); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"status": "stopped"})
	})

	http.HandleFunc("/api/snapshot/session/", func(w http.ResponseWriter, r *http.Request) {
		// Extract session ID from URL path
		path := strings.TrimPrefix(r.URL.Path, "/api/snapshot/session/")
		parts := strings.Split(path, "/")
		if len(parts) < 2 {
			http.Error(w, "Invalid session endpoint", http.StatusBadRequest)
			return
		}

		sessionID := parts[0]
		action := parts[1]

		w.Header().Set("Content-Type", "application/json")

		switch action {
		case "monitor":
			if r.Method != "POST" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			snapshotManager.AddSessionToMonitor(sessionID)
			json.NewEncoder(w).Encode(map[string]string{"status": "monitoring", "session": sessionID})

		case "unmonitor":
			if r.Method != "POST" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			snapshotManager.RemoveSessionFromMonitor(sessionID)
			json.NewEncoder(w).Encode(map[string]string{"status": "not monitoring", "session": sessionID})

		default:
			http.Error(w, "Invalid action", http.StatusBadRequest)
		}
	})

	// Add CSP middleware to allow Google Identity scripts
	h := cspMiddleware(s.LoadAndSave(http.DefaultServeMux))

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
		DB:      db,
		Docs:    docs,
		Session: s,
		Leaps:   lm,
		AIProxy: aip,
		AI:      oai,
		Config:  appConfig,
		Docker:  dockerManager,
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
	// p("/card", interpreted(NewCard))
	p("/ai", interpreted(aiapi.New))
	//p("/card", interpreted(NewCard2))
	p("/op", interpreted(op.New))
	//p("/ainet", interpreted(ainet.New))
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
	p("/reload", setupReload([]string{"./scratch.go", "./vote.go", "./eventcalendar.go", "./card.go", "./ai.go", "./tarot.go"}))
	//p("/code", interpreted(wasmcode.New))
	p("/extension", interpreted(NewExtension))
	p("/extension-mcp", extensionmcp.New(deps))
	p("/git", interpreted(NewGit))
	p("/music", interpreted(NewMusic))
	p("/stripe", interpreted(NewStripe))
	p("/everout", interpreted(NewEverout))
	p("/graph", interpreted(graph.New))
	p("/pipeport", interpreted(NewPipePort))
	p("/nolanisslow", interpreted(NewNolan))
	//p("/calendar", interpreted(calendar.NewCalendar))
	p("/registry", interpreted(registry.New))
	g := NewGithub(deps)
	p("/github", interpreted(g.Routes))

	// Mount flow module routes under /flow prefix
	flowCfg := flow_config.LoadConfig()
	flowDeps := flow_deps.NewDepsFactory(flowCfg).CreateDeps()

	// Mount worklet API at /flow/api/worklet using interpreted pattern
	p("/flow/api/worklet", interpreted(func(d deps2.Deps) *http.ServeMux {
		return flow_worklet.New(&flowDeps)
	}))

	// Mount code package at /flow/code using interpreted pattern
	p("/code", interpreted(func(d deps2.Deps) *http.ServeMux {
		return flow_code.New(flowDeps)
	}))

	// Mount deployment management at /deploy
	p("/deploy", interpreted(deploy.New))

	// Mount slackbot event handler registry for yaegi interpretation
	p("/flow/slackbot", interpreted(func(d deps2.Deps) *http.ServeMux {
		// Import the slackbot yaegi integration function
		return flow_slackbot.YaegiIntegrationMux(flow_deps.Deps{
			Config: flowDeps.Config,
			DB:     flowDeps.DB,
		})
	}))

	p("", interpreted(justshare.New))

	p("/coderunner", interpreted(coderunner.New))
	p("/example", interpreted(example.New))
	p("/kanban", interpreted(kanban.New))
	p("/vibekanban", interpreted(vibekanban.NewHTTP))
	//p("/claudemd", interpreted(claudemd.New))
	p("/docker", interpreted(docker.New))
	p("/browser", interpreted(NewBrowser))
	p("/awesomelist", interpreted(awesomelist.New))
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

	// Global health check endpoint for deployment system
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"share","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`))
	})

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

	// Start Slack bot from flow module (non-blocking)
	go func() {
		if flowDeps.Config.IsSlackBotEnabled() {
			slog.Info("Starting Flow Slack bot...")
			bot, err := flow_slackbot.New(flowDeps)
			if err != nil {
				slog.Error("Failed to create Flow Slack bot", "error", err)
				return
			}

			ctx := context.Background()
			if err := bot.Start(ctx); err != nil {
				slog.Error("Failed to start Flow Slack bot", "error", err)
			}
		} else {
			slog.Info("Flow Slack bot is disabled")
		}
	}()

	// Initialize snapshot manager
	snapshotManager := NewSnapshotManager(&appConfig, db)
	if err := snapshotManager.Start(port); err != nil {
		log.Printf("Failed to start snapshot manager: %v", err)
	}

	// Add snapshot control API endpoints
	http.HandleFunc("/api/snapshot/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(snapshotManager.GetStatus())
	})

	http.HandleFunc("/api/snapshot/start", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := snapshotManager.Start(port); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"status": "started"})
	})

	http.HandleFunc("/api/snapshot/stop", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := snapshotManager.Stop(); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"status": "stopped"})
	})

	http.HandleFunc("/api/snapshot/session/", func(w http.ResponseWriter, r *http.Request) {
		// Extract session ID from URL path
		path := strings.TrimPrefix(r.URL.Path, "/api/snapshot/session/")
		parts := strings.Split(path, "/")
		if len(parts) < 2 {
			http.Error(w, "Invalid session endpoint", http.StatusBadRequest)
			return
		}

		sessionID := parts[0]
		action := parts[1]

		w.Header().Set("Content-Type", "application/json")

		switch action {
		case "monitor":
			if r.Method != "POST" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			snapshotManager.AddSessionToMonitor(sessionID)
			json.NewEncoder(w).Encode(map[string]string{"status": "monitoring", "session": sessionID})

		case "unmonitor":
			if r.Method != "POST" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			snapshotManager.RemoveSessionFromMonitor(sessionID)
			json.NewEncoder(w).Encode(map[string]string{"status": "not monitoring", "session": sessionID})

		default:
			http.Error(w, "Invalid action", http.StatusBadRequest)
		}
	})

	dir := "data/justshare.io-ssl-bundle"
	interCertFile := path.Join(dir, "intermediate.cert.pem")
	certFile := path.Join(dir, "domain.cert.pem")
	keyFile := path.Join(dir, "private.key.pem")

	// Add CSP middleware to allow Google Identity scripts
	h := cspMiddleware(s.LoadAndSave(http.DefaultServeMux))

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
					&cli.BoolFlag{
						Name:  "staging",
						Usage: "Run in staging mode (for safe deployment transitions)",
					},
				},
				Action: func(c *cli.Context) error {
					if c.Bool("staging") {
						fmt.Printf("Starting in staging mode on port %d\n", c.Int("port"))
					}
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
			{
				Name:  "push",
				Usage: "Push changes to git submodules and main repo",
				Action: func(c *cli.Context) error {
					repos := []string{"claudemd", "flow", "."}
					commitMessage := "update"

					for _, repo := range repos {
						if err := pushRepo(repo, commitMessage); err != nil {
							fmt.Printf("Failed to push %s: %v\n", repo, err)
						}
					}
					return nil
				},
			},
			{
				Name:  "pull",
				Usage: "Pull changes from git and update submodules, then start server",
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
					// First pull and update repositories
					if err := pullAndUpdate(); err != nil {
						return fmt.Errorf("failed to pull and update: %w", err)
					}

					// Restart the process with updated code
					return restartProcess(c.Bool("tls"), c.Int("port"))
				},
			},
			{
				Name:  "tsx-compile",
				Usage: "Compile TSX files using @flow/code esbuild logic",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:     "input",
						Aliases:  []string{"i"},
						Usage:    "Input TSX/TS file to compile",
						Required: true,
					},
					&cli.StringFlag{
						Name:    "output",
						Aliases: []string{"o"},
						Usage:   "Output file or directory",
					},
					&cli.StringFlag{
						Name:    "format",
						Aliases: []string{"f"},
						Usage:   "Output format: esm, cjs, or both",
						Value:   "esm",
					},
					&cli.BoolFlag{
						Name:  "sourcemap",
						Usage: "Generate source maps",
						Value: false,
					},
					&cli.BoolFlag{
						Name:  "minify",
						Usage: "Minify output",
						Value: false,
					},
				},
				Action: func(c *cli.Context) error {
					return compileTSXCommand(c)
				},
			},
			NewPipePortCli(),
			{
				Name:  "browser",
				Usage: "Load URL in browser and detect errors from console/network",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:     "url",
						Usage:    "URL to load in browser",
						Required: true,
					},
					&cli.IntFlag{
						Name:  "timeout",
						Usage: "Timeout in seconds for page load",
						Value: 30,
					},
					&cli.BoolFlag{
						Name:  "headless",
						Usage: "Run browser in headless mode",
						Value: true,
					},
				},
				Action: func(c *cli.Context) error {
					return runBrowserCommand(c.String("url"), c.Int("timeout"), c.Bool("headless"))
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

func compileTSXCommand(c *cli.Context) error {
	inputFile := c.String("input")
	outputPath := c.String("output")
	format := c.String("format")
	sourcemap := c.Bool("sourcemap")
	minify := c.Bool("minify")

	// Validate input file exists
	if _, err := os.Stat(inputFile); os.IsNotExist(err) {
		return fmt.Errorf("input file not found: %s", inputFile)
	}

	// Validate format
	if format != "esm" && format != "cjs" && format != "both" {
		return fmt.Errorf("invalid format: %s (must be esm, cjs, or both)", format)
	}

	// Read source file
	sourceCode, err := os.ReadFile(inputFile)
	if err != nil {
		return fmt.Errorf("failed to read input file: %v", err)
	}

	// Determine output paths
	var outputs []struct {
		format    string
		filename  string
		apiFormat api.Format
		target    api.Target
	}

	baseFilename := strings.TrimSuffix(filepath.Base(inputFile), filepath.Ext(inputFile))
	outputDir := filepath.Dir(inputFile)
	if outputPath != "" {
		if filepath.Ext(outputPath) != "" {
			// outputPath is a file
			outputDir = filepath.Dir(outputPath)
			baseFilename = strings.TrimSuffix(filepath.Base(outputPath), filepath.Ext(outputPath))
		} else {
			// outputPath is a directory
			outputDir = outputPath
		}
	}

	if format == "esm" || format == "both" {
		outputs = append(outputs, struct {
			format    string
			filename  string
			apiFormat api.Format
			target    api.Target
		}{
			format:    "esm",
			filename:  filepath.Join(outputDir, baseFilename+".esm.js"),
			apiFormat: api.FormatESModule,
			target:    api.ESNext,
		})
	}

	if format == "cjs" || format == "both" {
		outputs = append(outputs, struct {
			format    string
			filename  string
			apiFormat api.Format
			target    api.Target
		}{
			format:    "cjs",
			filename:  filepath.Join(outputDir, baseFilename+".cjs.js"),
			apiFormat: api.FormatCommonJS,
			target:    api.ES2020,
		})
	}

	// Determine file loader
	var loader api.Loader
	switch filepath.Ext(inputFile) {
	case ".js":
		loader = api.LoaderJS
	case ".jsx":
		loader = api.LoaderJSX
	case ".ts":
		loader = api.LoaderTS
	case ".tsx":
		loader = api.LoaderTSX
	default:
		loader = api.LoaderTSX // Default to TSX
	}

	// Create output directory if it doesn't exist
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %v", err)
	}

	// Compile for each format
	for _, output := range outputs {
		fmt.Printf("Compiling %s to %s format...\n", inputFile, output.format)

		buildOptions := api.BuildOptions{
			Stdin: &api.StdinOptions{
				Contents:   string(sourceCode),
				ResolveDir: filepath.Dir(inputFile),
				Sourcefile: filepath.Base(inputFile),
				Loader:     loader,
			},
			Loader: map[string]api.Loader{
				".js":  api.LoaderJS,
				".jsx": api.LoaderJSX,
				".ts":  api.LoaderTS,
				".tsx": api.LoaderTSX,
				".css": api.LoaderCSS,
			},
			Format:          output.apiFormat,
			Bundle:          true,
			Write:           false,
			TreeShaking:     api.TreeShakingTrue,
			Target:          output.target,
			JSX:             api.JSXAutomatic,
			JSXImportSource: "react",
			LogLevel:        api.LogLevelSilent,
			TsconfigRaw: `{
				"compilerOptions": {
					"jsx": "react-jsx",
					"allowSyntheticDefaultImports": true,
					"esModuleInterop": true,
					"moduleResolution": "node",
					"target": "ESNext",
					"lib": ["ESNext", "DOM", "DOM.Iterable"],
					"allowJs": true,
					"skipLibCheck": true,
					"strict": false,
					"forceConsistentCasingInFileNames": true,
					"noEmit": true,
					"incremental": true,
					"resolveJsonModule": true,
					"isolatedModules": true
				}
			}`,
		}

		// Set external dependencies for ES modules
		if output.format == "esm" {
			buildOptions.External = []string{"react", "react-dom", "react-dom/client", "supabase-kv", "react/jsx-runtime", "@connectrpc/connect", "@connectrpc/connect-web"}
		}

		// Add sourcemap option - use inline for simplicity
		if sourcemap {
			buildOptions.Sourcemap = api.SourceMapInline
		}

		// Add minify options
		if minify {
			buildOptions.MinifyWhitespace = true
			buildOptions.MinifyIdentifiers = true
			buildOptions.MinifySyntax = true
		}

		// Build
		result := api.Build(buildOptions)

		// Check for build errors
		if len(result.Errors) > 0 {
			fmt.Printf("Build failed for %s format:\n", output.format)
			for _, err := range result.Errors {
				location := "unknown"
				if err.Location != nil {
					location = fmt.Sprintf("%s:%d:%d", err.Location.File, err.Location.Line, err.Location.Column)
				}
				fmt.Printf("  %s: %s\n", location, err.Text)
			}
			return fmt.Errorf("compilation failed")
		}

		// Print warnings
		for _, warning := range result.Warnings {
			fmt.Printf("Warning: %s\n", warning.Text)
		}

		// Write output
		if len(result.OutputFiles) == 0 {
			return fmt.Errorf("no output generated for %s format", output.format)
		}

		compiledJS := result.OutputFiles[0].Contents
		if err := os.WriteFile(output.filename, compiledJS, 0644); err != nil {
			return fmt.Errorf("failed to write output file %s: %v", output.filename, err)
		}

		fmt.Printf("Successfully compiled to: %s\n", output.filename)
		if sourcemap {
			fmt.Printf("Sourcemap included inline\n")
		}
	}

	fmt.Printf("Compilation completed successfully!\n")
	return nil
}

func liveReload() error {
	c := reload.Config{
		Cmd:      []string{"go", "run", "."},
		Targets:  []string{"./breadchris", "./chat.go"},
		Patterns: []string{"**/*.go", "*.go"},
	}
	return reload.Reload(c)
}
