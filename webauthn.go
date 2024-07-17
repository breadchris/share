package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-webauthn/webauthn/webauthn"
)

var webAuthn *webauthn.WebAuthn

func setupWebauthn() {
	var err error
	webAuthn, err = webauthn.New(&webauthn.Config{
		RPDisplayName: "Example Corp", // Display Name for your site
		RPID:          "justshare.io", // Generally the domain name
		RPOrigins: []string{
			"http://localhost:8080",
			"https://justshare.io",
		}, // The origin URL for WebAuthn requests
	})

	if err != nil {
		log.Fatalf("failed to create webAuthn: %v", err)
	}

	http.HandleFunc("/register", beginRegistration)
	http.HandleFunc("/register/finish", finishRegistration)
	http.HandleFunc("/login", beginLogin)
	http.HandleFunc("/login/finish", finishLogin)
}

type User struct {
	ID          []byte
	Name        string
	DisplayName string
	Icon        string
	Credentials []webauthn.Credential
}

func (u User) WebAuthnID() []byte {
	return u.ID
}

func (u User) WebAuthnName() string {
	return u.Name
}

func (u User) WebAuthnDisplayName() string {
	return u.DisplayName
}

func (u User) WebAuthnIcon() string {
	return u.Icon
}

func (u User) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

var users = map[string]*User{}
var sessions = map[string]*webauthn.SessionData{}

func beginRegistration(w http.ResponseWriter, r *http.Request) {
	user := &User{
		ID:          []byte("unique_user_id"), // This should be unique per user
		Name:        "user@example.com",
		DisplayName: "User Example",
		Icon:        "https://example.com/icon.png",
	}
	users[user.Name] = user

	options, sessionData, err := webAuthn.BeginRegistration(user)
	if err != nil {
		http.Error(w, "Failed to begin registration", http.StatusInternalServerError)
		return
	}

	// Store session data
	sessions[user.Name] = sessionData

	json.NewEncoder(w).Encode(options)
}

func finishRegistration(w http.ResponseWriter, r *http.Request) {
	user := users["user@example.com"]
	sessionData := sessions[user.Name]

	credential, err := webAuthn.FinishRegistration(user, *sessionData, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user.Credentials = append(user.Credentials, *credential)
	json.NewEncoder(w).Encode("Registration successful")
}

func beginLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		http.ServeFile(w, r, "webauthn.html")
		return
	}
	user := users["user@example.com"]
	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	options, sessionData, err := webAuthn.BeginLogin(user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Store session data
	sessions[user.Name] = sessionData

	json.NewEncoder(w).Encode(options)
}

func finishLogin(w http.ResponseWriter, r *http.Request) {
	user := users["user@example.com"]
	sessionData := sessions[user.Name]

	_, err := webAuthn.FinishLogin(user, *sessionData, r)
	if err != nil {
		http.Error(w, "Failed to finish login", http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode("Login successful")
}
