package breadchris

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/breadchris/posts"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/gosimple/slug"
	"github.com/snabb/sitemap"
	"github.com/yuin/goldmark"
	"golang.org/x/net/html"
	"gopkg.in/yaml.v3"
	"io"
	"io/fs"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

func NewRoutes(d deps.Deps) []Route {
	ps, err := posts.LoadPosts()
	if err != nil {
		log.Fatalf("Failed to load posts: %v", err)
	}
	tags := map[string]any{}
	for _, post := range ps {
		for _, tag := range post.Tags {
			tags[tag] = struct{}{}
		}
	}
	var tagsSlice []string
	for tag := range tags {
		tagsSlice = append(tagsSlice, tag)
	}

	ctx := context.WithValue(context.Background(), "baseURL", d.Config.Blog.BaseURL)

	var filteredPosts []posts.Post
	for _, post := range ps {
		for _, tag := range post.Tags {
			if strings.HasPrefix(tag, "blog") {
				filteredPosts = append(filteredPosts, post)
			}
		}
	}

	var postSlugs []string
	for _, post := range ps {
		postSlugs = append(postSlugs, post.Slug)
	}

	routes := []Route{
		NewRoute(
			"/", ServeNodeCtx(ctx, RenderHome(HomeState{
				Posts: filteredPosts,
			})),
		),
		NewRoute("/code", func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(context.Background(), "baseURL", d.Config.Blog.BaseURL)
			props := map[string]string{
				"fileName":  "test.go",
				"id":        "id",
				"function":  "main",
				"code":      "\"package main\\n\\nfunc main() {\\n\\tprintln(\\\"Hello, World!\\\")\\n}",
				"serverURL": fmt.Sprintf("%s/code/ws", d.Config.ExternalURL),
			}
			mp, err := json.Marshal(props)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			Html(
				Head(
					Title(T("Code")),
					DaisyUI,
					TailwindCSS,
				),
				Body(
					Div(Class("wrapper"),
						Div(
							Script(T(`
function sendEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
}
`)),
							Script(Src("/static/leapclient.js")),
							Script(Src("/static/leap-bind-textarea.js")),
							Link(Rel("stylesheet"), Href("/static/wasmcode/monaco.css")),
							Div(
								Class("w-full h-full"),
								Id("monaco-editor"),
								Attr("data-props", string(mp)),
							),
							Script(Src("/static/wasmcode/monaco.js"), Attr("type", "module")),
						),
					),
					HTMX,
				),
			).RenderPageCtx(ctx, w, r)
		}),
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

			content, err := os.ReadFile("data/Omnivore.md")
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
			_ = Div(
				Class("space-x-4"),
				A(Href(url), T(url)),
				If(intID > 0, A(Href(fmt.Sprintf("/breadchris/omnivore/%d", intID-1)), T("Previous")), Nil()),
				If(intID < len(urls)-1, A(Href(fmt.Sprintf("/breadchris/omnivore/%d", intID+1)), T("Next")), Nil()),
				Iframe(Src(url), Attrs(map[string]string{
					"width":  "100%",
					"height": "100%",
				})),
			)

			f := Table(
				Class("table"),
			)
			for _, u := range urls {
				f.Children = append(
					f.Children,
					Tr(
						Td(A(Href(u), T(u))),
					),
				)
			}

			DefaultLayout(
				Div(
					f,
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

			var p []posts.Post
			for _, post := range ps {
				for _, tag := range post.Tags {
					if tag == t {
						p = append(p, post)
					}
				}
			}
			var articles []*Node
			for _, post := range p {
				articles = append(articles, newArticlePreview(post))
			}
			PageLayout(
				Div(
					H1(Class("my-6 text-4xl"), T(t)),
					Ch(articles),
				),
			).RenderPageCtx(ctx, w, r)
		}, WithValues(map[string][]string{
			"tag": tagsSlice,
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
		}, Ignore()),
		NewRoute("/new/{id...}", func(w http.ResponseWriter, r *http.Request) {
			id := r.PathValue("id")

			// TODO breadchris use id instead of slug
			var post posts.Post
			if id != "" {
				for _, p := range ps {
					if p.Slug == id {
						post = p
						break
					}
				}
			}

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
				ht := r.FormValue("html")
				p := posts.Post{
					Title:     title,
					Tags:      tags,
					CreatedAt: time.Now().Format(time.RFC3339),
					Content:   content,
					Blocknote: blocknote,
					Slug:      slug.Make(title),
					HTML:      ht,
				}
				if id != "" {
					for i, p := range ps {
						if p.Slug == id {
							ps[i] = p
							break
						}
					}
				} else {
					ps = append(ps, p)
				}
				err := writeMarkdownFile(fmt.Sprintf("breadchris/posts/%s.md", slug.Make(title)), p)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				http.Redirect(w, r, d.Config.Blog.BaseURL+"/blog/"+id, http.StatusSeeOther)
				return
			}
			type Props struct {
				ProviderURL string     `json:"provider_url"`
				Room        string     `json:"room"`
				Username    string     `json:"username"`
				Post        posts.Post `json:"post"`
			}
			props := Props{
				ProviderURL: d.Config.Blog.YJSURL,
				Room:        "blog",
				Username:    u,
				Post:        post,
			}
			b, err := json.Marshal(props)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			action := "/new/"
			if id != "" {
				action = fmt.Sprintf("/new/%s", id)
			}

			PageLayout(
				Div(
					Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.2/dist/full.min.css"), Rel("stylesheet"), Type("text/css")),
					Link(Href("/static/editor.css"), Rel("stylesheet"), Type("text/css")),
					Link(Rel("stylesheet"), Href("/static/wasmcode/monaco.css")),
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
						Action(action),
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
						Input(Type("hidden"), Name("html"), Id("html")),
						Div(Id("editor"), Attrs(map[string]string{
							"props": string(b),
						})),
						Div(Class("flex flex-row space-x-4"),
							Input(Type("text"), Value(post.Title), Class("input w-full"), Name("title"), Placeholder("Title")),
							Input(Type("text"), Value(strings.Join(post.Tags, ",")), Class("input w-full"), Name("tags"), Placeholder("Tags")),
						),
						Div(Class("flex justify-end"),
							Button(Type("submit"), Class("btn"), T("Submit")),
						),
					),
					Div(Class("mt-4"), Id("preview")),
					Script(Src("/static/editor.js"), Type("module")),
				),
			).RenderPageCtx(ctx, w, r)
		}, Ignore()),
		NewRoute("/blog/{slug}", func(w http.ResponseWriter, r *http.Request) {
			s := r.PathValue("slug")
			for _, post := range ps {
				if post.Slug == s {
					ArticleView(post).RenderPageCtx(ctx, w, r)
					return
				}
			}
			http.NotFound(w, r)
		}, WithValues(map[string][]string{
			"slug": postSlugs,
		})),
	}
	for _, post := range ps {
		var contains bool
		for _, tag := range post.Tags {
			if tag == "page" {
				contains = true
				break
			}
		}
		if contains {
			routes = append(routes, NewRoute("/"+post.Slug, func(w http.ResponseWriter, r *http.Request) {
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

func ArticleView(state posts.Post) *Node {
	var tags []*Node
	for _, tag := range state.Tags {
		tags = append(tags, Li(Class("post-tag"),
			A(Href(fmt.Sprintf("/tags/%s", tag)), T(tag)),
		))
	}
	c := state.HTML
	if c == "" {
		c = state.Content
	}
	println(c)
	return PageLayout(
		Article(Class("post-single"),
			Link(Rel("stylesheet"), Href("/static/wasmcode/monaco.css")),
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
				Raw(c),
			),
			Script(Src("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js")),
			Script(Raw("hljs.highlightAll();")),
			Footer(Class("post-footer"),
				Ul(
					Class("post-tags"),
					Ch(tags),
				),
				A(Href("/new/"+state.Slug), Class("btn"), T("edit")),
			),
			Script(Src("/static/wasmcode/monaco.js"), Type("module")),
		),
	)
}

type HomeState struct {
	Posts []posts.Post
}

func writeMarkdownFile(path string, post posts.Post) error {
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
			//A(Href("/#top"), AriaLabel("go to top"), Attr("title", "Go to Top (Alt + G)"), Class("top-link"), ID("top-link"), Attr("style", "visibility: hidden; opacity: 0;"),
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

func newArticlePreview(a posts.Post) *Node {
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

type Site struct {
	OutputDir string
}

type StaticSite struct {
	Domain   string
	BaseURL  string
	LocalDir string
}

func StaticSiteGenerator(s StaticSite) (*Site, error) {
	domain := s.Domain
	domainDir := path.Join("data", "sites", "generated", domain)
	outputDir := path.Join(domainDir, "latest")

	site := &Site{
		OutputDir: outputDir,
	}

	//baseURL := "http://localhost:8080/" + domainDir + "/latest"
	baseURL := s.BaseURL

	if _, err := os.Stat(outputDir); err == nil {
		backupDir := path.Join(domainDir, time.Now().Format("2006-01-02-15-04-05"))
		if err := os.Rename(outputDir, backupDir); err != nil {
			return nil, fmt.Errorf("failed to backup output directory: %v", err)
		}
		fmt.Printf("Backed up output directory to %s\n", backupDir)
	}

	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	if err := os.WriteFile(path.Join(outputDir, "CNAME"), []byte(domain), 0644); err != nil {
		return nil, fmt.Errorf("failed to write CNAME file: %v", err)
	}

	// TODO breadchris this should accept a dir
	posts, err := posts.LoadPosts()
	if err != nil {
		return nil, fmt.Errorf("failed to load posts: %w", err)
	}

	uploads := path.Join(outputDir, "data/uploads")
	if err := os.MkdirAll(uploads, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directories for %s: %w", uploads, err)
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
					return nil, fmt.Errorf("failed to read file %s: %w", dataPath, err)
				}

				if err := os.WriteFile(newDataPath, f, 0644); err != nil {
					return nil, fmt.Errorf("failed to write file %s: %w", newDataPath, err)
				}
			}
		}
	}

	err = GenerateSitemap(posts, baseURL, path.Join(outputDir, "sitemap.xml"))
	if err != nil {
		return nil, fmt.Errorf("failed to generate sitemap: %v", err)
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
		return nil, fmt.Errorf("failed to copy static directory: %v", err)
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
						return nil, fmt.Errorf("failed to render route: %v", err)
					}
				}
				// TODO breadchris check go tests to see how they do this?
				p := strings.Replace(route.Path, "{"+k+"}", "", -1)
				p = strings.Replace(p, "{"+k+"...}", "", -1)
				if err = renderRoute(mux, p, outputDir); err != nil {
					return nil, fmt.Errorf("failed to render route: %v", err)
				}
			}
		} else {
			if err = renderRoute(mux, route.Path, outputDir); err != nil {
				return nil, fmt.Errorf("failed to render route: %v", err)
			}
		}
	}
	return site, nil
}

func GenerateSitemap(posts []posts.Post, baseURL, outputPath string) error {
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
