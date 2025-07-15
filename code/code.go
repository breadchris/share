package code

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	. "github.com/breadchris/share/deps"
	"github.com/breadchris/share/graveyard/yaegi"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/symbol"
	"github.com/breadchris/yaegi/interp"
	"github.com/breadchris/yaegi/stdlib"
	"github.com/sashabaranov/go-openai"
	"go/ast"
	"go/parser"
	"go/token"
	"io/ioutil"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
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

		//funcs, err := GetFunctions(file)
		//if err != nil {
		//	http.Error(w, err.Error(), http.StatusInternalServerError)
		//	return
		//}
		w.Write([]byte(
			RenderTabs(
				Tab{
					Title:   "files",
					Content: GenerateRenderDirectory(d.Leaps.Authenticator.GetPaths()),
				},
				Tab{
					Title: "functions",
					//Content: Ul(Class("menu bg-base-200 rounded-box w-56"),
					//	Li(
					//		Ul(
					//			Ch(Map(funcs, func(f string, i int) *Node {
					//				return Li(A(Href(fmt.Sprintf("/code?file=%s&function=%s", file, f)), T(f)))
					//			})),
					//		),
					//	)),
					Active: true,
				},
			).Render(),
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
			props := map[string]string{
				"fileName":  file,
				"function":  function,
				"code":      "",
				"serverURL": fmt.Sprintf("%s/code/ws", d.Config.ExternalURL),
			}
			mp, err := json.Marshal(props)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
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
							Script(Src("/static/leapclient.js")),
							Script(Src("/static/leap-bind-textarea.js")),
							Link(Rel("stylesheet"), Href("/static/code/monaco.css")),
							Div(Class("w-full h-full"), Id("monaco-editor"), Attr("data-props", string(mp))),
							Script(Attr("src", "/static/code/monaco.js"), Attr("type", "module")),
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
		function = strings.Split(parts[len(parts)-1], ".")[1]
		//function = parts[len(parts)-1]
	}

	wd, err := os.Getwd()
	if err != nil {
		slog.Warn("failed to get working directory", "error", err)
		return f
	}

	i := interp.New(interp.Options{
		GoPath: wd,
	})

	i.Use(stdlib.Symbols)
	i.Use(symbol.Symbols)
	customSymbols := map[string]map[string]reflect.Value{}
	customSymbols["github.com/breadchris/share/yaegi/yaegi"] = map[string]reflect.Value{
		"GetStack": reflect.ValueOf(yaegi.Debug{
			Interp: i,
		}.DoGetStack),
	}
	i.Use(customSymbols)

	for _, fi := range files {
		_, err := i.CompilePath(fi)
		if err != nil {
			slog.Warn("failed to eval path", "error", err)
			return f
		}
	}

	_, err = i.EvalPath(file)
	if err != nil {
		slog.Warn("failed to eval path", "error", err)
		return f
	}

	// TODO breadchris not ideal, should figure out how to
	// do this properly
	var fr reflect.Value
	if strings.HasPrefix(file, "/") {
		fr, err = i.Eval(function)
		if err != nil {
			slog.Warn("failed to eval function", "error", err)
			return f
		}
	} else {
		sym := i.Symbols(file)
		//for k, v := range sym {
		//	println(k, v)
		//}
		s, ok := sym[file]
		if !ok {
			slog.Warn("failed to get symbols", "file", file)
			return f
		}

		fr, ok = s[function]
		if !ok {
			slog.Warn("failed to eval function", "error", err, "file", file, "function", function)
			return f
		}
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

func ParseImports(filename string) ([]string, error) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, filename, nil, parser.ImportsOnly)
	if err != nil {
		return nil, err
	}

	var imports []string
	for _, imp := range file.Imports {
		path := imp.Path.Value[1 : len(imp.Path.Value)-1] // Trim quotes
		imports = append(imports, path)
	}
	return imports, nil
}

func ExtractGeneratePackages(filename string) ([]string, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var packages []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "//go:generate yaegi extract ") {
			pkg := strings.TrimPrefix(line, "//go:generate yaegi extract ")
			packages = append(packages, pkg)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return packages, nil
}

// Difference - finds elements in slice2 that are not in slice1
func Difference(slice1, slice2 []string) []string {
	diff := []string{}
	set := make(map[string]struct{}, len(slice1))
	for _, s := range slice1 {
		set[s] = struct{}{}
	}
	for _, s := range slice2 {
		if _, found := set[s]; !found {
			diff = append(diff, s)
		}
	}
	return diff
}

func WriteImports(filename string, imports []string) error {
	fileData, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	var buffer bytes.Buffer
	buffer.Write(fileData)

	buffer.WriteString("\n// Added imports\n")
	for _, imp := range imports {
		buffer.WriteString(fmt.Sprintf("import _ \"%s\"\n", imp))
	}

	return ioutil.WriteFile(filename, buffer.Bytes(), 0644)
}

func RewriteFiles(ctx context.Context, srcDir, destDir, pattern string, aiClient *openai.Client) error {
	re, err := regexp.Compile(pattern)
	if err != nil {
		return fmt.Errorf("failed to compile regex: %w", err)
	}

	err = filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		if !re.MatchString(info.Name()) {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read file %s: %w", path, err)
		}

		prompt := fmt.Sprintf("Please rewrite the following js file to Go:\n%s", string(content))

		resp, err := aiClient.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
			Model: openai.GPT4o20240513,
			Messages: []openai.ChatCompletionMessage{
				{
					Role: openai.ChatMessageRoleSystem,
					Content: `
You are a go developer who rewrites code. When asked to rewrite code, you will only rewrite code and not respond with
any other content. When writing the output code, do not include markdown or any other formatting, only the raw text of the code.
When rewriting code, you should aim to produce code that is idiomatic and follows best practices.
You should aim to produce code that is as close to the original code as possible, while still being idiomatic Go code.
Do not include a main function in the output code if the original code does not include a main function.
`,
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
		})
		if err != nil {
			fmt.Printf("Error rewriting file %s: %v\n", path, err)
			return nil
		}

		msg := resp.Choices[0].Message

		relPath, err := filepath.Rel(srcDir, path)
		if err != nil {
			return fmt.Errorf("failed to compute relative path for %s: %w", path, err)
		}

		ext := filepath.Ext(relPath)
		baseName := strings.TrimSuffix(relPath, ext)
		newRelPath := baseName + ".go"

		destPath := filepath.Join(destDir, newRelPath)

		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			return fmt.Errorf("failed to create directory for %s: %w", destPath, err)
		}

		if err := os.WriteFile(destPath, []byte(msg.Content), 0644); err != nil {
			fmt.Printf("Error writing file %s: %v\n", destPath, err)
		} else {
			fmt.Printf("Successfully wrote rewritten file to %s\n", destPath)
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("error walking the directory %s: %w", srcDir, err)
	}
	return nil
}
