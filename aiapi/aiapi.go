package aiapi

import (
	"encoding/json"
	"io"
	"net/http"
	"reflect"

	"github.com/breadchris/share/deps"
	"github.com/sashabaranov/go-openai"
)

// JSONSchema represents a JSON schema structure
type JSONSchema struct {
	Type                 string                 `json:"type,omitempty"`
	Properties           map[string]*JSONSchema `json:"properties,omitempty"`
	Items                *JSONSchema            `json:"items,omitempty"`
	Required             []string               `json:"required,omitempty"`
	AdditionalProperties *bool                  `json:"additionalProperties,omitempty"`
	Description          string                 `json:"description,omitempty"`
	Examples             []interface{}          `json:"examples,omitempty"`
}

// generateJSONSchema creates a JSON schema from an arbitrary JSON object
func generateJSONSchema(data interface{}) *JSONSchema {
	return generateSchemaFromValue(reflect.ValueOf(data))
}

func generateSchemaFromValue(v reflect.Value) *JSONSchema {
	if !v.IsValid() {
		return &JSONSchema{Type: "null"}
	}

	// Handle interface{} by getting the actual value
	if v.Kind() == reflect.Interface && !v.IsNil() {
		v = v.Elem()
	}

	switch v.Kind() {
	case reflect.String:
		return &JSONSchema{
			Type:     "string",
			Examples: []interface{}{v.String()},
		}
	case reflect.Bool:
		return &JSONSchema{
			Type:     "boolean",
			Examples: []interface{}{v.Bool()},
		}
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return &JSONSchema{
			Type:     "integer",
			Examples: []interface{}{v.Int()},
		}
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return &JSONSchema{
			Type:     "integer",
			Examples: []interface{}{v.Uint()},
		}
	case reflect.Float32, reflect.Float64:
		return &JSONSchema{
			Type:     "number",
			Examples: []interface{}{v.Float()},
		}
	case reflect.Slice, reflect.Array:
		if v.Len() == 0 {
			return &JSONSchema{
				Type:  "array",
				Items: &JSONSchema{},
			}
		}
		// Generate schema from first element
		itemSchema := generateSchemaFromValue(v.Index(0))
		return &JSONSchema{
			Type:  "array",
			Items: itemSchema,
		}
	case reflect.Map:
		if v.Type().Key().Kind() != reflect.String {
			// Non-string keys, treat as generic object
			return &JSONSchema{Type: "object"}
		}

		properties := make(map[string]*JSONSchema)
		var required []string

		for _, key := range v.MapKeys() {
			keyStr := key.String()
			value := v.MapIndex(key)
			properties[keyStr] = generateSchemaFromValue(value)
			required = append(required, keyStr)
		}

		additionalProps := false
		return &JSONSchema{
			Type:                 "object",
			Properties:           properties,
			Required:             required,
			AdditionalProperties: &additionalProps,
		}
	case reflect.Struct:
		properties := make(map[string]*JSONSchema)
		var required []string

		t := v.Type()
		for i := 0; i < v.NumField(); i++ {
			field := t.Field(i)
			if !field.IsExported() {
				continue
			}

			fieldName := field.Name
			if tag := field.Tag.Get("json"); tag != "" && tag != "-" {
				if idx := len(tag); idx > 0 && tag[idx-1:] != ",omitempty" {
					required = append(required, fieldName)
				}
				if commaIdx := 0; commaIdx < len(tag) && tag[commaIdx] != ',' {
					fieldName = tag[:commaIdx]
				}
			} else {
				required = append(required, fieldName)
			}

			properties[fieldName] = generateSchemaFromValue(v.Field(i))
		}

		additionalProps := false
		return &JSONSchema{
			Type:                 "object",
			Properties:           properties,
			Required:             required,
			AdditionalProperties: &additionalProps,
		}
	case reflect.Ptr:
		if v.IsNil() {
			return &JSONSchema{Type: "null"}
		}
		return generateSchemaFromValue(v.Elem())
	default:
		return &JSONSchema{Type: "object"}
	}
}

func New(deps deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("/code", func(w http.ResponseWriter, r *http.Request) {
		// return the code needed to invoke "/ai" from javascript
		code := `
		fetch("/ai", {
			method: "POST",
			body: JSON.stringify({
				systemPrompt: "You are a helpful assistant.",
				userMessage: "What is the capital of France?",
				generateSchema: { "name": "John", "age": 30, "active": true }
			})
		})
		`
		w.Write([]byte(code))
	})
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers to accept requests from all domains
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, `{"error":"failed to read request body"}`, http.StatusBadRequest)
			return
		}

		var payload struct {
			SystemPrompt   string          `json:"systemPrompt"`
			UserMessage    string          `json:"userMessage"`
			ResponseSchema json.RawMessage `json:"responseSchema"` // Optional: can be forwarded to frontend or used with JSON schema validation
			GenerateSchema interface{}     `json:"generateSchema"` // Optional: arbitrary JSON object to generate schema from
		}

		if err := json.Unmarshal(body, &payload); err != nil {
			http.Error(w, `{"error":"invalid JSON payload"}`, http.StatusBadRequest)
			return
		}

		// If generateSchema is provided, generate and return the schema
		if payload.GenerateSchema != nil {
			schema := generateJSONSchema(payload.GenerateSchema)
			response := map[string]interface{}{
				"generatedSchema": schema,
				"originalData":    payload.GenerateSchema,
			}

			// If there's also an AI request, include both
			if payload.SystemPrompt != "" && payload.UserMessage != "" {
				// Enhanced system prompt for structured responses
				systemPrompt := payload.SystemPrompt

				// Create OpenAI request with function calling
				req := openai.ChatCompletionRequest{
					Model: openai.GPT4,
					Messages: []openai.ChatCompletionMessage{
						{
							Role:    openai.ChatMessageRoleSystem,
							Content: systemPrompt,
						},
						{
							Role:    openai.ChatMessageRoleUser,
							Content: payload.UserMessage,
						},
					},
					Temperature: 0.3, // Lower temperature for more consistent code generation
				}

				// Add function tool if response schema is provided
				if payload.ResponseSchema != nil {
					// Convert the response schema to a proper JSON schema for OpenAI
					var schemaMap map[string]interface{}
					if err := json.Unmarshal(payload.ResponseSchema, &schemaMap); err == nil {
						req.Tools = []openai.Tool{
							{
								Type: "function",
								Function: &openai.FunctionDefinition{
									Name:        "structured_response",
									Description: "Provide a structured response matching the expected schema",
									Parameters:  schemaMap,
								},
							},
						}
						req.ToolChoice = "required"
					}
				}

				resp, err := deps.AI.CreateChatCompletion(r.Context(), req)
				if err != nil {
					http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
					return
				}

				// Handle function calling response
				if len(resp.Choices) > 0 && len(resp.Choices[0].Message.ToolCalls) > 0 {
					// Extract function call arguments as the structured response
					toolCall := resp.Choices[0].Message.ToolCalls[0]
					response["aiResponse"] = toolCall.Function.Arguments
				} else {
					// Fallback to regular message content
					response["aiResponse"] = resp.Choices[0].Message.Content
				}
			}

			json.NewEncoder(w).Encode(response)
			return
		}

		// Original AI-only functionality with enhanced handling
		systemPrompt := payload.SystemPrompt

		// Create OpenAI request with function calling
		req := openai.ChatCompletionRequest{
			Model: openai.GPT4,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: systemPrompt,
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: payload.UserMessage,
				},
			},
			Temperature: 0.3, // Lower temperature for more consistent code generation
		}

		// Add function tool if response schema is provided
		if payload.ResponseSchema != nil {
			// Convert the response schema to a proper JSON schema for OpenAI
			var schemaMap map[string]interface{}
			if err := json.Unmarshal(payload.ResponseSchema, &schemaMap); err == nil {
				req.Tools = []openai.Tool{
					{
						Type: "function",
						Function: &openai.FunctionDefinition{
							Name:        "structured_response",
							Description: "Provide a structured response matching the expected schema",
							Parameters:  schemaMap,
						},
					},
				}
				req.ToolChoice = "required"
			}
		}

		resp, err := deps.AI.CreateChatCompletion(r.Context(), req)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
			return
		}

		// Handle function calling response
		if len(resp.Choices) > 0 && len(resp.Choices[0].Message.ToolCalls) > 0 {
			// Extract function call arguments as the structured response
			toolCall := resp.Choices[0].Message.ToolCalls[0]
			json.NewEncoder(w).Encode(toolCall.Function.Arguments)
		} else {
			// Fallback to regular message content
			json.NewEncoder(w).Encode(resp.Choices[0].Message.Content)
		}
	})

	return m
}
