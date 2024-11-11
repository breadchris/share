package imports

import "github.com/breadchris/share/editor/monaco"

type GoRootSummary struct {
	Version  string                  `json:"version"`
	Packages []monaco.CompletionItem `json:"packages"`
}
