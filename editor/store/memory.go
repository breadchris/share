package store

import (
	"errors"
	"sync"
)

//--------------------------------------------------------------------------------------------------

// Errors for the Memory type.
var (
	ErrDocumentNotExist = errors.New("attempted to fetch memory doc that has not been initialized")
)

// Memory - Simply keeps documents in memory. Has zero persistence across sessions.
type Memory struct {
	documents map[string]Document
	mutex     sync.RWMutex
}

// NewMemory - Returns a Memory store type.
func NewMemory() Type {
	return &Memory{
		documents: make(map[string]Document),
	}
}

// Create - Store document in memory.
func (s *Memory) Create(doc Document) error {
	return s.Update(doc)
}

// Update - Update document in memory.
func (s *Memory) Update(doc Document) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.documents[doc.ID] = doc
	return nil
}

// Read - Read document from memory.
func (s *Memory) Read(id string) (Document, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	doc, ok := s.documents[id]
	if !ok {
		return doc, ErrDocumentNotExist
	}
	return doc, nil
}

//--------------------------------------------------------------------------------------------------
