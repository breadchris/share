package breadchris

import (
	"bytes"
	"encoding/json"
	"fmt"
	. "github.com/breadchris/share/html2"
	"github.com/gosimple/slug"
	"github.com/samber/lo"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/parser"
	"go.abhg.dev/goldmark/frontmatter"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"slices"
	"strings"
	"time"
)

func New() *http.ServeMux {
	mux := http.NewServeMux()

	posts, err := loadPostsFromDir("breadchris/posts")
	if err != nil {
		log.Fatalf("Error loading posts: %v", err)
	}

	for i := range posts {
		posts[i].CreatedAtParsed, err = time.Parse(time.RFC3339, posts[i].CreatedAt)
		if err != nil {
			log.Fatalf("Error parsing time: %v", err)
		}
	}
	slices.SortFunc(posts, func(i, j Post) int {
		if i.CreatedAtParsed.Before(j.CreatedAtParsed) {
			return 1
		} else {
			return -1
		}
	})

	for _, post := range posts {
		if lo.Contains(post.Tags, "page") {
			mux.HandleFunc("/"+post.Title, func(w http.ResponseWriter, r *http.Request) {
				ServeNode(ArticleView(post))(w, r)
			})
		}
	}
	mux.HandleFunc("/", ServeNode(RenderHome(HomeState{
		Posts: lo.Filter(posts, func(post Post, i int) bool {
			for _, tag := range post.Tags {

				if strings.HasPrefix(tag, "blog") {
					return true
				}
			}
			return false
		}),
	})))
	mux.HandleFunc("/tags/", func(w http.ResponseWriter, r *http.Request) {
		t := strings.TrimPrefix(r.URL.Path, "/tags/")
		if t == "" {
			tags := map[string]any{}
			for _, post := range posts {
				for _, tag := range post.Tags {
					tags[tag] = struct{}{}
				}
			}
			var tagNodes []*Node
			for tag := range tags {
				tagNodes = append(tagNodes, Li(Class("post-tag"),
					A(Href(fmt.Sprintf("/breadchris/tags/%s", tag)), T(tag)),
				))
			}

			ServeNode(PageLayout(
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
		ServeNode(PageLayout(
			Div(
				H1(Class("my-6"), T(t)),
				Ch(lo.Map(p, func(post Post, i int) *Node {
					return newArticlePreview(post)
				})),
			),
		))(w, r)
	})
	mux.HandleFunc("/new/render", func(w http.ResponseWriter, r *http.Request) {
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
		).RenderPage(w, r)
	})
	mux.HandleFunc("/new", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			title := r.FormValue("title")
			tags := strings.Split(r.FormValue("tags"), ",")
			content := r.FormValue("content")
			posts = append(posts, Post{
				Title:     title,
				Tags:      tags,
				CreatedAt: time.Now().Format(time.RFC3339),
				Content:   content,
			})
			http.Redirect(w, r, "/breadchris", http.StatusSeeOther)
			return
		}
		PageLayout(
			Div(
				Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css"), Rel("stylesheet"), Type("text/css")),
				Script(Src("https://cdn.tailwindcss.com")),
				Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
				Script(Src("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js")),
				Style(T(`
					 h1 { font-size: 2em; }
					 h2 { font-size: 1.5em; }
					 h3 { font-size: 1.17em; }
					 h4 { font-size: 1.00em; }
					 h5 { font-size: 0.8em; }
					 a {
						 color: blue;
						 text-decoration: underline;
					 }
				 `)),
				Class("w-full max-w-2xl mx-auto"),
				H1(Class("my-6"), T("New Post")),
				Form(
					Method("POST"),
					Action("/breadchris/new"),
					Class("flex flex-col"),
					Input(Type("text"), Class("input w-full"), Name("title"), Placeholder("Title")),
					Input(Type("text"), Class("input w-full"), Name("tags"), Placeholder("Tags")),
					TextArea(
						Name("content"),
						Class("textarea w-full"),
						Placeholder("Content"),
						Attr("hx-post", "/breadchris/new/render"),
						Attr("hx-trigger", "keyup changed delay:500ms"),
						Attr("hx-target", "#preview"),
					),
					Button(Type("submit"), Class("btn"), T("Submit")),
				),
				Div(Class("mt-4"), Id("preview")),
			),
		).RenderPage(w, r)
	})
	mux.HandleFunc("/blog/{slug}", func(w http.ResponseWriter, r *http.Request) {
		s := r.PathValue("slug")
		for _, post := range posts {
			if post.Slug == s {
				ServeNode(ArticleView(post))(w, r)
				return
			}
		}
		http.NotFound(w, r)
	})

	return mux
}

func ArticleView(state Post) *Node {
	return PageLayout(
		Article(Class("post-single"),
			Header(Class("post-header"),
				H1(Class("post-title entry-hint-parent"), T(state.Title)),
				Div(Class("post-meta"),
					Span(Attr("title", state.CreatedAt), T(state.CreatedAt)),
					Span(T(" · breadchris")),
				),
			),
			Div(Class("post-content"),
				Div(T(state.Content)),
			),
			Footer(Class("post-footer"),
				Ul(
					Class("post-tags"),
					Ch(lo.Map(state.Tags, func(tag string, i int) *Node {
						return Li(Class("post-tag"),
							A(Href(fmt.Sprintf("/breadchris/tags/%s", tag)), T(tag)),
						)
					})),
				),
			),
		),
	)
}

type Post struct {
	Slug            string    `yaml:"-"`
	Title           string    `yaml:"title"`
	Tags            []string  `yaml:"tags"`
	CreatedAt       string    `yaml:"created_at"`
	Content         string    `yaml:"-"`
	CreatedAtParsed time.Time `yaml:"-"`
}

type HomeState struct {
	Posts []Post
}

func TestRender(s string) string {
	var state HomeState
	if err := json.Unmarshal([]byte(s), &state); err != nil {
		return Div(T("Error: "), T(err.Error())).Render()
	}
	return RenderHome(state).Render()
}

func newArticlePreview(a Post) *Node {
	return Article(Class("post-entry"),
		Header(Class("entry-header"),
			H2(Class("entry-hint-parent"), T(a.Title)),
		),
		Div(Class("entry-content"),
			P(T(a.Content)),
		),
		Footer(Class("entry-footer"),
			Span(Attr("title", a.CreatedAt), T(a.CreatedAtParsed.Format("January 2, 2006"))),
			Span(T(" · breadchris")),
		),
		A(Class("entry-link"), Href(fmt.Sprintf("/breadchris/blog/%s", a.Slug))),
	)
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
		Head(
			Meta(Charset("UTF-8")),
			Meta(Name("generator"), Content("Hugo 0.119.0")),
			Meta(HttpEquiv("X-UA-Compatible"), Content("IE=edge")),
			Meta(Name("viewport"), Content("width=device-width, initial-scale=1, shrink-to-fit=no")),
			Meta(Name("robots"), Content("index, follow")),
			Title(T("breadchris")),
			Meta(Name("description"), Content("")),
			Meta(Name("author"), Content("breadchris")),
			Link(Rel("canonical"), Href("https://breadchris.com/")),
			Link(Crossorigin("anonymous"), Href("https://breadchris.com/assets/css/stylesheet.7d0dbc7bebc97247baddbf44f81f3261912c9f64c3f03500922375b9988f4ea9.css"), Rel("preload stylesheet"), Attr("as", "style")),
			Link(Rel("icon"), Href("https://breadchris.com/favicon.ico")),
			Link(Rel("icon"), Type("image/png"), Sizes("16x16"), Href("https://breadchris.com/favicon-16x16.png")),
			Link(Rel("icon"), Type("image/png"), Sizes("32x32"), Href("https://breadchris.com/favicon-32x32.png")),
			Link(Rel("apple-touch-icon"), Href("https://breadchris.com/apple-touch-icon.png")),
			Link(Rel("mask-icon"), Href("https://breadchris.com/safari-pinned-tab.svg")),
			Meta(Name("theme-color"), Content("#2e2e33")),
			Meta(Name("msapplication-TileColor"), Content("#2e2e33")),
			Link(Rel("alternate"), Type("application/rss+xml"), Href("https://breadchris.com/index.xml")),
			Link(Rel("alternate"), Type("application/json"), Href("https://breadchris.com/index.json")),
			Meta(Property("og:title"), Content("breadchris")),
			Meta(Property("og:description"), Content("")),
			Meta(Property("og:type"), Content("website")),
			Meta(Property("og:url"), Content("https://breadchris.com/")),
			Meta(Name("twitter:card"), Content("summary")),
			Meta(Name("twitter:title"), Content("breadchris")),
			Meta(Name("twitter:description"), Content("")),
		),
		Body(Class("list dark vsc-initialized"), Id("top"),
			Header(Class("header"),
				Nav(Class("nav"),
					Div(Class("logo"),
						A(Href("/breadchris"), Accesskey("h"), Attr("title", "breadchris (Alt + H)"), T("breadchris")),
						Div(Class("entry-header"),
							Button(Id("theme-toggle"), Accesskey("t"), Attr("title", "(Alt + T)")),
						),
					),
					Ul(Id("menu"),
						Li(A(Href("/breadchris/blog"), Attr("title", "blog"), Span(T("blog")))),
						Li(A(Href("/breadchris/resume"), Attr("title", "resume"), Span(T("resume")))),
						Li(A(Href("/breadchris/tags/"), Attr("title", "tags"), Span(T("tags")))),
						Li(A(Href("/breadchris/talks"), Attr("title", "talks"), Span(T("talks")))),
					),
				),
			),
			Main(Class("main"),
				section,
			),
			Footer(Class("page-footer"),
				Nav(Class("pagination"),
					A(Class("next"), Href("https://breadchris.com/page/2/"), T("Next »")),
				),
			),
			Footer(Class("footer"),
				Span(T("© 2024 "), A(Href("/"), T("breadchris"))),
				Span(T("Powered by "), A(Href("https://gohugo.io/"), Rel("noopener noreferrer"), Target("_blank"), T("Hugo")), T(" & "), A(Href("https://github.com/adityatelange/hugo-PaperMod/"), Rel("noopener"), Target("_blank"), T("PaperMod"))),
			),
			A(Href("/#top"), AriaLabel("go to top"), Attr("title", "Go to Top (Alt + G)"), Class("top-link"), Id("top-link"), Attr("style", "visibility: hidden; opacity: 0;"),
				T("↑"),
			),
		),
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

	return post, nil
}
