package wasmcode

import (
	"encoding/json"
	"fmt"
	. "github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
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
