package main

import (
	. "github.com/breadchris/share/html"
)

type State struct {
	Title       string
	Skills      []string
	Projects    []string
	Description string
}

func Render() string {
	profile := State{
		Title:       "Hacker Profile",
		Description: "I'm a hacker who loves to code and build things.",
		Skills:      []string{"Go", "JavaScript", "Python", "Ruby", "C++"},
		Projects:    []string{"Project 1", "Project 2", "Project 3"},
	}
	skills := Div(Class("mb-4"),
		H2(Text("Skills")),
	)
	for _, skill := range profile.Skills {
		skills.Children = append(skills.Children, Div(Class("flex items-center"),
			Text(skill),
		))
	}
	projects := Div(Class("mb-4"),
		H2(Text("Projects")),
	)
	for _, project := range profile.Projects {
		projects.Children = append(projects.Children, Div(Class("flex items-center"),
			Text(project),
		))
	}

	mainContent := Main(Class("mt-8"),
		Section(Class("text-center"),
			H2(Class("space-y-6"), Text(profile.Title)),
			P(Text(profile.Description)),
			Form(Method("POST"), Action("/code"),
				TextArea(
					Name("description"),
					Class("textarea"), Placeholder("Enter description")),
				Button(Type("submit"), Class("btn btn-primary"), Text("Submit")),
			),
			//RenderPricingPage(),
			Div(Class("flex justify-center mt-4"),
				Img(Src("https://example.com/hacker-profile.jpg"), Class("w-48 h-48 rounded-full")),
			),
			skills,
			projects,
			Div(Class("text-center mt-4"),
				H2(Text("Contact")),
				P(Text("Email: hacker@example.com")),
				P(Text("Twitter: @hackerhandle")),
			),
		),
	)

	nav := Nav(
		Ul(Class("flex justify-center space-x-4"),
			Li(A(Href("/"), T("Home")),
				Li(A(Href("/skills"), T("Skills"))),
				Li(A(Href("/projects"), T("Projects"))),
				Li(A(Href("/contact"), T("Contact"))),
			),
		),
	)

	return Html(
		Head(
			Title(T("Hacker Profile")),
			Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"), Attr("rel", "stylesheet"), Attr("type", "text/css")),
			Script(Src("https://cdn.tailwindcss.com")),
			Style(T("body { font-family: 'Inter', sans-serif; }")),
		),
		Body(Class("min-h-screen flex flex-col items-center justify-center"),
			Div(Class("container mx-auto p-4"),
				Header(Class("text-center mb-4"),
					H1(Text("Welcome to the Hacker's Profile")),
					nav,
					mainContent,
				),
			),
		),
	).Render()
}
