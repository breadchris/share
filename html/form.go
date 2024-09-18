package html

import (
	"fmt"
	"net/http"
	"reflect"
	"strings"
)

func BuildForm(data interface{}) *Node {
	v := reflect.ValueOf(data)
	t := reflect.TypeOf(data)

	if v.Kind() != reflect.Struct {
		panic("data must be a struct")
	}

	form := Form(Method("POST"), Action("/submit"))
	for i := 0; i < v.NumField(); i++ {
		field := t.Field(i)
		value := v.Field(i)

		// Convert field name to label
		labelText := strings.Title(field.Name)

		// Create label for the field
		label := Label(For(field.Name), T(labelText))

		// Choose the correct input type based on the field type
		var input *Node
		switch value.Kind() {
		case reflect.String:
			input = Input(Type("text"), Id(field.Name), Name(field.Name), Class("border rounded w-full py-2 px-3"), Value(value.String()))
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			input = Input(Type("number"), Id(field.Name), Name(field.Name), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%d", value.Int())))
		case reflect.Float32, reflect.Float64:
			input = Input(Type("number"), Id(field.Name), Name(field.Name), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%f", value.Float())))
		case reflect.Bool:
			checked := ""
			if value.Bool() {
				checked = "checked"
			}
			input = Input(Type("checkbox"), Id(field.Name), Name(field.Name), Class("border rounded w-full py-2 px-3"), Attr("checked", checked))
		default:
			// Handle unsupported types gracefully
			input = P(T(fmt.Sprintf("Unsupported field type: %s", field.Type.String())))
		}

		// Append label and input to form
		form.Children = append(form.Children, Div(Class("mb-4"),
			label,
			input,
		))
	}

	// Add a submit button at the end
	form.Children = append(form.Children, Div(Class("text-center"),
		Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Submit")),
	))

	return form
}

// Example struct
type Recipe struct {
	Title        string
	Ingredients  string
	Instructions string
	Servings     int
	IsVegetarian bool
}

func RenderForm(w http.ResponseWriter, r *http.Request) {
	recipe := Recipe{
		Title:        "Chocolate Cake",
		Ingredients:  "Flour, Sugar, Cocoa, Eggs",
		Instructions: "Mix, Bake, Eat",
		Servings:     8,
		IsVegetarian: true,
	}

	// Use the BuildForm function to generate a form for the recipe
	form := BuildForm(recipe)

	// Render the HTML
	w.Header().Set("Content-Type", "text/html")
	_, _ = fmt.Fprint(w, form.Render())
}
