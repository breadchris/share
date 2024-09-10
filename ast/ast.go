package ast

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"log"
	"strings"
)

type FunctionCallGraph map[string][]string

// Global graph to store all function calls
var callGraph = make(FunctionCallGraph)

// TraverseAST parses a Go file and returns the function call graph for the specified method
func TraverseAST(filename string, targetMethod string) FunctionCallGraph {
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
					receiver := ident.Name
					fullMethod := fmt.Sprintf("%s.%s", receiver, methodName)

					// If this is the target method call (z.SetupZineRoutes), analyze it further
					if fullMethod == targetMethod {
						fmt.Printf("Found call to %s\n", fullMethod)
						// Analyze the external package (zine package) where SetupZineRoutes is defined
						AnalyzeExternalMethod("zine/zine.go", "SetupZineRoutes", 0)
					}
				}
			}
		}
		return true
	})
	return callGraph
}

// AnalyzeExternalMethod analyzes a specific function in an external file (e.g., SetupZineRoutes in zine package)
// It recursively analyzes functions, extracts parameters, and adds them to the call graph
func AnalyzeExternalMethod(filename string, methodName string, depth int) {
	// Avoid re-analyzing functions
	if _, visited := callGraph[methodName]; visited {
		return
	}

	fset := token.NewFileSet()

	// Parse the external file (e.g., zine_maker.go)
	node, err := parser.ParseFile(fset, filename, nil, parser.AllErrors)
	if err != nil {
		log.Fatalf("Failed to parse external file: %v", err)
	}

	// Initialize the call graph entry for this function
	callGraph[methodName] = []string{}

	// Traverse the AST and find the method implementation for SetupZineRoutes or other functions
	ast.Inspect(node, func(n ast.Node) bool {
		if fn, ok := n.(*ast.FuncDecl); ok {
			// Check if this is the method we're analyzing
			if fn.Name.Name == methodName {
				// Print the function name with indentation based on depth
				fmt.Printf("%s%s\n", strings.Repeat("   ", depth), methodName)

				// Extract function parameters
				printFunctionParams(fn, depth)

				// Recursively inspect the body of the function to find function calls
				ast.Inspect(fn.Body, func(n ast.Node) bool {
					// Look for function calls within the method body
					if call, ok := n.(*ast.CallExpr); ok {
						if funIdent, ok := call.Fun.(*ast.Ident); ok {
							// Get the name of the called function
							calledFunc := funIdent.Name

							// Extract and print function call arguments with indentation
							fmt.Printf("%sCalls %s\n", strings.Repeat("   ", depth+1), calledFunc)
							printFunctionCallArgs(call, depth+2)

							// Add the called function to the graph
							callGraph[methodName] = append(callGraph[methodName], calledFunc)

							// Recursively analyze the called function with increased depth
							AnalyzeExternalMethod(filename, calledFunc, depth+1)
						}
					}
					return true
				})
			}
		}
		return true
	})
}

// Print function parameters (name and type) with indentation
func printFunctionParams(fn *ast.FuncDecl, depth int) {
	if fn.Type.Params != nil && len(fn.Type.Params.List) > 0 {
		for _, param := range fn.Type.Params.List {
			for _, name := range param.Names {
				fmt.Printf("%sTakes %s (%s)\n", strings.Repeat("   ", depth+1), name, paramType(param.Type))
			}
		}
	}
}

// Print function call arguments (expression and value) with indentation
func printFunctionCallArgs(call *ast.CallExpr, depth int) {
	if len(call.Args) > 0 {
		for _, arg := range call.Args {
			fmt.Printf("%sArg: %s\n", strings.Repeat("   ", depth), exprString(arg))
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
