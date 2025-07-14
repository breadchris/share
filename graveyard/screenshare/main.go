package main

import (
	"github.com/breadchris/share/graveyard/screenshare/cmd"
	pmode "github.com/breadchris/share/graveyard/screenshare/config/mode"
)

var (
	version    = "unknown"
	commitHash = "unknown"
	mode       = pmode.Dev
)

func main() {
	pmode.Set(mode)
	cmd.Run(version, commitHash)
}
