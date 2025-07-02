package main

import (
	_ "embed"
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"go/ast"
	"go/parser"
	"go/token"

	"github.com/fatih/structtag"
)

var Indent = "    "

func getIdent(s string) string {
	switch s {
	case "bool":
		return "boolean"
	case "int", "int8", "int16", "int32", "int64",
		"uint", "uint8", "uint16", "uint32", "uint64",
		"float32", "float64",
		"complex64", "complex128":
		return "number"
	}

	return s
}

func writeType(s *strings.Builder, t ast.Expr, depth int, optionalParens bool) {
	switch t := t.(type) {
	case *ast.StarExpr:
		if optionalParens {
			s.WriteByte('(')
		}
		writeType(s, t.X, depth, false)
		s.WriteString(" | undefined")
		if optionalParens {
			s.WriteByte(')')
		}
	case *ast.ArrayType:
		if v, ok := t.Elt.(*ast.Ident); ok && v.String() == "byte" {
			s.WriteString("string")
			break
		}
		writeType(s, t.Elt, depth, true)
		s.WriteString("[]")
	case *ast.StructType:
		s.WriteString("{\n")
		writeFields(s, t.Fields.List, depth+1)

		for i := 0; i < depth+1; i++ {
			s.WriteString(Indent)
		}
		s.WriteByte('}')
	case *ast.Ident:
		s.WriteString(getIdent(t.String()))
	case *ast.SelectorExpr:
		longType := fmt.Sprintf("%s.%s", t.X, t.Sel)
		switch longType {
		case "time.Time":
			s.WriteString("string")
		case "decimal.Decimal":
			s.WriteString("number")
		default:
			s.WriteString(longType)
		}
	case *ast.MapType:
		s.WriteString("{ [key: ")
		writeType(s, t.Key, depth, false)
		s.WriteString("]: ")
		writeType(s, t.Value, depth, false)
		s.WriteByte('}')
	case *ast.InterfaceType:
		s.WriteString("any")
	default:
		err := fmt.Errorf("unhandled: %s, %T", t, t)
		fmt.Println(err)
		panic(err)
	}
}

var validJSNameRegexp = regexp.MustCompile(`(?m)^[\pL_][\pL\pN_]*$`)

func validJSName(n string) bool {
	return validJSNameRegexp.MatchString(n)
}

func writeFields(s *strings.Builder, fields []*ast.Field, depth int) {
	for _, f := range fields {
		optional := false

		var fieldName string
		if len(f.Names) != 0 && f.Names[0] != nil && len(f.Names[0].Name) != 0 {
			fieldName = f.Names[0].Name
		}
		if len(fieldName) == 0 || 'A' > fieldName[0] || fieldName[0] > 'Z' {
			continue
		}

		var name string
		if f.Tag != nil {
			tags, err := structtag.Parse(f.Tag.Value[1 : len(f.Tag.Value)-1])
			if err != nil {
				panic(err)
			}

			jsonTag, err := tags.Get("json")
			if err == nil {
				name = jsonTag.Name
				if name == "-" {
					continue
				}

				optional = jsonTag.HasOption("omitempty")
			}
		}

		if len(name) == 0 {
			name = fieldName
		}

		for i := 0; i < depth+1; i++ {
			s.WriteString(Indent)
		}

		quoted := !validJSName(name)

		if quoted {
			s.WriteByte('\'')
		}
		s.WriteString(name)
		if quoted {
			s.WriteByte('\'')
		}

		switch t := f.Type.(type) {
		case *ast.StarExpr:
			optional = true
			f.Type = t.X
		}

		if optional {
			s.WriteByte('?')
		}

		s.WriteString(": ")

		writeType(s, f.Type, depth, false)

		s.WriteString(";\n")
	}
}

func Convert(s string) string {
	s = strings.TrimSpace(s)
	if len(s) == 0 {
		return s
	}

	var f ast.Node
	f, err := parser.ParseExprFrom(token.NewFileSet(), "editor.go", s, parser.SpuriousErrors)
	if err != nil {
		s = fmt.Sprintf(`package main

func main() {
	%s
}`, s)

		f, err = parser.ParseFile(token.NewFileSet(), "editor.go", s, parser.SpuriousErrors)
		if err != nil {
			panic(err)
		}
	}

	w := new(strings.Builder)
	name := "MyInterface"

	first := true

	ast.Inspect(f, func(n ast.Node) bool {
		switch x := n.(type) {
		case *ast.Ident:
			name = x.Name
		case *ast.StructType:
			if !first {
				w.WriteString("\n\n")
			}

			w.WriteString("declare interface ")
			w.WriteString(name)
			w.WriteString(" {\n")

			writeFields(w, x.Fields.List, 0)

			w.WriteByte('}')

			first = false

			// TODO: allow multiple structs
			return false
		}
		return true
	})

	return w.String()
}

// FunctionInfo represents a Go function's signature information
type FunctionInfo struct {
	Name       string
	RequestType string
	ResponseType string
	Endpoint   string
}

// GenerateTSFromFunctions generates TypeScript interfaces and fetch functions for Go functions
func GenerateTSFromFunctions(functions interface{}) (string, error) {
	var sb strings.Builder
	
	// Get the slice of function values using reflection
	funcSlice := reflect.ValueOf(functions)
	if funcSlice.Kind() != reflect.Slice {
		return "", fmt.Errorf("expected slice of functions, got %T", functions)
	}
	
	var funcInfos []FunctionInfo
	
	// Extract function information
	for i := 0; i < funcSlice.Len(); i++ {
		funcValue := funcSlice.Index(i)
		if funcValue.Kind() != reflect.Func {
			continue
		}
		
		funcType := funcValue.Type()
		funcName := getFunctionName(funcValue)
		
		// Validate function signature: func(req SomeStruct) (SomeResponse, error)
		if funcType.NumIn() != 1 || funcType.NumOut() != 2 {
			continue
		}
		
		// Check if last return type is error
		errorInterface := reflect.TypeOf((*error)(nil)).Elem()
		if !funcType.Out(1).Implements(errorInterface) {
			continue
		}
		
		reqType := funcType.In(0)
		respType := funcType.Out(0)
		
		funcInfo := FunctionInfo{
			Name:        funcName,
			RequestType: getTypeName(reqType),
			ResponseType: getTypeName(respType),
			Endpoint:    strings.ToLower(funcName),
		}
		funcInfos = append(funcInfos, funcInfo)
	}
	
	// Generate TypeScript interfaces for request/response types
	typeMap := make(map[string]bool)
	for _, funcInfo := range funcInfos {
		if !typeMap[funcInfo.RequestType] {
			tsInterface := generateTSInterface(funcInfo.RequestType)
			if tsInterface != "" {
				sb.WriteString(tsInterface)
				sb.WriteString("\n\n")
				typeMap[funcInfo.RequestType] = true
			}
		}
		if !typeMap[funcInfo.ResponseType] {
			tsInterface := generateTSInterface(funcInfo.ResponseType)
			if tsInterface != "" {
				sb.WriteString(tsInterface)
				sb.WriteString("\n\n")
				typeMap[funcInfo.ResponseType] = true
			}
		}
	}
	
	// Generate API client class
	sb.WriteString("export interface FetchOptions {\n")
	sb.WriteString("    baseURL?: string;\n")
	sb.WriteString("    headers?: Record<string, string>;\n")
	sb.WriteString("    timeout?: number;\n")
	sb.WriteString("}\n\n")
	
	sb.WriteString("export interface Response<T> {\n")
	sb.WriteString("    data: T;\n")
	sb.WriteString("    status: number;\n")
	sb.WriteString("    statusText: string;\n")
	sb.WriteString("}\n\n")
	
	sb.WriteString("export class APIClient {\n")
	sb.WriteString("    private baseURL: string;\n")
	sb.WriteString("    private defaultHeaders: Record<string, string>;\n\n")
	
	sb.WriteString("    constructor(options: FetchOptions = {}) {\n")
	sb.WriteString("        this.baseURL = options.baseURL || '';\n")
	sb.WriteString("        this.defaultHeaders = {\n")
	sb.WriteString("            'Content-Type': 'application/json',\n")
	sb.WriteString("            ...options.headers\n")
	sb.WriteString("        };\n")
	sb.WriteString("    }\n\n")
	
	// Generate individual API methods
	for _, funcInfo := range funcInfos {
		sb.WriteString(fmt.Sprintf("    async %s(req: %s, options: FetchOptions = {}): Promise<Response<%s>> {\n",
			funcInfo.Name, funcInfo.RequestType, funcInfo.ResponseType))
		sb.WriteString("        const url = `${this.baseURL}/" + funcInfo.Endpoint + "`;\n")
		sb.WriteString("        const headers = { ...this.defaultHeaders, ...options.headers };\n\n")
		
		sb.WriteString("        const response = await fetch(url, {\n")
		sb.WriteString("            method: 'POST',\n")
		sb.WriteString("            headers,\n")
		sb.WriteString("            body: JSON.stringify(req)\n")
		sb.WriteString("        });\n\n")
		
		sb.WriteString("        if (!response.ok) {\n")
		sb.WriteString("            throw new Error(`HTTP error! status: ${response.status}`);\n")
		sb.WriteString("        }\n\n")
		
		sb.WriteString("        const data = await response.json();\n")
		sb.WriteString("        return {\n")
		sb.WriteString("            data,\n")
		sb.WriteString("            status: response.status,\n")
		sb.WriteString("            statusText: response.statusText\n")
		sb.WriteString("        };\n")
		sb.WriteString("    }\n\n")
	}
	
	sb.WriteString("}\n\n")
	
	// Generate convenience functions
	sb.WriteString("// Convenience functions for individual API calls\n")
	for _, funcInfo := range funcInfos {
		sb.WriteString(fmt.Sprintf("export async function %s(req: %s, options: FetchOptions = {}): Promise<Response<%s>> {\n",
			funcInfo.Name, funcInfo.RequestType, funcInfo.ResponseType))
		sb.WriteString("    const client = new APIClient(options);\n")
		sb.WriteString(fmt.Sprintf("    return client.%s(req, options);\n", funcInfo.Name))
		sb.WriteString("}\n\n")
	}
	
	return sb.String(), nil
}

// Helper function to get function name using reflection
func getFunctionName(fn reflect.Value) string {
	// Try to get the function name from runtime.FuncForPC
	if fn.Kind() == reflect.Func {
		// This is a simplified approach - in practice you might need to pass
		// the function name as part of the input or use a map
		return "UnknownFunc"
	}
	return "UnknownFunc"
}

// Helper function to get type name
func getTypeName(t reflect.Type) string {
	// Handle pointer types
	for t.Kind() == reflect.Ptr {
		t = t.Elem()
	}
	
	if t.PkgPath() == "" {
		return t.Name()
	}
	
	// Return just the type name without package path for simplicity
	return t.Name()
}

// Generate TypeScript interface from Go struct type name
func generateTSInterface(typeName string) string {
	// This is a placeholder - in a real implementation, you would need to:
	// 1. Parse the actual Go struct definition
	// 2. Convert field types to TypeScript equivalents
	// 3. Handle tags (json, omitempty, etc.)
	
	// For now, return a basic interface structure
	return fmt.Sprintf("interface %s {\n    // TODO: Add actual fields\n}", typeName)
}

// GenerateTSFromGoCode generates TypeScript from Go source code containing function definitions
func GenerateTSFromGoCode(goCode string) (string, error) {
	fset := token.NewFileSet()
	
	// Try to parse as a complete file first
	node, err := parser.ParseFile(fset, "input.go", goCode, parser.ParseComments)
	if err != nil {
		// If that fails, try wrapping it in a package
		wrappedCode := fmt.Sprintf("package main\n\n%s", goCode)
		node, err = parser.ParseFile(fset, "input.go", wrappedCode, parser.ParseComments)
		if err != nil {
			return "", fmt.Errorf("failed to parse Go code: %v", err)
		}
	}
	
	var sb strings.Builder
	var funcInfos []FunctionInfo
	var structTypes map[string]*ast.StructType = make(map[string]*ast.StructType)
	
	// First pass: collect struct types
	ast.Inspect(node, func(n ast.Node) bool {
		switch decl := n.(type) {
		case *ast.GenDecl:
			for _, spec := range decl.Specs {
				if typeSpec, ok := spec.(*ast.TypeSpec); ok {
					if structType, ok := typeSpec.Type.(*ast.StructType); ok {
						structTypes[typeSpec.Name.Name] = structType
					}
				}
			}
		}
		return true
	})
	
	// Second pass: collect function signatures
	ast.Inspect(node, func(n ast.Node) bool {
		switch decl := n.(type) {
		case *ast.FuncDecl:
			if decl.Type.Params.NumFields() == 1 && decl.Type.Results.NumFields() == 2 {
				// Check if it matches our pattern: func Name(req Type) (resp Type, error)
				funcName := decl.Name.Name
				
				// Get request type
				reqType := getTypeString(decl.Type.Params.List[0].Type)
				
				// Get response type (first return value)
				respType := getTypeString(decl.Type.Results.List[0].Type)
				
				// Check if second return is error
				if len(decl.Type.Results.List) > 1 {
					if ident, ok := decl.Type.Results.List[1].Type.(*ast.Ident); ok && ident.Name == "error" {
						funcInfo := FunctionInfo{
							Name:         funcName,
							RequestType:  reqType,
							ResponseType: respType,
							Endpoint:     strings.ToLower(funcName),
						}
						funcInfos = append(funcInfos, funcInfo)
					}
				}
			}
		}
		return true
	})
	
	// Generate TypeScript interfaces for structs
	generatedTypes := make(map[string]bool)
	for _, funcInfo := range funcInfos {
		// Generate request type interface
		if structType, exists := structTypes[funcInfo.RequestType]; exists && !generatedTypes[funcInfo.RequestType] {
			sb.WriteString(generateTSInterfaceFromAST(funcInfo.RequestType, structType))
			sb.WriteString("\n\n")
			generatedTypes[funcInfo.RequestType] = true
		}
		
		// Generate response type interface
		if structType, exists := structTypes[funcInfo.ResponseType]; exists && !generatedTypes[funcInfo.ResponseType] {
			sb.WriteString(generateTSInterfaceFromAST(funcInfo.ResponseType, structType))
			sb.WriteString("\n\n")
			generatedTypes[funcInfo.ResponseType] = true
		}
	}
	
	// Generate API client and convenience functions (same as before)
	if len(funcInfos) > 0 {
		sb.WriteString("export interface FetchOptions {\n")
		sb.WriteString("    baseURL?: string;\n")
		sb.WriteString("    headers?: Record<string, string>;\n")
		sb.WriteString("    timeout?: number;\n")
		sb.WriteString("}\n\n")
		
		sb.WriteString("export interface Response<T> {\n")
		sb.WriteString("    data: T;\n")
		sb.WriteString("    status: number;\n")
		sb.WriteString("    statusText: string;\n")
		sb.WriteString("}\n\n")
		
		// Generate convenience functions
		for _, funcInfo := range funcInfos {
			sb.WriteString(fmt.Sprintf("export async function %s(req: %s, options: FetchOptions = {}): Promise<Response<%s>> {\n",
				funcInfo.Name, funcInfo.RequestType, funcInfo.ResponseType))
			sb.WriteString("    const url = `${options.baseURL || ''}/" + funcInfo.Endpoint + "`;\n")
			sb.WriteString("    const headers = {\n")
			sb.WriteString("        'Content-Type': 'application/json',\n")
			sb.WriteString("        ...options.headers\n")
			sb.WriteString("    };\n\n")
			
			sb.WriteString("    const response = await fetch(url, {\n")
			sb.WriteString("        method: 'POST',\n")
			sb.WriteString("        headers,\n")
			sb.WriteString("        body: JSON.stringify(req)\n")
			sb.WriteString("    });\n\n")
			
			sb.WriteString("    if (!response.ok) {\n")
			sb.WriteString("        throw new Error(`HTTP error! status: ${response.status}`);\n")
			sb.WriteString("    }\n\n")
			
			sb.WriteString("    const data = await response.json();\n")
			sb.WriteString("    return {\n")
			sb.WriteString("        data,\n")
			sb.WriteString("        status: response.status,\n")
			sb.WriteString("        statusText: response.statusText\n")
			sb.WriteString("    };\n")
			sb.WriteString("}\n\n")
		}
	}
	
	return sb.String(), nil
}

// Helper function to convert AST type to string
func getTypeString(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.SelectorExpr:
		return fmt.Sprintf("%s.%s", getTypeString(t.X), t.Sel.Name)
	case *ast.StarExpr:
		return getTypeString(t.X)
	default:
		return "unknown"
	}
}

// Generate TypeScript interface from AST struct type
func generateTSInterfaceFromAST(name string, structType *ast.StructType) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("export interface %s {\n", name))
	
	writeFields(&sb, structType.Fields.List, 0)
	
	sb.WriteString("}")
	return sb.String()
}

//func main() {
//	js.Global().SetMap("convert", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
//		defer func() {
//			if r := recover(); r != nil {
//				js.Global().SetMap("err", fmt.Sprintf("%s", r))
//			}
//		}()
//
//		js.Global().SetMap("err", "")
//		return js.ValueOf(Convert(args[0].String()))
//	}))
//
//	select {}
//}
