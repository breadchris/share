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
				P(Class("mb-2"), Raw(e.Text)),
				P(Class("text-sm text-gray-500"), T(e.Timestamp)),
				P(Class("text-sm text-gray-500"), T(e.User.Email)),
				Form(
					Action("/blog/react"),
					Method("POST"),
					Input(Type("hidden"), Name("id"), Attr("value", e.ID)),
					Button(Type("submit"), Class("text-blue-500"), T("👍")),
					Ch(reacts),
				),
				A(Href("/blog/"+e.ID), Class("text-blue-500"), T("link")),
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
			Link(Href("/breadchris/static/editor.css"), Rel("stylesheet"), Type("text/css")),
			Script(Src("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js")),
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
						Method("POST"),
						Action("/blog"),
						Class("flex flex-col space-y-4"),
						Input(Type("hidden"), Name("markdown"), Id("markdown")),
						Input(Type("hidden"), Name("blocknote"), Id("blocknote")),
						Input(Type("hidden"), Name("html"), Id("html")),
						Div(Id("editor")),
						//Div(Class("flex flex-row space-x-4"),
						//	Input(Type("text"), Class("input w-full"), Name("title"), Placeholder("Title")),
						//	Input(Type("text"), Class("input w-full"), Name("tags"), Placeholder("Tags")),
						//),
						Div(Class("flex justify-end"),
							Button(Type("submit"), Class("btn"), T("Submit")),
						),
					),
					Div(Class("mt-4"), Id("preview")),
					Div(Class("space-y-4"),
						Ch(en),
					),
					Script(Src("/breadchris/static/editor.js"), Type("module")),
					Script(T("hljs.highlightAll();")),
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
}

func (s *Auth) blogHandler(w http.ResponseWriter, r *http.Request) {
	uid, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if r.Method == http.MethodPost {
		r.ParseForm()
		text := r.FormValue("markdown")
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

	id := r.PathValue("id")
	if id != "" {
		for _, e := range entries {
			if e.ID == id {
				//ur, ok := users[e.UserID]
				//if !ok {
				//	ur = &User{ID: e.UserID, Email: "unknown"}
				//}
				//e.User = EntryUser{
				//	ID:    ur.ID,
				//	Email: ur.Email,
				//}
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
		//ur, ok := users[e.UserID]
		//if !ok {
		//	ur = &User{ID: e.UserID, Email: "unknown"}
		//}
		//e.User = EntryUser{
		//	ID:    ur.ID,
		//	Email: ur.Email,
		//}
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
