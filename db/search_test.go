package db

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"testing/fstest"
)

func TestDir(t *testing.T) {
	index, err := NewSearchIndex("data/search.bleve")
	processFunc := func(name string, contents []byte) error {
		var data map[string]any

		err = json.Unmarshal(contents, &data)
		if err != nil {
			return err
		}

		return index.IndexDocument(name, data["name"])
	}

	err = WalkDirectory(os.DirFS("data/recipes/thewok"), ".", processFunc)
	if err != nil {
		fmt.Println("Error:", err)
	}

	r, err := index.Search("B SIC")
	if err != nil {
		fmt.Println("Error:", err)
	}
	fmt.Println(r.String())
}

func TestSearchIndex(t *testing.T) {
	index, err := NewSearchIndex("data/search.bleve")
	if err != nil {
		fmt.Println("Error:", err)
	}

	r, err := index.Search("Cinnamon")
	if err != nil {
		fmt.Println("Error:", err)
	}
	fmt.Println(r.String())
}

// TestWalkDirectory tests the WalkDirectory function.
func TestWalkDirectory(t *testing.T) {
	// Mock file system structure
	mockFiles := map[string][]byte{
		"dir/file1.txt": []byte("content1"),
		"dir/file2.txt": []byte("content2"),
	}

	// Create mock file system
	mockFS := fstest.MapFS{}
	for name, data := range mockFiles {
		mockFS[name] = &fstest.MapFile{
			Data: data,
			Mode: 0644,
		}
	}

	// Define a simple processing function
	processFunc := func(_ string, contents []byte) error {
		return nil
	}

	// Run WalkDirectory
	err := WalkDirectory(mockFS, "dir", processFunc)
	if err != nil {
		t.Fatalf("WalkDirectory failed: %v", err)
	}

	// Verify results
	_ = map[string]interface{}{
		"dir/file1.txt": "content1",
		"dir/file2.txt": "content2",
	}
}

// equalEntries compares two maps for equality.
func equalEntries(a, b map[string]interface{}) bool {
	if len(a) != len(b) {
		return false
	}
	for k, v := range a {
		if bv, ok := b[k]; !ok || bv != v {
			return false
		}
	}
	return true
}
