package code

import (
	"fmt"
	"github.com/evanw/esbuild/pkg/api"
	"testing"
)

func TestBuild(t *testing.T) {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{
			"monaco.ts",
			"node_modules/monaco-editor/esm/vs/language/html/html.worker.js",
			"node_modules/monaco-editor/esm/vs/language/css/css.worker.js",
			"node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js",
			"node_modules/monaco-editor/esm/vs/language/json/json.worker.js",
			"node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
		},
		Loader: map[string]api.Loader{
			".js":  api.LoaderJS,
			".jsx": api.LoaderJSX,
			".ts":  api.LoaderTS,
			".tsx": api.LoaderTSX,
			".ttf": api.LoaderFile,
		},
		//Outfile: "monaco.js",
		Outdir:    "dist/",
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
