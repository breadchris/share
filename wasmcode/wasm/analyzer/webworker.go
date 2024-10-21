//go:build js
// +build js

package main

import (
	"github.com/breadchris/share/wasmcode/wasm/symbol"
	"syscall/js"

	"github.com/breadchris/share/editor/analyzer/check"
	"github.com/breadchris/share/editor/worker"
	"github.com/breadchris/share/html"
	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
)

func main() {
	worker.ExportAndStart(worker.Exports{
		"analyzeCode": analyzeCode,
		"runCode":     runCode,
	})
}

func analyzeCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}

	return check.Check(code)
}

type Return struct {
	Output string `json:"output"`
	Error  string `json:"error"`
}

func runCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}

	println("Running code:", code)
	interpreter := interp.New(interp.Options{
		GoPath: "/dev/null",
	})

	interpreter.Use(stdlib.Symbols)
	interpreter.Use(symbol.Symbols)

	_, err := interpreter.Eval(code)
	if err != nil {
		return Return{
			Output: "",
			Error:  err.Error(),
		}, err
	}

	// TODO get function name to call
	v, err := interpreter.Eval("main.Render")
	if err != nil {
		return Return{
			Output: "",
			Error:  err.Error(),
		}, err
	}

	f, ok := v.Interface().(func() *html.Node)
	if !ok {
		return Return{
			Output: "",
			Error:  "main.Render is not a function",
		}, err
	}

	node := f()

	return Return{
		Output: node.Render(),
		Error:  "",
	}, nil
}
