package main

import (
	. "github.com/breadchris/share/html"
)

type Item struct {
	ID    int64
	Value string
}

func RenderComponents() *Node {
	return Html(
		Head(
			Title(T("Hacker Profile")),
			DaisyUI,
			TailwindCSS,
			HTMX,
			Style(T("body { font-family: 'Inter', sans-serif; }")),
			ReloadNode("scratch.go"),
		),
		Form(
			Method("POST"),
			HxPost("/scratch"),
			HxTrigger("submit"),
			HxTarget("#list"),
			Input(Name("value")),
			Button(Type("submit"), T("Submit")),
		),
		//RenderReviews(),
		//RenderList(db),
		RenderButtons(),
		//RenderHero(),
		//RenderListWithCheckbox(),
		//RenderNameOfTheComponent(),
		RenderCarousel(),
		//RenderDoubleCalendar(),
		RenderChatBubble(),
		//RenderProgress2(),
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

func RenderCarousel() *Node {
	return Div(
		Class("bg-base-300 rounded-b-box rounded-se-box relative overflow-x-auto"),
		Div(
			Class(
				"preview border-base-300 bg-base-100 rounded-b-box rounded-se-box flex min-h-[6rem] min-w-[18rem] max-w-4xl flex-wrap items-center justify-center gap-2 overflow-x-hidden bg-cover bg-top p-4 [border-width:var(--tab-border)]",
			),
			Div(
				Class("carousel rounded-box"),
				Div(
					Class("carousel-item"),
					Img(
						Src(
							"https://img.daisyui.com/images/stock/photo-1559703248-dcaaec9fab78.webp",
						),
					),
				),
				Div(
					Class("carousel-item"),
					Img(
						Src(
							"https://img.daisyui.com/images/stock/photo-1565098772267-60af42b81ef2.webp",
						),
					),
				),
				Div(
					Class("carousel-item"),
					Img(
						Src(
							"https://img.daisyui.com/images/stock/photo-1572635148818-ef6fd45eb394.webp",
						),
					),
				),
				Div(
					Class("carousel-item"),
					Img(
						Src(
							"https://img.daisyui.com/images/stock/photo-1494253109108-2e30c049369b.webp",
						),
					),
				),
				Div(
					Class("carousel-item"),
					Img(
						Src(
							"https://img.daisyui.com/images/stock/photo-1550258987-190a2d41a8ba.webp",
						),
					),
				),
				Div(
					Class("carousel-item"),
					Img(
						Src(
							"https://img.daisyui.com/images/stock/photo-1559181567-c3190ca9959b.webp",
						),
					),
				),
				Div(
					Class("carousel-item"),
					Img(
						Src(
							"https://img.daisyui.com/images/stock/photo-1601004890684-d8cbf643f5f2.webp",
						),
					),
				),
			),
		),
	)
}

func RenderDoubleCalendar() *Node {
	return Div(
		Class("bg-gray-50 px-4 py-16"),
		Div(
			Class("mx-auto max-w-lg md:max-w-3xl"),
			Div(
				Div(
					Class("relative grid grid-cols-1 gap-x-14 md:grid-cols-2"),
					Button(
						Type("button"),
						Class(
							"absolute -left-1.5 -top-1 flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500",
						),
						Span(Class("sr-only"), Div(Text("Previous month"))),
						Svg(
							Class("h-5 w-5"),
							ViewBox("0 0 20 20"),
							Fill("currentColor"),
							AriaHidden("true"),
							Path(
								ClipRule("evenodd"),
								FillRule("evenodd"),
								D(
									"M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z",
								),
							),
						),
					),
					Button(
						Type("button"),
						Class(
							"absolute -right-1.5 -top-1 flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500",
						),
						Span(Class("sr-only"), Div(Text("Next month"))),
						Svg(
							Class("h-5 w-5"),
							ViewBox("0 0 20 20"),
							Fill("currentColor"),
							AriaHidden("true"),
							Path(
								FileRule("evenodd"),
								D(
									"M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z",
								),
								ClipRule("evenodd"),
							),
						),
					),
					Section(
						Class("text-center"),
						H2(Class("text-sm font-semibold text-gray-900"), Div(Text("January"))),
						Div(
							Class("mt-6 grid grid-cols-7 text-xs leading-6 text-gray-500"),
							Div(Div(Text("M"))),
							Div(Div(Text("T"))),
							Div(Div(Text("W"))),
							Div(Div(Text("T"))),
							Div(Div(Text("F"))),
							Div(Div(Text("S"))),
							Div(Div(Text("S"))),
						),
						Div(
							Class(
								"isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200",
							),
							Button(
								Type("button"),
								Class(
									"relative rounded-tl-lg bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2021-12-27"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("27")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2021-12-28"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("28")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2021-12-29"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("29")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2021-12-30"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("30")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2021-12-31"),
									Div(Text("31")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-01"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("1")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative rounded-tr-lg bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-02"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("2")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-03"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("3")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-04"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("4")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-05"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("5")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-06"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("6")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-07"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("7")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-01-08"),
									Div(Text("8")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-09"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("9")),
								),
							),
							Button(
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Type("button"),
								Time(
									Datetime("2022-01-10"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("10")),
								),
							),
							Button(
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Type("button"),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-01-11"),
									Div(Text("11")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-12"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white",
									),
									Div(Text("12")),
								),
							),
							Button(
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Type("button"),
								Time(
									Datetime("2022-01-13"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("13")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-14"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("14")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-15"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("15")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-16"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("16")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-17"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("17")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-18"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("18")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-01-19"),
									Div(Text("19")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-20"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("20")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-21"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("21")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-22"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("22")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-23"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("23")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-24"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("24")),
								),
							),
							Button(
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Type("button"),
								Time(
									Datetime("2022-01-25"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("25")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-01-26"),
									Div(Text("26")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-27"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("27")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-01-28"),
									Div(Text("28")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-29"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("29")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-30"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("30")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative rounded-bl-lg bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-31"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("31")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-01"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("1")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-02"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("2")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-03"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("3")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-04"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("4")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-05"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("5")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative rounded-br-lg bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-06"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("6")),
								),
							),
						),
					),
					Section(
						Class("hidden text-center md:block"),
						H2(Class("text-sm font-semibold text-gray-900"), Div(Text("February"))),
						Div(
							Class("mt-6 grid grid-cols-7 text-xs leading-6 text-gray-500"),
							Div(Div(Text("M"))),
							Div(Div(Text("T"))),
							Div(Div(Text("W"))),
							Div(Div(Text("T"))),
							Div(Div(Text("F"))),
							Div(Div(Text("S"))),
							Div(Div(Text("S"))),
						),
						Div(
							Class(
								"isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200",
							),
							Button(
								Type("button"),
								Class(
									"relative rounded-tl-lg bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-01-31"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("31")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-01"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("1")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-02"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("2")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-03"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("3")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-04"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("4")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-05"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("5")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative rounded-tr-lg bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-06"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("6")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-02-07"),
									Div(Text("7")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-08"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("8")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-09"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("9")),
								),
							),
							Button(
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Type("button"),
								Time(
									Datetime("2022-02-10"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("10")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-11"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("11")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-02-12"),
									Div(Text("12")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-13"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("13")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-14"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("14")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-15"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("15")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-16"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("16")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-17"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("17")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-18"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("18")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-19"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("19")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-20"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("20")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-21"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("21")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-22"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("22")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-23"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("23")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-24"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("24")),
								),
							),
							Button(
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Type("button"),
								Time(
									Datetime("2022-02-25"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("25")),
								),
							),
							Button(
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Type("button"),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-02-26"),
									Div(Text("26")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-02-27"),
									Div(Text("27")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-white py-1.5 text-gray-900 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-02-28"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("28")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-01"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("1")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-02"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("2")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-03"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("3")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-04"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("4")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-05"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("5")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Datetime("2022-03-06"),
									Div(Text("6")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative rounded-bl-lg bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-07"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("7")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-08"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("8")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-09"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("9")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-10"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("10")),
								),
							),
							Button(
								Type("button"),
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Time(
									Datetime("2022-03-11"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("11")),
								),
							),
							Button(
								Class(
									"relative bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Type("button"),
								Time(
									Datetime("2022-03-12"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("12")),
								),
							),
							Button(
								Class(
									"relative rounded-br-lg bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10",
								),
								Type("button"),
								Time(
									Datetime("2022-03-13"),
									Class(
										"mx-auto flex h-7 w-7 items-center justify-center rounded-full",
									),
									Div(Text("13")),
								),
							),
						),
					),
				),
				Section(
					Class("mt-12"),
					H2(
						Class("text-base font-semibold leading-6 text-gray-900"),
						Div(Text("Upcoming events")),
					),
					Ol(
						Class("mt-2 divide-y divide-gray-200 text-sm leading-6 text-gray-500"),
						Li(
							Class("py-4 sm:flex"),
							Time(
								Datetime("2022-01-17"),
								Class("w-28 flex-none"),
								Div(Text("Wed, Jan 12")),
							),
							P(
								Class("mt-2 flex-auto sm:mt-0"),
								Div(Text("Nothing on today’s schedule")),
							),
						),
						Li(
							Class("py-4 sm:flex"),
							Time(
								Datetime("2022-01-19"),
								Class("w-28 flex-none"),
								Div(Text("Thu, Jan 13")),
							),
							P(
								Class("mt-2 flex-auto font-semibold text-gray-900 sm:mt-0"),
								Div(Text("View house with real estate agent")),
							),
							P(
								Class("flex-none sm:ml-6"),
								Time(Datetime("2022-01-13T14:30"), Div(Text("2:30 PM"))),
								Div(Text("-")),
								Time(Datetime("2022-01-13T16:30"), Div(Text("4:30 PM"))),
							),
						),
						Li(
							Class("py-4 sm:flex"),
							Time(
								Datetime("2022-01-20"),
								Class("w-28 flex-none"),
								Div(Text("Fri, Jan 14")),
							),
							P(
								Class("mt-2 flex-auto font-semibold text-gray-900 sm:mt-0"),
								Div(Text("Meeting with bank manager")),
							),
							P(Class("flex-none sm:ml-6"), Div(Text("All day"))),
						),
						Li(
							Class("py-4 sm:flex"),
							Time(
								Class("w-28 flex-none"),
								Datetime("2022-01-18"),
								Div(Text("Mon, Jan 17")),
							),
							P(
								Class("mt-2 flex-auto font-semibold text-gray-900 sm:mt-0"),
								Div(Text("Sign paperwork at lawyers")),
							),
							P(
								Class("flex-none sm:ml-6"),
								Time(Datetime("2022-01-17T10:00"), Div(Text("10:00 AM"))),
								Div(Text("-")),
								Time(Datetime("2022-01-17T10:15"), Div(Text("10:15 AM"))),
							),
						),
					),
				),
			),
		),
	)
}

func RenderChatBubble() *Node {
	return Div(
		Class("bg-base-300 rounded-b-box rounded-se-box relative overflow-x-auto"),
		Div(
			Class(
				"preview border-base-300 bg-base-100 rounded-b-box rounded-se-box flex min-h-[6rem] min-w-[18rem] max-w-4xl flex-wrap items-center justify-center gap-2 overflow-x-hidden bg-cover bg-top p-4 [border-width:var(--tab-border)]",
			),
			Div(
				Class("w-full"),
				Div(
					Class("chat chat-start"),
					Div(
						Class("chat-bubble"),
						Div(Text("It's over Anakin,")),
						Div(Text("I have the high ground.")),
					),
				),
				Div(
					Class("chat chat-end"),
					Div(Class("chat-bubble"), Div(Text("You underestimate my power!"))),
				),
				Div(
					Class("chat chat-start"),
					Div(
						Class("chat-bubble"),
						Div(Text("I cant believe you've done this")),
					),
				),
				Div(
					Class("chat chat-end"),
					Div(Class("chat-bubble"), Div(Text("Hey cameron"))),
				),
			),
		),
	)
}

func RenderFeed() *Node {
	return Ul(
		Class("space-y-6"),
		Li(
			Class("relative flex gap-x-4"),
			Div(
				Class("absolute left-0 top-0 flex w-6 justify-center -bottom-6"),
				Div(Class("w-px bg-gray-200")),
			),
			Div(
				Class("relative flex h-6 w-6 flex-none items-center justify-center bg-white"),
				Div(Class("h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300")),
			),
			P(
				Class("flex-auto py-0.5 text-xs leading-5 text-gray-500"),
				Span(Class("font-medium text-gray-900"), Div(Text("Chelsea Hagon"))),
				Div(Text("created the invoice.")),
			),
			Time(
				Datetime("2023-01-23T10:32"),
				Class("flex-none py-0.5 text-xs leading-5 text-gray-500"),
				Div(Text("7d ago")),
			),
		),
		Li(
			Class("relative flex gap-x-4"),
			Div(
				Class("absolute left-0 top-0 flex w-6 justify-center -bottom-6"),
				Div(Class("w-px bg-gray-200")),
			),
			Div(
				Class("relative flex h-6 w-6 flex-none items-center justify-center bg-white"),
				Div(Class("h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300")),
			),
			P(
				Class("flex-auto py-0.5 text-xs leading-5 text-gray-500"),
				Span(Class("font-medium text-gray-900"), Div(Text("Chelsea Hagon"))),
				Div(Text("edited the invoice.")),
			),
			Time(
				Datetime("2023-01-23T11:03"),
				Class("flex-none py-0.5 text-xs leading-5 text-gray-500"),
				Div(Text("6d ago")),
			),
		),
		Li(
			Class("relative flex gap-x-4"),
			Div(
				Class("absolute left-0 top-0 flex w-6 justify-center -bottom-6"),
				Div(Class("w-px bg-gray-200")),
			),
			Div(
				Class("relative flex h-6 w-6 flex-none items-center justify-center bg-white"),
				Div(Class("h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300")),
			),
			P(
				Class("flex-auto py-0.5 text-xs leading-5 text-gray-500"),
				Span(Class("font-medium text-gray-900"), Div(Text("Chelsea Hagon"))),
				Div(Text("sent the invoice.")),
			),
			Time(
				Datetime("2023-01-23T11:24"),
				Class("flex-none py-0.5 text-xs leading-5 text-gray-500"),
				Div(Text("6d ago")),
			),
		),
		Li(
			Class("relative flex gap-x-4"),
			Div(
				Class("absolute left-0 top-0 flex w-6 justify-center -bottom-6"),
				Div(Class("w-px bg-gray-200")),
			),
			Img(
				Src(
					"https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
				),
				Class("relative mt-3 h-6 w-6 flex-none rounded-full bg-gray-50"),
			),
			Div(
				Class("flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200"),
				Div(
					Class("flex justify-between gap-x-4"),
					Div(
						Class("py-0.5 text-xs leading-5 text-gray-500"),
						Span(Class("font-medium text-gray-900"), Div(Text("Chelsea Hagon"))),
						Div(Text("commented")),
					),
					Time(
						Datetime("2023-01-23T15:56"),
						Class("flex-none py-0.5 text-xs leading-5 text-gray-500"),
						Div(Text("3d ago")),
					),
				),
				P(
					Class("text-sm leading-6 text-gray-500"),
					Div(
						Text(
							"Called client, they reassured me the invoice would be paid by the 25th.",
						),
					),
				),
			),
		),
		Li(
			Class("relative flex gap-x-4"),
			Div(
				Class("absolute left-0 top-0 flex w-6 justify-center -bottom-6"),
				Div(Class("w-px bg-gray-200")),
			),
			Div(
				Class("relative flex h-6 w-6 flex-none items-center justify-center bg-white"),
				Div(Class("h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300")),
			),
			P(
				Class("flex-auto py-0.5 text-xs leading-5 text-gray-500"),
				Span(Class("font-medium text-gray-900"), Div(Text("Alex Curren"))),
				Div(Text("viewed the invoice.")),
			),
			Time(
				Datetime("2023-01-24T09:12"),
				Class("flex-none py-0.5 text-xs leading-5 text-gray-500"),
				Div(Text("2d ago")),
			),
		),
		Li(
			Class("relative flex gap-x-4"),
			Div(
				Class("absolute left-0 top-0 flex w-6 justify-center h-6"),
				Div(Class("w-px bg-gray-200")),
			),
			Div(
				Class("relative flex h-6 w-6 flex-none items-center justify-center bg-white"),
				Svg(
					Class("h-6 w-6 text-indigo-600"),
					ViewBox("0 0 24 24"),
					Fill("currentColor"),
					AriaHidden("true"),
					Path(
						FillRule("evenodd"),
						D(
							"M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z",
						),
						ClipRule("evenodd"),
					),
				),
			),
			P(
				Class("flex-auto py-0.5 text-xs leading-5 text-gray-500"),
				Span(Class("font-medium text-gray-900"), Div(Text("Alex Curren"))),
				Div(Text("paid the invoice.")),
			),
			Time(
				Class("flex-none py-0.5 text-xs leading-5 text-gray-500"),
				Datetime("2023-01-24T09:20"),
				Div(Text("1d ago")),
			),
		),
	)
}

func RenderProgress() *Node {
	return Div(
		Class("bg-base-300 rounded-b-box rounded-se-box relative overflow-x-auto"),
		Div(
			Class(
				"preview border-base-300 bg-base-100 rounded-b-box rounded-se-box flex min-h-[6rem] min-w-[18rem] max-w-4xl flex-wrap items-center justify-center gap-2 overflow-x-hidden bg-cover bg-top p-4 [border-width:var(--tab-border)]",
			),
			Div(
				Class("flex flex-col gap-2 items-center"),
				Progress(Class("progress w-56"), Value("0"), Max("100")),
				Progress(Max("100"), Class("progress w-56"), Value("10")),
				Progress(Class("progress w-56"), Value("40"), Max("100")),
				Progress(Max("100"), Class("progress w-56"), Value("70")),
				Progress(Value("100"), Max("100"), Class("progress w-56")),
			),
		),
	)
}

func RenderProgress2() *Node {
	return Div(
		Class("bg-base-300 rounded-b-box rounded-se-box relative overflow-x-auto"),
		Div(
			Class(
				"preview border-base-300 bg-base-100 rounded-b-box rounded-se-box flex min-h-[6rem] min-w-[18rem] max-w-4xl flex-wrap items-center justify-center gap-2 overflow-x-hidden bg-cover bg-top p-4 [border-width:var(--tab-border)]",
			),
			Div(
				Class("flex flex-col gap-2 items-center"),
				Progress(Value("40"), Max("100"), Class("progress progress-primary w-56")),
				Progress(Max("100"), Class("progress progress-primary w-56"), Value("10")),
				Progress(Class("progress progress-primary w-56"), Value("40"), Max("100")),
				Progress(Class("progress progress-primary w-56"), Value("70"), Max("100")),
				Progress(Class("progress progress-primary w-56"), Value("100"), Max("100")),
			),
		),
	)
}

func RenderReviews() *Node {
	return Div(
		Class("bg-white py-6 sm:py-8 lg:py-12"),
		Div(
			Class("mx-auto max-w-screen-xl px-4 md:px-8"),
			H2(
				Class("mb-8 text-center text-2xl font-bold text-gray-800 md:mb-12 lg:text-3xl"),
				Text("What others say about us"),
			),
			Div(
				Class("grid gap-y-10 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-3 lg:divide-x"),
				Div(
					Class("flex flex-col items-center gap-4 sm:px-4 md:gap-6 lg:px-8"),
					Div(
						Class("text-center text-gray-600"),
						Text(
							"“This is a section of some simple filler text, also known as placeholder text.”",
						),
					),
					Div(
						Class("flex flex-col items-center gap-2 sm:flex-row md:gap-3"),
						Div(
							Class(
								"h-12 w-12 overflow-hidden rounded-full bg-gray-100 shadow-lg md:h-14 md:w-14",
							),
							Img(
								Src(
									"https://images.unsplash.com/photo-1567515004624-219c11d31f2e??auto=format&q=75&fit=crop&w=112",
								),
								Class("h-full w-full object-cover object-center"),
							),
						),
						Div(
							Div(
								Class(
									"text-center text-sm font-bold text-indigo-500 sm:text-left md:text-base",
								),
								Text("John McCulling"),
							),
							P(
								Class("text-center text-sm text-gray-500 sm:text-left md:text-sm"),
								Text("CEO / Datadrift"),
							),
						),
					),
				),
				Div(
					Class("flex flex-col items-center gap-4 sm:px-4 md:gap-6 lg:px-8"),
					Div(
						Class("text-center text-gray-600"),
						Text(
							"“This is a section of some simple filler text, also known as placeholder text.”",
						),
					),
					Div(
						Class("flex flex-col items-center gap-2 sm:flex-row md:gap-3"),
						Div(
							Class(
								"h-12 w-12 overflow-hidden rounded-full bg-gray-100 shadow-lg md:h-14 md:w-14",
							),
							Img(
								Src(
									"https://images.unsplash.com/photo-1532073150508-0c1df022bdd1?auto=format&q=75&fit=crop&w=112",
								),
								Class("h-full w-full object-cover object-center"),
							),
						),
						Div(
							Div(
								Class(
									"text-center text-sm font-bold text-indigo-500 sm:text-left md:text-base",
								),
								Text("Kate Berg"),
							),
							P(
								Class("text-center text-sm text-gray-500 sm:text-left md:text-sm"),
								Text("CFO / Dashdash"),
							),
						),
					),
				),
				Div(
					Class("flex flex-col items-center gap-4 sm:px-4 md:gap-6 lg:px-8"),
					Div(
						Class("text-center text-gray-600"),
						Text(
							"“This is a section of some simple filler text, also known as placeholder text.”",
						),
					),
					Div(
						Class("flex flex-col items-center gap-2 sm:flex-row md:gap-3"),
						Div(
							Class(
								"h-12 w-12 overflow-hidden rounded-full bg-gray-100 shadow-lg md:h-14 md:w-14",
							),
							Img(
								Src(
									"https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&q=75&fit=crop&w=500",
								),
								Class("h-full w-full object-cover object-center"),
							),
						),
						Div(
							Div(
								Class(
									"text-center text-sm font-bold text-indigo-500 sm:text-left md:text-base",
								),
								Text("Greg Jackson"),
							),
							P(
								Class("text-center text-sm text-gray-500 sm:text-left md:text-sm"),
								Text("CTO / Uptime"),
							),
						),
					),
				),
			),
		),
	)
}

func RenderCal() *Node {
	return Div(
		Class("lg:flex lg:h-full lg:flex-col"),
		Header(
			Class(
				"flex items-center justify-between border-b border-gray-200 px-6 py-4 lg:flex-none",
			),
			H1(
				Class("text-base font-semibold leading-6 text-gray-900"),
				Time(Datetime("2022-01"), Text("January 2022")),
			),
			Div(
				Class("flex items-center"),
				Div(
					Class(
						"relative flex items-center rounded-md bg-white shadow-sm md:items-stretch",
					),
					Button(
						Class(
							"flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50",
						),
						Type("button"),
						Span(Class("sr-only"), Text("Previous month")),
						Svg(
							Class("h-5 w-5"),
							ViewBox("0 0 20 20"),
							Fill("currentColor"),
							AriaHidden("true"),
							DataSlot("icon"),
							Path(
								FillRule("evenodd"),
								D(
									"M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z",
								),
								ClipRule("evenodd"),
							),
						),
					),
					Button(
						Type("button"),
						Class(
							"hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block",
						),
						Text("Today"),
					),
					Span(Class("relative -mx-px h-5 w-px bg-gray-300 md:hidden")),
					Button(
						Type("button"),
						Class(
							"flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50",
						),
						Span(Class("sr-only"), Text("Next month")),
						Svg(
							Class("h-5 w-5"),
							ViewBox("0 0 20 20"),
							Fill("currentColor"),
							AriaHidden("true"),
							DataSlot("icon"),
							Path(
								FillRule("evenodd"),
								D(
									"M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z",
								),
								ClipRule("evenodd"),
							),
						),
					),
				),
				Div(
					Class("hidden md:ml-4 md:flex md:items-center"),
					Div(
						Class("relative"),
						Button(
							Type("button"),
							Class(
								"flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
							),
							Id("menu-button"),
							AriaExpanded("false"),
							AriaHaspopup("true"),
							Text("Month view"),
							Svg(
								AriaHidden("true"),
								DataSlot("icon"),
								Class("-mr-1 h-5 w-5 text-gray-400"),
								ViewBox("0 0 20 20"),
								Fill("currentColor"),
								Path(
									FillRule("evenodd"),
									D(
										"M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z",
									),
									ClipRule("evenodd"),
								),
							),
						),
						Div(
							Role("menu"),
							AriaOrientation("vertical"),
							AriaLabelledby("menu-button"),
							Tabindex("-1"),
							Class(
								"absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
							),
							Div(
								Class("py-1"),
								Role("none"),
								A(
									Tabindex("-1"),
									Id("menu-item-0"),
									Href("#"),
									Class("block px-4 py-2 text-sm text-gray-700"),
									Role("menuitem"),
									Text("Day view"),
								),
								A(
									Href("#"),
									Class("block px-4 py-2 text-sm text-gray-700"),
									Role("menuitem"),
									Tabindex("-1"),
									Id("menu-item-1"),
									Text("Week view"),
								),
								A(
									Href("#"),
									Class("block px-4 py-2 text-sm text-gray-700"),
									Role("menuitem"),
									Tabindex("-1"),
									Id("menu-item-2"),
									Text("Month view"),
								),
								A(
									Role("menuitem"),
									Tabindex("-1"),
									Id("menu-item-3"),
									Href("#"),
									Class("block px-4 py-2 text-sm text-gray-700"),
									Text("Year view"),
								),
							),
						),
					),
					Div(Class("ml-6 h-6 w-px bg-gray-300")),
					Button(
						Type("button"),
						Class(
							"ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
						),
						Text("Add event"),
					),
				),
				Div(
					Class("relative ml-6 md:hidden"),
					Button(
						AriaHaspopup("true"),
						Type("button"),
						Class(
							"-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500",
						),
						Id("menu-0-button"),
						AriaExpanded("false"),
						Span(Class("sr-only"), Text("Open menu")),
						Svg(
							ViewBox("0 0 20 20"),
							Fill("currentColor"),
							AriaHidden("true"),
							DataSlot("icon"),
							Class("h-5 w-5"),
							Path(
								D(
									"M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z",
								),
							),
						),
					),
					Div(
						Class(
							"absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
						),
						Role("menu"),
						AriaOrientation("vertical"),
						AriaLabelledby("menu-0-button"),
						Tabindex("-1"),
						Div(
							Class("py-1"),
							Role("none"),
							A(
								Href("#"),
								Class("block px-4 py-2 text-sm text-gray-700"),
								Role("menuitem"),
								Tabindex("-1"),
								Id("menu-0-item-0"),
								Text("Create event"),
							),
						),
						Div(
							Class("py-1"),
							Role("none"),
							A(
								Href("#"),
								Class("block px-4 py-2 text-sm text-gray-700"),
								Role("menuitem"),
								Tabindex("-1"),
								Id("menu-0-item-1"),
								Text("Go to today"),
							),
						),
						Div(
							Class("py-1"),
							Role("none"),
							A(
								Href("#"),
								Class("block px-4 py-2 text-sm text-gray-700"),
								Role("menuitem"),
								Tabindex("-1"),
								Id("menu-0-item-2"),
								Text("Day view"),
							),
							A(
								Id("menu-0-item-3"),
								Href("#"),
								Class("block px-4 py-2 text-sm text-gray-700"),
								Role("menuitem"),
								Tabindex("-1"),
								Text("Week view"),
							),
							A(
								Href("#"),
								Class("block px-4 py-2 text-sm text-gray-700"),
								Role("menuitem"),
								Tabindex("-1"),
								Id("menu-0-item-4"),
								Text("Month view"),
							),
							A(
								Href("#"),
								Class("block px-4 py-2 text-sm text-gray-700"),
								Role("menuitem"),
								Tabindex("-1"),
								Id("menu-0-item-5"),
								Text("Year view"),
							),
						),
					),
				),
			),
		),
		Div(
			Class("shadow ring-1 ring-black ring-opacity-5 lg:flex lg:flex-auto lg:flex-col"),
			Div(
				Class(
					"grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs font-semibold leading-6 text-gray-700 lg:flex-none",
				),
				Div(
					Class("flex justify-center bg-white py-2"),
					Span(Text("M")),
					Span(Class("sr-only sm:not-sr-only"), Text("on")),
				),
				Div(
					Class("flex justify-center bg-white py-2"),
					Span(Text("T")),
					Span(Class("sr-only sm:not-sr-only"), Text("ue")),
				),
				Div(
					Class("flex justify-center bg-white py-2"),
					Span(Text("W")),
					Span(Class("sr-only sm:not-sr-only"), Text("ed")),
				),
				Div(
					Class("flex justify-center bg-white py-2"),
					Span(Text("T")),
					Span(Class("sr-only sm:not-sr-only"), Text("hu")),
				),
				Div(
					Class("flex justify-center bg-white py-2"),
					Span(Text("F")),
					Span(Class("sr-only sm:not-sr-only"), Text("ri")),
				),
				Div(
					Class("flex justify-center bg-white py-2"),
					Span(Text("S")),
					Span(Class("sr-only sm:not-sr-only"), Text("at")),
				),
				Div(
					Class("flex justify-center bg-white py-2"),
					Span(Text("S")),
					Span(Class("sr-only sm:not-sr-only"), Text("un")),
				),
			),
			Div(
				Class("flex bg-gray-200 text-xs leading-6 text-gray-700 lg:flex-auto"),
				Div(
					Class("hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6 lg:gap-px"),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2021-12-27"), Text("27")),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2021-12-28"), Text("28")),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2021-12-29"), Text("29")),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2021-12-30"), Text("30")),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2021-12-31"), Text("31")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-01"), Text("1")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-01"), Text("2")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-03"), Text("3")),
						Ol(
							Class("mt-2"),
							Li(
								A(
									Href("#"),
									Class("group flex"),
									P(
										Class(
											"flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600",
										),
										Text("Design review"),
									),
									Time(
										Datetime("2022-01-03T10:00"),
										Class(
											"ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block",
										),
										Text("10AM"),
									),
								),
							),
							Li(
								A(
									Class("group flex"),
									Href("#"),
									P(
										Class(
											"flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600",
										),
										Text("Sales meeting"),
									),
									Time(
										Datetime("2022-01-03T14:00"),
										Class(
											"ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block",
										),
										Text("2PM"),
									),
								),
							),
						),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-04"), Text("4")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-05"), Text("5")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-06"), Text("6")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-07"), Text("7")),
						Ol(
							Class("mt-2"),
							Li(
								A(
									Href("#"),
									Class("group flex"),
									P(
										Class(
											"flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600",
										),
										Text("Date night"),
									),
									Time(
										Datetime("2022-01-08T18:00"),
										Class(
											"ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block",
										),
										Text("6PM"),
									),
								),
							),
						),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-08"), Text("8")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-09"), Text("9")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-10"), Text("10")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-11"), Text("11")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(
							Datetime("2022-01-12"),
							Class(
								"flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white",
							),
							Text("12"),
						),
						Ol(
							Class("mt-2"),
							Li(
								A(
									Href("#"),
									Class("group flex"),
									P(
										Class(
											"flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600",
										),
										Text("Sam's birthday party"),
									),
									Time(
										Datetime("2022-01-25T14:00"),
										Class(
											"ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block",
										),
										Text("2PM"),
									),
								),
							),
						),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-13"), Text("13")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-14"), Text("14")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-15"), Text("15")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-16"), Text("16")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-17"), Text("17")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-18"), Text("18")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-19"), Text("19")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-20"), Text("20")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-21"), Text("21")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-22"), Text("22")),
						Ol(
							Class("mt-2"),
							Li(
								A(
									Href("#"),
									Class("group flex"),
									P(
										Class(
											"flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600",
										),
										Text("Maple syrup museum"),
									),
									Time(
										Class(
											"ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block",
										),
										Datetime("2022-01-22T15:00"),
										Text("3PM"),
									),
								),
							),
							Li(
								A(
									Href("#"),
									Class("group flex"),
									P(
										Class(
											"flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600",
										),
										Text("Hockey game"),
									),
									Time(
										Datetime("2022-01-22T19:00"),
										Class(
											"ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block",
										),
										Text("7PM"),
									),
								),
							),
						),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-23"), Text("23")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-24"), Text("24")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-25"), Text("25")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-26"), Text("26")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-27"), Text("27")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-28"), Text("28")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-29"), Text("29")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-30"), Text("30")),
					),
					Div(
						Class("relative bg-white px-3 py-2"),
						Time(Datetime("2022-01-31"), Text("31")),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2022-02-01"), Text("1")),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2022-02-02"), Text("2")),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2022-02-03"), Text("3")),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2022-02-04"), Text("4")),
						Ol(
							Class("mt-2"),
							Li(
								A(
									Href("#"),
									Class("group flex"),
									P(
										Class(
											"flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600",
										),
										Text("Cinema with friends"),
									),
									Time(
										Datetime("2022-02-04T21:00"),
										Class(
											"ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block",
										),
										Text("9PM"),
									),
								),
							),
						),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2022-02-05"), Text("5")),
					),
					Div(
						Class("relative bg-gray-50 px-3 py-2 text-gray-500"),
						Time(Datetime("2022-02-06"), Text("6")),
					),
				),
				Div(
					Class("isolate grid w-full grid-cols-7 grid-rows-6 gap-px lg:hidden"),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Class("ml-auto"), Datetime("2021-12-27"), Text("27")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2021-12-28"), Class("ml-auto"), Text("28")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Class("ml-auto"), Datetime("2021-12-29"), Text("29")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2021-12-30"), Class("ml-auto"), Text("30")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2021-12-31"), Class("ml-auto"), Text("31")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-01"), Class("ml-auto"), Text("1")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-02"), Class("ml-auto"), Text("2")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Class("ml-auto"), Datetime("2022-01-03"), Text("3")),
						Span(Class("sr-only"), Text("2 events")),
						Span(
							Class("-mx-0.5 mt-auto flex flex-wrap-reverse"),
							Span(Class("mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400")),
							Span(Class("mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400")),
						),
					),
					Button(
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Type("button"),
						Time(Class("ml-auto"), Datetime("2022-01-04"), Text("4")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-05"), Class("ml-auto"), Text("5")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-06"), Class("ml-auto"), Text("6")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-07"), Class("ml-auto"), Text("7")),
						Span(Class("sr-only"), Text("1 event")),
						Span(
							Class("-mx-0.5 mt-auto flex flex-wrap-reverse"),
							Span(Class("mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400")),
						),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-08"), Class("ml-auto"), Text("8")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Type("button"),
						Time(Class("ml-auto"), Datetime("2022-01-09"), Text("9")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-10"), Class("ml-auto"), Text("10")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Type("button"),
						Time(Datetime("2022-01-11"), Class("ml-auto"), Text("11")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 font-semibold text-indigo-600 hover:bg-gray-100 focus:z-10",
						),
						Type("button"),
						Time(Datetime("2022-01-12"), Class("ml-auto"), Text("12")),
						Span(Class("sr-only"), Text("1 event")),
						Span(
							Class("-mx-0.5 mt-auto flex flex-wrap-reverse"),
							Span(Class("mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400")),
						),
					),
					Button(
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Type("button"),
						Time(Datetime("2022-01-13"), Class("ml-auto"), Text("13")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-14"), Class("ml-auto"), Text("14")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Class("ml-auto"), Datetime("2022-01-15"), Text("15")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Class("ml-auto"), Datetime("2022-01-16"), Text("16")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-17"), Class("ml-auto"), Text("17")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-18"), Class("ml-auto"), Text("18")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-19"), Class("ml-auto"), Text("19")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-20"), Class("ml-auto"), Text("20")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-21"), Class("ml-auto"), Text("21")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 font-semibold text-white hover:bg-gray-100 focus:z-10",
						),
						Time(
							Datetime("2022-01-22"),
							Class(
								"ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-900",
							),
							Text("22"),
						),
						Span(Class("sr-only"), Text("2 events")),
						Span(
							Class("-mx-0.5 mt-auto flex flex-wrap-reverse"),
							Span(Class("mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400")),
							Span(Class("mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400")),
						),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-23"), Class("ml-auto"), Text("23")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-24"), Class("ml-auto"), Text("24")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Class("ml-auto"), Datetime("2022-01-25"), Text("25")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-26"), Class("ml-auto"), Text("26")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Type("button"),
						Time(Datetime("2022-01-27"), Class("ml-auto"), Text("27")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Type("button"),
						Time(Datetime("2022-01-28"), Class("ml-auto"), Text("28")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-29"), Class("ml-auto"), Text("29")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-30"), Class("ml-auto"), Text("30")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-white px-3 py-2 text-gray-900 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-01-31"), Class("ml-auto"), Text("31")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-02-01"), Class("ml-auto"), Text("1")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-02-02"), Class("ml-auto"), Text("2")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-02-03"), Class("ml-auto"), Text("3")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-02-04"), Class("ml-auto"), Text("4")),
						Span(Class("sr-only"), Text("1 event")),
						Span(
							Class("-mx-0.5 mt-auto flex flex-wrap-reverse"),
							Span(Class("mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400")),
						),
					),
					Button(
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Type("button"),
						Time(Class("ml-auto"), Datetime("2022-02-05"), Text("5")),
						Span(Class("sr-only"), Text("0 events")),
					),
					Button(
						Type("button"),
						Class(
							"flex h-14 flex-col bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:z-10",
						),
						Time(Datetime("2022-02-06"), Class("ml-auto"), Text("6")),
						Span(Class("sr-only"), Text("0 events")),
					),
				),
			),
		),
		Div(
			Class("px-4 py-10 sm:px-6 lg:hidden"),
			Ol(
				Class(
					"divide-y divide-gray-100 overflow-hidden rounded-lg bg-white text-sm shadow ring-1 ring-black ring-opacity-5",
				),
				Li(
					Class("group flex p-4 pr-6 focus-within:bg-gray-50 hover:bg-gray-50"),
					Div(
						Class("flex-auto"),
						P(Class("font-semibold text-gray-900"), Text("Maple syrup museum")),
						Time(
							Class("mt-2 flex items-center text-gray-700"),
							Datetime("2022-01-15T09:00"),
							Svg(
								Fill("currentColor"),
								AriaHidden("true"),
								DataSlot("icon"),
								Class("mr-2 h-5 w-5 text-gray-400"),
								ViewBox("0 0 20 20"),
								Path(
									FillRule("evenodd"),
									D(
										"M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z",
									),
									ClipRule("evenodd"),
								),
							),
							Text("3PM"),
						),
					),
					A(
						Href("#"),
						Class(
							"ml-6 flex-none self-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 opacity-0 shadow-sm ring-1 ring-inset ring-gray-300 hover:ring-gray-400 focus:opacity-100 group-hover:opacity-100",
						),
						Text("Edit"),
						Span(Class("sr-only"), Text(", Maple syrup museum")),
					),
				),
				Li(
					Class("group flex p-4 pr-6 focus-within:bg-gray-50 hover:bg-gray-50"),
					Div(
						Class("flex-auto"),
						P(Class("font-semibold text-gray-900"), Text("Hockey game")),
						Time(
							Datetime("2022-01-22T19:00"),
							Class("mt-2 flex items-center text-gray-700"),
							Svg(
								AriaHidden("true"),
								DataSlot("icon"),
								Class("mr-2 h-5 w-5 text-gray-400"),
								ViewBox("0 0 20 20"),
								Fill("currentColor"),
								Path(
									FillRule("evenodd"),
									D(
										"M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z",
									),
									ClipRule("evenodd"),
								),
							),
							Text("7PM"),
						),
					),
					A(
						Href("#"),
						Class(
							"ml-6 flex-none self-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 opacity-0 shadow-sm ring-1 ring-inset ring-gray-300 hover:ring-gray-400 focus:opacity-100 group-hover:opacity-100",
						),
						Text("Edit"),
						Span(Class("sr-only"), Text(", Hockey game")),
					),
				),
			),
		),
	)
}

func RenderDoksLanding() *Node {
	return Div(
		Class("sticky-top"),
		Header(
			Class("navbar navbar-expand-lg"),
			Div(
				Class("container-fluid"),
				A(
					Class("navbar-brand me-auto me-lg-3"),
					Href("/"),
					Span(Class("visually-hidden"), Text("Doks")),
					Svg(
						Class("svg-inline svg-inline-custom svg-lightmode"),
						Height("100%"),
						Id("svg-doks-images-light-mode"),
						Role("img"),
						Width("70"),
						ViewBox("0 0 682 190"),
						Fill("none"),
						Path(
							D(
								"M.616001 187V.375992H88.424c21.163.0 38.912 3.925338 53.248 11.776008 14.507 7.68 25.429 18.5173 32.768 32.512C181.949 58.6587 185.704 75.0427 185.704 93.816c0 19.968-4.011 36.864-12.032 50.688-7.851 13.824-19.029 24.405-33.536 31.744C125.629 183.416 108.392 187 88.424 187H.616001zM38.248 157.304H81.512c22.357.0 38.912-5.71700000000001 49.664-17.152 10.923-11.435 16.384-27.136 16.384-47.104.0-21.8453-6.059-37.8027-18.176-47.872-11.947-10.24-27.904-15.36-47.872-15.36H38.248V157.304zM281.82 189.56C265.777 189.56 251.697 186.744 239.58 181.112 227.463 175.48 217.991 167.373 211.164 156.792 204.508 146.211 201.18 133.581 201.18 118.904S204.508 91.6827 211.164 81.272C217.82 70.6907 227.207 62.584 239.324 56.952c12.117-5.8027 26.283-8.704 42.496-8.704 16.213.0 30.379 2.816 42.496 8.448C336.433 62.328 345.82 70.4347 352.476 81.016 359.132 91.4267 362.46 104.056 362.46 118.904 362.46 133.411 359.132 145.955 352.476 156.536s-16.043 18.773-28.16 24.576C312.369 186.744 298.204 189.56 281.82 189.56zm0-28.16c13.824.0 24.661-3.84 32.512-11.52s11.776-18.005 11.776-30.976C326.108 105.763 322.183 95.4373 314.332 87.928 306.652 80.248 295.815 76.408 281.82 76.408c-13.824.0-24.661 3.84-32.512 11.52C241.628 95.608 237.788 105.933 237.788 118.904S241.628 142.2 249.308 149.88C257.159 157.56 267.996 161.4 281.82 161.4zM384.068 187V.375992H420.42V110.2l17.152-15.36L490.82 50.808h46.336l-64.768 53.504L539.46 187H494.148l-38.656-48.64L446.02 125.56l-25.6 20.736V187H384.068zm227.244 2.56c-22.699.0-40.107-4.096-52.224-12.288C546.971 169.08 540.485 157.987 539.632 143.992H575.216c1.024 15.36 13.397 23.04 37.12 23.04C622.747 167.032 630.939 165.667 636.912 162.936 642.885 160.035 645.872 155.512 645.872 149.368 645.872 144.76 644.763 141.347 642.544 139.128 640.325 136.739 636.571 134.947 631.28 133.752 625.989 132.557 618.651 131.533 609.264 130.68 593.733 129.144 581.189 127.011 571.632 124.28 562.075 121.379 555.077 117.283 550.64 111.992 546.373 106.701 544.24 99.6187 544.24 90.744 544.24 77.7733 550.128 67.448 561.904 59.768c11.947-7.68 28.501-11.52 49.664-11.52C631.195 48.248 646.811 52.0027 658.416 59.512 670.021 67.0213 676.421 77.688 677.616 91.512H643.056C642.373 84.344 639.131 79.0533 633.328 75.64 627.525 72.2267 620.187 70.52 611.312 70.52 601.925 70.52 594.245 71.9707 588.272 74.872 582.469 77.6027 579.568 81.9547 579.568 87.928 579.568 93.9013 582.469 97.912 588.272 99.96 594.075 102.008 603.547 103.715 616.688 105.08 632.389 106.445 645.019 108.579 654.576 111.48 664.133 114.211 671.045 118.392 675.312 124.024 679.579 129.485 681.712 137.165 681.712 147.064c0 12.8-5.803 23.125-17.408 30.976C652.869 185.72 635.205 189.56 611.312 189.56z",
							),
							Fill("#1d2d35"),
						),
					),
					Svg(
						Class("svg-inline svg-inline-custom svg-darkmode"),
						Height("100%"),
						Id("svg-doks-images-dark-mode"),
						Role("img"),
						Width("70"),
						ViewBox("0 0 682 190"),
						Fill("none"),
						Path(
							D(
								"M.616001 187V.375992H88.424c21.163.0 38.912 3.925338 53.248 11.776008 14.507 7.68 25.429 18.5173 32.768 32.512C181.949 58.6587 185.704 75.0427 185.704 93.816c0 19.968-4.011 36.864-12.032 50.688-7.851 13.824-19.029 24.405-33.536 31.744C125.629 183.416 108.392 187 88.424 187H.616001zM38.248 157.304H81.512c22.357.0 38.912-5.71700000000001 49.664-17.152 10.923-11.435 16.384-27.136 16.384-47.104.0-21.8453-6.059-37.8027-18.176-47.872-11.947-10.24-27.904-15.36-47.872-15.36H38.248V157.304zM281.82 189.56C265.777 189.56 251.697 186.744 239.58 181.112 227.463 175.48 217.991 167.373 211.164 156.792 204.508 146.211 201.18 133.581 201.18 118.904S204.508 91.6827 211.164 81.272C217.82 70.6907 227.207 62.584 239.324 56.952c12.117-5.8027 26.283-8.704 42.496-8.704 16.213.0 30.379 2.816 42.496 8.448C336.433 62.328 345.82 70.4347 352.476 81.016 359.132 91.4267 362.46 104.056 362.46 118.904 362.46 133.411 359.132 145.955 352.476 156.536s-16.043 18.773-28.16 24.576C312.369 186.744 298.204 189.56 281.82 189.56zm0-28.16c13.824.0 24.661-3.84 32.512-11.52s11.776-18.005 11.776-30.976C326.108 105.763 322.183 95.4373 314.332 87.928 306.652 80.248 295.815 76.408 281.82 76.408c-13.824.0-24.661 3.84-32.512 11.52C241.628 95.608 237.788 105.933 237.788 118.904S241.628 142.2 249.308 149.88C257.159 157.56 267.996 161.4 281.82 161.4zM384.068 187V.375992H420.42V110.2l17.152-15.36L490.82 50.808h46.336l-64.768 53.504L539.46 187H494.148l-38.656-48.64L446.02 125.56l-25.6 20.736V187H384.068zm227.244 2.56c-22.699.0-40.107-4.096-52.224-12.288C546.971 169.08 540.485 157.987 539.632 143.992H575.216c1.024 15.36 13.397 23.04 37.12 23.04C622.747 167.032 630.939 165.667 636.912 162.936 642.885 160.035 645.872 155.512 645.872 149.368 645.872 144.76 644.763 141.347 642.544 139.128 640.325 136.739 636.571 134.947 631.28 133.752 625.989 132.557 618.651 131.533 609.264 130.68 593.733 129.144 581.189 127.011 571.632 124.28 562.075 121.379 555.077 117.283 550.64 111.992 546.373 106.701 544.24 99.6187 544.24 90.744 544.24 77.7733 550.128 67.448 561.904 59.768c11.947-7.68 28.501-11.52 49.664-11.52C631.195 48.248 646.811 52.0027 658.416 59.512 670.021 67.0213 676.421 77.688 677.616 91.512H643.056C642.373 84.344 639.131 79.0533 633.328 75.64 627.525 72.2267 620.187 70.52 611.312 70.52 601.925 70.52 594.245 71.9707 588.272 74.872 582.469 77.6027 579.568 81.9547 579.568 87.928 579.568 93.9013 582.469 97.912 588.272 99.96 594.075 102.008 603.547 103.715 616.688 105.08 632.389 106.445 645.019 108.579 654.576 111.48 664.133 114.211 671.045 118.392 675.312 124.024 679.579 129.485 681.712 137.165 681.712 147.064c0 12.8-5.803 23.125-17.408 30.976C652.869 185.72 635.205 189.56 611.312 189.56z",
							),
							Fill("#fff"),
						),
					),
				),
				Div(
					Id("docsearch"),
					Class("d-none"),
					Tabindex("-1"),
					Button(
						Class("DocSearch DocSearch-Button"),
						Type("button"),
						AriaLabel("Search (Command+K)"),
						Span(
							Class("DocSearch-Button-Container"),
							Svg(
								Width("20"),
								Height("20"),
								ViewBox("0 0 20 20"),
								AriaHidden("true"),
								Class("DocSearch-Search-Icon"),
								Path(
									StrokeLinejoin("round"),
									D(
										"M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z",
									),
									Stroke("currentColor"),
									Fill("none"),
									FillRule("evenodd"),
									StrokeLinecap("round"),
								),
							),
							Span(Class("DocSearch-Button-Placeholder"), Text("Search")),
						),
					),
				),
				Button(
					Type("button"),
					Id("searchToggleMobile"),
					Class("btn btn-link nav-link mx-2 d-lg-none"),
					AriaLabel("Search website"),
					Svg(
						Height("24"),
						Fill("none"),
						StrokeLinejoin("round"),
						StrokeWidth("2"),
						Stroke("currentcolor"),
						StrokeLinecap("round"),
						Class("icon icon-tabler icon-tabler-search"),
						Width("24"),
						ViewBox("0 0 24 24"),
						Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
						Circle(Cx("10"), Cy("10"), R("7")),
						Line(X1("21"), Y1("21"), X2("15"), Y2("15")),
					),
				),
				Button(
					AriaLabel("Open main navigation menu"),
					Class("btn btn-link nav-link mx-2 order-3 d-lg-none"),
					Type("button"),
					AriaControls("offcanvasNavMain"),
					Svg(
						StrokeLinejoin("round"),
						Width("24"),
						Height("24"),
						Stroke("currentcolor"),
						Fill("none"),
						StrokeLinecap("round"),
						Class("icon icon-tabler icon-tabler-menu"),
						ViewBox("0 0 24 24"),
						StrokeWidth("2"),
						Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
						Line(X1("4"), Y1("8"), X2("20"), Y2("8")),
						Line(X2("20"), Y2("16"), X1("4"), Y1("16")),
					),
				),
				Div(
					Class("offcanvas offcanvas-end h-auto"),
					Tabindex("-1"),
					Id("offcanvasNavMain"),
					AriaLabelledby("offcanvasNavMainLabel"),
					Div(
						Class("offcanvas-header"),
						H5(
							Class("offcanvas-title"),
							Id("offcanvasNavMainLabel"),
							Span(Class("visually-hidden"), Text("Doks")),
							Svg(
								Role("img"),
								Width("60"),
								ViewBox("0 0 682 190"),
								Fill("none"),
								Class("svg-inline svg-inline-custom svg-lightmode"),
								Height("100%"),
								Id("svg-doks-images-light-mode"),
								Path(
									D(
										"M.616001 187V.375992H88.424c21.163.0 38.912 3.925338 53.248 11.776008 14.507 7.68 25.429 18.5173 32.768 32.512C181.949 58.6587 185.704 75.0427 185.704 93.816c0 19.968-4.011 36.864-12.032 50.688-7.851 13.824-19.029 24.405-33.536 31.744C125.629 183.416 108.392 187 88.424 187H.616001zM38.248 157.304H81.512c22.357.0 38.912-5.71700000000001 49.664-17.152 10.923-11.435 16.384-27.136 16.384-47.104.0-21.8453-6.059-37.8027-18.176-47.872-11.947-10.24-27.904-15.36-47.872-15.36H38.248V157.304zM281.82 189.56C265.777 189.56 251.697 186.744 239.58 181.112 227.463 175.48 217.991 167.373 211.164 156.792 204.508 146.211 201.18 133.581 201.18 118.904S204.508 91.6827 211.164 81.272C217.82 70.6907 227.207 62.584 239.324 56.952c12.117-5.8027 26.283-8.704 42.496-8.704 16.213.0 30.379 2.816 42.496 8.448C336.433 62.328 345.82 70.4347 352.476 81.016 359.132 91.4267 362.46 104.056 362.46 118.904 362.46 133.411 359.132 145.955 352.476 156.536s-16.043 18.773-28.16 24.576C312.369 186.744 298.204 189.56 281.82 189.56zm0-28.16c13.824.0 24.661-3.84 32.512-11.52s11.776-18.005 11.776-30.976C326.108 105.763 322.183 95.4373 314.332 87.928 306.652 80.248 295.815 76.408 281.82 76.408c-13.824.0-24.661 3.84-32.512 11.52C241.628 95.608 237.788 105.933 237.788 118.904S241.628 142.2 249.308 149.88C257.159 157.56 267.996 161.4 281.82 161.4zM384.068 187V.375992H420.42V110.2l17.152-15.36L490.82 50.808h46.336l-64.768 53.504L539.46 187H494.148l-38.656-48.64L446.02 125.56l-25.6 20.736V187H384.068zm227.244 2.56c-22.699.0-40.107-4.096-52.224-12.288C546.971 169.08 540.485 157.987 539.632 143.992H575.216c1.024 15.36 13.397 23.04 37.12 23.04C622.747 167.032 630.939 165.667 636.912 162.936 642.885 160.035 645.872 155.512 645.872 149.368 645.872 144.76 644.763 141.347 642.544 139.128 640.325 136.739 636.571 134.947 631.28 133.752 625.989 132.557 618.651 131.533 609.264 130.68 593.733 129.144 581.189 127.011 571.632 124.28 562.075 121.379 555.077 117.283 550.64 111.992 546.373 106.701 544.24 99.6187 544.24 90.744 544.24 77.7733 550.128 67.448 561.904 59.768c11.947-7.68 28.501-11.52 49.664-11.52C631.195 48.248 646.811 52.0027 658.416 59.512 670.021 67.0213 676.421 77.688 677.616 91.512H643.056C642.373 84.344 639.131 79.0533 633.328 75.64 627.525 72.2267 620.187 70.52 611.312 70.52 601.925 70.52 594.245 71.9707 588.272 74.872 582.469 77.6027 579.568 81.9547 579.568 87.928 579.568 93.9013 582.469 97.912 588.272 99.96 594.075 102.008 603.547 103.715 616.688 105.08 632.389 106.445 645.019 108.579 654.576 111.48 664.133 114.211 671.045 118.392 675.312 124.024 679.579 129.485 681.712 137.165 681.712 147.064c0 12.8-5.803 23.125-17.408 30.976C652.869 185.72 635.205 189.56 611.312 189.56z",
									),
									Fill("#1d2d35"),
								),
							),
							Svg(
								Id("svg-doks-images-dark-mode"),
								Role("img"),
								Width("60"),
								ViewBox("0 0 682 190"),
								Fill("none"),
								Class("svg-inline svg-inline-custom svg-darkmode"),
								Height("100%"),
								Path(
									D(
										"M.616001 187V.375992H88.424c21.163.0 38.912 3.925338 53.248 11.776008 14.507 7.68 25.429 18.5173 32.768 32.512C181.949 58.6587 185.704 75.0427 185.704 93.816c0 19.968-4.011 36.864-12.032 50.688-7.851 13.824-19.029 24.405-33.536 31.744C125.629 183.416 108.392 187 88.424 187H.616001zM38.248 157.304H81.512c22.357.0 38.912-5.71700000000001 49.664-17.152 10.923-11.435 16.384-27.136 16.384-47.104.0-21.8453-6.059-37.8027-18.176-47.872-11.947-10.24-27.904-15.36-47.872-15.36H38.248V157.304zM281.82 189.56C265.777 189.56 251.697 186.744 239.58 181.112 227.463 175.48 217.991 167.373 211.164 156.792 204.508 146.211 201.18 133.581 201.18 118.904S204.508 91.6827 211.164 81.272C217.82 70.6907 227.207 62.584 239.324 56.952c12.117-5.8027 26.283-8.704 42.496-8.704 16.213.0 30.379 2.816 42.496 8.448C336.433 62.328 345.82 70.4347 352.476 81.016 359.132 91.4267 362.46 104.056 362.46 118.904 362.46 133.411 359.132 145.955 352.476 156.536s-16.043 18.773-28.16 24.576C312.369 186.744 298.204 189.56 281.82 189.56zm0-28.16c13.824.0 24.661-3.84 32.512-11.52s11.776-18.005 11.776-30.976C326.108 105.763 322.183 95.4373 314.332 87.928 306.652 80.248 295.815 76.408 281.82 76.408c-13.824.0-24.661 3.84-32.512 11.52C241.628 95.608 237.788 105.933 237.788 118.904S241.628 142.2 249.308 149.88C257.159 157.56 267.996 161.4 281.82 161.4zM384.068 187V.375992H420.42V110.2l17.152-15.36L490.82 50.808h46.336l-64.768 53.504L539.46 187H494.148l-38.656-48.64L446.02 125.56l-25.6 20.736V187H384.068zm227.244 2.56c-22.699.0-40.107-4.096-52.224-12.288C546.971 169.08 540.485 157.987 539.632 143.992H575.216c1.024 15.36 13.397 23.04 37.12 23.04C622.747 167.032 630.939 165.667 636.912 162.936 642.885 160.035 645.872 155.512 645.872 149.368 645.872 144.76 644.763 141.347 642.544 139.128 640.325 136.739 636.571 134.947 631.28 133.752 625.989 132.557 618.651 131.533 609.264 130.68 593.733 129.144 581.189 127.011 571.632 124.28 562.075 121.379 555.077 117.283 550.64 111.992 546.373 106.701 544.24 99.6187 544.24 90.744 544.24 77.7733 550.128 67.448 561.904 59.768c11.947-7.68 28.501-11.52 49.664-11.52C631.195 48.248 646.811 52.0027 658.416 59.512 670.021 67.0213 676.421 77.688 677.616 91.512H643.056C642.373 84.344 639.131 79.0533 633.328 75.64 627.525 72.2267 620.187 70.52 611.312 70.52 601.925 70.52 594.245 71.9707 588.272 74.872 582.469 77.6027 579.568 81.9547 579.568 87.928 579.568 93.9013 582.469 97.912 588.272 99.96 594.075 102.008 603.547 103.715 616.688 105.08 632.389 106.445 645.019 108.579 654.576 111.48 664.133 114.211 671.045 118.392 675.312 124.024 679.579 129.485 681.712 137.165 681.712 147.064c0 12.8-5.803 23.125-17.408 30.976C652.869 185.72 635.205 189.56 611.312 189.56z",
									),
									Fill("#fff"),
								),
							),
						),
						Button(
							Type("button"),
							Class("btn btn-link nav-link p-0 ms-auto"),
							AriaLabel("Close"),
							Svg(
								Width("24"),
								ViewBox("0 0 24 24"),
								StrokeLinecap("round"),
								StrokeLinejoin("round"),
								Class("icon icon-tabler icon-tabler-x"),
								StrokeWidth("2"),
								Stroke("currentcolor"),
								Fill("none"),
								Height("24"),
								Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
								Path(D("M18 6 6 18")),
								Path(D("M6 6l12 12")),
							),
						),
					),
					Div(
						Class(
							"offcanvas-body d-flex flex-column flex-lg-row justify-content-between",
						),
						Ul(
							Class("navbar-nav flex-grow-1"),
							Li(
								Class("nav-item"),
								A(
									Class("nav-link"),
									Href("https://getdoks.org/docs/start-here/getting-started/"),
									Text("Docs"),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Class("nav-link"),
									Href("https://getdoks.org/showcase/"),
									Text("Showcase"),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Class("nav-link"),
									Href("https://getdoks.org/blog/"),
									Text("Blog"),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Class("nav-link"),
									Href("https://github.com/thuliteio/doks/discussions"),
									Target("blank"),
									Text("Discussions"),
									Svg(
										Class(
											"ms-1 mb-1 icon icon-tabler icon-tabler-external-link",
										),
										StrokeWidth("1.5"),
										Stroke("currentcolor"),
										Fill("none"),
										Width("20"),
										Height("20"),
										ViewBox("0 0 24 24"),
										StrokeLinecap("round"),
										StrokeLinejoin("round"),
										Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
										Path(
											D(
												"M12 6H6A2 2 0 004 8v10a2 2 0 002 2h10a2 2 0 002-2v-6",
											),
										),
										Path(D("M11 13l9-9")),
										Path(D("M15 4h5v5")),
									),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Target("blank"),
									Class("nav-link"),
									Href("https://thulite.io"),
									Text("Thulite"),
									Svg(
										Height("20"),
										ViewBox("0 0 24 24"),
										Fill("none"),
										StrokeLinecap("round"),
										StrokeLinejoin("round"),
										Class(
											"ms-1 mb-1 icon icon-tabler icon-tabler-external-link",
										),
										StrokeWidth("1.5"),
										Stroke("currentcolor"),
										Width("20"),
										Path(D("M0 0h24v24H0z"), Fill("none"), Stroke("none")),
										Path(
											D(
												"M12 6H6A2 2 0 004 8v10a2 2 0 002 2h10a2 2 0 002-2v-6",
											),
										),
										Path(D("M11 13l9-9")),
										Path(D("M15 4h5v5")),
									),
								),
							),
						),
						Button(
							Type("button"),
							Id("searchToggleDesktop"),
							Class("btn btn-link nav-link mx-2 d-none d-lg-block"),
							AriaLabel("Search website"),
							Svg(
								Width("24"),
								Stroke("currentcolor"),
								StrokeLinejoin("round"),
								Class("icon icon-tabler icon-tabler-search"),
								Height("24"),
								ViewBox("0 0 24 24"),
								StrokeWidth("2"),
								Fill("none"),
								StrokeLinecap("round"),
								Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
								Circle(Cy("10"), R("7"), Cx("10")),
								Line(X1("21"), Y1("21"), X2("15"), Y2("15")),
							),
						),
						Button(
							Id("buttonColorMode"),
							Class("btn btn-link mx-auto nav-link p-0 ms-lg-2 me-lg-1"),
							Type("button"),
							AriaLabel("Toggle theme"),
							Svg(
								StrokeWidth("2"),
								Stroke("currentcolor"),
								Fill("none"),
								StrokeLinecap("round"),
								StrokeLinejoin("round"),
								Class("icon icon-tabler icon-tabler-moon"),
								Width("24"),
								Height("24"),
								ViewBox("0 0 24 24"),
								Path(D("M0 0h24v24H0z"), Fill("none"), Stroke("none")),
								Path(
									D(
										"M12 3c.132.0.263.0.393.0a7.5 7.5.0 007.92 12.446A9 9 0 1112 2.992z",
									),
								),
							),
							Svg(
								Height("24"),
								Stroke("currentcolor"),
								Fill("none"),
								StrokeLinecap("round"),
								StrokeLinejoin("round"),
								Class("icon icon-tabler icon-tabler-sun"),
								Width("24"),
								ViewBox("0 0 24 24"),
								StrokeWidth("2"),
								Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
								Path(
									D(
										"M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0m-5 0h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7",
									),
								),
							),
						),
						Ul(
							Id("socialMenu"),
							Class("nav mx-auto flex-row order-lg-4"),
							Li(
								Class("nav-item d-none d-lg-flex py-1 col-auto"),
								Div(Class("vr h-100 mx-2 text-muted")),
							),
							Li(
								Class("nav-item"),
								A(
									Rel("me"),
									Class("nav-link social-link"),
									Href("https://github.com/thuliteio/doks"),
									Svg(
										Class("icon icon-tabler icon-tabler-brand-github"),
										Width("24"),
										Fill("none"),
										StrokeLinejoin("round"),
										Height("24"),
										ViewBox("0 0 24 24"),
										StrokeWidth("2"),
										Stroke("currentcolor"),
										StrokeLinecap("round"),
										Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
										Path(
											D(
												"M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6.0 00-1.3-3.2 4.2 4.2.0 00-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3.0 00-6.2.0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2.0 00-.1 3.2A4.6 4.6.0 004 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21",
											),
										),
									),
									Small(Class("ms-2 visually-hidden"), Text("GitHub")),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Rel("me"),
									Class("nav-link social-link"),
									Href("https://fosstodon.org/@doks"),
									Svg(
										Width("24"),
										Height("24"),
										Stroke("currentcolor"),
										Fill("none"),
										StrokeLinejoin("round"),
										Class("icon icon-tabler icon-tabler-brand-mastodon"),
										ViewBox("0 0 24 24"),
										StrokeWidth("2"),
										StrokeLinecap("round"),
										Path(D("M0 0h24v24H0z"), Fill("none"), Stroke("none")),
										Path(
											D(
												"M18.648 15.254C16.832 17.017 12 16.88 12 16.88a18.262 18.262.0 01-3.288-.256c1.127 1.985 4.12 2.81 8.982 2.475-1.945 2.013-13.598 5.257-13.668-7.636L4 10.309c0-3.036.023-4.115 1.352-5.633C7.023 2.766 12 3.01 12 3.01s4.977-.243 6.648 1.667C19.977 6.195 20 7.274 20 10.31s-.456 4.074-1.352 4.944z",
											),
										),
										Path(
											D(
												"M12 11.204V8.278C12 7.02 11.105 6 10 6S8 7.02 8 8.278V13m4-4.722C12 7.02 12.895 6 14 6s2 1.02 2 2.278V13",
											),
										),
									),
									Small(Class("ms-2 visually-hidden"), Text("Mastodon")),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Rel("me"),
									Class("nav-link social-link"),
									Href("https://twitter.com/getdoks"),
									Svg(
										StrokeWidth("2"),
										Stroke("currentcolor"),
										Fill("none"),
										StrokeLinecap("round"),
										Height("24"),
										Width("24"),
										ViewBox("0 0 24 24"),
										StrokeLinejoin("round"),
										Class("icon icon-tabler icon-tabler-brand-x"),
										Path(D("M0 0h24v24H0z"), Fill("none"), Stroke("none")),
										Path(D("M4 4l11.733 16H20L8.267 4z")),
										Path(D("M4 20l6.768-6.768m2.46-2.46L20 4")),
									),
									Small(Class("ms-2 visually-hidden"), Text("Twitter")),
								),
							),
						),
					),
				),
			),
		),
	)
}

func RenderDoksPage() *Node {
	return Div(
		Class("sticky-top"),
		Header(
			Class("navbar navbar-expand-lg"),
			Div(
				Class("container-fluid"),
				A(
					Class("navbar-brand me-auto me-lg-3"),
					Href("/"),
					Span(Class("visually-hidden"), Text("Doks")),
					Svg(
						Id("svg-doks-images-light-mode"),
						Role("img"),
						Width("70"),
						ViewBox("0 0 682 190"),
						Fill("none"),
						Class("svg-inline svg-inline-custom svg-lightmode"),
						Height("100%"),
						Path(
							D(
								"M.616001 187V.375992H88.424c21.163.0 38.912 3.925338 53.248 11.776008 14.507 7.68 25.429 18.5173 32.768 32.512C181.949 58.6587 185.704 75.0427 185.704 93.816c0 19.968-4.011 36.864-12.032 50.688-7.851 13.824-19.029 24.405-33.536 31.744C125.629 183.416 108.392 187 88.424 187H.616001zM38.248 157.304H81.512c22.357.0 38.912-5.71700000000001 49.664-17.152 10.923-11.435 16.384-27.136 16.384-47.104.0-21.8453-6.059-37.8027-18.176-47.872-11.947-10.24-27.904-15.36-47.872-15.36H38.248V157.304zM281.82 189.56C265.777 189.56 251.697 186.744 239.58 181.112 227.463 175.48 217.991 167.373 211.164 156.792 204.508 146.211 201.18 133.581 201.18 118.904S204.508 91.6827 211.164 81.272C217.82 70.6907 227.207 62.584 239.324 56.952c12.117-5.8027 26.283-8.704 42.496-8.704 16.213.0 30.379 2.816 42.496 8.448C336.433 62.328 345.82 70.4347 352.476 81.016 359.132 91.4267 362.46 104.056 362.46 118.904 362.46 133.411 359.132 145.955 352.476 156.536s-16.043 18.773-28.16 24.576C312.369 186.744 298.204 189.56 281.82 189.56zm0-28.16c13.824.0 24.661-3.84 32.512-11.52s11.776-18.005 11.776-30.976C326.108 105.763 322.183 95.4373 314.332 87.928 306.652 80.248 295.815 76.408 281.82 76.408c-13.824.0-24.661 3.84-32.512 11.52C241.628 95.608 237.788 105.933 237.788 118.904S241.628 142.2 249.308 149.88C257.159 157.56 267.996 161.4 281.82 161.4zM384.068 187V.375992H420.42V110.2l17.152-15.36L490.82 50.808h46.336l-64.768 53.504L539.46 187H494.148l-38.656-48.64L446.02 125.56l-25.6 20.736V187H384.068zm227.244 2.56c-22.699.0-40.107-4.096-52.224-12.288C546.971 169.08 540.485 157.987 539.632 143.992H575.216c1.024 15.36 13.397 23.04 37.12 23.04C622.747 167.032 630.939 165.667 636.912 162.936 642.885 160.035 645.872 155.512 645.872 149.368 645.872 144.76 644.763 141.347 642.544 139.128 640.325 136.739 636.571 134.947 631.28 133.752 625.989 132.557 618.651 131.533 609.264 130.68 593.733 129.144 581.189 127.011 571.632 124.28 562.075 121.379 555.077 117.283 550.64 111.992 546.373 106.701 544.24 99.6187 544.24 90.744 544.24 77.7733 550.128 67.448 561.904 59.768c11.947-7.68 28.501-11.52 49.664-11.52C631.195 48.248 646.811 52.0027 658.416 59.512 670.021 67.0213 676.421 77.688 677.616 91.512H643.056C642.373 84.344 639.131 79.0533 633.328 75.64 627.525 72.2267 620.187 70.52 611.312 70.52 601.925 70.52 594.245 71.9707 588.272 74.872 582.469 77.6027 579.568 81.9547 579.568 87.928 579.568 93.9013 582.469 97.912 588.272 99.96 594.075 102.008 603.547 103.715 616.688 105.08 632.389 106.445 645.019 108.579 654.576 111.48 664.133 114.211 671.045 118.392 675.312 124.024 679.579 129.485 681.712 137.165 681.712 147.064c0 12.8-5.803 23.125-17.408 30.976C652.869 185.72 635.205 189.56 611.312 189.56z",
							),
							Fill("#1d2d35"),
						),
					),
					Svg(
						Role("img"),
						Width("70"),
						ViewBox("0 0 682 190"),
						Fill("none"),
						Class("svg-inline svg-inline-custom svg-darkmode"),
						Height("100%"),
						Id("svg-doks-images-dark-mode"),
						Path(
							D(
								"M.616001 187V.375992H88.424c21.163.0 38.912 3.925338 53.248 11.776008 14.507 7.68 25.429 18.5173 32.768 32.512C181.949 58.6587 185.704 75.0427 185.704 93.816c0 19.968-4.011 36.864-12.032 50.688-7.851 13.824-19.029 24.405-33.536 31.744C125.629 183.416 108.392 187 88.424 187H.616001zM38.248 157.304H81.512c22.357.0 38.912-5.71700000000001 49.664-17.152 10.923-11.435 16.384-27.136 16.384-47.104.0-21.8453-6.059-37.8027-18.176-47.872-11.947-10.24-27.904-15.36-47.872-15.36H38.248V157.304zM281.82 189.56C265.777 189.56 251.697 186.744 239.58 181.112 227.463 175.48 217.991 167.373 211.164 156.792 204.508 146.211 201.18 133.581 201.18 118.904S204.508 91.6827 211.164 81.272C217.82 70.6907 227.207 62.584 239.324 56.952c12.117-5.8027 26.283-8.704 42.496-8.704 16.213.0 30.379 2.816 42.496 8.448C336.433 62.328 345.82 70.4347 352.476 81.016 359.132 91.4267 362.46 104.056 362.46 118.904 362.46 133.411 359.132 145.955 352.476 156.536s-16.043 18.773-28.16 24.576C312.369 186.744 298.204 189.56 281.82 189.56zm0-28.16c13.824.0 24.661-3.84 32.512-11.52s11.776-18.005 11.776-30.976C326.108 105.763 322.183 95.4373 314.332 87.928 306.652 80.248 295.815 76.408 281.82 76.408c-13.824.0-24.661 3.84-32.512 11.52C241.628 95.608 237.788 105.933 237.788 118.904S241.628 142.2 249.308 149.88C257.159 157.56 267.996 161.4 281.82 161.4zM384.068 187V.375992H420.42V110.2l17.152-15.36L490.82 50.808h46.336l-64.768 53.504L539.46 187H494.148l-38.656-48.64L446.02 125.56l-25.6 20.736V187H384.068zm227.244 2.56c-22.699.0-40.107-4.096-52.224-12.288C546.971 169.08 540.485 157.987 539.632 143.992H575.216c1.024 15.36 13.397 23.04 37.12 23.04C622.747 167.032 630.939 165.667 636.912 162.936 642.885 160.035 645.872 155.512 645.872 149.368 645.872 144.76 644.763 141.347 642.544 139.128 640.325 136.739 636.571 134.947 631.28 133.752 625.989 132.557 618.651 131.533 609.264 130.68 593.733 129.144 581.189 127.011 571.632 124.28 562.075 121.379 555.077 117.283 550.64 111.992 546.373 106.701 544.24 99.6187 544.24 90.744 544.24 77.7733 550.128 67.448 561.904 59.768c11.947-7.68 28.501-11.52 49.664-11.52C631.195 48.248 646.811 52.0027 658.416 59.512 670.021 67.0213 676.421 77.688 677.616 91.512H643.056C642.373 84.344 639.131 79.0533 633.328 75.64 627.525 72.2267 620.187 70.52 611.312 70.52 601.925 70.52 594.245 71.9707 588.272 74.872 582.469 77.6027 579.568 81.9547 579.568 87.928 579.568 93.9013 582.469 97.912 588.272 99.96 594.075 102.008 603.547 103.715 616.688 105.08 632.389 106.445 645.019 108.579 654.576 111.48 664.133 114.211 671.045 118.392 675.312 124.024 679.579 129.485 681.712 137.165 681.712 147.064c0 12.8-5.803 23.125-17.408 30.976C652.869 185.72 635.205 189.56 611.312 189.56z",
							),
							Fill("#fff"),
						),
					),
				),
				Div(
					Id("docsearch"),
					Class("d-none"),
					Tabindex("-1"),
					Button(
						Type("button"),
						AriaLabel("Search (Command+K)"),
						Class("DocSearch DocSearch-Button"),
						Span(
							Class("DocSearch-Button-Container"),
							Svg(
								Class("DocSearch-Search-Icon"),
								Width("20"),
								Height("20"),
								ViewBox("0 0 20 20"),
								AriaHidden("true"),
								Path(
									StrokeLinecap("round"),
									StrokeLinejoin("round"),
									D(
										"M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z",
									),
									Stroke("currentColor"),
									Fill("none"),
									FillRule("evenodd"),
								),
							),
							Span(Class("DocSearch-Button-Placeholder"), Text("Search")),
						),
					),
				),
				Button(
					Class("btn btn-link nav-link mx-2 d-lg-none"),
					AriaLabel("Search website"),
					Type("button"),
					Id("searchToggleMobile"),
					Svg(
						Class("icon icon-tabler icon-tabler-search"),
						Stroke("currentcolor"),
						Width("24"),
						Height("24"),
						ViewBox("0 0 24 24"),
						StrokeWidth("2"),
						Fill("none"),
						StrokeLinecap("round"),
						StrokeLinejoin("round"),
						Path(D("M0 0h24v24H0z"), Fill("none"), Stroke("none")),
						Circle(R("7"), Cx("10"), Cy("10")),
						Line(X1("21"), Y1("21"), X2("15"), Y2("15")),
					),
				),
				Button(
					Class("btn btn-link d-lg-none"),
					Type("button"),
					AriaControls("offcanvasNavSection"),
					AriaLabel("Open section navigation menu"),
					Svg(
						Width("24"),
						StrokeWidth("2"),
						Stroke("currentcolor"),
						Fill("none"),
						Class("icon icon-tabler icon-tabler-dots-vertical"),
						Height("24"),
						ViewBox("0 0 24 24"),
						StrokeLinecap("round"),
						StrokeLinejoin("round"),
						Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
						Path(D("M12 12m-1 0a1 1 0 102 0 1 1 0 10-2 0")),
						Path(D("M12 19m-1 0a1 1 0 102 0 1 1 0 10-2 0")),
						Path(D("M12 5m-1 0a1 1 0 102 0 1 1 0 10-2 0")),
					),
				),
				Div(
					Class("offcanvas offcanvas-start d-lg-none"),
					Tabindex("-1"),
					Id("offcanvasNavSection"),
					AriaLabelledby("offcanvasNavSectionLabel"),
					Div(
						Class("offcanvas-header"),
						H5(Class("offcanvas-title"), Id("offcanvasNavSectionLabel"), Text("Docs")),
						Button(
							Type("button"),
							Class("btn btn-link nav-link p-0 ms-auto"),
							AriaLabel("Close"),
							Svg(
								Stroke("currentcolor"),
								StrokeLinecap("round"),
								StrokeLinejoin("round"),
								ViewBox("0 0 24 24"),
								Width("24"),
								Height("24"),
								StrokeWidth("2"),
								Fill("none"),
								Class("icon icon-tabler icon-tabler-x"),
								Path(Fill("none"), Stroke("none"), D("M0 0h24v24H0z")),
								Path(D("M18 6 6 18")),
								Path(D("M6 6l12 12")),
							),
						),
					),
					Div(
						Class("offcanvas-body"),
						Aside(
							Class("doks-sidebar mt-n3"),
							Nav(
								AriaLabel("Tertiary navigation"),
								Id("doks-docs-nav"),
								Nav(
									Class("section-nav docs-links"),
									Ul(
										Class("list-unstyled"),
										Li(
											Details(
												Open(true),
												Summary(Text("Start Here")),
												Ul(
													Class("list-unstyled list-nested"),
													Li(
														A(
															Href(
																"/docs/start-here/getting-started/",
															),
															Text("Getting Started"),
														),
													),
													Li(
														A(
															Href("/docs/start-here/installation/"),
															Text("Installation"),
														),
													),
													Li(
														Class("active"),
														A(
															Href("/docs/start-here/upgrade-doks/"),
															Text("Upgrade Doks"),
														),
													),
												),
											),
										),
										Li(
											Details(
												Open(true),
												Summary(Text("Basics")),
												Ul(
													Class("list-unstyled list-nested"),
													Li(
														A(
															Href("/docs/basics/project-structure/"),
															Text("Project Structure"),
														),
													),
													Li(
														A(
															Href("/docs/basics/authoring-content/"),
															Text("Authoring Content"),
														),
													),
													Li(
														A(
															Href("/docs/basics/shortcodes/"),
															Text("Shortcodes"),
														),
													),
													Li(
														A(
															Href("/docs/basics/navigation/"),
															Text("Navigation"),
														),
													),
													Li(
														A(
															Href("/docs/basics/configuration/"),
															Text("Configuration"),
														),
													),
												),
											),
										),
										Li(
											Details(
												Summary(Text("Built-ins")),
												Ul(
													Class("list-unstyled list-nested"),
													Li(
														A(
															Href("/docs/built-ins/math/"),
															Text("Mathematical Expressions"),
														),
													),
													Li(
														A(
															Href("/docs/built-ins/diagrams/"),
															Text("Diagrams"),
														),
													),
													Li(
														A(
															Href("/docs/built-ins/code-blocks/"),
															Text("Code Blocks"),
														),
													),
												),
											),
										),
										Li(
											Details(
												Open(true),
												Summary(Text("Recipes")),
												Ul(
													Class("list-unstyled list-nested"),
													Li(
														A(
															Href("/docs/recipes/deploy/"),
															Text("Deploy"),
														),
													),
													Li(
														A(
															Href("/docs/recipes/analytics/"),
															Text("Analytics"),
														),
													),
													Li(A(Href("/docs/recipes/cms/"), Text("CMS"))),
													Li(
														A(
															Href("/docs/recipes/docsearch/"),
															Text("DocSearch"),
														),
													),
													Li(
														A(
															Href("/docs/recipes/versioning/"),
															Text("Versioning"),
														),
													),
												),
											),
										),
										Li(
											Details(
												Open(true),
												Summary(Text("Guides")),
												Ul(
													Class("list-unstyled list-nested"),
													Li(
														A(
															Href("/docs/guides/customization/"),
															Text("Customizing Doks"),
														),
													),
													Li(
														A(
															Href("/docs/guides/styles/"),
															Text("Styles"),
														),
													),
													Li(
														A(
															Href("/docs/guides/scripts/"),
															Text("Scripts"),
														),
													),
													Li(
														A(
															Href("/docs/guides/layouts/"),
															Text("Layouts"),
														),
													),
													Li(
														A(
															Href("/docs/guides/i18n/"),
															Text("Internationalization (i18n)"),
														),
													),
												),
											),
										),
										Li(
											Details(
												Summary(Text("Reference")),
												Ul(
													Class("list-unstyled list-nested"),
													Li(
														A(
															Href("/docs/reference/configuration/"),
															Text("Configuration"),
														),
													),
													Li(
														A(
															Href("/docs/reference/frontmatter/"),
															Text("Frontmatter"),
														),
													),
													Li(
														A(
															Href(
																"/docs/reference/markdown-basic-syntax/",
															),
															Text("Markdown Basic Syntax"),
														),
													),
													Li(
														A(
															Href(
																"/docs/reference/markdown-extended-syntax/",
															),
															Text("Markdown Extended Syntax"),
														),
													),
												),
											),
										),
									),
								),
							),
						),
					),
				),
				Button(
					Class("btn btn-link nav-link mx-2 order-3 d-lg-none"),
					Type("button"),
					AriaControls("offcanvasNavMain"),
					AriaLabel("Open main navigation menu"),
					Svg(
						Width("24"),
						Height("24"),
						ViewBox("0 0 24 24"),
						StrokeWidth("2"),
						StrokeLinecap("round"),
						Class("icon icon-tabler icon-tabler-menu"),
						Stroke("currentcolor"),
						Fill("none"),
						StrokeLinejoin("round"),
						Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
						Line(X1("4"), Y1("8"), X2("20"), Y2("8")),
						Line(X1("4"), Y1("16"), X2("20"), Y2("16")),
					),
				),
				Div(
					Class("offcanvas offcanvas-end h-auto"),
					Tabindex("-1"),
					Id("offcanvasNavMain"),
					AriaLabelledby("offcanvasNavMainLabel"),
					Div(
						Class("offcanvas-header"),
						H5(
							Class("offcanvas-title"),
							Id("offcanvasNavMainLabel"),
							Span(Class("visually-hidden"), Text("Doks")),
							Svg(
								Id("svg-doks-images-light-mode"),
								Role("img"),
								Width("60"),
								ViewBox("0 0 682 190"),
								Fill("none"),
								Class("svg-inline svg-inline-custom svg-lightmode"),
								Height("100%"),
								Path(
									D(
										"M.616001 187V.375992H88.424c21.163.0 38.912 3.925338 53.248 11.776008 14.507 7.68 25.429 18.5173 32.768 32.512C181.949 58.6587 185.704 75.0427 185.704 93.816c0 19.968-4.011 36.864-12.032 50.688-7.851 13.824-19.029 24.405-33.536 31.744C125.629 183.416 108.392 187 88.424 187H.616001zM38.248 157.304H81.512c22.357.0 38.912-5.71700000000001 49.664-17.152 10.923-11.435 16.384-27.136 16.384-47.104.0-21.8453-6.059-37.8027-18.176-47.872-11.947-10.24-27.904-15.36-47.872-15.36H38.248V157.304zM281.82 189.56C265.777 189.56 251.697 186.744 239.58 181.112 227.463 175.48 217.991 167.373 211.164 156.792 204.508 146.211 201.18 133.581 201.18 118.904S204.508 91.6827 211.164 81.272C217.82 70.6907 227.207 62.584 239.324 56.952c12.117-5.8027 26.283-8.704 42.496-8.704 16.213.0 30.379 2.816 42.496 8.448C336.433 62.328 345.82 70.4347 352.476 81.016 359.132 91.4267 362.46 104.056 362.46 118.904 362.46 133.411 359.132 145.955 352.476 156.536s-16.043 18.773-28.16 24.576C312.369 186.744 298.204 189.56 281.82 189.56zm0-28.16c13.824.0 24.661-3.84 32.512-11.52s11.776-18.005 11.776-30.976C326.108 105.763 322.183 95.4373 314.332 87.928 306.652 80.248 295.815 76.408 281.82 76.408c-13.824.0-24.661 3.84-32.512 11.52C241.628 95.608 237.788 105.933 237.788 118.904S241.628 142.2 249.308 149.88C257.159 157.56 267.996 161.4 281.82 161.4zM384.068 187V.375992H420.42V110.2l17.152-15.36L490.82 50.808h46.336l-64.768 53.504L539.46 187H494.148l-38.656-48.64L446.02 125.56l-25.6 20.736V187H384.068zm227.244 2.56c-22.699.0-40.107-4.096-52.224-12.288C546.971 169.08 540.485 157.987 539.632 143.992H575.216c1.024 15.36 13.397 23.04 37.12 23.04C622.747 167.032 630.939 165.667 636.912 162.936 642.885 160.035 645.872 155.512 645.872 149.368 645.872 144.76 644.763 141.347 642.544 139.128 640.325 136.739 636.571 134.947 631.28 133.752 625.989 132.557 618.651 131.533 609.264 130.68 593.733 129.144 581.189 127.011 571.632 124.28 562.075 121.379 555.077 117.283 550.64 111.992 546.373 106.701 544.24 99.6187 544.24 90.744 544.24 77.7733 550.128 67.448 561.904 59.768c11.947-7.68 28.501-11.52 49.664-11.52C631.195 48.248 646.811 52.0027 658.416 59.512 670.021 67.0213 676.421 77.688 677.616 91.512H643.056C642.373 84.344 639.131 79.0533 633.328 75.64 627.525 72.2267 620.187 70.52 611.312 70.52 601.925 70.52 594.245 71.9707 588.272 74.872 582.469 77.6027 579.568 81.9547 579.568 87.928 579.568 93.9013 582.469 97.912 588.272 99.96 594.075 102.008 603.547 103.715 616.688 105.08 632.389 106.445 645.019 108.579 654.576 111.48 664.133 114.211 671.045 118.392 675.312 124.024 679.579 129.485 681.712 137.165 681.712 147.064c0 12.8-5.803 23.125-17.408 30.976C652.869 185.72 635.205 189.56 611.312 189.56z",
									),
									Fill("#1d2d35"),
								),
							),
							Svg(
								ViewBox("0 0 682 190"),
								Fill("none"),
								Class("svg-inline svg-inline-custom svg-darkmode"),
								Height("100%"),
								Id("svg-doks-images-dark-mode"),
								Role("img"),
								Width("60"),
								Path(
									D(
										"M.616001 187V.375992H88.424c21.163.0 38.912 3.925338 53.248 11.776008 14.507 7.68 25.429 18.5173 32.768 32.512C181.949 58.6587 185.704 75.0427 185.704 93.816c0 19.968-4.011 36.864-12.032 50.688-7.851 13.824-19.029 24.405-33.536 31.744C125.629 183.416 108.392 187 88.424 187H.616001zM38.248 157.304H81.512c22.357.0 38.912-5.71700000000001 49.664-17.152 10.923-11.435 16.384-27.136 16.384-47.104.0-21.8453-6.059-37.8027-18.176-47.872-11.947-10.24-27.904-15.36-47.872-15.36H38.248V157.304zM281.82 189.56C265.777 189.56 251.697 186.744 239.58 181.112 227.463 175.48 217.991 167.373 211.164 156.792 204.508 146.211 201.18 133.581 201.18 118.904S204.508 91.6827 211.164 81.272C217.82 70.6907 227.207 62.584 239.324 56.952c12.117-5.8027 26.283-8.704 42.496-8.704 16.213.0 30.379 2.816 42.496 8.448C336.433 62.328 345.82 70.4347 352.476 81.016 359.132 91.4267 362.46 104.056 362.46 118.904 362.46 133.411 359.132 145.955 352.476 156.536s-16.043 18.773-28.16 24.576C312.369 186.744 298.204 189.56 281.82 189.56zm0-28.16c13.824.0 24.661-3.84 32.512-11.52s11.776-18.005 11.776-30.976C326.108 105.763 322.183 95.4373 314.332 87.928 306.652 80.248 295.815 76.408 281.82 76.408c-13.824.0-24.661 3.84-32.512 11.52C241.628 95.608 237.788 105.933 237.788 118.904S241.628 142.2 249.308 149.88C257.159 157.56 267.996 161.4 281.82 161.4zM384.068 187V.375992H420.42V110.2l17.152-15.36L490.82 50.808h46.336l-64.768 53.504L539.46 187H494.148l-38.656-48.64L446.02 125.56l-25.6 20.736V187H384.068zm227.244 2.56c-22.699.0-40.107-4.096-52.224-12.288C546.971 169.08 540.485 157.987 539.632 143.992H575.216c1.024 15.36 13.397 23.04 37.12 23.04C622.747 167.032 630.939 165.667 636.912 162.936 642.885 160.035 645.872 155.512 645.872 149.368 645.872 144.76 644.763 141.347 642.544 139.128 640.325 136.739 636.571 134.947 631.28 133.752 625.989 132.557 618.651 131.533 609.264 130.68 593.733 129.144 581.189 127.011 571.632 124.28 562.075 121.379 555.077 117.283 550.64 111.992 546.373 106.701 544.24 99.6187 544.24 90.744 544.24 77.7733 550.128 67.448 561.904 59.768c11.947-7.68 28.501-11.52 49.664-11.52C631.195 48.248 646.811 52.0027 658.416 59.512 670.021 67.0213 676.421 77.688 677.616 91.512H643.056C642.373 84.344 639.131 79.0533 633.328 75.64 627.525 72.2267 620.187 70.52 611.312 70.52 601.925 70.52 594.245 71.9707 588.272 74.872 582.469 77.6027 579.568 81.9547 579.568 87.928 579.568 93.9013 582.469 97.912 588.272 99.96 594.075 102.008 603.547 103.715 616.688 105.08 632.389 106.445 645.019 108.579 654.576 111.48 664.133 114.211 671.045 118.392 675.312 124.024 679.579 129.485 681.712 137.165 681.712 147.064c0 12.8-5.803 23.125-17.408 30.976C652.869 185.72 635.205 189.56 611.312 189.56z",
									),
									Fill("#fff"),
								),
							),
						),
						Button(
							Type("button"),
							Class("btn btn-link nav-link p-0 ms-auto"),
							AriaLabel("Close"),
							Svg(
								Height("24"),
								Fill("none"),
								StrokeLinecap("round"),
								StrokeLinejoin("round"),
								Class("icon icon-tabler icon-tabler-x"),
								Width("24"),
								ViewBox("0 0 24 24"),
								StrokeWidth("2"),
								Stroke("currentcolor"),
								Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
								Path(D("M18 6 6 18")),
								Path(D("M6 6l12 12")),
							),
						),
					),
					Div(
						Class(
							"offcanvas-body d-flex flex-column flex-lg-row justify-content-between",
						),
						Ul(
							Class("navbar-nav flex-grow-1"),
							Li(
								Class("nav-item"),
								A(
									Class("nav-link active"),
									Href("https://getdoks.org/docs/start-here/getting-started/"),
									Text("Docs"),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Href("https://getdoks.org/showcase/"),
									Class("nav-link"),
									Text("Showcase"),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Class("nav-link"),
									Href("https://getdoks.org/blog/"),
									Text("Blog"),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Target("blank"),
									Class("nav-link"),
									Href("https://github.com/thuliteio/doks/discussions"),
									Text("Discussions"),
									Svg(
										Width("20"),
										Height("20"),
										Stroke("currentcolor"),
										StrokeLinecap("round"),
										Class(
											"ms-1 mb-1 icon icon-tabler icon-tabler-external-link",
										),
										ViewBox("0 0 24 24"),
										StrokeWidth("1.5"),
										Fill("none"),
										StrokeLinejoin("round"),
										Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
										Path(
											D(
												"M12 6H6A2 2 0 004 8v10a2 2 0 002 2h10a2 2 0 002-2v-6",
											),
										),
										Path(D("M11 13l9-9")),
										Path(D("M15 4h5v5")),
									),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Target("blank"),
									Class("nav-link"),
									Href("https://thulite.io"),
									Text("Thulite"),
									Svg(
										Fill("none"),
										StrokeLinecap("round"),
										StrokeLinejoin("round"),
										StrokeWidth("1.5"),
										Width("20"),
										Height("20"),
										ViewBox("0 0 24 24"),
										Stroke("currentcolor"),
										Class(
											"ms-1 mb-1 icon icon-tabler icon-tabler-external-link",
										),
										Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
										Path(
											D(
												"M12 6H6A2 2 0 004 8v10a2 2 0 002 2h10a2 2 0 002-2v-6",
											),
										),
										Path(D("M11 13l9-9")),
										Path(D("M15 4h5v5")),
									),
								),
							),
						),
						Button(
							Type("button"),
							Id("searchToggleDesktop"),
							Class("btn btn-link nav-link mx-2 d-none d-lg-block"),
							AriaLabel("Search website"),
							Svg(
								Class("icon icon-tabler icon-tabler-search"),
								Width("24"),
								Fill("none"),
								StrokeLinecap("round"),
								Height("24"),
								ViewBox("0 0 24 24"),
								StrokeWidth("2"),
								Stroke("currentcolor"),
								StrokeLinejoin("round"),
								Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
								Circle(R("7"), Cx("10"), Cy("10")),
								Line(Y1("21"), X2("15"), Y2("15"), X1("21")),
							),
						),
						Button(
							Class("btn btn-link mx-auto nav-link p-0 ms-lg-2 me-lg-1"),
							Type("button"),
							AriaLabel("Toggle theme"),
							Id("buttonColorMode"),
							Svg(
								StrokeLinejoin("round"),
								Class("icon icon-tabler icon-tabler-moon"),
								Height("24"),
								Stroke("currentcolor"),
								StrokeLinecap("round"),
								Width("24"),
								ViewBox("0 0 24 24"),
								StrokeWidth("2"),
								Fill("none"),
								Path(D("M0 0h24v24H0z"), Fill("none"), Stroke("none")),
								Path(
									D(
										"M12 3c.132.0.263.0.393.0a7.5 7.5.0 007.92 12.446A9 9 0 1112 2.992z",
									),
								),
							),
							Svg(
								Stroke("currentcolor"),
								Fill("none"),
								StrokeLinejoin("round"),
								Height("24"),
								StrokeWidth("2"),
								Width("24"),
								ViewBox("0 0 24 24"),
								StrokeLinecap("round"),
								Class("icon icon-tabler icon-tabler-sun"),
								Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
								Path(
									D(
										"M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0m-5 0h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7",
									),
								),
							),
						),
						Ul(
							Id("socialMenu"),
							Class("nav mx-auto flex-row order-lg-4"),
							Li(
								Class("nav-item d-none d-lg-flex py-1 col-auto"),
								Div(Class("vr h-100 mx-2 text-muted")),
							),
							Li(
								Class("nav-item"),
								A(
									Rel("me"),
									Class("nav-link social-link"),
									Href("https://github.com/thuliteio/doks"),
									Svg(
										StrokeLinecap("round"),
										StrokeLinejoin("round"),
										Width("24"),
										Height("24"),
										Stroke("currentcolor"),
										Fill("none"),
										Class("icon icon-tabler icon-tabler-brand-github"),
										ViewBox("0 0 24 24"),
										StrokeWidth("2"),
										Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
										Path(
											D(
												"M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6.0 00-1.3-3.2 4.2 4.2.0 00-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3.0 00-6.2.0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2.0 00-.1 3.2A4.6 4.6.0 004 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21",
											),
										),
									),
									Small(Class("ms-2 visually-hidden"), Text("GitHub")),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Rel("me"),
									Class("nav-link social-link"),
									Href("https://fosstodon.org/@doks"),
									Svg(
										Class("icon icon-tabler icon-tabler-brand-mastodon"),
										Width("24"),
										ViewBox("0 0 24 24"),
										Height("24"),
										StrokeWidth("2"),
										Stroke("currentcolor"),
										Fill("none"),
										StrokeLinecap("round"),
										StrokeLinejoin("round"),
										Path(Stroke("none"), D("M0 0h24v24H0z"), Fill("none")),
										Path(
											D(
												"M18.648 15.254C16.832 17.017 12 16.88 12 16.88a18.262 18.262.0 01-3.288-.256c1.127 1.985 4.12 2.81 8.982 2.475-1.945 2.013-13.598 5.257-13.668-7.636L4 10.309c0-3.036.023-4.115 1.352-5.633C7.023 2.766 12 3.01 12 3.01s4.977-.243 6.648 1.667C19.977 6.195 20 7.274 20 10.31s-.456 4.074-1.352 4.944z",
											),
										),
										Path(
											D(
												"M12 11.204V8.278C12 7.02 11.105 6 10 6S8 7.02 8 8.278V13m4-4.722C12 7.02 12.895 6 14 6s2 1.02 2 2.278V13",
											),
										),
									),
									Small(Class("ms-2 visually-hidden"), Text("Mastodon")),
								),
							),
							Li(
								Class("nav-item"),
								A(
									Rel("me"),
									Class("nav-link social-link"),
									Href("https://twitter.com/getdoks"),
									Svg(
										Class("icon icon-tabler icon-tabler-brand-x"),
										ViewBox("0 0 24 24"),
										StrokeLinejoin("round"),
										StrokeLinecap("round"),
										Width("24"),
										Height("24"),
										StrokeWidth("2"),
										Stroke("currentcolor"),
										Fill("none"),
										Path(Fill("none"), Stroke("none"), D("M0 0h24v24H0z")),
										Path(D("M4 4l11.733 16H20L8.267 4z")),
										Path(D("M4 20l6.768-6.768m2.46-2.46L20 4")),
									),
									Small(Class("ms-2 visually-hidden"), Text("Twitter")),
								),
							),
						),
					),
				),
			),
		),
	)
}

func RenderDoksBlogList() *Node {
	return Div(
		Class("wrap container-fluid"),
		Role("document"),
		Div(
			Class("content"),
			Div(
				Class("container p-0"),
				Div(
					Class("row justify-content-center"),
					Div(Class("col-md-12 col-lg-9"), H1(Class("text-center"), Text("Blog"))),
				),
				Div(
					Class("row justify-content-center"),
					Div(
						Class("col-lg-9"),
						Div(
							Class("card"),
							Img(
								Width("2100"),
								Alt("Doks 1.6"),
								Src("/blog/doks-1-6/cover-doks-1-6_hu15522838833687000704.jpg"),
								Height("900"),
								Class(
									"blur-up rounded-top-1 lazyautosizes ls-is-cached lazyloaded",
								),
								Sizes("667px"),
							),
							Div(
								Class("card-body"),
								Article(
									H2(
										Class("h3"),
										A(
											Class("stretched-link text-body"),
											Href("/blog/doks-1-6/"),
											Text("Doks 1.6"),
										),
									),
									P(
										Text(
											"Doks 1.6 is out! This release includes a new Hugo requirement, an improved",
										),
										Code(Text("scripts")),
										Text("setup, new development tools, and more."),
									),
									P(
										Small(
											Text("May 16, 2024 by"),
											Img(
												Class(
													"blur-up rounded-circle d-inline ms-1 ls-is-cached lazyloaded",
												),
												Src(
													"/contributors/henk-verlinde/henk-verlinde_hu10966805891996773672.jpg",
												),
												Alt("Henk Verlinde"),
												Width("42"),
												Height("42"),
											),
											A(
												Class("stretched-link position-relative ms-1"),
												Href("/contributors/henk-verlinde/"),
												Text("Henk Verlinde"),
											),
											Span(Class("mx-2"), Text("—")),
											Span(
												Title(T("Estimated reading time")),
												Class(
													"ms-0 stretched-link position-relative reading-time",
												),
												Svg(
													Fill("none"),
													StrokeLinecap("round"),
													StrokeLinejoin("round"),
													Width("24"),
													ViewBox("0 0 24 24"),
													Stroke("currentcolor"),
													Class("icon icon-tabler icon-tabler-clock"),
													Height("24"),
													StrokeWidth("2"),
													Path(
														Stroke("none"),
														D("M0 0h24v24H0z"),
														Fill("none"),
													),
													Path(D("M3 12a9 9 0 1018 0A9 9 0 003 12")),
													Path(D("M12 7v5l3 3")),
												),
												Text("2 minutes"),
											),
										),
									),
								),
							),
						),
						Div(
							Class("card"),
							Img(
								Width("2100"),
								Height("900"),
								Class(
									"blur-up rounded-top-1 lazyautosizes ls-is-cached lazyloaded",
								),
								Sizes("667px"),
								Src("/blog/doks-1-4/cover-doks-1-4_hu9672790749675156629.jpg"),
								Alt("Doks 1.4"),
							),
							Div(
								Class("card-body"),
								Article(
									H2(
										Class("h3"),
										A(
											Class("stretched-link text-body"),
											Href("/blog/doks-1-4/"),
											Text("Doks 1.4"),
										),
									),
									P(
										Text(
											"Doks 1.4 is now available! This release includes a new shortcode for link cards, improved sidebar navigation, and more.",
										),
									),
									P(
										Small(
											Text("March 2, 2024 by"),
											Img(
												Class(
													"blur-up rounded-circle d-inline ms-1 ls-is-cached lazyloaded",
												),
												Alt("Henk Verlinde"),
												Height("42"),
												Src(
													"/contributors/henk-verlinde/henk-verlinde_hu10966805891996773672.jpg",
												),
												Width("42"),
											),
											A(
												Class("stretched-link position-relative ms-1"),
												Href("/contributors/henk-verlinde/"),
												Text("Henk Verlinde"),
											),
											Span(Class("mx-2"), Text("—")),
											Span(
												Class(
													"ms-0 stretched-link position-relative reading-time",
												),
												Title(T("Estimated reading time")),
												Svg(
													ViewBox("0 0 24 24"),
													StrokeWidth("2"),
													Stroke("currentcolor"),
													StrokeLinejoin("round"),
													Width("24"),
													Height("24"),
													StrokeLinecap("round"),
													Class("icon icon-tabler icon-tabler-clock"),
													Fill("none"),
													Path(
														D("M0 0h24v24H0z"),
														Fill("none"),
														Stroke("none"),
													),
													Path(D("M3 12a9 9 0 1018 0A9 9 0 003 12")),
													Path(D("M12 7v5l3 3")),
												),
												Text("2 minutes"),
											),
										),
									),
								),
							),
						),
						Div(
							Class("card"),
							Img(
								Class(
									"blur-up rounded-top-1 lazyautosizes ls-is-cached lazyloaded",
								),
								Sizes("667px"),
								Src("/blog/doks-1-3/cover-doks-1-3_hu12875557152959853698.jpg"),
								Width("2100"),
								Height("900"),
								Alt("Doks 1.3"),
							),
							Div(
								Class("card-body"),
								Article(
									H2(
										Class("h3"),
										A(
											Class("stretched-link text-body"),
											Href("/blog/doks-1-3/"),
											Text("Doks 1.3"),
										),
									),
									P(
										Text(
											"Doks 1.3 — our first release of the new year — is here! This release includes restructured dependencies, deduplicated Bootstrap variables, and more.",
										),
									),
									P(
										Small(
											Text("January 17, 2024 by"),
											Img(
												Src(
													"/contributors/henk-verlinde/henk-verlinde_hu10966805891996773672.jpg",
												),
												Alt("Henk Verlinde"),
												Width("42"),
												Height("42"),
												Class(
													"blur-up rounded-circle d-inline ms-1 ls-is-cached lazyloaded",
												),
											),
											A(
												Class("stretched-link position-relative ms-1"),
												Href("/contributors/henk-verlinde/"),
												Text("Henk Verlinde"),
											),
											Span(Class("mx-2"), Text("—")),
											Span(
												Class(
													"ms-0 stretched-link position-relative reading-time",
												),
												Title(T("Estimated reading time")),
												Svg(
													StrokeLinecap("round"),
													Class("icon icon-tabler icon-tabler-clock"),
													Width("24"),
													ViewBox("0 0 24 24"),
													StrokeWidth("2"),
													Stroke("currentcolor"),
													Fill("none"),
													Height("24"),
													StrokeLinejoin("round"),
													Path(
														Stroke("none"),
														D("M0 0h24v24H0z"),
														Fill("none"),
													),
													Path(D("M3 12a9 9 0 1018 0A9 9 0 003 12")),
													Path(D("M12 7v5l3 3")),
												),
												Text("1 minute"),
											),
										),
									),
								),
							),
						),
						Div(
							Class("card"),
							Img(
								Sizes("667px"),
								Width("2100"),
								Height("900"),
								Alt("Doks 1.2"),
								Src("/blog/doks-1-2/cover-doks-1-2_hu3088892580463491217.jpg"),
								Class(
									"blur-up rounded-top-1 lazyautosizes ls-is-cached lazyloaded",
								),
							),
							Div(
								Class("card-body"),
								Article(
									H2(
										Class("h3"),
										A(
											Href("/blog/doks-1-2/"),
											Class("stretched-link text-body"),
											Text("Doks 1.2"),
										),
									),
									P(
										Text(
											"Doks 1.2 is out! This release features support for diagrams, extended code blocks formatting, and more.",
										),
									),
									P(
										Small(
											Text("December 23, 2023 by"),
											Img(
												Class(
													"blur-up rounded-circle d-inline ms-1 ls-is-cached lazyloaded",
												),
												Alt("Henk Verlinde"),
												Width("42"),
												Src(
													"/contributors/henk-verlinde/henk-verlinde_hu10966805891996773672.jpg",
												),
												Height("42"),
											),
											A(
												Class("stretched-link position-relative ms-1"),
												Href("/contributors/henk-verlinde/"),
												Text("Henk Verlinde"),
											),
											Span(Class("mx-2"), Text("—")),
											Span(
												Class(
													"ms-0 stretched-link position-relative reading-time",
												),
												Title(T("Estimated reading time")),
												Svg(
													Class("icon icon-tabler icon-tabler-clock"),
													Width("24"),
													StrokeLinejoin("round"),
													Stroke("currentcolor"),
													Fill("none"),
													StrokeLinecap("round"),
													Height("24"),
													ViewBox("0 0 24 24"),
													StrokeWidth("2"),
													Path(
														Stroke("none"),
														D("M0 0h24v24H0z"),
														Fill("none"),
													),
													Path(D("M3 12a9 9 0 1018 0A9 9 0 003 12")),
													Path(D("M12 7v5l3 3")),
												),
												Text("2 minutes"),
											),
										),
									),
								),
							),
						),
						Div(
							Class("card"),
							Img(
								Width("2100"),
								Height("900"),
								Class(
									"blur-up rounded-top-1 lazyautosizes ls-is-cached lazyloaded",
								),
								Sizes("667px"),
								Src("/blog/doks-1/cover-doks-1_hu10123257967402575697.jpg"),
								Alt("Doks 1.0"),
							),
							Div(
								Class("card-body"),
								Article(
									H2(
										Class("h3"),
										A(
											Class("stretched-link text-body"),
											Href("/blog/doks-1/"),
											Text("Doks 1.0"),
										),
									),
									P(
										Text(
											"Doks 1.0 is here! This release is a restructure release, making Doks more robust, reliable, and flexible.",
										),
									),
									P(
										Small(
											Text("September 12, 2023 by"),
											Img(
												Class(
													"blur-up rounded-circle d-inline ms-1 ls-is-cached lazyloaded",
												),
												Src(
													"/contributors/henk-verlinde/henk-verlinde_hu10966805891996773672.jpg",
												),
												Alt("Henk Verlinde"),
												Width("42"),
												Height("42"),
											),
											A(
												Class("stretched-link position-relative ms-1"),
												Href("/contributors/henk-verlinde/"),
												Text("Henk Verlinde"),
											),
											Span(Class("mx-2"), Text("—")),
											Span(
												Title(T("Estimated reading time")),
												Class(
													"ms-0 stretched-link position-relative reading-time",
												),
												Svg(
													Stroke("currentcolor"),
													Fill("none"),
													Width("24"),
													Height("24"),
													ViewBox("0 0 24 24"),
													StrokeLinejoin("round"),
													Class("icon icon-tabler icon-tabler-clock"),
													StrokeWidth("2"),
													StrokeLinecap("round"),
													Path(
														D("M0 0h24v24H0z"),
														Fill("none"),
														Stroke("none"),
													),
													Path(D("M3 12a9 9 0 1018 0A9 9 0 003 12")),
													Path(D("M12 7v5l3 3")),
												),
												Text("1 minute"),
											),
										),
									),
								),
							),
						),
					),
				),
				Div(Class("row justify-content-center"), Div(Class("col-md-12 col-lg-9"))),
			),
		),
	)
}

func RenderCMS() *Node {
	return Div(
		Class("overflow-x-auto"),
		Table(
			Class("table"),
			Thead(Tr(Th(), Th(Text("Name")), Th(Text("Job")), Th(Text("Favorite Color")))),
			Tbody(
				Tr(
					Th(Text("1")),
					Td(Text("Cy Ganderton")),
					Td(Text("Quality Control Specialist")),
					Td(Text("Blue")),
				),
				Tr(
					Th(Text("2")),
					Td(Text("Hart Hagerty")),
					Td(Text("Desktop Support Technician")),
					Td(Text("Purple")),
				),
				Tr(
					Th(Text("3")),
					Td(Text("Brice Swyre")),
					Td(Text("Tax Accountant")),
					Td(Text("Red")),
				),
			),
		),
	)
}

func RenderFAB() *Node {
	return Div(
		Class("fixed bottom-5 right-5"),
		Div(
			Class("relative"),
			Button(
				Class("btn btn-primary rounded-full p-5 shadow-lg"),
				Span(Class("text-2xl"), Text("+")),
			),
			Div(
				Class("absolute right-0 mt-2 space-y-2 hidden group-hover:block"),
				Div(
					Class("dropdown dropdown-end"),
					Button(Class("btn btn-sm btn-secondary"), Text("Save Recipe")),
				),
				Div(
					Class("dropdown dropdown-end"),
					Button(Class("btn btn-sm btn-accent"), Text("Report Issue")),
				),
			),
		),
	)
}

func RenderFAB2() *Node {
	return Div(
		Class("toast"),
		Div(
			Class("dropdown dropdown-top dropdown-end"),
			Label(
				Tabindex("0"),
				Class("btn btn-primary btn-circle"),
				Svg(
					Stroke("currentColor"),
					Xmlns("http://www.w3.org/2000/svg"),
					Class("h-6 w-6"),
					Fill("none"),
					ViewBox("0 0 24 24"),
					Path(
						StrokeLinecap("round"),
						StrokeLinejoin("round"),
						StrokeWidth("2"),
						D("M6 18L18 6M6 6l12 12"),
					),
				),
			),
			Div(
				Tabindex("0"),
				Class("dropdown-content my-2 gap-2 flex flex-col"),
				Button(Class("btn btn-circle"), Span(Class("text-sm"), Text("Save Recipe"))),
				Button(Class("btn btn-circle"), Span(Class("text-sm"), Text("Report Issue"))),
			),
		),
	)
}

func PigSvg() *Node {
	return Svg(
		StrokeLinecap("round"),
		StrokeLinejoin("round"),
		Class("lucide lucide-piggy-bank-icon lucide-piggy-bank"),
		Xmlns("http://www.w3.org/2000/svg"),
		Height("24"),
		ViewBox("0 0 24 24"),
		Stroke("currentColor"),
		Width("24"),
		Fill("none"),
		StrokeWidth("2"),
		Path(
			D(
				"M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z",
			),
		),
		Path(D("M16 10h.01")),
		Path(D("M2 8v1a2 2 0 0 0 2 2h1")),
	)
}
