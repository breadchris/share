package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/websocket"
	"github.com/sashabaranov/go-openai"
)

type SocketEndpoint struct {
	Command  string
	Id       string
	Tools    []Tool
	Messages []string
	Function Func
}

func Regester(d deps.Deps, endpoint SocketEndpoint) {
	d.WebsocketRegistry.Register2(endpoint.Command, func(message string, hub *websocket.Hub) {
		cmdMsgs := []string{
			AiSwitch(d, message, hub, endpoint.Tools),
			endpoint.Function(d, message, hub),
		}

		for _, msg := range endpoint.Messages {
			cmdMsgs = append(cmdMsgs, msg)
		}

		for _, msg := range cmdMsgs {
			hub.Broadcast <- []byte(msg)
		}
	})
}

func AiSwitch(d deps.Deps, message string, hub *websocket.Hub, tools []Tool) string {
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

	if respMsg == "" {
		functionCall := choice.Message.ToolCalls[0].Function
		for _, tool := range tools {
			if tool.Name == functionCall.Name {
				var jsonMap map[string]interface{}
				json.Unmarshal([]byte(functionCall.Arguments), &jsonMap)
				prop := tool.Props[0].Arguement
				arg := jsonMap[prop].(string)

				respMsg = tool.Function(d, arg, hub)
			}
		}
	}

	return respMsg
}
