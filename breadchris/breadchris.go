package breadchris

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/gosimple/slug"
	"github.com/samber/lo"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/parser"
	"go.abhg.dev/goldmark/frontmatter"
	"golang.org/x/net/html"
	"gopkg.in/yaml.v3"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

func loadPosts() ([]Post, error) {
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

func NewRoutes(d deps.Deps) []Route {
	posts, err := loadPosts()
	if err != nil {
		log.Fatalf("Failed to load posts: %v", err)
	}
	tags := map[string]any{}
	for _, post := range posts {
		for _, tag := range post.Tags {
			tags[tag] = struct{}{}
		}
	}

	ctx := context.WithValue(context.Background(), "baseURL", d.Config.Blog.BaseURL)

	routes := []Route{
		NewRoute(
			"/", ServeNodeCtx(ctx, RenderHome(HomeState{
				Posts: lo.Filter(posts, func(post Post, i int) bool {
					for _, tag := range post.Tags {

						if strings.HasPrefix(tag, "blog") {
							return true
						}
					}
					return false
				}),
			})),
		),
		NewRoute("/omnivore/{id...}", func(w http.ResponseWriter, r *http.Request) {
			id := r.PathValue("id")
			intID := 0
			if id != "" {
				intID, err = strconv.Atoi(id)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
			}

			content, err := os.ReadFile("/Users/hacked/Documents/GitHub/notes/pages/Omnivore.md")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			re := regexp.MustCompile(`site:: \[.*?\]\((.*?)\)`)

			matches := re.FindAllStringSubmatch(string(content), -1)

			var urls []string
			for _, match := range matches {
				if len(match) > 1 {
					urls = append(urls, match[1])
				}
			}
			url := urls[intID]
			DefaultLayout(
				Div(
					Class("space-x-4"),
					A(Href(url), T(url)),
					If(intID > 0, A(Href(fmt.Sprintf("/breadchris/omnivore/%d", intID-1)), T("Previous")), Nil()),
					If(intID < len(urls)-1, A(Href(fmt.Sprintf("/breadchris/omnivore/%d", intID+1)), T("Next")), Nil()),
					Iframe(Src(url), Attrs(map[string]string{
						"width":  "100%",
						"height": "100%",
					})),
				)).RenderPage(w, r)
		}),
		NewRoute("/static/", func(w http.ResponseWriter, r *http.Request) {
			http.StripPrefix(
				"/static/",
				http.FileServer(http.Dir("breadchris/static")),
			).ServeHTTP(w, r)
		}, Ignore()),
		NewRoute("/tags/{tag...}", func(w http.ResponseWriter, r *http.Request) {
			t := r.PathValue("tag")
			if t == "" {
				var tagNodes []*Node
				for tag := range tags {
					tagNodes = append(tagNodes, Li(Class("post-tag"),
						A(Href(fmt.Sprintf("/tags/%s", tag)), T(tag)),
					))
				}

				ServeNodeCtx(ctx, PageLayout(
					Div(
						H1(Class("my-6"), T("Tags")),
						Ul(Class("post-tags"), Ch(tagNodes)),
					),
				))(w, r)
				return
			}

			var p []Post
			for _, post := range posts {
				for _, tag := range post.Tags {
					if tag == t {
						p = append(p, post)
					}
				}
			}
			PageLayout(
				Div(
					H1(Class("my-6 text-4xl"), T(t)),
					Ch(lo.Map(p, func(post Post, i int) *Node {
						return newArticlePreview(post)
					})),
				),
			).RenderPageCtx(ctx, w, r)
		}, WithValues(map[string][]string{
			"tag": lo.Keys(tags),
		})),
		NewRoute("/new/render", func(w http.ResponseWriter, r *http.Request) {
			content := r.FormValue("content")
			md := goldmark.New()
			var buf bytes.Buffer
			if err := md.Convert([]byte(content), &buf); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			Div(
				T(buf.String()),
				Script(T("hljs.highlightAll();")),
			).RenderPageCtx(ctx, w, r)
		}),
		NewRoute("/new", func(w http.ResponseWriter, r *http.Request) {
			u, err := d.Session.GetUserID(r.Context())
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if r.Method == "POST" {
				title := r.FormValue("title")
				tags := strings.Split(r.FormValue("tags"), ",")
				content := r.FormValue("markdown")
				blocknote := r.FormValue("blocknote")
				p := Post{
					Title:     title,
					Tags:      tags,
					CreatedAt: time.Now().Format(time.RFC3339),
					Content:   content,
					Blocknote: blocknote,
				}
				posts = append(posts, p)
				err := writeMarkdownFile(fmt.Sprintf("breadchris/posts/%s.md", slug.Make(title)), p)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
				}
				http.Redirect(w, r, "/", http.StatusSeeOther)
				return
			}
			type Props struct {
				ProviderURL string `json:"provider_url"`
				Room        string `json:"room"`
				Username    string `json:"username"`
			}
			props := Props{
				ProviderURL: d.Config.Blog.YJSURL,
				Room:        "blog",
				Username:    u,
			}
			b, err := json.Marshal(props)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			PageLayout(
				Div(
					Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css"), Rel("stylesheet"), Type("text/css")),
					Link(Href("/static/editor.css"), Rel("stylesheet"), Type("text/css")),
					Script(Src("https://cdn.tailwindcss.com")),
					Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
					Script(Src("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js")),
					Style(T(`
					 h1 { font-size: 2em; }
					 h2 { font-size: 1.5em; }
					 h3 { font-size: 1.17em; }
					 h4 { font-size: 1.00em; }
					 h5 { font-size: 0.8em; }
				 `)),
					Class("w-full max-w-2xl mx-auto"),
					Form(
						Method("POST"),
						Action("/new"),
						Class("flex flex-col space-y-4"),
						//TextArea(
						//	Name("content"),
						//	Class("textarea w-full"),
						//	Placeholder("Content"),
						//	Attr("hx-post", "/new/render"),
						//	Attr("hx-trigger", "keyup changed delay:500ms"),
						//	Attr("hx-target", "#preview"),
						//),
						Input(Type("hidden"), Name("markdown"), Id("markdown")),
						Input(Type("hidden"), Name("blocknote"), Id("blocknote")),
						Div(Id("editor"), Attrs(map[string]string{
							"props": string(b),
						})),
						Div(Class("flex flex-row space-x-4"),
							Input(Type("text"), Class("input w-full"), Name("title"), Placeholder("Title")),
							Input(Type("text"), Class("input w-full"), Name("tags"), Placeholder("Tags")),
						),
						Div(Class("flex justify-end"),
							Button(Type("submit"), Class("btn"), T("Submit")),
						),
					),
					Div(Class("mt-4"), Id("preview")),
					Script(Src("/static/editor.js")),
				),
			).RenderPageCtx(ctx, w, r)
		}),
		NewRoute("/blog/{slug}", func(w http.ResponseWriter, r *http.Request) {
			s := r.PathValue("slug")
			for _, post := range posts {
				if post.Slug == s {
					ServeNodeCtx(ctx, ArticleView(post))(w, r)
					return
				}
			}
			http.NotFound(w, r)
		}, WithValues(map[string][]string{
			"slug": lo.Map(posts, func(post Post, i int) string {
				return post.Slug
			}),
		})),
	}
	for _, post := range posts {
		if lo.Contains(post.Tags, "page") {
			routes = append(routes, NewRoute("/"+post.Title, func(w http.ResponseWriter, r *http.Request) {
				ServeNodeCtx(ctx, ArticleView(post))(w, r)
			}))
		}
	}
	return routes
}

func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	for _, route := range NewRoutes(d) {
		mux.HandleFunc(route.Path, route.Handler)
	}
	return mux
}

func ArticleView(state Post) *Node {
	return PageLayout(
		Article(Class("post-single"),
			Header(Class("post-header"),
				H1(Class("post-title entry-hint-parent"), T(state.Title)),
				Div(Class("post-meta"),
					Span(Attr("title", state.CreatedAt), T(state.CreatedAtParsed.Format("January 2, 2006"))),
					Span(Class("ml-3"), T("| breadchris")),
				),
			),
			Style(T(`
			pre,code {
				tab-size: 2; /* SetMap the tab width to 4 spaces */
				/*white-space: pre; Preserve whitespace and line breaks */
			}
			`)),
			Div(Class("post-content"),
				T(state.Content),
			),
			Script(Src("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js")),
			Script(T("hljs.highlightAll();")),
			Footer(Class("post-footer"),
				Ul(
					Class("post-tags"),
					Ch(lo.Map(state.Tags, func(tag string, i int) *Node {
						return Li(Class("post-tag"),
							A(Href(fmt.Sprintf("/tags/%s", tag)), T(tag)),
						)
					})),
				),
			),
		),
	)
}

type Post struct {
	Slug            string     `yaml:"-"`
	Title           string     `yaml:"title"`
	Tags            []string   `yaml:"tags"`
	CreatedAt       string     `yaml:"created_at"`
	Content         string     `yaml:"-"`
	TextContent     string     `yaml:"-"`
	Blocknote       string     `yaml:"blocknote"`
	CreatedAtParsed time.Time  `yaml:"-"`
	DOMNode         *html.Node `yaml:"-"`
}

type HomeState struct {
	Posts []Post
}

func RenderHome(state HomeState) *Node {
	var articles []*Node
	for _, post := range state.Posts {
		articles = append(articles, newArticlePreview(post))
	}

	return PageLayout(
		Div(
			Article(Class("first-entry home-info"),
				Header(Class("entry-header m-2 p-3.5"),
					H1(T("breadchris")),
				),
				Div(Class("entry-content"), T("hack the planet")),
				Footer(Class("entry-footer"),
					Div(Class("social-icons"),
						A(Href("https://github.com/breadchris"), Target("_blank"), Rel("noopener noreferrer me"), Attr("title", "Github"),
							Text("github"),
						),
						A(Href("https://twitter.com/breadchris"), Target("_blank"), Rel("noopener noreferrer me"), Attr("title", "Twitter"),
							Text("twitter"),
						),
						A(Href("https://youtube.com/@breadchris/streams"), Target("_blank"), Rel("noopener noreferrer me"), Attr("title", "YouTube"),
							Text("youtube"),
						),
						A(Href("https://cal.com/breadchris"), Target("_blank"), Rel("noopener noreferrer me"), Attr("title", "Cal.com"),
							Text("cal.com"),
						),
					),
				),
			),
			Chl(articles...),
		),
	)
}

func PageLayout(section *Node) *Node {
	return Html(
		Attr("lang", "en"),
		Attr("dir", "auto"),
		Head(
			Meta(Charset("UTF-8")),
			Meta(Name("generator"), Content("justshare")),
			Meta(HttpEquiv("X-UA-Compatible"), Content("IE=edge")),
			Meta(Name("viewport"), Content("width=device-width, initial-scale=1, shrink-to-fit=no")),
			Meta(Name("robots"), Content("index, follow")),
			Title(T("breadchris")),
			Meta(Name("description"), Content("")),
			Meta(Name("author"), Content("breadchris")),
			Link(Rel("canonical"), Href("/")),
			Link(Crossorigin("anonymous"), Href("/static/styles.css"), Rel("preload stylesheet"), Attr("as", "style")),
			Link(Rel("icon"), Href("/favicon.ico")),
			Link(Rel("icon"), Type("image/png"), Sizes("16x16"), Href("/favicon-16x16.png")),
			Link(Rel("icon"), Type("image/png"), Sizes("32x32"), Href("/favicon-32x32.png")),
			Link(Rel("apple-touch-icon"), Href("/apple-touch-icon.png")),
			Link(Rel("mask-icon"), Href("/safari-pinned-tab.svg")),
			Meta(Name("theme-color"), Content("#2e2e33")),
			Meta(Name("msapplication-TileColor"), Content("#2e2e33")),
			Link(Rel("alternate"), Type("application/rss+xml"), Href("/index.xml")),
			Link(Rel("alternate"), Type("application/json"), Href("/index.json")),
			Meta(Property("og:title"), Content("breadchris")),
			Meta(Property("og:description"), Content("")),
			Meta(Property("og:type"), Content("website")),
			Meta(Property("og:url"), AttrCtx("content", "baseURL")),
			Meta(Name("twitter:card"), Content("summary")),
			Meta(Name("twitter:title"), Content("breadchris")),
			Meta(Name("twitter:description"), Content("")),
		),
		Body(Class("list dark vsc-initialized"), Id("top"),
			Header(Class("header"),
				Nav(Class("nav"),
					Div(Class("logo"),
						A(Href("/"), Accesskey("h"), Attr("title", "breadchris (Alt + H)"), T("breadchris")),
						Div(Class("entry-header"),
							Button(Id("theme-toggle"), Accesskey("t"), Attr("title", "(Alt + T)")),
						),
					),
					Ul(Id("menu"),
						Li(A(Href("/blog"), Attr("title", "blog"), Span(T("blog")))),
						Li(A(Href("/resume"), Attr("title", "resume"), Span(T("resume")))),
						Li(A(Href("/tags/"), Attr("title", "tags"), Span(T("tags")))),
						Li(A(Href("/talks"), Attr("title", "talks"), Span(T("talks")))),
					),
				),
			),
			Main(Class("main"),
				section,
			),
			Footer(Class("page-footer")), //Nav(Class("pagination"),
			//	A(Class("next"), Href("https://breadchris.com/page/2/"), T("Next »")),
			//),

			Footer(Class("footer"),
				Span(T("© 2024 "), A(Href("/"), T("breadchris"))),
			),
			//A(Href("/#top"), AriaLabel("go to top"), Attr("title", "Go to Top (Alt + G)"), Class("top-link"), Id("top-link"), Attr("style", "visibility: hidden; opacity: 0;"),
			//	T("↑"),
			//),
		),
	)
}

func shortText(n int, s string) string {
	if n < len(s) {
		return s[:n]
	}
	return s
}

func newArticlePreview(a Post) *Node {
	return Article(Class("post-entry m-64"),
		Header(Class("entry-header"),
			H2(Class("entry-hint-parent"), T(a.Title)),
		),
		Div(Class("entry-content"),
			// TODO breadchris limit content length
			P(T(shortText(200, a.TextContent))),
		),
		Footer(Class("entry-footer"),
			Span(Attr("title", a.CreatedAt), T(a.CreatedAtParsed.Format("January 2, 2006"))),
			Span(T(" · breadchris")),
		),
		A(Class("entry-link m-12"), Href(fmt.Sprintf("/blog/%s", a.Slug))),
	)
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

func writeMarkdownFile(path string, post Post) error {
	yml, err := yaml.Marshal(post)
	if err != nil {
		return fmt.Errorf("json marshal: %w", err)
	}

	content := fmt.Sprintf("---\n%s\n---\n%s", yml, post.Content)

	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return fmt.Errorf("write file: %w", err)
	}
	return nil
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
