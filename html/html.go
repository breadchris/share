package html

import (
	"fmt"
	"io"
)

func RenderHTML() string {
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
			Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"), At("rel", "stylesheet"), At("type", "text/css")),
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
	).Render()
}

type Node struct {
	Name     string
	Attrs    map[string]string
	Children []RenderNode
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

//
//func (s *Node) RenderGoCode() string {
//	c := ""
//	for _, t := range s.Children {
//		c += t.RenderGoCode()
//	}
//	caser := cases.Title(language.AmericanEnglish)
//	if len(s.Attrs) == 0 {
//		return fmt.Sprintf("%s(\n%s,\n)", caser.String(s.Name), c)
//	}
//
//	var attrs []string
//	for k, v := range s.Attrs {
//		attrs = append(attrs, fmt.Sprintf("%s(\"%s\"),\n", caser.String(k), v))
//	}
//	return fmt.Sprintf("%s(\n%s,\n%s\n,),\n", s.Name, strings.Join(attrs, ",\n"), c)
//}

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

func (s *TextNode) RenderGoCode() string {
	return fmt.Sprintf("Text(\"%s\")", s.text)
}

type RenderNode interface {
	Render() string
	//RenderGoCode() string
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

func Form(o ...NodeOption) *Node {
	return NewNode("form", o)
}

func Label(o ...NodeOption) *Node {
	return NewNode("label", o)
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

var (
	At = Attr
	T  = Text
)

func render(w io.Writer, n *Node) (int, error) {
	return w.Write([]byte(n.Render()))
}
