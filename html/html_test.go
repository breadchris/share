package html

import (
	"github.com/google/uuid"
	"github.com/samber/lo"
	"net/http"
	"testing"
)

func TestHTML(t *testing.T) {
	type Item struct {
		ID    int64 `db:"id"`
		Value string
	}

	db, err := NewDB[Item]("test/")
	if err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		getList := func() *Node {
			return Ol(
				Id("list"),
				Ch(lo.Map(db.List(), func(v Item, i int) *Node {
					return Li(T(v.Value))
				})),
			)
		}

		if r.Method == http.MethodPost {
			v := r.FormValue("value")
			db.Set(uuid.NewString(), Item{Value: v})
			getList().RenderPage(w, r)
			return
		}

		if r.Method == http.MethodGet {
			Html(
				Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
				Form(
					Method("POST"),
					HxPost("/"),
					HxTrigger("submit"),
					HxTarget("#list"),
					Input(Name("value")),
					Button(Type("submit"), T("Submit")),
				),
				getList(),
			).RenderPage(w, r)
		}
	})

	http.ListenAndServe(":8420", mux)
}
