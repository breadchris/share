package main

import (
	"encoding/json"
	"github.com/google/uuid"
	"log"
	"net/http"
	"os"

	"github.com/go-webauthn/webauthn/webauthn"
)

var webAuthn *webauthn.WebAuthn

func setupWebauthn() {
	var err error
	webAuthn, err = webauthn.New(&webauthn.Config{
		RPDisplayName: "justshare", // Display Email for your site
		// TODO breadchris should be justshare.io in prod
		RPID: "localhost", // Generally the domain name
		RPOrigins: []string{
			"http://localhost:8080",
			"https://justshare.io",
		}, // The origin URL for WebAuthn requests
	})

	if err != nil {
		log.Fatalf("failed to create webAuthn: %v", err)
	}

	loadUsersFromFile()

	http.HandleFunc("/auth/register", beginRegistration)
	http.HandleFunc("/auth/register/finish", finishRegistration)
	http.HandleFunc("/auth/login", beginLogin)
	http.HandleFunc("/auth/login/finish", finishLogin)
}

type User struct {
	ID          string
	Email       string
	DisplayName string
	Icon        string
	Credentials []webauthn.Credential
	Secrets     []string
	Audiences   []string
}

func (u User) WebAuthnID() []byte {
	return []byte(u.ID)
}

func (u User) WebAuthnName() string {
	return u.Email
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

var sessions = map[string]*webauthn.SessionData{}

func saveUsersToFile() {
	file, err := os.Create("data/users.json")
	if err != nil {
		log.Fatalf("failed to create file: %v", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(users)
	if err != nil {
		log.Fatalf("failed to encode users: %v", err)
	}
}

func loadUsersFromFile() {
	file, err := os.Open("data/users.json")
	if err != nil {
		log.Printf("failed to open file: %v", err)
		return
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	err = decoder.Decode(&users)
	if err != nil {
		log.Fatalf("failed to decode users: %v", err)
	}
}

func beginRegistration(w http.ResponseWriter, r *http.Request) {
	user := &User{
		ID:          uuid.NewString(),
		Email:       "user@example.com",
		DisplayName: "User Example",
		Icon:        "https://example.com/icon.png",
	}
	users[user.Email] = user

	options, sessionData, err := webAuthn.BeginRegistration(user)
	if err != nil {
		http.Error(w, "Failed to begin registration", http.StatusInternalServerError)
		return
	}

	// Store session data
	sessions[user.Email] = sessionData

	json.NewEncoder(w).Encode(options)
}

func finishRegistration(w http.ResponseWriter, r *http.Request) {
	user := users["user@example.com"]
	sessionData := sessions[user.Email]

	credential, err := webAuthn.FinishRegistration(user, *sessionData, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user.Credentials = append(user.Credentials, *credential)

	// TODO breadchris race conditions abound
	saveUsersToFile()

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
	sessions[user.Email] = sessionData

	json.NewEncoder(w).Encode(options)
}

func finishLogin(w http.ResponseWriter, r *http.Request) {
	user := users["user@example.com"]
	sessionData := sessions[user.Email]

	_, err := webAuthn.FinishLogin(user, *sessionData, r)
	if err != nil {
		http.Error(w, "Failed to finish login", http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode("Login successful")
}
