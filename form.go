package main

import (
	. "github.com/breadchris/share/html"
	"net/http"
)

func formBuilder() *Node {
	// Form builder layout
	return Html(
		Head(
			Title(T("Form Builder")),
			TailwindCSS,
			DaisyUI,
			HTMX,
		),
		Body(
			Div(Class("container mx-auto mt-10"),
				H1(Class("text-center text-3xl font-bold mb-4"), T("Form Builder")),

				// Section to Add Form Fields
				Section(Class("mb-6 p-4 bg-gray-100 rounded-lg"),
					H2(Class("text-2xl mb-4"), T("Add Form Fields")),
					Div(Class("flex space-x-4"),
						Select(Class("border p-2 rounded"), Id("fieldType"),
							Option(Value("text"), T("Text Input")),
							Option(Value("checkbox"), T("Checkbox")),
							Option(Value("dropdown"), T("Dropdown")),
							Option(Value("radio"), T("Radio Button")),
						),
						Button(
							Class("bg-green-500 text-white py-2 px-4 rounded"),
							Attr("hx-post", "/add-field"),
							Attr("hx-target", "#formPreview"), Attr("hx-swap", "outerHTML"), T("Add Field")),
					),
				),

				// Form Preview
				Hr(),
				Section(Class("mt-6"),
					H2(Class("text-2xl mb-4"), T("Form Preview")),
					Div(Id("formPreview"), BuildFormPreview()), // The HTMX target for dynamic updates
				),

				// Submit Form
				Hr(),
				Div(Class("text-center mt-6"),
					Form(Method("POST"), Action("/submit-form"),
						Div(Class("mb-4"),
							Label(For("formTitle"), T("Form Title")),
							Input(Type("text"), Id("formTitle"), Name("formTitle"), Class("border rounded w-full py-2 px-3")),
						),
						Div(Class("text-center"),
							Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Submit Form")),
						),
					)),
				Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Submit Form")),
			),
		),
	)
}

func BuildFormPreview() *Node {
	// Simulated form fields added dynamically
	return Form(Method("POST"), Action("/submit"),
		Div(Class("mb-4"),
			Label(For("name"), T("Name")),
			Input(Type("text"), Id("name"), Name("name"), Class("border rounded w-full py-2 px-3")),
		),
		Div(Class("mb-4"),
			Label(For("age"), T("Age")),
			Input(Type("number"), Id("age"), Name("age"), Class("border rounded w-full py-2 px-3")),
		),
	)
}

func addField(w http.ResponseWriter, r *http.Request) {
	// Handle dynamic form field additions (via HTMX)
	// Parse form data and append new fields
	fieldType := r.FormValue("fieldType")

	var newField *Node
	switch fieldType {
	case "text":
		newField = Div(Class("mb-4"),
			Label(For("newText"), T("New Text Input")),
			Input(Type("text"), Id("newText"), Name("newText"), Class("border rounded w-full py-2 px-3")),
		)
	case "checkbox":
		newField = Div(Class("mb-4"),
			Label(For("newCheckbox"), T("New Checkbox")),
			Input(Type("checkbox"), Id("newCheckbox"), Name("newCheckbox")),
		)
		// Add more field types as needed
	}

	w.Header().Set("HX-Target", "#formPreview")
	w.Write([]byte(newField.Render()))
}

func NewForm() *http.ServeMux {
	r := http.NewServeMux()
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		form := formBuilder()
		ServeNode(form)(w, r)
	})
	r.HandleFunc("/add-field", addField)
	r.HandleFunc("/submit-form", func(w http.ResponseWriter, r *http.Request) {
		// Handle form submission logic here
	})
	return r
}
