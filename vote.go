package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
	"net/http"
	"reflect"
	"strings"
)

var (
	voteMux *http.ServeMux
)

type UserVote struct {
	UserID   string `json:"user_id"`
	RecipeID string `json:"recipe_id"`
}

type Recipe struct {
	RecipeID    string   `json:"recipe_id"`
	Name        string   `json:"name"`
	Ingredients []string `json:"ingredients"`
	Directions  []string `json:"directions"`
}

type Poll struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	UserVotes []UserVote `json:"user_votes"`
	Recipes   []Recipe   `json:"recipes"`
}

type FormState struct {
	Polls map[string]Poll
}

func BuildForm2(fieldPath string, data any, fieldToAdd string) *Node {
	v := reflect.ValueOf(data)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	t := v.Type()

	if v.Kind() != reflect.Struct {
		panic("data must be a struct")
	}

	form := Div()
	for i := 0; i < v.NumField(); i++ {
		field := t.Field(i)
		value := v.Field(i)

		// Build the new field path based on the current field
		currentFieldPath := fieldPath
		if fieldPath != "" {
			currentFieldPath = fmt.Sprintf("%s.%s", fieldPath, field.Name)
		} else {
			currentFieldPath = field.Name
		}

		labelText := strings.Title(field.Name)
		label := Label(For(currentFieldPath), T(labelText))

		var input *Node
		switch value.Kind() {
		case reflect.String:
			input = Input(Type("text"), Id(currentFieldPath), Name(currentFieldPath), Class("border rounded w-full py-2 px-3"), Value(value.String()))
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			input = Input(Type("number"), Id(currentFieldPath), Name(currentFieldPath), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%d", value.Int())))
		case reflect.Float32, reflect.Float64:
			input = Input(Type("number"), Id(currentFieldPath), Name(currentFieldPath), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%f", value.Float())))
		case reflect.Bool:
			checked := ""
			if value.Bool() {
				checked = "checked"
			}
			input = Input(Type("checkbox"), Id(currentFieldPath), Name(currentFieldPath), Class("border rounded w-full py-2 px-3"), Attr("checked", checked))
		case reflect.Slice:
			elemType := value.Type().Elem()
			d := Div()
			ds := Div(
				Class("p-4"),
				Div(Class("divider"), T(field.Name)),
				d,
				A(Class("btn btn-neutral"), Href(fmt.Sprintf("/?id=%s", field.Name)), T("Add")),
			)
			form.Children = append(form.Children, ds)

			if currentFieldPath == fieldToAdd {
				// Handle different slice types when adding a new element
				newElem := reflect.New(elemType).Elem() // Create a new element (empty struct or zero value)

				switch elemType.Kind() {
				case reflect.String:
					newElem = reflect.ValueOf("New value")
				case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
					newElem = reflect.ValueOf(0)
				case reflect.Float32, reflect.Float64:
					newElem = reflect.ValueOf(0.0)
				case reflect.Bool:
					newElem = reflect.ValueOf(false)
				case reflect.Struct, reflect.Ptr:
					// If it's a pointer to a struct or struct itself, ensure it's addressable
					newElem = reflect.New(elemType).Elem()
				}

				// Append the new element to the slice
				if value.CanSet() {
					value.Set(reflect.Append(value, newElem))
				} else {
					// Handle the case where the value is not directly settable (e.g., non-pointer)
					panic(fmt.Sprintf("Cannot set value for %s; it is unaddressable", currentFieldPath))
				}
			}

			for j := 0; j < value.Len(); j++ {
				sliceElem := value.Index(j)
				sliceFieldPath := fmt.Sprintf("%s.%d", currentFieldPath, j)
				var sliceInput *Node

				switch elemType.Kind() {
				case reflect.String:
					sliceInput = Input(Type("text"), Id(sliceFieldPath), Name(sliceFieldPath), Class("border rounded w-full py-2 px-3"), Value(sliceElem.String()))
				case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
					sliceInput = Input(Type("number"), Id(sliceFieldPath), Name(sliceFieldPath), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%d", sliceElem.Int())))
				case reflect.Float32, reflect.Float64:
					sliceInput = Input(Type("number"), Id(sliceFieldPath), Name(sliceFieldPath), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%f", sliceElem.Float())))
				case reflect.Bool:
					checked := ""
					if sliceElem.Bool() {
						checked = "checked"
					}
					sliceInput = Input(Type("checkbox"), Id(sliceFieldPath), Name(sliceFieldPath), Class("border rounded w-full py-2 px-3"), Attr("checked", checked))
				case reflect.Struct:
					nestedForm := BuildForm2(sliceFieldPath, sliceElem.Interface(), fieldToAdd)
					d.Children = append(d.Children, nestedForm.Children...)
					continue
				case reflect.Ptr:
					if !sliceElem.IsNil() {
						nestedForm := BuildForm2(sliceFieldPath, sliceElem.Interface(), fieldToAdd)
						d.Children = append(d.Children, nestedForm.Children...)
					} else {
						sliceInput = P(T(fmt.Sprintf("Pointer to %s is nil", elemType.Elem().Name())))
					}
				default:
					sliceInput = P(T(fmt.Sprintf("Unsupported slice element type: %s", elemType.String())))
				}

				d.Children = append(d.Children, Div(Class("mb-4"),
					Label(For(sliceFieldPath), T(fmt.Sprintf("%s %d", labelText, j+1))),
					sliceInput,
				))
			}
		case reflect.Struct:
			// Recursive call for nested structs
			nestedForm := BuildForm2(currentFieldPath, value.Interface(), fieldToAdd)
			form.Children = append(form.Children, nestedForm.Children...)
			continue
		case reflect.Ptr:
			// Handle pointer types by dereferencing
			if !value.IsNil() {
				input = BuildForm2(currentFieldPath, value.Elem().Interface(), fieldToAdd)
			} else {
				input = P(T(fmt.Sprintf("Pointer to %s is nil", field.Type.Elem().Name())))
			}
		default:
			input = P(T(fmt.Sprintf("Unsupported field type: %s", field.Type.String())))
		}

		if input != nil {
			form.Children = append(form.Children, Div(Class("mb-4"),
				label,
				input,
			))
		}
	}

	return form
}

func NewVote(d deps.Deps) *http.ServeMux {
	r := http.NewServeMux()

	r.HandleFunc("/new/ai", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			var recipe Recipe
			schema, err := jsonschema.GenerateSchemaForType(recipe)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			req := openai.ChatCompletionRequest{
				Model: openai.GPT4oMini,
				Messages: []openai.ChatCompletionMessage{
					{Role: "system", Content: "You are a professional chef. You provide great recipes."},
					{Role: "user", Content: "Create a new recipe for " + r.FormValue("description")},
				},
				ResponseFormat: &openai.ChatCompletionResponseFormat{
					Type: openai.ChatCompletionResponseFormatTypeJSONSchema,
					JSONSchema: &openai.ChatCompletionResponseFormatJSONSchema{
						Name:   "create_recipe",
						Schema: schema,
						Strict: true,
					},
				},
			}
			res, err := d.AI.Client.CreateChatCompletion(context.Background(), req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			for _, choice := range res.Choices {
				if choice.Message.Role == "assistant" {
					err := json.Unmarshal([]byte(choice.Message.Content), &recipe)
					if err != nil {
						http.Error(w, err.Error(), http.StatusInternalServerError)
						return
					}
				}
			}

			BuildForm2("", recipe, "").RenderPage(w, r)
			return
		}
		DefaultLayout(
			Div(
				ReloadNode("vote.go"),
				Class("container mx-auto mt-10 p-5"),
				Form(
					HxPost("/vote/new/ai"),
					HxTarget("#result"),
					Input(Type("text"), Name("description"), Class("input"), Placeholder("Description")),
					Button(Class("btn btn-neutral"), Type("submit"), T("Generate Recipe")),
				),
				Div(Id("result")),
			),
		).RenderPage(w, r)
		return
	})

	r.HandleFunc("/new/{id...}", func(w http.ResponseWriter, r *http.Request) {
		_, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		var poll Poll
		id := r.PathValue("id")
		if id == "" {
			poll.ID = uuid.NewString()
			err = d.DB.Set(poll.ID, poll)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			http.Redirect(w, r, fmt.Sprintf("/vote/new/%s", poll.ID), http.StatusSeeOther)
			return
		} else {
			// remove trailing slash from id
			if strings.HasSuffix(id, "/") {
				id = id[:len(id)-1]
			}
			b, ok := d.DB.Get(id)
			if !ok {
				http.Error(w, "Poll not found", http.StatusNotFound)
				return
			}
			err := json.Unmarshal(b, &poll)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		fieldName := r.URL.Query().Get("id")
		f := BuildForm2("", &poll, fieldName)

		if fieldName != "" {
			err := d.DB.Set(poll.ID, poll)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			http.Redirect(w, r, fmt.Sprintf("/vote/new/%s", poll.ID), http.StatusSeeOther)
			return
		}

		ctx := context.WithValue(r.Context(), "baseURL", "/vote/new/"+id)
		DefaultLayout(
			Div(
				ReloadNode("vote.go"),
				Class("container mx-auto mt-10 p-5"),
				Form(
					Method("POST"),
					Action("/new"),
					f,
					Button(Class("btn btn-neutral"), Type("submit"), T("save")),
				),
			),
		).RenderPageCtx(ctx, w, r)
		return
	})

	r.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		user, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		id := r.PathValue("id")
		if id == "" {
			ctx := context.WithValue(r.Context(), "baseURL", "/vote")
			DefaultLayout(
				Div(
					Class("container mx-auto mt-10 p-5"),
					A(T("New Vote"), Class("btn"), Href("/new/")),
				),
			).RenderPageCtx(ctx, w, r)
			return
		}

		b, ok := d.DB.Get(id)
		if !ok {
			http.Error(w, "Poll not found", http.StatusNotFound)
			return
		}

		var state FormState
		err = json.Unmarshal(b, &state)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		poll, ok := state.Polls[id]
		if !ok {
			http.Error(w, "Poll not found", http.StatusNotFound)
			return
		}

		if r.Method == http.MethodPost {
			var (
				removed         bool
				recipeVoteCount int
				newVotes        []UserVote
			)
			for _, userVote := range poll.UserVotes {
				if userVote.RecipeID == id && userVote.UserID == user {
					removed = true
					continue
				}
				if userVote.RecipeID == id {
					recipeVoteCount++
				}
				newVotes = append(newVotes, userVote)
			}
			poll.UserVotes = newVotes

			if !removed {
				poll.UserVotes = append(poll.UserVotes, UserVote{UserID: user, RecipeID: id})
				recipeVoteCount++
			}
			state.Polls[id] = poll

			err := d.DB.Set("vote", state)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.Write([]byte(fmt.Sprintf("%d", recipeVoteCount)))
			return
		}
		ctx := context.WithValue(r.Context(), "baseURL", "/vote")
		vote(poll).RenderPageCtx(ctx, w, r)
	})
	return r
}

func vote(state Poll) *Node {
	recipeList := Ul(Class("divide-y divide-gray-100"), Role("list"))

	for _, recipe := range state.Recipes {
		ingredeintsList := Ul(Class("flex flex-wrap gap-x-2 gap-y-1"), Role("list"))
		for _, ingredient := range recipe.Ingredients {
			ingredeintsList.Children = append(ingredeintsList.Children, Li(Class("text-xs badge badge-neutral"), T(ingredient)))
		}

		var voteCount int
		for _, userVote := range state.UserVotes {
			if userVote.RecipeID == recipe.RecipeID {
				voteCount++
			}
		}

		recipeItem := Li(Class("flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-5 sm:flex-nowrap"),
			Div(
				P(Class("text-sm font-semibold leading-6 m-2"),
					A(Href("#"), Class("hover:underline"), T(recipe.Name)),
					ingredeintsList,
				),
				Div(Class("mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500")), // P(A(Href("#"), Class("hover:underline"), T("Anonymous"))), // Placeholder author
				// Svg(ViewBox("0 0 2 2"), Class("h-0.5 w-0.5 fill-current"),
				// 	Path(D("M1 1h0")), // Small circle separator
				// ),
				// P(T("2d ago")), // Placeholder time

			),
			Dl(Class("flex w-full flex-none justify-between gap-x-8 sm:w-auto"),
				/*
					Div(Class("flex -space-x-0.5"),
						Dt(Class("sr-only"), T("Commenters")),
						// Placeholder for commenter avatars
						Dd(Img(Class("h-6 w-6 rounded-full bg-gray-50 ring-2 ring-white"),
							Attr("src", "https://via.placeholder.com/40"),
							Attr("alt", "Placeholder 1"),
						)),
						Dd(Img(Class("h-6 w-6 rounded-full bg-gray-50 ring-2 ring-white"),
							Attr("src", "https://via.placeholder.com/40"),
							Attr("alt", "Placeholder 2"),
						)),
						Dd(Img(Class("h-6 w-6 rounded-full bg-gray-50 ring-2 ring-white"),
							Attr("src", "https://via.placeholder.com/40"),
							Attr("alt", "Placeholder 3"),
						)),
					),
				*/
				Div(Class("flex w-16 gap-x-2.5"),
					Dd(
						Button(Class("btn btn-neutral"), HxPost(fmt.Sprintf("/vote/?id=%s", recipe.RecipeID)), T(fmt.Sprintf("%d", voteCount))),
					),
				),
			),
		)
		recipeList.Children = append(recipeList.Children, recipeItem)
	}

	// Form layout
	return Html(
		Head(
			Title(T("Vote")),
			TailwindCSS,
			DaisyUI,
			HTMX,
		),
		Body(
			Div(Class("container mx-auto mt-10 p-5"),
				H1(Class("text-center text-3xl font-bold mb-4"), T("vote")),
				recipeList,
			),
		),
	)
}
