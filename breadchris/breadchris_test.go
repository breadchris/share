package breadchris

import (
	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"testing"
)

func TestHTML(t *testing.T) {
	i := interp.New(interp.Options{})

	i.Use(stdlib.Symbols)

	_, err := i.Eval(`
package main

type A struct {
	B int
}

func TestAppend() {
	var as []*A
	
	for i := 0; i < 10; i++ {
		as = append(as, &A{B: i})
	}

	for _, a := range as {
		println(a.B)
	}
}
`)
	if err != nil {
		t.Fatalf("Eval error: %v", err)
	}

	v, err := i.Eval("main.TestAppend")
	if err != nil {
		t.Fatalf("Eval error: %v", err)
	}

	r := v.Interface().(func())
	r()
}

func TestSliceAppend(t *testing.T) {
	i := interp.New(interp.Options{})

	i.Use(stdlib.Symbols)

	_, err := i.Eval(`
package main

import (
	"encoding/json"
	"os"
)

type S struct {
	Name  string
	Child []*S
}

func main() {
	a := &S{Name: "hello"}
	a.Child = append(a.Child, &S{Name: "world"})
	json.NewEncoder(os.Stdout).Encode(a)
	a.Child = append(a.Child, &S{Name: "test"})
	json.NewEncoder(os.Stdout).Encode(a)
	//a.Child[0].Child = append([]*S{}, &S{Name: "sunshine"})
	//json.NewEncoder(os.Stdout).Encode(a)
}
`)

	if err != nil {
		t.Fatalf("Eval error: %v", err)
	}

	v, err := i.Eval("main.main")
	if err != nil {
		t.Fatalf("Eval error: %v", err)
	}

	r := v.Interface().(func())
	r()
}
