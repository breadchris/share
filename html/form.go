package html

import (
	"fmt"
	"reflect"
	"strings"
)

func BuildForm(fieldPath string, data any, fieldToAdd string) *Node {
	v := reflect.ValueOf(data)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	t := v.Type()

	if v.Kind() != reflect.Struct {
		panic("data must be a struct")
	}

	form := Div()
	for i := 0; i < v.NumField(); i++ {
		field := t.Field(i)
		value := v.Field(i)

		currentFieldPath := fieldPath
		if fieldPath != "" {
			currentFieldPath = fmt.Sprintf("%s.%s", fieldPath, field.Name)
		} else {
			currentFieldPath = field.Name
		}

		labelText := strings.Title(field.Name)
		label := Label(For(currentFieldPath), T(labelText))

		var input *Node
		switch value.Kind() {
		case reflect.String:
			input = Input(Type("text"), Id(currentFieldPath), Name(currentFieldPath), Class("border rounded w-full py-2 px-3"), Value(value.String()))
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			input = Input(Type("number"), Id(currentFieldPath), Name(currentFieldPath), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%d", value.Int())))
		case reflect.Float32, reflect.Float64:
			input = Input(Type("number"), Id(currentFieldPath), Name(currentFieldPath), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%f", value.Float())))
		case reflect.Bool:
			checked := ""
			if value.Bool() {
				checked = "checked"
			}
			input = Input(Type("checkbox"), Id(currentFieldPath), Name(currentFieldPath), Class("border rounded w-full py-2 px-3"), Attr("checked", checked))
		case reflect.Slice:
			elemType := value.Type().Elem()
			d := Div()
			ds := Div(
				Class("p-4"),
				Div(Class("divider"), T(field.Name)),
				d,
				A(Class("btn btn-neutral"), Href(fmt.Sprintf("/?id=%s", field.Name)), T("Add")),
			)
			form.Children = append(form.Children, ds)

			if currentFieldPath == fieldToAdd {
				newElem := reflect.New(elemType).Elem()

				switch elemType.Kind() {
				case reflect.String:
					newElem = reflect.ValueOf("New value")
				case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
					newElem = reflect.ValueOf(0)
				case reflect.Float32, reflect.Float64:
					newElem = reflect.ValueOf(0.0)
				case reflect.Bool:
					newElem = reflect.ValueOf(false)
				case reflect.Struct, reflect.Ptr:
					newElem = reflect.New(elemType).Elem()
				}

				if value.CanSet() {
					value.Set(reflect.Append(value, newElem))
				} else {
					// Handle the case where the value is not directly settable (e.g., non-pointer)
					panic(fmt.Sprintf("Cannot set value for %s; it is unaddressable", currentFieldPath))
				}
			}

			for j := 0; j < value.Len(); j++ {
				sliceElem := value.Index(j)
				sliceFieldPath := fmt.Sprintf("%s.%d", currentFieldPath, j)
				var sliceInput *Node

				switch elemType.Kind() {
				case reflect.String:
					sliceInput = Input(Type("text"), Id(sliceFieldPath), Name(sliceFieldPath), Class("border rounded w-full py-2 px-3"), Value(sliceElem.String()))
				case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
					sliceInput = Input(Type("number"), Id(sliceFieldPath), Name(sliceFieldPath), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%d", sliceElem.Int())))
				case reflect.Float32, reflect.Float64:
					sliceInput = Input(Type("number"), Id(sliceFieldPath), Name(sliceFieldPath), Class("border rounded w-full py-2 px-3"), Value(fmt.Sprintf("%f", sliceElem.Float())))
				case reflect.Bool:
					checked := ""
					if sliceElem.Bool() {
						checked = "checked"
					}
					sliceInput = Input(Type("checkbox"), Id(sliceFieldPath), Name(sliceFieldPath), Class("border rounded w-full py-2 px-3"), Attr("checked", checked))
				case reflect.Struct:
					nestedForm := BuildForm(sliceFieldPath, sliceElem.Interface(), fieldToAdd)
					d.Children = append(d.Children, nestedForm.Children...)
					continue
				case reflect.Ptr:
					if !sliceElem.IsNil() {
						nestedForm := BuildForm(sliceFieldPath, sliceElem.Interface(), fieldToAdd)
						d.Children = append(d.Children, nestedForm.Children...)
					} else {
						sliceInput = P(T(fmt.Sprintf("Pointer to %s is nil", elemType.Elem().Name())))
					}
				default:
					sliceInput = P(T(fmt.Sprintf("Unsupported slice element type: %s", elemType.String())))
				}

				d.Children = append(d.Children, Div(Class("mb-4"),
					Label(For(sliceFieldPath), T(fmt.Sprintf("%s %d", labelText, j+1))),
					sliceInput,
				))
			}
		case reflect.Struct:
			nestedForm := BuildForm(currentFieldPath, value.Interface(), fieldToAdd)
			form.Children = append(form.Children, nestedForm.Children...)
			continue
		case reflect.Ptr:
			if !value.IsNil() {
				input = BuildForm(currentFieldPath, value.Elem().Interface(), fieldToAdd)
			} else {
				input = P(T(fmt.Sprintf("Pointer to %s is nil", field.Type.Elem().Name())))
			}
		default:
			input = P(T(fmt.Sprintf("Unsupported field type: %s", field.Type.String())))
		}

		if input != nil {
			form.Children = append(form.Children, Div(Class("mb-4"),
				label,
				input,
			))
		}
	}

	return form
}
