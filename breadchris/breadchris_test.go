package breadchris

import (
	"encoding/json"
	"github.com/breadchris/share/breadchris/posts"
	"github.com/breadchris/share/symbol"
	"github.com/breadchris/yaegi/interp"
	"github.com/breadchris/yaegi/stdlib"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"testing/fstest"
)

func TestGenerate(t *testing.T) {
	//domain := "localhost:8080"
	//domainDir := path.Join("data", "sites", "generated", domain)

	//baseURL := "http://localhost:8080/" + domainDir + "/latest"
	//bread := StaticSite{
	//	Domain:  domain,
	//	BaseURL: baseURL,
	//}

	bread := StaticSite{
		Domain:  "breadchris.com",
		BaseURL: "https://breadchris.com",
	}
	s, err := StaticSiteGenerator(bread)
	if err != nil {
		t.Fatalf("Error: %v", err)
	}

	dst := "/Users/hacked/Documents/GitHub/notes/docs"
	// remove all files in dst
	c := exec.Command("rm", "-rf", dst)
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	if err := c.Run(); err != nil {
		t.Fatalf("Error: %v", err)
	}

	c = exec.Command("cp", "-r", s.OutputDir, dst)
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	if err := c.Run(); err != nil {
		t.Fatalf("Error: %v", err)
	}
}

func TestRun(t *testing.T) {
	i := interp.New(interp.Options{
		GoPath: "/dev/null",
	})

	i.Use(stdlib.Symbols)
	i.Use(symbol.Symbols)

	if _, err := i.EvalPath("./breadchris.go"); err != nil {
		t.Fatalf("Eval error: %v", err)
	}

	v, err := i.Eval("breadchris.Render")
	if err != nil {
		t.Fatalf("Eval error: %v", err)
	}

	s := HomeState{
		Posts: []posts.Post{
			{
				Title: "Hello, World!",
				Tags:  []string{"blog"},
			},
			{
				Title: "2",
				Tags:  []string{"blog2"},
			},
		},
	}

	ss, err := json.Marshal(s)
	if err != nil {
		t.Fatalf("Marshal error: %v", err)
	}

	r := v.Interface().(func(string) string)
	println(r(string(ss)))
}

func TestHome(t *testing.T) {
	d, err := os.ReadFile("../html2/html.go")
	if err != nil {
		println("Error reading file", err)
		return
	}

	f, err := os.ReadFile("home.go")
	if err != nil {
		println("Error reading file", err)
		return
	}

	i := interp.New(interp.Options{
		GoPath: filepath.FromSlash("./"),
		SourcecodeFilesystem: fstest.MapFS{
			"src/breadchris/vendor/github.com/breadchris/share/html2/html.go": &fstest.MapFile{
				Data: d,
			},
		},
	})

	i.Use(stdlib.Symbols)

	_, err = i.Eval(string(f))
	if err != nil {
		t.Fatalf("Eval error: %v", err)
	}

	v, err := i.Eval("breadchris.Render")
	if err != nil {
		t.Fatalf("Eval error: %v", err)
	}

	s := HomeState{
		Posts: []posts.Post{
			{
				Title: "Hello, World!",
				Tags:  []string{"blog"},
			},
			{
				Title: "2",
				Tags:  []string{"blog2"},
			},
		},
	}

	ss, err := json.Marshal(s)
	if err != nil {
		t.Fatalf("Marshal error: %v", err)
	}

	r := v.Interface().(func(string) string)
	println(r(string(ss)))
}

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
