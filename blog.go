package main

import (
	"encoding/json"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"github.com/russross/blackfriday/v2"
	"github.com/samber/lo"
	"net/http"
	"os"
	"time"
)

var entries []Entry

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
	var en []*Node
	for _, e := range entries {
		var reacts []*Node
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
					Ch(reacts),
				),
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
					Div(Class("space-y-4"),
						Ch(en),
					),
				),
			),
		),
	).Render()
}

const dataFile = "data/entries.json"

func loadJSON(f string, v any) {
	file, err := os.Open(f)
	if err != nil {
		if os.IsNotExist(err) {
			return
		}
		panic(err)
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	err = decoder.Decode(v)
	if err != nil {
		panic(err)
	}
}

func saveJSON(f string, v any) {
	file, err := os.Create(f)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(v)
	if err != nil {
		panic(err)
	}
}

func (s *Auth) reactHandler(w http.ResponseWriter, r *http.Request) {
	uid, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if r.Method == http.MethodPost {
		r.ParseForm()
		id := r.FormValue("id")

		entries = lo.Map(entries, func(e Entry, i int) Entry {
			if e.ID != id {
				return e
			}
			e.Reactions = append(e.Reactions, Reaction{
				UserID: uid,
				Emoji:  "👍",
			})
			return e
		})
		saveJSON(dataFile, entries)
	}
	http.Redirect(w, r, "/blog", http.StatusFound)
}

func (s *Auth) blogHandlerEditor(w http.ResponseWriter, r *http.Request) {
	Html(
		Div(
			Link(Rel("stylesheet"), Href("/dist/editor/editor.css")),
			Div(Class("w-full"), Attr("style", "height: 600px"), Id("editor")),
			Script(Attr("src", "/dist/editor/editor.js")),
		),
	).RenderPage(w, r)
}

func (s *Auth) blogHandler(w http.ResponseWriter, r *http.Request) {
	uid, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if r.Method == http.MethodPost {
		r.ParseForm()
		text := r.FormValue("entry")
		entry := Entry{
			ID:        uuid.NewString(),
			Text:      text,
			Timestamp: time.Now().Format("2006-01-02 15:04:05"),
			UserID:    uid,
		}
		entries = append([]Entry{entry}, entries...)
		saveJSON(dataFile, entries)
		http.Redirect(w, r, "/blog", http.StatusFound)
	}

	id := r.URL.Query().Get("id")
	if id != "" {
		for _, e := range entries {
			if e.ID == id {
				ur, ok := users[e.UserID]
				if !ok {
					ur = &User{ID: e.UserID, Email: "unknown"}
				}
				e.User = EntryUser{
					ID:    ur.ID,
					Email: ur.Email,
				}
				renderer := blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{})

				b := blackfriday.Run([]byte(e.Text), blackfriday.WithRenderer(renderer), blackfriday.WithExtensions(blackfriday.HardLineBreak))
				e.Text = string(b)
				w.Write([]byte(RenderBlog([]Entry{e})))
				return
			}
		}
		http.Error(w, "Entry not found", http.StatusNotFound)
		return
	}

	e := lo.Map(entries, func(e Entry, idx int) Entry {
		ur, ok := users[e.UserID]
		if !ok {
			ur = &User{ID: e.UserID, Email: "unknown"}
		}
		e.User = EntryUser{
			ID:    ur.ID,
			Email: ur.Email,
		}
		renderer := blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{})

		b := blackfriday.Run([]byte(e.Text), blackfriday.WithRenderer(renderer), blackfriday.WithExtensions(blackfriday.HardLineBreak))
		e.Text = string(b)
		return e
	})

	//i, err := runCode("./blogview.go")
	//if err != nil {
	//	http.Error(w, err.Error(), http.StatusInternalServerError)
	//	return
	//}
	//
	//v, err := i.Eval("main.RenderBlog")
	//if err != nil {
	//	println("Error evaluating code", err.Error())
	//	return
	//}
	//
	//ren := v.Interface().(func(any) string)
	w.Write([]byte(RenderBlog(e)))
}
