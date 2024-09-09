package types

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

type AppConfig struct {
	OpenAIKey   string        `json:"openai_key"`
	SMTP        SMTPConfig    `json:"smtp"`
	Spotify     SpotifyConfig `json:"spotify"`
	ExternalURL string        `json:"external_url"`
}

type ZineConfig struct {
}

func LoadConfig() AppConfig {
	// load the app config
	var appConfig AppConfig
	configFile, err := os.Open("data/config.json")
	if err != nil {
		log.Fatalf("Failed to open config file: %v", err)
	}
	defer configFile.Close()

	err = json.NewDecoder(configFile).Decode(&appConfig)
	if err != nil {
		log.Fatalf("Failed to decode config file: %v", err)
	}
	return appConfig
}
