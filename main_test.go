package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"testing"
)

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
