package main

import (
	. "github.com/breadchris/share/html2"
)

type Item struct {
	ID    int64
	Value string
}

func RenderList(db *DBAny) *Node {
	var list []*Node
	for _, v := range db.List() {
		a := v.(map[string]any)
		list = append(list, Div(Text(a["Value"].(string))))
	}
	return Div(Id("list"), Ch(list))
}

func ReloadNode() *Node {
	return Script(T(`
const ws = new WebSocket("ws://localhost:8080/reload/");

ws.onmessage = function (event) {
	if (event.data === "reload") {
		ws.close();
		console.log("File changed, reloading...");
		window.location.reload();
	}
};

ws.onclose = function () {
	console.log("WebSocket connection closed.");
};

ws.onerror = function (error) {
	console.error("WebSocket error:", error);
};
`))
}

func RenderComponents(db *DBAny) *Node {
	return Html(
		Head(
			Title(T("Hacker Profile")),
			Link(
				Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"),
				Attr("rel", "stylesheet"),
				Attr("type", "text/css"),
			),
			Script(Src("https://cdn.tailwindcss.com")),
			Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
			Style(T("body { font-family: 'Inter', sans-serif; }")),
			ReloadNode(),
		),
		Form(
			Method("POST"),
			HxPost("/scratch"),
			HxTrigger("submit"),
			HxTarget("#list"),
			Input(Name("value")),
			Button(Type("submit"), T("Submit")),
		),
		RenderList(db),
		//RenderButtons(),
		//RenderHero(),
		//RenderListWithCheckbox(),
		//RenderNameOfTheComponent(),
		RenderCarousel(),
		//RenderDoubleCalendar(),
		//RenderChatBubble(),
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
