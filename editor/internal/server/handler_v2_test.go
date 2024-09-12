package server

import (
	"fmt"
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
	modifiedSource, err := modifyFunction(sourceCode, line, pos)
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println("Modified Source Code:")
		fmt.Println(modifiedSource)
	}
}
