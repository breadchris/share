package html

import (
	"reflect"
	"strings"
)

func lookupPatchPath(structPtr interface{}, fieldPtr interface{}) string {
	structValue := reflect.ValueOf(structPtr)
	if structValue.Kind() != reflect.Ptr || structValue.Elem().Kind() != reflect.Struct {
		panic("structPtr must be a pointer to a struct")
	}
	structType := structValue.Elem().Type()

	fieldValue := reflect.ValueOf(fieldPtr)
	fieldAddr := fieldValue.Pointer()

	for i := 0; i < structType.NumField(); i++ {
		field := structType.Field(i)
		fieldAddrInStruct := structValue.Elem().Field(i).Addr().Pointer()

		if fieldAddr == fieldAddrInStruct {
			jsonTag := field.Tag.Get("json")
			fieldName := strings.Split(jsonTag, ",")[0]
			if fieldName == "" || fieldName == "-" {
				fieldName = strings.ToLower(field.Name)
			}
			return "/" + fieldName
		}
	}

	panic("fieldPtr does not belong to structPtr")
}
