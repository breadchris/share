package slackbot

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/breadchris/flow/claude"
	"github.com/slack-go/slack"
)

// formatClaudeResponse converts Claude markdown to Slack-compatible format
func (b *SlackBot) formatClaudeResponse(content string) string {
	if content == "" {
		return ""
	}

	// Handle truncation if message is too long
	content, truncated := b.truncateMessage(content)

	// Convert Claude markdown to Slack markdown
	formatted := b.convertMarkdownToSlack(content)

	if truncated {
		formatted += "\n\n_...message truncated due to length limits_"
	}

	return formatted
}

// convertMarkdownToSlack converts common markdown patterns to Slack format
func (b *SlackBot) convertMarkdownToSlack(content string) string {
	// Slack uses different markdown syntax than standard markdown

	// Handle code blocks - Slack uses triple backticks with optional language
	codeBlockRegex := regexp.MustCompile("```([a-zA-Z]*)\n(.*?)\n```")
	content = codeBlockRegex.ReplaceAllStringFunc(content, func(match string) string {
		parts := codeBlockRegex.FindStringSubmatch(match)
		if len(parts) == 3 {
			lang := parts[1]
			code := parts[2]
			if lang != "" {
				return fmt.Sprintf("```%s\n%s\n```", lang, code)
			}
			return fmt.Sprintf("```\n%s\n```", code)
		}
		return match
	})

	// Handle inline code - Slack uses single backticks like standard markdown
	// No changes needed for inline code

	// Handle bold text - Slack uses *bold* instead of **bold**
	boldRegex := regexp.MustCompile(`\*\*(.*?)\*\*`)
	content = boldRegex.ReplaceAllString(content, "*$1*")

	// Handle italic text - Slack uses _italic_ instead of *italic*
	// But we need to be careful not to affect bold text we just converted
	italicRegex := regexp.MustCompile(`(?:^|[^*])\*([^*]+?)\*(?:[^*]|$)`)
	content = italicRegex.ReplaceAllStringFunc(content, func(match string) string {
		// Extract the italic content
		parts := italicRegex.FindStringSubmatch(match)
		if len(parts) >= 2 {
			before := match[:len(match)-len(parts[0])+strings.Index(parts[0], "*")]
			after := match[len(match)-len(parts[0])+strings.Index(parts[0], "*")+len(parts[1])+2:]
			return before + "_" + parts[1] + "_" + after
		}
		return match
	})

	// Handle strikethrough - Slack uses ~text~ instead of ~~text~~
	strikeRegex := regexp.MustCompile(`~~(.*?)~~`)
	content = strikeRegex.ReplaceAllString(content, "~$1~")

	// Handle links - Convert [text](url) to <url|text>
	linkRegex := regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
	content = linkRegex.ReplaceAllString(content, "<$2|$1>")

	return content
}

// formatToolUse creates a Slack-friendly display of tool usage
func (b *SlackBot) formatToolUse(msg *claude.Message) string {
	if msg.Type != "tool_use" {
		return ""
	}

	var builder strings.Builder

	// Handle different tool use subtypes
	switch msg.Subtype {
	case "start":
		// Tool is starting - minimal display
		builder.WriteString("\n🔧 _Using tools..._\n")
		
	case "result":
		// Tool completed - show result
		builder.WriteString("\n\n---\n")
		builder.WriteString("🔧 **Tool Result**\n")
		
		// Check both Message and Result fields for content
		var content string
		if len(msg.Message) > 0 {
			content = string(msg.Message)
		} else if msg.Result != "" {
			content = msg.Result
		}
		
		if content != "" {
			// Format the content based on its type
			if strings.HasPrefix(content, "{") || strings.HasPrefix(content, "[") {
				// Looks like JSON, format as code block
				builder.WriteString(fmt.Sprintf("```json\n%s\n```", content))
			} else if strings.Contains(content, "\n") {
				// Multi-line content, use code block
				builder.WriteString(fmt.Sprintf("```\n%s\n```", content))
			} else {
				// Single line content, just show it
				builder.WriteString(fmt.Sprintf("`%s`", content))
			}
		}
		
		builder.WriteString("\n---\n\n")
		
	default:
		// Generic tool use message
		builder.WriteString("\n🔧 **Tool Usage**\n")
		
		// Show any available content
		var content string
		if len(msg.Message) > 0 {
			content = string(msg.Message)
		} else if msg.Result != "" {
			content = msg.Result
		}
		
		if content != "" {
			builder.WriteString(fmt.Sprintf("```\n%s\n```", content))
		}
		
		builder.WriteString("\n")
	}

	return builder.String()
}

// truncateMessage handles Slack's 4000 character limit
func (b *SlackBot) truncateMessage(content string) (string, bool) {
	const maxLength = 3900 // Leave some room for truncation notice

	if len(content) <= maxLength {
		return content, false
	}

	// Try to truncate at a word boundary
	truncated := content[:maxLength]

	// Find the last space to avoid cutting words
	lastSpace := strings.LastIndex(truncated, " ")
	if lastSpace > maxLength-200 { // Only use word boundary if it's not too far back
		truncated = truncated[:lastSpace]
	}

	// Try to end at a complete sentence
	lastSentence := strings.LastIndexAny(truncated, ".!?")
	if lastSentence > maxLength-400 { // Only use sentence boundary if it's not too far back
		truncated = truncated[:lastSentence+1]
	}

	return truncated, true
}

// formatErrorMessage creates a user-friendly error message
func (b *SlackBot) formatErrorMessage(err error, context string) string {
	return fmt.Sprintf("❌ %s: %s", context, err.Error())
}

// formatSuccessMessage creates a user-friendly success message
func (b *SlackBot) formatSuccessMessage(message string) string {
	return fmt.Sprintf("✅ %s", message)
}

// formatThinkingMessage creates a thinking indicator
func (b *SlackBot) formatThinkingMessage() string {
	return "🤔 _Claude is thinking..._"
}

// formatTypingMessage creates a typing indicator
func (b *SlackBot) formatTypingMessage() string {
	return "💭 _Claude is typing..._"
}

// formatProcessingMessage creates a processing indicator for tool use
func (b *SlackBot) formatProcessingMessage(tool string) string {
	return fmt.Sprintf("⚙️ _Claude is using %s..._", tool)
}

// addReactionToMessage adds a reaction emoji to a message (helper for future use)
func (b *SlackBot) addReactionToMessage(channel, timestamp, emoji string) error {
	return b.client.AddReaction(emoji, slack.ItemRef{
		Channel:   channel,
		Timestamp: timestamp,
	})
}

// removeReactionFromMessage removes a reaction emoji from a message (helper for future use)
func (b *SlackBot) removeReactionFromMessage(channel, timestamp, emoji string) error {
	return b.client.RemoveReaction(emoji, slack.ItemRef{
		Channel:   channel,
		Timestamp: timestamp,
	})
}
