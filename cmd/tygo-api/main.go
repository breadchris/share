package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/breadchris/share/pkg/generator"
)

func main() {
	var (
		input           = flag.String("input", "", "Input Go package path (required)")
		output          = flag.String("output", "", "Output directory for generated files (required)")
		baseURL         = flag.String("base-url", "", "Base URL for API endpoints (default: matches package name)")
		enableWebSocket = flag.Bool("enable-websocket", false, "Generate WebSocket client and server code")
	)

	flag.Parse()

	// Validate required flags
	if *input == "" {
		fmt.Fprintf(os.Stderr, "Error: --input flag is required\n")
		flag.Usage()
		os.Exit(1)
	}

	if *output == "" {
		fmt.Fprintf(os.Stderr, "Error: --output flag is required\n")
		flag.Usage()
		os.Exit(1)
	}

	// Default base URL to package name if not specified
	if *baseURL == "" {
		packageName := filepath.Base(*input)
		*baseURL = "/" + packageName
	}

	// Ensure base URL starts with /
	if !strings.HasPrefix(*baseURL, "/") {
		*baseURL = "/" + *baseURL
	}

	// Create output directory if it doesn't exist
	if err := os.MkdirAll(*output, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "Error creating output directory: %v\n", err)
		os.Exit(1)
	}

	// Create generator config
	config := &generator.Config{
		InputPath:       *input,
		OutputPath:      *output,
		BaseURL:         *baseURL,
		EnableWebSocket: *enableWebSocket,
	}

	// Generate TypeScript API
	if err := generator.Generate(config); err != nil {
		fmt.Fprintf(os.Stderr, "Error generating API: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("✅ Successfully generated TypeScript API in %s\n", *output)
	fmt.Printf("📁 Generated files:\n")
	fmt.Printf("   - %s\n", filepath.Join(*output, "api.ts"))
	fmt.Printf("   - %s\n", filepath.Join(*output, "handlers.go"))
	
	if *enableWebSocket {
		fmt.Printf("   - %s (WebSocket support)\n", filepath.Join(*output, "websocket.go"))
		fmt.Printf("🔌 WebSocket support enabled\n")
	}
}