package pkgindex

import "github.com/breadchris/share/editor/pkg/monaco"

type GoRootSummary struct {
	Version  string                  `json:"version"`
	Packages []monaco.CompletionItem `json:"packages"`
}
