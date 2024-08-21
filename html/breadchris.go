package html

type article struct {
	title   string
	content string
	url     string
}

func newArticle(a article) NodeOption {
	return Article(Class("post-entry"),
		Header(Class("entry-header"),
			H2(Class("entry-hint-parent"), T(a.title)),
		),
		Div(Class("entry-content"),
			P(T(a.content)),
		),
		Footer(Class("entry-footer"),
			Span(Attr("title", "2024-07-12 00:00:00 +0000 UTC"), T("July 12, 2024")),
			Span(T(" · breadchris")),
		),
		A(Class("entry-link"), AriaLabel("post link to The Figma Plugin System"), Href(a.url)),
	)
}

func RenderBreadchris() string {
	as := []article{
		{
			title:   "The Figma Plugin System",
			content: "The Figma Plugin System is a powerful tool for extending the functionality of Figma. In this article, we'll take a look at how the system works and how you can use it to create your own plugins.",
			url:     "https://breadchris.com/2024/07/12/the-figma-plugin-system/",
		},
		{
			title:   "Building a Design System in Figma",
			content: "Design systems are a powerful tool for creating consistent and scalable designs. In this article, we'll take a look at how you can use Figma to build your own design system.",
			url:     "https://breadchris.com/2024/07/12/building-a-design-system-in-figma/",
		},
		{
			title:   "Creating a Responsive Design in Figma",
			content: "Responsive design is a key concept in modern web design. In this article, we'll take a look at how you can use Figma to create responsive designs that look great on any device.",
			url:     "https://breadchris.com/2024/07/12/creating-a-responsive-design-in-figma/",
		},
	}
	var articles []NodeOption
	for _, a := range as {
		articles = append(articles, newArticle(a))
	}
	return Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Name("generator"), Content("Hugo 0.119.0")),
			Meta(HttpEquiv("X-UA-Compatible"), Content("IE=edge")),
			Meta(Name("viewport"), Content("width=device-width, initial-scale=1, shrink-to-fit=no")),
			Meta(Name("robots"), Content("index, follow")),
			Title(T("breadchris")),
			Meta(Name("description"), Content("")),
			Meta(Name("author"), Content("breadchris")),
			Link(Rel("canonical"), Href("https://breadchris.com/")),
			Link(Crossorigin("anonymous"), Href("https://breadchris.com/assets/css/stylesheet.7d0dbc7bebc97247baddbf44f81f3261912c9f64c3f03500922375b9988f4ea9.css"), Rel("preload stylesheet"), Attr("as", "style")),
			Link(Rel("icon"), Href("https://breadchris.com/favicon.ico")),
			Link(Rel("icon"), Type("image/png"), Sizes("16x16"), Href("https://breadchris.com/favicon-16x16.png")),
			Link(Rel("icon"), Type("image/png"), Sizes("32x32"), Href("https://breadchris.com/favicon-32x32.png")),
			Link(Rel("apple-touch-icon"), Href("https://breadchris.com/apple-touch-icon.png")),
			Link(Rel("mask-icon"), Href("https://breadchris.com/safari-pinned-tab.svg")),
			Meta(Name("theme-color"), Content("#2e2e33")),
			Meta(Name("msapplication-TileColor"), Content("#2e2e33")),
			Link(Rel("alternate"), Type("application/rss+xml"), Href("https://breadchris.com/index.xml")),
			Link(Rel("alternate"), Type("application/json"), Href("https://breadchris.com/index.json")),
			Meta(Property("og:title"), Content("breadchris")),
			Meta(Property("og:description"), Content("")),
			Meta(Property("og:type"), Content("website")),
			Meta(Property("og:url"), Content("https://breadchris.com/")),
			Meta(Name("twitter:card"), Content("summary")),
			Meta(Name("twitter:title"), Content("breadchris")),
			Meta(Name("twitter:description"), Content("")),
		),
		Body(Class("list dark vsc-initialized"), Id("top"),
			Header(Class("header"),
				Nav(Class("nav"),
					Div(Class("logo"),
						A(Href("https://breadchris.com/"), Accesskey("h"), Attr("title", "breadchris (Alt + H)"), T("breadchris")),
						Div(Class("logo-switches"),
							Button(Id("theme-toggle"), Accesskey("t"), Attr("title", "(Alt + T)")),
						),
					),
					Ul(Id("menu"),
						Li(A(Href("https://breadchris.com/blog"), Attr("title", "blog"), Span(T("blog")))),
						Li(A(Href("https://breadchris.com/resume"), Attr("title", "resume"), Span(T("resume")))),
						Li(A(Href("https://breadchris.com/tags/"), Attr("title", "tags"), Span(T("tags")))),
						Li(A(Href("https://breadchris.com/talks"), Attr("title", "talks"), Span(T("talks")))),
						Li(A(Href("https://breadchris.com/thinkies"), Attr("title", "thinkies"), Span(T("thinkies")))),
					),
				),
			),
			Main(Class("main"),
				Article(Class("first-entry home-info"),
					Header(Class("entry-header"),
						H1(T("breadchris")),
					),
					Div(Class("entry-content"), T("hack the planet")),
					Footer(Class("entry-footer"),
						Div(Class("social-icons"),
							A(Href("https://github.com/breadchris"), Target("_blank"), Rel("noopener noreferrer me"), Attr("title", "Github"),
								Text("github"),
							),
							A(Href("https://twitter.com/breadchris"), Target("_blank"), Rel("noopener noreferrer me"), Attr("title", "Twitter"),
								Text("twitter"),
							),
							A(Href("https://youtube.com/@breadchris/streams"), Target("_blank"), Rel("noopener noreferrer me"), Attr("title", "YouTube"),
								Text("youtube"),
							),
							A(Href("https://cal.com/breadchris"), Target("_blank"), Rel("noopener noreferrer me"), Attr("title", "Cal.com"),
								Text("cal.com"),
							),
						),
					),
				),
				Div(articles...),
			),
			Footer(Class("page-footer"),
				Nav(Class("pagination"),
					A(Class("next"), Href("https://breadchris.com/page/2/"), T("Next »")),
				),
			),
			Footer(Class("footer"),
				Span(T("© 2024 "), A(Href("https://breadchris.com/"), T("breadchris"))),
				Span(T("Powered by "), A(Href("https://gohugo.io/"), Rel("noopener noreferrer"), Target("_blank"), T("Hugo")), T(" & "), A(Href("https://github.com/adityatelange/hugo-PaperMod/"), Rel("noopener"), Target("_blank"), T("PaperMod"))),
			),
			A(Href("https://breadchris.com/#top"), AriaLabel("go to top"), Attr("title", "Go to Top (Alt + G)"), Class("top-link"), Id("top-link"), Attr("style", "visibility: hidden; opacity: 0;"),
				T("↑"),
			),
		),
	).Render()
}
