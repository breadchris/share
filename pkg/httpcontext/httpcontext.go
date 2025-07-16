package httpcontext

import (
	"context"
	"net/http"
)

// httpContextKey is used as a key for storing HTTP-related values in context
type httpContextKey string

const (
	httpWriterKey  httpContextKey = "http.ResponseWriter"
	httpRequestKey httpContextKey = "http.Request"
)

// WithHTTP stores both http.ResponseWriter and *http.Request in the context
func WithHTTP(ctx context.Context, w http.ResponseWriter, r *http.Request) context.Context {
	ctx = context.WithValue(ctx, httpWriterKey, w)
	ctx = context.WithValue(ctx, httpRequestKey, r)
	return ctx
}

// WithWriter stores http.ResponseWriter in the context
func WithWriter(ctx context.Context, w http.ResponseWriter) context.Context {
	return context.WithValue(ctx, httpWriterKey, w)
}

// WithRequest stores *http.Request in the context
func WithRequest(ctx context.Context, r *http.Request) context.Context {
	return context.WithValue(ctx, httpRequestKey, r)
}

// HTTPWriterFromContext retrieves http.ResponseWriter from context
// Panics if not found - use TryHTTPWriterFromContext for safe access
func HTTPWriterFromContext(ctx context.Context) http.ResponseWriter {
	w, ok := TryHTTPWriterFromContext(ctx)
	if !ok {
		panic("http.ResponseWriter not found in context")
	}
	return w
}

// TryHTTPWriterFromContext safely retrieves http.ResponseWriter from context
// Returns (writer, true) if found, (nil, false) if not found
func TryHTTPWriterFromContext(ctx context.Context) (http.ResponseWriter, bool) {
	w, ok := ctx.Value(httpWriterKey).(http.ResponseWriter)
	return w, ok
}

// HTTPRequestFromContext retrieves *http.Request from context
// Panics if not found - use TryHTTPRequestFromContext for safe access
func HTTPRequestFromContext(ctx context.Context) *http.Request {
	r, ok := TryHTTPRequestFromContext(ctx)
	if !ok {
		panic("*http.Request not found in context")
	}
	return r
}

// TryHTTPRequestFromContext safely retrieves *http.Request from context
// Returns (request, true) if found, (nil, false) if not found
func TryHTTPRequestFromContext(ctx context.Context) (*http.Request, bool) {
	r, ok := ctx.Value(httpRequestKey).(*http.Request)
	return r, ok
}

// HasHTTP checks if both http.ResponseWriter and *http.Request are available in context
func HasHTTP(ctx context.Context) bool {
	_, hasWriter := TryHTTPWriterFromContext(ctx)
	_, hasRequest := TryHTTPRequestFromContext(ctx)
	return hasWriter && hasRequest
}

// HasWriter checks if http.ResponseWriter is available in context
func HasWriter(ctx context.Context) bool {
	_, has := TryHTTPWriterFromContext(ctx)
	return has
}

// HasRequest checks if *http.Request is available in context
func HasRequest(ctx context.Context) bool {
	_, has := TryHTTPRequestFromContext(ctx)
	return has
}