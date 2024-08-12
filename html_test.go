package main

import (
	"fmt"
	"net/http"
	"testing"
)

func D(innerHTML ...string) string {
	d := "<div>"
	for _, h := range innerHTML {
		d += h
	}
	return d + "</div>"
}

func H1(text string) string {
	return fmt.Sprintf("<h1>%s</h1>", text)
}

func P(text string) string {
	return fmt.Sprintf("<p>%s</p>", text)
}

func Button(text string, onclick string) string {
	return fmt.Sprintf("<button onclick=\"%s\">%s</button>", onclick, text)
}

type tag struct {
	Name     string
	Attrs    map[string]string
	Body     string
	Children []Tag
}

type Tag interface {
	Build() string
	A(attrs map[string]string) *tag
}

func (s *tag) A(attrs map[string]string) *tag {
	ns := *s
	ns.Attrs = attrs
	return &ns
}

func (s *tag) Build() string {
	c := ""
	for _, t := range s.Children {
		c += t.Build()
	}
	a := ""
	for k, v := range s.Attrs {
		a += fmt.Sprintf("%s=%s ", k, v)
	}
	return fmt.Sprintf("<%s %s>%s</%s>", s.Name, a, c, s.Name)
}

func nt(n string, t []Tag) *tag {
	return &tag{
		Name:     n,
		Children: t,
	}
}

type Text struct {
	tag
	Body string
}

func (s *Text) Build() string {
	return s.Body
}

func T(s string) *Text {
	return &Text{
		Body: s,
	}
}

func D2(t ...Tag) *tag {
	return nt("div", t)
}

func H12(t ...Tag) *tag {
	return nt("h1", t)
}

func P2(t ...Tag) *tag {
	return nt("p", t)
}

func Button2(t ...Tag) *tag {
	return nt("button", t)
}

func TestHTML(t *testing.T) {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		h := D(
			H1("asdf"),
			P("fdsa"),
			Button("hello", "alert('hello')"),
		)
		w.Write([]byte(h))
	})
	http.HandleFunc("/2", func(w http.ResponseWriter, r *http.Request) {
		h := D2(
			H12(T("asdf")),
			P2(T("fdsa")),
			Button2().A(),
		)
		w.Write([]byte(h))
	})
	http.ListenAndServe(":8080", nil)
}
