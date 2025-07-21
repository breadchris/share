package db

import (
	"github.com/breadchris/flow/config"
	"testing"
)

func TestMigrate(t *testing.T) {
	cfg := config.LoadConfig()
	_ = NewClaudeDB(cfg.SupabaseURL)
}
