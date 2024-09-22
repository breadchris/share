package metrics

//--------------------------------------------------------------------------------------------------

// DudType - Implements the Type interface but doesn't actual do anything.
type DudType struct{}

// Incr - Does nothing.
func (d DudType) Incr(path string, count int64) error { return nil }

// Decr - Does nothing.
func (d DudType) Decr(path string, count int64) error { return nil }

// Timing - Does nothing.
func (d DudType) Timing(path string, delta int64) error { return nil }

// Gauge - Does nothing.
func (d DudType) Gauge(path string, value int64) error { return nil }

// Close - Does nothing.
func (d DudType) Close() error { return nil }

//--------------------------------------------------------------------------------------------------
