package code

import (
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/editor/leaps"
	"github.com/breadchris/share/graph"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/symbol"
	"github.com/samber/lo"
	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"go/ast"
	"go/parser"
	"go/token"
	"net/http"
	"sync"
)

type CodeRequest struct {
	Code string `json:"code"`
	Func string `json:"func"`
}

// analyze code https://github.com/x1unix/go-playground/tree/9cc0c4d80f44fb3589fcb22df432563fa065feed/internal/analyzer
func New(lm *leaps.Leaps) *http.ServeMux {
	mux := http.NewServeMux()
	var (
		l       sync.Mutex
		codeMux *http.ServeMux
	)
	codeMux = graph.New()
	mux.HandleFunc("/proxy/", func(w http.ResponseWriter, r *http.Request) {
		if codeMux == nil {
			http.Error(w, "codeMux is nil", http.StatusInternalServerError)
			return
		}
		l.Lock()
		http.StripPrefix("/proxy", codeMux).ServeHTTP(w, r)
		l.Unlock()
	})
	mux.HandleFunc("/sidebar", func(w http.ResponseWriter, r *http.Request) {
		file := r.URL.Query().Get("file")
		if file == "" {
			http.Error(w, "file is required", http.StatusBadRequest)
			return
		}
		_ = r.URL.Query().Get("function")

		funcs, err := GetFunctions(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write([]byte(
			RenderTabs([]Tab{
				{
					Title:   "files",
					Content: GenerateRenderDirectory(lm.Authenticator.GetPaths()),
				},
				{
					Title: "functions",
					Content: Ul(Class("menu bg-base-200 rounded-box w-56"),
						Li(
							Ul(
								Ch(lo.Map(funcs, func(f string, i int) *Node {
									return Li(A(Href(fmt.Sprintf("/code?file=%s&function=%s", file, f)), T(f)))
								})),
							),
						)),
					Active: true,
				},
			}).Render(),
		))
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		file := r.URL.Query().Get("file")
		if file == "" {
			file = "data/test.go"
		}

		function := r.URL.Query().Get("function")

		switch r.Method {
		case http.MethodGet:
			w.Write([]byte(Html(
				Head(
					Title(T("Code")),
					DaisyUI,
					TailwindCSS,
					HTMX,
				),
				Body(
					Div(Class("wrapper"),
						Div(
							Script(Src("/dist/leapclient.js")),
							Script(Src("/dist/leap-bind-textarea.js")),
							Link(Rel("stylesheet"), Href("/dist/code/monaco.css")),
							Div(Class("w-full h-full"), Id("monaco-editor"), Attr("data-filename", file), Attr("data-function", function)),
							Script(Attr("src", "/dist/code/monaco.js")),
						),
					),
				),
			).Render()))
		case http.MethodPost:
			var cr CodeRequest
			if err := json.NewDecoder(r.Body).Decode(&cr); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			i := interp.New(interp.Options{
				GoPath: "/dev/null",
			})

			i.Use(stdlib.Symbols)
			i.Use(symbol.Symbols)

			_, err := i.Eval(cr.Code)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			fr, err := i.Eval(cr.Func)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			fn, ok := fr.Interface().(func() *Node)
			if ok {
				f := fn()
				w.Write([]byte(f.Render()))
			} else {
				fs, ok := fr.Interface().(func() *http.ServeMux)
				if ok {
					l.Lock()
					codeMux = fs()
					l.Unlock()
				} else {
					http.Error(w, "invalid function", http.StatusInternalServerError)
				}
			}
		}
	})
	return mux
}

func GetFunctions(filePath string) ([]string, error) {
	fset := token.NewFileSet()

	node, err := parser.ParseFile(fset, filePath, nil, parser.ParseComments)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Go file: %w", err)
	}

	var functions []string

	ast.Inspect(node, func(n ast.Node) bool {
		if funcDecl, ok := n.(*ast.FuncDecl); ok {
			functions = append(functions, node.Name.Name+"."+funcDecl.Name.Name)
		}
		return true
	})
	return functions, nil
}
