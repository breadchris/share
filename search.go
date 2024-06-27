package main

import (
	"github.com/blevesearch/bleve"
	"io/fs"
	"io/ioutil"
)

type SearchIndex struct {
	Index bleve.Index
}

// TODO breadchris make sure I am using this right https://github.com/blevesearch/beer-search

func NewSearchIndex(indexPath string) (*SearchIndex, error) {
	idx, err := loadSearchIndex(indexPath)
	if err != nil {
		return nil, err
	}
	return &SearchIndex{Index: idx}, nil
}

func (s *SearchIndex) IndexDocument(id string, data any) error {
	return s.Index.Index(id, data)
}

func (s *SearchIndex) DeleteDocument(id string) error {
	return s.Index.Delete(id)
}

func (s *SearchIndex) Search(query string) (*bleve.SearchResult, error) {
	req := bleve.NewSearchRequest(bleve.NewQueryStringQuery(query))
	return s.Index.Search(req)
}

func loadSearchIndex(indexPath string) (bleve.Index, error) {
	mapping := bleve.NewIndexMapping()
	bleveIdx, err := bleve.Open(indexPath)
	if err == nil {
		return bleveIdx, nil
	}
	bleveIdx, err = bleve.New(indexPath, mapping)
	if err != nil {
		return nil, err
	}
	return bleveIdx, nil
}

// ProcessFileFunc defines the function type to process a file's contents.
type ProcessFileFunc func(name string, contents []byte) error

// WalkDirectory walks through all files in the specified directory, processes each file with processFunc, and writes the result to the searchIndex.
func WalkDirectory(fsys fs.FS, dir string, processFunc ProcessFileFunc) error {
	return fs.WalkDir(fsys, dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		file, err := fsys.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()
		contents, err := ioutil.ReadAll(file)
		if err != nil {
			return err
		}
		return processFunc(path, contents)
	})
}
