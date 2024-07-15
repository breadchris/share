package main

import (
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"testing"
)

func TestRecipeIndex(t *testing.T) {
	index, err := NewSearchIndex(recipeIndex)
	if err != nil {
		fmt.Println("Error:", err)
	}

	r, err := index.Search("Cinnamon")
	if err != nil {
		fmt.Println("Error:", err)
	}
	fmt.Println(r.String())
}

func TestLoadAllRecipes(t *testing.T) {
	index, err := NewSearchIndex(recipeIndex)
	if err != nil {
		fmt.Println("Error:", err)
	}

	count := 0
	batch := index.Index.NewBatch()
	processFunc := func(name string, contents []byte) error {
		var data map[string]any

		// only match *.json files
		if path.Ext(name) != ".json" {
			return nil
		}

		count += 1
		if count%100 == 0 {
			fmt.Printf("Current file: %s\n", name)
			fmt.Printf("Processed %d files\n", count)
			err = index.Batch(batch)
			if err != nil {
				return err
			}
			batch = index.Index.NewBatch()
		}

		err = json.Unmarshal(contents, &data)
		if err != nil {
			return fmt.Errorf("error unmarshalling %s: %v", name, err)
		}

		return batch.Index(name, data)
	}

	fsys := os.DirFS("data/recipes")
	dir := "."
	err = fs.WalkDir(fsys, dir, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		file, err := fsys.Open(p)
		if err != nil {
			return err
		}
		defer file.Close()
		contents, err := io.ReadAll(file)
		if err != nil {
			return err
		}
		return processFunc(p, contents)
	})
	if err != nil {
		fmt.Println("Error:", err)
	}

	if err = index.Batch(batch); err != nil {
		fmt.Println("Error:", err)
	}
}
