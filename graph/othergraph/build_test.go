package graph

import (
	"fmt"
	"github.com/evanw/esbuild/pkg/api"
	"testing"
)

func TestBuild(t *testing.T) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{"index.tsx"},
		Loader: map[string]api.Loader{
			".js":    api.LoaderJS,
			".jsx":   api.LoaderJSX,
			".ts":    api.LoaderTS,
			".tsx":   api.LoaderTSX,
			".woff":  api.LoaderFile,
			".woff2": api.LoaderFile,
			".ttf":   api.LoaderFile,
			".eot":   api.LoaderFile,
			".css":   api.LoaderCSS,
		},
		Outfile: "index.js",
		//Outdir:    ".",
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
