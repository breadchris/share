package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path"
	"time"

	"github.com/breadchris/share/breadchris"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/breadchris/share/session"
	"github.com/go-git/go-git/v5"
	ghttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/google/go-github/v66/github"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
	ogithub "github.com/markbates/goth/providers/github"
	"gorm.io/gorm"
)

type Github struct {
	h *gothic.Handler
	c config.AppConfig
	s *session.SessionManager
}

var users = map[string]*User{}

// GetUsers returns the users map for external packages
func GetUsers() map[string]*User {
	return users
}

func NewGithub(d deps.Deps) *Github {
	return &Github{
		h: gothic.NewHandler(
			sessions.NewCookieStore([]byte(d.Config.SessionSecret)),
			gothic.WithProviders(
				ogithub.New(
					d.Config.Github.ClientID,
					d.Config.Github.ClientSecret,
					fmt.Sprintf("%s/github/callback", d.Config.ExternalURL),
					"repo", "user:email",
				),
			),
		),
		c: d.Config,
		s: d.Session,
	}
}

// TODO breadchris remove deps.Deps from Routes
func (s *Github) Routes(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/login", s.login)
	mux.HandleFunc("/callback", s.callback(d))
	mux.HandleFunc("/commit", func(w http.ResponseWriter, r *http.Request) {
		u, err := s.s.GetUserID(r.Context())
		if err != nil {
			http.Error(w, "failed to get user id", http.StatusInternalServerError)
			return
		}

		// Get GitHub user data from session
		gitHubUser, err := s.s.GetGitHubUser(r.Context())
		if err != nil {
			http.Error(w, "failed to get GitHub user data from session", http.StatusInternalServerError)
			return
		}

		if r.Method == http.MethodPost {
			r.ParseForm()
			repo := r.Form.Get("repo")
			if repo == "" {
				http.Error(w, "repo form field is required", http.StatusBadRequest)
				return
			}

			// Update repository in session
			if err := s.s.UpdateGitHubUserRepo(r.Context(), repo); err != nil {
				http.Error(w, "failed to update repository in session", http.StatusInternalServerError)
				return
			}

			// Also update the legacy users map for backward compatibility
			if user, exists := users[u]; exists {
				user.Repo = repo
				users[u] = user
			}

			repoDir := fmt.Sprintf("%s/%s", gitHubUser.GithubUsername, repo)
			repoURL := fmt.Sprintf("https://github.com/%s.git", repoDir)

			repoPath := path.Join("./data/repos", repoDir)

			var auth = &ghttp.BasicAuth{
				Username: gitHubUser.GithubUsername,
				Password: gitHubUser.AccessToken,
			}

			if _, err := os.Stat(repoPath); err != nil {
				if err := os.MkdirAll(repoPath, 0755); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				println("cloning repo", repoURL, "into path", repoPath)
				_, err := git.PlainClone(repoPath, false, &git.CloneOptions{
					URL:          repoURL,
					Progress:     os.Stdout,
					SingleBranch: true,
				})
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
			} else {
				println("pulling repo", repoURL, "into path", repoPath)
				re, err := git.PlainOpen(repoPath)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				wt, err := re.Worktree()
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				if err = wt.Pull(&git.PullOptions{
					RemoteName: "origin",
					Auth:       auth,
					Force:      true,
				}); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
			}

			println("generating static site")
			// TODO breadchris make this configurable
			s, err := breadchris.StaticSiteGenerator(breadchris.StaticSite{
				Domain:  "breadchris.com",
				BaseURL: "https://breadchris.com",
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			dst := path.Join(repoPath, "docs")
			c := exec.Command("rm", "-rf", dst)
			c.Stdout = os.Stdout
			c.Stderr = os.Stderr
			if err := c.Run(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			c = exec.Command("cp", "-r", s.OutputDir, dst)
			c.Stdout = os.Stdout
			c.Stderr = os.Stderr
			if err := c.Run(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			println("committing changes")
			re, err := git.PlainOpen(repoPath)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			wt, err := re.Worktree()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			_, err = wt.Add(".")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			_, err = wt.Commit("Update site", &git.CommitOptions{})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			println("pushing changes")
			err = re.Push(&git.PushOptions{
				RemoteName: "origin",
				Auth:       auth,
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			http.Redirect(w, r, "/github/commit/", http.StatusFound)
			return
		}

		if gitHubUser.Repo != "" {
			ctx := context.WithValue(r.Context(), "baseURL", "/github")
			DefaultLayout(
				Text("Repo: "+gitHubUser.Repo),
			).RenderPageCtx(ctx, w, r)
			return
		}

		client := github.NewClient(nil).WithAuthToken(gitHubUser.AccessToken)

		opt := &github.RepositoryListByAuthenticatedUserOptions{
			ListOptions: github.ListOptions{PerPage: 10},
		}

		var allRepos []*github.Repository
		for {
			repos, res, err := client.Repositories.ListByAuthenticatedUser(r.Context(), opt)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			allRepos = append(allRepos, repos...)
			if res.NextPage == 0 {
				break
			}
			opt.Page = res.NextPage
		}

		repoNames := make([]string, len(allRepos))
		for i, repo := range allRepos {
			repoNames[i] = *repo.Name
		}
		ctx := context.WithValue(r.Context(), "baseURL", "/github")
		DefaultLayout(
			RepoSelector(repoNames),
		).RenderPageCtx(ctx, w, r)
	})
	mux.HandleFunc("/logout", func(w http.ResponseWriter, r *http.Request) {
		// Clear GitHub session data
		s.s.ClearGitHubUser(r.Context())
		s.s.ClearUserID(r.Context())

		// Redirect to login page or homepage
		http.Redirect(w, r, "/github/", http.StatusFound)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "baseURL", "/github")
		Html(
			Body(
				A(Href("/login"), Text("Log in with GitHub")),
			),
		).RenderPageCtx(ctx, w, r)
	})
	return mux
}

func RepoSelector(repos []string) *Node {
	options := make([]*Node, 0, len(repos))
	for _, repo := range repos {
		options = append(options, Option(Value(repo), T(repo)))
	}
	return Div(
		H2(Text("Select Repository")),
		Form(Method("POST"), Action("/commit"),
			Div(Class("mb-4"),
				Label(For("repo"), T("Choose a Repository")),
				Select(Id("repo"), Name("repo"), Class("border rounded w-full py-2 px-3"),
					Ch(options),
				),
			),
			Div(Class("text-center"),
				Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Select Repository")),
			),
		),
	)
}

func (s *Github) login(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	q.Set("provider", "github")
	// TODO breadchris update this path to take the "next url"
	// aren't their security concerns here?
	q.Set("redirect_to", fmt.Sprintf("%s/github/callback", s.c.ExternalURL))
	r.URL.RawQuery = q.Encode()
	s.h.BeginAuthHandler(w, r)
}

func (s *Github) callback(d deps.Deps) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		q.Set("provider", "github")
		r.URL.RawQuery = q.Encode()
		u, err := s.h.CompleteUserAuth(w, r)
		if err != nil {
			slog.Error("failed to complete user auth", "error", err)
			return
		}

		// Use GitHub username as the primary identifier
		username := u.NickName
		if username == "" {
			username = u.Email
		}

		// Find or create user in database
		var user models.User
		if err := d.DB.Where("username = ?", username).First(&user).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create new user
				user = models.User{
					ID:        uuid.NewString(),
					CreatedAt: time.Now(),
					Username:  username,
				}
				if err := d.DB.Create(&user).Error; err != nil {
					http.Error(w, "Database error", http.StatusInternalServerError)
					return
				}
			} else {
				http.Error(w, "Database error", http.StatusInternalServerError)
				return
			}
		}

		// Set user ID in session
		s.s.SetUserID(r.Context(), user.ID)

		// Store GitHub user data in session for GitHub-specific functionality
		gitHubUser := &session.GitHubUserData{
			ID:             user.ID,
			Email:          u.Email,
			AccessToken:    u.AccessToken,
			GithubUsername: u.NickName,
			DisplayName:    u.Name,
			Icon:           u.AvatarURL,
			Repo:           "", // Will be set when user selects a repository
		}

		if err := s.s.SetGitHubUser(r.Context(), gitHubUser); err != nil {
			slog.Error("failed to store GitHub user in session", "error", err)
			http.Error(w, "Failed to store user data", http.StatusInternalServerError)
			return
		}

		// Also maintain the old users map for backward compatibility (if needed)
		users[user.ID] = &User{
			ID:             user.ID,
			Email:          u.Email,
			AccessToken:    u.AccessToken,
			GithubUsername: u.NickName,
			DisplayName:    u.Name,
			Icon:           u.AvatarURL,
			Repo:           "",
		}

		http.Redirect(w, r, "/coderunner/", http.StatusFound)
	}
}
