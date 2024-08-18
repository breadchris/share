package main

import (
	"net/http"
	"testing"
)

func TestHTML(t *testing.T) {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		m := Main(Class("mt-8"),
			Section(Class("text-center"),
				H2(Text("Submit a New Recipe")),
				Form(Method("POST"), Action("/submit"),
					Div(Class("mb-4"),
						Label(For("title"), T("Recipe Title")),
						Input(Type("text"), Id("title"), Name("title"), Class("border rounded w-full py-2 px-3")),
					),
					Div(Class("mb-4"),
						Label(For("ingredients"), T("Ingredients")),
						TextArea(Id("ingredients"), Name("ingredients"), Class("border rounded w-full py-2 px-3"), Rows(5)),
					),
					Div(Class("mb-4"),
						Label(For("instructions"), T("Instructions")),
						TextArea(Id("instructions"), Name("instructions"), Class("border rounded w-full py-2 px-3"), Rows(5)),
					),
					Div(Class("text-center"),
						Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Submit Recipe")),
					)),
			),
		)
		nav := Nav(
			Ul(Class("flex justify-center space-x-4"),
				Li(A(Href("/"), T("Home")),
					Li(A(Href("/recipes"), T("Recipes"))),
					Li(A(Href("/submit"), T("Submit a Recipe"))),
				),
			),
		)
		render(w, Html(
			Head(
				Title(T("Recipe Site")),
				Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"), At("rel", "stylesheet"), At("type", "text/css")),
				Script(Src("https://cdn.tailwindcss.com")),
				Style(T("body { font-family: 'Inter', sans-serif; }")),
			),
			Body(Class("min-h-screen flex flex-col items-center justify-center"),
				Div(Class("container mx-auto p-4"),
					Header(Class("text-center mb-4"),
						H1(Text("Welcome to the Recipe Site")),
						nav,
						m,
					),
				),
			),
		))
	})
	if err := http.ListenAndServe(":8080", nil); err != nil {
		t.Fatal(err)
	}
}
