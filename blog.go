package main

import (
	"encoding/json"
	"github.com/google/uuid"
	"github.com/russross/blackfriday/v2"
	"github.com/samber/lo"
	"net/http"
	"os"
	"time"
)

var entries []Entry

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

func (s *Auth) reactHandler(w http.ResponseWriter, r *http.Request) {
	uid, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if r.Method == http.MethodPost {
		r.ParseForm()
		id := r.FormValue("id")

		entries = lo.Map(entries, func(e Entry, i int) Entry {
			if e.ID != id {
				return e
			}
			e.Reactions = append(e.Reactions, Reaction{
				UserID: uid,
				Emoji:  "👍",
			})
			return e
		})
		saveJSON(dataFile, entries)
	}
	http.Redirect(w, r, "/blog", http.StatusFound)
}

func (s *Auth) blogHandler(w http.ResponseWriter, r *http.Request) {
	uid, err := s.s.GetUserID(r.Context())
	if err != nil {
		http.Error(w, "Not logged in", http.StatusUnauthorized)
		return
	}

	if r.Method == http.MethodPost {
		r.ParseForm()
		text := r.FormValue("entry")
		entry := Entry{
			ID:        uuid.NewString(),
			Text:      text,
			Timestamp: time.Now().Format("2006-01-02 15:04:05"),
			UserID:    uid,
		}
		entries = append([]Entry{entry}, entries...)
		saveJSON(dataFile, entries)
		return
	}

	id := r.URL.Query().Get("id")
	if id != "" {
		for _, e := range entries {
			if e.ID == id {
				ur, ok := users[e.UserID]
				if !ok {
					ur = &User{ID: e.UserID, Email: "unknown"}
				}
				e.User = EntryUser{
					ID:    ur.ID,
					Email: ur.Email,
				}
				renderer := blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{})

				b := blackfriday.Run([]byte(e.Text), blackfriday.WithRenderer(renderer), blackfriday.WithExtensions(blackfriday.HardLineBreak))
				e.Text = string(b)
				w.Write([]byte(RenderBlog([]Entry{e})))
				return
			}
		}
		http.Error(w, "Entry not found", http.StatusNotFound)
		return
	}

	e := lo.Map(entries, func(e Entry, idx int) Entry {
		ur, ok := users[e.UserID]
		if !ok {
			ur = &User{ID: e.UserID, Email: "unknown"}
		}
		e.User = EntryUser{
			ID:    ur.ID,
			Email: ur.Email,
		}
		renderer := blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{})

		b := blackfriday.Run([]byte(e.Text), blackfriday.WithRenderer(renderer), blackfriday.WithExtensions(blackfriday.HardLineBreak))
		e.Text = string(b)
		return e
	})

	//i, err := runCode("./blogview.go")
	//if err != nil {
	//	http.Error(w, err.Error(), http.StatusInternalServerError)
	//	return
	//}
	//
	//v, err := i.Eval("main.RenderBlog")
	//if err != nil {
	//	println("Error evaluating code", err.Error())
	//	return
	//}
	//
	//ren := v.Interface().(func(any) string)
	w.Write([]byte(RenderBlog(e)))
}
