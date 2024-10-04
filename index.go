package main

import "github.com/breadchris/share/html"

func Navbar() *html.Node {
	return html.Nav(html.Class("bg-gray-800 p-4 text-white"),
		html.Div(html.Class("container mx-auto flex justify-between items-center"),
			html.Div(html.Class("text-lg font-bold"), html.T("justshare")),
			html.Div(html.Class("space-x-4"),
				html.A(html.Href("/data/recipes/"), html.Class("hover:underline"), html.T("Recipes")),
				html.A(html.Href("/login"), html.Class("hover:underline"), html.T("Login")),
				html.A(html.Href("/register"), html.Class("hover:underline"), html.T("Register")),
				html.A(html.Href("/blog"), html.Class("hover:underline"), html.T("Blog")),
				html.A(html.Href("/account"), html.Class("hover:underline"), html.T("Account")),
				html.A(html.Href("/chat"), html.Class("hover:underline"), html.T("Chat")),
				html.A(html.Href("/llm"), html.Class("hover:underline"), html.T("LLM")),
				html.A(html.Href("/spotify"), html.Class("hover:underline"), html.T("Spotify")),
				html.A(html.Href("/zine"), html.Class("hover:underline"), html.T("Zine")),
			),
		),
	)
}

func Index() string {
	bodyContent := html.Div(html.Class("container mx-auto text-center mt-16"),
		html.H1(html.Class("text-xl font-bold mb-4"), html.T("Welcome to justshare")),
		html.P(html.Class("text-lg text-gray-700 mb-8"), html.T("it is a site i guess")),
		html.Div(html.Class("flex justify-center space-x-4 m-1.5 p-7"),
			html.A(html.Href("/data/recipes/"), html.Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), html.T("Recipes")),
			html.A(html.Href("/login"), html.Class("bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"), html.T("Login")),
			html.A(html.Href("/register"), html.Class("bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"), html.T("Register")),
			html.A(html.Href("/blog"), html.Class("bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"), html.T("Blog")),
			html.A(html.Href("/account"), html.Class("bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"), html.T("Account")),
			html.A(html.Href("/chat"), html.Class("bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"), html.T("Chat")),
			html.A(html.Href("/llm"), html.Class("bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"), html.T("LLM")),
			html.A(html.Href("/spotify"), html.Class("bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"), html.T("Spotify")),
			html.A(html.Href("/zine"), html.Class("bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"), html.T("Zine")),
			html.A(html.Href("/graph"), html.Class("bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"), html.T("Graph")),
		),
	)

	return html.Html(
		html.Head(
			html.Title(html.T("justshare")),
			html.Link(html.Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"), html.Attr("rel", "stylesheet"), html.Attr("type", "text/css")),
			html.Link(html.Attr("rel", "icon"), html.Attr("href", "/favicon.ico"), html.Attr("type", "image/x-icon")),
			html.Script(html.Src("https://cdn.tailwindcss.com")),
			html.Style(html.T("body { font-family: 'Inter', sans-serif; }")),
		),
		html.Body(html.Class("min-h-screen flex flex-col"),
			Navbar(),
			bodyContent,
		),
	).Render()
}
