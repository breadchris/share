package html

import (
	"fmt"
	"reflect"
	"strings"
)

func BuildForm(action string, data any) *Node {
	v := reflect.ValueOf(data)
	t := reflect.TypeOf(data)

	if v.Kind() != reflect.Struct {
		panic("data must be a struct")
	}

	form := Form(Method("POST"), Action(action))
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
		case reflect.Slice:
			if value.Type().Elem().Kind() == reflect.String {
				for j := 0; j < value.Len(); j++ {
					sliceElem := value.Index(j)
					inputName := fmt.Sprintf("%s.%d", field.Name, j) // <name>.<i> format
					sliceInput := Input(Type("text"), Id(inputName), Name(inputName), Class("border rounded w-full py-2 px-3"), Value(sliceElem.String()))
					div := Div(Class("mb-2"), Button(HxPut("/new/add_field?field="+inputName), T("new")), Button(HxDelete("/new/delete_field?field="+inputName), T("delete")))
					div.Children = append(form.Children, Div(Class("mb-4"),
						Label(For(inputName), T(fmt.Sprintf("%s %d", labelText, j+1))),
						sliceInput,
					))
					form.Children = append(form.Children, div)
				}
				continue
			} else {
				input = P(T(fmt.Sprintf("Unsupported slice type: %s", field.Type.String())))
			}
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
