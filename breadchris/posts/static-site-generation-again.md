---
title: Static Site Generation, Again
tags:
    - blog
    - go
created_at: "2024-10-03T23:43:53-04:00"
blocknote: '[{"id":"fa9ed98d-0537-428b-8312-f4a90120d1d5","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"I got the static site generation working while working on the plane! It feels pretty hacker to be able to have a vision of what you want to work on and then have it come to life so quickly. The static site generation is especially exciting because I feel like I am that much closer to being able to host blogs for people with little to no cost to me. It would be great to be able to offer a super cheap hosting option for a blog.","styles":{}}],"children":[]},{"id":"d686aef6-3118-416b-b023-ba9e8e5dece6","type":"image","props":{"backgroundColor":"default","textAlignment":"left","name":"Screenshot 2024-10-03 at 11.21.03 PM.png","url":"/data/uploads/3f675243-d839-4af8-8202-521e113a9559.png","caption":"","showPreview":true,"previewWidth":512},"children":[]},{"id":"ea249ade-0868-493c-923e-b769cbd15dd8","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"1) I was surprised that I could drag and drop an image into this editor and have it just work (blocknotejs is dope) 2) I am realizing that images will not work properly on the blog, I will need to make sure their routes get rewritten.","styles":{}}],"children":[]},{"id":"f043dcc4-49ee-4cef-90a3-a50ecac0eb78","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":3},"content":[{"type":"text","text":"some jank code","styles":{}}],"children":[]},{"id":"38235bb3-706a-4101-8363-07e3a1ba62dc","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"When you are writing a static site generator, you will eventually need to make sure the generated site knows what domain/URL/base path it is hosted from. For example, this blog is hosted on ","styles":{}},{"type":"text","text":"https://breadchris.com","styles":{"code":true}},{"type":"text","text":". Locally, my generated site is hosted from ","styles":{}},{"type":"text","text":"http://localhost:8080/data/sites/generated/breadchris.com/latest/","styles":{"code":true}},{"type":"text","text":". For local development, I need to make sure all links have the prefix ","styles":{}},{"type":"text","text":"/data/sites/generated/breadchris.com/latest/","styles":{"code":true}},{"type":"text","text":" since that is where the content is hosted on my computer. To get this to work within ","styles":{}},{"type":"text","text":"godom","styles":{"code":true}},{"type":"text","text":", I could have prop drilled the URL throughout the DOM components, but I thought the dev experience would have been annoying since most hrefs or script srcs would depend on this. Instead, I felt it was better to have all links reference the root of the site (ex. /some/path) and then when the page is being rendered, modify the path so that it references the correct base URL. I called these \"DynamicAttrs\", for a lack of a better term, and I really cannot figure out if this is stupid or not. It required no changes to the existing godom code I wrote for my blog''s views, but it did require updating the html library.\n","styles":{}}],"children":[]},{"id":"1926a63a-2459-4ff3-9c10-8d7e736976d4","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"An ","styles":{}},{"type":"text","text":"Href","styles":{"code":true}},{"type":"text","text":" attribute will build itself just before rendering:","styles":{}}],"children":[]},{"id":"89c5fe7a-471b-4e53-97f2-8147e16759d4","type":"procode","props":{"data":"func Href(s string) *Node {\n\treturn &Node{\n\t\ttransform: func(p *Node) {\n\t\t\tp.DynamicAttrs[\"href\"] = func(ctx context.Context) string {\n\t\t\t\tif strings.HasPrefix(s, \"/\") {\n\t\t\t\t\tif baseURL, ok := ctx.Value(\"baseURL\").(string); ok {\n\t\t\t\t\t\treturn baseURL + s\n\t\t\t\t\t} else {\n\t\t\t\t\t\treturn \"baseURL not found in ctx\"\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\treturn s\n\t\t\t}\n\t\t},\n\t}\n}"},"children":[]},{"id":"ee30f330-6bfb-4ae5-a0b3-892a056d411a","type":"procode","props":{"data":"ctx := context.WithValue(context.Background(), \"baseURL\", \"/data/sites/generated/breadchris.com/latest/\")\n// ...\nattrs := map[string]string{}\nif s.locator != \"\" {\n    attrs[\"data-godom\"] = s.locator\n}\nfor k, v := range s.DynamicAttrs {\n    attrs[k] = v(ctx)\n}\nfor k, v := range s.Attrs {\n    attrs[k] = v\n}"},"children":[]},{"id":"e239aacb-2b3f-460c-94ee-45b8e2da7bcc","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"f7b64c65-4b60-48a6-8a3e-c05b7a2880d6","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"I totally almost just got sad, I hit back in my browser and thought I lost all of this writing...but past chris is a G, he totally has all of this state saved to local storage","styles":{}}],"children":[]},{"id":"389a14d7-fada-468a-98a5-3d13be21dc9d","type":"procode","props":{"data":"async function saveToStorage(jsonBlocks: Block[]) {\n    // Save contents to local storage. You might want to debounce this or replace\n    // with a call to your API / database.\n    localStorage.setItem(\"editorContent\", JSON.stringify(jsonBlocks));\n}\n\nasync function loadFromStorage() {\n    // Gets the previously stored editor contents.\n    const storageString = localStorage.getItem(\"editorContent\");\n    return storageString\n        ? (JSON.parse(storageString) as PartialBlock[])\n        : undefined;\n}"},"children":[]},{"id":"9013c9ab-e1fa-442e-9403-710b053fec9b","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"fd4a897f-16b7-4022-8c7a-3c4baa51f02f","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"There was a distinct moment where I thought that adding the attr stuff in the way I did was stupid. And it might be! I had to remind myself that code isn''t stupid if it gets the job done, and it did. I might have written some lame code, but at least I have a working feature now that brings me closer to providing someone value!","styles":{}}],"children":[]},{"id":"0f55e211-4b5a-4865-9199-1c6544b0a5fe","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]'

---
I got the static site generation working while working on the plane! It feels pretty hacker to be able to have a vision of what you want to work on and then have it come to life so quickly. The static site generation is especially exciting because I feel like I am that much closer to being able to host blogs for people with little to no cost to me. It would be great to be able to offer a super cheap hosting option for a blog.

![Screenshot 2024-10-03 at 11.21.03 PM.png](/data/uploads/3f675243-d839-4af8-8202-521e113a9559.png)

1) I was surprised that I could drag and drop an image into this editor and have it just work (blocknotejs is dope) 2) I am realizing that images will not work properly on the blog, I will need to make sure their routes get rewritten.

### some jank code

When you are writing a static site generator, you will eventually need to make sure the generated site knows what domain/URL/base path it is hosted from. For example, this blog is hosted on `https://breadchris.com`. Locally, my generated site is hosted from `http://localhost:8080/data/sites/generated/breadchris.com/latest/`. For local development, I need to make sure all links have the prefix `/data/sites/generated/breadchris.com/latest/` since that is where the content is hosted on my computer. To get this to work within `godom`, I could have prop drilled the URL throughout the DOM components, but I thought the dev experience would have been annoying since most hrefs or script srcs would depend on this. Instead, I felt it was better to have all links reference the root of the site (ex. /some/path) and then when the page is being rendered, modify the path so that it references the correct base URL. I called these "DynamicAttrs", for a lack of a better term, and I really cannot figure out if this is stupid or not. It required no changes to the existing godom code I wrote for my blog's views, but it did require updating the html library.

An `Href` attribute will build itself just before rendering:

    func Href(s string) *Node {
    	return &Node{
    		transform: func(p *Node) {
    			p.DynamicAttrs["href"] = func(ctx context.Context) string {
    				if strings.HasPrefix(s, "/") {
    					if baseURL, ok := ctx.Value("baseURL").(string); ok {
    						return baseURL + s
    					} else {
    						return "baseURL not found in ctx"
    					}
    				}
    				return s
    			}
    		},
    	}
    }

<!---->

    ctx := context.WithValue(context.Background(), "baseURL", "/data/sites/generated/breadchris.com/latest/")
    // ...
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

I totally almost just got sad, I hit back in my browser and thought I lost all of this writing...but past chris is a G, he totally has all of this state saved to local storage

    async function saveToStorage(jsonBlocks: Block[]) {
        // Save contents to local storage. You might want to debounce this or replace
        // with a call to your API / database.
        localStorage.setItem("editorContent", JSON.stringify(jsonBlocks));
    }

    async function loadFromStorage() {
        // Gets the previously stored editor contents.
        const storageString = localStorage.getItem("editorContent");
        return storageString
            ? (JSON.parse(storageString) as PartialBlock[])
            : undefined;
    }

There was a distinct moment where I thought that adding the attr stuff in the way I did was stupid. And it might be! I had to remind myself that code isn't stupid if it gets the job done, and it did. I might have written some lame code, but at least I have a working feature now that brings me closer to providing someone value!
