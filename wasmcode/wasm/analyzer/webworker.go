//go:build js
// +build js

package main

import (
	"github.com/breadchris/share/wasmcode/wasm/symbol"
	"syscall/js"

	"fmt"
	"github.com/breadchris/share/editor/analyzer/check"
	"github.com/breadchris/share/editor/worker"
	"github.com/breadchris/share/html"
	"github.com/cogentcore/yaegi/interp"
	"github.com/cogentcore/yaegi/stdlib"
	"go/ast"
	"go/parser"
	"go/token"
)

func main() {
	worker.ExportAndStart(worker.Exports{
		"analyzeCode": analyzeCode,
		"runCode":     runCode,
		"parseCode":   parseCode,
	})
}

func analyzeCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}

	return check.Check(code)
}

type RunRequest struct {
	Code     string `json:"code"`
	Function string `json:"func"`
}

type Return struct {
	Output string `json:"output"`
	Error  string `json:"error"`
}

func runCode(this js.Value, args worker.Args) (interface{}, error) {
	// panic recovery
	defer func() {
		if r := recover(); r != nil {
			println("recovered from panic", r)
		}
	}()

	r := args[0]
	req := RunRequest{
		Code:     r.Get("code").String(),
		Function: r.Get("func").String(),
	}

	println("Running code:", req.Code)
	interpreter := interp.New(interp.Options{
		GoPath: "/dev/null",
	})

	interpreter.Use(stdlib.Symbols)
	interpreter.Use(symbol.Symbols)

	_, err := interpreter.Eval(req.Code)
	if err != nil {
		return Return{
			Output: "",
			Error:  err.Error(),
		}, err
	}

	// TODO get function name to call
	v, err := interpreter.Eval(req.Function)
	if err != nil {
		return Return{
			Output: "",
			Error:  err.Error(),
		}, err
	}

	if !v.IsValid() {
		return Return{
			Output: "",
			Error:  "function not found",
		}, nil
	}

	f, ok := v.Interface().(func() *html.Node)
	if !ok {
		return Return{
			Output: "",
			Error:  "main.Render is not a function",
		}, err
	}

	node := f()
	if node == nil {
		return Return{
			Output: "",
			Error:  "returned node is nil",
		}, nil
	}

	return Return{
		Output: node.Render(),
		Error:  "",
	}, nil
}

type ParsedFile struct {
	Functions []string `json:"functions"`
}

func parseCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}
	f, err := GetFunctions(code)
	if err != nil {
		return nil, err
	}
	return ParsedFile{
		Functions: f,
	}, nil
}

func GetFunctions(code string) ([]string, error) {
	fset := token.NewFileSet()

	node, err := parser.ParseFile(fset, "", code, parser.ParseComments)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Go file: %w", err)
	}

	var functions []string
	ast.Inspect(node, func(n ast.Node) bool {
		if funcDecl, ok := n.(*ast.FuncDecl); ok {
			functions = append(functions, node.Name.Name+"."+funcDecl.Name.Name)
		}
		return true
	})
	return functions, nil
}
