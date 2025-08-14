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

type DeploymentConfig struct {
	Enabled           bool   `json:"enabled"`
	WebhookSecret     string `json:"webhook_secret"`
	WorkDir           string `json:"work_dir"`
	ServerBinary      string `json:"server_binary"`
	HealthTimeout     int    `json:"health_timeout"`     // seconds
	GracefulTimeout   int    `json:"graceful_timeout"`   // seconds
}

type SnapshotConfig struct {
	Enabled           bool     `json:"enabled"`            // Master on/off switch
	Mode              string   `json:"mode"`               // "disabled", "always", "claude-session"
	SessionFilter     []string `json:"session_filter"`     // Specific session IDs to monitor
	ClaudeSessionOnly bool     `json:"claude_session_only"` // Only monitor when Claude sessions are active
}

type AppConfig struct {
	OpenAIKey          string           `json:"openai_key"`
	SMTP               SMTPConfig       `json:"smtp"`
	Spotify            SpotifyConfig    `json:"spotify"`
	ExternalURL        string           `json:"external_url"`
	SessionSecret      string           `json:"session_secret"`
	GoogleClientID     string           `json:"google_client_id"`
	GoogleClientSecret string           `json:"google_client_secret"`
	Blog               BlogConfig       `json:"blog"`
	Stripe             Stripe           `json:"stripe"`
	Figma              string           `json:"figma"`
	Github             GithubConfig     `json:"github"`
	Proxy              ProxyConfig      `json:"proxy"`
	Deployment         DeploymentConfig `json:"deployment"`
	Snapshot           SnapshotConfig   `json:"snapshot"`
	Admins             []string         `json:"admins"`
	DB                 string           `json:"db"`
	JamsocketURL       string           `json:"jamsocket_url"`
	SupabaseURL        string           `json:"supabase_url"`
	ClaudeDebug        bool             `json:"claude_debug"`
	HostRoutes         map[string]string `json:"host_routes"` // domain -> component_path
}

// Deployment convenience methods
func (c *AppConfig) DeploymentEnabled() bool {
	return c.Deployment.Enabled
}

func (c *AppConfig) WebhookSecret() string {
	return c.Deployment.WebhookSecret
}

func (c *AppConfig) DeploymentWorkDir() string {
	if c.Deployment.WorkDir == "" {
		return "/tmp/deployment"
	}
	return c.Deployment.WorkDir
}

func (c *AppConfig) DeploymentHealthTimeout() int {
	if c.Deployment.HealthTimeout == 0 {
		return 60 // Default 60 seconds
	}
	return c.Deployment.HealthTimeout
}

func (c *AppConfig) DeploymentGracefulTimeout() int {
	if c.Deployment.GracefulTimeout == 0 {
		return 30 // Default 30 seconds
	}
	return c.Deployment.GracefulTimeout
}

// Snapshot convenience methods
func (c *AppConfig) SnapshotEnabled() bool {
	return c.Snapshot.Enabled
}

func (c *AppConfig) SnapshotMode() string {
	if c.Snapshot.Mode == "" {
		return "disabled" // Default mode
	}
	return c.Snapshot.Mode
}

func (c *AppConfig) ShouldStartSnapshotWorkers() bool {
	return c.Snapshot.Enabled && c.Snapshot.Mode != "disabled"
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

// NewFromEnv loads configuration based on environment variables
func NewFromEnv() AppConfig {
	configPath := os.Getenv("CONFIG_FILE_PATH")
	if configPath == "" {
		configPath = getDefaultConfigPath()
	}
	config := NewFromFile(configPath)
	config.loadFromEnv()
	return config
}

// getDefaultConfigPath returns the default config path based on CONFIG_MODE
func getDefaultConfigPath() string {
	mode := os.Getenv("CONFIG_MODE")
	switch mode {
	case "production":
		return "data/production.json"
	case "k8s":
		return "/app/config/production.json"
	default:
		return "data/config.json"
	}
}

// loadFromEnv overrides config values with environment variables if present
func (c *AppConfig) loadFromEnv() {
	if key := os.Getenv("OPENAI_KEY"); key != "" {
		c.OpenAIKey = key
	}
	if secret := os.Getenv("SESSION_SECRET"); secret != "" {
		c.SessionSecret = secret
	}
	if googleClientID := os.Getenv("GOOGLE_CLIENT_ID"); googleClientID != "" {
		c.GoogleClientID = googleClientID
	}
	if googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET"); googleClientSecret != "" {
		c.GoogleClientSecret = googleClientSecret
	}
	if githubClientSecret := os.Getenv("GITHUB_CLIENT_SECRET"); githubClientSecret != "" {
		c.Github.ClientSecret = githubClientSecret
	}
	if stripeKey := os.Getenv("STRIPE_SECRET_KEY"); stripeKey != "" {
		c.Stripe.SecretKey = stripeKey
	}
	if smtpPassword := os.Getenv("SMTP_PASSWORD"); smtpPassword != "" {
		c.SMTP.Password = smtpPassword
	}
	if supabaseURL := os.Getenv("SUPABASE_URL"); supabaseURL != "" {
		c.SupabaseURL = supabaseURL
	}
	if jamsocketURL := os.Getenv("JAMSOCKET_URL"); jamsocketURL != "" {
		c.JamsocketURL = jamsocketURL
	}
	if externalURL := os.Getenv("EXTERNAL_URL"); externalURL != "" {
		c.ExternalURL = externalURL
	}
	if db := os.Getenv("DATABASE_URL"); db != "" {
		c.DB = db
	}
}
