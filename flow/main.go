package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/breadchris/flow/claude"
	"github.com/breadchris/flow/code"
	"github.com/breadchris/flow/config"
	"github.com/breadchris/flow/deps"
	"github.com/breadchris/flow/slackbot"
	"github.com/breadchris/flow/worklet"
	"github.com/gorilla/mux"
)

func main() {
	cfg := config.LoadConfig()
	dependencies := deps.NewDepsFactory(cfg).CreateDeps()

	router := mux.NewRouter()

	// Mount worklet API at /api/worklet
	workletHandler := worklet.NewWorkletHandler(&dependencies)
	workletRouter := router.PathPrefix("/api/worklet").Subrouter()
	workletHandler.RegisterRoutes(workletRouter)

	// Mount code package at /code
	codeHandler := code.New(dependencies)
	router.PathPrefix("/code").Handler(http.StripPrefix("/code", codeHandler))

	// Create HTTP server
	net := ":8082"
	server := &http.Server{
		Addr:    net,
		Handler: router,
	}

	// Create and start slack bot
	bot, err := slackbot.New(dependencies)
	if err != nil {
		log.Fatalf("Failed to create slack bot: %v", err)
	}

	// Setup graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown signals
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigCh
		slog.Info("Received shutdown signal")
		cancel()

		// Shutdown HTTP server
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			slog.Error("Failed to shutdown HTTP server", "error", err)
		}

		// Stop slack bot
		bot.Stop()
	}()

	// Start HTTP server in background
	go func() {
		slog.Info("Starting HTTP server on " + net)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start HTTP server: %v", err)
		}
	}()

	// Start the slack bot
	slog.Info("Starting Slack bot...")
	if err := bot.Start(ctx); err != nil {
		log.Fatalf("Failed to start slack bot: %v", err)
	}
}
