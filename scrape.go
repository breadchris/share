package main

import (
	"encoding/json"
	"github.com/PuerkitoBio/goquery"
	"github.com/geziyor/geziyor"
	"github.com/geziyor/geziyor/client"
	"github.com/pkg/errors"
	"log/slog"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"sync"
)

var (
	dup  = map[string]bool{}
	lock = sync.Mutex{}
)

type Crawler interface {
	Crawl(url string) error
}

type crawler struct {
}

func NewCrawler() *crawler {
	return &crawler{}
}

func (c *crawler) Crawl(nurl string) error {
	purl, err := url.Parse(nurl)
	if err != nil {
		return errors.Wrapf(err, "error: parse URL %s\n", nurl)
	}

	d := path.Join("data", "sites", "raw", purl.Host)
	if err = os.MkdirAll(d, 0755); err != nil {
		return errors.Wrapf(err, "error: create directory %s\n", d)
	}

	g := geziyor.NewGeziyor(&geziyor.Options{
		StartURLs:          []string{nurl},
		ParseFunc:          c.linksParse(purl),
		ConcurrentRequests: 10,
	})
	g.Start()

	f := path.Join("data", "sites", "raw", purl.Host, "dup.json")
	fh, err := os.Create(f)
	if err != nil {
		return errors.Wrapf(err, "error: create file %s\n", f)
	}
	defer fh.Close()

	err = json.NewEncoder(fh).Encode(dup)
	if err != nil {
		return errors.Wrapf(err, "error: write file %s\n", f)
	}
	return nil
}

func (c *crawler) linksParse(purl *url.URL) func(g *geziyor.Geziyor, r *client.Response) {
	rawDir := path.Join("data", "sites", "raw")

	return func(g *geziyor.Geziyor, r *client.Response) {
		// Check if this is an html page, if not return
		if !r.IsHTML() {
			return
		}

		// TODO breadchris use bucket to store this file
		err := c.saveURLToFolder(rawDir, r.Request.URL, r.Body)
		if err != nil {
			err = errors.Wrapf(err, "error: save raw content for %s\n", r.Request.URL.String())
			slog.Error("error scraping", "err", err)
			return
		}

		if r == nil || r.HTMLDoc == nil {
			return
		}

		selection := r.HTMLDoc.Find("a[href]")
		if selection == nil {
			return
		}

		requestURL := r.Request.URL

		selection.Each(func(i int, s *goquery.Selection) {
			val, _ := s.Attr("href")
			u, err := url.Parse(val)
			if err != nil {
				slog.Error("unable to parse url", "error", err)
				return
			}

			if u.Host != "" && u.Host != purl.Host {
				return
			}

			u = requestURL.ResolveReference(u)
			u.Fragment = ""

			queue := false
			lock.Lock()
			if !dup[u.String()] {
				dup[u.String()] = true
				queue = true
			}
			lock.Unlock()

			if queue {
				// TODO breadchris merge crawling queue code https://github.com/geziyor/geziyor/pull/59/files
				g.Get(u.String(), c.linksParse(purl))
			}
		})
	}
}

func (c *crawler) saveURLToFolder(dir string, u *url.URL, body []byte) error {
	host := u.Hostname()

	folderPath := filepath.Join(dir, host, u.Path)
	if err := os.MkdirAll(folderPath, 0755); err != nil {
		return errors.Wrapf(err, "error: create directory %s\n", folderPath)
	}

	filename := filepath.Base(u.Path)
	if filename == "" || filename == "." {
		filename = "index.html"
	}

	ext := filepath.Ext(filename)
	if ext == "" {
		filename = "index.html"
	}

	filePath := filepath.Join(folderPath, filename)
	err := os.WriteFile(filePath, body, 0644)
	if err != nil {
		return errors.Wrapf(err, "error: write file %s\n", filePath)
	}

	return nil
}
