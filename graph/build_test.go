package graph

import (
	"fmt"
	"github.com/evanw/esbuild/pkg/api"
	"testing"
)

func TestBuild(t *testing.T) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{"graph.tsx"},
		Loader: map[string]api.Loader{
			".js":  api.LoaderJS,
			".jsx": api.LoaderJSX,
			".ts":  api.LoaderTS,
			".tsx": api.LoaderTSX,
		},
		Outfile:  "graph.js",
		Bundle:   true,
		Write:    true,
		LogLevel: api.LogLevelInfo,
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
