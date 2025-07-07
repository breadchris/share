package main

import (
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/graveyard/yaegi"
	"github.com/breadchris/share/kanban"
	"github.com/breadchris/share/symbol"
	"github.com/breadchris/yaegi/interp"
	"github.com/breadchris/yaegi/stdlib"
	"html/template"
	"io"
	"io/ioutil"
	"log"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"strings"
	"testing"
)

func testDynamic(f func(d deps.Deps) *http.ServeMux, files ...string) func(deps.Deps) *http.ServeMux {
	pc := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Entry()
	fnp := runtime.FuncForPC(pc)
	file, _ := fnp.FileLine(pc)
	function := runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Name()

	// TODO breadchris fix packages
	parts := strings.Split(function, "/")
	if len(parts) > 1 {
		file = "./" + filepath.Base(filepath.Dir(file))
		function = strings.Split(parts[len(parts)-1], ".")[1]
		//function = parts[len(parts)-1]
	}

	i := interp.New(interp.Options{
		GoPath: "./kanban/",
	})

	i.Use(stdlib.Symbols)
	i.Use(symbol.Symbols)
	customSymbols := map[string]map[string]reflect.Value{}
	customSymbols["github.com/breadchris/share/yaegi/yaegi"] = map[string]reflect.Value{
		"GetStack": reflect.ValueOf(yaegi.Debug{
			Interp: i,
		}.DoGetStack),
	}
	i.Use(customSymbols)

	for _, fi := range files {
		_, err := i.CompilePath(fi)
		if err != nil {
			slog.Warn("failed to eval path", "error", err)
			return f
		}
	}

	_, err := i.EvalPath(file)
	if err != nil {
		slog.Warn("failed to eval path", "error", err)
		return f
	}

	// TODO breadchris not ideal, should figure out how to
	// do this properly
	var fr reflect.Value
	if strings.HasPrefix(file, "/") {
		fr, err = i.Eval(function)
		if err != nil {
			slog.Warn("failed to eval function", "error", err)
			return f
		}
	} else {
		sym := i.Symbols(file)
		//for k, v := range sym {
		//	println(k, v)
		//}
		s, ok := sym[file]
		if !ok {
			slog.Warn("failed to get symbols", "file", file)
			return f
		}

		fr, ok = s[function]
		if !ok {
			slog.Warn("failed to eval function", "error", err, "file", file, "function", function)
			return f
		}
	}

	fn, ok := fr.Interface().(func(db deps.Deps) *http.ServeMux)
	if ok {
		return fn
	}
	slog.Warn("failed to convert function to func() *http.ServeMux")
	return f
}

func TestKanban(t *testing.T) {
	f := testDynamic(kanban.New)
	fmt.Printf("%+v\n", f(deps.Deps{}))
}

func loadJSONFiles(dir string) ([]interface{}, error) {
	var recipes []interface{}

	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".json" {
			data, err := ioutil.ReadFile(filepath.Join(dir, file.Name()))
			if err != nil {
				return nil, err
			}

			var recipe interface{}
			if err := json.Unmarshal(data, &recipe); err != nil {
				return nil, err
			}

			recipes = append(recipes, recipe)
		}
	}

	return recipes, nil
}

func TestRecipe(t *testing.T) {
	recipes, err := loadJSONFiles("data/recipes/atk")
	if err != nil {
		log.Fatalf("Failed to load recipes: %v", err)
	}

	// read the file "recipe.html"
	r, err := os.Open("recipe.html")
	if err != nil {
		log.Fatalf("Failed to open template file: %v", err)
	}
	defer r.Close()

	a, err := io.ReadAll(r)
	if err != nil {
		log.Fatalf("Failed to read template file: %v", err)
	}

	tmpl := template.Must(template.New("recipe").Parse(string(a)))

	// make sure the output directory exists
	if err := os.MkdirAll("data/html", os.ModePerm); err != nil {
		log.Fatalf("Failed to create output directory: %v", err)
		return
	}

	for i, recipe := range recipes {
		fileName := fmt.Sprintf("data/html/recipe_%d.html", i+1)
		f, err := os.Create(fileName)
		if err != nil {
			log.Fatalf("Failed to create output file: %v", err)
		}
		defer f.Close()

		if err := tmpl.Execute(f, recipe); err != nil {
			log.Fatalf("Failed to execute template: %v", err)
		}
	}

	log.Println("Template rendered successfully")
}

func TranscribeRecordings(t *testing.T) {

}
