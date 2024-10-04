---
title: Testing syntax highlighting in the blog
tags:
    - test
    - go
created_at: "2024-09-22T23:22:57-04:00"
blocknote: '[{"id":"bc9cfb40-bf9a-4b99-bc76-7fcc95efb6c8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"This is some godom code that syntax highlighting should pick up on for the blog.","styles":{}}],"children":[]},{"id":"da4ea444-4d6c-4968-aa85-7b810fa60a5c","type":"procode","props":{"data":"func RenderHome(state HomeState) *Node {\n\tvar articles []*Node\n\tfor _, post := range state.Posts {\n\t\tarticles = append(articles, newArticlePreview(post))\n\t}\n\n\treturn PageLayout(\n\t\tDiv(\n\t\t\tArticle(Class(\"first-entry home-info\"),\n\t\t\t\tHeader(Class(\"entry-header m-2 p-3.5\"),\n\t\t\t\t\tH1(T(\"breadchris\")),\n\t\t\t\t),\n\t\t\t\tDiv(Class(\"entry-content\"), T(\"hack the planet\")),\n\t\t\t\tFooter(Class(\"entry-footer\"),\n\t\t\t\t\tDiv(Class(\"social-icons\"),\n\t\t\t\t\t\tA(Href(\"https://github.com/breadchris\"), Target(\"_blank\"), Rel(\"noopener noreferrer me\"), Attr(\"title\", \"Github\"),\n\t\t\t\t\t\t\tText(\"github\"),\n\t\t\t\t\t\t),\n\t\t\t\t\t\tA(Href(\"https://twitter.com/breadchris\"), Target(\"_blank\"), Rel(\"noopener noreferrer me\"), Attr(\"title\", \"Twitter\"),\n\t\t\t\t\t\t\tText(\"twitter\"),\n\t\t\t\t\t\t),\n\t\t\t\t\t\tA(Href(\"https://youtube.com/@breadchris/streams\"), Target(\"_blank\"), Rel(\"noopener noreferrer me\"), Attr(\"title\", \"YouTube\"),\n\t\t\t\t\t\t\tText(\"youtube\"),\n\t\t\t\t\t\t),\n\t\t\t\t\t\tA(Href(\"https://cal.com/breadchris\"), Target(\"_blank\"), Rel(\"noopener noreferrer me\"), Attr(\"title\", \"Cal.com\"),\n\t\t\t\t\t\t\tText(\"cal.com\"),\n\t\t\t\t\t\t),\n\t\t\t\t\t),\n\t\t\t\t),\n\t\t\t),\n\t\t\tChl(articles...),\n\t\t),\n\t)\n}\n\n"},"children":[]},{"id":"447b3cf5-8339-49b2-8856-7829524050e8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]'

---
This is some godom code that syntax highlighting should pick up on for the blog.

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
