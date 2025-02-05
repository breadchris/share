package main

import (
	"context"

	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand/v2"
	"net/http"
	"os"
	"reflect"
	"strings"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/websocket"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
)

func getTarot(d deps.Deps, w http.ResponseWriter, r *http.Request) {
	// db := d.Docs.WithCollection("tarot")

	id := r.PathValue("id")
	if id == "" {
		id = "t" + uuid.NewString()

		http.Redirect(w, r, "/tarot/"+id, http.StatusSeeOther)
		return
	}

	Html(
		Attr("data-theme", "dark"),
		Head(
			Title(T("Tarot")),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12"),
			),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
			),
			TailwindCSS,
			DaisyUI,
		),
		Body(
			Div(
				Attr("hx-ext", "ws"),
				Attr("ws-connect", "/websocket/ws"),
				Div(
					Id("content-container"),
					T("Welcome to the Tarot Chat! Please describe how you are feeling or ask a question."),
					Form(
						Attr("ws-send", "submit"),
						TextArea(
							Name("chat"),
							Placeholder("Enter a message..."),
						),
						Div(Input(
							Type("submit"),
							Value("Submit"),
							Class("btn btn-primary"),
						))),
				),
			),
		),
	).RenderPage(w, r)
}

func NewTarot(d deps.Deps) *http.ServeMux {

	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getTarot(d, w, r)
		}
	})

	d.WebsocketRegistry.Register2("archetype", func(archetype string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Archetype Endpoint")

		gptResp := gptCall(d, archetype, hub)

		display := toolCall(d, gptResp, hub, archetypeTools())

		hub.Broadcast <- []byte(display)
	})

	d.WebsocketRegistry.Register2("chat", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Chat Endpoint")
		archetypes := loadArchetypes()
		archetypeNames := []string{}
		for _, archetype := range archetypes {
			archetypeNames = append(archetypeNames, archetype.Name)
			if len(archetype.AlternativeNames) > 0 {
				archetypeNames = append(archetypeNames, archetype.AlternativeNames[rand.IntN(len(archetype.AlternativeNames))])
			}
		}
		display := toolCall(d, message, hub, []Tool2{
			createTool2(Tool2{
				Name: "RelatedArchetypes",
				Desc: "Given a prompt select five related archetypes from this list: " + strings.Join(archetypeNames, ", "),
				Function: func(d deps.Deps, hub *websocket.Hub, archetypeOne string, archetypeTwo string, archetypeThree string, archetypeFour string, archetypeFive string) string {
					options := []string{}
					options = append(options, archetypeOne)
					options = append(options, archetypeTwo)
					options = append(options, archetypeThree)
					options = append(options, archetypeFour)
					options = append(options, archetypeFive)

					form := generateRadioForm(options)

					return Div(
						Id("content-container"),
						T("Select an archetype that calls to you."),
						form,
					).Render()
				},
				Props: []ToolProp2{
					{Argument: "archetypeOne", Description: "First related archetype", Type: "string"},
					{Argument: "archetypeTwo", Description: "Second related archetype", Type: "string"},
					{Argument: "archetypeThree", Description: "Third related archetype", Type: "string"},
					{Argument: "archetypeFour", Description: "Fourth related archetype", Type: "string"},
					{Argument: "archetypeFive", Description: "Fifth related archetype", Type: "string"},
				},
			}),
		})

		hub.Broadcast <- []byte(display)
	})

	return mux
}

func generateRadioForm(options []string) *Node {
	radioButtons := []*Node{}
	for _, option := range options {
		radioButtons = append(radioButtons, Div(
			Class("form-control"),
			Label(
				Input(
					Type("radio"),
					Name("archetype"),
					Value(option),
					Class("radio radio-primary"),
				),
				T(option),
			),
		))
	}

	return Form(
		Attr("ws-send", "submit"),
		Class("space-y-4"),
		Ch(radioButtons),
		Div(Input(
			Type("submit"),
			Value("Submit"),
			Class("btn btn-primary"),
		)),
	)
}

type Archetype struct {
	Name             string   `json:"name"`
	AlternativeNames []string `json:"alternative_names"`
	Role             string   `json:"role"`
	Examples         []string `json:"examples"`
	Themes           []string `json:"themes"`
}

func findArchetype(archetypes []Archetype, name string) *Archetype {
	for _, archetype := range archetypes {
		if strings.EqualFold(archetype.Name, name) {
			return &archetype
		}
		for _, altName := range archetype.AlternativeNames {
			if strings.EqualFold(altName, name) {
				return &archetype
			}
		}
	}
	return nil
}

type Func2 func([]any, deps.Deps, *websocket.Hub) string

type Tool2 struct {
	Function interface{}
	Name     string
	Desc     string
	Props    []ToolProp2
	Tool     openai.Tool
}

type ToolProp2 struct {
	Argument    string
	Description string
	Type        string
}

// func objectCall(d deps.Deps, message string, hub *websocket.Hub) string {

// 	message = "Given the character of, " + message + ", create an archetype."
// 	var ctx context.Context = context.Background()

// 	resp, err := d.AI.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
// 		Model: openai.GPT4o20240513,
// 		Messages: []openai.ChatCompletionMessage{
// 			{Role: openai.ChatMessageRoleSystem, Content: "You are a helpful assistant."},
// 			{Role: openai.ChatMessageRoleUser, Content: message},
// 		},
// 		MaxTokens: 150,
// 		ResponseFormat:&openai.ChatCompletionResponseFormat{
// 			Type: openai.ChatCompletionResponseFormatTypeJSONSchema,
// 			JSONSchema: openai.ChatCompletionResponseFormatJSONSchema{
// 				Name: "archetype",
// 				Description: "A character archetype",
// 				Schema: json.Marshal(Archetype{}),
// 				Strict: true,
// 			}
// 		},
// 	})
// 	if err != nil {
// 		fmt.Println("Failed to create chat completion", err)
// 	}
// 	fmt.Println("RESPONSE: ", resp)
// 	choice := resp.Choices[0]

// 	respMsg := resp.Choices[0].Message.Content

// 	if respMsg == "" {
// 		functionCall := choice.Message.ToolCalls[0].Function
// 		for _, tool := range tools {
// 			if tool.Name == functionCall.Name {
// 				var jsonMap map[string]interface{}
// 				json.Unmarshal([]byte(functionCall.Arguments), &jsonMap)

// 				// Convert JSON arguments to reflect values
// 				argValues := []reflect.Value{reflect.ValueOf(d), reflect.ValueOf(hub)}
// 				for _, prop := range tool.Props {
// 					argValue := convertArgument(jsonMap[prop.Argument], prop.Type)
// 					argValues = append(argValues, argValue)
// 				}

// 				// Call the function using reflection
// 				result := reflect.ValueOf(tool.Function).Call(argValues)

// 				// Handle the result (assuming a single return value of type string)
// 				if len(result) > 0 {
// 					respMsg = result[0].Interface().(string)
// 				}
// 			}
// 		}
// 	}

// 	return respMsg
// }

func gptCall(d deps.Deps, message string, hub *websocket.Hub) string {
	fmt.Println("Running gptCall")

	archetypes := loadArchetypes()

	selectedArchetype := findArchetype(archetypes, message)
	selectedArchetypeString := ""
	if selectedArchetype != nil {
		selectedArchetypeString = fmt.Sprintf("Name: %s\nRole: %s\nExamples: %s\nThemes: %s", selectedArchetype.Name, selectedArchetype.Role, strings.Join(selectedArchetype.Examples, ", "), strings.Join(selectedArchetype.Themes, ", "))
	}

	message = "Given this archetype, " + selectedArchetypeString + ", create a new character that fits this archetype. It should have the following properties: name, role, examples, themes. Rather than making a specific character, keep it general and closer to an archetype. It should be a recognizable position in society."
	var ctx context.Context = context.Background()

	resp, err := d.AI.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4o20240513,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: "You are fortune teller who is trying to help someone understand an aspect of themself."},
			{Role: openai.ChatMessageRoleUser, Content: message},
		},
		MaxTokens: 1000,
	})
	if err != nil {
		fmt.Println("Failed to create chat completion", err)
	}

	respMsg := resp.Choices[0].Message.Content

	fmt.Println("respMsg: ", respMsg)
	return respMsg
}

func toolCall(d deps.Deps, message string, hub *websocket.Hub, tools []Tool2) string {
	fmt.Println("Running toolCall")
	openaiTools := []openai.Tool{}

	for _, tool := range tools {
		openaiTools = append(openaiTools, tool.Tool)
	}

	var ctx context.Context = context.Background()
	resp, err := d.AI.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4o20240513,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: "You are fortune teller who is trying to help someone understand an aspect of themself."},
			{Role: openai.ChatMessageRoleUser, Content: message},
		},
		Tools:     openaiTools,
		MaxTokens: 1000,
	})
	if err != nil {
		fmt.Println("Failed to create chat completion", err)
	}

	choice := resp.Choices[0]

	respMsg := resp.Choices[0].Message.Content

	if respMsg == "" {
		functionCall := choice.Message.ToolCalls[0].Function
		for _, tool := range tools {
			if tool.Name == functionCall.Name {
				var jsonMap map[string]interface{}
				json.Unmarshal([]byte(functionCall.Arguments), &jsonMap)

				// Convert JSON arguments to reflect values
				argValues := []reflect.Value{reflect.ValueOf(d), reflect.ValueOf(hub)}
				for _, prop := range tool.Props {
					argValue := convertArgument(jsonMap[prop.Argument], prop.Type)
					argValues = append(argValues, argValue)
					fmt.Println("argValue: ", argValue)
				}

				// Call the function using reflection
				result := reflect.ValueOf(tool.Function).Call(argValues)

				// Handle the result (assuming a single return value of type string)
				if len(result) > 0 {
					respMsg = result[0].Interface().(string)
				}
			}
		}
	}

	return respMsg
}

// Helper function to convert JSON arguments to the appropriate type
func convertArgument(value interface{}, argType string) reflect.Value {
	switch argType {
	case "string":
		return reflect.ValueOf(value.(string))
	case "int":
		return reflect.ValueOf(int(value.(float64)))
	case "float64":
		return reflect.ValueOf(value.(float64))
	default:
		return reflect.ValueOf(value)
	}
}

func archetypeTools() []Tool2 {
	return []Tool2{
		createTool2(Tool2{
			Name: "CreateArchetype",
			Desc: "Create a new archetype",
			Function: func(d deps.Deps, hub *websocket.Hub, name string, role string, examples string, themes string) string {
				return Div(
					Id("content-container"),
					Attr("hx-swap-oob", "beforeend"),
					Div(
						Class("archetype-details"),
						Div(T("Name: "+name)),
						Div(T("Role: "+role)),
						Div(T("Examples: "+examples)),
						Div(T("Themes: "+themes)),
					),
				).Render()
			},
			Props: []ToolProp2{
				{Argument: "name", Description: "Name of the archetype", Type: "string"},
				{Argument: "role", Description: "Role of the archetype", Type: "string"},
				{Argument: "examples", Description: "List of examples", Type: "string"},
				{Argument: "themes", Description: "List of themes", Type: "string"},
			},
		}),
	}
}

func createTool2(createTool Tool2) Tool2 {
	properties := map[string]string{}
	for _, prop := range createTool.Props {
		properties[prop.Argument] = prop.Description
	}

	props := map[string]AIProp{}
	required := []string{}

	for key, value := range properties {
		props[key] = AIProp{
			Type:        "string",
			Description: value,
		}
		required = append(required, key)
	}
	parameters := AIParameter{
		Type:                 "object",
		Properties:           props,
		Required:             required,
		AdditionalProperties: false,
	}

	tool := openai.Tool{}
	tool.Type = "function"
	tool.Function = &openai.FunctionDefinition{
		Name:        createTool.Name,
		Description: createTool.Desc,
		Parameters:  parameters,
	}
	createTool.Tool = tool
	return createTool
}

func loadArchetypes() []Archetype {
	file, err := os.Open("archetypes.json")
	if err != nil {
		fmt.Println("Error opening file:", err)
	}
	defer file.Close()
	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		fmt.Println("Error reading file:", err)
	}
	var archetypes []Archetype
	err = json.Unmarshal(bytes, &archetypes)
	if err != nil {
		fmt.Println("Error loading archetypes:", err)
	}
	return archetypes
}
