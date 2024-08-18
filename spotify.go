package main

import (
	"context"
	"fmt"
	"golang.org/x/oauth2/clientcredentials"
	"html/template"
	"log"
	"net/http"
	"sync"

	"github.com/zmb3/spotify/v2"
	auth "github.com/zmb3/spotify/v2/auth"
)

var (
	ch        = make(chan *spotify.Client)
	clients   []*spotify.Client
	songQueue []Song
	queueLock sync.Mutex
)

type Song struct {
	Name string
	URL  string
}

type Spotify struct {
	client *spotify.Client
	a      *auth.Authenticator
}

func NewSpotify(c AppConfig) *Spotify {
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
		log.Fatalf("couldn't get token: %v", err)
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

func setupSpotify(c AppConfig) *http.ServeMux {
	s := NewSpotify(c)
	http.HandleFunc("/spotify", s.homeHandler)
	http.HandleFunc("/spotify/", s.homeHandler)
	http.HandleFunc("/spotify/callback", s.completeAuth)
	http.HandleFunc("/spotify/add", s.addSongHandler)
	http.HandleFunc("/spotify/play", s.playSongsHandler)
	http.HandleFunc("/spotify/connect", s.connect)
	return nil
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
	t := template.Must(template.ParseFiles("spotify.html"))
	t.Execute(w, SpotifyState{
		SongQueue: songQueue,
		Users:     clientNames,
	})
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

	queueLock.Lock()
	defer queueLock.Unlock()

	songQueue = append(songQueue, Song{Name: songName, URL: songURL})
	http.Redirect(w, r, "/spotify", http.StatusSeeOther)
}

func (s *Spotify) playSongsHandler(w http.ResponseWriter, r *http.Request) {
	queueLock.Lock()
	defer queueLock.Unlock()

	if len(songQueue) == 0 {
		http.Error(w, "No songs in the queue", http.StatusBadRequest)
		return
	}

	res, err := s.client.Search(context.Background(), songQueue[0].Name, spotify.SearchTypeTrack)
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
	songQueue = songQueue[1:]
	http.Redirect(w, r, "/spotify", http.StatusSeeOther)
}
