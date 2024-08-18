package main

import (
	"fmt"
	"io"
)

type Node struct {
	Name     string
	text     string
	Attrs    map[string]string
	Children []*Node
}

func (s *Node) Init(_ *Node) *Node {
	return s
}

func (s *Node) Render() string {
	c := ""
	for _, t := range s.Children {
		c += t.Render()
	}
	a := ""
	for k, v := range s.Attrs {
		a += fmt.Sprintf("%s=%s ", k, v)
	}
	return fmt.Sprintf("<%s %s>%s</%s>", s.Name, a, c, s.Name)
}

type NodeOption interface {
	Init(n *Node) *Node
}

func newNode(s string, o []NodeOption) *Node {
	n := &Node{
		Name:  s,
		Attrs: map[string]string{},
	}
	for _, op := range o {
		if c := op.Init(n); c != nil {
			n.Children = append(n.Children, op.Init(n))
		}
	}
	return n
}

func Html(o ...NodeOption) *Node {
	return newNode("html", o)
}

func Head(o ...NodeOption) *Node {
	return newNode("head", o)
}

func Meta(o ...NodeOption) *Node {
	return newNode("meta", o)
}

func Body(o ...NodeOption) *Node {
	return newNode("body", o)
}

type TransformNode struct {
	transform func(p *Node) *Node
}

func (s *TransformNode) Init(p *Node) *Node {
	return s.transform(p)
}

func Class(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["class"] = s
			return nil
		},
	}
}

func Div(o ...NodeOption) *Node {
	return newNode("div", o)
}

func Header(o ...NodeOption) *Node {
	return newNode("header", o)
}

func Nav(o ...NodeOption) *Node {
	return newNode("nav", o)
}

func Ul(o ...NodeOption) *Node {
	return newNode("ul", o)
}

func Li(o ...NodeOption) *Node {
	return newNode("li", o)
}

func A(o ...NodeOption) *Node {
	return newNode("a", o)
}

func H1(o ...NodeOption) *Node {
	return newNode("h1", o)
}

func H2(o ...NodeOption) *Node {
	return newNode("h2", o)
}

func Form(o ...NodeOption) *Node {
	return newNode("form", o)
}

func Label(o ...NodeOption) *Node {
	return newNode("label", o)
}

func Input(o ...NodeOption) *Node {
	return newNode("input", o)
}

func TextArea(o ...NodeOption) *Node {
	return newNode("textarea", o)
}

func Button(o ...NodeOption) *Node {
	return newNode("button", o)
}

func Title(o ...NodeOption) *Node {
	return newNode("title", o)
}

func Link(o ...NodeOption) *Node {
	return newNode("link", o)
}

func Script(o ...NodeOption) *Node {
	return newNode("script", o)
}

func Style(o ...NodeOption) *Node {
	return newNode("style", o)
}

func Main(o ...NodeOption) *Node {
	return newNode("main", o)
}

func Section(o ...NodeOption) *Node {
	return newNode("section", o)
}

func Method(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["method"] = s
			return nil
		},
	}
}

func Action(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["action"] = s
			return nil
		},
	}
}

func Text(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.text = s
			return nil
		},
	}
}

func Src(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["src"] = s
			return nil
		},
	}
}

func Href(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["href"] = s
			return nil
		},
	}
}

func Attr(k, v string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs[k] = v
			return nil
		},
	}
}

func For(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["for"] = s
			return nil
		},
	}
}

func Id(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["id"] = s
			return nil
		},
	}
}

func Name(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["name"] = s
			return nil
		},
	}
}

func Rows(i int) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["rows"] = fmt.Sprintf("%d", i)
			return nil
		},
	}
}

func Type(s string) *TransformNode {
	return &TransformNode{
		transform: func(p *Node) *Node {
			p.Attrs["type"] = s
			return nil
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
