package breadchris

import (
	"fmt"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	"github.com/snabb/sitemap"
	"golang.org/x/net/html"
	"io"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

func StaticSiteGenerator() error {
	domain := "breadchris.com"
	domainDir := path.Join("data", "sites", "generated", domain)
	outputDir := path.Join(domainDir, "latest")

	baseURL := "http://localhost:8080/" + domainDir + "/latest"

	if _, err := os.Stat(outputDir); err == nil {
		backupDir := path.Join(domainDir, time.Now().Format("2006-01-02-15-04-05"))
		if err := os.Rename(outputDir, backupDir); err != nil {
			return fmt.Errorf("failed to backup output directory: %v", err)
		}
		fmt.Printf("Backed up output directory to %s\n", backupDir)
	}

	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %v", err)
	}

	posts, err := loadPosts()
	if err != nil {
		return fmt.Errorf("failed to load posts: %w", err)
	}

	uploads := path.Join(outputDir, "data/uploads")
	if err := os.MkdirAll(uploads, 0755); err != nil {
		return fmt.Errorf("failed to create directories for %s: %w", uploads, err)
	}
	for _, p := range posts {
		urls := ExtractLinksAndSources(p.DOMNode)
		for _, u := range urls {
			if strings.HasPrefix(u, "/data") {
				// TODO breadchris strip all path except for file name
				dataPath := u[1:]
				newDataPath := path.Join(outputDir, dataPath)
				f, err := os.ReadFile(dataPath)
				if err != nil {
					return fmt.Errorf("failed to read file %s: %w", dataPath, err)
				}

				if err := os.WriteFile(newDataPath, f, 0644); err != nil {
					return fmt.Errorf("failed to write file %s: %w", newDataPath, err)
				}
			}
		}
	}

	err = GenerateSitemap(posts, baseURL, path.Join(outputDir, "sitemap.xml"))
	if err != nil {
		return fmt.Errorf("failed to generate sitemap: %v", err)
	}

	if err := filepath.WalkDir("breadchris/static", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return fmt.Errorf("failed to walk static directory: %w", err)
		}

		if d.IsDir() {
			return nil
		}

		relPath := strings.TrimPrefix(path, "breadchris/")

		outputPath := filepath.Join(outputDir, relPath)
		if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
			return fmt.Errorf("failed to create directories for %s: %w", outputPath, err)
		}

		f, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read file %s: %w", path, err)
		}

		if err := os.WriteFile(outputPath, f, 0644); err != nil {
			return fmt.Errorf("failed to write file %s: %w", outputPath, err)
		}
		return nil
	}); err != nil {
		return fmt.Errorf("failed to copy static directory: %v", err)
	}

	d := deps.Deps{
		Config: config.AppConfig{
			Blog: config.BlogConfig{
				BaseURL: baseURL,
			},
		},
	}
	mux := New(d)
	for _, route := range NewRoutes(d) {
		if route.Ignore {
			continue
		}
		if route.Values != nil {
			for k, vals := range route.Values {
				for _, v := range vals {
					// TODO breadchris check go tests to see how they do this?
					p := strings.Replace(route.Path, "{"+k+"}", v, -1)
					p = strings.Replace(p, "{"+k+"...}", v, -1)
					if err = renderRoute(mux, p, outputDir); err != nil {
						return fmt.Errorf("failed to render route: %v", err)
					}
				}
				// TODO breadchris check go tests to see how they do this?
				p := strings.Replace(route.Path, "{"+k+"}", "", -1)
				p = strings.Replace(p, "{"+k+"...}", "", -1)
				if err = renderRoute(mux, p, outputDir); err != nil {
					return fmt.Errorf("failed to render route: %v", err)
				}
			}
		} else {
			if err = renderRoute(mux, route.Path, outputDir); err != nil {
				return fmt.Errorf("failed to render route: %v", err)
			}
		}
	}
	return nil
}

func GenerateSitemap(posts []Post, baseURL, outputPath string) error {
	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create sitemap file: %w", err)
	}
	defer f.Close()

	sw := sitemap.New()

	t := time.Now()
	sw.Add(&sitemap.URL{
		Loc:     baseURL,
		LastMod: &t,
	})

	for _, post := range posts {
		postURL := fmt.Sprintf("%s/blog/%s", baseURL, post.Slug)
		sw.Add(&sitemap.URL{
			Loc:     postURL,
			LastMod: &post.CreatedAtParsed,
		})
	}
	sw.Add(&sitemap.URL{
		Loc:     baseURL + "/tags/",
		LastMod: &t,
	})
	sw.Add(&sitemap.URL{
		Loc:     baseURL + "/resume",
		LastMod: &t,
	})
	sw.Add(&sitemap.URL{
		Loc:     baseURL + "/talks",
		LastMod: &t,
	})
	if _, err := sw.WriteTo(f); err != nil {
		return fmt.Errorf("failed to close sitemap: %w", err)
	}
	return nil
}

type Route struct {
	Path    string
	Handler http.HandlerFunc
	Values  map[string][]string
	Ignore  bool
}

type RouteOption func(*Route)

func WithValues(values map[string][]string) RouteOption {
	return func(r *Route) {
		r.Values = values
	}
}

func Ignore() RouteOption {
	return func(r *Route) {
		r.Ignore = true
	}
}

func NewRoute(path string, handler http.HandlerFunc, o ...RouteOption) Route {
	r := Route{Path: path, Handler: handler}
	for _, f := range o {
		f(&r)
	}
	return r
}

// TODO breadchris also need to rewrite
func ExtractLinksAndSources(n *html.Node) []string {
	var links []string

	if n.Type == html.ElementNode {
		for _, attr := range n.Attr {
			if attr.Key == "href" || attr.Key == "src" {
				links = append(links, attr.Val)
			}
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		links = append(links, ExtractLinksAndSources(c)...)
	}
	return links
}

func renderRoute(mux *http.ServeMux, p string, outputDir string) error {
	req := httptest.NewRequest("GET", p, nil)
	rr := httptest.NewRecorder()

	mux.ServeHTTP(rr, req)

	rec := rr.Result()
	if rec.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to render route %s: status code %d", p, rec.StatusCode)
	}

	filePath := path.Join(outputDir, p)
	if p == "/" {
		filePath = path.Join(outputDir, "index.html")
	} else {
		filePath = path.Join(outputDir, strings.Trim(p, "/"), "index.html")
	}

	if err := os.MkdirAll(path.Dir(filePath), 0755); err != nil {
		return fmt.Errorf("failed to create directories for %s: %v", filePath, err)
	}

	body, err := io.ReadAll(rec.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %v", err)
	}
	if err := os.WriteFile(filePath, body, 0644); err != nil {
		return fmt.Errorf("failed to write file %s: %v", filePath, err)
	}

	fmt.Printf("Generated file for route: %s at %s\n", p, filePath)
	return nil
}
