package slackbot

import (
	"sync"
	"time"
)

// SlackBotSessionCache implements SessionCache interface using SlackBot's existing session management
type SlackBotSessionCache struct {
	sessions map[string]*SlackClaudeSession
	mu       sync.RWMutex
}

// NewSlackBotSessionCache creates a new session cache
func NewSlackBotSessionCache() *SlackBotSessionCache {
	return &SlackBotSessionCache{
		sessions: make(map[string]*SlackClaudeSession),
	}
}

// GetSession retrieves a session from the cache
func (sc *SlackBotSessionCache) GetSession(threadTS string) (*SlackClaudeSession, bool) {
	sc.mu.RLock()
	defer sc.mu.RUnlock()
	session, exists := sc.sessions[threadTS]
	return session, exists
}

// SetSession stores a session in the cache
func (sc *SlackBotSessionCache) SetSession(threadTS string, session *SlackClaudeSession) {
	sc.mu.Lock()
	defer sc.mu.Unlock()
	sc.sessions[threadTS] = session
}

// UpdateSessionActivity updates the last activity time for a session in cache
func (sc *SlackBotSessionCache) UpdateSessionActivity(threadTS string) {
	sc.mu.Lock()
	defer sc.mu.Unlock()
	if session, exists := sc.sessions[threadTS]; exists {
		session.LastActivity = time.Now()
	}
}

// Remove removes a session from the cache
func (sc *SlackBotSessionCache) Remove(threadTS string) {
	sc.mu.Lock()
	defer sc.mu.Unlock()
	delete(sc.sessions, threadTS)
}

// Count returns the number of sessions in cache
func (sc *SlackBotSessionCache) Count() int {
	sc.mu.RLock()
	defer sc.mu.RUnlock()
	return len(sc.sessions)
}