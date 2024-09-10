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

// TraverseAST parses a Go file and starts processing the AST for the specified method
func TraverseAST(filename string, targetMethod string) {
	// Create a new file set
	fset := token.NewFileSet()

	// Parse the Go file into an AST
	node, err := parser.ParseFile(fset, filename, nil, parser.AllErrors)
	if err != nil {
		log.Fatalf("Failed to parse file: %v", err)
	}

	// Traverse the AST to find the target method (e.g., z.SetupZineRoutes())
	ast.Inspect(node, func(n ast.Node) bool {
		// Look for function or method calls
		if call, ok := n.(*ast.CallExpr); ok {
			// Check if the call is a method call (selector expression)
			if selector, ok := call.Fun.(*ast.SelectorExpr); ok {
				// Get the method name being called
				methodName := selector.Sel.Name

				// Get the receiver object (e.g., z)
				if ident, ok := selector.X.(*ast.Ident); ok {
					fullMethod := fmt.Sprintf("%s.%s", ident.Name, methodName)

					// If this is the target method call (z.SetupZineRoutes), analyze it further
					if fullMethod == targetMethod {
						fmt.Printf("Found call to %s\n", fullMethod)
						// Analyze the external package where SetupZineRoutes is defined
						AnalyzeExternalMethod("zine/zine.go", "SetupZineRoutes", 0)
					}
				}
			}
		}
		return true // Ensure traversal continues
	})
}

// AnalyzeExternalMethod recursively analyzes functions, extracts parameters, and avoids reprocessing nodes
func AnalyzeExternalMethod(filename string, methodName string, depth int) {
	if visitedCalls[methodName] {
		return
	}

	visitedCalls[methodName] = true // Mark the method as visited to avoid duplication

	fset := token.NewFileSet()

	// Parse the external file (e.g., zine_maker.go)
	node, err := parser.ParseFile(fset, filename, nil, parser.AllErrors)
	if err != nil {
		log.Fatalf("Failed to parse external file: %v", err)
	}

	// Traverse the AST to find the method implementation for SetupZineRoutes or other functions
	ast.Inspect(node, func(n ast.Node) bool {
		if fn, ok := n.(*ast.FuncDecl); ok {
			if fn.Name.Name == methodName {
				// Print the function name with indentation based on depth
				fmt.Printf("%s%s\n", strings.Repeat("    ", depth), methodName)

				// Extract function parameters
				printFunctionParams(fn, depth)

				// Recursively inspect the body of the function to find function calls
				ast.Inspect(fn.Body, func(n ast.Node) bool {
					if call, ok := n.(*ast.CallExpr); ok {
						if funIdent, ok := call.Fun.(*ast.Ident); ok {
							// Get the name of the called function
							calledFunc := funIdent.Name

							// Print the nested function call with its arguments
							fmt.Printf("%s%s\n", strings.Repeat("    ", depth+1), calledFunc)
							printFunctionCallArgs(call, depth+2)

							// Process nested calls only if they're not reprocessed already
							for _, arg := range call.Args {
								if innerCall, ok := arg.(*ast.CallExpr); ok {
									// Handle nested function calls (arguments that are themselves function calls)
									printNestedFunctionCall(innerCall, depth+2)
								}
							}

							// Recursively analyze the called function at a deeper level
							AnalyzeExternalMethod(filename, calledFunc, depth+1)
						}
					}
					return true // Ensure traversal continues
				})
			}
		}
		return true // Ensure traversal continues
	})
}

// Print function parameters (name and type) with indentation
func printFunctionParams(fn *ast.FuncDecl, depth int) {
	if fn.Type.Params != nil && len(fn.Type.Params.List) > 0 {
		for _, param := range fn.Type.Params.List {
			for _, name := range param.Names {
				fmt.Printf("%sTakes %s (%s)\n", strings.Repeat("    ", depth+1), name, paramType(param.Type))
			}
		}
	}
}

// Print function call arguments (expression and value) with indentation
func printFunctionCallArgs(call *ast.CallExpr, depth int) {
	if len(call.Args) > 0 {
		for _, arg := range call.Args {
			if _, ok := arg.(*ast.CallExpr); !ok { // Avoid printing *ast.CallExpr nodes
				fmt.Printf("%sArg: %s\n", strings.Repeat("    ", depth), exprString(arg))
			}
		}
	}
}

// Print a nested function call (used when a function is passed as an argument)
func printNestedFunctionCall(call *ast.CallExpr, depth int) {
	if funIdent, ok := call.Fun.(*ast.Ident); ok {
		// Print the nested function name and its arguments
		fmt.Printf("%s%s\n", strings.Repeat("    ", depth), funIdent.Name)
		printFunctionCallArgs(call, depth+1)

		// Process nested function calls further
		for _, arg := range call.Args {
			if innerCall, ok := arg.(*ast.CallExpr); ok {
				printNestedFunctionCall(innerCall, depth+1)
			}
		}
	}
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

// Helper function to get the type of a parameter (as a string)
func paramType(expr ast.Expr) string {
	switch e := expr.(type) {
	case *ast.Ident:
		return e.Name
	case *ast.SelectorExpr:
		return fmt.Sprintf("%s.%s", paramType(e.X), e.Sel.Name)
	case *ast.StarExpr:
		return fmt.Sprintf("*%s", paramType(e.X))
	default:
		return fmt.Sprintf("%T", expr)
	}
}

