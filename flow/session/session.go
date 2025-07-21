package session

import (
	"context"
	"encoding/json"
	"time"

	"github.com/breadchris/share/scs"
	"github.com/pkg/errors"
)

const (
	UserIDCtxKey      = "user"
	GitHubTokenCtxKey = "github_token"
	GitHubUserCtxKey  = "github_user"
	GitHubRepoCtxKey  = "github_repo"
)

var (
	UserLoginError = errors.New("user not logged in")
)

// GitHubUserData represents GitHub user information stored in session
type GitHubUserData struct {
	ID             string `json:"id"`
	Email          string `json:"email"`
	AccessToken    string `json:"access_token"`
	GithubUsername string `json:"github_username"`
	DisplayName    string `json:"display_name"`
	Icon           string `json:"icon"`
	Repo           string `json:"repo"`
}

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

// GitHub-specific session methods

func (s *SessionManager) SetGitHubUser(ctx context.Context, userData *GitHubUserData) error {
	data, err := json.Marshal(userData)
	if err != nil {
		return errors.Wrap(err, "failed to marshal GitHub user data")
	}
	s.Put(ctx, GitHubUserCtxKey, string(data))
	return nil
}

func (s *SessionManager) GetGitHubUser(ctx context.Context) (*GitHubUserData, error) {
	data := s.GetString(ctx, GitHubUserCtxKey)
	if data == "" {
		return nil, errors.New("GitHub user data not found in session")
	}

	var userData GitHubUserData
	if err := json.Unmarshal([]byte(data), &userData); err != nil {
		return nil, errors.Wrap(err, "failed to unmarshal GitHub user data")
	}

	return &userData, nil
}

func (s *SessionManager) ClearGitHubUser(ctx context.Context) {
	s.Remove(ctx, GitHubUserCtxKey)
	s.Remove(ctx, GitHubTokenCtxKey)
	s.Remove(ctx, GitHubRepoCtxKey)
}

func (s *SessionManager) SetGitHubAccessToken(ctx context.Context, token string) {
	s.Put(ctx, GitHubTokenCtxKey, token)
}

func (s *SessionManager) GetGitHubAccessToken(ctx context.Context) (string, error) {
	token := s.GetString(ctx, GitHubTokenCtxKey)
	if token == "" {
		return "", errors.New("GitHub access token not found in session")
	}
	return token, nil
}

func (s *SessionManager) SetSelectedRepository(ctx context.Context, repo string) {
	s.Put(ctx, GitHubRepoCtxKey, repo)
}

func (s *SessionManager) GetSelectedRepository(ctx context.Context) string {
	return s.GetString(ctx, GitHubRepoCtxKey)
}

func (s *SessionManager) UpdateGitHubUserRepo(ctx context.Context, repo string) error {
	userData, err := s.GetGitHubUser(ctx)
	if err != nil {
		return err
	}

	userData.Repo = repo
	return s.SetGitHubUser(ctx, userData)
}
