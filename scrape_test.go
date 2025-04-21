package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/db"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestScrape(t *testing.T) {
	c := NewCrawler()

	err := c.Crawl("https://smittenkitchen.com/")
	if err != nil {
		t.Error(err)
	}
}
func dataToRecipe(ctx context.Context, d deps.Deps, data string) (models.Recipe, error) {
	var rec models.Recipe

	prompt := data

	schema, err := jsonschema.GenerateSchemaForType(rec)
	if err != nil {
		return rec, err
	}

	resp, err := d.AI.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4o20240513,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: `You are a helpful assistant that generates recipes from text data.`,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Tools: []openai.Tool{
			{
				Type: "function",
				Function: &openai.FunctionDefinition{
					Name:        "createRecipe",
					Description: "",
					Parameters:  schema,
				},
			},
		},
	})
	if err != nil {
		return rec, err
	}

	for _, tc := range resp.Choices[0].Message.ToolCalls {
		if ok := tc.Function.Name == "createRecipe"; ok {
			println("found function")
			err = json.Unmarshal([]byte(tc.Function.Arguments), &rec)
			if err != nil {
				return rec, err
			}
			return rec, nil
		}
	}
	println(resp.Choices[0].Message.Content)
	return rec, errors.New("failed to generate recipe")
}

func parseRecipe(d deps.Deps, path string) (*models.Recipe, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	doc, err := goquery.NewDocumentFromReader(f)
	if err != nil {
		return nil, err
	}

	var (
		r models.Recipe
		t string
	)

	s := doc.Find(".jetpack-recipe-content").Each(func(i int, s *goquery.Selection) {
		t += s.Text()
	})
	if s.Length() == 0 {
		s = doc.Find(".entry-content").Each(func(i int, s *goquery.Selection) {
			s.Find("p").Each(func(i int, s *goquery.Selection) {
				t += s.Text()
			})
		})
		if s.Length() == 0 {
			println("No content found")
		}
	}

	r, err = dataToRecipe(context.Background(), d, t)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func TestParse(to *testing.T) {
	c := config.New()
	newDB := db.LoadDB(c.DB)

	de := deps.Deps{
		AI: openai.NewClient(c.OpenAIKey),
		DB: newDB,
	}

	basePath := "/Users/hacked/Documents/GitHub/share/data/sites/raw/"
	dir, err := filepath.Abs("/Users/hacked/Documents/GitHub/share/data/sites/raw/smittenkitchen.com")
	if err != nil {
		panic(err)
	}
	//dir, err := filepath.Abs(filepath.Join(basePath, "smittenkitchen.com/2008/10/beef-leek-and-barley-soup/"))
	//if err != nil {
	//	panic(err)
	//}

	err = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			return nil
		}

		if filepath.Ext(path) != ".html" {
			return nil
		}

		source := strings.Replace(path, basePath, "", 1)

		var re models.Recipe
		if err = de.DB.First(&re, "url = ?", source).Error; err == nil {
			//println("updating recipe:", source)
			return nil
		}

		println("Parsing file:", path)
		r, err := parseRecipe(de, path)
		if err != nil {
			fmt.Printf("Error parsing file %s: %v\n", path, err)
			return nil
		}
		if r == nil {
			println("No recipe found")
			return nil
		}

		//u, err := url.Parse(source)
		//if err != nil {
		//	println("Error parsing URL:", err)
		//	return err
		//}

		if r.Model.ID == "" {
			// creating new recipe
			r.Model.ID = uuid.NewString()
		}

		for i := range r.Ingredients {
			r.Ingredients[i].ID = uuid.NewString()
			r.Ingredients[i].RecipeID = r.Model.ID
		}

		for i := range r.Directions {
			r.Directions[i].ID = uuid.NewString()
			r.Directions[i].RecipeID = r.Model.ID
		}

		for i := range r.Equipment {
			r.Equipment[i].ID = uuid.NewString()
			r.Equipment[i].RecipeID = r.Model.ID
		}

		r.Domain = "smittenkitchen.com"
		r.URL = source
		if err = de.DB.Save(r).Error; err != nil {
			println("Error saving recipe:", err)
			return err
		}
		return nil
	})
	if err != nil {
		to.Error(err)
	}
}

func TestRecipeIndexSmitten(t *testing.T) {
	index, err := db.NewSearchIndex(smittenIndex)
	if err != nil {
		fmt.Println("Error:", err)
	}

	r, err := index.Search("Pastry")
	if err != nil {
		fmt.Println("Error:", err)
	}
	fmt.Println(r.String())
}

func TestRecipes(t *testing.T) {
	c := config.New()
	newDB := db.LoadDB(c.DB)

	de := deps.Deps{
		DB: newDB,
	}

	var recipes []models.Recipe
	res := de.DB.Preload("Ingredients").Preload("Equipment").Preload("Directions").Where("domain = ?", "smittenkitchen.com").Find(&recipes)
	if res.Error != nil {
		fmt.Println("Error:", res.Error)
	}

	b, err := json.Marshal(recipes)
	if err != nil {
		t.Fatalf("%v", err)
	}

	req, err := http.NewRequest(http.MethodPut, "https://justshare.io/recipe/source/upload", bytes.NewReader(b))
	if err != nil {
		t.Fatalf("%v", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("%v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("%v", err)
	}
}

func TestLoadAllRecipesSmitten(t *testing.T) {
	c := config.New()
	newDB := db.LoadDB(c.DB)

	de := deps.Deps{
		DB: newDB,
	}

	index, err := db.NewSearchIndex(smittenIndex)
	if err != nil {
		fmt.Println("Error:", err)
	}

	var recipes []models.Recipe
	res := de.DB.Preload("Ingredients").Preload("Equipment").Preload("Directions").Where("domain = ?", "smittenkitchen.com").Find(&recipes)
	if res.Error != nil {
		fmt.Println("Error:", res.Error)
	}

	count := 0
	batch := index.Index.NewBatch()
	for _, recipe := range recipes {
		count += 1
		if count%100 == 0 {
			fmt.Printf("Current file: %s\n", recipe.Name)
			fmt.Printf("Processed %d files\n", count)
			err = index.Batch(batch)
			if err != nil {
				fmt.Println("Error:", err)
			}
			batch = index.Index.NewBatch()
		}

		err = batch.Index(recipe.ID, recipe)
		if err != nil {
			fmt.Println("Error:", err)
		}
	}

	if err = index.Batch(batch); err != nil {
		fmt.Println("Error:", err)
	}
}
