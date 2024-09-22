package playground

import (
	"context"
	"errors"
	"fmt"
	"github.com/breadchris/share/editor/config"
	"net/http"
	"path/filepath"
	"sync"
	"time"

	"github.com/breadchris/share/editor/analyzer"
	"github.com/breadchris/share/editor/builder"
	"github.com/breadchris/share/editor/builder/storage"
	"github.com/breadchris/share/editor/goplay"
	"github.com/breadchris/share/editor/server"
	"github.com/breadchris/share/editor/util/cmdutil"
	"github.com/breadchris/share/editor/util/osutil"
	"github.com/gorilla/mux"
	"github.com/x1unix/foundation/app"
	"go.uber.org/zap"
)

// Version is server version symbol. Should be replaced by linker during build
var Version = "testing"

func StartEditor(cfg *config.Config) {
	logger, err := cfg.Log.ZapLogger()
	if err != nil {
		cmdutil.FatalOnError(err)
	}
	zap.ReplaceGlobals(logger)
	analyzer.SetLogger(logger)
	defer logger.Sync() //nolint:errcheck

	if err := cfg.Validate(); err != nil {
		logger.Fatal("invalid server configuration", zap.Error(err))
	}

	goRoot, err := builder.GOROOT()
	if err != nil {
		logger.Fatal("Failed to find GOROOT environment variable value", zap.Error(err))
	}

	if err := start(goRoot, logger, cfg); err != nil {
		logger.Fatal("Failed to start application", zap.Error(err))
	}
}

func start(goRoot string, logger *zap.Logger, cfg *config.Config) error {
	logger.Info("Starting service",
		zap.String("version", Version), zap.Any("config", cfg))

	analyzer.SetRoot(goRoot)
	packages, err := analyzer.ReadPackagesFile(cfg.Build.PackagesFile)
	if err != nil {
		return fmt.Errorf("failed to read packages file %q: %s", cfg.Build.PackagesFile, err)
	}

	store, err := storage.NewLocalStorage(logger, cfg.Build.BuildDir)
	if err != nil {
		return err
	}

	ctx, _ := app.GetApplicationContext()
	wg := &sync.WaitGroup{}

	// Initialize services
	playgroundClient := goplay.NewClient(cfg.Playground.PlaygroundURL, goplay.DefaultUserAgent,
		cfg.Playground.ConnectTimeout)
	buildCfg := builder.BuildEnvironmentConfig{
		KeepGoModCache:               cfg.Build.SkipModuleCleanup,
		IncludedEnvironmentVariables: osutil.SelectEnvironmentVariables(cfg.Build.BypassEnvVarsList...),
	}
	logger.Debug("Loaded list of environment variables used by compiler",
		zap.Any("vars", buildCfg.IncludedEnvironmentVariables))
	buildSvc := builder.NewBuildService(zap.L(), buildCfg, store)

	// Start cleanup service
	if !cfg.Build.SkipModuleCleanup {
		cleanupSvc := builder.NewCleanupDispatchService(zap.L(), cfg.Build.CleanupInterval, buildSvc, store)
		go cleanupSvc.Start(ctx)
	}

	// Initialize API endpoints
	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api").Subrouter()
	svcCfg := server.ServiceConfig{Version: Version}
	server.NewAPIv1Handler(svcCfg, playgroundClient, packages, buildSvc).
		Mount(apiRouter)

	apiv2Router := apiRouter.PathPrefix("/v2").Subrouter()
	server.NewAPIv2Handler(server.APIv2HandlerConfig{
		Client:       playgroundClient,
		Builder:      buildSvc,
		BuildTimeout: cfg.Build.GoBuildTimeout,
	}).Mount(apiv2Router)
	//server.NewAPIv2Handler(playgroundClient, buildSvc).Mount(apiv2Router)

	assetsDir := cfg.HTTP.AssetsDir
	indexHandler := server.NewTemplateFileServer(zap.L(), filepath.Join(assetsDir, server.IndexFileName))
	spaHandler := server.NewSpaFileServer(assetsDir)
	r.Path("/").
		Handler(indexHandler)
	r.Path("/snippet/{snippetID:[A-Za-z0-9_-]+}").
		Handler(indexHandler)
	r.PathPrefix("/").
		Handler(spaHandler)

	srv := &http.Server{
		Addr:         cfg.HTTP.Addr,
		Handler:      r,
		ReadTimeout:  cfg.HTTP.ReadTimeout,
		WriteTimeout: cfg.HTTP.WriteTimeout,
		IdleTimeout:  cfg.HTTP.IdleTimeout,
	}

	if err := startHttpServer(ctx, wg, srv); err != nil {
		return err
	}

	wg.Wait()
	return nil
}

func startHttpServer(ctx context.Context, wg *sync.WaitGroup, server *http.Server) error {
	logger := zap.S()
	go func() {
		<-ctx.Done()
		logger.Info("Shutting down server...")
		shutdownCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		defer wg.Done()
		server.SetKeepAlivesEnabled(false)
		if err := server.Shutdown(shutdownCtx); err != nil {
			if errors.Is(err, context.Canceled) {
				return
			}

			logger.Errorf("Could not gracefully shutdown the server: %v\n", err)
		}
	}()

	wg.Add(1)
	logger.Infof("Listening on %q", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("cannot start server on %q: %s", server.Addr, err)
	}

	return nil
}
