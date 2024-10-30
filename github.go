package main

import (
	"context"
	"fmt"
	. "github.com/breadchris/share/html"
	"github.com/google/go-github/v55/github"
	"golang.org/x/oauth2"
	ogithub "golang.org/x/oauth2/github"
	"net/http"
)

var (
	clientID     = "YOUR_CLIENT_ID"     // Replace with your GitHub client ID
	clientSecret = "YOUR_CLIENT_SECRET" // Replace with your GitHub client secret
	redirectURL  = "http://localhost:8080/callback"
	oauthConf    = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes:       []string{"repo"},
		Endpoint:     ogithub.Endpoint,
	}
	oauthStateString = "random"
)

func NewGithub() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", home)
	mux.HandleFunc("/login", login)
	mux.HandleFunc("/callback", callback)
	mux.HandleFunc("/commit", commit)
	return mux
}

func home(w http.ResponseWriter, r *http.Request) {
	ctx := context.WithValue(r.Context(), "baseURL", "/github")
	Html(
		Body(
			A(Href("/login"), Text("Log in with GitHub")),
		),
	).RenderPageCtx(ctx, w, r)
}

func login(w http.ResponseWriter, r *http.Request) {
	url := oauthConf.AuthCodeURL(oauthStateString, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func callback(w http.ResponseWriter, r *http.Request) {
	state := r.FormValue("state")
	if state != oauthStateString {
		http.Error(w, "Invalid OAuth state", http.StatusBadRequest)
		return
	}

	code := r.FormValue("code")
	token, err := oauthConf.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token", http.StatusBadRequest)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:  "github_token",
		Value: token.AccessToken,
		Path:  "/",
	})
	fmt.Fprint(w, "OAuth successful! Now you can <a href=\"/commit\">make a commit</a>.")
}

func commit(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("github_token")
	if err != nil {
		http.Error(w, "You need to log in first.", http.StatusUnauthorized)
		return
	}
	token := cookie.Value

	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	tc := oauth2.NewClient(context.Background(), ts)
	client := github.NewClient(tc)

	repos, _, err := client.Repositories.List(context.Background(), "", nil)
	if err != nil {
		http.Error(w, "Failed to retrieve repositories", http.StatusInternalServerError)
		return
	}

	repoNames := make([]string, len(repos))
	for i, repo := range repos {
		repoNames[i] = *repo.Name
	}

	RepoSelector(repoNames).RenderPage(w, r)
}

func RepoSelector(repos []string) *Node {
	options := make([]*Node, 0, len(repos))
	for _, repo := range repos {
		options = append(options, Option(Value(repo), T(repo)))
	}

	return Div(
		H2(Text("Select Repository")),
		Form(Method("POST"), Action("/set-repo"),
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
