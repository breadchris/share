package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	. "github.com/breadchris/share/html2"
	"github.com/breadchris/share/session"
	"github.com/fsnotify/fsnotify"
	"github.com/google/uuid"
	"github.com/samber/lo"
	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"testing/fstest"
)

type Invite struct {
	From string
	To   string
}

var (
	users   = map[string]*User{}
	invites []Invite

	// secret -> user id
	inviteLookup = map[string]string{}
	authFile     = "data/auth.json"
	invitesFile  = "data/invites.json"
)

func init() {
	i := uuid.NewString()
	inviteLookup[i] = i
	println("Invite code:", i)

	// TODO build state object for auth
	loadJSON(authFile, &users)
	loadJSON(invitesFile, &invites)
}

type Auth struct {
	s *session.SessionManager
	e *SMTPEmail
	c AppConfig
}

func NewAuth(s *session.SessionManager, e *SMTPEmail, c AppConfig) *Auth {
	return &Auth{
		s: s,
		e: e,
		c: c,
	}
}

func (s *Auth) handleInvite(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		id, err := s.s.GetUserID(r.Context())
		if err != nil {
			http.Error(w, "Not logged in", http.StatusUnauthorized)
			return
		}
		invite := uuid.NewString()
		inviteLookup[invite] = id
		fmt.Fprintf(w, "<a href=\"/register?invite=%s\">send me!</a>", invite)
	}
}

func (s *Auth) handleLogin(w http.ResponseWriter, r *http.Request) {
	type state struct {
		Msg string
	}
	sta := state{}

	t := template.Must(template.ParseFiles("login.html"))
	switch r.Method {
	case http.MethodGet:
		sec := r.URL.Query().Get("sec")
		if sec == "" {
			t.Execute(w, nil)
			return
		}
		for _, user := range users {
			for _, secret := range user.Secrets {
				if sec == secret {
					s.s.SetUserID(r.Context(), user.ID)
					http.Redirect(w, r, "/", http.StatusFound)
					return
				}
			}
		}
		http.Error(w, "invalid secret", http.StatusBadRequest)
	case http.MethodPost:
		err := r.ParseMultipartForm(10 << 20) // 10 MB
		if err != nil {
			http.Error(w, "Error parsing form data", http.StatusBadRequest)
			return
		}
		f := r.FormValue("email")
		if f != "" {
			for _, user := range users {
				if user.Email == f {
					msg := fmt.Sprintf(
						"Click <a href=\"%s/login?sec=%s\">here</a> to login.", s.c.ExternalURL, user.Secrets[0])
					e := s.e.SendRecoveryEmail(user.Email, "Recover your account", msg, user.Secrets[0])
					if e != nil {
						fmt.Printf("Error sending email: %v\n", e)
						sta.Msg = "Error sending email"
						t.Execute(w, sta)
						return
					}
					sta.Msg = "check your email"
					t.Execute(w, sta)
					return
				}
			}
			sta.Msg = "no user with that email"
			t.Execute(w, sta)
			return
		}

		sec := r.FormValue("id")

		for _, user := range users {
			for _, secret := range user.Secrets {
				if sec == secret {
					s.s.SetUserID(r.Context(), user.ID)
					http.Redirect(w, r, "/", http.StatusFound)
					return
				}
			}
		}
		http.Error(w, "Invalid secret", http.StatusBadRequest)
		return
	}
}

func (s *Auth) accountHandler(w http.ResponseWriter, r *http.Request) {
	id, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
	}
	user, ok := users[id]
	if !ok {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	var inv []string
	for k, v := range inviteLookup {
		if v == id {
			inv = append(inv, k)
		}
	}
	Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
			Title(T("Authentication")),
			Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
			Link(Rel("stylesheet"), Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.css")),
			Script(Src("https://cdn.tailwindcss.com")),
		),
		Body(Class("bg-gray-100 flex items-center justify-center min-h-screen"),
			Div(Class("bg-white p-8 rounded shadow-md w-full max-w-md"),
				H1(Class("text-2xl font-bold mb-4"), T("Home")),
				P(T("Hello "+user.Email)),
				Hr(Class("my-5")),
				Text("User Invites"),
				Ch(
					lo.Map(
						lo.Filter(invites, func(i Invite, idx int) bool {
							return i.From == id
						}),
						func(i Invite, idx int) *Node {
							if us, ok := users[i.To]; ok {
								return Div(Class("border p-4 rounded-lg bg-gray-50"),
									Text(us.Email),
								)
							}
							return nil
						},
					),
				),
				Hr(Class("my-5")),
				P(Class("text-lg"), T("Invites")),
				Form(
					HxPost("/invite"),
					HxTarget("#result"),
					Button(Class("btn"), Type("submit"), T("Invite")),
				),
				Div(Id("result")),
				Ch(
					lo.Map(inv, func(i string, idx int) *Node {
						return Div(Class("border p-4 rounded-lg bg-gray-50"),
							A(Href("/register?invite="+i), T("/register?invite="+i)),
						)
					}),
				),
			),
		),
	).RenderPage(w, r)
}

func (s *Auth) handleRegister(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		i := r.URL.Query().Get("invite")
		t := template.Must(template.ParseFiles("register.html"))
		t.Execute(w, struct {
			Invite string
		}{
			Invite: i,
		})
	case http.MethodPost:
		email := r.FormValue("email")
		invite := r.FormValue("invite")
		id := uuid.NewString()

		if invite == "" {
			http.Error(w, "Invite required", http.StatusBadRequest)
			return
		}

		inviteFrom, ok := inviteLookup[invite]
		if ok {
			delete(inviteLookup, invite)
		} else {
			http.Error(w, "Invalid invite", http.StatusBadRequest)
			return
		}
		invites = append(invites, Invite{
			From: inviteFrom,
			To:   id,
		})
		saveJSON(invitesFile, invites)

		// find user by email
		for _, user := range users {
			if user.Email == email {
				http.Error(w, "User already exists", http.StatusBadRequest)
				return
			}
		}

		sec := uuid.NewString()
		users[id] = &User{
			ID:    id,
			Email: email,
			Secrets: []string{
				sec,
			},
		}
		saveJSON(authFile, users)
		s.s.SetUserID(r.Context(), id)
		fmt.Fprintf(w, "<img src=\"/qr?data=%s\"/><hr /><a href=\"/\">go home</a>", sec)
	}
}

func (s *Auth) handleAuth(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		http.ServeFile(w, r, "auth.html")
	case http.MethodPut:
		privateKey, _, err := generateKeyPair()
		if err != nil {
			fmt.Printf("Error generating key pair: %v\n", err)
			return
		}

		privKeyBytes, err := x509.MarshalECPrivateKey(privateKey)
		if err != nil {
			fmt.Printf("Error marshaling public key: %v\n", err)
			return
		}

		pk := base64.StdEncoding.EncodeToString(privKeyBytes)
		fmt.Fprintf(w, "<img src=\"/qr?data=%s\"/>", pk)
	}
}

func generateKeyPair() (*ecdsa.PrivateKey, *ecdsa.PublicKey, error) {
	// Generate a new private key using the P-256 curve
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate private key: %v", err)
	}

	// Extract the public key from the private key
	publicKey := &privateKey.PublicKey

	return privateKey, publicKey, nil
}

func WatchFilesAndFolders(paths []string, callback func(string)) error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("failed to create watcher: %w", err)
	}
	defer watcher.Close()

	// Add the paths to the watcher
	for _, path := range paths {
		absPath, err := filepath.Abs(path)
		if err != nil {
			return fmt.Errorf("failed to get absolute path for %s: %w", path, err)
		}

		err = watcher.Add(absPath)
		if err != nil {
			return fmt.Errorf("failed to add %s to watcher: %w", absPath, err)
		}
	}

	done := make(chan bool)

	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				absPath, err := filepath.Abs(event.Name)
				if err != nil {
					log.Printf("failed to get absolute path for %s: %v", event.Name, err)
					continue
				}
				callback(absPath)

			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Printf("error: %v", err)
			}
		}
	}()

	<-done
	return nil
}

var (
	renderedLookup = map[string]*interp.Interpreter{}
)

func watchPaths() {
	paths := []string{"./html/html.go"}
	callback := func(path string) {
		fmt.Printf("Change detected: %s\n", path)
		i := interp.New(interp.Options{
			GoPath: "./html",
			//Env:    os.Environ(),
		})

		i.Use(stdlib.Symbols)

		d, err := os.ReadFile("html/html.go")
		if err != nil {
			println("Error reading file", err)
			return
		}
		_, err = i.Eval(string(d))

		d, err = os.ReadFile(path)
		if err != nil {
			println("Error reading file", err)
			return
		}

		_, err = i.Eval(string(d))
		if err != nil {
			println("Error evaluating code", err.Error())
			return
		}
		renderedLookup["html.go"] = i
	}

	if err := WatchFilesAndFolders(paths, callback); err != nil {
		log.Fatalf("error watching files and folders: %v", err)
	}
}

func runCode(file string) (*interp.Interpreter, error) {
	d, err := os.ReadFile("html/html.go")
	if err != nil {
		return nil, fmt.Errorf("Error reading file: %w", err)
	}

	i := interp.New(interp.Options{
		GoPath: filepath.FromSlash("./"),
		SourcecodeFilesystem: fstest.MapFS{
			"src/main/vendor/github.com/breadchris/share/html/html.go": &fstest.MapFile{
				Data: d,
			},
		},
	})

	i.Use(stdlib.Symbols)

	//_, err = i.Eval(string(d))
	//if err != nil {
	//	return nil, fmt.Errorf("Error evaluating code: %w", err)
	//}

	d, err = os.ReadFile(file)
	if err != nil {
		return nil, fmt.Errorf("Error reading file: %w", err)
	}

	_, err = i.Eval(string(d))
	if err != nil {
		return nil, fmt.Errorf("Error evaluating code: %w", err)
	}
	return i, nil
}
