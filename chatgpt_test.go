package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/sashabaranov/go-openai"
	"testing"
)

type WeatherResponse struct {
	Location    string   `json:"location"`
	Temperature string   `json:"temperature"`
	Unit        string   `json:"unit"`
	Forecast    []string `json:"forecast"`
}

func CurrentWeather(wr WeatherResponse) WeatherResponse {
	if len(wr.Unit) == 0 {
		wr.Unit = "Celsius"
	}
	wr.Temperature = "72"
	wr.Forecast = []string{"sunny", "windy"}

	return wr
}

type Parameters struct {
	Type       string     `json:"type"`
	Properties Properties `json:"properties"`
	Required   []string   `json:"required"`
}

type Properties struct {
	Location Location `json:"location"`
	Unit     Unit     `json:"unit"`
}

type Location struct {
	Type        string `json:"type"`
	Description string `json:"description"`
}

type Unit struct {
	Type string   `json:"type"`
	Enum []string `json:"enum"`
}

func TestRunConversation(t *testing.T) {
	unit := &Unit{
		Type: "string",
		Enum: []string{"celsius", "fahrenheit"},
	}
	loc := &Location{
		Type:        "string",
		Description: "he city and state, e.g. San Francisco, CA",
	}
	props := &Properties{
		Location: *loc,
		Unit:     *unit,
	}
	pars := &Parameters{
		Type:       "object",
		Properties: *props,
		Required:   []string{"location"},
	}

	functions := &openai.FunctionDefinition{
		Name:        "CurrentWeather",
		Description: "Get the current weather in a given location",
		Parameters:  *pars,
	}

	message := openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: "What's the weather like in Boston?",
	}

	messages := []openai.ChatCompletionMessage{message}

	cfg := loadConfig()
	client := openai.NewClient(cfg.OpenAIKey)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:     openai.GPT3Dot5Turbo0613,
			Messages:  messages,
			Functions: []openai.FunctionDefinition{*functions},
		},
	)

	if err != nil {
		fmt.Printf("ChatCompletion round 1 error: %v\n", err)
		return
	}

	if resp.Choices[0].FinishReason == "function_call" {

		messages = append(messages, resp.Choices[0].Message)

		functionToCall := resp.Choices[0].Message.FunctionCall.Name
		args := resp.Choices[0].Message.FunctionCall.Arguments
		functionResponse := callFunction(functionToCall, args)

		message3 := openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleFunction,
			Content: functionResponse,
			Name:    functionToCall,
		}

		messages = append(messages, message3)

	}

	resp, err = client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    openai.GPT3Dot5Turbo0613,
			Messages: messages,
		},
	)

	if err != nil {
		fmt.Printf("ChatCompletion round 2 error: %v\n", err)
		return
	}
	println(resp.Choices[0].Message.Content)

}

// this needs to be more generic for arbitrary json returned
func callFunction(funcName string, args string) string {
	resp := "{}"
	if funcName == "CurrentWeather" {
		wr := &WeatherResponse{}
		if err := json.Unmarshal([]byte(args), wr); err != nil {
			panic(err)
		}
		wr2 := CurrentWeather(*wr)
		r, _ := json.Marshal(wr2)
		resp = string(r)
	}
	return resp

}
