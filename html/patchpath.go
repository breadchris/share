package html

import (
	"reflect"
	"strings"
)

func lookupPatchPath(structPtr interface{}, fieldPtr interface{}) string {
	structValue := validateStructPtr(structPtr)
	fieldValue := reflect.ValueOf(fieldPtr)
	fieldAddr := fieldValue.Pointer()

	path, found := findFieldPath(structValue, fieldAddr, "")
	if !found {
		panic("fieldPtr does not belong to structPtr")
	}
	return path
}

func validateStructPtr(structPtr interface{}) reflect.Value {
	structValue := reflect.ValueOf(structPtr)
	if structValue.Kind() != reflect.Ptr || structValue.Elem().Kind() != reflect.Struct {
		panic("structPtr must be a pointer to a struct")
	}
	return structValue.Elem()
}

func findFieldPath(value reflect.Value, fieldAddr uintptr, prefix string) (string, bool) {
	value = resolvePointer(value)
	if value.Kind() != reflect.Struct {
		return "", false
	}

	structType := value.Type()
	for i := 0; i < structType.NumField(); i++ {
		field := structType.Field(i)
		fieldValue := value.Field(i)
		fieldName := resolveFieldName(field)
		combined := combinePaths(prefix, fieldName)

		if fieldValue.CanAddr() && fieldValue.Addr().Pointer() == fieldAddr {
			return combined, true
		}

		if isNestedStruct(fieldValue) {
			subPath, found := findFieldPath(fieldValue, fieldAddr, combined)
			if found {
				return subPath, true
			}
		}
	}

	return "", false
}

func resolvePointer(value reflect.Value) reflect.Value {
	if value.Kind() == reflect.Ptr {
		return value.Elem()
	}
	return value
}

func resolveFieldName(field reflect.StructField) string {
	jsonTag := field.Tag.Get("json")
	fieldName := strings.Split(jsonTag, ",")[0]
	if fieldName == "" || fieldName == "-" {
		return strings.ToLower(field.Name)
	}
	return fieldName
}

func combinePaths(prefix, fieldName string) string {
	if prefix == "" {
		return "/" + fieldName
	}
	return prefix + "/" + fieldName
}

func isNestedStruct(fieldValue reflect.Value) bool {
	return fieldValue.Kind() == reflect.Ptr || fieldValue.Kind() == reflect.Struct
}
