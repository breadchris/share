package aiapi

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"net/http"
	"reflect"
	"strings"

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

// ImageAnalysisResponse represents the response from image analysis
type ImageAnalysisResponse struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Confidence  float64 `json:"confidence"`
}

// resizeImage resizes an image to fit within maxDimension while maintaining aspect ratio
func resizeImage(img image.Image, maxDimension int) image.Image {
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Check if resizing is needed
	if width <= maxDimension && height <= maxDimension {
		return img
	}

	// Calculate new dimensions while maintaining aspect ratio
	var newWidth, newHeight int
	if width > height {
		newWidth = maxDimension
		newHeight = (height * maxDimension) / width
	} else {
		newHeight = maxDimension
		newWidth = (width * maxDimension) / height
	}

	// Create new image with calculated dimensions
	newImg := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))

	// Simple nearest neighbor resizing
	for y := 0; y < newHeight; y++ {
		for x := 0; x < newWidth; x++ {
			srcX := (x * width) / newWidth
			srcY := (y * height) / newHeight
			newImg.Set(x, y, img.At(srcX, srcY))
		}
	}

	return newImg
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
	
	m.HandleFunc("/analyze-image", func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != "POST" {
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		// Parse multipart form (max 10MB)
		err := r.ParseMultipartForm(10 << 20)
		if err != nil {
			http.Error(w, `{"error":"Failed to parse form data"}`, http.StatusBadRequest)
			return
		}

		// Get the uploaded file
		file, header, err := r.FormFile("image")
		if err != nil {
			http.Error(w, `{"error":"No image file provided"}`, http.StatusBadRequest)
			return
		}
		defer file.Close()

		// Validate file type
		contentType := header.Header.Get("Content-Type")
		if !strings.HasPrefix(contentType, "image/") {
			http.Error(w, `{"error":"Invalid file type. Please upload an image"}`, http.StatusBadRequest)
			return
		}

		// Read file data
		fileData, err := io.ReadAll(file)
		if err != nil {
			http.Error(w, `{"error":"Failed to read image file"}`, http.StatusInternalServerError)
			return
		}

		// Decode image
		var img image.Image
		if strings.Contains(contentType, "jpeg") || strings.Contains(contentType, "jpg") {
			img, err = jpeg.Decode(bytes.NewReader(fileData))
		} else if strings.Contains(contentType, "png") {
			img, err = png.Decode(bytes.NewReader(fileData))
		} else {
			// Try generic decode
			img, _, err = image.Decode(bytes.NewReader(fileData))
		}

		if err != nil {
			http.Error(w, `{"error":"Failed to decode image"}`, http.StatusBadRequest)
			return
		}

		// Resize image if needed (max 1024px)
		resizedImg := resizeImage(img, 1024)

		// Convert to JPEG and base64
		var jpegData bytes.Buffer
		err = jpeg.Encode(&jpegData, resizedImg, &jpeg.Options{Quality: 85})
		if err != nil {
			http.Error(w, `{"error":"Failed to encode image"}`, http.StatusInternalServerError)
			return
		}

		base64Data := base64.StdEncoding.EncodeToString(jpegData.Bytes())
		dataURI := fmt.Sprintf("data:image/jpeg;base64,%s", base64Data)

		// Create OpenAI request for image analysis
		req := openai.ChatCompletionRequest{
			Model: openai.GPT4Dot1Mini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role: openai.ChatMessageRoleUser,
					MultiContent: []openai.ChatMessagePart{
						{
							Type: openai.ChatMessagePartTypeText,
							Text: "Analyze this photo and identify the main item. Provide a concise name and brief description suitable for inventory. Return only JSON in this exact format: {\"name\": \"item name\", \"description\": \"brief description\"}",
						},
						{
							Type: openai.ChatMessagePartTypeImageURL,
							ImageURL: &openai.ChatMessageImageURL{
								URL:    dataURI,
								Detail: openai.ImageURLDetailLow,
							},
						},
					},
				},
			},
			MaxTokens:   150,
			Temperature: 0.3,
		}

		// Call OpenAI API
		resp, err := deps.AI.CreateChatCompletion(r.Context(), req)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"AI analysis failed: %s"}`, err.Error()), http.StatusInternalServerError)
			return
		}

		if len(resp.Choices) == 0 {
			http.Error(w, `{"error":"No response from AI"}`, http.StatusInternalServerError)
			return
		}

		// Parse AI response
		aiResponse := resp.Choices[0].Message.Content
		
		// Try to extract JSON from response
		var analysisResult struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}

		// Clean up the response - remove markdown code blocks if present
		cleanResponse := aiResponse
		if strings.Contains(aiResponse, "```json") {
			start := strings.Index(aiResponse, "```json") + 7
			end := strings.Index(aiResponse[start:], "```")
			if end > 0 {
				cleanResponse = aiResponse[start : start+end]
			}
		} else if strings.Contains(aiResponse, "```") {
			start := strings.Index(aiResponse, "```") + 3
			end := strings.Index(aiResponse[start:], "```")
			if end > 0 {
				cleanResponse = aiResponse[start : start+end]
			}
		}

		cleanResponse = strings.TrimSpace(cleanResponse)

		err = json.Unmarshal([]byte(cleanResponse), &analysisResult)
		if err != nil {
			// Fallback: try to extract information from plain text
			lines := strings.Split(aiResponse, "\n")
			analysisResult.Name = "Detected Item"
			analysisResult.Description = "Item identified from image"
			
			// Simple heuristic to find name and description
			for _, line := range lines {
				line = strings.TrimSpace(line)
				if line != "" && analysisResult.Name == "Detected Item" {
					analysisResult.Name = line
				} else if line != "" && analysisResult.Description == "Item identified from image" {
					analysisResult.Description = line
					break
				}
			}
		}

		// Ensure we have valid data
		if analysisResult.Name == "" {
			analysisResult.Name = "Unknown Item"
		}
		if analysisResult.Description == "" {
			analysisResult.Description = "No description available"
		}

		// Create response
		response := ImageAnalysisResponse{
			Name:        analysisResult.Name,
			Description: analysisResult.Description,
			Confidence:  0.8, // Static confidence for now
		}

		json.NewEncoder(w).Encode(response)
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
			ChatHistory    []struct {
				Role      string `json:"role"`
				Content   string `json:"content"`
				Timestamp string `json:"timestamp"`
			} `json:"chatHistory"` // Chat history from frontend
			CurrentCode string `json:"currentCode"` // Current code context
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
					},
					Temperature: 0.3, // Lower temperature for more consistent code generation
				}

				// Add chat history messages if provided
				if len(payload.ChatHistory) > 0 {
					for _, msg := range payload.ChatHistory {
						role := openai.ChatMessageRoleUser
						if msg.Role == "assistant" {
							role = openai.ChatMessageRoleAssistant
						}
						req.Messages = append(req.Messages, openai.ChatCompletionMessage{
							Role:    role,
							Content: msg.Content,
						})
					}
				}

				// Add the current user message
				req.Messages = append(req.Messages, openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleUser,
					Content: payload.UserMessage,
				})

				if payload.ResponseSchema != nil {
					var schemaMap map[string]interface{}
					if err := json.Unmarshal(payload.ResponseSchema, &schemaMap); err != nil {
						http.Error(w, `{"error":"invalid response schema"}`, http.StatusBadRequest)
						return
					}
				}

				req.Tools = []openai.Tool{
					{
						Type: "function",
						Function: &openai.FunctionDefinition{
							Name:        "structured_response",
							Description: "Provide a structured response matching the expected schema",
							Parameters:  schema,
						},
					},
				}
				req.ToolChoice = "required"

				resp, err := deps.AI.CreateChatCompletion(r.Context(), req)
				if err != nil {
					http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
					return
				}

				// Create response object
				response := map[string]interface{}{}

				// Handle function calling response
				if len(resp.Choices) > 0 && len(resp.Choices[0].Message.ToolCalls) > 0 {
					// Extract function call arguments as the structured response
					toolCall := resp.Choices[0].Message.ToolCalls[0]
					var functionResponse map[string]interface{}
					if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &functionResponse); err == nil {
						response["aiResponse"] = functionResponse
					} else {
						// Fallback to raw string if parsing fails
						response["aiResponse"] = toolCall.Function.Arguments
					}
				} else {
					// Fallback to regular message content
					response["aiResponse"] = resp.Choices[0].Message.Content
				}

				json.NewEncoder(w).Encode(response)
				return
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
			},
			Temperature: 0.3, // Lower temperature for more consistent code generation
		}

		// Add chat history messages if provided
		if len(payload.ChatHistory) > 0 {
			for _, msg := range payload.ChatHistory {
				role := openai.ChatMessageRoleUser
				if msg.Role == "assistant" {
					role = openai.ChatMessageRoleAssistant
				}
				req.Messages = append(req.Messages, openai.ChatCompletionMessage{
					Role:    role,
					Content: msg.Content,
				})
			}
		}

		// Add the current user message
		req.Messages = append(req.Messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleUser,
			Content: payload.UserMessage,
		})

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

		// Create response object
		response := map[string]interface{}{}

		// Handle function calling response
		if len(resp.Choices) > 0 && len(resp.Choices[0].Message.ToolCalls) > 0 {
			// Extract function call arguments as the structured response
			toolCall := resp.Choices[0].Message.ToolCalls[0]
			var functionResponse map[string]interface{}
			if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &functionResponse); err == nil {
				response["aiResponse"] = functionResponse
			} else {
				// Fallback to raw string if parsing fails
				response["aiResponse"] = toolCall.Function.Arguments
			}
		} else {
			// Fallback to regular message content
			response["aiResponse"] = resp.Choices[0].Message.Content
		}

		json.NewEncoder(w).Encode(response)
	})

	return m
}
