//go:build js
// +build js

package main

import (
	"syscall/js"

	"github.com/breadchris/share/editor/internal/analyzer/check"
	"github.com/breadchris/share/editor/pkg/worker"
)

func main() {
	worker.ExportAndStart(worker.Exports{
		"analyzeCode": analyzeCode,
	})
}

func analyzeCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}

	return check.Check(code)
}
