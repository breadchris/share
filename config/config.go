package config

import (
	"encoding/json"
	"log"
	"os"
)

type SMTPConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type SpotifyConfig struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

type BlogConfig struct {
	BaseURL string `json:"base_url"`
	YJSURL  string `json:"yjs_url"`
}

type Stripe struct {
	SecretKey string `json:"secret_key"`
}

type GithubConfig struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

type ProxyConfig struct {
	URL      string `json:"url"`
	Username string `json:"username"`
	Password string `json:"password"`
	SocksURL string `json:"socks_url"`
}

type AppConfig struct {
	OpenAIKey          string        `json:"openai_key"`
	SMTP               SMTPConfig    `json:"smtp"`
	Spotify            SpotifyConfig `json:"spotify"`
	ExternalURL        string        `json:"external_url"`
	SessionSecret      string        `json:"session_secret"`
	GoogleClientID     string        `json:"google_client_id"`
	GoogleClientSecret string        `json:"google_client_secret"`
	Blog               BlogConfig    `json:"blog"`
	Stripe             Stripe        `json:"stripe"`
	Figma              string        `json:"figma"`
	Github             GithubConfig  `json:"github"`
	Proxy              ProxyConfig   `json:"proxy"`
	Admins             []string      `json:"admins"`
	DB                 string        `json:"db"`
	JamsocketURL       string        `json:"jamsocket_url"`
}

func NewFromFile(path string) AppConfig {
	appConfig := AppConfig{
		SessionSecret: "secret",
		DB:            "sqlite://data/db.sqlite",
	}

	configFile, err := os.Open(path)
	if err != nil {
		log.Fatalf("Failed to open dbconfig file: %v", err)
	}
	defer configFile.Close()

	err = json.NewDecoder(configFile).Decode(&appConfig)
	if err != nil {
		log.Fatalf("Failed to decode dbconfig file: %v", err)
	}
	return appConfig
}

func New() AppConfig {
	appConfig := AppConfig{
		SessionSecret: "secret",
		DB:            "sqlite://data/db.sqlite",
	}

	configFile, err := os.Open("data/config.json")
	if err != nil {
		log.Fatalf("Failed to open dbconfig file: %v", err)
	}
	defer configFile.Close()

	err = json.NewDecoder(configFile).Decode(&appConfig)
	if err != nil {
		log.Fatalf("Failed to decode dbconfig file: %v", err)
	}
	return appConfig
}
