package paint

import (
	"github.com/breadchris/share/deps"
	"net/http"
)

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// return index.html
		http.ServeFile(w, r, "paint/index.html")
	})
	return mux
}
