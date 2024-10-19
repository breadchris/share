package wasmcode

import (
	"fmt"
	. "github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"go/ast"
	"go/parser"
	"go/token"
	"net/http"
)

type CodeRequest struct {
	Code string `json:"code"`
	Func string `json:"func"`
	Data string `json:"data"`
}

// analyze code https://github.com/x1unix/go-playground/tree/9cc0c4d80f44fb3589fcb22df432563fa065feed/internal/analyzer
func New(d Deps) *http.ServeMux {
	mux := http.NewServeMux()
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
							Link(Rel("stylesheet"), Href("/dist/wasmcode/monaco.css")),
							Div(Class("w-full h-full"), Id("monaco-editor"), Attr("data-filename", file), Attr("data-function", function)),
							Script(Attr("src", "/dist/wasmcode/monaco.js")),
						),
					),
				),
			).Render()))
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
