package html

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/parser"
	"go/printer"
	"go/token"
	"os"
)

func ModifyFunction(source string, change string, line, pos int) error {
	fset := token.NewFileSet()

	node, err := parser.ParseFile(fset, source, nil, parser.AllErrors)
	if err != nil {
		return err
	}

	modified := false

	ast.Inspect(node, func(n ast.Node) bool {
		if fn, ok := n.(*ast.CallExpr); ok {
			fnStart := fset.Position(fn.Pos())

			var i *ast.Ident
			if i, ok = fn.Fun.(*ast.Ident); !ok {
				return true
			}

			if fnStart.Line == line && (pos == -1 || (fnStart.Column < pos && fnStart.Column+len(i.Name) >= pos)) {
				foundClassCall := false

				for _, arg := range fn.Args {
					if callExpr, ok := arg.(*ast.CallExpr); ok {
						if funIdent, ok := callExpr.Fun.(*ast.Ident); ok && funIdent.Name == "Class" {
							foundClassCall = true

							if len(callExpr.Args) > 0 {
								if aa, ok := callExpr.Args[0].(*ast.BasicLit); ok && aa.Kind == token.STRING {
									aa.Value = fmt.Sprintf("\"%s\"", change)
								}
							}
							break
						}
					}
				}

				if !foundClassCall {
					classCall := &ast.CallExpr{
						Fun:  ast.NewIdent("Class"),
						Args: []ast.Expr{&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf("\"%s\"", change)}},
					}
					fn.Args = append(fn.Args, classCall)
				}

				modified = true
				return false
			}
		}
		return true
	})

	if !modified {
		return nil
	}

	var buf bytes.Buffer
	if err := printer.Fprint(&buf, fset, node); err != nil {
		return err
	}

	if err = os.WriteFile(source, buf.Bytes(), 0644); err != nil {
		return err
	}
	return nil
}
