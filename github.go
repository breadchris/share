package main

import (
	"context"
	"fmt"
	"github.com/breadchris/share/breadchris"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/session"
	"github.com/go-git/go-git/v5"
	ghttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/google/go-github/v66/github"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
	ogithub "github.com/markbates/goth/providers/github"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path"
)

type Github struct {
	h *gothic.Handler
	c config.AppConfig
	s *session.SessionManager
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
	mux.HandleFunc("/callback", s.callback)
	mux.HandleFunc("/commit", func(w http.ResponseWriter, r *http.Request) {
		u, err := s.s.GetUserID(r.Context())
		if err != nil {
			http.Error(w, "failed to get user id", http.StatusInternalServerError)
			return
		}

		user, ok := users[u]
		if !ok {
			http.Error(w, "failed to get user", http.StatusInternalServerError)
			return
		}

		if r.Method == http.MethodPost {
			r.ParseForm()
			repo := r.Form.Get("repo")
			if repo == "" {
				http.Error(w, "repo form field is required", http.StatusBadRequest)
				return
			}

			println("cloning repo", repo)
			repoURL := fmt.Sprintf("https://github.com/%s/%s.git", user.GithubUsername, repo)
			clRepo, err := CloneRepo(repoURL)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			println("generating static site")
			s, err := breadchris.StaticSiteGenerator()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			dst := path.Join(clRepo, "docs")
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
			re, err := git.PlainOpen(clRepo)
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

			var auth = &ghttp.BasicAuth{
				Username: user.GithubUsername,
				Password: user.AccessToken,
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

			http.Redirect(w, r, "/github/commit", http.StatusFound)
			return
		}

		client := github.NewClient(nil).WithAuthToken(user.AccessToken)

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

func (s *Github) callback(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	q.Set("provider", "github")
	r.URL.RawQuery = q.Encode()
	u, err := s.h.CompleteUserAuth(w, r)
	if err != nil {
		slog.Error("failed to complete user auth", "error", err)
		return
	}

	var id string
	for _, user := range users {
		if user.Email == u.Email {
			id = user.ID
			break
		}
	}

	fmt.Printf("%+v\n", u)
	fmt.Printf("%+v\n", u.RawData)

	if id == "" {
		id = uuid.NewString()
		users[id] = &User{
			ID:             id,
			Email:          u.Email,
			AccessToken:    u.AccessToken,
			GithubUsername: u.NickName,
		}
		saveJSON(authFile, users)
	} else {
		users[id].AccessToken = u.AccessToken
		users[id].GithubUsername = u.NickName
	}
	s.s.SetUserID(r.Context(), id)

	http.Redirect(w, r, "/github/commit", http.StatusFound)
}
