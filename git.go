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

func WalkGoFiles(f string) (string, error) {
	var goFilesContent strings.Builder

	err := filepath.Walk(f, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && strings.HasSuffix(path, ".go") {
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
	RepoURL string
}

func NewGit(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			r.ParseForm()
			repoURL := r.Form.Get("RepoURL")
			if repoURL == "" {
				http.Error(w, "repo form field is required", http.StatusBadRequest)
				return
			}
			content, err := RepoGoFiles(repoURL)
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
				P(T("clone a git repo (http url) and concat all .go files")),
				Form(
					Action("/"),
					Method("POST"),
					BuildForm("", GitState{}),
				),
			),
		).RenderPageCtx(ctx, w, r)
	})
	return m
}

func RepoGoFiles(repoURL string) (string, error) {
	d, err := CloneRepo(repoURL)
	if err != nil {
		return "", err
	}

	content, err := WalkGoFiles(d)
	if err != nil {
		return "", err
	}

	return content, nil
}
