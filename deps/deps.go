package deps

import (
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/html"
	"github.com/breadchris/share/llm"
	"github.com/breadchris/share/session"
)

type Deps struct {
	DB      *html.DBAny
	Session *session.SessionManager
	Leaps   *leaps.Leaps
	AI      *llm.OpenAIService
}
