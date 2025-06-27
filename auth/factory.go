package auth

import (
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/session"
	"gorm.io/gorm"
)

// Factory provides methods to create auth-related dependencies
type Factory struct {
	config config.AppConfig
}

// NewFactory creates a new auth factory
func NewFactory(config config.AppConfig) *Factory {
	return &Factory{config: config}
}

// CreateSMTPEmail creates a new SMTP email service
func (f *Factory) CreateSMTPEmail() *SMTPEmail {
	return NewSMTPEmail(&f.config)
}

// CreateAuth creates a new auth service
func (f *Factory) CreateAuth(session *session.SessionManager, email *SMTPEmail, db *gorm.DB) *Auth {
	return NewAuth(session, email, f.config, db)
}