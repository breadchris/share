package html

import (
	"fmt"
	"go/ast"
	"go/token"
	"net/http"
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
	Name     string
	Attrs    map[string]string
	Children []RenderNode
}

func (s *Node) Ch(c []RenderNode) *Node {
	s.Children = append(s.Children, c...)
	return s
}

func (s *Node) C(c ...RenderNode) *Node {
	s.Children = append(s.Children, c...)
	return s
}

func (s *Node) Init(n *Node) {
	n.Children = append(n.Children, s)
}

func (s *Node) Render() string {
	c := ""
	for _, t := range s.Children {
		c += t.Render()
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

func (n *Node) RenderGoFunction(fset *token.FileSet, name string) ast.Decl {
	return &ast.FuncDecl{
		Name: ast.NewIdent(fmt.Sprintf("Render%s", strings.Title(name))),
		Type: &ast.FuncType{
			Results: &ast.FieldList{
				List: []*ast.Field{
					{Type: &ast.StarExpr{X: &ast.Ident{Name: "Node"}}},
				},
			},
		},
		Body: &ast.BlockStmt{
			List: []ast.Stmt{
				&ast.ReturnStmt{
					Results: []ast.Expr{n.RenderGoCall(fset)},
				},
			},
		},
	}
}

func (n *Node) RenderGoCall(fset *token.FileSet) *ast.CallExpr {
	call := &ast.CallExpr{
		Fun:  ast.NewIdent(strings.Title(n.Name)), // Capitalize to match Go function names like Div(), Ul()
		Args: []ast.Expr{},
	}

	for k, v := range n.Attrs {
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

	for _, child := range n.Children {
		childAST := child.RenderGoCode(fset)
		call.Args = append(call.Args, childAST.(*ast.ExprStmt).X)
	}
	return call
}

func (n *Node) RenderGoCode(fset *token.FileSet) ast.Stmt {
	return &ast.ExprStmt{X: n.RenderGoCall(fset)}
}

type TextNode struct {
	text string
}

func Text(s string) *TextNode {
	return &TextNode{
		text: s,
	}
}

func (s *TextNode) Init(n *Node) {
	n.Children = append(n.Children, s)
}

func (s *TextNode) Render() string {
	return s.text
}

func (s *TextNode) RenderGoCode(fset *token.FileSet) ast.Stmt {
	c := &ast.CallExpr{
		Fun:  ast.NewIdent("Text"),
		Args: []ast.Expr{&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf("\"%s\"", s.text)}},
	}
	return &ast.ExprStmt{X: c}
}

type RenderNode interface {
	Render() string
	RenderGoCode(fset *token.FileSet) ast.Stmt
}

type NodeOption interface {
	Init(n *Node)
}

func NewNode(s string, o []NodeOption) *Node {
	n := &Node{
		Name:  s,
		Attrs: map[string]string{},
	}
	for _, op := range o {
		if op == nil {
			continue
		}
		op.Init(n)
	}
	return n
}

func Html(o ...NodeOption) *Node {
	return NewNode("html", o)
}

func Head(o ...NodeOption) *Node {
	return NewNode("head", o)
}

func Meta(o ...NodeOption) *Node {
	return NewNode("meta", o)
}

func Body(o ...NodeOption) *Node {
	return NewNode("body", o)
}

func Dialog(o ...NodeOption) *Node {
	return NewNode("dialog", o)
}

type NilNode struct{}

func (s *NilNode) Init(p *Node) {
}

func (s *NilNode) Render() string {
	return ""
}

type TransformNode struct {
	transform func(p *Node)
}

func (s *TransformNode) RenderGoCode() string {
	return ""
}

func (s *TransformNode) Init(p *Node) {
	s.transform(p)
}

func (s *TransformNode) Render() string {
	return ""
}

func Chl(c ...*Node) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			for _, n := range c {
				p.Children = append(p.Children, n)
			}
		},
	}
}

func Class(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["class"] = s
		},
	}
}

func Div(o ...NodeOption) *Node {
	return NewNode("div", o)
}

func Header(o ...NodeOption) *Node {
	return NewNode("header", o)
}

func Nav(o ...NodeOption) *Node {
	return NewNode("nav", o)
}

func Ul(o ...NodeOption) *Node {
	return NewNode("ul", o)
}

func Li(o ...NodeOption) *Node {
	return NewNode("li", o)
}

func A(o ...NodeOption) *Node {
	return NewNode("a", o)
}

func H1(o ...NodeOption) *Node {
	return NewNode("h1", o)
}

func H2(o ...NodeOption) *Node {
	return NewNode("h2", o)
}

func If(b bool, n func() *Node) NodeOption {
	if b {
		return n()
	}
	return &NilNode{}
}

func Form(o ...NodeOption) *Node {
	return NewNode("form", o)
}

func Label(o ...NodeOption) *Node {
	return NewNode("label", o)
}

func Details(o ...NodeOption) *Node {
	return NewNode("details", o)
}

func Input(o ...NodeOption) *Node {
	return NewNode("input", o)
}

func TextArea(o ...NodeOption) *Node {
	return NewNode("textarea", o)
}

func Button(o ...NodeOption) *Node {
	return NewNode("button", o)
}

func Title(o ...NodeOption) *Node {
	return NewNode("title", o)
}

func Link(o ...NodeOption) *Node {
	return NewNode("link", o)
}

func Script(o ...NodeOption) *Node {
	return NewNode("script", o)
}

func Img(o ...NodeOption) *Node {
	return NewNode("img", o)
}

func P(o ...NodeOption) *Node {
	return NewNode("p", o)
}

func Style(o ...NodeOption) *Node {
	return NewNode("style", o)
}

func Main(o ...NodeOption) *Node {
	return NewNode("main", o)
}

func Section(o ...NodeOption) *Node {
	return NewNode("section", o)
}

func Span(o ...NodeOption) *Node {
	return NewNode("span", o)
}

func Svg(o ...NodeOption) *Node {
	return NewNode("svg", o)
}

func H4(o ...NodeOption) *Node {
	return NewNode("h4", o)
}

func H3(o ...NodeOption) *Node {
	return NewNode("h3", o)
}

func H5(o ...NodeOption) *Node {
	return NewNode("h5", o)
}

func Path(o ...NodeOption) *Node {
	return NewNode("path", o)
}

func Summary(o ...NodeOption) *Node {
	return NewNode("summary", o)
}

func Open(b bool) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			if b {
				p.Attrs["open"] = "open"
			}
		},
	}
}

func Method(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["method"] = s
		},
	}
}

func Action(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["action"] = s
		},
	}
}

func Src(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["src"] = s
		},
	}
}

func Href(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["href"] = s
		},
	}
}

func Attr(k, v string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs[k] = v
		},
	}
}

func Attrs(m map[string]string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			for k, v := range m {
				p.Attrs[k] = v
			}
		},
	}
}

func For(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["for"] = s
		},
	}
}

func Id(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["id"] = s
		},
	}
}

func Name(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["name"] = s
		},
	}
}

func Target(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["target"] = s
		},
	}
}

func AriaLabel(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["aria-label"] = s
		},
	}
}

func Placeholder(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["placeholder"] = s
		},
	}
}

func Rows(i int) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["rows"] = fmt.Sprintf("%d", i)
		},
	}
}

func Type(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["type"] = s
		},
	}
}

func Footer(o ...NodeOption) *Node {
	return NewNode("footer", o)
}

func Article(o ...NodeOption) *Node {
	return NewNode("article", o)
}

func Charset(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["charset"] = s
		},
	}
}

func Content(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["content"] = s
		},
	}
}

func HttpEquiv(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["http-equiv"] = s
		},
	}
}

func Rel(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["rel"] = s
		},
	}
}

func Crossorigin(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["crossorigin"] = s
		},
	}
}

func Sizes(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["sizes"] = s
		},
	}
}

func Property(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["property"] = s
		},
	}
}

func Accesskey(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["accesskey"] = s
		},
	}
}

func Select(o ...NodeOption) *Node {
	return NewNode("select", o)
}

func Option(o ...NodeOption) *Node {
	return NewNode("option", o)
}

func Value(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["value"] = s
		},
	}
}

var (
	T = Text
)

func HxPost(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["hx-post"] = s
		},
	}
}

func HxGet(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["hx-get"] = s
		},
	}
}

func HxTarget(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["hx-target"] = s
		},
	}
}

func HxSwap(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) {
			p.Attrs["hx-swap"] = s
		},
	}
}
