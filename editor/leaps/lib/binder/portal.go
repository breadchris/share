package binder

import (
	"errors"
	"time"

	"github.com/breadchris/share/editor/leaps/lib/store"
	"github.com/breadchris/share/editor/leaps/lib/text"
)

//------------------------------------------------------------------------------

// Errors for the binder portal type.
var (
	ErrReadOnlyPortal = errors.New("attempting to send transforms through a READ ONLY portal")
)

//------------------------------------------------------------------------------

// portalImpl - Represents a connection between a client and an active binder.
// This includes channels for sending transforms and metadata into the binder as
// well as channels for reading broadcast transforms and metadata from other
// clients.
type portalImpl struct {
	client   *binderClient
	document store.Document
	version  int

	transformRcvChan <-chan text.OTransform
	metadataRcvChan  <-chan ClientMetadata

	transformSndChan chan<- transformSubmission
	metadataSndChan  chan<- metadataSubmission
	exitChan         chan<- *binderClient
}

// ClientMetadata - Returns the client metadata associated with this portal.
func (p *portalImpl) ClientMetadata() interface{} {
	return p.client.metadata
}

// BaseVersion - Returns the version of the binder when this session opened.
func (p *portalImpl) BaseVersion() int {
	return p.version
}

// Document - Returns the document contents as it was when the session was
// opened.
func (p *portalImpl) Document() store.Document {
	return p.document
}

// ReleaseDocument - Releases the content cached for the underlying document.
func (p *portalImpl) ReleaseDocument() {
	p.document.Content = ""
}

// TransformReadChan - Returns a channel for receiving live transforms from the
// binder.
func (p *portalImpl) TransformReadChan() <-chan text.OTransform {
	return p.transformRcvChan
}

// MetadataReadChan - Returns a channel for receiving metadata from clients
// connected to this binder.
func (p *portalImpl) MetadataReadChan() <-chan ClientMetadata {
	return p.metadataRcvChan
}

// SendTransform - Submits a transform to the binder. The binder responds with
// either an error or a corrected version number for the transform. This is safe
// to call from any goroutine.
func (p *portalImpl) SendTransform(ot text.OTransform, timeout time.Duration) (int, error) {
	// Check if we are READ ONLY
	if nil == p.transformSndChan {
		return 0, ErrReadOnlyPortal
	}
	// Buffered channels because the server skips blocked sends
	errChan := make(chan error, 1)
	verChan := make(chan int, 1)
	p.transformSndChan <- transformSubmission{
		client:      p.client,
		transform:   ot,
		versionChan: verChan,
		errorChan:   errChan,
	}
	select {
	case err := <-errChan:
		return 0, err
	case ver := <-verChan:
		return ver, nil
	case <-time.After(timeout):
	}
	return 0, ErrTimeout
}

// SendMetadata - Sends metadata to the binder, which is subsequently sent out
// to all other clients. This is safe to call from any goroutine.
func (p *portalImpl) SendMetadata(metadata interface{}) {
	p.metadataSndChan <- metadataSubmission{
		client:   p.client,
		metadata: metadata,
	}
}

// Exit - Inform the binder that this client is shutting down.
func (p *portalImpl) Exit(timeout time.Duration) {
	select {
	case p.exitChan <- p.client:
	case <-time.After(timeout):
	}
}

//------------------------------------------------------------------------------
