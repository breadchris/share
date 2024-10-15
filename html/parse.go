package html

import (
	"fmt"
	"golang.org/x/net/html"
	"strings"
)

func ParseHTML(n *html.Node) *Node {
	if n.Type == html.ElementNode {
		goNode := NewNode(n.Data, nil) // Handle other tags generically

		for _, attr := range n.Attr {
			goNode.Attrs[attr.Key] = attr.Val
		}

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			childNode := ParseHTML(c)
			if childNode != nil {
				goNode.Children = append(goNode.Children, childNode)
			}
		}
		return goNode
	}

	if n.Type == html.TextNode {
		trimmedText := strings.TrimSpace(n.Data)
		if trimmedText != "" {
			// TODO should not be a div
			return Div(Text(trimmedText))
		}
	}
	return nil
}

func ParseHTMLString(htmlStr string) (*Node, error) {
	doc, err := html.Parse(strings.NewReader(htmlStr))
	if err != nil {
		return nil, err
	}

	// TODO html.Parse wraps everything in html, so need to extract the body
	var body *html.Node
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "body" {
			body = n.FirstChild
		}
		if n.Type == html.ElementNode && n.Data == "html" {
			body = n.LastChild.FirstChild
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	// If no body found, use the document itself
	if body == nil {
		body = doc
	}

	// Convert the HTML nodes to the Go library format
	h := ParseHTML(body)
	if h == nil {
		return nil, fmt.Errorf("could not parse HTML")
	}
	return h, nil
}
