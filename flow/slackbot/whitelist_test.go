package slackbot

import (
	"strings"
	"testing"
)

func TestNewChannelWhitelist(t *testing.T) {
	tests := []struct {
		name        string
		patterns    []string
		debug       bool
		shouldError bool
	}{
		{
			name:        "empty patterns",
			patterns:    []string{},
			debug:       false,
			shouldError: false,
		},
		{
			name:        "nil patterns",
			patterns:    nil,
			debug:       false,
			shouldError: false,
		},
		{
			name:        "valid patterns",
			patterns:    []string{"^C.*DEV$", ".*test.*"},
			debug:       true,
			shouldError: false,
		},
		{
			name:        "invalid regex pattern",
			patterns:    []string{"[invalid"},
			debug:       false,
			shouldError: true,
		},
		{
			name:        "mixed valid and invalid patterns",
			patterns:    []string{"valid", "[invalid"},
			debug:       false,
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			whitelist, err := NewChannelWhitelist(tt.patterns, tt.debug)
			
			if tt.shouldError {
				if err == nil {
					t.Errorf("NewChannelWhitelist() expected error but got none")
				}
				if whitelist != nil {
					t.Errorf("NewChannelWhitelist() expected nil whitelist on error but got %v", whitelist)
				}
				return
			}
			
			if err != nil {
				t.Errorf("NewChannelWhitelist() unexpected error: %v", err)
				return
			}
			
			if whitelist == nil {
				t.Errorf("NewChannelWhitelist() returned nil whitelist")
				return
			}
			
			// Verify patterns are stored correctly
			if len(whitelist.GetPatterns()) != len(tt.patterns) {
				t.Errorf("NewChannelWhitelist() patterns count mismatch, expected %d got %d", 
					len(tt.patterns), len(whitelist.GetPatterns()))
			}
		})
	}
}

func TestChannelWhitelist_IsAllowed(t *testing.T) {
	tests := []struct {
		name      string
		patterns  []string
		channelID string
		expected  bool
	}{
		// No whitelist configured - should allow all
		{
			name:      "no whitelist - allow all",
			patterns:  []string{},
			channelID: "C1234567890",
			expected:  true,
		},
		{
			name:      "no whitelist - allow random channel",
			patterns:  nil,
			channelID: "RANDOM123",
			expected:  true,
		},
		
		// Exact matches
		{
			name:      "exact match - allowed",
			patterns:  []string{"C1234567890"},
			channelID: "C1234567890",
			expected:  true,
		},
		{
			name:      "exact match - not allowed",
			patterns:  []string{"C1234567890"},
			channelID: "C0987654321",
			expected:  false,
		},
		
		// Regex patterns
		{
			name:      "regex pattern - dev channel allowed",
			patterns:  []string{"^C.*DEV$"},
			channelID: "C1234DEV",
			expected:  true,
		},
		{
			name:      "regex pattern - dev channel not allowed",
			patterns:  []string{"^C.*DEV$"},
			channelID: "C1234PROD",
			expected:  false,
		},
		{
			name:      "wildcard pattern - test channel allowed",
			patterns:  []string{".*test.*"},
			channelID: "C123test456",
			expected:  true,
		},
		{
			name:      "wildcard pattern - test channel not allowed",
			patterns:  []string{".*test.*"},
			channelID: "C123prod456",
			expected:  false,
		},
		
		// Multiple patterns - any match wins
		{
			name:      "multiple patterns - first match",
			patterns:  []string{"^C.*DEV$", ".*test.*"},
			channelID: "C1234DEV",
			expected:  true,
		},
		{
			name:      "multiple patterns - second match",
			patterns:  []string{"^C.*DEV$", ".*test.*"},
			channelID: "C123test456",
			expected:  true,
		},
		{
			name:      "multiple patterns - no match",
			patterns:  []string{"^C.*DEV$", ".*test.*"},
			channelID: "C123prod456",
			expected:  false,
		},
		
		// Case sensitivity
		{
			name:      "case sensitive - exact match",
			patterns:  []string{"CamelCase"},
			channelID: "CamelCase",
			expected:  true,
		},
		{
			name:      "case sensitive - wrong case",
			patterns:  []string{"CamelCase"},
			channelID: "camelcase",
			expected:  false,
		},
		
		// Special regex characters
		{
			name:      "literal dot pattern",
			patterns:  []string{"C123\\.456"},
			channelID: "C123.456",
			expected:  true,
		},
		{
			name:      "literal dot pattern - should not match without escape",
			patterns:  []string{"C123.456"},  // dot matches any character
			channelID: "C123X456",
			expected:  true,
		},
		{
			name:      "escaped special chars",
			patterns:  []string{"C\\[test\\]"},
			channelID: "C[test]",
			expected:  true,
		},
		
		// Edge cases
		{
			name:      "empty channel ID",
			patterns:  []string{".*"},
			channelID: "",
			expected:  true,
		},
		{
			name:      "empty channel ID - no match",
			patterns:  []string{"^C.*"},
			channelID: "",
			expected:  false,
		},
		{
			name:      "very long channel ID",
			patterns:  []string{".*"},
			channelID: strings.Repeat("C", 1000),
			expected:  true,
		},
		{
			name:      "unicode in channel ID",
			patterns:  []string{".*测试.*"},
			channelID: "C测试123",
			expected:  true,
		},
		
		// Real Slack channel patterns
		{
			name:      "slack public channel format",
			patterns:  []string{"^C[A-Z0-9]{8,}$"},
			channelID: "C1234567890",
			expected:  true,
		},
		{
			name:      "slack private channel format",
			patterns:  []string{"^G[A-Z0-9]{8,}$"},
			channelID: "G1234567890",
			expected:  true,
		},
		{
			name:      "slack DM format",
			patterns:  []string{"^D[A-Z0-9]{8,}$"},
			channelID: "D1234567890",
			expected:  true,
		},
		{
			name:      "multiple slack formats",
			patterns:  []string{"^[CGD][A-Z0-9]{8,}$"},
			channelID: "C1234567890",
			expected:  true,
		},
		{
			name:      "multiple slack formats - group",
			patterns:  []string{"^[CGD][A-Z0-9]{8,}$"},
			channelID: "G1234567890",
			expected:  true,
		},
		{
			name:      "multiple slack formats - DM",
			patterns:  []string{"^[CGD][A-Z0-9]{8,}$"},
			channelID: "D1234567890",
			expected:  true,
		},
		{
			name:      "multiple slack formats - invalid",
			patterns:  []string{"^[CGD][A-Z0-9]{8,}$"},
			channelID: "X1234567890",
			expected:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			whitelist, err := NewChannelWhitelist(tt.patterns, false)
			if err != nil {
				t.Fatalf("NewChannelWhitelist() failed: %v", err)
			}
			
			result := whitelist.IsAllowed(tt.channelID)
			if result != tt.expected {
				t.Errorf("IsAllowed(%q) = %v, expected %v (patterns: %v)", 
					tt.channelID, result, tt.expected, tt.patterns)
			}
		})
	}
}

func TestChannelWhitelist_CompilePatterns(t *testing.T) {
	tests := []struct {
		name        string
		patterns    []string
		shouldError bool
		errorMsg    string
	}{
		{
			name:        "valid patterns",
			patterns:    []string{"^test$", ".*dev.*"},
			shouldError: false,
		},
		{
			name:        "invalid regex - unclosed bracket",
			patterns:    []string{"[invalid"},
			shouldError: true,
			errorMsg:    "invalid regex pattern '[invalid'",
		},
		{
			name:        "invalid regex - unclosed parenthesis",
			patterns:    []string{"(unclosed"},
			shouldError: true,
			errorMsg:    "invalid regex pattern '(unclosed'",
		},
		{
			name:        "complex valid pattern",
			patterns:    []string{"^[CGD][A-Z0-9]{8,}$"},
			shouldError: false,
		},
		{
			name:        "empty pattern string",
			patterns:    []string{""},
			shouldError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			whitelist := &ChannelWhitelist{
				patterns: tt.patterns,
				debug:    false,
			}
			
			err := whitelist.CompilePatterns()
			
			if tt.shouldError {
				if err == nil {
					t.Errorf("CompilePatterns() expected error but got none")
					return
				}
				if tt.errorMsg != "" && !strings.Contains(err.Error(), tt.errorMsg) {
					t.Errorf("CompilePatterns() error = %v, expected to contain %q", err, tt.errorMsg)
				}
				return
			}
			
			if err != nil {
				t.Errorf("CompilePatterns() unexpected error: %v", err)
			}
		})
	}
}

func TestChannelWhitelist_HasWhitelist(t *testing.T) {
	tests := []struct {
		name     string
		patterns []string
		expected bool
	}{
		{
			name:     "no patterns",
			patterns: []string{},
			expected: false,
		},
		{
			name:     "nil patterns",
			patterns: nil,
			expected: false,
		},
		{
			name:     "has patterns",
			patterns: []string{"test"},
			expected: true,
		},
		{
			name:     "multiple patterns",
			patterns: []string{"test1", "test2"},
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			whitelist, err := NewChannelWhitelist(tt.patterns, false)
			if err != nil {
				t.Fatalf("NewChannelWhitelist() failed: %v", err)
			}
			
			result := whitelist.HasWhitelist()
			if result != tt.expected {
				t.Errorf("HasWhitelist() = %v, expected %v", result, tt.expected)
			}
		})
	}
}

func TestChannelWhitelist_GetPatterns(t *testing.T) {
	patterns := []string{"pattern1", "pattern2", "pattern3"}
	whitelist, err := NewChannelWhitelist(patterns, false)
	if err != nil {
		t.Fatalf("NewChannelWhitelist() failed: %v", err)
	}
	
	result := whitelist.GetPatterns()
	if len(result) != len(patterns) {
		t.Errorf("GetPatterns() length = %d, expected %d", len(result), len(patterns))
	}
	
	for i, pattern := range patterns {
		if result[i] != pattern {
			t.Errorf("GetPatterns()[%d] = %q, expected %q", i, result[i], pattern)
		}
	}
}