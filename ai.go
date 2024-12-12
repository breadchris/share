package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/sashabaranov/go-openai"
)

type AIParameter struct {
	Type                 string            `json:"type"`
	Properties           map[string]AIProp `json:"properties"`
	Required             []string          `json:"required"`
	AdditionalProperties bool              `json:"additionalProperties"`
}

type AIProp struct {
	Type        string `json:"type"`
	Description string `json:"description"`
}

type DisplayFunctionParams struct {
	Message string `json:"message"`
}

func NewAI(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			get(d, w, r)
		}
	})

	d.WebsocketRegistry.Register2("chat", func(message string) []string {
		fmt.Println("Message: ", message)

		tool := creaeTool("DisplayOne", "Display One", map[string]string{
			"message": "The message to display",
		})

		var ctx context.Context = context.Background()

		resp, err := d.AI.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
			Model: openai.GPT4o20240513,
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleSystem, Content: "You are a helpful assistant."},
				{Role: openai.ChatMessageRoleUser, Content: message},
			},
			Tools:     []openai.Tool{tool},
			MaxTokens: 150,
		})
		if err != nil {
			fmt.Println("Failed to create chat completion", err)
		}
		choice := resp.Choices[0]

		respMsg := resp.Choices[0].Message.Content

		functionCall := choice.Message.ToolCalls[0].Function
		fmt.Println("Function Call: ", functionCall)
		display := ""
		if ok := functionCall.Name == "DisplayOne"; ok {
			args := DisplayFunctionParams{}
			err = json.Unmarshal([]byte(functionCall.Arguments), &args)
			if err != nil {
				fmt.Println("Failed to unmarshal arguments", err)
			}
			display = displayOne(args.Message).Render()
			fmt.Printf("functionCall.Arguments:", functionCall.Arguments)
		} else {
			fmt.Println("Tool call not found")
		}

		fmt.Println("Response: ", respMsg)

		return []string{
			display,
			Div(
				Id("chat"),
				Attr("hx-swap-oob", "beforeend"),
				Div(
					Class("chat chat-start"),
					Div(
						Class("chat-bubble"),
						T(message),
					),
				),
			).Render(),
			Div(
				Id("chat"),
				Attr("hx-swap-oob", "beforeend"),
				Div(
					Class("chat chat-end"),
					Div(
						Class("chat-bubble"),
						T(respMsg),
					),
				),
			).Render(),
		}
	})
	return mux
}

func get(d deps.Deps, w http.ResponseWriter, r *http.Request) {

	body := Div(
		Div(
			Id("display"),
		),
		centerComponent(
			Div(
				Div(
					Attr("hx-swap-oob", "beforeend"),
					Id("messages"),
					Class("rounded-lg shadow-lg w-[16.5rem] h-[25.5rem] overflow-y-scroll"),
					Div(
						Id("chat"),
					),
				),
				Div(
					Id("content-container"),
					Form(
						Attr("ws-send", "submit"),
						TextArea(
							Name("chat"),
							Placeholder("Type your message..."),
						),
						Div(Input(
							Type("submit"),
							Value("Submit"),
							Class("btn btn-primary"),
						))),
				))))

	NewWebsocketPage2(body.Children).RenderPage(w, r)
}

func centerComponent(node *Node) *Node {
	return Div(
		Class("flex items-center justify-center pt-20"),
		node,
	)
}

func NewWebsocketPage2(children []*Node) *Node {
	return Html(
		Attr("data-theme", "black"),
		Head(
			Title(T("EC")),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12"),
			),
			Script(
				Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
			),
			TailwindCSS,
			DaisyUI,
		),
		Body(Div(
			Attr("hx-ext", "ws"),
			Attr("ws-connect", "/websocket/ws"),
			Ch(children),
		)),
	)
}

func ptr(s string) *string {
	return &s
}

func creaeTool(funcName string, funcDesc string, properties map[string]string) openai.Tool {
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
		Name:        funcName,
		Description: funcDesc,
		Parameters:  parameters,
	}
	return tool
}

func displayOne(message string) *Node {
	return Div(
		Id("display"),
		H1(T("Display One")),
		T(message),
	)
}

func displayTwo(message string) *Node {
	return centerComponent(
		Div(
			Id("display"),
			H1(T("Display Two")),
			T(message),
		))
}

// assistant, err = setupAssistant(d)
// if err != nil {
// 	http.Error(w, "Failed to setup assistant", http.StatusInternalServerError)
// 	return
// }

// thread, err = setupThread(d, w, r)
// if err != nil {
// 	http.Error(w, "Failed to setup thread", http.StatusInternalServerError)
// 	return
// }

// d.AI.client.thread

// }
// resp, err = d.AI.CreateThreadAndRun(r.Context(), req)
// if err != nil {
// 	http.Error(w, "Failed to create thread and run", http.StatusInternalServerError)
// 	return
// }

// type Msg struct {
// 	Message string
// }

// var assistant openai.Assistant
// var thread openai.Thread1

// func setupAssistant(d deps.Deps) (openai.Assistant, error) {
// 	// var tools = []openai.AssistantTool{tool}
// 	assistantRequest := openai.AssistantRequest{
// 		Model:        "gpt-40",
// 		Name:         ptr("Ship Computer"),
// 		Instructions: ptr("You are the ship computer. You are responsible for the ship's systems. You must keep the ship running and the crew alive."),
// 		// Tools:        tools,
// 	}
// 	assistant, err := d.AI.CreateAssistant(r.Context(), assistantRequest)
// 	if err != nil {
// 		fmt.Println("Failed to create assistant")
// 		return openai.Assistant{}, err
// 	}
// 	return assistant, nil
// }

// func setupThread(d deps.Deps, w http.ResponseWriter, r *http.Request) (openai.Thread, error) {
// 	threadRequest := openai.ThreadRequest{}
// 	thread, err := d.AI.CreateThread(r.Context(), threadRequest)
// 	if err != nil {
// 		fmt.Println("Failed to create thread")
// 		return openai.Thread{}, err
// 	}
// 	return thread, nil
// }
