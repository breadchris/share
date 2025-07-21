package config

import (
	"encoding/json"
	"log"
	"os"
	"time"
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

type SlackBotConfig struct {
	Enabled              bool          `json:"enabled"`
	SlackAppID           string        `json:"app_id"`
	SlackClientID        string        `json:"client_id"`
	SlackClientSecret    string        `json:"client_secret"`
	SlackSigningSecret   string        `json:"signing_secret"`
	SlackToken           string        `json:"token"`
	BotToken             string        `json:"bot_token"`
	SessionTimeout       time.Duration `json:"session_timeout"`
	MaxSessions          int           `json:"max_sessions"`
	WorkingDirectory     string        `json:"working_directory"`
	Debug                bool          `json:"debug"`
	ChannelWhitelist     []string      `json:"channel_whitelist"`
	
	// Ideation settings
	IdeationEnabled      bool          `json:"ideation_enabled"`
	IdeationTimeout      time.Duration `json:"ideation_timeout"`
	MaxIdeationSessions  int           `json:"max_ideation_sessions"`
	AutoExpandThreshold  int           `json:"auto_expand_threshold"`
}

type ClaudeConfig struct {
	Debug    bool     `json:"debug"`
	DebugDir string   `json:"debug_dir"`
	Tools    []string `json:"tools"`
}

type WorkletConfig struct {
	BaseDir       string        `json:"base_dir"`
	CleanupMaxAge time.Duration `json:"cleanup_max_age"`
	MaxConcurrent int           `json:"max_concurrent"`
}

type GitConfig struct {
	Token   string `json:"github_token"`
	BaseDir string `json:"base_dir"`
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
	DSN                string        `json:"dsn"`
	ShareDir           string        `json:"share_dir"`
	JamsocketURL       string        `json:"jamsocket_url"`
	SupabaseURL        string        `json:"supabase_url"`
	ClaudeDebug        bool          `json:"claude_debug"`

	// New configuration sections
	SlackBot SlackBotConfig `json:"slack_bot"`
	Claude   ClaudeConfig   `json:"claude"`
	Worklet  WorkletConfig  `json:"worklet"`
	Git      GitConfig      `json:"git"`
}

func LoadConfig() AppConfig {
	appConfig := AppConfig{
		SessionSecret: "secret",
		DB:            "sqlite://data/db.sqlite",
		DSN:           "sqlite://data/db.sqlite",
		ShareDir:      "data",
	}

	setConfigDefaults(&appConfig)

	configFile, err := os.Open("data/config.json")
	if err != nil {
		log.Printf("Config file not found, using defaults: %v", err)
	} else {
		defer configFile.Close()
		err = json.NewDecoder(configFile).Decode(&appConfig)
		if err != nil {
			log.Printf("Failed to decode config file, using defaults: %v", err)
		}
	}

	applyEnvOverrides(&appConfig)

	return appConfig
}
