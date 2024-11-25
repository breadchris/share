package html

import (
	"fmt"
	"reflect"
	"time"
)

func BuildForm(fieldPath string, data any) *Node {
	value := reflect.ValueOf(data)
	if value.Kind() == reflect.Ptr {
		value = value.Elem()
	}
	fieldType := reflect.TypeOf(data)

	form := Div()

	currentFieldPath := fieldPath

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
		h := fmt.Sprintf("/?op=add&path=%s/%d", currentFieldPath, value.Len())
		if value.Len() == 0 {
			var sliceJSONType string
			switch elemType.Kind() {
			case reflect.String:
				sliceJSONType = "\"\""
			case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
				sliceJSONType = "0"
			case reflect.Float32, reflect.Float64:
				sliceJSONType = "0.0"
			case reflect.Bool:
				sliceJSONType = "false"
			case reflect.Struct:
				sliceJSONType = "{}"
			case reflect.Ptr:
				sliceJSONType = "null"
			default:
				sliceJSONType = "null"
			}
			h = fmt.Sprintf("/?op=replace&path=%s&value=[%s]", currentFieldPath, sliceJSONType)
		}
		add := A(Class("btn btn-neutral"), Href(h), T("Add"))
		ds := Div(
			Class("p-4"),
			Div(Class("divider"), T(currentFieldPath)),
			d,
			add,
		)
		form.Children = append(form.Children, ds)

		for j := 0; j < value.Len(); j++ {
			sliceElem := value.Index(j)
			sliceFieldPath := fmt.Sprintf("%s/%d", currentFieldPath, j)
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
				nestedForm := BuildForm(sliceFieldPath, sliceElem.Interface())
				d.Children = append(d.Children,
					Div(
						Ch(nestedForm.Children),
						A(Class("btn btn-neutral"), Href(fmt.Sprintf("/?op=remove&path=%s", sliceFieldPath)), T("Delete")),
					),
				)
				continue
			case reflect.Slice:
				nestedForm := BuildForm(sliceFieldPath, sliceElem.Interface())
				d.Children = append(d.Children, nestedForm.Children...)
			case reflect.Ptr:
				if !sliceElem.IsNil() {
					nestedForm := BuildForm(sliceFieldPath, sliceElem.Interface())
					d.Children = append(d.Children, nestedForm.Children...)
				} else {
					sliceInput = P(T(fmt.Sprintf("Pointer to %s is nil", elemType.Elem().Name())))
				}
			default:
				sliceInput = P(T(fmt.Sprintf("Unsupported slice element type: %s", elemType.String())))
			}

			d.Children = append(d.Children, Div(Class("mb-4"),
				Label(For(sliceFieldPath), T(fmt.Sprintf("%s %d", currentFieldPath, j+1))),
				sliceInput,
				A(Class("btn btn-neutral"), Href(fmt.Sprintf("/?op=remove&path=%s", sliceFieldPath)), T("Delete")),
			))
		}
	case reflect.Struct:
		// if type is time.Time, use a date picker
		if fieldType.String() == "time.Time" {
			input = Input(Type("date"), Id(currentFieldPath), Name(currentFieldPath), Class("border rounded w-full py-2 px-3"), Value(value.Interface().(time.Time).Format("2006-01-02")))
		} else {
			t := value.Type()
			input = Div()
			for i := 0; i < value.NumField(); i++ {
				field := t.Field(i)
				v := value.Field(i)

				jsonTag := field.Tag.Get("json")

				cfp := fieldPath
				if fieldPath != "" {
					cfp = fmt.Sprintf("%s/%s", fieldPath, jsonTag)
				} else {
					if jsonTag == "" {
						jsonTag = field.Name
					}
					cfp = "/" + jsonTag
				}

				input.Children = append(input.Children, BuildForm(cfp, v.Interface()))
			}
		}
	case reflect.Ptr:
		if !value.IsNil() {
			input = BuildForm(currentFieldPath, value.Elem().Interface())
		} else {
			input = P(T(fmt.Sprintf("Pointer is nil")))
		}
	default:
		input = P(T(fmt.Sprintf("Unsupported field type: %s", value.Kind().String())))
	}
	if input != nil {
		label := Label(For(currentFieldPath), T(currentFieldPath))
		form.Children = append(form.Children, Div(Class("mb-4"),
			label,
			input,
		))
	}
	return form
}

type BuildCtx struct {
	CurrentFieldPath string
	Name             string
}

func BuildFormCtx(ctx BuildCtx, data any) *Node {
	value := reflect.ValueOf(data)
	if value.Kind() == reflect.Ptr {
		value = value.Elem()
	}
	fieldType := reflect.TypeOf(data)

	form := Div()

	currentFieldPath := ctx.CurrentFieldPath

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
		h := fmt.Sprintf("/?op=add&path=%s/%d", currentFieldPath, value.Len())
		if value.Len() == 0 {
			var sliceJSONType string
			switch elemType.Kind() {
			case reflect.String:
				sliceJSONType = "\"\""
			case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
				sliceJSONType = "0"
			case reflect.Float32, reflect.Float64:
				sliceJSONType = "0.0"
			case reflect.Bool:
				sliceJSONType = "false"
			case reflect.Struct:
				sliceJSONType = "{}"
			case reflect.Ptr:
				sliceJSONType = "null"
			default:
				sliceJSONType = "null"
			}
			h = fmt.Sprintf("/?op=replace&path=%s&value=[%s]", currentFieldPath, sliceJSONType)
		}
		add := A(Class("btn btn-neutral"), Href(h), T("Add"))
		ds := Div(
			Class("p-4"),
			Div(Class("divider"), T(ctx.Name)),
			d,
			add,
		)
		form.Children = append(form.Children, ds)

		for j := 0; j < value.Len(); j++ {
			sliceElem := value.Index(j)
			sliceFieldPath := fmt.Sprintf("%s/%d", currentFieldPath, j)
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
				nestedForm := BuildForm(sliceFieldPath, sliceElem.Interface())
				d.Children = append(d.Children,
					Div(
						Ch(nestedForm.Children),
						A(Class("btn btn-neutral"), Href(fmt.Sprintf("/?op=remove&path=%s", sliceFieldPath)), T("Delete")),
					),
				)
				continue
			case reflect.Slice:
				nestedForm := BuildForm(sliceFieldPath, sliceElem.Interface())
				d.Children = append(d.Children, nestedForm.Children...)
			case reflect.Ptr:
				if !sliceElem.IsNil() {
					nestedForm := BuildForm(sliceFieldPath, sliceElem.Interface())
					d.Children = append(d.Children, nestedForm.Children...)
				} else {
					sliceInput = P(T(fmt.Sprintf("Pointer to %s is nil", elemType.Elem().Name())))
				}
			default:
				sliceInput = P(T(fmt.Sprintf("Unsupported slice element type: %s", elemType.String())))
			}

			d.Children = append(d.Children, Div(Class("mb-4"),
				Label(For(sliceFieldPath), T(fmt.Sprintf("%s %d", currentFieldPath, j+1))),
				sliceInput,
				A(Class("btn btn-neutral"), Href(fmt.Sprintf("/?op=remove&path=%s", sliceFieldPath)), T("Delete")),
			))
		}
	case reflect.Struct:
		// if type is time.Time, use a date picker
		if fieldType.String() == "time.Time" {
			input = Input(
				Type("date"),
				Id(currentFieldPath),
				Name(currentFieldPath),
				Class("border rounded w-full py-2 px-3"),
				Value(value.Interface().(time.Time).Format("2006-01-02")),
			)
		} else {
			t := value.Type()
			input = Div()
			for i := 0; i < value.NumField(); i++ {
				field := t.Field(i)
				v := value.Field(i)

				jsonTag := field.Tag.Get("json")

				cfp := ctx.CurrentFieldPath
				if cfp != "" {
					cfp = fmt.Sprintf("%s/%s", cfp, jsonTag)
				} else {
					if jsonTag == "" {
						jsonTag = field.Name
					}
					cfp = "/" + jsonTag
				}

				input.Children = append(input.Children, BuildFormCtx(BuildCtx{
					CurrentFieldPath: cfp,
					Name:             field.Name,
				}, v.Interface()))
			}
		}
	case reflect.Ptr:
		if !value.IsNil() {
			input = BuildFormCtx(ctx, value.Elem().Interface())
		} else {
			input = P(T(fmt.Sprintf("Pointer is nil")))
		}
	default:
		input = P(T(fmt.Sprintf("Unsupported field type: %s", value.Kind().String())))
	}
	if input != nil {
		label := Label(For(currentFieldPath), T(ctx.Name))
		form.Children = append(form.Children, Div(Class("mb-4"),
			label,
			input,
		))
	}
	return form
}
