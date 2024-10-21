package deps

import (
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/db"
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/llm"
	"github.com/breadchris/share/session"
)

type Deps struct {
	DB      *db.DBAny
	Session *session.SessionManager
	Leaps   *leaps.Leaps
	AI      *llm.OpenAIService
	Config  config.AppConfig
}
