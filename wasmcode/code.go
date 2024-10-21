package wasmcode

import (
	"fmt"
	. "github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"go/ast"
	"go/parser"
	"go/token"
	"net/http"
	"os"
)

type CodeRequest struct {
	Code string `json:"code"`
	Func string `json:"func"`
	Data string `json:"data"`
}

// analyze code https://github.com/x1unix/go-playground/tree/9cc0c4d80f44fb3589fcb22df432563fa065feed/internal/analyzer
func New(d Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/sidebar", func(w http.ResponseWriter, r *http.Request) {
		code := `
package main

import (
    . "github.com/breadchris/share/html"
)

func Render() *Node {
    return DefaultLayout(
        Div(
            P(T("hello")),
            Button(Class("btn"), T("hello")),
        ),
    )
}
`
		Div(
			RenderTabs([]Tab{
				{
					Title: "examples",
					Content: Ul(
						Class("menu bg-base-200 rounded-box w-56"),
						Li(
							Pre(Id("example"), OnClick("sendEvent('example', {id: \"example\"})"), T(code)),
						),
					),
					Active: true,
				},
			}),
		).RenderPage(w, r)
	})
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if len(id) == 0 {
			id = uuid.NewString()
			http.Redirect(w, r, "/wasmcode/"+id, http.StatusFound)
		}

		file := r.URL.Query().Get("file")
		if file == "" {
			file = "data/test.go"
		}

		code, err := os.ReadFile(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		function := r.URL.Query().Get("function")

		switch r.Method {
		case http.MethodGet:
			w.Write([]byte(Html(
				Head(
					Title(T("Code")),
					DaisyUI,
					TailwindCSS,
					Style(T(`
        .yRemoteSelection {
            background-color: rgb(250, 129, 0, .5)
        }
        .yRemoteSelectionHead {
            position: absolute;
            border-left: orange solid 2px;
            border-top: orange solid 2px;
            border-bottom: orange solid 2px;
            height: 100%;
            box-sizing: border-box;
        }
        .yRemoteSelectionHead::after {
            position: absolute;
            content: ' ';
            border: 3px solid orange;
            border-radius: 4px;
            left: -4px;
            top: -5px;
        }
`)),
				),
				Body(
					Div(Class("wrapper"),
						Div(
							Script(T(`
function sendEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
}
`)),
							//Script(Src("/dist/leapclient.js")),
							//Script(Src("/dist/leap-bind-textarea.js")),
							Link(Rel("stylesheet"), Href("/dist/wasmcode/monaco.css")),
							Div(
								Class("w-full h-full"),
								Id("monaco-editor"),
								Attr("data-filename", file),
								Attr("data-id", id),
								Attr("data-function", function),
								Attr("data-code", string(code)),
								Attr("data-server-url", fmt.Sprintf("%s/wasmcode/ws", d.Config.ExternalURL)),
							),
							Script(Attr("src", "/dist/wasmcode/monaco.js"), Attr("type", "module")),
						),
					),
					HTMX,
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
