package html

import (
	"testing"
)

type Recipe struct {
	Title        string
	Ingredients  string
	Instructions string
	Servings     int
	IsVegetarian bool
}

func TestRenderForm(t *testing.T) {
	recipe := Recipe{
		Title:        "Chocolate Cake",
		Ingredients:  "Flour, Sugar, Cocoa, Eggs",
		Instructions: "Mix, Bake, Eat",
		Servings:     8,
		IsVegetarian: true,
	}

	form := BuildForm(recipe)
	println(form.Render())
}
