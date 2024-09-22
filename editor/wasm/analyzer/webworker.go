//go:build js
// +build js

package main

import (
	"syscall/js"

	"github.com/breadchris/share/editor/analyzer/check"
	"github.com/breadchris/share/editor/worker"
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

func runCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}

	interpreter := interp.New(interp.Options{})

	interpreter.Use(stdlib.Symbols)

	v, err := interpreter.Eval(code)
	if err != nil {
		panic(err)
	}
	return struct {
		Output string `json:"output"`
		Error  string `json:"error"`
	}{
		Output: v.String(),
		Error:  "",
	}, nil
}
