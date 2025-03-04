package sqlnotebook

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	"net/http"
	"time"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
)

// New creates the SQL notebook routes.
func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	// assuming d.DB is a *sql.DB

	root := "/sqlnotebook"

	rh := func(w http.ResponseWriter, n *Node) {
		Render(root, w, n)
	}

	//muxHandle := func(path string, nd *Node) {
	//	mux.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
	//		rh(w, r, func(render func(n *Node)) {
	//			render(nd)
	//		})
	//	})
	//}

	//muxHandle("/",
	//	Div(
	//		Class("p-5"),
	//		Div(Class("mb-4 text-xl font-bold"), Text("SQL Notebook")),
	//		Form(
	//			Id("sql-form"),
	//			// When the form is submitted (by enter or ctrl+enter), send the query to /sql/exec
	//			HxPost("/sql/exec"),
	//			HxTarget("#result-table"),
	//			// The textarea can be enhanced for SQL syntax highlighting on the client.
	//			TextArea(Class("input sql-editor"), Name("query"), Placeholder("Write your SQL here...")),
	//			Div(
	//				Class("mt-2"),
	//				Button(Class("btn"), Type("submit"), Text("Run SQL")),
	//			),
	//		),
	//		Div(
	//			Id("result-table"),
	//			Class("mt-4"),
	//		),
	//	),
	//)

	gid := func() string {
		return "g" + uuid.NewString()
	}

	newForm := func() *Node {
		editorId := gid()
		formId := gid()
		resultId := gid()
		return Div(
			RenderTabs(
				Tab{
					Title: "sql",
					Content: Form(
						Id(formId),
						HxPost("/exec"),
						HxTarget("#"+resultId),
						TextArea(Class("input sql-editor"), Id(editorId), Name("query"), Placeholder("Write your SQL here...")),
						Div(
							Class("mt-2"),
							Button(Class("btn"), Type("submit"), Text("Run SQL")),
						),
					),
					Active: true,
				},
				Tab{
					Title:   "ai",
					Content: Div(P(Text("ai"))),
				}),
			Div(
				Id(resultId),
				Class("mt-4"),
			),
			Script(Raw(fmt.Sprintf(`
                 var form = document.getElementById("%s");
				 var editor = document.getElementById("%s");
				 var codemirror = undefined;
				 codemirror = CodeMirror.fromTextArea(editor, {
					  mode: "text/x-sql",
					  lineNumbers: true,
					  theme: "default"
				 });
			   form.addEventListener("submit", function(event) {
				 codemirror.save(); console.log(codemirror.getValue());
			   });
		  `, formId, editorId))),
		)
	}

	// GET /sql - Render the SQL notebook page.
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		form := newForm()
		rh(w,
			DefaultLayout(
				Div(
					Link(Rel("stylesheet"), Href("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css")),
					Script(Src("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.js")),
					Script(Src("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/mode/sql/sql.min.js")),

					Class("container mx-auto p-5"),
					Div(Class("mb-4 text-xl font-bold"), Text("SQL Notebook")),
					form,
				),
			),
		)
	})

	// POST /sql/exec - Execute the SQL query and return a table of results.
	mux.HandleFunc("/exec", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if err := r.ParseForm(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		query := r.FormValue("query")
		if query == "" {
			rh(w, Div(Class("alert alert-error"), Text("No SQL query provided.")))
			return
		}

		db, _ := d.DB.DB()

		//db, err := sql.Open("sqlite3", ":memory:")
		//if err != nil {
		//	log.Fatalf("Failed to open database: %v", err)
		//}
		//defer db.Close()

		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()

		rows, err := db.QueryContext(ctx, query)
		if err != nil {
			rh(w, Div(Class("alert alert-error"), Text("Error executing query: "+err.Error())))
			return
		}
		defer rows.Close()

		cols, err := rows.Columns()
		if err != nil {
			Div(Class("alert alert-error"), Text("Error reading columns: "+err.Error())).
				RenderPageCtx(r.Context(), w, r)
			return
		}

		var headerNodes []*Node
		for _, col := range cols {
			headerNodes = append(headerNodes, Th(Text(col)))
		}

		var bodyRows []*Node
		for rows.Next() {
			values := make([]interface{}, len(cols))
			valuePtrs := make([]interface{}, len(cols))
			for i := range values {
				valuePtrs[i] = &values[i]
			}

			if err := rows.Scan(valuePtrs...); err != nil {
				continue
			}

			var cellNodes []*Node
			for _, val := range values {
				var cellText string
				if val == nil {
					cellText = "NULL"
				} else {
					cellText = fmt.Sprint(val)
				}
				cellNodes = append(cellNodes, Td(Text(cellText)))
			}
			bodyRows = append(bodyRows, Tr(Ch(cellNodes)))
		}

		table := Table(
			Class("table"),
			Thead(Tr(Ch(headerNodes))),
			Tbody(Ch(bodyRows)),
		)
		rh(w, Div(
			table,
			newForm(),
		))
	})

	return mux
}
