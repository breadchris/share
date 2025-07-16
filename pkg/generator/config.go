package generator

// Config holds configuration for TypeScript API generation
type Config struct {
	InputPath       string // Go package path to analyze
	OutputPath      string // Directory to write generated TypeScript
	BaseURL         string // Base URL for API endpoints (e.g., "/user")
	EnableWebSocket bool   // Whether to generate WebSocket code
}

// FunctionInfo represents a Go function's signature information
type FunctionInfo struct {
	Name         string
	RequestType  string
	ResponseType string
	Endpoint     string
	FilePath     string // Source file path
	LineNumber   int    // Line number in source file
}