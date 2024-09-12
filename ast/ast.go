package ast

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"log"
	"slices"
	"strings"
)

// Global graph to store all function calls
var visitedCalls = make(map[string]bool)

func TraverseAST(filename string, targetMethod string) {
	functionInFile := getAllFileFunctions(filename)

	walkFunctionGraph(filename, targetMethod, 0, functionInFile)
}

func getAllFileFunctions(filename string) []string {
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, filename, nil, parser.AllErrors)
	if err != nil {
		log.Fatalf("Failed to parse file: %v", err)
	}

	var functions []string
	ast.Inspect(node, func(n ast.Node) bool {
		if fn, ok := n.(*ast.FuncDecl); ok {
			functions = append(functions, fn.Name.Name)
		}
		return true
	})
	return functions
}

func walkFunctionGraph(filename string, methodName string, depth int, functionInFile []string) {
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
							helper(result, depth, functionInFile)
						}
					}
					return true
				})
			}
		}
		return true
	})
}

func helper(result ast.Expr, depth int, functionInFile []string) {
	if args, ok := result.(*ast.CallExpr); ok {
		for _, arg := range args.Args {
			if call, ok := arg.(*ast.CallExpr); ok {
                if slices.Contains(functionInFile, fmt.Sprintf("%s", call.Fun)) {
					walkFunctionGraph("zine/zine.go", fmt.Sprintf("%s", call.Fun), depth+1, functionInFile)
				} else {
                    fmt.Printf("%s%s\n", strings.Repeat("    ", depth+2), call.Fun)
                    functionArgs := getFunctionCallArgs(call)
                    if functionArgs != "" {
                        fmt.Printf("%s%s\n", strings.Repeat("    ", depth+3), functionArgs)
                    }
                    helper(arg, depth+1, functionInFile)
                }
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
