package main

// import (
// 	"net/http"

// 	"github.com/breadchris/share/deps"
// 	. "github.com/breadchris/share/html"
// )

// func Card(d deps.Deps) *http.ServeMux {
// 	commandHandlers["card"] = func() string {
// 		return Div(
// 			Id("card"),
// 			Attr("hx-swap-oob", "innerHTML"),
// 			T("container 1"),
// 		).Render()
// 	}

// 	mux := http.NewServeMux()
// 	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
// 		Html(
// 			Head(
// 				Title(T("Card")),
// 				Script(
// 					Src("https://unpkg.com/htmx.org@1.9.12"),
// 				),
// 				Script(
// 					Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"),
// 				),
// 				TailwindCSS,
// 			),
// 			Body(Div(
// 				Attr("hx-ext", "ws"),
// 				Attr("ws-connect", "/websocket/ws"),
// 				createCard(),
// 			)),
// 		)
// 	})
// 	return mux
// }

// func createCard() *Node {
// 	return Div(
// 		Class("relative flex flex-col my-6 bg-white shadow-sm border border-slate-200 rounded-lg w-96"),
// 		Div(
// 			Class("relative h-56 m-2.5 overflow-hidden text-white rounded-md"),
// 			Form(

// 			),
// 		),
// 		Div(
// 			Class("p-4"),
// 			Div(
// 				P(
// 					Class("text-slate-600 leading-normal font-light"),
// 					T("This is a card"),
// 			),
// 			),
// 		),
// 	)
// }
