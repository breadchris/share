package db

import (
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/models"
	xmodels "github.com/breadchris/share/xctf/models"
	"github.com/tidwall/gjson"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type DB[T any] struct {
	mu       sync.RWMutex
	store    map[string]T
	dir      string
	watchers map[string]time.Time
}

func NewDB[T any](dir string) (*DB[T], error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	db := &DB[T]{
		store:    make(map[string]T),
		dir:      dir,
		watchers: make(map[string]time.Time),
	}

	err := db.loadFiles()
	if err != nil {
		return nil, err
	}

	go db.watchFiles()

	return db, nil
}

func (s *DB[T]) List() []T {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []T
	for _, v := range s.store {
		list = append(list, v)
	}
	return list
}

func (s *DB[T]) Get(id string) (T, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	value, ok := s.store[id]
	return value, ok
}

// Set stores a value with the given id and saves it to a file
func (s *DB[T]) Set(id string, v T) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.store[id] = v
	filePath := filepath.Join(s.dir, id+".json")

	data, err := json.Marshal(v)
	if err != nil {
		return err
	}

	err = ioutil.WriteFile(filePath, data, 0644)
	if err != nil {
		return err
	}

	s.watchers[filePath] = time.Now()
	return nil
}

// Filter allows filtering the database using a gjson path
func (s *DB[T]) Filter(query string) []T {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []T
	for _, value := range s.store {
		data, err := json.Marshal(value)
		if err != nil {
			continue
		}

		// Use gjson to check if the query matches
		if gjson.GetBytes(data, query).Exists() {
			result = append(result, value)
		}
	}
	return result
}

// Load all files in the directory into the store
func (s *DB[T]) loadFiles() error {
	files, err := ioutil.ReadDir(s.dir)
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

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

func (s *DB[T]) loadFile(id string) error {
	filePath := filepath.Join(s.dir, id+".json")
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return err
	}

	var value T
	err = json.Unmarshal(data, &value)
	if err != nil {
		return err
	}

	s.mu.Lock()
	s.store[id] = value
	s.mu.Unlock()

	return nil
}

func (s *DB[T]) watchFiles() {
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

func LoadDB(dsn string) *gorm.DB {
	var (
		db  *gorm.DB
		err error
	)
	if strings.HasPrefix(dsn, "postgres://") {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatalf("Failed to create db: %v", err)
		}
	} else if strings.HasPrefix(dsn, "sqlite://") {
		dsn = strings.TrimPrefix(dsn, "sqlite://")
		db, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatalf("Failed to create db: %v", err)
		}
	} else {
		log.Fatalf("Unknown db: %s", dsn)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Identity{},
		&models.Group{},
		&models.GroupMembership{},
		&models.Food{},
		&models.FoodName{},
		&models.Prompt{},
		&models.PromptRun{},
		&models.Page{},
		&models.Recipe{},
		&models.Tag{},
		&models.Ingredient{},
		&models.Equipment{},
		&models.Direction{},
		&models.PromptContext{},

		// xctf models
		&xmodels.Competition{},
		&xmodels.CompetitionGroup{},
	); err != nil {
		log.Fatalf("Failed to migrate db: %v", err)
	}
	return db
}
