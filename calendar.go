package main

import "net/http"

func NewCalendar() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("calendar"))
	})
	return mux
}
