package main

// func NewZine(d deps.Deps) *http.ServeMux {
// 	// db := d.Docs.WithCollection("zine")

// 	// registry.Register("edit", func(message string, pageId string) []string {

// 	mux := http.NewServeMux()
// 	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
// 		body := Div(
// 			ReloadNode("zine2.go"),
// 			P(T("Zine")),
// 			Form(
// 				Attr("hx-post", "/websocket/ws"),
// 				Input(
// 					Type("text"),
// 					Name("command"),
// 				),
// 				Input(
// 					Type("submit"),
// 					Value("Send"),
// 				),
// 			),
// 		)

// 		NewWebsocketPage(body.Children).RenderPage(w, r)
// 	})
// 	return mux
// }

// func NewWebsocketPage(children []*Node) *Node {
// 	return Html(
// 		Head(
// 			Title(T("Websocket Test")),
// 			Script(
// 				Src("https://unpkg.com/htmx.org@1.9.12"),
// 			),
// 			Script(
// 				Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
// 			),
// 			TailwindCSS,
// 		),
// 		Body(Div(
// 			Attr("hx-ext", "ws"),
// 			Attr("ws-connect", "/websocket/ws"),
// 			Ch(children),
// 		)),
// 	)
// }
