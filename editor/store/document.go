package store

import (
	"github.com/breadchris/share/editor/util"
)

//------------------------------------------------------------------------------

// Document - A representation of a leap document, must have a unique ID.
type Document struct {
	ID      string `json:"id" yaml:"id"`
	Content string `json:"content" yaml:"content"`
}

//------------------------------------------------------------------------------

// NewDocument - Create a document with content and a generated UUID.
func NewDocument(content string) Document {
	return Document{
		ID:      util.GenerateStampedUUID(),
		Content: content,
	}
}

//------------------------------------------------------------------------------
