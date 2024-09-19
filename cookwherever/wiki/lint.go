package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/adrg/frontmatter"
	"github.com/samber/lo"
)

func walkAllFilesInDir(dir string, ignoredPaths []string, cb func(dir, path string) error) error {
	return filepath.Walk(dir, func(p string, info os.FileInfo, e error) error {
		if e != nil {
			return e
		}

		// skip hidden directories
		if info.Name()[0] == '.' {
			return nil
		}

		pDir, _ := path.Split(p)

		if lo.ContainsBy(ignoredPaths, func(ignoredPath string) bool { return strings.Contains(pDir, ignoredPath) }) {
			println("skipping ignored path", pDir)
			return nil
		}

		ext := path.Ext(p)
		if ext != ".md" {
			return nil
		}

		if info.Mode().IsRegular() {
			return cb(dir, p)
		}
		return nil
	})
}

type Matter struct {
	Title string   `yaml:"title"`
	Tags  []string `yaml:"tags"`
}

func formatFrontMatter(m Matter) string {
	s := fmt.Sprintf("- title:: %s\n", m.Title)
	s += "- tags:: " + strings.Join(m.Tags, ", ") + "\n"
	return s
}

func lintPathForFrontmatter(base string, filepath string, dryRun bool) error {
	println("Formatting", path.Join(filepath))
	if dryRun {
		return nil
	}

	contents, err := os.Open(filepath)
	if err != nil {
		panic(err)
	}

	var matter Matter

	rest, err := frontmatter.Parse(contents, &matter)
	if err != nil {
		fmt.Println(err)
		return nil
	}

	newFrontMatter := formatFrontMatter(matter)

	ioutil.WriteFile(filepath, []byte(newFrontMatter+string(rest)), 0600)
	return nil
}

func main() {
	absPath, err := filepath.Abs("./")
	if err != nil {
		panic(err)
	}

	ignoredPaths := []string{}
	walkAllFilesInDir(absPath, ignoredPaths, func (base string, filepath string) error {
		return lintPathForFrontmatter(base, filepath, false)
	})
}
