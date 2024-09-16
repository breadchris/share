package server

import (
	"fmt"
	"github.com/cosmos72/gomacro/fast"
	"github.com/cosmos72/gomacro/imports"
	"reflect"
	"testing"
)

func TestHandler(t *testing.T) {
	// Example Go source code as a string
	sourceCode := `
package main

import "fmt"

func main() {
	d := Div(
		Class("text-blue-500"),
	)
    fmt.Println(d.Render())
}
`

	// Line and position for the cursor (pretending we are over the function "goodbye")
	line := 6 // Example line
	pos := 7  // Example position

	// Modify the function
	modifiedSource, err := modifyFunction(sourceCode, "", line, pos)
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println("Modified Source Code:")
		fmt.Println(modifiedSource)
	}
}
func Cube(x float64) float64 {
	return x*x*x - 1 // intentionally bugged
}

func TestGoMacro(t *testing.T) {
	// 1. create the fast interpreter.
	ir := fast.New()

	// 2. switch to package "github.com/cosmos72/gomacro/example/earljwagner2"
	ir.ChangePackage("earljwagner2", "github.com/cosmos72/gomacro/example/earljwagner2")

	// 3. tell the interpreter to load the file "cube.go" into the current package
	ir.Eval(`
func Cube(x float64) float64 {
	return x*x*x - 1 // intentionally bugged
}
`)

	// 4. switch back to package "main"
	ir.ChangePackage("main", "main")

	// 5. tell the interpreter to import the package containing the interpreted function Cube() loaded from file
	ir.Eval(`import "github.com/cosmos72/gomacro/example/earljwagner2"`)

	// 6. execute interpreted Cube() loaded from file - and realise it's bugged
	xcube, _ := ir.Eval1("earljwagner2.Cube(3.0)")
	fmt.Printf("interpreted earljwagner2.Cube(3.0) = %f\n", xcube.Interface().(float64))

	// 7. tell the interpreter to switch to package "github.com/cosmos72/gomacro/example/earljwagner2"
	//    at REPL, one would instead type the following (note the quotes):
	//      package "github.com/cosmos72/gomacro/example/earljwagner2"
	ir.ChangePackage("earljwagner2", "github.com/cosmos72/gomacro/example/earljwagner2")

	// 8. the interpreted function Cube() can now be invoked without package prefix
	xcube, _ = ir.Eval1("Cube(4.0)")
	fmt.Printf("interpreted Cube(4.0) = %f\n", xcube.Interface().(float64))

	// 9. redefine the interpreted function Cube(), replacing the loaded one
	ir.Eval("func Cube(x float64) float64 { return x*x*x }")

	// 10. invoke the redefined function Cube() - the bug is solved :)
	xcube, _ = ir.Eval1("Cube(4.0)")
	fmt.Printf("interpreted Cube(4.0) = %f\n", xcube.Interface().(float64))

	// 11. note: compiled code will *NOT* automatically know about the bug-fixed Cube() living inside the interpreter.
	//    One solution is to stay inside the interpreter REPL and use interpreted functions.
	//    Another solution is to extract the bug-fixed function from the interpreter and use it,
	//    for example by storing it inside imports.Packages
	imports.Packages["github.com/cosmos72/gomacro/example/earljwagner2"] = imports.Package{
		Binds: map[string]reflect.Value{
			"Cube": reflect.ValueOf(Cube),
		},
	}
}
