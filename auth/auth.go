package auth

import (
	"fmt"
	"net/http"
	"time"

	"github.com/breadchris/share/config"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/breadchris/share/session"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
	"gorm.io/gorm"
	"log/slog"
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

func (a *Auth) StartGoogleAuth(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	q.Set("provider", "google")
	q.Set("redirect_to", fmt.Sprintf("%s/auth/google/callback", a.cfg.ExternalURL))
	r.URL.RawQuery = q.Encode()
	a.h.BeginAuthHandler(w, r)
}

func (a *Auth) HandleGoogleCallback(w http.ResponseWriter, r *http.Request) {
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
				slog.Error("failed to create user", "error", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}
		} else {
			slog.Error("failed to query user", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
	}

	a.s.SetUserID(r.Context(), user.ID)

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (a *Auth) HandleRegister(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		DefaultLayout(
			Div(Class("max-w-md mx-auto mt-8"),
				H1(Class("text-2xl font-bold mb-4"), T("Register")),
				Form(
					Class("space-y-4"),
					HxPost("/register"),
					Input(
						Type("email"),
						Name("email"),
						Placeholder("Email"),
						Class("w-full p-2 border rounded"),
						Attr("required", "true"),
					),
					Input(
						Type("password"),
						Name("password"),
						Placeholder("Password"),
						Class("w-full p-2 border rounded"),
						Attr("required", "true"),
					),
					Input(
						Type("text"),
						Name("invite"),
						Placeholder("Invite Code"),
						Class("w-full p-2 border rounded"),
						Attr("required", "true"),
					),
					Button(
						Type("submit"),
						Class("w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"),
						T("Register"),
					),
				),
				P(Class("mt-4 text-center"),
					A(Href("/login"), T("Already have an account? Login")),
				),
			),
		).RenderPage(w, r)
		return
	case "POST":
		if err := r.ParseForm(); err != nil {
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}

		email := r.FormValue("email")
		password := r.FormValue("password")
		invite := r.FormValue("invite")

		if _, ok := inviteLookup[invite]; !ok {
			http.Error(w, "Invalid invite code", http.StatusBadRequest)
			return
		}

		// Check if user already exists
		var existingUser models.User
		if err := a.db.Where("username = ?", email).First(&existingUser).Error; err == nil {
			http.Error(w, "User already exists", http.StatusBadRequest)
			return
		}

		// Create new user
		user := models.User{
			ID:        uuid.NewString(),
			CreatedAt: time.Now(),
			Username:  email,
			Password:  password, // In production, hash this password
		}

		if err := a.db.Create(&user).Error; err != nil {
			slog.Error("failed to create user", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		a.s.SetUserID(r.Context(), user.ID)

		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}
}

func (a *Auth) HandleLogin(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		DefaultLayout(
			Div(Class("max-w-md mx-auto mt-8"),
				H1(Class("text-2xl font-bold mb-4"), T("Login")),
				Form(
					Class("space-y-4"),
					HxPost("/login"),
					Input(
						Type("email"),
						Name("email"),
						Placeholder("Email"),
						Class("w-full p-2 border rounded"),
						Attr("required", "true"),
					),
					Input(
						Type("password"),
						Name("password"),
						Placeholder("Password"),
						Class("w-full p-2 border rounded"),
						Attr("required", "true"),
					),
					Button(
						Type("submit"),
						Class("w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"),
						T("Login"),
					),
				),
				P(Class("mt-4 text-center"),
					A(Href("/register"), T("Don't have an account? Register")),
				),
				P(Class("mt-2 text-center"),
					A(Href("/auth/google"), T("Login with Google")),
				),
			),
		).RenderPage(w, r)
		return
	case "POST":
		if err := r.ParseForm(); err != nil {
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}

		email := r.FormValue("email")
		password := r.FormValue("password")

		var user models.User
		if err := a.db.Where("username = ? AND password = ?", email, password).First(&user).Error; err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		a.s.SetUserID(r.Context(), user.ID)

		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}
}

func (a *Auth) HandleLogout(w http.ResponseWriter, r *http.Request) {
	a.s.ClearUserID(r.Context())
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (a *Auth) AccountHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := a.s.GetUserID(r.Context())
	if err != nil {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	var user models.User
	if err := a.db.Where("id = ?", userID).First(&user).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	DefaultLayout(
		Div(Class("max-w-md mx-auto mt-8"),
			H1(Class("text-2xl font-bold mb-4"), T("Account")),
			P(T("Username: "+user.Username)),
			A(Href("/logout"), Class("text-blue-500"), T("Logout")),
		),
	).RenderPage(w, r)
}

func (a *Auth) HandleInvite(w http.ResponseWriter, r *http.Request) {
	// Implementation for invite handling
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (a *Auth) ReactHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation for React handler
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func (a *Auth) BlogHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation for blog handler
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}