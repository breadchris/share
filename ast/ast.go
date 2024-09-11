package ast

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"log"
	"strings"
)

// Global graph to store all function calls
var visitedCalls = make(map[string]bool)

func TraverseAST(filename string, targetMethod string) {
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, filename, nil, parser.AllErrors)
	if err != nil {
		log.Fatalf("Failed to parse file: %v", err)
	}

	ast.Inspect(node, func(n ast.Node) bool {
		if call, ok := n.(*ast.CallExpr); ok {
			if selector, ok := call.Fun.(*ast.SelectorExpr); ok {
				if ident, ok := selector.X.(*ast.Ident); ok {
					fullMethod := fmt.Sprintf("%s.%s", ident.Name, selector.Sel.Name)
					if fullMethod == targetMethod {
						walkFunctionGraph("zine/zine.go", "ZineIndex", 0)
					}
				}
			}
		}
		return true
	})
}

func walkFunctionGraph(filename string, methodName string, depth int) {
	fset := token.NewFileSet()

	node, err := parser.ParseFile(fset, filename, nil, parser.AllErrors)
	if err != nil {
		log.Fatalf("Failed to parse external file: %v", err)
	}
	ast.Inspect(node, func(n ast.Node) bool {
		if fn, ok := n.(*ast.FuncDecl); ok {
			if fn.Name.Name == methodName {
				fmt.Printf("%s%s\n", strings.Repeat("    ", depth), methodName)
				ast.Inspect(fn.Body, func(n ast.Node) bool {
					if retStmt, ok := n.(*ast.ReturnStmt); ok {
						for _, result := range retStmt.Results {
							if call, ok := result.(*ast.CallExpr); ok {
								fmt.Printf("%s%s\n", strings.Repeat("    ", depth+1), call.Fun)
							}
							helper(result, depth)
						}
					}
					return true
				})
			}
		}
		return true
	})
}

func helper(result ast.Expr, depth int) {
	if args, ok := result.(*ast.CallExpr); ok {
		for _, arg := range args.Args {
			if call, ok := arg.(*ast.CallExpr); ok {
				fmt.Printf("%s%s\n", strings.Repeat("    ", depth+2), call.Fun)
				fmt.Printf("%s%s\n", strings.Repeat("    ", depth+3), getFunctionCallArgs(call))
				helper(arg, depth+1)
			}

		}
	}
}

// Print function call arguments (expression and value) with indentation
func getFunctionCallArgs(call *ast.CallExpr) string {
	var args string = ""
	if len(call.Args) > 0 {
		for _, arg := range call.Args {
			if _, ok := arg.(*ast.CallExpr); !ok {
				args += exprString(arg) + " "
			}
		}
	}
	args = strings.TrimRight(args, " ")
	return args
}

// Helper function to convert AST expressions to string (for call arguments)
func exprString(expr ast.Expr) string {
	switch e := expr.(type) {
	case *ast.BasicLit:
		return e.Value
	case *ast.Ident:
		return e.Name
	default:
		return fmt.Sprintf("%T", expr)
	}
}
