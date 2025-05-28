package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
	"time"

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

type ToolProp struct {
	Arguement   string
	Description string
}

type Tool struct {
	Function Func
	Name     string
	Desc     string
	Props    []ToolProp
	Tool     openai.Tool
}

type Func func(deps.Deps, string, *websocket.Hub) string

func NewAI(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			get(d, w, r)
		}
	})

	//d.WebsocketRegistry.Register2("chat", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
	//	tools := getTools(d, hub)
	//	respMsg := GptToolCall(d, message, hub, tools)
	//	respBubble := ""
	//	msgs := strings.Split(respMsg, "\n")
	//	msgNodes := []*Node{}
	//	for _, msg := range msgs {
	//		msgNodes = append(msgNodes, Div(T(msg)))
	//	}
	//
	//	if respMsg != "" {
	//		respBubble = Div(
	//			Id("chat"),
	//			Attr("hx-swap-oob", "beforeend"),
	//			Div(
	//				Class("chat chat-end"),
	//				Div(
	//					Class("chat-bubble"),
	//					Ch(msgNodes),
	//				),
	//			),
	//		).Render()
	//	}
	//
	//	cmdMsgs := []string{
	//		respBubble,
	//		Div(
	//			Id("chat"),
	//			Attr("hx-swap-oob", "beforeend"),
	//			Div(
	//				Class("chat chat-start"),
	//				Div(
	//					Class("chat-bubble"),
	//					T(message),
	//				),
	//			),
	//		).Render(),
	//	}
	//
	//	for _, cmdMsg := range cmdMsgs {
	//		hub.Broadcast <- websocket.Message{
	//			Room:    "airoom",
	//			Content: []byte(cmdMsg),
	//		}
	//	}
	//})
	return mux
}

func get(d deps.Deps, w http.ResponseWriter, r *http.Request) {
	//isMobile := strings.Contains(r.Header.Get("User-Agent"), "Android") || strings.Contains(r.Header.Get("User-Agent"), "iPhone")
	body := Div(
		centerComponent(
			Div(
				Button(
					Id("nav-button"),
					T("Feed"),
					OnClick(`
					document.getElementById('display-container').classList.toggle('hidden'); 
					document.getElementById('chat-container').classList.toggle('hidden');
					document.getElementById('nav-button').innerText = document.getElementById('nav-button').innerText === 'Feed' ? 'Chat' : 'Feed';
					`),
				),
			),
		),
		Div(
			Id("display-container"),
			Class("hidden"),
			Div(
				Id("display"),
			)),
		centerComponent(
			Div(
				Id("chat-container"),
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
					),
				),
			)))

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

func createTool(createTool Tool) Tool {
	properties := map[string]string{}
	for _, prop := range createTool.Props {
		properties[prop.Arguement] = prop.Description
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

func createCal(d deps.Deps, message string, hub *websocket.Hub) string {
	id := uuid.NewString()
	c := Calendar{
		ID: id,
	}

	eventsDb := d.Docs.WithCollection("events")

	events, err := eventsDb.List()
	if err != nil {
		fmt.Println("Failed to list events", err)
	}

	for _, event := range events {

		var e EverOutEvent
		json.Unmarshal(event.Data, &e)
		var calEvent CalendarEvent

		eventTime, err := time.Parse("2006-01-02", e.Date)
		if err != nil {
			fmt.Println("Failed to parse date", err)
		}
		if e.Liked {
			fmt.Println("Liked event", eventTime)
			calEvent.Name = e.Title
			calEvent.Date = eventTime
			calEvent.Description = e.Category
			calEvent.Link = e.EventURL
			calEvent.ImageURL = e.ImageURL
			calEvent.ID = uuid.NewString()
			c.Events = append(c.Events, calEvent)
		}
	}

	hub.Broadcast <- websocket.Message{
		Room: "airoom",
		Content: []byte(
			Div(
				Id("display"),
				RenderCalendar(c),
			).Render(),
		),
	}
	return ""
}

func createDate(d deps.Deps, message string, hub *websocket.Hub) string {
	return message
}

func scraperMenu(d deps.Deps, message string, hub *websocket.Hub) string {
	scraper := Div(
		Id("display"),
		ScraperUiForm(d),
	)

	hub.Broadcast <- websocket.Message{
		Room: "airoom",
		Content: []byte(
			scraper.Render(),
		),
	}
	return message
}

func showEvents(d deps.Deps, message string, hub *websocket.Hub) string {
	eventsDB := d.Docs.WithCollection("events")
	topEventsDB := d.Docs.WithCollection("topEvents")

	var events []EverOutEvent

	docs, err := eventsDB.List()
	if err != nil {
		fmt.Println("Failed to list events", err)
	}
	for _, doc := range docs {
		var event EverOutEvent
		json.Unmarshal(doc.Data, &event)
		events = append(events, event)
	}

	docs, err = topEventsDB.List()
	if err != nil {
		fmt.Println("Failed to list top events", err)
	}
	for _, doc := range docs {
		var event EverOutEvent
		json.Unmarshal(doc.Data, &event)
		events = append(events, event)
	}

	eventsByDate := make(map[string][]EverOutEvent)
	for _, e := range events {
		eventsByDate[e.Date] = append(eventsByDate[e.Date], e)
	}

	eventView := Div(
		Id("display"),
		RenderEverout(eventsByDate),
	).Render()

	hub.Broadcast <- websocket.Message{
		Room: "airoom",
		Content: []byte(
			eventView,
		),
	}
	return ""
}

func listCategories(d deps.Deps, message string, hub *websocket.Hub) string {
	eventsDB := d.Docs.WithCollection("events")
	catagories := []string{}
	events, err := eventsDB.List()
	if err != nil {
		fmt.Println("Failed to list events", err)
	}
	for _, event := range events {
		var e EverOutEvent
		json.Unmarshal(event.Data, &e)

		if !slices.Contains(catagories, e.Category) {
			catagories = append(catagories, e.Category)
		}

	}
	strResp := ""
	for _, cat := range catagories {
		strResp += cat + "\n"
	}

	return strResp
}

func listCategoriesTool() Tool {
	return createTool(
		Tool{
			Function: listCategories,
			Name:     "ListCatagories",
			Desc:     "List Catagories",
			Props: []ToolProp{
				{
					Arguement:   "catagory",
					Description: "List catagories",
				},
			},
		},
	)
}

func getCategory(d deps.Deps, message string, hub *websocket.Hub) string {
	eventsDB := d.Docs.WithCollection("events")
	events, err := eventsDB.List()
	if err != nil {
		fmt.Println("Failed to list events", err)
	}

	catEvents := []EverOutEvent{}
	for _, event := range events {
		var e EverOutEvent
		json.Unmarshal(event.Data, &e)
		if e.Category == message {
			catEvents = append(catEvents, e)
		}
	}
	eventsByDate := make(map[string][]EverOutEvent)
	for _, e := range catEvents {
		eventsByDate[e.Date] = append(eventsByDate[e.Date], e)
	}
	hub.Broadcast <- websocket.Message{
		Room: "airoom",
		Content: []byte(
			Div(
				Id("display"),
				RenderEverout(eventsByDate),
			).Render(),
		),
	}
	return ""
}

func getTools(d deps.Deps, hub *websocket.Hub) []Tool {
	return []Tool{
		createTool(
			Tool{
				Function: createCal,
				Name:     "Calendar",
				Desc:     "Display a calendar",
				Props: []ToolProp{
					{
						Arguement:   "message",
						Description: "Display a calendar",
					},
				},
			},
		),
		createTool(
			Tool{
				Function: scraperMenu,
				Name:     "ScraperMenu",
				Desc:     "Show the scraper menu.",
				Props: []ToolProp{
					{
						Arguement:   "quote",
						Description: "Create a fake quote about web scraping from a historical figure.",
					},
				},
			},
		),
		createTool(
			Tool{
				Function: createDate,
				Name:     "Date",
				Desc:     "Create a date in YYYY-MM-DD format",
				Props: []ToolProp{
					{
						Arguement:   "date",
						Description: "The date",
					},
				},
			},
		),
		createTool(
			Tool{
				Function: showEvents,
				Name:     "ShowEvents",
				Desc:     "Show events",
				Props: []ToolProp{
					{
						Arguement:   "events",
						Description: "Show events",
					},
				},
			},
		),
		listCategoriesTool(),
		createTool(
			Tool{
				Function: getCategory,
				Name:     "GetCategory",
				Desc:     "Get category",
				Props: []ToolProp{
					{
						Arguement:   "category",
						Description: "Select a category from this list: " + listCategories(d, "", hub),
					},
				},
			},
		),
	}
}

func GptToolCall(d deps.Deps, message string, hub *websocket.Hub, tools []Tool) string {
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
