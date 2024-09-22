package pkg

import (
	"fmt"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"os"
	"path/filepath"
	"time"

	"github.com/breadchris/share/editor/pkg/goplay"
)

const (
	DefaultWriteTimeout   = 60 * time.Second
	DefaultReadTimeout    = 15 * time.Second
	DefaultIdleTimeout    = 90 * time.Second
	DefaultGoBuildTimeout = 40 * time.Second
	DefaultCleanInterval  = 10 * time.Minute
)

func DefaultConfig() *Config {
	wd, err := os.Getwd()
	if err != nil {
		wd = "."
	}
	return &Config{
		HTTP: HTTPConfig{
			Addr:         ":8080",
			AssetsDir:    filepath.Join(wd, "public"),
			WriteTimeout: DefaultWriteTimeout,
			ReadTimeout:  DefaultReadTimeout,
			IdleTimeout:  DefaultIdleTimeout,
		},
		Playground: PlaygroundConfig{
			PlaygroundURL:  goplay.DefaultPlaygroundURL,
			ConnectTimeout: 15 * time.Second,
		},
		Build: BuildConfig{
			BuildDir:          os.TempDir(),
			PackagesFile:      "packages.json",
			CleanupInterval:   DefaultCleanInterval,
			GoBuildTimeout:    DefaultGoBuildTimeout,
			SkipModuleCleanup: false,
			BypassEnvVarsList: []string{},
		},
		Log: LogConfig{
			Debug:  false,
			Level:  zap.InfoLevel,
			Format: "console",
			Sentry: SentryConfig{},
		},
		Services: ServicesConfig{
			GoogleAnalyticsID: "",
		},
	}
}

type HTTPConfig struct {
	// Addr is HTTP server listen address
	Addr string `envconfig:"APP_HTTP_ADDR" json:"addr"`

	// AssetsDir is directory which contains frontend assets
	AssetsDir string `envconfig:"APP_ASSETS_DIR" json:"assetsDir"`

	// WriteTimeout is HTTP response write timeout.
	WriteTimeout time.Duration `envconfig:"HTTP_WRITE_TIMEOUT"`

	// ReadTimeout is HTTP request read timeout.
	ReadTimeout time.Duration `envconfig:"HTTP_READ_TIMEOUT"`

	// IdleTimeout is delay timeout between requests to keep connection alive.
	IdleTimeout time.Duration `envconfig:"HTTP_IDLE_TIMEOUT"`
}

type PlaygroundConfig struct {
	// PlaygroundURL is Go playground server URL
	PlaygroundURL string `envconfig:"APP_PLAYGROUND_URL" json:"playgroundUrl"`

	// ConnectTimeout is HTTP request timeout for playground requests
	ConnectTimeout time.Duration `envconfig:"APP_PLAYGROUND_TIMEOUT" json:"connectTimeout"`
}

type BuildConfig struct {
	// BuildDir is path to directory to cache WebAssembly builds
	BuildDir string `envconfig:"APP_BUILD_DIR" json:"buildDir"`

	// PackagesFile is path to packages JSON index file
	PackagesFile string `envconfig:"APP_PKG_FILE" json:"packagesFile"`

	// CleanupInterval is WebAssembly build artifact cache clean interval
	CleanupInterval time.Duration `envconfig:"APP_CLEAN_INTERVAL" json:"cleanupInterval"`

	// GoBuildTimeout is Go program build timeout.
	GoBuildTimeout time.Duration `envconfig:"APP_GO_BUILD_TIMEOUT" json:"goBuildTimeout"`

	// SkipModuleCleanup disables Go module cache cleanup.
	SkipModuleCleanup bool `envconfig:"APP_SKIP_MOD_CLEANUP" json:"skipModuleCleanup"`

	// BypassEnvVarsList is allow-list of environment variables
	// that will be passed to Go compiler.
	//
	// Empty value disables environment variable filter.
	BypassEnvVarsList []string `envconfig:"APP_PERMIT_ENV_VARS" json:"bypassEnvVarsList"`
}

type ServicesConfig struct {
	// GoogleAnalyticsID is Google Analytics tag ID (optional)
	GoogleAnalyticsID string `envconfig:"APP_GTAG_ID" json:"googleAnalyticsID"`
}

type Config struct {
	HTTP       HTTPConfig       `json:"http"`
	Playground PlaygroundConfig `json:"playground"`
	Build      BuildConfig      `json:"build"`
	Log        LogConfig        `json:"log"`
	Services   ServicesConfig   `json:"services"`
}

// Validate validates a config and returns error if config is invalid.
func (cfg Config) Validate() error {
	if cfg.Build.GoBuildTimeout > cfg.HTTP.WriteTimeout {
		return fmt.Errorf(
			"go build timeout (%s) exceeds HTTP response timeout (%s)",
			cfg.Build.GoBuildTimeout, cfg.HTTP.WriteTimeout,
		)
	}

	return nil
}

type SentryConfig struct {
	DSN             string        `envconfig:"SENTRY_DSN" json:"dsn"`
	UseBreadcrumbs  bool          `envconfig:"SENTRY_USE_BREADCRUMBS" json:"useBreadcrumbs"`
	BreadcrumbLevel zapcore.Level `envconfig:"SENTRY_BREADCRUMB_LEVEL" json:"breadcrumbLevel"`
}

type LogConfig struct {
	Debug  bool          `envconfig:"APP_DEBUG" json:"debug"`
	Level  zapcore.Level `envconfig:"APP_LOG_LEVEL" json:"level"`
	Format string        `envconfig:"APP_LOG_FORMAT" json:"format"`

	Sentry SentryConfig `json:"sentry"`
}

// ZapLogger constructs a new zap.Logger instance from configuration.
func (cfg LogConfig) ZapLogger() (*zap.Logger, error) {
	logCfg := zap.NewProductionConfig()
	logCfg.Development = cfg.Debug
	logCfg.Level = zap.NewAtomicLevelAt(cfg.Level)
	logCfg.Encoding = cfg.Format

	switch cfg.Format {
	case "", "json":
		logCfg.EncoderConfig = zap.NewProductionEncoderConfig()
	case "console":
		logCfg.EncoderConfig = zap.NewDevelopmentEncoderConfig()
	default:
		return nil, fmt.Errorf("unsupported log format %q", cfg.Format)
	}

	log, err := logCfg.Build()
	if err != nil {
		return nil, err
	}
	return log, nil
}
