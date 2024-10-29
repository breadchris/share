package main

import (
	"context"
	"fmt"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"log"
	"net/http"
	"sync"

	"golang.org/x/oauth2/clientcredentials"

	"github.com/zmb3/spotify/v2"
	auth "github.com/zmb3/spotify/v2/auth"
)

var (
	ch      = make(chan *spotify.Client)
	clients []*spotify.Client
)

type Song struct {
	Name string
	URL  string
}

type Spotify struct {
	client    *spotify.Client
	a         *auth.Authenticator
	queueLock sync.Mutex
	songQueue []Song
}

func NewSpotify(c config.AppConfig) *Spotify {
	config := &clientcredentials.Config{
		ClientID:     c.Spotify.ClientID,
		ClientSecret: c.Spotify.ClientSecret,
		TokenURL:     auth.TokenURL,
		Scopes: []string{
			auth.ScopeUserReadPlaybackState, auth.ScopeUserModifyPlaybackState,
		},
	}
	token, err := config.Token(context.Background())
	if err != nil {
		log.Printf("couldn't get token, spotify routes will not be mounted: %v", err)
		return nil
	}

	a := auth.New(
		auth.WithRedirectURL(fmt.Sprintf("%s/spotify/callback", c.ExternalURL)),
		auth.WithScopes(auth.ScopeUserReadPlaybackState, auth.ScopeUserModifyPlaybackState),
		auth.WithClientID(c.Spotify.ClientID),
		auth.WithClientSecret(c.Spotify.ClientSecret),
	)
	httpClient := a.Client(context.Background(), token)
	client := spotify.New(httpClient)
	return &Spotify{
		client: client,
		a:      a,
	}
}

var (
	st = "abc123"
	// These should be randomly generated for each request
	//  More information on generating these can be found here,
	// https://www.oauth.com/playground/authorization-code-with-pkce.html
	codeVerifier  = "w0HfYrKnG8AihqYHA9_XUPTIcqEXQvCQfOF2IitRgmlF43YWJ8dy2b49ZUwVUOR.YnvzVoTBL57BwIhM4ouSa~tdf0eE_OmiMC_ESCcVOe7maSLIk9IOdBhRstAxjCl7"
	codeChallenge = "ZhZJzPQXYBMjH8FlGAdYK5AndohLzFfZT-8J7biT7ig"
)

func setupSpotify(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	s := NewSpotify(d.Config)
	if s != nil {
		m.HandleFunc("/", s.homeHandler)
		m.HandleFunc("/callback", s.completeAuth)
		m.HandleFunc("/add", s.addSongHandler)
		m.HandleFunc("/play", s.playSongsHandler)
		m.HandleFunc("/connect", s.connect)
	}
	return m
}

type SpotifyState struct {
	SongQueue []Song
	Users     []string
}

func (s *Spotify) homeHandler(w http.ResponseWriter, r *http.Request) {
	var clientNames []string
	for _, client := range clients {
		u, err := client.CurrentUser(context.Background())
		if err != nil {
			log.Printf("Error getting current user: %v", err)
			continue
		}
		clientNames = append(clientNames, u.DisplayName)
	}
	RenderSpotifyQueue(clientNames, s.songQueue).RenderPage(w, r)
}

func RenderSpotifyQueue(users []string, songQueue []Song) *Node {
	var u []*Node
	for _, user := range users {
		u = append(u, Li(Class("text-lg"), T(user)))
	}
	var sq []*Node
	for _, song := range songQueue {
		sq = append(sq, Li(Class("text-lg"),
			T(fmt.Sprintf("%s - ", song.Name)),
			A(Href(song.URL), Class("text-blue-500 hover:underline"), T("Play on Spotify")),
		))
	}
	return Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Attr("name", "viewport"), Attr("content", "width=device-width, initial-scale=1.0")),
			Title(T("Spotify Queue")),
			Link(Href("https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"), Rel("stylesheet")),
		),
		Body(Class("bg-gray-100 text-gray-900"),
			Div(Class("container mx-auto p-8"),
				Div(Class("max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6"),
					H1(Class("text-3xl font-bold text-center mb-8"), T("Spotify Queue")),

					// Friends list
					Div(Class("mb-6"),
						H2(Class("text-2xl font-semibold mb-4"), T("frands")),
						Ul(Class("list-disc list-inside space-y-2"),
							If(len(users) > 0, Ch(u), Li(Class("text-lg text-gray-500"), T("no frands yet"))),
						),
						Div(Class("text-center"),
							H2(Class("text-2xl font-semibold mb-4"), T("Connect Your Spotify Account")),
							A(Href("/spotify/connect"),
								Class("inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"),
								T("Connect to Spotify")),
						),
					),

					// Songs list
					Div(Class("mb-6"),
						H2(Class("text-2xl font-semibold mb-4"), T("songs")),
						Ul(Class("list-disc list-inside space-y-2"),
							If(len(songQueue) > 0, Ch(sq), Li(Class("text-lg text-gray-500"), T("No songs queued"))),
						),
					),

					// Add a song form
					Div(Class("mb-6"),
						H2(Class("text-2xl font-semibold mb-4"), T("Add a Song")),
						Form(Action("/spotify/add"), Method("POST"), Class("space-y-4"),
							Div(
								Label(For("song"), Class("block text-sm font-medium text-gray-700"), T("Song Name:")),
								Input(Type("text"), Id("song"), Name("song"), Class("mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500")),
							),
							Div(
								Label(For("url"), Class("block text-sm font-medium text-gray-700"), T("Spotify URL:")),
								Input(Type("text"), Id("url"), Name("url"), Class("mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500")),
							),
							Button(Type("submit"), Class("w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"), T("Add to Queue")),
						),
					),

					// Play next song button
					Div(Class("mb-6"),
						Form(Action("/spotify/play"), Method("POST"),
							Button(Type("submit"), Class("w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"), T("Play Next Song")),
						),
					),
				),
			),
		),
	)
}

func (s *Spotify) connect(w http.ResponseWriter, r *http.Request) {
	url := s.a.AuthURL(st)
	http.Redirect(w, r, url, http.StatusSeeOther)
}

func (s *Spotify) completeAuth(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("%+v", r)
	tok, err := s.a.Token(r.Context(), st, r)
	if err != nil {
		http.Error(w, fmt.Sprintf("Couldn't get token: %v", err), http.StatusForbidden)
		return
	}

	if sta := r.FormValue("state"); sta != st {
		http.Error(w, "State mismatch", http.StatusForbidden)
		return
	}

	client := spotify.New(s.a.Client(r.Context(), tok))
	clients = append(clients, client)
	http.Redirect(w, r, "/spotify", http.StatusSeeOther)
}

func (s *Spotify) addSongHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	r.ParseForm()
	songName := r.FormValue("song")
	songURL := r.FormValue("url")

	s.queueLock.Lock()
	defer s.queueLock.Unlock()

	s.songQueue = append(s.songQueue, Song{Name: songName, URL: songURL})
	http.Redirect(w, r, "/spotify/", http.StatusSeeOther)
}

func (s *Spotify) playSongsHandler(w http.ResponseWriter, r *http.Request) {
	s.queueLock.Lock()
	defer s.queueLock.Unlock()

	if len(s.songQueue) == 0 {
		http.Error(w, "No songs in the queue", http.StatusBadRequest)
		return
	}

	res, err := s.client.Search(context.Background(), s.songQueue[0].Name, spotify.SearchTypeTrack)
	if err != nil {
		log.Printf("Error searching for track: %v", err)
		http.Error(w, "Error searching for track", http.StatusInternalServerError)
		return
	}

	if res.Tracks == nil || res.Tracks.Tracks == nil || len(res.Tracks.Tracks) == 0 {
		http.Error(w, "No tracks found", http.StatusBadRequest)
		return
	}

	u := res.Tracks.Tracks[0].URI

	for _, client := range clients {
		err := client.PlayOpt(context.Background(), &spotify.PlayOptions{
			URIs: []spotify.URI{u},
		})
		if err != nil {
			log.Printf("Error playing track on a client's account: %v", err)
		}
	}

	// Remove the song from the queue after playing
	s.songQueue = s.songQueue[1:]
	http.Redirect(w, r, "/spotify", http.StatusSeeOther)
}
