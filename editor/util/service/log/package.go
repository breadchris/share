/*
Package log - Some utilities for logging and stats aggregation/pushing. This package wraps third
party libraries in agnostic API calls so they can be swapped.
*/
package log

import "errors"

// Errors used throughout the package.
var (
	ErrClientNil = errors.New("the client pointer was nil")
)
