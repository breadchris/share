package test

import (
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/yaegi"
	"net/http"
)

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	Something()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		s, err := yaegi.GetStack()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for _, frame := range s {
			fmt.Printf("File: %s, Line: %d, Column: %d, Package: %s, Parent Function: %s, Function: %s\n", frame.FileName, frame.Line, frame.Column, frame.PackageName, frame.ParentFunction, frame.FunctionName)
		}
		Div(T("hello"), Class("btn")).RenderPage(w, r)
	})
	return mux
}
