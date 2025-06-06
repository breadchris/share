package session

import (
	"context"
	"github.com/breadchris/share/scs"
	"github.com/pkg/errors"
	"time"
)

const (
	UserIDCtxKey = "user"
)

var (
	UserLoginError = errors.New("user not logged in")
)

type SessionManager struct {
	*scs.SessionManager
}

func New() (*SessionManager, error) {
	s := scs.New()

	// TODO breadchris make this configurable
	s.Lifetime = time.Hour * 24 * 7 * 4

	var err error
	if s.Store, err = NewFileStore("data/sessions"); err != nil {
		return nil, err
	}
	return &SessionManager{
		SessionManager: s,
	}, nil
}

func (s *SessionManager) GetValue(ctx context.Context, key string) (string, error) {
	val := s.GetString(ctx, key)
	if val == "" {
		return "", errors.New("value not found")
	}
	return val, nil
}

func (s *SessionManager) SetValue(ctx context.Context, key, value string) {
	s.Put(ctx, key, value)
}

func (s *SessionManager) ClearValue(ctx context.Context, key string) {
	s.Remove(ctx, key)
}

func (s *SessionManager) GetUserID(ctx context.Context) (string, error) {
	userID := s.GetString(ctx, UserIDCtxKey)
	if userID == "" {
		return "", UserLoginError
	}
	return userID, nil
}

func (s *SessionManager) SetUserID(ctx context.Context, id string) {
	s.Put(ctx, UserIDCtxKey, id)
}

func (s *SessionManager) ClearUserID(ctx context.Context) {
	s.Remove(ctx, UserIDCtxKey)
}
