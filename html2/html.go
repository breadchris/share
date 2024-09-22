package html2

import (
	"fmt"
	"go/ast"
	"go/token"
	"net/http"
	"runtime"
	"strings"
)

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
		_, err := fmt.Fprint(w, n.Render())
		if err != nil {
			http.Error(w, "Error rendering HTML", http.StatusInternalServerError)
		}
	}
}

type Node struct {
	Name      string
	Attrs     map[string]string
	Children  []*Node
	transform func(p *Node)
	text      string
	locator   string
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
	_, err := fmt.Fprint(w, s.Render())
	if err != nil {
		http.Error(w, "Error rendering HTML", http.StatusInternalServerError)
	}
}

func (s *Node) Render() string {
	c := ""
	if s.text != "" {
		c += s.text
	}

	for _, t := range s.Children {
		c += t.Render()
	}
	if s.locator != "" {
		s.Attrs["data-godom"] = s.locator
	}
	if len(s.Attrs) == 0 {
		return fmt.Sprintf("<%s>%s</%s>", s.Name, c, s.Name)
	}

	a := ""
	var i int
	for k, v := range s.Attrs {
		if i == len(s.Attrs)-1 {
			a += fmt.Sprintf("%s=\"%s\"", k, v)
			break
		}
		a += fmt.Sprintf("%s=\"%s\" ", k, v)
		i++
	}
	return fmt.Sprintf("<%s %s>%s</%s>", s.Name, a, c, s.Name)
}

func (s *Node) RenderGoCode(fset *token.FileSet) ast.Stmt {
	if s.text != "" {
		c := &ast.CallExpr{
			Fun:  ast.NewIdent("Text"),
			Args: []ast.Expr{&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf("\"%s\"", s.text)}},
		}
		return &ast.ExprStmt{X: c}
	}

	call := &ast.CallExpr{
		Fun:  ast.NewIdent(strings.Title(s.Name)), // Capitalize to match Go function names like Div(), Ul()
		Args: []ast.Expr{},
	}

	for k, v := range s.Attrs {
		call.Args = append(call.Args, &ast.CallExpr{
			Fun: ast.NewIdent(strings.Title(k)), // Assuming function names map to attribute names (e.g., Class())
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
		call.Args = append(call.Args, childAST.(*ast.ExprStmt).X)
	}
	return &ast.ExprStmt{X: call}
}

func Text(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.text = s
		},
	}
}

func NewNode(s string, o []*Node) *Node {
	n := &Node{
		Name:  s,
		Attrs: map[string]string{},
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
				p.Children = append(p.Children, n)
			}
		},
	}
}

func Chl(c ...*Node) *Node {
	return &Node{
		transform: func(p *Node) {
			for _, n := range c {
				p.Children = append(p.Children, n)
			}
		},
	}
}

func Class(s string) *Node {
	_, file, line, ok := runtime.Caller(1)
	return &Node{
		transform: func(p *Node) {
			p.Attrs["class"] = s
			if ok {
				p.locator = fmt.Sprintf("%s:%d", file, line)
			}
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

func P(o ...*Node) *Node {
	return NewNode("p", o)
}

func Style(o ...*Node) *Node {
	return NewNode("style", o)
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
				p.Attrs["open"] = "open"
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
			p.Attrs["action"] = s
		},
	}
}

func Src(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["src"] = s
		},
	}
}

func Href(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["href"] = s
		},
	}
}

func Attr(k, v string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs[k] = v
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

var (
	T = Text
)

func HxPost(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["hx-post"] = s
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
			p.Attrs["hx-get"] = s
		},
	}
}

func HxTarget(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["hx-target"] = s
		},
	}
}

func HxSwap(s string) *Node {
	return &Node{
		transform: func(p *Node) {
			p.Attrs["hx-swap"] = s
		},
	}
}
