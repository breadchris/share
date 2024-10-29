package figma

import (
	"fmt"
	"github.com/breadchris/share/config"
	"log"
	"testing"
)

func TestFigma(t *testing.T) {
	c := config.New()
	figmaFile, err := FetchFigmaFile(c, "6BVGwjVsfmIbRA85vjCCS1")
	if err != nil {
		log.Fatalf("Failed to fetch Figma file: %v", err)
	}

	// Print the file structure
	fmt.Printf("Figma File: %s\n", figmaFile.Name)
	PrintFigmaNodes(figmaFile.Document, "")
}
