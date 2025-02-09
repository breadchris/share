package metrics

import (
	"errors"
	"fmt"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/Jeffail/gabs"
)

//--------------------------------------------------------------------------------------------------

func init() {
	constructors["http_server"] = typeSpec{
		constructor: NewHTTP,
		description: `
Benthos can host its own stats endpoint, where a GET request will receive a JSON
blob of all metrics tracked within Benthos.`,
	}
}

//--------------------------------------------------------------------------------------------------

// Errors for the HTTP type.
var (
	ErrTimedOut = errors.New("timed out")
)

//--------------------------------------------------------------------------------------------------

// HTTPConfig - Config for the HTTP metrics type.
type HTTPConfig struct {
	Prefix  string `json:"stats_prefix" yaml:"stats_prefix"`
	Address string `json:"address" yaml:"address"`
	Path    string `json:"path" yaml:"path"`
}

// NewHTTPConfig - Creates an HTTPConfig struct with default values.
func NewHTTPConfig() HTTPConfig {
	return HTTPConfig{
		Prefix:  "service",
		Address: "localhost:4040",
		Path:    "/stats",
	}
}

//--------------------------------------------------------------------------------------------------

// HTTP - A stats object with capability to hold internal stats as a JSON endpoint.
type HTTP struct {
	config      HTTPConfig
	jsonRoot    *gabs.Container
	json        *gabs.Container
	flatMetrics map[string]int64
	pathPrefix  string
	timestamp   time.Time

	sync.Mutex
}

// NewHTTP - Create and return a new HTTP object.
func NewHTTP(config Config) (Type, error) {
	var jsonRoot, json *gabs.Container
	var pathPrefix string

	jsonRoot = gabs.New()
	if len(config.HTTP.Prefix) > 0 {
		pathPrefix = config.HTTP.Prefix + "."
		json, _ = jsonRoot.ObjectP(config.HTTP.Prefix)
	} else {
		json = jsonRoot
	}

	t := &HTTP{
		config:      config.HTTP,
		jsonRoot:    jsonRoot,
		json:        json,
		flatMetrics: map[string]int64{},
		pathPrefix:  pathPrefix,
		timestamp:   time.Now(),
	}

	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc(config.HTTP.Path, t.JSONHandler())

		http.ListenAndServe(config.HTTP.Address, mux)
	}()

	return t, nil
}

//--------------------------------------------------------------------------------------------------

// JSONHandler - Returns a handler for accessing metrics as a JSON blob.
func (h *HTTP) JSONHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uptime := time.Since(h.timestamp).String()
		goroutines := runtime.NumGoroutine()

		h.Lock()

		h.json.SetP(fmt.Sprintf("%v", uptime), "uptime")
		h.json.SetP(goroutines, "goroutines")
		blob := h.jsonRoot.Bytes()

		h.Unlock()

		w.Header().Set("Content-Type", "application/json")
		w.Write(blob)
	}
}

// Incr - Increment a stat by a value.
func (h *HTTP) Incr(stat string, value int64) error {
	h.Lock()
	total, _ := h.flatMetrics[stat]
	total += value

	h.flatMetrics[stat] = total
	h.json.SetP(total, stat)
	h.Unlock()
	return nil
}

// Decr - Decrement a stat by a value.
func (h *HTTP) Decr(stat string, value int64) error {
	h.Lock()
	total, _ := h.flatMetrics[stat]
	total -= value

	h.flatMetrics[stat] = total
	h.json.SetP(total, stat)
	h.Unlock()
	return nil
}

// Timing - SetMap a stat representing a duration.
func (h *HTTP) Timing(stat string, delta int64) error {
	readable := time.Duration(delta).String()

	h.Lock()
	h.json.SetP(delta, stat)
	h.json.SetP(readable, stat+"_readable")
	h.Unlock()
	return nil
}

// Gauge - SetMap a stat as a gauge value.
func (h *HTTP) Gauge(stat string, value int64) error {
	h.Lock()
	h.json.SetP(value, stat)
	h.Unlock()
	return nil
}

// Close - Stops the HTTP object from aggregating metrics and cleans up resources.
func (h *HTTP) Close() error {
	return nil
}

//--------------------------------------------------------------------------------------------------
