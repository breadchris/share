package main

import (
	"os"

	"github.com/breadchris/share/editor/pkgindex/cmd"
)

func main() {
	if err := cmd.Run(); err != nil {
		os.Exit(2)
	}
}
