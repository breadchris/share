package main

import (
	. "github.com/breadchris/share/html2"
)

func RenderComponents() *Node {
	return Html(
		Head(
			Title(T("Hacker Profile")),
			Link(
				Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"),
				Attr("rel", "stylesheet"),
				Attr("type", "text/css"),
			),
			Script(Src("https://cdn.tailwindcss.com")),
			Style(T("body { font-family: 'Inter', sans-serif; }")),
		),
		//RenderButtons(),
		//RenderHero(),
		//RenderListWithCheckbox(),
		RenderNameOfTheComponent(),
	)
}

func RenderButton() *Node {
	return Button(Class("btn"), Div(Text("Button")))
}

func RenderButtons() *Node {
	return Div(
		Class("bg-base-300 rounded-b-box rounded-se-box relative overflow-x-auto"),
		Div(
			Class(
				"preview border-base-300 bg-base-100 rounded-b-box rounded-se-box flex min-h-[6rem] min-w-[18rem] max-w-4xl flex-wrap items-center justify-center gap-2 overflow-x-hidden bg-cover bg-top p-4 [border-width:var(--tab-border)]",
			),
			A(
				Href("/components/button/#buttons-with-different-html-tags"),
				Class("btn"),
				Div(Text("Link")),
			),
			Button(Type("submit"), Class("btn"), Div(Text("Button"))),
			Input(Type("button"), Value("Input"), Class("btn")),
			Input(Type("submit"), Value("Submit"), Class("btn")),
			Input(Class("btn"), Type("radio")),
			Input(Class("btn"), Type("checkbox")),
			Input(Type("reset"), Value("Reset"), Class("btn")),
		),
	)
}

func RenderHero() *Node {
	return Div(
		Class("bg-white"),
		Header(
			Class("absolute inset-x-0 top-0 z-50"),
			Nav(
				Class("flex items-center justify-between p-6 lg:px-8"),
				Div(
					Class("flex lg:flex-1"),
					A(
						Href("#"),
						Class("-m-1.5 p-1.5"),
						Span(Class("sr-only"), Div(Text("Your Company"))),
						Img(
							Src("https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"),
							Class("h-8 w-auto"),
						),
					),
				),
				Div(
					Class("flex lg:hidden"),
					Button(
						Class(
							"-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700",
						),
						Type("button"),
						Span(Class("sr-only"), Div(Text("Open main menu"))),
					),
				),
				Div(
					Class("hidden lg:flex lg:gap-x-12"),
					A(
						Href("#"),
						Class("text-sm font-semibold leading-6 text-gray-900"),
						Div(Text("Product")),
					),
					A(
						Href("#"),
						Class("text-sm font-semibold leading-6 text-gray-900"),
						Div(Text("Features")),
					),
					A(
						Href("#"),
						Class("text-sm font-semibold leading-6 text-gray-900"),
						Div(Text("Marketplace")),
					),
					A(
						Href("#"),
						Class("text-sm font-semibold leading-6 text-gray-900"),
						Div(Text("Company")),
					),
				),
				Div(
					Class("hidden lg:flex lg:flex-1 lg:justify-end"),
					A(
						Href("#"),
						Class("text-sm font-semibold leading-6 text-gray-900"),
						Div(Text("Log in")),
						Span(Div(Text("→"))),
					),
				),
			),
		),
		Div(
			Class("relative isolate px-6 pt-14 lg:px-8"),
			Div(
				Class(
					"absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80",
				),
				Div(
					Style(
						T(
							"clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%);",
						),
					),
					Class(
						"relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]",
					),
				),
			),
			Div(
				Class("mx-auto max-w-2xl py-32 sm:py-48 lg:py-56"),
				Div(
					Class("hidden sm:mb-8 sm:flex sm:justify-center"),
					Div(
						Class(
							"relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20",
						),
						Div(Text("Announcing our next round of funding.")),
						A(
							Href("#"),
							Class("font-semibold text-indigo-600"),
							Span(Class("absolute inset-0")),
							Div(Text("Read more")),
							Span(Div(Text("→"))),
						),
					),
				),
				Div(
					Class("text-center"),
					H1(
						Class("text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"),
						Div(Text("Data to enrich your online business")),
					),
					P(
						Class("mt-6 text-lg leading-8 text-gray-600"),
						Div(
							Text(
								"Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat fugiat aliqua.",
							),
						),
					),
					Div(
						Class("mt-10 flex items-center justify-center gap-x-6"),
						A(
							Href("#"),
							Class(
								"rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
							),
							Div(Text("Get started")),
						),
						A(
							Href("#"),
							Class("text-sm font-semibold leading-6 text-gray-900"),
							Div(Text("Learn more")),
							Span(Div(Text("→"))),
						),
					),
				),
			),
			Div(
				Class(
					"absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]",
				),
				Div(
					Class(
						"relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]",
					),
					Style(
						T(
							"clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%);",
						),
					),
				),
			),
		),
	)
}

func RenderListWithCheckbox() *Node {
	return Div(
		Class("flex items-center justify-center bg-white px-4 py-12"),
		Div(
			Class("mx-auto w-full max-w-lg"),
			Div(
				Div(Class("sr-only"), Div(Text("Notifications"))),
				Div(
					Class("space-y-5"),
					Div(
						Class("relative flex items-start"),
						Div(
							Class("flex h-6 items-center"),
							Input(
								Class(
									"h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600",
								),
								Id("comments"),
								Name("comments"),
								Type("checkbox"),
							),
						),
						Div(
							Class("ml-3 text-sm leading-6"),
							Label(
								For("comments"),
								Class("font-medium text-gray-900"),
								Div(Text("New comments")),
							),
							Span(
								Id("comments-description"),
								Class("text-gray-500"),
								Span(Class("sr-only"), Div(Text("New comments"))),
								Div(Text("so you always know what's happening.")),
							),
						),
					),
					Div(
						Class("relative flex items-start"),
						Div(
							Class("flex h-6 items-center"),
							Input(
								Name("candidates"),
								Type("checkbox"),
								Class(
									"h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600",
								),
								Id("candidates"),
							),
						),
						Div(
							Class("ml-3 text-sm leading-6"),
							Label(
								For("candidates"),
								Class("font-medium text-gray-900"),
								Div(Text("New candidates")),
							),
							Span(
								Class("text-gray-500"),
								Id("candidates-description"),
								Span(Class("sr-only"), Div(Text("New candidates"))),
								Div(Text("who apply for any open postings.")),
							),
						),
					),
					Div(
						Class("relative flex items-start"),
						Div(
							Class("flex h-6 items-center"),
							Input(
								Class(
									"h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600",
								),
								Id("offers"),
								Name("offers"),
								Type("checkbox"),
							),
						),
						Div(
							Class("ml-3 text-sm leading-6"),
							Label(
								For("offers"),
								Class("font-medium text-gray-900"),
								Div(Text("Offers")),
							),
							Span(
								Id("offers-description"),
								Class("text-gray-500"),
								Span(Class("sr-only"), Div(Text("Offers"))),
								Div(Text("when they are accepted or rejected by candidates.")),
							),
						),
					),
				),
			),
		),
	)
}

func RenderNameOfTheComponent() *Node {
	return Div(
		Class("flex items-center justify-center bg-white px-4 py-12"),
		Div(
			Class("mx-auto w-full max-w-lg"),
			Div(
				Div(
					Class("text-base font-semibold leading-6 text-gray-900"),
					Div(Text("Members")),
				),
				Div(
					Class("mt-4 divide-y divide-gray-200 border-b border-t border-gray-200"),
					Div(
						Class("relative flex items-start py-4"),
						Div(
							Class("min-w-0 flex-1 text-sm leading-6"),
							Label(
								Class("select-none font-medium text-gray-900"),
								For("person-1"),
								Div(Text("Annette Black")),
							),
						),
						Div(
							Class("ml-3 flex h-6 items-center"),
							Input(
								Id("person-1"),
								Name("person-1"),
								Type("checkbox"),
								Class(
									"h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600",
								),
							),
						),
					),
					Div(
						Class("relative flex items-start py-4"),
						Div(
							Class("min-w-0 flex-1 text-sm leading-6"),
							Label(
								For("person-2"),
								Class("select-none font-medium text-gray-900"),
								Div(Text("Cody Fisher")),
							),
						),
						Div(
							Class("ml-3 flex h-6 items-center"),
							Input(
								Id("person-2"),
								Name("person-2"),
								Type("checkbox"),
								Class(
									"h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600",
								),
							),
						),
					),
					Div(
						Class("relative flex items-start py-4"),
						Div(
							Class("min-w-0 flex-1 text-sm leading-6"),
							Label(
								For("person-3"),
								Class("select-none font-medium text-gray-900"),
								Div(Text("Courtney Henry")),
							),
						),
						Div(
							Class("ml-3 flex h-6 items-center"),
							Input(
								Id("person-3"),
								Name("person-3"),
								Type("checkbox"),
								Class(
									"h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600",
								),
							),
						),
					),
					Div(
						Class("relative flex items-start py-4"),
						Div(
							Class("min-w-0 flex-1 text-sm leading-6"),
							Label(
								For("person-4"),
								Class("select-none font-medium text-gray-900"),
								Div(Text("Kathryn Murphy")),
							),
						),
						Div(
							Class("ml-3 flex h-6 items-center"),
							Input(
								Id("person-4"),
								Name("person-4"),
								Type("checkbox"),
								Class(
									"h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600",
								),
							),
						),
					),
					Div(
						Class("relative flex items-start py-4"),
						Div(
							Class("min-w-0 flex-1 text-sm leading-6"),
							Label(
								For("person-5"),
								Class("select-none font-medium text-gray-900"),
								Div(Text("Theresa Webb")),
							),
						),
						Div(
							Class("ml-3 flex h-6 items-center"),
							Input(
								Id("person-5"),
								Name("person-5"),
								Type("checkbox"),
								Class(
									"h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600",
								),
							),
						),
					),
				),
			),
		),
	)
}
