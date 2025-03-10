package main

import (
	"fmt"
	"github.com/breadchris/share/config"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/breadchris/share/session"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
	"github.com/samber/lo"
	"gorm.io/gorm"
	"log/slog"
	"net/http"
	"time"
)

var (
	invites      []Invite
	inviteLookup = map[string]string{}
)

func init() {
	i := uuid.NewString()
	inviteLookup[i] = i
	println("Invite code:", i)
}

type Invite struct {
	From string
	To   string
}

type Auth struct {
	s   *session.SessionManager
	e   *SMTPEmail
	c   config.AppConfig
	h   *gothic.Handler
	cfg config.AppConfig
	db  *gorm.DB
}

func NewAuth(
	s *session.SessionManager, e *SMTPEmail, c config.AppConfig,
	db *gorm.DB,
) *Auth {
	return &Auth{
		s:   s,
		e:   e,
		c:   c,
		cfg: c,
		db:  db,
		h: gothic.NewHandler(
			sessions.NewCookieStore([]byte(c.SessionSecret)),
			gothic.WithProviders(
				google.New(
					c.GoogleClientID,
					c.GoogleClientSecret,
					fmt.Sprintf("%s/auth/google/callback", c.ExternalURL),
					"email", "profile"),
				github.New(
					c.Github.ClientID,
					c.Github.ClientSecret,
					fmt.Sprintf("%s/auth/github/callback", c.ExternalURL),
					"repo", "user:email",
				),
			),
		),
	}
}

func (a *Auth) startGoogleAuth(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	q.Set("provider", "google")
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

	// find or create user by email
	var user models.User
	if err := a.db.Where("username = ?", u.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			user = models.User{
				ID:        uuid.NewString(),
				CreatedAt: time.Now(),
				Username:  u.Email,
			}
			if err := a.db.Create(&user).Error; err != nil {
				http.Error(w, "Database error", http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
	}
	a.s.SetUserID(r.Context(), user.ID)
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
	Next string
	Msg  string
}

func (s *Auth) handleLogout(w http.ResponseWriter, r *http.Request) {
	s.s.ClearUserID(r.Context())
	http.Redirect(w, r, "/", http.StatusFound)
}

func (s *Auth) handleLogin(w http.ResponseWriter, r *http.Request) {
	next := r.URL.Query().Get("next")
	switch r.Method {
	case http.MethodGet:
		sec := r.URL.Query().Get("sec")
		if sec == "" {
			LoginPage(AuthState{
				Next: next,
			}).RenderPage(w, r)
			return
		}
		var user models.User
		if err := s.db.Where("secrets LIKE ?", fmt.Sprintf("%%%s%%", sec)).First(&user).Error; err == nil {
			s.s.SetUserID(r.Context(), user.ID)
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}
		http.Error(w, "invalid secret", http.StatusBadRequest)
	case http.MethodPost:
		err := r.ParseMultipartForm(10 << 20) // 10 MB
		if err != nil {
			http.Error(w, "Error parsing form data", http.StatusBadRequest)
			return
		}
		f := r.FormValue("email")
		p := r.FormValue("password")

		var user models.User
		if err := s.db.Where("username = ?", f).First(&user).Error; err != nil {
			LoginPage(AuthState{Msg: "Invalid email or password"}).RenderPage(w, r)
			return
		}

		if p != user.Password {
			LoginPage(AuthState{Msg: "Invalid email or password"}).RenderPage(w, r)
			return
		}

		s.s.SetUserID(r.Context(), user.ID)
		http.Redirect(w, r, "/", http.StatusFound)
		return

		//if f != "" {
		//	var user models.User
		//	if err := s.db.Preload(clause.Associations).Where("username = ?", f).First(&user).Error; err == nil {
		//		msg := fmt.Sprintf("Click <a href=\"%s/login?sec=%s\">here</a> to login.", s.c.ExternalURL, user.Secrets[0])
		//		e := s.e.SendRecoveryEmail(user.Username, "Recover your account", msg, user.Secrets[0].Secret)
		//		if e != nil {
		//			fmt.Printf("Error sending email: %v\n", e)
		//			LoginPage(AuthState{Msg: "Error sending email"}).RenderPage(w, r)
		//			return
		//		}
		//		LoginPage(AuthState{Msg: "check your email"}).RenderPage(w, r)
		//		return
		//	}
		//	LoginPage(AuthState{Msg: "no user with that email"}).RenderPage(w, r)
		//	return
		//}
		//sec := r.FormValue("id")
		//var user models.User
		//if err := s.db.Where("secrets LIKE ?", fmt.Sprintf("%%%s%%", sec)).First(&user).Error; err == nil {
		//	s.s.SetUserID(r.Context(), user.ID)
		//	http.Redirect(w, r, "/", http.StatusFound)
		//	return
		//}
		//http.Error(w, "Invalid secret", http.StatusBadRequest)
		return
	}
}

func (s *Auth) handleRegister(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		email := r.FormValue("email")
		password := r.FormValue("password")

		var existingUser models.User
		if err := s.db.Where("username = ?", email).First(&existingUser).Error; err == nil {
			LoginPage(AuthState{Msg: "User already exists"}).RenderPage(w, r)
			return
		}

		id := uuid.NewString()
		user := models.User{
			ID:        id,
			Username:  email,
			CreatedAt: time.Now(),
			Password:  password,
		}
		s.db.Create(&user)
		s.s.SetUserID(r.Context(), id)
		http.Redirect(w, r, "/", http.StatusFound)
	}
}

func (s *Auth) accountHandler(w http.ResponseWriter, r *http.Request) {
	id, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	var user models.User
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Fetch invites from inviteLookup
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
				P(T("Hello "+user.Username)),
				Hr(Class("my-5")),
				Text("User Invites"),
				Ch(
					lo.Map(
						lo.Filter(invites, func(i Invite, idx int) bool {
							return i.From == id
						}),
						func(i Invite, idx int) *Node {
							if us, ok := inviteLookup[i.To]; ok {
								return Div(Class("border p-4 rounded-lg bg-gray-50"),
									Text(us),
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

func LoginPage(s AuthState) *Node {
	return DefaultLayout(
		Body(Class("flex items-center justify-center min-h-screen"),
			Div(Class("p-8 rounded shadow-md w-full max-w-md"),
				If(len(s.Msg) > 0,
					Div(Class("bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"), Role("alert"),
						Span(Class("block sm:inline"), T(s.Msg)),
					),
					Nil(),
				),
				Div(
					Class("tabs tabs-border"),
					Input(AriaLabel("login"), Class("tab"), Type("radio"), Id("tab1"), Name("tabs"), Checked(true)),
					Div(
						Class("tab-content border-base-300 bg-base-100 p-10"),
						Form(Method("POST"), Action("/login"), Attr("enctype", "multipart/form-data"),
							Div(Class("mb-4 space-y-4"),
								Input(Type("email"), Id("email"), Name("email"), Placeholder("email"), Class("input")),
								Input(Type("password"), Id("password"), Name("password"), Placeholder("password"), Class("input")),
							),
							Div(Class("flex items-center justify-between"),
								Button(Class("btn"), Type("submit"), T("Submit")),
							),
						),
					),
					Input(AriaLabel("register"), Class("tab"), Type("radio"), Id("tab2"), Name("tabs"), Checked(false)),
					Div(
						Class("tab-content border-base-300 bg-base-100 p-10"),
						Form(Method("POST"), Action("/register"), Attr("enctype", "multipart/form-data"),
							Div(Class("mb-4 space-y-4"),
								Input(Type("email"), Id("email"), Name("email"), Placeholder("email"), Class("input")),
								Input(Type("password"), Id("password"), Name("password"), Placeholder("password"), Class("input")),
							),
							Div(Class("flex items-center justify-between"),
								Button(Class("btn"), Type("submit"), T("Submit")),
							),
						),
					),
				),

				//A(Href("/auth/google"), Class("btn"), T("Login with Google")),

				Div(Id("result"), Class("mt-4")),
			),
		),
	)
}
