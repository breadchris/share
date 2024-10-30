package code

import (
	"context"
	"encoding/json"
	"fmt"
	. "github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/symbol"
	"github.com/cogentcore/yaegi/interp"
	"github.com/cogentcore/yaegi/stdlib"
	"go/ast"
	"go/parser"
	"go/token"
	"log/slog"
	"net/http"
	"path/filepath"
	"reflect"
	"runtime"
	"strings"
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
					Content: GenerateRenderDirectory(d.Leaps.Authenticator.GetPaths()),
				},
				{
					Title: "functions",
					Content: Ul(Class("menu bg-base-200 rounded-box w-56"),
						Li(
							Ul(
								Ch(Map(funcs, func(f string, i int) *Node {
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
							Script(Attr("src", "/dist/code/monaco.js"), Attr("type", "module")),
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
				return
			}

			fnc, ok := fr.Interface().(func(ctx context.Context) *Node)
			if ok {
				ctx := context.WithValue(r.Context(), "state", cr.Data)
				w.Write([]byte(fnc(ctx).Render()))
				return
			}
		}
	})
	return mux
}

func DynamicHTTPMux(f func(d Deps) *http.ServeMux, files ...string) func(Deps) *http.ServeMux {
	pc := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Entry()
	fnp := runtime.FuncForPC(pc)
	file, _ := fnp.FileLine(pc)
	function := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Name()

	// TODO breadchris fix packages
	parts := strings.Split(function, "/")
	if len(parts) > 1 {
		file = "./" + filepath.Base(filepath.Dir(file))
		//function = "main." + strings.Split(parts[len(parts)-1], ".")[1]
		function = parts[len(parts)-1]
	}

	i := interp.New(interp.Options{
		GoPath: "/dev/null",
	})

	i.Use(stdlib.Symbols)
	i.Use(symbol.Symbols)

	for _, fi := range files {
		_, err := i.CompilePath(fi)
		if err != nil {
			slog.Warn("failed to eval path", "error", err)
			return f
		}
	}

	_, err := i.EvalPath(file)
	if err != nil {
		slog.Warn("failed to eval path", "error", err)
		return f
	}

	fr, err := i.Eval(function)
	if err != nil {
		slog.Warn("failed to eval function", "error", err)
		return f
	}

	fn, ok := fr.Interface().(func(db Deps) *http.ServeMux)
	if ok {
		return fn
	}
	slog.Warn("failed to convert function to func() *http.ServeMux")
	return f
}

func DynamicHTMLNodeCtx(f func(ctx context.Context) *Node) func(ctx context.Context) *Node {
	pc := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Entry()
	fnp := runtime.FuncForPC(pc)
	file, _ := fnp.FileLine(pc)
	path := filepath.Base(file)
	function := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Name()

	i := interp.New(interp.Options{
		GoPath: "/dev/null",
	})

	i.Use(stdlib.Symbols)
	i.Use(symbol.Symbols)

	_, err := i.EvalPath(path)
	if err != nil {
		slog.Warn("failed to eval path", "error", err)
		return f
	}

	fr, err := i.Eval(function)
	if err != nil {
		slog.Warn("failed to eval function", "error", err)
		return f
	}

	fn, ok := fr.Interface().(func(ctx context.Context) *Node)
	if ok {
		return fn
	}
	slog.Warn("failed to convert function to func() *Node")
	return f
}

func DynamicHTTPHandler(f func() *http.ServeMux) func() *http.ServeMux {
	pc := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Entry()
	fnp := runtime.FuncForPC(pc)
	file, _ := fnp.FileLine(pc)
	path := filepath.Base(file)
	function := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Name()

	i := interp.New(interp.Options{
		GoPath: "/dev/null",
	})

	i.Use(stdlib.Symbols)
	i.Use(symbol.Symbols)

	_, err := i.EvalPath(path)
	if err != nil {
		slog.Warn("failed to eval path", "error", err)
		return f
	}

	fr, err := i.Eval(function)
	if err != nil {
		slog.Warn("failed to eval function", "error", err)
		return f
	}

	fn, ok := fr.Interface().(func() *http.ServeMux)
	if ok {
		return fn
	}
	slog.Warn("failed to convert function to func() *http.ServeMux")
	return f
}

func DynamicHTMLNode(f func() *Node) func() *Node {
	pc := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Entry()
	fnp := runtime.FuncForPC(pc)
	file, _ := fnp.FileLine(pc)
	path := filepath.Base(file)
	function := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Name()

	i := interp.New(interp.Options{
		GoPath: "/dev/null",
	})

	i.Use(stdlib.Symbols)
	i.Use(symbol.Symbols)

	_, err := i.EvalPath(path)
	if err != nil {
		slog.Warn("failed to eval path", "error", err)
		return f
	}

	fr, err := i.Eval(function)
	if err != nil {
		slog.Warn("failed to eval function", "error", err)
		return f
	}

	fn, ok := fr.Interface().(func() *Node)
	if ok {
		return fn
	}
	slog.Warn("failed to convert function to func() *Node")
	return f
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
