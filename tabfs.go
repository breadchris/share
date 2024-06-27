package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
)

const (
	maxMessageSize = 1024 * 1024
	dirPath        = "tabs_data"
)

var (
	writeLock sync.Mutex
	waiters   map[uint64]*resumeData
	idCounter uint64
)

type resumeData struct {
	id   uint64
	data []byte
}

func init() {
	waiters = make(map[uint64]*resumeData)
}

func readOrDie(r *http.Request, size int64) ([]byte, error) {
	data := make([]byte, size)
	_, err := r.Body.Read(data)
	if err != nil {
		return nil, fmt.Errorf("read error: %w", err)
	}
	return data, nil
}

func writeOrDie(w http.ResponseWriter, data []byte) {
	_, err := w.Write(data)
	if err != nil {
		log.Fatalf("write error: %v", err)
	}
}

func doExchange(id uint64, w http.ResponseWriter, r *http.Request) error {
	data, err := readOrDie(r, maxMessageSize)
	if err != nil {
		return err
	}

	req := &resumeData{
		id:   id,
		data: data,
	}

	writeLock.Lock()
	waiters[id] = req
	writeLock.Unlock()

	// Simulate waiting for a response by writing the data to a file
	filename := filepath.Join(dirPath, fmt.Sprintf("tab_%d.json", id))
	err = ioutil.WriteFile(filename, data, 0644)
	if err != nil {
		return fmt.Errorf("file write error: %w", err)
	}

	return nil
}

func readerMain() {
	for {
		files, err := ioutil.ReadDir(dirPath)
		if err != nil {
			log.Fatalf("directory read error: %v", err)
		}

		writeLock.Lock()
		for _, file := range files {
			if file.IsDir() {
				continue
			}

			filePath := filepath.Join(dirPath, file.Name())
			data, err := ioutil.ReadFile(filePath)
			if err != nil {
				log.Printf("file read error: %v", err)
				continue
			}

			var id uint64
			if n, err := fmt.Sscanf(file.Name(), "tab_%d.json", &id); n == 1 && err == nil {
				if req, exists := waiters[id]; exists {
					req.data = data
					delete(waiters, id)
					err = os.Remove(filePath)
					if err != nil {
						log.Printf("file delete error: %v", err)
					}
				}
			}
		}
		writeLock.Unlock()
	}
}

func exchangeHandler(w http.ResponseWriter, r *http.Request) {
	idCounter++
	id := idCounter
	err := doExchange(id, w, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := waiters[id].data
	writeOrDie(w, data)
}

func makeTabFS() {
	err := os.MkdirAll(dirPath, 0755)
	if err != nil {
		log.Fatalf("directory creation error: %v", err)
	}

	go readerMain()

	http.HandleFunc("/exchange", exchangeHandler)
	port := 8080
	log.Printf("Listening on port %d", port)
	log.Fatal(http.ListenAndServe(":"+strconv.Itoa(port), nil))
}
