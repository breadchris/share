package html2

func Navbar() *Node {
	return Nav(Class("bg-gray-800 p-4 text-white"),
		Div(Class("container mx-auto flex justify-between items-center"),
			Div(Class("text-lg font-bold"), T("justshare")),
			Div(Class("space-x-4"),
				A(Href("/data/recipes/"), Class("hover:underline"), T("Recipes")),
				A(Href("/login"), Class("hover:underline"), T("Login")),
				A(Href("/register"), Class("hover:underline"), T("Register")),
				A(Href("/blog"), Class("hover:underline"), T("Blog")),
				A(Href("/account"), Class("hover:underline"), T("Account")),
				A(Href("/chat"), Class("hover:underline"), T("Chat")),
				A(Href("/llm"), Class("hover:underline"), T("LLM")),
				A(Href("/spotify"), Class("hover:underline"), T("Spotify")),
				A(Href("/zine/create-zine"), Class("hover:underline"), T("Zine")),
			),
		),
	)
}

func Index() string {
	bodyContent := Div(Class("container mx-auto text-center mt-16"),
		H1(Class("text-4xl font-bold mb-4"), T("Welcome to justshare")),
		P(Class("text-lg text-gray-700 mb-8"), T("it is a site i guess")),
		Div(Class("flex justify-center space-x-4"),
			A(Href("/data/recipes/"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Recipes")),
			A(Href("/login"), Class("bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"), T("Login")),
			A(Href("/register"), Class("bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"), T("Register")),
			A(Href("/blog"), Class("bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"), T("Blog")),
			A(Href("/account"), Class("bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"), T("Account")),
			A(Href("/chat"), Class("bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"), T("Chat")),
			A(Href("/llm"), Class("bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"), T("LLM")),
			A(Href("/spotify"), Class("bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"), T("Spotify")),
			A(Href("/zine/create-zine"), Class("bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"), T("Zine")),
			A(Href("/graph"), Class("bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"), T("Graph")),
		),
	)

	return Html(
		Head(
			Title(T("justshare")),
			Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"), Attr("rel", "stylesheet"), Attr("type", "text/css")),
			Link(Attr("rel", "icon"), Attr("href", "/favicon.ico"), Attr("type", "image/x-icon")),
			Script(Src("https://cdn.tailwindcss.com")),
			Style(T("body { font-family: 'Inter', sans-serif; }")),
		),
		Body(Class("min-h-screen flex flex-col"),
			Navbar(),
			bodyContent,
		),
	).Render()
}
