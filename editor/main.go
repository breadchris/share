package main

import (
	"github.com/breadchris/share/editor/cmd/playground"
	"github.com/breadchris/share/editor/pkg"
)

func main() {
	playground.StartEditor(pkg.DefaultConfig())
}
