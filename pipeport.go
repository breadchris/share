package main

import (
	"bufio"
	"context"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"github.com/urfave/cli/v2"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

const storageDir = "data/stream"

func NewPipePortCli() *cli.Command {
	return &cli.Command{
		Name:  "pipeport",
		Usage: "Stream the output of a command to an HTTP endpoint",
		Action: func(c *cli.Context) error {
			if c.Args().Len() < 1 {
				log.Fatal("Usage: stream-cli stream <command> <url>")
			}
			command := c.Args().Get(0)
			return streamCommandOutput(command)
		},
	}
}

func streamCommandOutput(command string) error {
	cmd := exec.Command("sh", "-c", command)
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to get stdout pipe: %w", err)
	}

	// TODO breadchris from config
	url := "http://localhost:8080/pipeport/" + uuid.NewString()

	println("Streaming to", url)

	go func() {
		_, err = http.Post(url, "text/plain", bufio.NewReader(stdout))
		if err != nil {
			log.Printf("Failed to send data: %v", err)
		}
	}()

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start command: %w", err)
	}

	return cmd.Wait()
}

func NewPipePort(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	err := os.MkdirAll(storageDir, 0755)
	if err != nil {
		log.Fatalf("Could not create storage directory: %v", err)
	}

	m.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		if r.Method == http.MethodPost {
			if id == "" {
				http.Error(w, "ID is required", http.StatusBadRequest)
				return
			}

			filePath := filepath.Join(storageDir, id)

			file, err := os.Create(filePath)
			if err != nil {
				http.Error(w, "Could not create file", http.StatusInternalServerError)
				return
			}
			defer file.Close()

			_, err = io.Copy(file, r.Body)
			if err != nil {
				http.Error(w, "Could not write to file", http.StatusInternalServerError)
				return
			}

			fmt.Fprintf(w, "Stream saved with ID: %s\n", id)
			return
		}

		if id == "" {
			var files []string
			err := filepath.Walk(storageDir, func(path string, info os.FileInfo, err error) error {
				if err != nil {
					return err
				}
				// add only files
				if info.IsDir() {
					return nil
				}
				files = append(files, strings.TrimPrefix(path, storageDir+"/"))
				return nil
			})
			if err != nil {
				http.Error(w, "Could not list files", http.StatusInternalServerError)
				return
			}

			ctx := context.WithValue(r.Context(), "baseURL", "pipeport")
			Div(
				H1(T("hello nolan")),
				Ul(
					Ch(Map(files, func(file string, _ int) *Node {
						return Li(
							A(Href("/retrieve/"+file), T(file)),
						)
					})),
				),
			).RenderPageCtx(ctx, w, r)
			return
		}

		filePath := filepath.Join(storageDir, id)
		file, err := os.Open(filePath)
		if err != nil {
			http.Error(w, "Could not open file", http.StatusInternalServerError)
			return
		}
		defer file.Close()

		io.Copy(w, file)
	})
	return m
}
