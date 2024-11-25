package html

import (
	"testing"
)

type Ab struct {
	B string `json:"b"`
	C Ac     `json:"c"`
}

type Ac struct {
	D string `json:"d"`
}

func TestPatchPath(t *testing.T) {
	a := &Ab{}
	p := lookupPatchPath(a, &a.B)
	if p != "/b" {
		t.Fatalf("Expected /b, got %s", p)
	}

	// TODO breadchris recursive
	p = lookupPatchPath(a, &(a.C.D))
	if p != "/c/d" {
		t.Fatalf("Expected /c/d, got %s", p)
	}
}
