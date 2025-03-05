package xctf

import (
	"context"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"net/http"
	"path"
	"strings"
)

func generateJoinCode() string {
	return strings.ToUpper(uuid.NewString()[0:6])
}

type GroupCompState struct {
	Group models.Group
	User  models.User
}

func groupComponent(s GroupCompState) *Node {
	user := s.User
	group := s.Group
	if len(user.GroupMemberships) == 0 {
		return Div(
			Class("p-5 max-w-lg mx-auto"),
			Div(Class("text-lg"), Text("Join or Create a Group")),
			Div(
				Class("flex flex-col space-y-4"),
				Form(
					Class("border p-4 rounded"),
					Method("POST"),
					Action("/group/"),
					Div(Text("Create a New Group")),
					Input(Class("input"), Type("text"), Name("name"), Placeholder("Group Name")),
					Input(Type("hidden"), Name("action"), Value("create")),
					Button(Class("btn"), Type("submit"), Text("Create")),
				),
				Form(
					Class("border p-4 rounded"),
					Method("POST"),
					Action("/group/"),
					Div(Text("Join an Existing Group")),
					Input(Class("input"), Type("text"), Name("join_code"), Placeholder("Join Code")),
					Input(Type("hidden"), Name("action"), Value("join")),
					Button(Class("btn"), Type("submit"), Text("Join")),
				),
			),
		)
	}
	return Div(
		Class("p-5 max-w-lg mx-auto"),
		Div(Class("text-lg"), Text("Your Group")),
		Div(Text("Name: "+group.Name)),
		Div(Text("Join Code: "+group.JoinCode)),
		Div(Class("divider")),
		Div(Class("text-lg"), Text("Members")),
		Ul(Class("space-y-2"),
			Ch(func() []*Node {
				var members []*Node
				for _, gm := range group.Members {
					members = append(members, Div(
						Text(gm.User.Username),
					))
				}
				return members
			}()),
		),
	)
}

func renderGroup(d deps.Deps, w http.ResponseWriter, r *http.Request) {
	db := d.DB
	ctx := context.WithValue(r.Context(), "baseURL", path.Join(d.BaseURL, "group"))

	u, err := d.Session.GetUserID(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var user models.User
	if err := db.Preload("GroupMemberships").First(&user, "id = ?", u).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	switch r.Method {
	case http.MethodGet:
		var group models.Group
		if err := db.Preload("Members.User").First(&group, "id = ?", user.GroupMemberships[0].GroupID).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		DefaultLayout(
			Div(Class("text-sm text-center m-10"), T("Hello, "+user.Username)),
			Div(Class("divider")),
			groupComponent(GroupCompState{
				Group: group,
				User:  user,
			}),
		).RenderPageCtx(ctx, w, r)
		return
	case http.MethodPost:
		if err := r.ParseForm(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		action := r.FormValue("action")
		switch action {
		case "create":
			name := r.FormValue("name")
			if name == "" {
				http.Error(w, "Group name is required", http.StatusBadRequest)
				return
			}
			joinCode := generateJoinCode()
			group := models.Group{
				ID:       uuid.NewString(),
				Name:     name,
				JoinCode: joinCode,
			}
			if err := db.Create(&group).Error; err != nil {
				http.Error(w, "Error creating group: "+err.Error(), http.StatusInternalServerError)
				return
			}
			gm := models.GroupMembership{
				ID:      uuid.NewString(),
				UserID:  user.ID,
				GroupID: group.ID,
				Role:    "owner",
			}
			if err := db.Save(&gm).Error; err != nil {
				http.Error(w, "Error updating user: "+err.Error(), http.StatusInternalServerError)
				return
			}
			//DefaultLayout(
			//	Div(
			//		Class("p-5 max-w-lg mx-auto"),
			//		Div(Class("text-sm text-center m-10"), T("Group Created")),
			//		Div(Class("divider")),
			//		Div(Class("text-lg"), Text("Your Group")),
			//		Div(Text("Name: "+group.Name)),
			//		Div(Text("Join Code: "+group.JoinCode)),
			//	),
			//).RenderPageCtx(ctx, w, r)
			http.Redirect(w, r, d.BaseURL, http.StatusFound)
		case "join":
			joinCode := r.FormValue("join_code")
			if joinCode == "" {
				http.Error(w, "Join code is required", http.StatusBadRequest)
				return
			}
			var group models.Group
			if err := db.First(&group, "join_code = ?", joinCode).Error; err != nil {
				http.Error(w, "Group not found", http.StatusNotFound)
				return
			}

			gm := models.GroupMembership{
				ID:      uuid.NewString(),
				UserID:  user.ID,
				GroupID: group.ID,
				Role:    "member",
			}
			if err := db.Save(&gm).Error; err != nil {
				http.Error(w, "Error updating user: "+err.Error(), http.StatusInternalServerError)
				return
			}
			//DefaultLayout(
			//	Div(
			//		Class("p-5 max-w-lg mx-auto"),
			//		Div(Class("text-sm text-center m-10"), T("Joined Group")),
			//		Div(Class("divider")),
			//		Div(Class("text-lg"), Text("Your Group")),
			//		Div(Text("Name: "+group.Name)),
			//		Div(Text("Join Code: "+group.JoinCode)),
			//	),
			//).RenderPageCtx(ctx, w, r)
			http.Redirect(w, r, d.BaseURL, http.StatusFound)
			return
		default:
			http.Error(w, "Invalid action", http.StatusBadRequest)
		}
	}
	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func NewGroup(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		renderGroup(d, w, r)
	})
	return mux
}
