package html

import (
	"context"
	"fmt"
	"go/ast"
	"go/token"
	"html/template"
	"net/http"
	"strings"
)

var (
	DaisyUI = Link(
		Href("https://cdn.jsdelivr.net/npm/daisyui@5"),
		Attr("rel", "stylesheet"),
		Attr("type", "text/css"),
	)
	TailwindCSS = Script(Src("https://cdn.tailwindcss.com"))
	HTMX        = Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js"))
	Hyperscript = Script(Src("https://unpkg.com/hyperscript.org@0.9.13"))
)

func DefaultLayout(n ...*Node) *Node {
	return Html(
		Head(
			Meta(Charset("UTF-8")),
			Meta(Attrs(map[string]string{
				"name":    "viewport",
				"content": "width=device-width, initial-scale=1.0",
			})),
			DaisyUI,
			Script(Src("https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4")),
			// Link(Rel("icon"), Attr("href", "/favicon.ico"), Type("image/x-icon")),
			//TailwindCSS,
			HTMX,
		),
		Body(
			Ch(n),
		),
	)
}

func RenderHTML() *Node {
	type state struct {
		Title        string
		Ingredients  []string
		Instructions []string
	}
	recipe := state{
		Title:        "Poop",
		Ingredients:  []string{"poop", "pee"},
		Instructions: []string{"poop", "pee"},
	}
	ing := Div(Class("mb-4"),
		Label(For("ingredients"), T("Ingredients")),
	)
	for _, s := range recipe.Ingredients {
		ing.Children = append(ing.Children, Div(Class("flex items-center"),
			Text(s),
			Input(Type("text"), Id("ingredients"), Name("ingredients"), Class("border rounded w-full py-2 px-3")),
			Button(Class("bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"), T("Remove")),
		))
	}

	ins := Div(Class("mb-4"),
		Label(For("instructions"), T("Instructions")),
	)
	for _, s := range recipe.Instructions {
		ins.Children = append(ins.Children, Div(Class("flex items-center"),
			Text(s),
			Input(Type("text"), Id("instructions"), Name("instructions"), Class("border rounded w-full py-2 px-3")),
			Button(Class("bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"), T("Remove")),
		))
	}
	rH := Main(Class("mt-8"),
		Section(Class("text-center"),
			H2(Text("recipe")),
			Form(Method("POST"), Action("/submit"),
				Div(Class("mb-4"),
					Label(For("title"), T("Recipe Title")),
					Input(Type("text"), Id("title"), Name("title"), Class("border rounded w-full py-2 px-3")),
				),
				ing,
				ins,
				Div(Class("text-center"),
					Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Submit Recipe")),
				)),
		),
	)

	_ = Main(Class("mt-8"),
		Section(Class("text-center"),
			H2(Text("recipe")),
			Form(Method("POST"), Action("/submit"),
				Div(Class("mb-4"),
					Label(For("title"), T("Recipe Title")),
					Input(Type("text"), Id("title"), Name("title"), Class("border rounded w-full py-2 px-3")),
				),
				Div(Class("mb-4"),
					Label(For("ingredients"), T("Ingredients")),
					TextArea(Id("ingredients"), Name("ingredients"), Class("border rounded w-full py-2 px-3"), Rows(5)),
				),
				Div(Class("mb-4"),
					Label(For("instructions"), T("Instructions")),
					TextArea(Id("instructions"), Name("instructions"), Class("border rounded w-full py-2 px-3"), Rows(5)),
				),
				Div(Class("text-center"),
					Button(Type("submit"), Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"), T("Submit Recipe")),
				)),
		),
	)
	nav := Nav(
		Ul(Class("flex justify-center space-x-4"),
			Li(A(Href("/"), T("Home")),
				Li(A(Href("/recipes"), T("Recipes"))),
				Li(A(Href("/submit"), T("Submit a Recipe"))),
			),
		),
	)

	return Html(
		Head(
			Title(T("Recipe Site")),
			Link(
				Attrs(map[string]string{
					"rel":  "stylesheet",
					"type": "text/css",
					"href": "https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css",
				}),
			),
			Script(Src("https://cdn.tailwindcss.com")),
			Style(T("body { font-family: 'Inter', sans-serif; }")),
		),
		Body(Class("min-h-screen flex flex-col items-center justify-center"),
			Div(Class("container mx-auto p-4"),
				Header(Class("text-center mb-4"),
					H1(Text("Welcome to the Recipe Site")),
					nav,
					rH,
				),
			),
		),
	)
}

func ServeNode(n *Node) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusOK)
		_, err := w.Write([]byte(n.Render()))
		if err != nil {
			http.Error(w, "Error rendering HTML", http.StatusInternalServerError)
		}
	}
}

func ServeNodeCtx(ctx context.Context, n *Node) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusOK)
		_, err := w.Write([]byte(n.RenderCtx(ctx)))
		if err != nil {
			http.Error(w, "Error rendering HTML", http.StatusInternalServerError)
		}
	}
}

type Node struct {
	Name         string
	Attrs        map[string]string
	DynamicAttrs map[string]func(ctx context.Context) string
	Children     []*Node
	transform    func(p *Node)
	text         string
	raw          string
	locator      string
	baseURL      string
}

func (s *Node) Init(n *Node) {
	if n.transform != nil {
		n.transform(s)
		return
	}
	s.Children = append(s.Children, n)
}

func (s *Node) RenderPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	_, err := fmt.Fprint(w, s.Render())
	if err != nil {
		http.Error(w, "Error rendering HTML", http.StatusInternalServerError)
	}
}

func (s *Node) RenderPageCtx(ctx context.Context, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	_, err := w.Write([]byte(s.RenderCtx(ctx)))
	if err != nil {
		http.Error(w, "Error rendering HTML", http.StatusInternalServerError)
	}
}

func Render(root string, w http.ResponseWriter, s *Node) {
	ctx := context.WithValue(context.Background(), "baseURL", root)
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	_, err := w.Write([]byte(s.RenderCtx(ctx)))
	if err != nil {
		http.Error(w, "Error rendering HTML", http.StatusInternalServerError)
	}
}

// TODO breadchris rewrite this using io.Writer
func (s *Node) RenderCtx(ctx context.Context) string {
	c := ""
	if s.text != "" {
		c += template.HTMLEscapeString(s.text)
	}
	if s.raw != "" {
		c += s.raw
	}

	if s.baseURL != "" {
		ctx = context.WithValue(ctx, "baseURL", s.baseURL)
	}

	for _, t := range s.Children {
		c += t.RenderCtx(ctx)
	}

	if len(s.Attrs) == 0 && len(s.DynamicAttrs) == 0 {
		if c == "" {
			return ""
		}
		return fmt.Sprintf("<%s>%s</%s>", s.Name, c, s.Name)
	}

	attrs := map[string]string{}
	if s.locator != "" {
		attrs["data-godom"] = s.locator
	}
	for k, v := range s.DynamicAttrs {
		attrs[k] = v(ctx)
	}
	for k, v := range s.Attrs {
		attrs[k] = v
	}

	a := ""
	var i int
	for k, v := range attrs {
		v = template.HTMLEscapeString(v)
		if i == len(attrs)-1 {
			a += fmt.Sprintf("%s=\"%s\"", k, v)
			break
		}
		a += fmt.Sprintf("%s=\"%s\" ", k, v)
		i++
	}
	return fmt.Sprintf("<%s %s>%s</%s>", s.Name, a, c, s.Name)
}

func (s *Node) Render() string {
	return s.RenderCtx(context.Background())
}

func RenderGoFunction(fset *token.FileSet, name string, s ast.Expr) *ast.FuncDecl {
	return &ast.FuncDecl{
		Name: ast.NewIdent(name),
		Type: &ast.FuncType{
			Params: &ast.FieldList{
				List: []*ast.Field{},
			},
			Results: &ast.FieldList{
				List: []*ast.Field{
					{
						Type: &ast.StarExpr{
							X: ast.NewIdent("Node"),
						},
					},
				},
			},
		},
		Body: &ast.BlockStmt{
			List: []ast.Stmt{
				&ast.ReturnStmt{
					Results: []ast.Expr{
						s,
					},
				},
			},
		},
	}
}

func ReloadNode(filename string) *Node {
	return Script(Raw(fmt.Sprintf(`
const ws = new WebSocket("ws://localhost:8080/reload/");

ws.onmessage = function (event) {
    const msg = JSON.parse(event.data);
	if (msg.type === "reload" && msg.data === "%s") {
		ws.close();
		console.log("File changed, reloading...");
		window.location.reload();
	}
};

ws.onclose = function () {
	console.log("WebSocket connection closed.");
};

ws.onerror = function (error) {
	console.error("WebSocket error:", error);
};
`, filename)))
}

func (s *Node) RenderGoCode(fset *token.FileSet) *ast.CallExpr {
	if s.text != "" {
		// url escape the text
		t := strings.ReplaceAll(s.text, "\n", "\\n")
		return &ast.CallExpr{
			Fun:  ast.NewIdent("Text"),
			Args: []ast.Expr{&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf("\"%s\"", t)}},
		}
	}

	call := &ast.CallExpr{
		Fun:  ast.NewIdent(strings.Title(s.Name)),
		Args: []ast.Expr{},
	}

	for k, v := range s.Attrs {
		var cased []string
		for _, st := range strings.Split(k, "-") {
			cased = append(cased, strings.Title(st))
		}
		fun := strings.Join(cased, "")
		fun = strings.ReplaceAll(fun, "@", "")
		call.Args = append(call.Args, &ast.CallExpr{
			Fun: ast.NewIdent(fun),
			Args: []ast.Expr{
				&ast.BasicLit{
					Kind:  token.STRING,
					Value: fmt.Sprintf("\"%s\"", v),
				},
			},
		})
	}

	for _, child := range s.Children {
		childAST := child.RenderGoCode(fset)
		call.Args = append(call.Args, childAST)
	}
	return call
}

func Text(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.text = s
		},
	}
}

func Raw(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.raw = s
		},
	}
}

func T(s string) *Node {
	return Text(s)
}

func NewNode(s string, o []*Node) *Node {
	n := &Node{
		Name:         s,
		Attrs:        map[string]string{},
		DynamicAttrs: map[string]func(ctx context.Context) string{},
	}
	for _, op := range o {
		if op == nil {
			continue
		}
		n.Init(op)
	}
	return n
}

func Html(o ...*Node) *Node {
	return NewNode("html", o)
}

func Head(o ...*Node) *Node {
	return NewNode("head", o)
}

func Meta(o ...*Node) *Node {
	return NewNode("meta", o)
}

func Body(o ...*Node) *Node {
	return NewNode("body", o)
}

func Dialog(o ...*Node) *Node {
	return NewNode("dialog", o)
}

func Time(o ...*Node) *Node {
	return NewNode("time", o)
}

func Ol(o ...*Node) *Node {
	return NewNode("ol", o)
}

func Dl(o ...*Node) *Node {
	return NewNode("dl", o)
}

func Dt(o ...*Node) *Node {
	return NewNode("dt", o)
}

func Dd(o ...*Node) *Node {
	return NewNode("dd", o)
}

type NilNode struct{}

func (s *NilNode) Init(p *Node) {
}

func (s *NilNode) Render() string {
	return ""
}

func Ch(c []*Node) *Node {
	return &Node{
		transform: func(p *Node) {
			for _, n := range c {
				if n == nil {
					continue
				}
				p.Init(n)
			}
		},
	}
}

func Chl(c ...*Node) *Node {
	return &Node{
		transform: func(p *Node) {
			for _, n := range c {
				if c == nil {
					continue
				}
				p.Init(n)
			}
		},
	}
}

func Cha(c []*Node) *Node {
	return &Node{
		transform: func(p *Node) {
			for _, n := range c {
				if c == nil {
					continue
				}
				p.Init(n)
			}
		},
	}
}

func Checked(b bool) *Node {
	return &Node{
		transform: func(p *Node) {
			if b {
				p.Attrs["checked"] = "checked"
			}
		},
	}
}

func Role(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["role"] = s
		},
	}
}

func Iframe(o ...*Node) *Node {
	return NewNode("iframe", o)
}

func Class(s string) *Node {
	// print out stack trace
	//_, file, line, ok := runtime.Caller(1)
	// https://github.com/breadchris/yaegi/pull/1348/files
	return &Node{
		transform: func(p *Node) {
			p.Attrs["class"] = s
			//if ok {
			//	p.locator = fmt.Sprintf("%s:%d", file, line)
			//}
		},
	}
}

func OnClick(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["onclick"] = s
		},
	}
}

func Pre(o ...*Node) *Node {
	return NewNode("pre", o)
}

func Alt(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["alt"] = s
		},
	}
}

func Xmlns(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["xmlns"] = s
		},
	}
}

func StrokeWidth(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["stroke-width"] = s
		},
	}
}

func Stroke(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["stroke"] = s
		},
	}
}

func StrokeLinecap(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["stroke-linecap"] = s
		},
	}
}

func StrokeLinejoin(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["stroke-linejoin"] = s
		},
	}
}

func FileRule(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["fill-rule"] = s
		},
	}
}

func Datetime(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["datetime"] = s
		},
	}
}

func Code(o ...*Node) *Node {
	return NewNode("code", o)
}

func Aside(o ...*Node) *Node {
	return NewNode("aside", o)
}

func ViewBox(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["viewBox"] = s
		},
	}
}

func Fill(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["fill"] = s
		},
	}
}

func AriaHidden(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["aria-hidden"] = s
		},
	}
}

func DataSlot(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["data-slot"] = s
		},
	}

}

func ClipRule(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["clip-rule"] = s
		},
	}
}

func FillRule(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["fill-rule"] = s
		},
	}
}

func D(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["d"] = s
		},
	}
}

func Div(o ...*Node) *Node {
	return NewNode("div", o)
}

func Figure(o ...*Node) *Node {
	return NewNode("figure", o)
}

func Header(o ...*Node) *Node {
	return NewNode("header", o)
}

func Nav(o ...*Node) *Node {
	return NewNode("nav", o)
}

func Ul(o ...*Node) *Node {
	return NewNode("ul", o)
}

func Li(o ...*Node) *Node {
	return NewNode("li", o)
}

func A(o ...*Node) *Node {
	return NewNode("a", o)
}

func Table(o ...*Node) *Node {
	return NewNode("table", o)
}

func Tr(o ...*Node) *Node {
	return NewNode("tr", o)
}

func Th(o ...*Node) *Node {
	return NewNode("th", o)
}

func Td(o ...*Node) *Node {
	return NewNode("td", o)
}

func Thead(o ...*Node) *Node {
	return NewNode("thead", o)
}

func Tbody(o ...*Node) *Node {
	return NewNode("tbody", o)
}

func H1(o ...*Node) *Node {
	return NewNode("h1", o)
}

func H2(o ...*Node) *Node {
	return NewNode("h2", o)
}

func Form(o ...*Node) *Node {
	return NewNode("form", o)
}

func Label(o ...*Node) *Node {
	return NewNode("label", o)
}

func Details(o ...*Node) *Node {
	return NewNode("details", o)
}

func Input(o ...*Node) *Node {
	return NewNode("input", o)
}

func TextArea(o ...*Node) *Node {
	return NewNode("textarea", o)
}

func Button(o ...*Node) *Node {
	return NewNode("button", o)
}

func Title(o ...*Node) *Node {
	return NewNode("title", o)
}

func Link(o ...*Node) *Node {
	return NewNode("link", o)
}

func Script(o ...*Node) *Node {
	return NewNode("script", o)
}

func Img(o ...*Node) *Node {
	return NewNode("img", o)
}

func Map(o ...*Node) *Node {
	return NewNode("map", o)
}

func Area(o ...*Node) *Node {
	return NewNode("area", o)
}

func Shape(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["shape"] = s
		},
	}
}

func Coords(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["coords"] = s
		},
	}
}

func UseMap(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["usemap"] = s
		},
	}
}

func P(o ...*Node) *Node {
	return NewNode("p", o)
}

func Hr(o ...*Node) *Node {
	return NewNode("hr", o)
}

func Style(o ...*Node) *Node {
	return NewNode("style", o)
}

func Style_(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["style"] = s
		},
	}
}

func Main(o ...*Node) *Node {
	return NewNode("main", o)
}

func Section(o ...*Node) *Node {
	return NewNode("section", o)
}

func Span(o ...*Node) *Node {
	return NewNode("span", o)
}

func Svg(o ...*Node) *Node {
	return NewNode("svg", o)
}

func Small(o ...*Node) *Node {
	return NewNode("small", o)
}

func H4(o ...*Node) *Node {
	return NewNode("h4", o)
}

func H3(o ...*Node) *Node {
	return NewNode("h3", o)
}

func H5(o ...*Node) *Node {
	return NewNode("h5", o)
}

func Progress(o ...*Node) *Node {
	return NewNode("progress", o)
}

func Path(o ...*Node) *Node {
	return NewNode("path", o)
}

func Summary(o ...*Node) *Node {
	return NewNode("summary", o)
}

func Open(b bool) *Node {
	return &Node{
		transform: func(p *Node) {
			if b {
				p.Attrs["open"] = ""
			}
		},
	}
}

func Method(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["method"] = s
		},
	}
}

func Max(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["max"] = s
		},
	}
}

func Action(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.DynamicAttrs["action"] = func(ctx context.Context) string {
				if strings.HasPrefix(s, "/") {
					if baseURL, ok := ctx.Value("baseURL").(string); ok {
						return baseURL + s
					}
				}
				return s
			}
		},
	}
}

func Src(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.DynamicAttrs["src"] = func(ctx context.Context) string {
				if strings.HasPrefix(s, "/") {
					if baseURL, ok := ctx.Value("baseURL").(string); ok {
						return baseURL + s
					}
				}
				return s
			}
		},
	}
}

func Src_(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["src"] = s
		},
	}
}

func Fmt(s string, args ...interface{}) string {
	return fmt.Sprintf(s, args...)
}

func Href(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.DynamicAttrs["href"] = func(ctx context.Context) string {
				if strings.HasPrefix(s, "/") {
					if baseURL, ok := ctx.Value("baseURL").(string); ok {
						return baseURL + s
					}
				}
				return s
			}
		},
	}
}

func Href_(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["href"] = s
		},
	}
}

func If(c bool, trueNode *Node, falseNode *Node) *Node {
	if c {
		return trueNode
	}
	return falseNode
}

func Nil() *Node {
	return &Node{}
}

func Attr(k, v string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs[k] = v
		},
	}
}

func AttrCtx(attr, key string) *Node {
	return &Node{
		transform: func(n *Node) {
			n.DynamicAttrs[attr] = func(ctx context.Context) string {
				if v, ok := ctx.Value(key).(string); ok {
					return v
				}
				return ""
			}
		},
	}
}

func Attrs(m map[string]string) *Node {
	return &Node{
		transform: func(p *Node) {
			for k, v := range m {
				p.Attrs[k] = v
			}
		},
	}
}

func For(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["for"] = s
		},
	}
}

func Id(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["id"] = s
		},
	}
}

func Name(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["name"] = s
		},
	}
}

func Target(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["target"] = s
		},
	}
}

func AriaLabel(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["aria-label"] = s
		},
	}
}

func Placeholder(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["placeholder"] = s
		},
	}
}

func Rows(i int) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["rows"] = fmt.Sprintf("%d", i)
		},
	}
}

func Type(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["type"] = s
		},
	}
}

func Footer(o ...*Node) *Node {
	return NewNode("footer", o)
}

func Article(o ...*Node) *Node {
	return NewNode("article", o)
}

func Charset(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["charset"] = s
		},
	}
}

func Content(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["content"] = s
		},
	}
}

func HttpEquiv(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["http-equiv"] = s
		},
	}
}

func Rel(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["rel"] = s
		},
	}
}

func Crossorigin(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["crossorigin"] = s
		},
	}
}

func Sizes(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["sizes"] = s
		},
	}
}

func Property(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["property"] = s
		},
	}
}

func Accesskey(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["accesskey"] = s
		},
	}
}

func Select(o ...*Node) *Node {
	return NewNode("select", o)
}

func Option(o ...*Node) *Node {
	return NewNode("option", o)
}

func Value(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["value"] = s
		},
	}
}

func HxVals(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["hx-vals"] = s
		},
	}
}

func HxPost(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.DynamicAttrs["hx-post"] = func(ctx context.Context) string {
				if strings.HasPrefix(s, "/") {
					if baseURL, ok := ctx.Value("baseURL").(string); ok {
						return baseURL + s
					}
				}
				return s
			}
		},
	}
}

func HxTrigger(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["hx-trigger"] = s
		},
	}
}

func HxGet(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.DynamicAttrs["hx-get"] = func(ctx context.Context) string {
				if strings.HasPrefix(s, "/") {
					if baseURL, ok := ctx.Value("baseURL").(string); ok {
						return baseURL + s
					}
				}
				return s
			}
		},
	}
}

func HxPut(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.DynamicAttrs["hx-put"] = func(ctx context.Context) string {
				if strings.HasPrefix(s, "/") {
					if baseURL, ok := ctx.Value("baseURL").(string); ok {
						return baseURL + s
					}
				}
				return s
			}
		},
	}
}

func HxDelete(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.DynamicAttrs["hx-delete"] = func(ctx context.Context) string {
				if strings.HasPrefix(s, "/") {
					if baseURL, ok := ctx.Value("baseURL").(string); ok {
						return baseURL + s
					}
				}
				return s
			}
		},
	}
}

func NewAttrNode(attr, val string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs[attr] = val
		},
	}
}

func HxTarget(s string) *Node {
	return NewAttrNode("hx-target", s)
}

func HxSwap(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["hx-swap"] = s
		},
	}
}

func AriaOrientation(s string) *Node {
	return NewAttrNode("aria-orientation", s)
}

func AriaLabelledby(s string) *Node {
	return NewAttrNode("aria-labelledby", s)
}

func AriaHaspopup(s string) *Node {
	return NewAttrNode("aria-haspopup", s)
}

func AriaExpanded(s string) *Node {
	return NewAttrNode("aria-expanded", s)
}

func Tabindex(s string) *Node {
	return NewAttrNode("tabindex", s)
}

func Width(s string) *Node {
	return NewAttrNode("width", s)
}

func Height(s string) *Node {
	return NewAttrNode("height", s)
}

func Circle(o ...*Node) *Node {
	return NewNode("circle", o)
}

func Polygon(o ...*Node) *Node {
	return NewNode("polygon", o)
}

func Points(s string) *Node {
	return NewAttrNode("points", s)
}

func Cx(s string) *Node {
	return NewAttrNode("cx", s)
}

func Cy(s string) *Node {
	return NewAttrNode("cy", s)
}

func R(s string) *Node {
	return NewAttrNode("r", s)
}

func Rect(o ...*Node) *Node {
	return NewNode("rect", o)
}

func Rx(s string) *Node {
	return NewAttrNode("rx", s)
}

func Ry(s string) *Node {
	return NewAttrNode("ry", s)
}

func X(s string) *Node {
	return NewAttrNode("x", s)
}

func Y(s string) *Node {
	return NewAttrNode("y", s)
}

func AriaControls(s string) *Node {
	return NewAttrNode("aria-controls", s)
}

func Focusable(s string) *Node {
	return NewAttrNode("focusable", s)
}

func DataTestid(s string) *Node {
	return NewAttrNode("data-testid", s)
}

func Line(o ...*Node) *Node {
	return NewNode("line", o)
}

func X1(s string) *Node {
	return NewAttrNode("x1", s)
}

func X2(s string) *Node {
	return NewAttrNode("x2", s)
}

func Y1(s string) *Node {
	return NewAttrNode("y1", s)
}

func Y2(s string) *Node {
	return NewAttrNode("y2", s)
}
