package deps

import (
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/db"
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/session"
	"github.com/sashabaranov/go-openai"
)

type Deps struct {
	DB      *db.DBAny
	Session *session.SessionManager
	Leaps   *leaps.Leaps
	AI      *openai.Client
	Config  config.AppConfig
}
