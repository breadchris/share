package yjs

import (
	"fmt"
	"github.com/evanw/esbuild/pkg/api"
	"testing"
)

func TestBuild(t *testing.T) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{
			"./entry.js",
		},
		Loader: map[string]api.Loader{
			".js": api.LoaderJS,
			".ts": api.LoaderTS,
		},
		Outdir:     "dist/",
		Format:     api.FormatIIFE,
		GlobalName: "entry",
		Target:     api.ESNext,
		Bundle:     true,
		Write:      true,
		Sourcemap:  api.SourceMapInline,
		LogLevel:   api.LogLevelInfo,
	})

	for _, warning := range result.Warnings {
		fmt.Println(warning.Text)
	}

	for _, e := range result.Errors {
		fmt.Println(e.Text)
	}

	for _, f := range result.OutputFiles {
		fmt.Println(f.Path)
	}
}
