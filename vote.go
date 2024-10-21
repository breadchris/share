package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	jsonpatch "github.com/evanphx/json-patch/v5"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
	"net/http"
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

type JSONPatchOp string

const (
	JSONPatchOpAdd     JSONPatchOp = "add"
	JSONPatchOpRemove  JSONPatchOp = "remove"
	JSONPatchOpReplace JSONPatchOp = "replace"
)

type JSONPatch struct {
	Op    JSONPatchOp `json:"op"`
	Path  string      `json:"path"`
	Value any         `json:"value"`
}

// TODO breadchris this should be replaced by traversing the struct and applying the patch
func ApplyJSONPatch(original, new any, patch []JSONPatch) error {
	originalJSON, err := json.Marshal(original)
	if err != nil {
		return fmt.Errorf("failed to marshal original data: %w", err)
	}

	p, err := json.Marshal(patch)
	if err != nil {
		return fmt.Errorf("failed to marshal patch data: %w", err)
	}
	obj, err := jsonpatch.DecodePatch(p)
	if err != nil {
		return fmt.Errorf("failed to decode JSON patch: %w", err)
	}

	modifiedJSON, err := obj.Apply(originalJSON)
	if err != nil {
		return fmt.Errorf("failed to apply JSON patch: %w", err)
	}

	err = json.Unmarshal(modifiedJSON, new)
	if err != nil {
		return fmt.Errorf("failed to unmarshal patched data: %w", err)
	}

	return nil
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

			BuildForm("", recipe).RenderPage(w, r)
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

		if r.URL.Query().Get("op") != "" {
			var patch JSONPatch
			patch.Op = JSONPatchOp(r.URL.Query().Get("op"))
			patch.Path = strings.ToLower(r.URL.Query().Get("path"))
			if r.URL.Query().Get("value") != "" {
				err := json.Unmarshal([]byte(r.URL.Query().Get("value")), &patch.Value)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
			}

			var newPoll Poll
			err = ApplyJSONPatch(poll, &newPoll, []JSONPatch{patch})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			poll = newPoll
			err = d.DB.Set(poll.ID, poll)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		if r.Method == http.MethodPost {
			err := r.ParseForm()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			var patches []JSONPatch
			for name, value := range r.Form {
				// create add patch for each name and value
				v := value[0]
				if v == "" {
					continue
				}
				patches = append(patches, JSONPatch{
					Op:    JSONPatchOpAdd,
					Path:  name,
					Value: v,
				})
			}
			fmt.Printf("%+v\n", patches)
			var newPoll Poll
			err = ApplyJSONPatch(poll, &newPoll, patches)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			poll = newPoll
			err = d.DB.Set(poll.ID, poll)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			return
		}

		fieldName := r.URL.Query().Get("id")
		f := BuildForm("", &poll)

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
					HxPost("/"),
					HxTarget("#form"),
					Div(
						Id("form"),
						f,
					),
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

		if strings.HasSuffix(id, "/") {
			id = id[:len(id)-1]
		}
		b, ok := d.DB.Get(id)
		if !ok {
			http.Error(w, "Poll not found", http.StatusNotFound)
			return
		}

		var poll Poll
		err = json.Unmarshal(b, &poll)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
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

			err := d.DB.Set(id, poll)
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
