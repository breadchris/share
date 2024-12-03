package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"golang.org/x/net/html"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"
)

func SetupArticle(d deps.Deps) {
	articles := d.Docs.WithCollection("article")
	fileArticles, err := ParseArticles("data/Omnivore.md")
	if err != nil {
		panic(err)
	}

	al, err := articles.List()
	if err != nil {
		panic(err)
	}

	for _, u := range fileArticles {
		found := false
		for _, saved := range al {
			var s SavedArticle
			if err := json.Unmarshal(saved.Data, &s); err != nil {
				panic(err)
			}
			if u.URL == s.URL {
				found = true
			}
		}
		if !found {
			u.ID = uuid.New().String()
			if err := articles.Set(u.ID, u); err != nil {
				panic(err)
			}
		}
	}
}

func renderArticle(a SavedArticle) *Node {
	id := "g_" + a.ID
	u, err := url.Parse(a.URL)
	if err != nil {
		return P(Class("text-red-500"), Text(err.Error()))
	}
	img := a.SEOData.Image
	if img == "" {
		img = fmt.Sprintf("https://www.google.com/s2/favicons?domain=%s", u.Host)
	}
	return Li(
		Id(id),
		Class("flex flex-col justify-between gap-x-6 py-5"),
		Div(
			Class("flex flex-row justify-between"),
			Div(
				Class("flex min-w-0 gap-x-4"),
				Img(
					Alt(""),
					Class("size-12 flex-none rounded-full"),
					Src(img),
				),
				Div(
					Class("min-w-0 flex-auto"),
					A(Class("text-sm/6 font-semibold pointer-cursor"), Href(a.URL), Text(a.Title)),
					P(
						Class("mt-1 truncate text-xs/5"),
						Text(u.Host),
					),
				),
			),
			Div(
				Class("hidden shrink-0 sm:flex sm:flex-col sm:items-end"),
				//P(Class("text-sm/6"), Text(a.SEOData.OGDescription)),
				A(
					Class("mt-1 text-xs/5 text-gray-500 cursor-pointer"),
					HxPost("/"+a.ID),
					HxSwap("outerHTML"),
					HxTarget("#"+id),
					Time(Datetime(a.DateSaved.Format(time.RFC3339)), Text(a.DateSaved.Format("Jan 2, 2006"))),
				),
			),
		),
		Div(
			Class("p-3 shrink-0 sm:flex sm:flex-col sm:items-end text-gray-600"),
			P(Class("text-sm/6"), Text(a.SEOData.OGDescription)),
		),
	)
}

func NewArticle(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	articles := d.Docs.WithCollection("article")
	ctx := context.WithValue(context.Background(), "baseURL", "/articles")

	m.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		switch r.Method {
		case http.MethodPost:
			var a SavedArticle
			if err := articles.Get(id, &a); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			seoData, err := GetSEOMetadata(a.URL)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			fmt.Printf("SEO Data: %+v\n", seoData)

			a.SEOData = *seoData
			if err := articles.Set(a.ID, a); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if err := d.Docs.Set(a.ID, a); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			renderArticle(a).RenderPageCtx(ctx, w, r)
		case http.MethodGet:
			d, err := articles.List()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			f2 := Ul()
			for _, u := range d {
				var a SavedArticle
				if err := json.Unmarshal(u.Data, &a); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				f2.Children = append(f2.Children, renderArticle(a))
			}

			DefaultLayout(
				Div(
					Class("w-full max-w-2xl mx-auto"),
					Input(Class("input m-auto mt-10 w-3/4"), Type("text"), Placeholder("Search")),
					f2,
				)).RenderPageCtx(ctx, w, r)
		}
	})
	m.HandleFunc("/save", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			url := r.FormValue("url")
			if url == "" {
				http.Error(w, "URL is required", http.StatusBadRequest)
				return
			}

			a := SavedArticle{
				ID:        uuid.New().String(),
				URL:       url,
				DateSaved: time.Now(),
			}
			if err := articles.Set(a.URL, a); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		case http.MethodGet:
			DefaultLayout(
				Div(
					Form(
						Method("POST"),
						Input(
							Type("text"),
							Name("url"),
							Placeholder("URL"),
						),
						Button(
							Type("submit"),
							T("Save"),
						),
					),
				)).RenderPage(w, r)
		}
	})
	return m
}

type SavedArticle struct {
	ID        string
	Title     string
	URL       string
	DateSaved time.Time
	SEOData   SEOData
}

func ParseArticles(filePath string) ([]SavedArticle, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var articles []SavedArticle
	scanner := bufio.NewScanner(file)

	titleRegex := regexp.MustCompile(`- \[(.+?)\]\(https?://[^\)]+\)`)
	siteRegex := regexp.MustCompile(`site:: \[(.+?)\]\((https?://[^\)]+)\)`)
	dateRegex := regexp.MustCompile(`date-saved:: \[\[([^\]]+)\]\]`)

	var currentArticle *SavedArticle

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		if matches := titleRegex.FindStringSubmatch(line); matches != nil {
			if currentArticle != nil {
				articles = append(articles, *currentArticle)
			}
			currentArticle = &SavedArticle{
				Title: matches[1],
			}
			continue
		}

		if matches := siteRegex.FindStringSubmatch(line); matches != nil && currentArticle != nil {
			currentArticle.URL = matches[2]
		}

		if matches := dateRegex.FindStringSubmatch(line); matches != nil && currentArticle != nil {
			date, err := parseDate(matches[1])
			if err != nil {
				return nil, fmt.Errorf("failed to parse date: %v", err)
			}
			currentArticle.DateSaved = date
		}
	}

	if currentArticle != nil {
		articles = append(articles, *currentArticle)
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return articles, nil
}

func parseDate(dateStr string) (time.Time, error) {
	dateStr = strings.ReplaceAll(dateStr, "st", "")
	dateStr = strings.ReplaceAll(dateStr, "nd", "")
	dateStr = strings.ReplaceAll(dateStr, "rd", "")
	dateStr = strings.ReplaceAll(dateStr, "th", "")

	return time.Parse("Jan 2, 2006", dateStr)
}

type SEOData struct {
	Title         string
	Description   string
	Keywords      string
	Image         string
	OGTitle       string
	OGDescription string
}

func GetSEOMetadata(url string) (*SEOData, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("error fetching URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bad status code: %d", resp.StatusCode)
	}

	doc, err := html.Parse(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error parsing HTML: %w", err)
	}

	seoData := &SEOData{}

	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.ElementNode {
			if n.Data == "title" && n.FirstChild != nil {
				seoData.Title = n.FirstChild.Data
			}

			if n.Data == "meta" {
				var name, content string
				for _, attr := range n.Attr {
					switch attr.Key {
					case "name":
						name = attr.Val
					case "property":
						name = attr.Val // Open Graph uses "property" instead of "name"
					case "content":
						content = attr.Val
					}
				}

				switch strings.ToLower(name) {
				case "description":
					seoData.Description = content
				case "keywords":
					seoData.Keywords = content
				case "og:image", "twitter:image":
					seoData.Image = content
				case "og:title":
					seoData.OGTitle = content
				case "og:description":
					seoData.OGDescription = content
				}
			}
		}

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(doc)

	return seoData, nil
}
