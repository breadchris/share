package main

import (
	"context"
	"strconv"
	"time"
	"unicode/utf8"

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

type AITarotCard struct {
	Name        string
	Role        string
	Examples    string
	Themes      string
	Description string
}

type ContentCard struct {
	Link    string
	Summary string
}

type TarotCard struct {
	Id            string
	Message       string
	Type          Archetype
	AICard        AITarotCard
	InitialPrompt string
	ImagePath     string
	ContentCard   ContentCard
	QrCodePath    string
}

func chatForm(name string) *Node {
	return Form(
		Attr("ws-send", "submit"),
		TextArea(
			Name(name),
			Placeholder("Enter a message..."),
		),
		Div(Input(
			Type("submit"),
			Value("Submit"),
			Class("btn btn-primary"),
		)),
	)
}

func getTarot(d deps.Deps, w http.ResponseWriter, r *http.Request) string {
	fmt.Println("getTarot")
	id := r.PathValue("id")
	if id == "" {
		id = "tarot" + uuid.NewString()

		http.Redirect(w, r, "/tarot/"+id, http.StatusSeeOther)
		return ""
	}

	card := TarotCard{}
	db := d.Docs.WithCollection("tarot")
	content := Div()
	err := db.Get(id, &card)

	if err != nil {
		fmt.Println("card not found, creating new card")
		card.Id = id
		db.Set(id, card)
	}

	if card.AICard.Name == "" {
		fmt.Println("Tarot card not found, creating new card")
		card.Id = id
		db.Set(id, card)
		content = Div(
			T("Welcome to the Tarot Chat! Please describe how you are feeling or ask a question."),
			chatForm("chat"))
	} else {
		fmt.Println("card found")
		content = Div(
			displayCard(card),
			Div(
				Div(
					Id("messages"),
				),
				chatForm("cardchat"),
			),
			// Button(
			// 	Attr("ws-send", "submit"),
			// 	Name("screenshot"),
			// 	Class("btn btn-primary"),
			// 	T("Screenshot"),
			// ),
		)
	}

	buildPage(content, "Tarot").RenderPage(w, r)
	return id
}

func getContentCard(d deps.Deps, w http.ResponseWriter, r *http.Request) string {
	id := r.PathValue("id")
	if id == "" {
		id = "content" + uuid.NewString()
		http.Redirect(w, r, "/content/"+id, http.StatusSeeOther)
		return ""
	}

	content := Div()
	card := TarotCard{}
	db := d.Docs.WithCollection("tarot")
	// Check if the card already exists in the database.
	err := db.Get(id, &card)
	if err != nil {
		// If the card doesn't exist, create a new one.
		card.Id = id
		db.Set(id, card)
	}

	if card.ContentCard.Link == "" {
		// If the card doesn't exist, create a new one.
		card.Id = id
		db.Set(id, card)
		fmt.Println("Creating new content card with id:", id)
		// Build a form that allows the user to submit a URL and a description.
		content = Div(
			T("Welcome to the Content Card Page!"),
			T("Submit a link and a description below to generate a summary and image."),
			Form(
				Attr("ws-send", "contentcard"),
				Div(
					Label(T("URL:")),
					Input(
						Type("url"),
						Name("contentlink"),
						Placeholder("Enter a URL..."),
						Class("input input-bordered w-full"),
					),
				),
				Div(
					Label(T("Description:")),
					TextArea(
						Name("contentdescription"),
						Placeholder("Enter a brief description of the content..."),
						Class("textarea textarea-bordered w-full"),
					),
				),
				Div(
					Input(
						Type("submit"),
						Value("Generate Content Card"),
						Class("btn btn-primary mt-4"),
					),
				),
			),
		)
	} else {
		fmt.Println("Content card found with id:", id)
		content = displayContentCard(card)
	}

	buildPage(content, "Content Card").RenderPage(w, r)
	return id
}

func getCard(d deps.Deps, w http.ResponseWriter, r *http.Request) string {
	id := r.PathValue("id")
	if id == "" {
		// Generate a new id. You could prefix with something (or not) as needed.
		id = "c" + uuid.NewString()
		http.Redirect(w, r, "/card/"+id, http.StatusSeeOther)
	}

	// generate qr code for link
	qrcodeUrl, err := GenerateQRCode("https://justshare.io/card/" + id)
	if err != nil {
		fmt.Println("Error generating QR code:", err)
	}

	card := TarotCard{}
	db := d.Docs.WithCollection("tarot")
	err = db.Get(id, &card)
	if err != nil {
		card.Id = id
		card.QrCodePath = qrcodeUrl
		db.Set(id, card)
	} else {
		card.QrCodePath = qrcodeUrl
		if card.ContentCard.Link != "" {
			http.Redirect(w, r, "/card/content/"+id, http.StatusSeeOther)
			return id
		} else if card.AICard.Name != "" {
			http.Redirect(w, r, "/card/tarot/"+id, http.StatusSeeOther)
			return id
		}
	}
	// Display two buttons/links to choose between Tarot Card and Content Card.
	content := Div(
		T("Select the type of card you want to create:"),
		Class("center"),
		Div(
			Class("center"),
			A(Attr("href", "/card/tarot/"+id), Class("btn btn-primary m-2"), T("Tarot Card")),
			A(Attr("href", "/card/content/"+id), Class("btn btn-secondary m-2"), T("Content Card")),
		),
		// Img(
		// 	Attr("src", qrcodeUrl),
		// 	Class("rounded-lg shadow-lg w-[16.5rem] h-[16.5rem]"),
		// ),
	)
	buildPage(content, "Select Card Type").RenderPage(w, r)
	return id
}

func NewTarot(d deps.Deps) *http.ServeMux {
	id := ""
	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			id = getCard(d, w, r)
		}
	})
	mux.HandleFunc("/tarot/{id...}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			id = getTarot(d, w, r)
		}
	})
	mux.HandleFunc("/content/{id...}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			id = getContentCard(d, w, r)
		}
	})

	archetypes := loadArchetypes()

	d.WebsocketRegistry.Register2("archetype", func(archetype string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Archetype Endpoint")
		db := d.Docs.WithCollection("tarot")
		card := TarotCard{}
		db.Get(id, &card)

		selectedArchetype := findArchetype(archetypes, archetype)
		selectedArchetypeString := ""
		if selectedArchetype != nil {
			selectedArchetypeString = fmt.Sprintf("Name: %s\nRole: %s\nExamples: %s\nThemes: %s", selectedArchetype.Name, selectedArchetype.Role, strings.Join(selectedArchetype.Examples, ", "), strings.Join(selectedArchetype.Themes, ", "))
		}

		message := "Given this archetype, " + selectedArchetypeString + ", create a new character that fits this archetype. It should have the following properties: name, role, examples, themes. Rather than making a specific character, keep it general and closer to an archetype. It should be a recognizable position in society."
		gptResp := gptCall(d, message, hub, "You are fortune teller who is trying to help someone understand an aspect of themself.")

		card.Type = *selectedArchetype
		card.Message = gptResp
		db.Set(id, card)

		display := toolCall(d, gptResp, hub, []Tool2{
			createTool2(Tool2{
				Name: "CreateArchetype",
				Desc: "Create a new archetype",
				Function: func(d deps.Deps, hub *websocket.Hub, name, role, examples, themes, description string) string {
					db := d.Docs.WithCollection("tarot")
					card := TarotCard{}
					db.Get(id, &card)
					card.AICard = AITarotCard{
						Name:        name,
						Role:        role,
						Examples:    examples,
						Themes:      themes,
						Description: description,
					}
					db.Set(id, card)
					fmt.Println("Creating archetype with description:", description)
					card, err := GenerateImage(d, id, description)
					if err != nil {
						fmt.Println("Error generating image:", err)
					}

					return Div(
						Id("content-container"),
						Attr("hx-swap-oob", "beforeend"),
						displayCard(card),
					).Render()
				},
				Props: []ToolProp2{
					{Argument: "name", Description: "Name of the archetype", Type: "string"},
					{Argument: "role", Description: "Role of the archetype", Type: "string"},
					{Argument: "examples", Description: "Examples of the archetype", Type: "string"},
					{Argument: "themes", Description: "Themes of the archetype", Type: "string"},
					{Argument: "description", Description: "A visual description of this archetype", Type: "string"},
				},
			}),
		})

		hub.Broadcast <- []byte(display)
	})

	d.WebsocketRegistry.Register2("chat", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Chat Endpoint")
		archetypeNames := []string{}
		for _, archetype := range archetypes {
			archetypeNames = append(archetypeNames, archetype.Name)
			if len(archetype.AlternativeNames) > 0 {
				archetypeNames = append(archetypeNames, archetype.AlternativeNames[rand.IntN(len(archetype.AlternativeNames))])
			}
		}
		db := d.Docs.WithCollection("tarot")
		card := TarotCard{}
		db.Get(id, &card)
		card.InitialPrompt = message
		db.Set(id, card)

		display := toolCall(d, message, hub, []Tool2{
			createTool2(Tool2{
				Name: "RelatedArchetypes",
				Desc: fmt.Sprintf("Given this prompt, \"%s\" select five related archetypes from this list: %s", message, strings.Join(archetypeNames, ", ")),
				Function: func(d deps.Deps, hub *websocket.Hub, archetypeOne string, archetypeTwo string, archetypeThree string, archetypeFour string, archetypeFive string) string {
					options := []string{
						archetypeOne,
						archetypeTwo,
						archetypeThree,
						archetypeFour,
						archetypeFive,
					}

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

	d.WebsocketRegistry.Register2("cardchat", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("CardChat Endpoint")
		archetypeNames := []string{}
		for _, archetype := range archetypes {
			archetypeNames = append(archetypeNames, archetype.Name)
			if len(archetype.AlternativeNames) > 0 {
				archetypeNames = append(archetypeNames, archetype.AlternativeNames[rand.IntN(len(archetype.AlternativeNames))])
			}
		}
		db := d.Docs.WithCollection("tarot")
		card := TarotCard{}
		db.Get(id, &card)

		assistant := fmt.Sprintf("You are %s. You are currently thinking: %s. You are defined by this: %s", card.AICard.Name, card.InitialPrompt, card.AICard.Role)

		gptResp := gptCall(d, message, hub, assistant)
		display := Div(
			Id("messages"),
			Attr("hx-swap-oob", "beforeend"),
			Div(
				Class("messages chat-end"),
				Div(
					Class("chat-bubble"),
					Div(T(gptResp)),
				),
			),
		).Render()

		hub.Broadcast <- []byte(display)
	})

	d.WebsocketRegistry.Register2("screenshot", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Screenshot Endpoint")
		db := d.Docs.WithCollection("tarot")
		card := TarotCard{}
		db.Get(id, &card)

		displayCard := buildPage(
			cardTextImageTemplate(
				card.Id,
				"rounded-lg shadow-lg w-[16.5rem] h-[25.5rem]",
				card.ImagePath,
				card.AICard.Role),
			"Tarot",
		).Render()

		err, screenshotPath := captureDivScreenshotFromHTML(displayCard, id)
		if err != nil {
			fmt.Println("Error capturing screenshot:", err)
		}
		screenshotPath = "/" + screenshotPath
		fmt.Println("Screenshot path:", screenshotPath)
		display := Div(
			Id("content-container"),
			Div(
				Class("rounded-lg shadow-lg w-[16.5rem] h-[25.5rem]"),
				Img(
					Attr("src", screenshotPath),
				),
			),
		).Render()
		hub.Broadcast <- []byte(display)

	})

	d.WebsocketRegistry.Register2("contentlink", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		fmt.Println("Contentlink Endpoint")
		// "message" is expected to be the value of the "contentlink" input (i.e. the submitted URL).
		link := message

		fmt.Println("Content Card: Received link:", link)

		aditionalContent := msgMap["contentdescription"].(string)

		// Construct a GPT prompt that instructs GPT to summarize the page and then produce an image description.
		prompt := fmt.Sprintf(
			"Please summarize this: %s. Then, generate a vivid, creative image description that captures the essence of this page.",
			aditionalContent,
		)

		// Call GPT using your existing gptCall function.
		summary := gptCall(d, prompt, hub, "You are an expert webpage summarizer and image description generator.")
		fmt.Println("Generated summary:", summary)

		// Generate an image using the summary as the prompt.
		card, err := GenerateImage(d, id, summary)
		if err != nil {
			fmt.Println("Error generating image for content card:", err)
		}

		card.ContentCard.Link = link
		card.ContentCard.Summary = summary

		// Save the card to the database.
		db := d.Docs.WithCollection("tarot")
		db.Set(id, card)

		// Build the display for the content card: show both the summary and the generated image.
		display := displayContentCard(card).Render()

		// Broadcast the generated display so the client page can update.
		hub.Broadcast <- []byte(display)
	})

	return mux
}

func displayContentCard(card TarotCard) *Node {
	return Div(
		Id("content-container"),
		Div(
			A(Attr("href", card.ContentCard.Link), T("Lint to original Content")),
		),
		Div(
			Class("card card-compact bg-base-100 shadow-xl m-4"),
			Div(
				Class("card-body"),
				H2(T("Page Summary")),
				P(T(card.ContentCard.Summary)),
			),
		),
		Div(
			Class("card card-compact bg-base-100 shadow-xl m-4"),
			Img(Attr("src", card.ImagePath), Class("rounded-lg shadow-lg")),
		),
	)
}

func displayCard(card TarotCard) *Node {
	return cardTextImageTemplate(card.Id, "rounded-lg shadow-lg w-full", card.ImagePath, card.AICard.Role)
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

func gptCall(d deps.Deps, message string, hub *websocket.Hub, assistant string) string {
	fmt.Println("Running gptCall")

	var ctx context.Context = context.Background()

	resp, err := d.AI.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4o20240513,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: assistant},
			{Role: openai.ChatMessageRoleUser, Content: message},
		},
		MaxTokens: 1000,
	})
	if err != nil {
		fmt.Println("Failed to create chat completion", err)
	}

	return resp.Choices[0].Message.Content
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



func GenerateImage(d deps.Deps, pageId string, prompt string) (TarotCard, error) {
	db := d.Docs.WithCollection("tarot")
	card := TarotCard{}

	req := openai.ImageRequest{
		Model:          openai.CreateImageModelDallE3,
		Prompt:         prompt,
		N:              1,
		Quality:        openai.CreateImageQualityHD,
		Size:           openai.CreateImageSize1024x1792,
		Style:          openai.CreateImageStyleVivid,
		ResponseFormat: openai.CreateImageResponseFormatURL,
	}

	resp, err := d.AI.CreateImage(context.Background(), req)
	if err != nil {
		return card, err
	}
	imageURL := resp.Data[0].URL

	now := strconv.Itoa(time.Now().Nanosecond())
	imagePath, err := downloadImage(imageURL, fmt.Sprintf("generated_image%s.png", now))
	if err != nil {
		return card, err
	}

	_, i := utf8.DecodeRuneInString(imagePath)
	imagePath = imagePath[i:]

	if err := db.Get(pageId, &card); err != nil {
		fmt.Println("Id not found: ", pageId)
		fmt.Println("Failed with: ", err)
		return card, err
	}
	card.ImagePath = imagePath
	if err := db.Set(pageId, card); err != nil {
		return card, err
	} else {
		fmt.Println("Saved image to:", imagePath)
	}
	return card, nil
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
