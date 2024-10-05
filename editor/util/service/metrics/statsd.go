package metrics

import (
	"fmt"
	"time"

	"gopkg.in/alexcesaro/statsd.v2"
)

//--------------------------------------------------------------------------------------------------

func init() {
	constructors["statsd"] = typeSpec{
		constructor: NewStatsd,
		description: `Use the statsd protocol.`,
	}
}

//--------------------------------------------------------------------------------------------------

// StatsdConfig - Config for the Statsd metrics type.
type StatsdConfig struct {
	Address       string `json:"address" yaml:"address"`
	FlushPeriod   string `json:"flush_period" yaml:"flush_period"`
	MaxPacketSize int    `json:"max_packet_size" yaml:"max_packet_size"`
	Network       string `json:"network" yaml:"network"`
	Prefix        string `json:"prefix" yaml:"prefix"`
}

// NewStatsdConfig - Creates an StatsdConfig struct with default values.
func NewStatsdConfig() StatsdConfig {
	return StatsdConfig{
		Address:       "localhost:4040",
		FlushPeriod:   "100ms",
		MaxPacketSize: 1440,
		Network:       "udp",
		Prefix:        "",
	}
}

//--------------------------------------------------------------------------------------------------

// Statsd - A stats object with capability to hold internal stats as a JSON endpoint.
type Statsd struct {
	config Config
	s      *statsd.Client
}

// NewStatsd - Create and return a new Statsd object.
func NewStatsd(config Config) (Type, error) {
	flushPeriod, err := time.ParseDuration(config.Statsd.FlushPeriod)
	if err != nil {
		return nil, fmt.Errorf("Failed to parse flush period: %s", err)
	}
	c, err := statsd.New(
		statsd.Address(config.Statsd.Address),
		statsd.FlushPeriod(flushPeriod),
		statsd.MaxPacketSize(config.Statsd.MaxPacketSize),
		statsd.Network(config.Statsd.Network),
		statsd.Prefix(config.Statsd.Prefix),
	)
	if err != nil {
		return nil, err
	}
	return &Statsd{
		config: config,
		s:      c,
	}, nil
}

//--------------------------------------------------------------------------------------------------

// Incr - Increment a stat by a value.
func (h *Statsd) Incr(stat string, value int64) error {
	h.s.Count(stat, value)
	return nil
}

// Decr - Decrement a stat by a value.
func (h *Statsd) Decr(stat string, value int64) error {
	h.s.Count(stat, -value)
	return nil
}

// Timing - Set a stat representing a duration.
func (h *Statsd) Timing(stat string, delta int64) error {
	h.s.Timing(stat, delta)
	return nil
}

// Gauge - Set a stat as a gauge value.
func (h *Statsd) Gauge(stat string, value int64) error {
	h.s.Gauge(stat, value)
	return nil
}

// Close - Stops the Statsd object from aggregating metrics and cleans up resources.
func (h *Statsd) Close() error {
	h.s.Close()
	return nil
}

//--------------------------------------------------------------------------------------------------
