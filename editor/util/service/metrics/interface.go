package metrics

// Type - An interface for metrics aggregation.
type Type interface {
	// Incr - Increment a metric by an amount.
	Incr(path string, count int64) error

	// Decr - Decrement a metric by an amount.
	Decr(path string, count int64) error

	// Timing - SetMap a timing metric.
	Timing(path string, delta int64) error

	// Gauge - SetMap a gauge metric.
	Gauge(path string, value int64) error

	// Close - Stop aggregating stats and clean up resources.
	Close() error
}
