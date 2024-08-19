package main

import (
	"fmt"
	"testing"
)

func TestHTML(t *testing.T) {
	htmlInput := `<div class="container"><h1>Title</h1><p>This is a paragraph.</p></div>`
	goCode := ConvertHTMLToGoCode(htmlInput)
	fmt.Println(goCode)
}
