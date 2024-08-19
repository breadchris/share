package html

import "reflect"

func BuildHTMLForm(data interface{}) *Node {
	v := reflect.ValueOf(data)
	t := v.Type()

	form := Form(Method("POST"), Action("/submit"))

	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		fieldName := field.Name
		fieldType := field.Type.Kind()

		label := Label(For(fieldName), T(fieldName))

		println(fieldName, fieldType.String())

		var inputNode *Node
		switch fieldType {
		case reflect.String:
			inputNode = Input(Type("text"), Id(fieldName), Name(fieldName), Class("border rounded w-full py-2 px-3"))
		case reflect.Slice:
			if field.Type.Elem().Kind() == reflect.String {
				inputNode = TextArea(Id(fieldName), Name(fieldName), Class("border rounded w-full py-2 px-3"), Rows(5))
			}
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			inputNode = Input(Type("number"), Id(fieldName), Name(fieldName), Class("border rounded w-full py-2 px-3"))
		case reflect.Float32, reflect.Float64:
			inputNode = Input(Type("number"), Id(fieldName), Name(fieldName), Class("border rounded w-full py-2 px-3"))
		case reflect.Bool:
			inputNode = Input(Type("checkbox"), Id(fieldName), Name(fieldName), Class("border rounded"))
		default:
			continue
		}

		form.Children = append(form.Children, Div(Class("mb-4"), label, inputNode))
	}

	submitButton := Div(Class("text-center"),
		Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Submit")),
	)
	form.Children = append(form.Children, submitButton)

	return form
}
