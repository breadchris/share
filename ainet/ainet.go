package ainet

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/breadchris/posts"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"net/http"
)

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	render := func(w http.ResponseWriter, r *http.Request, page *Node) {
		ctx := context.WithValue(r.Context(), "baseURL", "/ainet")
		page.RenderPageCtx(ctx, w, r)
	}

	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Redirect(w, r, fmt.Sprintf("/login?next=%s/ainet", d.BaseURL), http.StatusFound)
			return
		}

		var user models.User
		if err := d.DB.First(&user, "id = ?", u).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var (
			page    models.Page
			pageErr error
		)
		pageErr = d.DB.First(&page, "URL = ?", r.PathValue("id")).Error

		switch r.Method {
		case http.MethodGet:
			if pageErr == gorm.ErrRecordNotFound || r.URL.Query().Get("edit") == "true" {
				report := posts.Post{
					Blocknote: page.Article,
				}

				type Props struct {
					Post posts.Post `json:"post"`
				}
				props := Props{
					Post: report,
				}

				b, err := json.Marshal(props)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				render(w, r,
					Html(
						Attrs(map[string]string{"lang": "en"}),
						Head(
							Meta(Attrs(map[string]string{"charset": "UTF-8"})),
							Meta(Name("viewport"), Content("width=device-width, initial-scale=1.0")),
							Title(T("ainet")),
							Link(Rel("stylesheet"), Href("https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css")),
							Link(Rel("stylesheet"), Href("https://cdn.jsdelivr.net/npm/daisyui@1.14.0/dist/full.css")),
							Link(Attr("href", "/breadchris/static/editor.css"), Rel("stylesheet"), Type("text/css")),
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
									Form(
										Method("POST"),
										Action("/"+r.PathValue("id")),
										Class("flex flex-col space-y-4"),
										Input(Type("hidden"), Name("markdown"), Id("markdown")),
										Input(Type("hidden"), Name("blocknote"), Id("blocknote")),
										Input(Type("hidden"), Name("html"), Id("html")),
										Div(Id("editor"), Attrs(map[string]string{
											"props": string(b),
										})),
										//Div(Class("flex flex-row space-x-4"),
										//	Input(Type("text"), Class("input w-full"), Name("title"), Placeholder("Title")),
										//	Input(Type("text"), Class("input w-full"), Name("tags"), Placeholder("Tags")),
										//),
										Div(Class("flex justify-end"),
											Button(Type("submit"), Class("btn"), T("Submit")),
										),
									),
									Div(Class("mt-4"), Id("preview")),
									Div(Class("space-y-4")),
									Script(Attr("src", "/breadchris/static/editor.js"), Type("module")),
									Script(T("hljs.highlightAll();")),
								),
							),
						),
					),
				)
				return
			}
			render(w, r,
				Html(
					T("Welcome to Ainet"),
					A(Href("/"+page.URL+"?edit=true"), Class("text-blue-500"), T("edit")),
					Div(Class("markdown-body"), Raw(page.HTML)),
				),
			)
		case http.MethodPost:
			if page.ID == "" {
				page.ID = uuid.NewString()
			}
			if err := d.DB.Where("group_id = ? and url = ?", page.GroupID, page.URL).FirstOrCreate(&page).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			page.URL = r.PathValue("id")
			page.HTML = r.FormValue("html")
			page.Article = r.FormValue("blocknote")
			page.Title = r.FormValue("title")
			page.GroupID = r.FormValue("group_id")
			if err := d.DB.Save(&page).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			http.Redirect(w, r, fmt.Sprintf("/ainet/%s", page.URL), http.StatusFound)
		case http.MethodPut:
		case http.MethodDelete:
		}
	})
	return mux
}
