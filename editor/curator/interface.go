package curator

import (
	"github.com/breadchris/share/editor/auditor"
	"github.com/breadchris/share/editor/binder"
	"github.com/breadchris/share/editor/store"
	"time"
)

// AuditorContainer - A type responsible for creating and managing auditors for
// string identified operational transform binders.
type AuditorContainer interface {
	// Get - Return a managed Auditor type for a binder ID.
	Get(binderID string) (auditor.Auditor, error)
}

//------------------------------------------------------------------------------

// Type - Provides thread safe implementations of basic document and session
// creation.
type Type interface {
	// EditDocument - Find and return a binder portal to an existing document,
	// providing metadata for identifying content produced by the client.
	EditDocument(
		userMetadata interface{}, token, documentID string, timeout time.Duration,
	) (binder.Portal, error)

	// ReadDocument - Find and return a binder portal to an existing document
	// with read only privileges, providing metadata for identifying content
	// produced by the client.
	ReadDocument(
		userMetadata interface{}, token, documentID string, timeout time.Duration,
	) (binder.Portal, error)

	// CreateDocument - Create and return a binder portal to a new document,
	// providing metadata for identifying content produced by the client.
	CreateDocument(
		userMetadata interface{}, token string, document store.Document, timeout time.Duration,
	) (binder.Portal, error)

	// Close - Close the Curator
	Close()
}

//------------------------------------------------------------------------------
