package html

import (
	"fmt"
	"reflect"
	"strings"
)

func BuildForm(data any) *Node {
	v := reflect.ValueOf(data)
	t := reflect.TypeOf(data)

	if v.Kind() != reflect.Struct {
		panic("data must be a struct")
	}

	form := Form(Method("POST"), Action("/submit"))
	for i := 0; i < v.NumField(); i++ {
		field := t.Field(i)
		value := v.Field(i)

		labelText := strings.Title(field.Name)

		label := Label(For(field.Name), T(labelText))

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
			input = P(T(fmt.Sprintf("Unsupported field type: %s", field.Type.String())))
		}

		form.Children = append(form.Children, Div(Class("mb-4"),
			label,
			input,
		))
	}

	form.Children = append(form.Children, Div(Class("text-center"),
		Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Submit")),
	))

	return form
}
