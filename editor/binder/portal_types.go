package binder

import (
	"github.com/breadchris/share/editor/text"
)

//------------------------------------------------------------------------------

// Error - A binder has encountered a problem and needs to close. In order for
// this to happen it needs to inform its owner that it should be shut down.
// Error is a structure used to carry our error message and our ID over an error
// channel. An Error with the Err set to nil can be used as a graceful shutdown
// request.
type Error struct {
	ID  string
	Err error
}

//------------------------------------------------------------------------------

// ClientMetadata - Clients can send metadata through a binder to be broadcast
// to all other clients. This metadata comes with the user metadata already
// associated with the sending client.
type ClientMetadata struct {
	Client   interface{} `json:"client"`
	Metadata interface{} `json:"metadata"`
}

//------------------------------------------------------------------------------

// transformSubmission - A struct used to submit a transform to an active
// binder, the struct carries data about the client as well as the transform
// itself, along with channels used for returning the response from the binder
// (error or version adjustment).
type transformSubmission struct {
	client      *binderClient
	transform   text.OTransform
	versionChan chan<- int
	errorChan   chan<- error
}

// metadataSubmission - A struct used to submit document specific user metadata
// to an active binder, the struct carries data about the client as well as the
// metadata content.
type metadataSubmission struct {
	client   *binderClient
	metadata interface{}
}

//------------------------------------------------------------------------------

// binderClient - A struct containing channels for writing transforms and
// metadata to a client. Also contains user metadata for identifying this client
// (name, session id, etc) which is unused within the binder but will be
// attached to any transforms or metadata submissions from this client.
type binderClient struct {
	metadata interface{}

	transformChan chan<- text.OTransform
	metadataChan  chan<- ClientMetadata
}

//------------------------------------------------------------------------------
