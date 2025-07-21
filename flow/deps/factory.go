package deps

import (
	"github.com/breadchris/flow/config"
	"github.com/breadchris/flow/db"
	"github.com/breadchris/flow/session"
	"github.com/sashabaranov/go-openai"
)

// DepsFactory provides methods to create dependencies
type DepsFactory struct {
	config config.AppConfig
}

// NewDepsFactory creates a new dependency factory
func NewDepsFactory(config config.AppConfig) *DepsFactory {
	return &DepsFactory{
		config: config,
	}
}

// CreateDeps creates a new Deps instance with the provided database
func (f *DepsFactory) CreateDeps() Deps {
	// Setup database
	database := db.NewClaudeDB(f.config.DSN)

	// Create session manager
	sessionManager, err := session.New()
	if err != nil {
		// For now, we'll log the error and continue with a nil session
		// This allows the app to start even if session store initialization fails
		sessionManager = nil
	}

	// Create OpenAI client
	var aiClient *openai.Client
	if f.config.OpenAIKey != "" {
		aiClient = openai.NewClient(f.config.OpenAIKey)
	}

	return Deps{
		Dir:     f.config.ShareDir,
		DB:      database,
		Config:  f.config,
		Session: sessionManager,
		AI:      aiClient,
	}
}
