package session

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"log/slog"
	"os"
	"path/filepath"
	"time"
)

// FileStore represents the session store using the file system.
type FileStore struct {
	directory   string
	stopCleanup chan bool
}

// NewFileStore returns a new FileStore instance, with a background cleanup goroutine
// that runs every 5 minutes to remove expired session data.
func NewFileStore(directory string) (*FileStore, error) {
	if err := os.MkdirAll(directory, 0755); err != nil {
		return nil, err
	}

	store := &FileStore{directory: directory}
	go store.startCleanup(5 * time.Minute)
	return store, nil
}

// sessionData represents the data structure saved in the file.
type sessionData struct {
	Token  string    `json:"token"`
	Data   []byte    `json:"data"`
	Expiry time.Time `json:"expiry"`
}

// Find returns the data for a given session token from the FileStore instance.
func (f *FileStore) Find(token string) ([]byte, bool, error) {
	path := filepath.Join(f.directory, token+".json")
	file, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil, false, nil
	} else if err != nil {
		return nil, false, err
	}

	var s sessionData
	if err := json.Unmarshal(file, &s); err != nil {
		return nil, false, err
	}

	if s.Expiry.Before(time.Now()) {
		return nil, false, nil
	}

	return s.Data, true, nil
}

// Commit adds a session token and data to the FileStore instance with the
// given expiry time. If the session token already exists, then the data and expiry
// time are updated.
func (f *FileStore) Commit(token string, data []byte, expiry time.Time) error {
	s := sessionData{
		Token:  token,
		Data:   data,
		Expiry: expiry,
	}

	file, err := json.Marshal(s)
	if err != nil {
		return err
	}

	path := filepath.Join(f.directory, token+".json")
	return os.WriteFile(path, file, 0644)
}

// Delete removes a session token and corresponding data from the FileStore instance.
func (f *FileStore) Delete(token string) error {
	path := filepath.Join(f.directory, token+".json")
	err := os.Remove(path)
	if os.IsNotExist(err) {
		return nil
	}
	return err
}

func (f *FileStore) startCleanup(interval time.Duration) {
	f.stopCleanup = make(chan bool)
	ticker := time.NewTicker(interval)
	for {
		select {
		case <-ticker.C:
			err := f.deleteExpired(context.Background())
			if err != nil {
				slog.Error("failed to delete expired sessions", "error", err)
			}
		case <-f.stopCleanup:
			ticker.Stop()
			return
		}
	}
}

func (f *FileStore) StopCleanup() {
	if f.stopCleanup != nil {
		f.stopCleanup <- true
	}
}

func (f *FileStore) deleteExpired(ctx context.Context) error {
	files, err := ioutil.ReadDir(f.directory)
	if err != nil {
		return err
	}

	for _, file := range files {
		path := filepath.Join(f.directory, file.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		var s sessionData
		if err := json.Unmarshal(data, &s); err != nil {
			return err
		}

		if s.Expiry.Before(time.Now()) {
			if err := os.Remove(path); err != nil {
				return err
			}
		}
	}

	return nil
}
