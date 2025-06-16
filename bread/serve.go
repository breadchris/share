package bread

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"
)

const IndexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibes App</title>
 . <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <link rel="stylesheet" href="/dist/styles/globals.css">


</head>
<body>
  <div id="root"></div>
  <script type="module" src="/dist/App.js"></script>
</body>
</html>`

func Start() {
	// Start esbuild in watch mode
	esbuildCmd := exec.Command("node", "esbuild.config.mjs")
	esbuildCmd.Stdout = os.Stdout
	esbuildCmd.Stderr = os.Stderr
	if err := esbuildCmd.Start(); err != nil {
		log.Fatalf("Failed to start esbuild: %v", err)
	}
	log.Printf("Started esbuild (pid %d) in watch mode", esbuildCmd.Process.Pid)

	// Handle shutdown signals
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	done := make(chan struct{})

	go func() {
		sig := <-sigs
		log.Printf("Received signal: %v, shutting down...", sig)
		// Stop esbuild process
		if esbuildCmd.Process != nil {
			esbuildCmd.Process.Signal(syscall.SIGTERM)
			// Wait a moment for clean shutdown
			time.Sleep(500 * time.Millisecond)
		}
		close(done)
	}()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			w.Header().Set("Content-Type", "text/html")
			fmt.Fprint(w, IndexHTML)
			return
		}
		http.FileServer(http.Dir(".")).ServeHTTP(w, r)
	})

	server := &http.Server{Addr: ":8080"}
	go func() {
		log.Println("Serving on http://localhost:8080 ...")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	<-done
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	server.Shutdown(ctx)
	log.Println("Server and esbuild stopped.")
}
