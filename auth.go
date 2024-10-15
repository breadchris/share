package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/session"
	"github.com/fsnotify/fsnotify"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"github.com/samber/lo"
	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"log"
	"log/slog"
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
	s   *session.SessionManager
	e   *SMTPEmail
	c   AppConfig
	h   *gothic.Handler
	cfg AppConfig
}

func NewAuth(s *session.SessionManager, e *SMTPEmail, c AppConfig) *Auth {
	return &Auth{
		s:   s,
		e:   e,
		c:   c,
		cfg: c,
		h: gothic.NewHandler(
			sessions.NewCookieStore([]byte(c.SessionSecret)),
			gothic.WithProviders(
				google.New(
					c.GoogleClientID,
					c.GoogleClientSecret,
					fmt.Sprintf("%s/auth/google/callback", c.ExternalURL),
					"email", "profile"),
			),
		),
	}
}

func (a *Auth) startGoogleAuth(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	q.Set("provider", "google")
	// TODO breadchris update this path to take the "next url"
	// aren't their security concerns here?
	q.Set("redirect_to", fmt.Sprintf("%s/auth/google/callback", a.cfg.ExternalURL))
	r.URL.RawQuery = q.Encode()
	a.h.BeginAuthHandler(w, r)
}

func (a *Auth) handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	q.Set("provider", "google")
	r.URL.RawQuery = q.Encode()
	u, err := a.h.CompleteUserAuth(w, r)
	if err != nil {
		slog.Error("failed to complete user auth", "error", err)
		return
	}

	// find user by email
	var id string
	for _, user := range users {
		if user.Email == u.Email {
			id = user.ID
			break
		}
	}

	if id == "" {
		id = uuid.NewString()
		users[id] = &User{
			ID:    id,
			Email: u.Email,
		}
		saveJSON(authFile, users)
	}
	a.s.SetUserID(r.Context(), id)

	http.Redirect(w, r, "/", http.StatusFound)
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

type AuthState struct {
	Msg string
}

func (s *Auth) handleLogin(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		sec := r.URL.Query().Get("sec")
		if sec == "" {
			LoginPage(AuthState{}).RenderPage(w, r)
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
						LoginPage(AuthState{
							Msg: "Error sending email",
						}).RenderPage(w, r)
						return
					}
					LoginPage(AuthState{
						Msg: "check your email",
					})
					return
				}
			}
			LoginPage(AuthState{
				Msg: "no user with that email",
			}).RenderPage(w, r)
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

func LoginPage(s AuthState) *Node {
	return Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Attr("name", "viewport"), Content("width=device-width, initial-scale=1.0")),
			Title(T("Login")),
			Link(Href("https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"), Rel("stylesheet")),
			Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
		),
		Body(Class("bg-gray-100 flex items-center justify-center min-h-screen"),
			Div(Class("bg-white p-8 rounded shadow-md w-full max-w-md"),
				H1(Class("text-2xl font-bold mb-4"), T("Login")),

				If(len(s.Msg) > 0,
					Div(Class("bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"), Role("alert"),
						Span(Class("block sm:inline"), T(s.Msg)),
					),
					Nil(),
				),

				A(Href("/auth/google"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"), T("Login with Google")),

				Form(Method("POST"), Action("/login"), Attr("enctype", "multipart/form-data"),
					Div(Class("mb-4"),
						Hr(Class("my-5")),
						Input(Type("password"), Id("secret"), Name("secret"), Placeholder("secret"), Class("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline")),
						Hr(Class("my-5")),
						Input(Type("email"), Id("email"), Name("email"), Placeholder("email"), Class("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline")),
					),
					Div(Class("flex items-center justify-between"),
						Button(Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"), Type("submit"), T("Submit")),
					),
				),

				Div(Id("result"), Class("mt-4")),
			),
		),
	)
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
		RegisterPage(RegisterState{
			Invite: i,
		}).RenderPage(w, r)
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
		Div(
			Img(Src("/qr?data="+sec)),
			Hr(),
			A(Href("/"), T("go home")),
		).RenderPage(w, r)
	}
}

type RegisterState struct {
	Invite string
}

func RegisterPage(state RegisterState) *Node {
	return Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Attr("name", "viewport"), Content("width=device-width, initial-scale=1.0")),
			Title(T("Login")),
			Link(Href("https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"), Rel("stylesheet")),
			Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
		),
		Body(Class("bg-gray-100 flex items-center justify-center h-screen"),
			Div(Class("w-full max-w-md"),
				Form(HxPost("/register"), HxTarget("#result"), HxSwap("innerHTML"),
					Input(Type("hidden"), Name("invite"), Value(state.Invite)),
					Div(Class("mb-4"),
						Label(Class("block text-gray-700 text-sm font-bold mb-2"), For("email"), T("Email")),
						Input(Class("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"), Id("email"), Type("email"), Name("email"), Placeholder("Email")),
					),
					Div(Class("flex items-center justify-between"),
						Button(Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"), Type("submit"), T("Register")),
					),
					Div(Id("result"), Class("mt-4")),
				),
				P(Class("text-center text-gray-500 text-xs"), T("share")),
			),
		),
	)
}

func (s *Auth) handleAuth(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		Html(
			Head(
				Meta(Charset("UTF-8")),
				Meta(Attr("name", "viewport"), Content("width=device-width, initial-scale=1.0")),
				Title(T("Authentication")),
				Link(Href("https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"), Rel("stylesheet")),
				Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
			),
			Body(Class("bg-gray-100 flex items-center justify-center min-h-screen"),
				Div(Class("bg-white p-8 rounded shadow-md w-full max-w-md"),
					H1(Class("text-2xl font-bold mb-4"), T("Authentication")),

					Form(Id("uploadForm"), HxPost("/auth"), Attr("hx-encoding", "multipart/form-data"), HxTarget("#result"), HxSwap("innerHTML"),
						Div(Class("mb-4"),
							Label(Class("block text-gray-700 text-sm font-bold mb-2"), For("file"), T("Upload QR Code")),
							Input(Type("file"), Id("file"), Name("file"), Class("shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline")),
						),
						Div(Class("flex items-center justify-between"),
							Button(Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"), Type("submit"), T("Submit")),
						),
					),

					Div(Id("result"), Class("mt-4")),

					Hr(Class("my-4")),

					Button(Class("bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"), HxPut("/auth"), HxTarget("#qrCode"), HxSwap("outerHTML"), T("Generate QR Code")),

					Div(Id("qrCode"), Class("mt-4")),
				),
			),
		).RenderPage(w, r)
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
				if event.Op != fsnotify.Write {
					continue
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
