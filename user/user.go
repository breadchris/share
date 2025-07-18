package user

import (
	"context"
	"net/http"
	"strings"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
)

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	db := d.DB

	mux.HandleFunc("/member/{id...}", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodDelete:
			id := r.PathValue("id")
			if id == "" {
				http.Error(w, "Missing member ID", http.StatusBadRequest)
				return
			}

			var group models.GroupMembership
			if err := db.First(&group, "id = ?", id).Error; err != nil {
				http.Error(w, "Error finding member: "+err.Error(), http.StatusInternalServerError)
				return
			}

			if err := db.Delete(&models.GroupMembership{
				ID: id,
			}).Error; err != nil {
				http.Error(w, "Error deleting member: "+err.Error(), http.StatusInternalServerError)
				return
			}

			P(T("Member deleted")).RenderPage(w, r)
		}
	})

	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "baseURL", "/user")

		u, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var user models.User
		if err := db.First(&user, "id = ?", u).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if !func() bool {
			for _, a := range d.Config.Admins {
				if a == user.Username {
					return true
				}
			}
			return false
		}() {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		getGroupList := func() *Node {
			var groups []models.Group
			if err := db.Preload("Members").Find(&groups).Error; err != nil {
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
						P(Class("text-sm text-gray-500"), Text(g.JoinCode)),
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
				Class(""),
				Ch(groupList),
			)
		}

		id := r.PathValue("id")

		switch r.Method {
		case http.MethodGet:
			var group models.Group
			if id != "" {
				if err := db.Preload("Members.User").First(&group, "id = ?", id).Error; err != nil {
					// TODO breadchris
					w.Header().Set("HX-Target", "#error")
					w.Write([]byte(err.Error()))
					return
				}
			}

			DefaultLayout(
				Div(
					Class("p-5 max-w-lg mx-auto"),
					Div(Class("text-sm text-center m-10"), T("hello, "+user.Username)),
					Div(Class("divider")),
					Div(Class("text-lg"), Text("groups")),
					Div(Id("error"), Class("alert alert-error hidden")),
					getGroupList(),
					Div(Class("divider")),
					Form(
						Class("flex flex-col space-y-4"),
						Div(Text("join")),
						HxPut("/"+id),
						HxTarget("#group-list"),
						//BuildFormCtx(BuildCtx{
						//	CurrentFieldPath: "",
						//	Name:             "group",
						//}, group),
						Input(Class("input w-full"), Type("text"), Value(""), Name("code"), Placeholder("join code")),
						Button(Class("btn"), Type("submit"), Text("Join")),
					),
					Form(
						Class("flex flex-col space-y-4"),
						Div(Text("new group")),
						HxPost("/"+id),
						HxTarget("#group-list"),
						//BuildFormCtx(BuildCtx{
						//	CurrentFieldPath: "",
						//	Name:             "group",
						//}, group),
						Input(Class("input w-full"), Type("text"), Value(group.Name), Name("name"), Placeholder("Name")),
						Button(Class("btn"), Type("submit"), Text("Save")),
					),
					func() *Node {
						var groupList []*Node
						for _, us := range group.Members {
							g := us.User
							groupList = append(groupList, Li(
								Id("g_"+g.ID),
								Class("flex items-center justify-between gap-x-6 py-5"),
								Div(
									Class("min-w-0"),
									P(Text(g.Username)),
								),
								Div(
									Class("flex flex-none- items-center gap-x-4"),
									A(
										Class("btn"),
										HxDelete("/member/"+us.ID),
										//HxTarget("#member-list"),
										Text("delete"),
									),
								),
							))
						}
						return Ul(
							Id("member-list"),
							Class(""),
							Ch(groupList),
						)
					}(),
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
				ID:       id,
				Name:     r.FormValue("name"),
				JoinCode: strings.ToUpper(uuid.NewString()[0:6]),
				Members: []*models.GroupMembership{
					{
						UserID: u,
						Role:   "admin",
					},
				},
			}

			if err := db.Create(&group).Error; err != nil {
				http.Error(w, "Error creating group: "+err.Error(), http.StatusInternalServerError)
				return
			}
			getGroupList().RenderPageCtx(ctx, w, r)
		case http.MethodPut:
			if id == "" {
				http.Error(w, "Missing group ID", http.StatusBadRequest)
				return
			}

			var group models.Group
			if err := db.Where("join_code = ?", r.FormValue("code")).First(&group).Error; err != nil {
				http.Error(w, "Error joining group: "+err.Error(), http.StatusInternalServerError)
				return
			}

			if err := db.Create(&models.GroupMembership{
				ID:      uuid.NewString(),
				UserID:  u,
				GroupID: group.ID,
				Role:    "member",
			}).Error; err != nil {
				http.Error(w, "Error joining group: "+err.Error(), http.StatusInternalServerError)
				return
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
