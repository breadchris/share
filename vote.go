package main

import (
	"context"
	"encoding/json"
	"fmt"
	. "github.com/breadchris/share/html"
	"net/http"
	"sync"
)

var (
	voteMux *http.ServeMux
	vmu     sync.Mutex
)

type UserVote struct {
	UserID         string   `json:"user_id"`
	Name           string   `json:"name"`
	Email          string   `json:"email"`
	VotedRecipeIDs []string `json:"voted_recipe_ids"`
}

type Recipe struct {
	RecipeID    string   `json:"recipe_id"`
	Name        string   `json:"name"`
	Ingredients []string `json:"ingredients"`
	VoteCount   int      `json:"vote_count"`
}

type FormState struct {
	Users   []UserVote `json:"users"`
	Recipes []Recipe   `json:"recipes"`
}

func formBuilder(ctx context.Context) *Node {
	stateData := ctx.Value("state").(string)
	var state FormState
	if err := json.Unmarshal([]byte(stateData), &state); err != nil {
		return Div(Class("text-red-500"), T(fmt.Sprintf("Error parsing state data: %v", err)))
	}

	recipeList := Ul(Class("divide-y divide-gray-100"), Role("list"))

	for _, recipe := range state.Recipes {
		ingredeintsList := Ul(Class("flex flex-wrap gap-x-2 gap-y-1"), Role("list"))
		for _, ingredient := range recipe.Ingredients {
			ingredeintsList.Children = append(ingredeintsList.Children, Li(Class("text-xs badge badge-neutral"), T(ingredient)))
		}
		recipeItem := Li(Class("flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-5 sm:flex-nowrap"),
			Div(
				P(Class("text-sm font-semibold leading-6 m-2"),
					A(Href("#"), Class("hover:underline"), T(recipe.Name)),
					ingredeintsList,
				),
				Div(Class("mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500"),
					P(A(Href("#"), Class("hover:underline"), T("Anonymous"))), // Placeholder author
					Svg(ViewBox("0 0 2 2"), Class("h-0.5 w-0.5 fill-current"),
						Path(D("M1 1h0")), // Small circle separator
					),
					P(T("2d ago")), // Placeholder time
				),
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
					Dt(Span(Class("sr-only"), T("Total comments"))),
					Dd(
						Button(Class("btn btn-neutral"), T(fmt.Sprintf("%d", recipe.VoteCount))),
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
