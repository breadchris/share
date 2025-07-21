package slackbot

import (
	"fmt"
	"log/slog"
	"regexp"
)

// ChannelWhitelist manages channel access control using regex patterns
type ChannelWhitelist struct {
	patterns []string
	regexes  []*regexp.Regexp
	debug    bool
}

// NewChannelWhitelist creates a new channel whitelist
func NewChannelWhitelist(patterns []string, debug bool) (*ChannelWhitelist, error) {
	whitelist := &ChannelWhitelist{
		patterns: patterns,
		debug:    debug,
	}
	
	if err := whitelist.CompilePatterns(); err != nil {
		return nil, err
	}
	
	return whitelist, nil
}

// CompilePatterns compiles regex patterns for channel whitelist
func (w *ChannelWhitelist) CompilePatterns() error {
	if len(w.patterns) == 0 {
		// No whitelist configured - allow all channels
		w.regexes = nil
		return nil
	}

	w.regexes = make([]*regexp.Regexp, 0, len(w.patterns))

	for _, pattern := range w.patterns {
		regex, err := regexp.Compile(pattern)
		if err != nil {
			return fmt.Errorf("invalid regex pattern '%s': %w", pattern, err)
		}
		w.regexes = append(w.regexes, regex)
	}

	if w.debug {
		slog.Debug("Compiled channel whitelist patterns",
			"patterns", w.patterns,
			"count", len(w.regexes))
	}

	return nil
}

// IsAllowed checks if a channel ID matches the whitelist patterns
func (w *ChannelWhitelist) IsAllowed(channelID string) bool {
	// If no whitelist is configured, allow all channels
	if len(w.regexes) == 0 {
		return true
	}

	// Check if channel matches any whitelist pattern
	for _, regex := range w.regexes {
		if regex.MatchString(channelID) {
			if w.debug {
				slog.Debug("Channel allowed by whitelist",
					"channel_id", channelID,
					"pattern", regex.String())
			}
			return true
		}
	}

	if w.debug {
		slog.Debug("Channel rejected by whitelist",
			"channel_id", channelID,
			"whitelist_patterns", w.patterns)
	}

	return false
}

// GetPatterns returns the configured patterns
func (w *ChannelWhitelist) GetPatterns() []string {
	return w.patterns
}

// HasWhitelist returns true if whitelist patterns are configured
func (w *ChannelWhitelist) HasWhitelist() bool {
	return len(w.patterns) > 0
}