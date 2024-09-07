package main

import (
	. "github.com/breadchris/share/html"
)

type EntryUser struct {
	ID    string
	Email string
}

type Reaction struct {
	UserID string
	Emoji  string
}

type Entry struct {
	ID        string
	Text      string
	Timestamp string
	User      EntryUser
	UserID    string
	Reactions []Reaction
}

func RenderBlog(entries []Entry) string {
	var en []RenderNode
	for _, e := range entries {
		var reacts []RenderNode
		for _, r := range e.Reactions {
			reacts = append(reacts, Span(Class("mr-2"), T(r.Emoji)))
		}
		en = append(en,
			Div(Class("border p-4 rounded-lg"),
				P(Class("mb-2"), T(e.Text)),
				P(Class("text-sm text-gray-500"), T(e.Timestamp)),
				P(Class("text-sm text-gray-500"), T(e.User.Email)),
				Form(
					Action("/blog/react"),
					Method("POST"),
					Input(Type("hidden"), Name("id"), Attr("value", e.ID)),
					Button(Type("submit"), Class("text-blue-500"), T("👍")),
				).C(reacts),
				A(Href("/blog?id="+e.ID), Class("text-blue-500"), T("link")),
			),
		)
	}
	return Html(
		Attrs(map[string]string{"lang": "en"}),
		Head(
			Meta(Attrs(map[string]string{"charset": "UTF-8"})),
			Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
			Title(T("Journal")),
			Link(Rel("stylesheet"), Href("https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css")),
			Link(Rel("stylesheet"), Href("https://cdn.jsdelivr.net/npm/daisyui@1.14.0/dist/full.css")),
			Style(T(`
				h1 { font-size: 2em; }
				h2 { font-size: 1.5em; }
				h3 { font-size: 1.17em; }
				h4 { font-size: 1.00em; }
				h5 { font-size: 0.8em; }
				a {
					color: blue;
					text-decoration: underline;
				}
			`)),
		),
		Body(
			Class("p-4"),
			Div(Class("container mx-auto"),
				Div(Class("card shadow-lg compact p-6"),
					H1(Class("text-2xl font-bold mb-4"), T("Journal")),
					Form(
						Attr("action", "/blog"),
						Attr("method", "POST"),
						Class("mb-4"),
						//Attr("onsubmit", "document.querySelector('#entry').value = editor.getValue()"),
						//Input(Type("hidden"), Id("entry"), Name("entry")),
						//RenderCode(Code{
						//	C: "hello world!",
						//}),
						TextArea(
							Class("textarea w-full"),
							Id("entry"),
							Placeholder("you know what to do..."),
							Name("entry"),
						),
						Button(
							Type("submit"),
							Class("btn btn-primary"),
							T("Submit"),
						),
					),
					Form(Method("POST"), Action("/upload"), Attr("enctype", "multipart/form-data"),
						Input(Type("file"), Id("file"), Name("file"), Attr("required", "true")),
						Button(Type("submit"), T("Submit")),
					),
					P(T("1) upload a file 2) copy the link 3) make your post: ![](link)")),
					Script(T(`
						var entry = localStorage.getItem('entry');
						if (entry) {
							console.log('restoring entry from local storage')
							document.querySelector('#entry').value = entry;
						}

						document.querySelector('#entry').addEventListener('input', function(e) {
							console.log('saving entry to local storage')
							localStorage.setItem('entry', e.target.value);
						});
					`)),
					Div(Class("space-y-4")).C(en),
				),
			),
		),
	).Render()
}
