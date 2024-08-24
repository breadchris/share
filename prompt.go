package main

import (
	"encoding/json"
	"net/http"
)

func runCodeFunc(path, name string, state []byte) (string, error) {
	i, err := runCode(path)
	if err != nil {
		return "", err
	}

	v, err := i.Eval(name)
	if err != nil {
		return "", err
	}

	r := v.Interface().(func([]byte) (string, error))
	return r(state)
}

func setupPrompt() {
	http.Handle("/prompts", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		s := PromptState{
			Prompt: "What is your favorite color?",
		}

		js, err := json.Marshal(s)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		h, err := runCodeFunc("promptview.go", "main.RenderPrompt", js)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write([]byte(h))
	}))
}
