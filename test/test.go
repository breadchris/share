package test

import (
	"github.com/breadchris/share/deps"
	"net/http"
)

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("test"))
	})
	return mux
}
