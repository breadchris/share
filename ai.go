package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/websocket"
	"github.com/google/uuid"
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

	d.WebsocketRegistry.Register2("chat", func(message string, hub *websocket.Hub) {

		respMsg, display := AiComponentSwitch(d, message)
		fmt.Println("Response message", respMsg)
		fmt.Println("Display", display)
		respBubble := ""

		if respMsg != "" {
			respBubble = Div(
				Id("chat"),
				Attr("hx-swap-oob", "beforeend"),
				Div(
					Class("chat chat-end"),
					Div(
						Class("chat-bubble"),
						T(respMsg),
					),
				),
			).Render()
		} else {
			respBubble = ""
		}

		cmdMsgs := []string{
			display,
			respBubble,
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
		}

		for _, cmdMsg := range cmdMsgs {
			hub.Broadcast <- []byte(cmdMsg)
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
			Div(Div(
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
				)))))

	NewWebsocketPage2(body.Children).RenderPage(w, r)
}

func centerComponent(node *Node) *Node {
	node.Attrs["Class"] = "flex items-center justify-center pt-20"
	return node
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

func creaeTool(function Func, funcName string, funcDesc string, properties map[string]string) Tool {
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

	return Tool{
		Name:    funcName,
		Functon: function,
		Tool:    tool,
	}
}

type Func func(string) *Node
type Tool struct {
	Name    string
	Functon Func
	Tool    openai.Tool
}

func createCal(message string) *Node {
	id := uuid.NewString()
	c := Calendar{
		ID: id,
	}
	fmt.Println("Creating calendar with id", id)
	return Div(
		Id("display"),
		GenerateCalendar(12, 2021, c))
}

func AiComponentSwitch(d deps.Deps, message string) (string, string) {

	tools := []Tool{
		creaeTool(displayOne, "DisplayOne", "Display One", map[string]string{
			"message": "The message to display",
		}),
		creaeTool(displayTwo, "DisplayTwo", "Display Two", map[string]string{
			"message": "The message to display",
		}),
		creaeTool(createCal, "Calendar", "Calendar", map[string]string{
			"calendar": "Display a calendar",
		}),
	}

	openaiTools := []openai.Tool{}
	for _, tool := range tools {
		openaiTools = append(openaiTools, tool.Tool)
	}

	var ctx context.Context = context.Background()

	resp, err := d.AI.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4o20240513,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: "You are a helpful assistant."},
			{Role: openai.ChatMessageRoleUser, Content: message},
		},
		Tools:     openaiTools,
		MaxTokens: 150,
	})
	if err != nil {
		fmt.Println("Failed to create chat completion", err)
	}
	choice := resp.Choices[0]

	respMsg := resp.Choices[0].Message.Content
	display := ""

	if respMsg == "" {
		functionCall := choice.Message.ToolCalls[0].Function

		for _, tool := range tools {
			if tool.Name == functionCall.Name {
				args := DisplayFunctionParams{}
				err = json.Unmarshal([]byte(functionCall.Arguments), &args)
				if err != nil {
					fmt.Println("Failed to unmarshal arguments", err)
				}
				display = tool.Functon(args.Message).Render()
			}
		}
	}

	return respMsg, display
}

func displayOne(message string) *Node {
	return centerComponent(Div(
		Id("display"),
		T("Display One"),
		// T(message),
	))
}

func displayTwo(message string) *Node {
	return centerComponent(Div(
		Id("display"),
		T("Display Two"),
		// T(message),
	))
}
