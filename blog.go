package main

import (
	"encoding/json"
	"html/template"
	"net/http"
	"os"
	"time"
)

type Entry struct {
	Text      string
	Timestamp string
}

var entries []Entry
var tmpl = template.Must(template.ParseFiles("blog.html"))

const dataFile = "data/entries.json"

func loadJSON(f string, v any) {
	file, err := os.Open(f)
	if err != nil {
		if os.IsNotExist(err) {
			return
		}
		panic(err)
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	err = decoder.Decode(v)
	if err != nil {
		panic(err)
	}
}

func saveJSON(f string, v any) {
	file, err := os.Create(f)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(v)
	if err != nil {
		panic(err)
	}
}

func blogHandler(w http.ResponseWriter, r *http.Request) {
	tmpl.Execute(w, entries)
}

func submitHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		r.ParseForm()
		text := r.FormValue("entry")
		entry := Entry{
			Text:      text,
			Timestamp: time.Now().Format("2006-01-02 15:04:05"),
		}
		entries = append([]Entry{entry}, entries...)
		saveJSON(dataFile, entries)
	}
	http.Redirect(w, r, "/blog", http.StatusSeeOther)
}
