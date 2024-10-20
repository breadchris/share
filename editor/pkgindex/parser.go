package pkgindex

import (
	"context"
	"fmt"
	"go/parser"
	"go/token"
	"path/filepath"
	"strings"

	"github.com/breadchris/share/editor/analyzer"
	"github.com/breadchris/share/editor/monaco"
)

const goDocDomain = "pkg.go.dev"

type PackageParseParams struct {
	RootDir    string
	ImportPath string
	Files      []string
}

func (params PackageParseParams) PackagePath() string {
	return filepath.Join(params.RootDir, params.ImportPath)
}

func formatGoDocLink(importPath string) string {
	return fmt.Sprintf("[%[2]s on %[1]s](https://%[1]s/%[2]s)", goDocDomain, importPath)
}

// ParseImportCompletionItem parses a Go package at a given GOROOT and constructs monaco CompletionItem from it.
func ParseImportCompletionItem(ctx context.Context, params PackageParseParams) (result monaco.CompletionItem, error error) {
	pkgPath := params.PackagePath()

	result = monaco.CompletionItem{
		Kind:       monaco.Module,
		Detail:     params.ImportPath,
		InsertText: params.ImportPath,
	}

	docString := formatGoDocLink(params.ImportPath)

	fset := token.NewFileSet()
	for _, fname := range params.Files {
		if err := ctx.Err(); err != nil {
			return result, err
		}

		fpath := filepath.Join(pkgPath, fname)
		src, err := parser.ParseFile(fset, fpath, nil, parser.ParseComments)
		if err != nil {
			return result, fmt.Errorf("failed to parse Go file %q: %s", fpath, err)
		}

		doc := src.Doc
		if doc == nil {
			continue
		}

		result.Detail = src.Name.String()

		// Package doc should start with "Package xxx", see issue #367.
		docComment := strings.TrimSpace(doc.Text())
		if !validatePackageDoc(docComment) {
			continue
		}

		docComment = strings.TrimSpace(analyzer.FormatDocString(docComment).Value)
		docString = docComment + "\n\n" + docString
		break
	}

	result.Label.SetString(params.ImportPath)
	result.Documentation.SetValue(&monaco.IMarkdownString{
		Value:     docString,
		IsTrusted: true,
	})
	return result, nil
}

func validatePackageDoc(str string) bool {
	normalizedStr := strings.ToLower(str)
	return strings.HasPrefix(normalizedStr, "package ")
}
