package db

import (
	"encoding/json"
	"fmt"
	"github.com/tidwall/gjson"
	"io/ioutil"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type DBAny struct {
	mu       sync.RWMutex
	store    map[string][]byte
	dir      string
	watchers map[string]time.Time
}

func NewDBAny(dir string) (*DBAny, error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	db := &DBAny{
		store:    make(map[string][]byte),
		dir:      dir,
		watchers: make(map[string]time.Time),
	}

	err := db.loadFiles()
	if err != nil {
		return nil, err
	}

	//go db.watchFiles()

	return db, nil
}

func (s *DBAny) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.store = make(map[string][]byte)

	files, err := os.ReadDir(s.dir)
	if err != nil {
		return
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".json" {
			filePath := filepath.Join(s.dir, file.Name())
			os.Remove(filePath)
		}
	}
}

func (s *DBAny) List() []any {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []any
	for _, v := range s.store {
		list = append(list, v)
	}
	return list
}

func (s *DBAny) Get(id string, v any) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	value, ok := s.store[id]
	if !ok {
		return false
	}

	err := json.Unmarshal(value, v)
	if err != nil {
		return false
	}
	return true
}

// Set stores a value with the given id and saves it to a file
func (s *DBAny) Set(id string, v any) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	filePath := filepath.Join(s.dir, id+".json")

	data, err := json.Marshal(v)
	if err != nil {
		return err
	}

	s.store[id] = data
	err = ioutil.WriteFile(filePath, data, 0644)
	if err != nil {
		return err
	}

	//s.watchers[filePath] = time.Now()
	return nil
}

func (s *DBAny) Filter(query string) []any {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []any
	for _, value := range s.store {
		data, err := json.Marshal(value)
		if err != nil {
			continue
		}

		if gjson.GetBytes(data, query).Exists() {
			result = append(result, value)
		}
	}
	return result
}

func (s *DBAny) loadFiles() error {
	files, err := os.ReadDir(s.dir)
	if err != nil {
		return err
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".json" {
			id := file.Name()[:len(file.Name())-5]
			err := s.loadFile(id)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *DBAny) loadFile(id string) error {
	filePath := filepath.Join(s.dir, id+".json")
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	s.mu.Lock()
	s.store[id] = data
	s.mu.Unlock()

	return nil
}

func (s *DBAny) watchFiles() {
	for {
		time.Sleep(1 * time.Second)

		s.mu.RLock()
		for filePath, lastModTime := range s.watchers {
			fileInfo, err := os.Stat(filePath)
			if err != nil {
				continue
			}

			if fileInfo.ModTime().After(lastModTime) {
				id := filepath.Base(filePath[:len(filePath)-5])
				err := s.loadFile(id)
				if err != nil {
					fmt.Println("Error reloading file:", err)
				} else {
					s.watchers[filePath] = fileInfo.ModTime()
				}
			}
		}
		s.mu.RUnlock()
	}
}
