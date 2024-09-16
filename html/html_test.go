package html

import (
	"bytes"
	"go/format"
	"go/printer"
	"go/token"
	"testing"
)

func TestHTML(t *testing.T) {
	var buf bytes.Buffer

	fset := token.NewFileSet()
	h := RenderHTML()

	cfg := &printer.Config{
		Mode:     printer.TabIndent,
		Tabwidth: 4,
	}

	err := cfg.Fprint(&buf, fset, h.RenderGoCode(fset))
	if err != nil {
		t.Fatal(err)
	}

	formattedCode, err := format.Source(buf.Bytes())
	if err != nil {
		t.Fatal(err)
	}

	println(string(formattedCode))
}
