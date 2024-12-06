package main

import (
	. "github.com/breadchris/share/html"
)

func Index() *Node {
	type link struct {
		url  string
		text string
	}

	forLink := func(l []link, f func(link) *Node) []*Node {
		var nodes []*Node
		for _, v := range l {
			nodes = append(nodes, f(v))
		}
		return nodes
	}

	urls := []link{
		{"/calendar", "Calendar"},
		{"/notes/", "Notes"},
		{"/zine", "Zine"},
		{"/code/playground/", "Playground"},
		{"/data/recipes/", "Recipes"},
		{"/login", "Login"},
		{"/register", "Register"},
		{"/blog", "Blog"},
		{"/account", "Account"},
		{"/chat", "Chat"},
		{"/llm", "LLM"},
		{"/spotify", "Spotify"},
		{"/code", "Code"},
		{"/vote", "Vote"},
		{"/github", "Github"},
	}
	toggleMenu := Attr("onclick", "document.getElementById('menu').classList.toggle('hidden')")
	return DefaultLayout(
		Body(Class(""),
			Header(Class("absolute inset-x-0 top-0 z-50"),
				Nav(Class("flex items-center justify-between p-6 lg:px-8"), Attr("aria-label", "Global"),
					Div(Class("flex lg:flex-1"),
						A(Href("#"), Class("-m-1.5 p-1.5"),
							Span(Class("sr-only"), T("Your Company")),
							//Img(Class("h-8 w-auto"), Src("https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600"), Alt("")),
						),
					),
					Div(Class("flex lg:hidden"),
						Button(Type("button"), toggleMenu, Class("-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"),
							Span(Class("sr-only"), T("Open main menu")),
							Svg(Class("h-6 w-6"), Fill("none"), ViewBox("0 0 24 24"), Attr("stroke-width", "1.5"), Stroke("currentColor"), Attr("aria-hidden", "true"),
								Path(Attr("stroke-linecap", "round"), Attr("stroke-linejoin", "round"), D("M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5")),
							),
						),
					),
					Div(Class("hidden lg:flex lg:gap-x-12"),
						Ch(forLink(urls, func(l link) *Node {
							return A(Href(l.url), Class("text-sm font-semibold leading-6 text-gray-900"), T(l.text))
						})),
					),
					Div(Class("hidden lg:flex lg:flex-1 lg:justify-end"),
						A(Href("#"), Class("text-sm font-semibold leading-6 text-gray-900"), T("Log in "), Span(Attr("aria-hidden", "true"), T("→"))),
					),
				),
				// Mobile navigation menu, will show when menu is opened
				Div(Class("hidden"), Id("menu"), Attr("role", "dialog"), Attr("aria-modal", "true"),
					Div(Class("fixed inset-0 z-50")),
					Div(Class("fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10"),
						Div(Class("flex items-center justify-between"),
							A(Href("#"), Class("-m-1.5 p-1.5"),
								Span(Class("sr-only"), T("justshare")),
								//Img(Class("h-8 w-auto"), Src("https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600"), Alt("")),
							),
							Button(Type("button"), toggleMenu, Class("-m-2.5 rounded-md p-2.5 text-gray-700"),
								Span(Class("sr-only"), T("Close menu")),
								Svg(Class("h-6 w-6"), Fill("none"), ViewBox("0 0 24 24"), Attr("stroke-width", "1.5"), Stroke("currentColor"), Attr("aria-hidden", "true"),
									Path(Attr("stroke-linecap", "round"), Attr("stroke-linejoin", "round"), D("M6 18L18 6M6 6l12 12")),
								),
							),
						),
						Div(Class("mt-6 flow-root"),
							Div(Class("-my-6 divide-y divide-gray-500/10"),
								Div(Class("space-y-2 py-6"),
									Ch(forLink(urls, func(l link) *Node {
										return A(Href(l.url), Class("-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"), T(l.text))
									})),
								),
								Div(Class("py-6"),
									A(Href("#"), Class("-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"), T("Log in")),
								),
							),
						),
					),
				),
			),
			Div(Class("relative isolate px-6 lg:px-8"),
				Div(Class("absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"), Attr("aria-hidden", "true"),
					Div(Class("relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"), Attr("style", "clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)")),
				),
				Div(Class("mx-auto max-w-2xl py-16 sm:py-48 lg:py-56"),
					Div(Class("text-center"),
						Input(Class("input w-1/2"), Type("text"), Placeholder("you know what to do..."), Name("share")),
						Div(Class("w-full p-16 bg-gray-500"), T("a list of things from the groups you are in")),
						//H1(Class("text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"), T("Welcome to justshare")),
						//P(Class("mt-6 text-lg leading-8 text-gray-600"), T("it is a site i guess")),
						//Div(Class("mt-10 grid grid-cols-2 gap-4 m-1.5 p-7"),
						//	Ch(forLink(urls, func(l link) *Node {
						//		return A(Href(l.url), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded"), T(l.text))
						//	})),
						//),
					),
				),
				Div(Class("absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"), Attr("aria-hidden", "true"),
					Div(Class("relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"), Attr("style", "clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)")),
				),
			),
		),
	)
}
