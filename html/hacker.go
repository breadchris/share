package html

type State struct {
	Title       string
	Skills      []string
	Projects    []string
	Description string
}

func RenderPricingPage() *Node {
	return Div(Class("bg-white py-24 sm:py-32"),
		Div(Class("mx-auto max-w-7xl px-6 lg:px-8"),
			Div(Class("mx-auto max-w-2xl sm:text-center"),
				H2(Class("text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"), T("Simple kicks pricing")),
				P(Class("mt-6 text-lg leading-8 text-gray-600"), T("Distinctio et nulla eum soluta et neque labore quibusdam. Saepe et quasi iusto modi velit ut non voluptas in. Explicabo id ut laborum.")),
			),
			Div(Class("mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none"),
				Div(Class("p-8 sm:p-10 lg:flex-auto"),
					H3(Class("text-2xl font-bold tracking-tight text-gray-900"), T("Death membership")),
					P(Class("mt-6 text-base leading-7 text-gray-600"), T("Lorem ipsum dolor sit amet consect etur adipisicing elit. Itaque amet indis perferendis blanditiis repellendus etur quidem assumenda.")),
					Div(Class("mt-10 flex items-center gap-x-4"),
						H4(Class("flex-none text-sm font-semibold leading-6 text-indigo-600"), T("What’s included")),
						Div(Class("h-px flex-auto bg-gray-100")),
					),
					Ul(Class("mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), At("viewBox", "0 0 20 20"), At("fill", "currentColor"),
								Path(At("fill-rule", "evenodd"), At("d", "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"), At("clip-rule", "evenodd")),
							),
							T("Private forum access"),
						),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), At("viewBox", "0 0 20 20"), At("fill", "currentColor"),
								Path(At("fill-rule", "evenodd"), At("d", "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"), At("clip-rule", "evenodd")),
							),
							T("Member resources"),
						),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), At("viewBox", "0 0 20 20"), At("fill", "currentColor"),
								Path(At("fill-rule", "evenodd"), At("d", "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"), At("clip-rule", "evenodd")),
							),
							T("Entry to annual conference"),
						),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), At("viewBox", "0 0 20 20"), At("fill", "currentColor"),
								Path(At("fill-rule", "evenodd"), At("d", "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"), At("clip-rule", "evenodd")),
							),
							T("Official member t-shirt"),
						),
					),
				),
				Div(Class("-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0"),
					Div(Class("rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16"),
						Div(Class("mx-auto max-w-xs px-8"),
							P(Class("text-base font-semibold text-gray-600"), T("Pay once, own it forever")),
							P(Class("mt-6 flex items-baseline justify-center gap-x-2"),
								Span(Class("text-5xl font-bold tracking-tight text-gray-900"), T("$349")),
								Span(Class("text-sm font-semibold leading-6 tracking-wide text-gray-600"), T("USD")),
							),
							A(Href("#"), Class("mt-10 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"), T("Get access")),
							P(Class("mt-6 text-xs leading-5 text-gray-600"), T("Invoices and receipts available for easy company reimbursement")),
						),
					),
				),
			),
		),
	)
}

func RenderHacker(profile State) string {
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
			BuildHTMLForm(profile),
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
