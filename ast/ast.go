package ast

import (
    "fmt"
    "go/ast"
    "go/parser"
    "go/token"
)

// RunASTParser runs the AST parsing logic for a Go file
func RunASTParser(filename string) {
    fset := token.NewFileSet()
    file, err := parser.ParseFile(fset, filename, nil, parser.AllErrors)
    if err != nil {
        fmt.Printf("Failed to parse Go file: %s\n", err)
        return
    }

    fmt.Printf("Package: %s\n", file.Name.Name)
    ast.Inspect(file, func(n ast.Node) bool {
        switch x := n.(type) {
        case *ast.FuncDecl:
            if x.Name.Name == "startServer" {
                ast.Inspect(x, func(m ast.Node) bool {
                    switch y := m.(type) {
                    case *ast.FuncDecl:
                        fmt.Println("  Function: ", y.Name.Name)
                        
                    }
                    return true
                })
            }
        }
        return true
    })
}
