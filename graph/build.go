package graph

import (
	"fmt"
	"github.com/evanw/esbuild/pkg/api"
)

func Build(p string) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{p},
		Loader: map[string]api.Loader{
			".js":  api.LoaderJS,
			".jsx": api.LoaderJSX,
			".ts":  api.LoaderTS,
			".tsx": api.LoaderTSX,
		},
		Outfile: "graph/graph.js",
		//Outdir:    "graph/",
		Bundle:    true,
		Write:     true,
		Sourcemap: api.SourceMapInline,
		LogLevel:  api.LogLevelInfo,
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
