package html

func RenderHacker() string {
	type state struct {
		Title       string
		Skills      []string
		Projects    []string
		Description string
	}
	profile := state{
		Title:       "Hacker Profile",
		Skills:      []string{"Go", "Python", "Reverse Engineering", "Cryptography"},
		Projects:    []string{"Project X", "Deep Dive", "SecureComm"},
		Description: "Experienced hacker with a focus on cybersecurity, cryptography, and building robust systems. Passionate about exploring the unknown and solving complex challenges.",
	}

	// Skills Section
	skills := Div(Class("mb-4"),
		H2(Text("Skills")),
	)
	for _, skill := range profile.Skills {
		skills.Children = append(skills.Children, Div(Class("flex items-center"),
			Text(skill),
		))
	}

	// Projects Section
	projects := Div(Class("mb-4"),
		H2(Text("Projects")),
	)
	for _, project := range profile.Projects {
		projects.Children = append(projects.Children, Div(Class("flex items-center"),
			Text(project),
		))
	}

	// Main Content
	mainContent := Main(Class("mt-8"),
		Section(Class("text-center"),
			H2(Text(profile.Title)),
			P(Text(profile.Description)),
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
			Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"), At("rel", "stylesheet"), At("type", "text/css")),
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
