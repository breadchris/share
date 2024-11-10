package posts

import (
	"bytes"
	"fmt"
	"github.com/gosimple/slug"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/parser"
	"go.abhg.dev/goldmark/frontmatter"
	"golang.org/x/net/html"
	"io/fs"
	"io/ioutil"
	"log"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type Post struct {
	Slug            string     `yaml:"slug"`
	Title           string     `yaml:"title"`
	Tags            []string   `yaml:"tags"`
	CreatedAt       string     `yaml:"created_at"`
	Content         string     `yaml:"-"`
	TextContent     string     `yaml:"-"`
	Blocknote       string     `yaml:"blocknote"`
	CreatedAtParsed time.Time  `yaml:"-"`
	DOMNode         *html.Node `json:"-" yaml:"-"`
	HTML            string     `yaml:"html"`
}

func LoadPosts() ([]Post, error) {
	var posts []Post
	posts, err := loadPostsFromDir("breadchris/posts")
	if err != nil {
		return nil, fmt.Errorf("failed to load posts: %w", err)
	}

	for i := range posts {
		posts[i].CreatedAtParsed, err = time.Parse(time.RFC3339, posts[i].CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to parse created at: %w", err)
		}
	}

	sort.Slice(posts, func(i, j int) bool {
		return posts[i].CreatedAtParsed.After(posts[j].CreatedAtParsed)
	})
	return posts, nil
}

func loadPostsFromDir(dir string) ([]Post, error) {
	var posts []Post

	err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() && filepath.Ext(path) == ".md" {
			post, err := parseMarkdownFile(path)
			if err != nil {
				log.Printf("Failed to parse file %s: %v", path, err)
				return nil
			}
			post.Slug = slug.Make(post.Title)
			posts = append(posts, post)
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}

	return posts, nil
}

func parseMarkdownFile(path string) (Post, error) {
	var post Post

	content, err := ioutil.ReadFile(path)
	if err != nil {
		return post, fmt.Errorf("read file: %w", err)
	}

	md := goldmark.New(
		goldmark.WithExtensions(
			&frontmatter.Extender{},
		),
	)

	ctx := parser.NewContext()

	var buf bytes.Buffer
	if err := md.Convert(content, &buf, parser.WithContext(ctx)); err != nil {
		return post, fmt.Errorf("parse markdown: %w", err)
	}

	data := frontmatter.Get(ctx)
	if data != nil {
		if err = data.Decode(&post); err != nil {
			return post, fmt.Errorf("decode frontmatter: %w", err)
		}
	}

	post.Content = buf.String()
	post.DOMNode, err = html.Parse(strings.NewReader(post.Content))
	if err != nil {
		return post, fmt.Errorf("error parsing HTML: %v", err)
	}
	post.TextContent = ExtractText(post.DOMNode)
	return post, nil
}

// ExtractText extracts and returns all the text from an HTML node tree.
func ExtractText(n *html.Node) string {
	if n.Type == html.TextNode {
		return n.Data
	}

	text := ""
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		text += ExtractText(c)
	}

	return text
}
