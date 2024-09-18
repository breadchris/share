package main

import (
	. "github.com/breadchris/share/html2"
	"net/http"
)

// analyze code https://github.com/x1unix/go-playground/tree/9cc0c4d80f44fb3589fcb22df432563fa065feed/internal/analyzer
func (s *Auth) handleCode(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		f := Html(
			Form(
				Attr("action", "/code"),
				Attr("method", "POST"),
				Class("mb-4"),
				Attr("onsubmit", "document.querySelector('#entry').value = editor.getValue()"),
				Input(Type("hidden"), Id("entry"), Name("entry")),
				RenderCode(Code{
					C: "hello world!",
				}),
				TextArea(
					Class("textarea w-full"),
					Id("entry"),
					Placeholder("you know what to do..."),
					Name("entry"),
				),
				Button(
					Type("submit"),
					Class("btn btn-primary"),
					T("Submit"),
				),
			),
		)

		w.Write([]byte(f.Render()))
	case http.MethodPost:
		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Error parsing form data", http.StatusBadRequest)
			return
		}

		w.Write([]byte("Code submitted: " + r.FormValue("description")))
	}
}
