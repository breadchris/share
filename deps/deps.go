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

type Deps struct {
	Dir               string
	DB                *gorm.DB
	Docs              *db.DocumentStore
	Session           *session.SessionManager
	Leaps             *leaps.Leaps
	AI                *openai.Client
	AIProxy           *ai.AI
	Config            config.AppConfig
	WebsocketRegistry *websocket.CommandRegistry
	BaseURL           string
	Search            SearchIndex
}

type SearchIndex struct {
	Recipe *db.SearchIndex
}
