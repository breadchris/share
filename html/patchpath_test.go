package html

import (
	"testing"
)

type Ab struct {
	B string   `json:"b"`
	C Ac       `json:"c"`
	D []string `json:"d"`
	E []Ad     `json:"e"`
}

type Ad struct {
	Model
	D string `json:"d"`
}

type Ac struct {
	Model
	D string `json:"d"`
	E string `json:"e"`
}

func TestPatchPath(t *testing.T) {
	a := &Ab{}
	p := lookupPatchPath(a, &a.B)
	if p != "/b" {
		t.Fatalf("Expected /b, got %s", p)
	}

	p = lookupPatchPath(a, &a.C.D)
	if p != "/c/d" {
		t.Fatalf("Expected /c/d, got %s", p)
	}

	p = lookupPatchPath(a, &a.C.E)
	if p != "/c/e" {
		t.Fatalf("Expected /c/e, got %s", p)
	}
}
