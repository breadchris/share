package main

import (
	"bytes"
	"fmt"
	. "github.com/breadchris/share/html"
	"golang.org/x/net/html"
	"log"
	"strings"
)

func parseHTMLToNode(n *html.Node) RenderNode {
	if n.Type == html.TextNode {
		return Text(strings.TrimSpace(n.Data))
	}

	node := NewNode(n.Data, nil)
	for _, attr := range n.Attr {
		node.Attrs[attr.Key] = attr.Val
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		childNode := parseHTMLToNode(c)
		if childNode != nil {
			node.Children = append(node.Children, childNode)
		}
	}

	return node
}

func ConvertHTMLToGoCode(htmlString string) string {
	doc, err := html.Parse(strings.NewReader(htmlString))
	if err != nil {
		log.Fatal(err)
	}

	rootNode := parseHTMLToNode(doc)
	println(rootNode.Render())
	var buf bytes.Buffer
	//buf.WriteString(rootNode.RenderGoCode())

	return buf.String()
}

func renderGoCode(buf *bytes.Buffer, n *html.Node) {
	if n.Type == html.ElementNode {
		var children []string
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			var childBuf bytes.Buffer
			renderGoCode(&childBuf, c)
			if childBuf.Len() > 0 {
				children = append(children, childBuf.String())
			}
		}

		childStr := strings.Join(children, ", ")
		if len(childStr) > 0 {
			childStr = ", " + childStr
		}

		buf.WriteString(fmt.Sprintf("%s(%s)%s", strings.Title(n.Data), buildAttributes(n.Attr), childStr))
	} else if n.Type == html.TextNode {
		buf.WriteString(fmt.Sprintf("Text(\"%s\")", strings.TrimSpace(n.Data)))
	}
}

func buildAttributes(attrs []html.Attribute) string {
	var options []string
	for _, attr := range attrs {
		options = append(options, fmt.Sprintf("Attr(\"%s\", \"%s\")", attr.Key, attr.Val))
	}
	return strings.Join(options, ", ")
}
