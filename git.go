package main

import (
	"context"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/go-git/go-git/v5"
	"github.com/google/uuid"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func CloneRepo(repoURL string) (string, error) {
	if err := os.MkdirAll("./data/repos", 0755); err != nil {
		return "", fmt.Errorf("failed to create data directory: %w", err)
	}

	cloneOptions := &git.CloneOptions{
		URL:          repoURL,
		Progress:     os.Stdout,
		SingleBranch: true,
	}

	repoDir := fmt.Sprintf("./data/repos/%s", uuid.NewString())
	_, err := git.PlainClone(repoDir, false, cloneOptions)
	if err != nil {
		return "", fmt.Errorf("failed to clone repository: %w", err)
	}
	return repoDir, nil
}

func WalkGoFiles(f, fileRegex string) (string, error) {
	var goFilesContent strings.Builder

	err := filepath.Walk(f, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() {
			m, err := regexp.Match(fileRegex, []byte(info.Name()))
			if err != nil {
				return fmt.Errorf("failed to match file regex: %w", err)
			}

			if !m {
				return nil
			}

			content, err := ioutil.ReadFile(path)
			if err != nil {
				return fmt.Errorf("failed to read file %s: %w", path, err)
			}

			goFilesContent.WriteString(string(content))
			goFilesContent.WriteString("\n")
		}
		return nil
	})

	if err != nil {
		return "", err
	}

	return goFilesContent.String(), nil
}

type GitState struct {
	RepoURL   string
	FileRegex string
}

func NewGit(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			r.ParseForm()
			repoURL := r.Form.Get("/RepoURL")
			if repoURL == "" {
				http.Error(w, "repo form field is required", http.StatusBadRequest)
				return
			}
			fileRegex := r.Form.Get("/FileRegex")
			if fileRegex == "" {
				fileRegex = "*\\.go"
				return
			}
			d, err := CloneRepo(repoURL)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			content, err := WalkGoFiles(d, fileRegex)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Write([]byte(content))
			return
		}

		ctx := context.WithValue(r.Context(), "baseURL", "/git")
		DefaultLayout(
			Div(
				Class("container mx-auto p-4"),
				P(Text("clone a git repo (http url) and concat all regex")),
				Form(
					Action("/"),
					Method("POST"),
					BuildForm("", GitState{}),
					Button(Type("submit"), Text("Submit")),
				),
			),
		).RenderPageCtx(ctx, w, r)
	})
	return m
}
