package wasmcode

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	. "github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"go/format"
	"go/printer"
	"go/token"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

type CodeRequest struct {
	Code string `json:"code"`
	Func string `json:"func"`
	Data string `json:"data"`
}

type CodeState struct {
	ID    string `json:"id"`
	HTML  string `json:"html"`
	Title string `json:"title"`
}

// analyze code https://github.com/x1unix/go-playground/tree/9cc0c4d80f44fb3589fcb22df432563fa065feed/internal/analyzer
func New(d Deps) *http.ServeMux {
	mux := http.NewServeMux()
	ctx := context.WithValue(context.Background(), "baseURL", "/code")
	playDocs := d.Docs.WithCollection("playground")

	mux.HandleFunc("/builder", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				Class("w-full max-w-2xl mx-auto"),
				Div(
					Class("flex flex-row bg-base-200 p-4"),
					Div(
						Class("bg-base-100 p-4 w-1/2"),
						Id("type-list"),
						Div(Class("p-2"), Input(Placeholder("string"))),
						Div(Class("p-2"), Input(Placeholder("number"))),
						Div(Class("p-2"), Input(Placeholder("group"))),
					),
					Div(Class("bg-base-100 p-4 w-1/2"), Id("struct-list")),
				),
				Script(Attr("src", "/static/recipe.js")),
			),
		).RenderPageCtx(ctx, w, r)
	})

	mux.HandleFunc("/playground/edit/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			id = uuid.NewString()
			http.Redirect(w, r, "/code/playground/edit/"+id, http.StatusFound)
			return
		}
		var s CodeState
		if err := playDocs.Get(id, &s); err != nil {
			println(err.Error())
		}
		switch r.Method {
		case http.MethodPost:
			r.ParseForm()
			h := r.FormValue("html")
			title := r.FormValue("title")
			s := CodeState{
				ID:    id,
				HTML:  h,
				Title: title,
			}
			if err := playDocs.Set(id, s); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		case http.MethodGet:
			DefaultLayout(
				Div(
					Style(T(playgroundCSS)),
					Script(Attr("src", "/static/playground.js")),
					Script(Attr("src", "/static/leader-line.min.js")),
					Div(
						Id("toolbar"),
						Class("flex space-x-4 p-4"),
						Input(Type("text"), Id("title"), Class("input w-32"), Value(s.Title), Placeholder("Title")),
						Button(
							Class("btn"),
							HxPost("/playground/edit/"+id),
							HxSwap("none"),
							HxVals("js:{html: getHTML(), title: document.getElementById('title').value}"),
							Text("Save"),
						),
						Button(Class("btn"), Id("add-text"), Text("Text")),
						Button(Class("btn"), Id("add-container"), Text("Container")),
						Button(Class("btn"), Id("add-image"), Text("Image")),
						//Button(Class("btn"), Id("add-chat"), Text("Add Chat")),
						A(Class("btn"), Href("/playground/"+id), Text("View")),
					),
					Div(
						Id("canvas"),
						Class("dropzone h-screen w-full"),
						Raw(s.HTML),
					),
				),
			).RenderPageCtx(ctx, w, r)
		}
	})
	mux.HandleFunc("/playground/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			d, err := playDocs.List()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			var items []*Node
			for _, u := range d {
				var s CodeState
				if err := json.Unmarshal(u.Data, &s); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				items = append(items, Li(
					Class("p-4"),
					A(Href("/playground/edit/"+u.ID), Text(u.ID)),
				))
			}

			DefaultLayout(
				Div(
					Class("w-full max-w-2xl mx-auto"),
					A(Class("btn"), Href("/playground/edit/"), Text("Create")),
					Ul(Class("space-y-4"), Ch(items)),
				),
			).RenderPageCtx(ctx, w, r)
			return
		}
		var s CodeState
		if err := playDocs.Get(id, &s); err != nil {
			println(err.Error())
		}
		switch r.Method {
		case http.MethodGet:
			DefaultLayout(
				Div(
					Raw(s.HTML),
				),
			).RenderPageCtx(ctx, w, r)
		}
	})
	mux.HandleFunc("/html", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			r.ParseForm()
			code := r.FormValue("code")
			name := r.FormValue("name")

			n, err := ParseHTMLString(code)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to parse element: %v", err), http.StatusInternalServerError)
				return
			}

			var buf bytes.Buffer

			fset := token.NewFileSet()

			// TODO breadchris https://github.com/segmentio/golines
			cfg := &printer.Config{
				Mode:     printer.TabIndent,
				Tabwidth: 4,
			}

			gf := RenderGoFunction(fset, "Render"+strings.Title(name), n.RenderGoCode(fset))
			err = cfg.Fprint(&buf, fset, gf)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to format code: %v", err), http.StatusInternalServerError)
				return
			}

			formattedCode, err := format.Source(buf.Bytes())
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to format code: %v", err), http.StatusInternalServerError)
				w.Write(buf.Bytes())
				return
			}

			f, err := os.OpenFile("scratch.go", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to open scratch.go: %v", err), http.StatusInternalServerError)
				return
			}

			if _, err = f.Write([]byte("\n" + string(formattedCode))); err != nil {
				http.Error(w, fmt.Sprintf("Failed to write to scratch.go: %v", err), http.StatusInternalServerError)
				return
			}

			if _, err := exec.LookPath("golines"); err != nil {
				println("golines is not installed: go install github.com/segmentio/golines@latest")
				http.Error(w, fmt.Sprintf("golines is not installed: %v", err), http.StatusInternalServerError)
				return
			}

			cmd := exec.Command("golines", "-w", "scratch.go")
			if err := cmd.Run(); err != nil {
				http.Error(w, fmt.Sprintf("Failed to run golines: %v", err), http.StatusInternalServerError)
				return
			}

			w.Write(formattedCode)
		case http.MethodGet:
			DefaultLayout(
				Div(
					Class("p-5 max-w-4xl mx-auto"),
					Form(
						HxPost("/html"), HxTarget("#out"), Class("space-y-4"),
						Input(Name("name"), Class("input w-full"), Placeholder("name")),
						TextArea(Name("code"), Class("textarea w-full h-96"), Placeholder("code")),
						Button(Type("submit"), Class("btn"), T("Submit")),
					),
					Div(Id("out")),
				),
			).RenderPageCtx(ctx, w, r)
		}
	})
	mux.HandleFunc("/completion", func(w http.ResponseWriter, r *http.Request) {
		type CompletionResponse struct {
			Completion string `json:"completion"`
		}

		c := CompletionResponse{
			Completion: "hello",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(c)
	})
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
			http.Redirect(w, r, "/code/"+id, http.StatusFound)
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
			props := map[string]string{
				"fileName":  file,
				"id":        id,
				"function":  function,
				"code":      string(code),
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
					//					Style(T(`
					//        .yRemoteSelection {
					//            background-color: rgb(250, 129, 0, .5)
					//        }
					//        .yRemoteSelectionHead {
					//            position: absolute;
					//            border-left: orange solid 2px;
					//            border-top: orange solid 2px;
					//            border-bottom: orange solid 2px;
					//            height: 100%;
					//            box-sizing: border-box;
					//        }
					//        .yRemoteSelectionHead::after {
					//            position: absolute;
					//            content: ' ';
					//            border: 3px solid orange;
					//            border-radius: 4px;
					//            left: -4px;
					//            top: -5px;
					//        }
					//`)),
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
							Script(Src("/static/leapclient.js")),
							Script(Src("/static/leap-bind-textarea.js")),
							Link(Rel("stylesheet"), Href("/static/wasmcode/monaco.css")),
							Div(
								Class("w-full h-full"),
								Id("monaco-editor"),
								Attr("data-props", string(mp)),
							),
							Script(Attr("src", "/static/wasmcode/monaco.js"), Attr("type", "module")),
						),
					),
					HTMX,
				),
			).Render()))
		}
	})
	return mux
}

const playgroundCSS = `

.rotation-handle {
  padding: 3px 4px;
  display: table;
  position: absolute;
  left: 50%;
  right: 50%;
  bottom: -35px;
  background-color: #ff1661;
  border-radius: 10rem;
  line-height: 1;
  text-align: center;
  font-weight: bold;
  color: #fff;
  cursor: move;
}
`

/*

#toolbar {
  background: #f4f4f4;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

#canvas {
  width: 100%;
  height: 90vh;
  position: relative;
  background-color: white;
  border: 2px dashed #ddd;
}

.drag-drop {
  position: absolute;
  padding: 10px;
  background: lightblue;
  border: solid 2px #aaa;
  border-radius: 4px;
  cursor: move;
}

.dropzone {
  background-color: #bfe4ff;
  border: dashed 4px transparent;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.dropzone.drop-active {
  border-color: #aaa;
}

.dropzone.drop-target {
  background-color: #29e;
  border-color: #fff;
}

.drag-drop.highlight {
    outline: 2px dashed #00f;
}
*/
