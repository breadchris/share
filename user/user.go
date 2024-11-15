package user

import (
	"context"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"net/http"
)

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	db := d.DB

	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "baseURL", "/user")

		getGroupList := func() *Node {
			var groups []models.Group
			if err := db.Find(&groups).Error; err != nil {
				return Div(Text(err.Error()))
			}
			var groupList []*Node
			for _, g := range groups {
				groupList = append(groupList, Li(
					Id("g_"+g.ID),
					Class("flex items-center justify-between gap-x-6 py-5"),
					Div(
						Class("min-w-0"),
						A(Href("/"+g.ID), Text(g.Name)),
					),
					Div(
						Class("flex flex-none- items-center gap-x-4"),
						A(
							Class("btn"),
							HxDelete("/"+g.ID),
							HxTarget("#group-list"),
							Text("delete"),
						),
					),
				))
			}
			return Ul(
				Id("group-list"),
				Class("divide-y divide-gray-200"),
				Ch(groupList),
			)
		}

		id := r.PathValue("id")

		switch r.Method {
		case http.MethodGet:
			var group models.Group
			if id != "" {
				if err := db.First(&group, "id = ?", id).Error; err != nil {
					// TODO breadchris
					w.Header().Set("HX-Target", "#error")
					w.Write([]byte(err.Error()))
					return
				}
			}

			DefaultLayout(
				Div(
					Class("p-5 max-w-lg mx-auto"),
					H1(Text("Groups")),
					Div(Id("error"), Class("alert alert-error hidden")),
					getGroupList(),
					Form(
						HxPost("/"+id),
						HxTarget("#group-list"),
						//BuildFormCtx(BuildCtx{
						//	CurrentFieldPath: "",
						//	Name:             "group",
						//}, group),
						Input(Class("input"), Type("text"), Value(group.Name), Name("name"), Placeholder("Name")),
						Button(Class("btn"), Type("submit"), Text("Save")),
					),
				),
			).RenderPageCtx(ctx, w, r)
		case http.MethodPost:
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if id == "" {
				id = uuid.NewString()
			}
			group := models.Group{
				ID:   id,
				Name: r.FormValue("name"),
			}

			if group.ID == "" {
				if err := db.Create(&group).Error; err != nil {
					http.Error(w, "Error creating group: "+err.Error(), http.StatusInternalServerError)
					return
				}
			} else {
				if err := db.Save(&group).Error; err != nil {
					http.Error(w, "Error updating group: "+err.Error(), http.StatusInternalServerError)
					return
				}
			}
			getGroupList().RenderPageCtx(ctx, w, r)
		case http.MethodDelete:
			if id == "" {
				http.Error(w, "Missing group ID", http.StatusBadRequest)
				return
			}

			if err := db.Delete(&models.Group{
				ID: id,
			}).Error; err != nil {
				http.Error(w, "Error deleting group: "+err.Error(), http.StatusInternalServerError)
				return
			}
			getGroupList().RenderPageCtx(ctx, w, r)
		}
	})
	return mux
}
