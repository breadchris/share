package main

import (
	"context"
	"encoding/json"
	"fmt"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
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

func BuildForm2(data any) *Node {
	v := reflect.ValueOf(data)
	t := reflect.TypeOf(data)

	if v.Kind() != reflect.Struct {
		return P(T(fmt.Sprintf("Unsupported type: %s", t.String())))
	}

	form := Form(Method("POST"), Action("/submit"))
	for i := 0; i < v.NumField(); i++ {
		field := t.Field(i)
		value := v.Field(i)

		labelText := strings.Title(field.Name)

		label := Label(For(field.Name), T(labelText))

		var input *Node
		switch value.Kind() {
		case reflect.String:
			input = Input(Type("text"), Id(field.Name), Name(field.Name), Class("border rounded w-full py-2 px-3"), Value(value.String()))
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			input = Input(Type("number"), Id(field.Name), Name(field.Name), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%d", value.Int())))
		case reflect.Float32, reflect.Float64:
			input = Input(Type("number"), Id(field.Name), Name(field.Name), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%f", value.Float())))
		case reflect.Bool:
			checked := ""
			if value.Bool() {
				checked = "checked"
			}
			input = Input(Type("checkbox"), Id(field.Name), Name(field.Name), Class("border rounded w-full py-2 px-3"), Attr("checked", checked))
		case reflect.Slice:
			switch t := value.Type().Elem(); t.Kind() {
			case reflect.Struct:
				form.Children = append(form.Children, BuildForm2(t))

			case reflect.String:
				for j := 0; j < value.Len(); j++ {
					sliceElem := value.Index(j)
					inputName := fmt.Sprintf("%s.%d", field.Name, j) // <name>.<i> format
					sliceInput := Input(Type("text"), Id(inputName), Name(inputName), Class("border rounded w-full py-2 px-3"), Value(sliceElem.String()))
					div := Div(Class("mb-2"), Button(HxPut("/new/add_field?field="+inputName), T("new")), Button(HxDelete("/new/delete_field?field="+inputName), T("delete")))
					div.Children = append(form.Children, Div(Class("mb-4"),
						Label(For(inputName), T(fmt.Sprintf("%s %d", labelText, j+1))),
						sliceInput,
					))
					form.Children = append(form.Children, div)
				}
			default:
				input = P(T(fmt.Sprintf("Unsupported slice type: %s", field.Type.String())))
			}
		default:
			input = P(T(fmt.Sprintf("Unsupported field type: %s", field.Type.String())))
		}

		form.Children = append(form.Children, Div(Class("mb-4"),
			label,
			input,
		))
	}

	form.Children = append(form.Children, Div(Class("text-center"),
		Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Submit")),
	))

	return form
}

func NewVote(d Deps) *http.ServeMux {
	r := http.NewServeMux()

	r.HandleFunc("/new/{id...}", func(w http.ResponseWriter, r *http.Request) {
		_, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		var state Poll
		id := r.PathValue("id")
		if id == "" {
			state.ID = uuid.NewString()
			err = d.DB.Set(state.ID, state)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		} else {
			b, ok := d.DB.Get(id)
			if !ok {
				http.Error(w, "Poll not found", http.StatusNotFound)
				return
			}
			err := json.Unmarshal(b, &state)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		if r.Method == http.MethodPost {
			http.Redirect(w, r, "/vote", http.StatusFound)
			return
		}

		DefaultLayout(
			Div(
				ReloadNode("vote.go"),
				Class("container mx-auto mt-10 p-5"),
				P(T("new vote")),
				Form(
					Method("POST"),
					Action("/new"),
					Input(Placeholder("name")),
					BuildForm2(Poll{}),
					Button(Class("btn btn-neutral"), Type("submit"), T("save")),
				),
			),
		).RenderPage(w, r)
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
