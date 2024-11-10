package main

import (
	"context"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	_ "modernc.org/sqlite"
	"net/http"
	"time"
	"xorm.io/xorm"
)

type User struct {
	ID               int                `xorm:"pk autoincr 'id'"`
	Username         string             `xorm:"unique 'username'"`
	DisplayName      string             `xorm:"'display_name'"`
	CreatedAt        time.Time          `xorm:"created"`
	Identities       []*Identity        `xorm:"-"`
	GroupMemberships []*GroupMembership `xorm:"-"`
}

type Identity struct {
	ID         int       `xorm:"pk autoincr 'id'"`
	UserID     int       `xorm:"index 'user_id'"`
	Provider   string    `xorm:"'provider'"`
	ProviderID string    `xorm:"unique 'provider_id'"`
	CreatedAt  time.Time `xorm:"created"`
	User       *User     `xorm:"-"`
}

type Group struct {
	ID          int       `xorm:"pk autoincr 'id'"`
	Name        string    `xorm:"unique 'name'"`
	Description string    `xorm:"'description'"`
	CreatedAt   time.Time `xorm:"created"`
}

type GroupMembership struct {
	ID       int       `xorm:"pk autoincr 'id'"`
	UserID   int       `xorm:"index 'user_id'"`
	GroupID  int       `xorm:"index 'group_id'"`
	Role     string    `xorm:"'role'"`
	JoinedAt time.Time `xorm:"created"`
	User     *User     `xorm:"-"`
	Group    *Group    `xorm:"-"`
}

func SyncModels(engine *xorm.Engine) error {
	err := engine.Sync2(new(User), new(Identity), new(Group), new(GroupMembership))
	if err != nil {
		return err
	}
	return nil
}

func load() {
	engine, err := xorm.NewEngine("sqlite", "data/db.sqlite")
	if err != nil {
		panic(err)
	}
	defer engine.Close()
}

func NewGroup(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		var group Group
		if id != "" {
			if err := d.Docs.WithCollection("groups").Get(id, group); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		ctx := context.WithValue(r.Context(), "baseURL", r.URL.Path)
		switch r.Method {
		case http.MethodGet:
			if id == "" {
				DefaultLayout(
					Div(
						Class("max-w-2xl mx-auto"),
						BuildFormCtx(BuildCtx{
							CurrentFieldPath: "",
							Name:             "group",
						}, group),
						Button(Type("submit"), Text("create")),
					),
				).RenderPageCtx(ctx, w, r)
				return
			}
			DefaultLayout(Div()).RenderPageCtx(ctx, w, r)
		case http.MethodPost:
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			for k, v := range r.Form {
				println(k, v)
			}
		}
	})
	return mux
}
