package db

import (
	"github.com/blevesearch/bleve"
	"io"
	"io/fs"
)

type SearchIndex struct {
	Index bleve.Index
}

// TODO breadchris make sure I am using this right https://github.com/blevesearch/beer-search

func LoadSearchIndex(indexPath string) (bleve.Index, error) {
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

func NewSearchIndex(indexPath string) (*SearchIndex, error) {
	idx, err := LoadSearchIndex(indexPath)
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

func (s *SearchIndex) Batch(b *bleve.Batch) error {
	return s.Index.Batch(b)
}

func (s *SearchIndex) Search(query string) (*bleve.SearchResult, error) {
	req := bleve.NewSearchRequest(bleve.NewQueryStringQuery(query))
	return s.Index.Search(req)
}

type ProcessFileFunc func(name string, contents []byte) error

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
		contents, err := io.ReadAll(file)
		if err != nil {
			return err
		}
		return processFunc(path, contents)
	})
}
