package slackbot

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/sashabaranov/go-openai"
)

// IdeationResponse represents the structured response from ChatGPT for ideation
type IdeationResponse struct {
	Summary  string     `json:"summary"`
	Features []Feature  `json:"features"`
}

// Feature represents a feature suggestion from ChatGPT
type Feature struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Priority    string `json:"priority"`
	Complexity  string `json:"complexity"`
}

// ChatGPTService handles interactions with OpenAI's ChatGPT
type ChatGPTService struct {
	client *openai.Client
	debug  bool
}

// NewChatGPTService creates a new ChatGPT service
func NewChatGPTService(client *openai.Client, debug bool) *ChatGPTService {
	return &ChatGPTService{
		client: client,
		debug:  debug,
	}
}

// GenerateInitialIdeas generates initial feature ideas for a given concept
func (c *ChatGPTService) GenerateInitialIdeas(ctx context.Context, idea string) (*IdeationResponse, error) {
	if c.client == nil {
		return nil, fmt.Errorf("OpenAI client not configured")
	}

	systemPrompt := `You are a product ideation assistant that helps users brainstorm features for their app or product ideas. 

Your role is to:
1. Analyze the user's concept and understand their vision
2. Generate 5-7 concrete, actionable features that would make the product valuable
3. Categorize features by type (Core, Social, Analytics, UX, etc.)
4. Assess priority (High, Medium, Low) and complexity (Simple, Medium, Complex)
5. Provide clear, compelling descriptions that explain the value

Focus on features that are:
- Practical and implementable
- User-centered and valuable
- Well-scoped (not too broad or too narrow)
- Diverse across different aspects of the product

Return your response in the specified JSON format.`

	userPrompt := fmt.Sprintf(`Please analyze this product idea and generate initial feature suggestions:

"%s"

Consider what would make this product successful, what users would need, and what would differentiate it from competitors. Think about core functionality, user experience, social features, analytics, and growth opportunities.`, idea)

	// Define the response schema
	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"summary": map[string]interface{}{
				"type":        "string",
				"description": "A brief summary of the product concept and its key value proposition",
			},
			"features": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"id": map[string]interface{}{
							"type":        "string",
							"description": "Unique identifier for the feature",
						},
						"title": map[string]interface{}{
							"type":        "string",
							"description": "Short, catchy title for the feature",
						},
						"description": map[string]interface{}{
							"type":        "string",
							"description": "Detailed description of what the feature does and its value",
						},
						"category": map[string]interface{}{
							"type":        "string",
							"description": "Feature category (Core, Social, Analytics, UX, Growth, etc.)",
						},
						"priority": map[string]interface{}{
							"type":        "string",
							"enum":        []string{"High", "Medium", "Low"},
							"description": "Implementation priority",
						},
						"complexity": map[string]interface{}{
							"type":        "string",
							"enum":        []string{"Simple", "Medium", "Complex"},
							"description": "Implementation complexity",
						},
					},
					"required": []string{"id", "title", "description", "category", "priority", "complexity"},
				},
			},
		},
		"required": []string{"summary", "features"},
	}

	req := openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: userPrompt,
			},
		},
		Tools: []openai.Tool{
			{
				Type: "function",
				Function: &openai.FunctionDefinition{
					Name:        "generate_feature_ideas",
					Description: "Generate structured feature ideas for a product concept",
					Parameters:  schema,
				},
			},
		},
		ToolChoice: openai.ToolChoice{
			Type: "function",
			Function: openai.ToolFunction{
				Name: "generate_feature_ideas",
			},
		},
		Temperature: 0.7,
	}

	if c.debug {
		slog.Debug("Sending ChatGPT ideation request", "idea", idea)
	}

	resp, err := c.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to create chat completion: %w", err)
	}

	if len(resp.Choices) == 0 || len(resp.Choices[0].Message.ToolCalls) == 0 {
		return nil, fmt.Errorf("no tool calls in response")
	}

	toolCall := resp.Choices[0].Message.ToolCalls[0]
	var ideationResponse IdeationResponse
	if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &ideationResponse); err != nil {
		return nil, fmt.Errorf("failed to unmarshal ideation response: %w", err)
	}

	if c.debug {
		slog.Debug("Generated features", "count", len(ideationResponse.Features))
	}

	return &ideationResponse, nil
}

// ExpandIdeas generates additional features based on user preferences
func (c *ChatGPTService) ExpandIdeas(ctx context.Context, originalIdea string, likedFeatures []Feature, preferences map[string]int) (*IdeationResponse, error) {
	if c.client == nil {
		return nil, fmt.Errorf("OpenAI client not configured")
	}

	systemPrompt := `You are a product ideation assistant that expands on successful feature ideas based on user feedback.

Your role is to:
1. Analyze which features the user liked (based on their reactions)
2. Understand the patterns in their preferences
3. Generate 3-5 additional features that align with their preferences
4. Build upon the themes and categories they showed interest in
5. Suggest complementary features that enhance the liked ones

Focus on features that:
- Align with demonstrated user preferences
- Complement and enhance the features they already liked
- Follow similar patterns in complexity and category
- Add value to the overall product vision

Return your response in the specified JSON format.`

	// Build context about liked features
	likedFeatureTexts := make([]string, len(likedFeatures))
	categories := make(map[string]int)
	complexities := make(map[string]int)

	for i, feature := range likedFeatures {
		likedFeatureTexts[i] = fmt.Sprintf("- %s (%s): %s", feature.Title, feature.Category, feature.Description)
		categories[feature.Category]++
		complexities[feature.Complexity]++
	}

	userPrompt := fmt.Sprintf(`Original product idea: "%s"

Features the user liked:
%s

User preferences from emoji reactions:
- 👍 reactions: %d
- 🔥 priority reactions: %d  
- ❤️ love reactions: %d

Based on these preferences, please generate 3-5 additional features that align with what the user is interested in. Focus on the categories and types of features they responded positively to.`,
		originalIdea,
		strings.Join(likedFeatureTexts, "\n"),
		preferences["👍"],
		preferences["🔥"],
		preferences["❤️"])

	// Use same schema as initial ideas
	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"summary": map[string]interface{}{
				"type":        "string",
				"description": "Summary of how these features build on user preferences",
			},
			"features": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"id": map[string]interface{}{
							"type":        "string",
							"description": "Unique identifier for the feature",
						},
						"title": map[string]interface{}{
							"type":        "string",
							"description": "Short, catchy title for the feature",
						},
						"description": map[string]interface{}{
							"type":        "string",
							"description": "Detailed description of what the feature does and its value",
						},
						"category": map[string]interface{}{
							"type":        "string",
							"description": "Feature category (Core, Social, Analytics, UX, Growth, etc.)",
						},
						"priority": map[string]interface{}{
							"type":        "string",
							"enum":        []string{"High", "Medium", "Low"},
							"description": "Implementation priority",
						},
						"complexity": map[string]interface{}{
							"type":        "string",
							"enum":        []string{"Simple", "Medium", "Complex"},
							"description": "Implementation complexity",
						},
					},
					"required": []string{"id", "title", "description", "category", "priority", "complexity"},
				},
			},
		},
		"required": []string{"summary", "features"},
	}

	req := openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: userPrompt,
			},
		},
		Tools: []openai.Tool{
			{
				Type: "function",
				Function: &openai.FunctionDefinition{
					Name:        "expand_feature_ideas",
					Description: "Generate additional features based on user preferences",
					Parameters:  schema,
				},
			},
		},
		ToolChoice: openai.ToolChoice{
			Type: "function",
			Function: openai.ToolFunction{
				Name: "expand_feature_ideas",
			},
		},
		Temperature: 0.7,
	}

	if c.debug {
		slog.Debug("Sending ChatGPT expansion request", "liked_features", len(likedFeatures))
	}

	resp, err := c.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to create chat completion: %w", err)
	}

	if len(resp.Choices) == 0 || len(resp.Choices[0].Message.ToolCalls) == 0 {
		return nil, fmt.Errorf("no tool calls in response")
	}

	toolCall := resp.Choices[0].Message.ToolCalls[0]
	var ideationResponse IdeationResponse
	if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &ideationResponse); err != nil {
		return nil, fmt.Errorf("failed to unmarshal expansion response: %w", err)
	}

	if c.debug {
		slog.Debug("Generated expanded features", "count", len(ideationResponse.Features))
	}

	return &ideationResponse, nil
}

// GenerateClaudeContext creates a comprehensive context for Claude based on ideation session
func (c *ChatGPTService) GenerateClaudeContext(ctx context.Context, session *IdeationSession) (string, error) {
	if c.client == nil {
		return "", fmt.Errorf("OpenAI client not configured")
	}

	systemPrompt := `You are a technical assistant that creates comprehensive development briefs for Claude (an AI coding assistant).

Your role is to:
1. Analyze the ideation session and user preferences
2. Create a detailed, technical brief that Claude can use for implementation
3. Include prioritized features, technical considerations, and user feedback
4. Structure the brief in a way that helps Claude understand the full context
5. Translate user feedback into actionable development requirements

Create a comprehensive brief that includes:
- Product overview and vision
- Prioritized feature list based on user reactions
- Technical architecture suggestions
- User experience considerations
- Implementation roadmap

The brief should be detailed enough for Claude to start technical implementation immediately.`

	// Build feature lists based on reactions
	highPriorityFeatures := []Feature{}
	mediumPriorityFeatures := []Feature{}
	likedFeatures := []Feature{}

	for _, feature := range session.Features {
		if feature.Priority == "High" || session.Preferences["🔥"] > 0 {
			highPriorityFeatures = append(highPriorityFeatures, feature)
		} else if feature.Priority == "Medium" {
			mediumPriorityFeatures = append(mediumPriorityFeatures, feature)
		}

		// Check if feature was liked (positive reactions)
		if session.Preferences["👍"] > 0 || session.Preferences["❤️"] > 0 {
			likedFeatures = append(likedFeatures, feature)
		}
	}

	userPrompt := fmt.Sprintf(`Create a comprehensive development brief for Claude based on this ideation session:

**Original Idea:** %s

**User Feedback Summary:**
- Total features generated: %d
- Positive reactions (👍): %d
- Priority reactions (🔥): %d
- Love reactions (❤️): %d

**High Priority Features:**
%s

**Medium Priority Features:**
%s

**User's Preferred Feature Categories:**
%s

Please create a detailed technical brief that Claude can use to start implementation. Include architecture suggestions, technology stack recommendations, and a clear development roadmap.`,
		session.OriginalIdea,
		len(session.Features),
		session.Preferences["👍"],
		session.Preferences["🔥"],
		session.Preferences["❤️"],
		c.formatFeatureList(highPriorityFeatures),
		c.formatFeatureList(mediumPriorityFeatures),
		c.getPreferredCategories(session.Features, session.Preferences))

	req := openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: userPrompt,
			},
		},
		Temperature: 0.3, // Lower temperature for more focused technical output
	}

	if c.debug {
		slog.Debug("Generating Claude context", "session_id", session.SessionID)
	}

	resp, err := c.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return "", fmt.Errorf("failed to create chat completion: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	contextBrief := resp.Choices[0].Message.Content

	if c.debug {
		slog.Debug("Generated Claude context", "length", len(contextBrief))
	}

	return contextBrief, nil
}

// formatFeatureList formats a list of features for display
func (c *ChatGPTService) formatFeatureList(features []Feature) string {
	if len(features) == 0 {
		return "None"
	}

	var formatted []string
	for _, feature := range features {
		formatted = append(formatted, fmt.Sprintf("- %s (%s, %s): %s",
			feature.Title, feature.Category, feature.Complexity, feature.Description))
	}
	return strings.Join(formatted, "\n")
}

// getPreferredCategories identifies the categories users showed interest in
func (c *ChatGPTService) getPreferredCategories(features []Feature, preferences map[string]int) string {
	categoryCount := make(map[string]int)
	
	// Count features by category (assuming positive reactions indicate preference)
	totalReactions := preferences["👍"] + preferences["🔥"] + preferences["❤️"]
	if totalReactions > 0 {
		for _, feature := range features {
			categoryCount[feature.Category]++
		}
	}

	if len(categoryCount) == 0 {
		return "No clear preferences identified"
	}

	var categories []string
	for category, count := range categoryCount {
		categories = append(categories, fmt.Sprintf("%s (%d features)", category, count))
	}

	return strings.Join(categories, ", ")
}

// GenerateContextSummary creates intelligent context summaries for threads
func (c *ChatGPTService) GenerateContextSummary(ctx context.Context, sessionType string, promptData string) (*ContextSummaryResponse, error) {
	if c.client == nil {
		return nil, fmt.Errorf("OpenAI client not configured")
	}

	systemPrompt := `You are a context summarization assistant that creates concise, actionable summaries of user sessions.

Your role is to:
1. Analyze the session data and extract key information
2. Create a brief, clear summary of progress made
3. Identify the most relevant next steps for the user
4. Highlight important metrics or insights

Focus on:
- What has been accomplished so far
- Current state and progress
- Clear, actionable next steps
- User preferences and patterns

Keep summaries concise but informative, suitable for quick understanding when users return to threads.`

	userPrompt := fmt.Sprintf(`Please analyze this %s session and create a context summary:

%s

Provide a JSON response with:
1. "summary": Brief description of current progress (max 100 words)
2. "next_steps": Array of 2-4 specific actionable next steps
3. "insights": Key insights about user preferences or session patterns
4. "status": Current status (active, completed, ready_for_next_phase, etc.)`, sessionType, promptData)

	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"summary": map[string]interface{}{
				"type":        "string",
				"description": "Brief, clear summary of session progress and current state",
				"maxLength":   200,
			},
			"next_steps": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type":        "string",
					"description": "Specific actionable step the user can take",
				},
				"maxItems":    4,
				"description": "Array of specific, actionable next steps",
			},
			"insights": map[string]interface{}{
				"type":        "string",
				"description": "Key insights about user preferences, patterns, or session highlights",
			},
			"status": map[string]interface{}{
				"type":        "string",
				"enum":        []string{"active", "completed", "ready_for_next_phase", "waiting_for_input", "in_progress"},
				"description": "Current status of the session",
			},
		},
		"required": []string{"summary", "next_steps", "insights", "status"},
	}

	req := openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: userPrompt,
			},
		},
		Tools: []openai.Tool{
			{
				Type: "function",
				Function: &openai.FunctionDefinition{
					Name:        "create_context_summary",
					Description: "Generate a context summary for a user session",
					Parameters:  schema,
				},
			},
		},
		ToolChoice: openai.ToolChoice{
			Type: "function",
			Function: openai.ToolFunction{
				Name: "create_context_summary",
			},
		},
		Temperature: 0.3, // Lower temperature for consistent, focused summaries
	}

	if c.debug {
		slog.Debug("Generating context summary", "session_type", sessionType)
	}

	resp, err := c.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to create chat completion: %w", err)
	}

	if len(resp.Choices) == 0 || len(resp.Choices[0].Message.ToolCalls) == 0 {
		return nil, fmt.Errorf("no tool calls in response")
	}

	toolCall := resp.Choices[0].Message.ToolCalls[0]
	var contextResponse ContextSummaryResponse
	if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &contextResponse); err != nil {
		return nil, fmt.Errorf("failed to unmarshal context response: %w", err)
	}

	if c.debug {
		slog.Debug("Generated context summary", 
			"summary_length", len(contextResponse.Summary),
			"next_steps_count", len(contextResponse.NextSteps),
			"status", contextResponse.Status)
	}

	return &contextResponse, nil
}

// ContextSummaryResponse represents the structured response for context summaries
type ContextSummaryResponse struct {
	Summary   string   `json:"summary"`
	NextSteps []string `json:"next_steps"`
	Insights  string   `json:"insights"`
	Status    string   `json:"status"`
}