package escapecentauri

import (
	"fmt"
	"net/http"
	"reflect"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
)

type Game struct {
	ID string
}

type ManualPower struct {
	Computer    string
	LifeSupport string
}

type Chat struct {
	Message string
}

func RegisterCardWebsocketHandlers(d deps.Deps) {
	// d.WebsocketRegistry.RegisterGeneric(ManualPower{}, nil)
	d.WebsocketRegistry.RegisterGeneric(Chat{}, func(input interface{}, w http.ResponseWriter, r *http.Request) []string {
		// tool := creaeTool()

		// var tools = []openai.AssistantTool{tool}
		// assistantRequest := openai.AssistantRequest{
		// 	Model:        "gpt-40",
		// 	Name:         ptr("Ship Computer"),
		// 	Instructions: ptr("You are the ship computer. You are responsible for the ship's systems. You must keep the ship running and the crew alive."),
		// 	Tools:        tools,
		// }
		// ai, err := d.AI.CreateAssistant(r.Context(), assistantRequest)
		// if err != nil {
		// 	http.Error(w, "failed to create assistant", http.StatusInternalServerError)
		// 	return nil
		// }


		return []string{
			Div(
				Id("content-container"),
				Form(
					Attr("ws-send", "submit"),
					Input(
						Type("text"),
						Name("typeName"),
						Value("Chat"),
					),
					Input(
						Type("submit"),
						Value("Submit"),
					)),
			).Render(),
		}
	})
}

func NewGame(d deps.Deps) *http.ServeMux {
	RegisterCardWebsocketHandlers(d)
	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			get(d, w, r)
		}
	})
	return mux
}
func test(input string) {
	fmt.Println("test: ", input)
}

type Parameter struct {
	Type                 string          `json:"type"`
	Properties           map[string]Prop `json:"properties"`
	Required             []string        `json:"required"`
	AdditionalProperties bool            `json:"additionalProperties"`
}

type Prop struct {
	Type        string `json:"type"`
	Description string `json:"description"`
}

func creaeTool() openai.AssistantTool {
	tool := openai.AssistantTool{}
	tool.Type = openai.AssistantToolTypeFunction
	tool.Function = &openai.FunctionDefinition{
		Name:        "test",
		Description: "test",
		Parameters: Parameter{
			Type: "object",
			Properties: map[string]Prop{
				"input": {
					Type:        "string",
					Description: "An input string that will be printed to the console",
				},
			},
			Required:             []string{"messagePrompt", "imagePrompt"},
			AdditionalProperties: false,
		},
	}
	return tool
}

func get(d deps.Deps, w http.ResponseWriter, r *http.Request) {
	db := d.Docs.WithCollection("game")

	game := Game{}
	id := r.PathValue("id")

	if id == "" {
		id = "g" + uuid.NewString()
		game.ID = id
		if err := db.Set(id, game); err != nil {
			http.Error(w, "failed to create game", http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, "/game/"+id, http.StatusSeeOther)
		return
	}
	if err := db.Get(id, &game); err != nil {
		http.Error(w, "failed to get game", http.StatusInternalServerError)
		return
	}

	body := Div(
		Div(
			Id("content-container"),
			Form(
				Attr("ws-send", "submit"),
				HxTrigger("load"),
				Input(
					Type("text"),
					Attr("hidden", ""),
					Name("typeName"),
					Value("Chat"),
				)),
		),
	)
	NewWebsocketPage(body.Children).RenderPage(w, r)
}

func NewWebsocketPage(children []*Node) *Node {
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

func getType[T any](myvar T) string {
	if t := reflect.TypeOf(myvar); t.Kind() == reflect.Ptr {
		return "*" + t.Elem().Name()
	} else {
		return t.Name()
	}
}
