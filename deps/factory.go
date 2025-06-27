package deps

import (
	"github.com/breadchris/share/ai"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/db"
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/session"
	"github.com/breadchris/share/websocket"
	"github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

// DepsFactory provides methods to create dependencies
type DepsFactory struct {
	config config.AppConfig
}

// NewDepsFactory creates a new dependency factory
func NewDepsFactory(config config.AppConfig) *DepsFactory {
	return &DepsFactory{config: config}
}

// CreateSession creates a new session manager
func (f *DepsFactory) CreateSession() (*session.SessionManager, error) {
	return session.New()
}

// CreateDatabase creates a new database connection
func (f *DepsFactory) CreateDatabase() *gorm.DB {
	return db.LoadDB(f.config.DB)
}

// CreateDocumentStore creates a new document store
func (f *DepsFactory) CreateDocumentStore() *db.DocumentStore {
	return db.NewSqliteDocumentStore("data/docs.db")
}

// CreateOpenAIClient creates a new OpenAI client
func (f *DepsFactory) CreateOpenAIClient() *openai.Client {
	return openai.NewClient(f.config.OpenAIKey)
}

// CreateAIProxy creates a new AI proxy
func (f *DepsFactory) CreateAIProxy(database *gorm.DB) *ai.AI {
	return ai.New(f.config, database)
}

// CreateWebsocketRegistry creates a new websocket command registry
func (f *DepsFactory) CreateWebsocketRegistry() *websocket.CommandRegistry {
	return websocket.NewCommandRegistry()
}

// CreateLeapsManager creates a new leaps manager
func (f *DepsFactory) CreateLeapsManager() *leaps.Leaps {
	return leaps.RegisterRoutes(leaps.NewLogger())
}

// CreateSearchIndex creates a new search index
func (f *DepsFactory) CreateSearchIndex(indexPath string) (*db.SearchIndex, error) {
	return db.NewSearchIndex(indexPath)
}

// CreateDeps creates a complete Deps struct with all dependencies
func (f *DepsFactory) CreateDeps(dir, baseURL string) (Deps, error) {
	// Create all dependencies
	sessionManager, err := f.CreateSession()
	if err != nil {
		return Deps{}, err
	}

	database := f.CreateDatabase()
	docs := f.CreateDocumentStore()
	oaiClient := f.CreateOpenAIClient()
	aiProxy := f.CreateAIProxy(database)
	wsRegistry := f.CreateWebsocketRegistry()
	leapsManager := f.CreateLeapsManager()

	// Create search index
	recipeIdx, err := f.CreateSearchIndex("data/smitten.idx")
	if err != nil {
		return Deps{}, err
	}

	return Deps{
		Dir:               dir,
		DB:                database,
		Docs:              docs,
		Session:           sessionManager,
		Leaps:             leapsManager,
		AI:                oaiClient,
		AIProxy:           aiProxy,
		Config:            f.config,
		WebsocketRegistry: wsRegistry,
		BaseURL:           baseURL,
		Search: SearchIndex{
			Recipe: recipeIdx,
		},
	}, nil
}