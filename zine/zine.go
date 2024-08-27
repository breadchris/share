package zine

import (
	. "github.com/breadchris/share/html"
)

func ZineIndex() *Node {
	return Html(
		Head(
			Title(T("Zine Maker!")),
			Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
			Script(Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js")),

			Link(Rel("stylesheet"), Href("https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css")),
			Link(Rel("stylesheet"), Href("/static/styles.css")),
		),
		Body(
			Div(H1(T("Zine Creator"))),
			PanelNav(),
			PanelForm(),
			Zine(),
		),
	)
}

func PanelForm() *Node {
	return Div(Id("panel_form_div"),
		Form(Id("panel_form"), Attr("hx-post", "zine/create-panel"), Attr("hx-target", "#panel_1"), Attr("hx-swap", "beforeend"), Attr("enctype", "multipart/form-data"),
			TextArea(Name("content"), Placeholder("Write your text here")),
			Div(Input(Type("file"), Name("uploadfile"))),
			Div(Button(Class("bg-blue-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Type("submit"),
				T("Create Panel")),
			),
		),
	)
}

func PanelNav() *Node {
	return Div(
		Button(Class("panelselctionbutton bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Attr("value", "1"), T("Page 1")),
		Button(Class("panelselctionbutton bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Attr("value", "2"), T("Page 2")),
		Button(Class("panelselctionbutton bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Attr("value", "3"), T("Page 3")),
		Button(Class("panelselctionbutton bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Attr("value", "4"), T("Page 4")),
		Button(Class("panelselctionbutton bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Attr("value", "5"), T("Page 5")),
		Button(Class("panelselctionbutton bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Attr("value", "6"), T("Page 6")),
		Button(Class("panelselctionbutton bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Attr("value", "7"), T("Page 7")),
		Button(Class("panelselctionbutton bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Attr("value", "8"), T("Page 8")),
		Script(T(`
				buttons = document.getElementsByClassName("panelselctionbutton")
				for (var i = 0; i < buttons.length; i++) {
					buttons[i].addEventListener("click", function() {
						var dynamicElement = document.getElementById("panel_form");
						dynamicElement.setAttribute("hx-target", "#panel_" + this.value);
					});
				}
			`),
		),
	)
}

type PanelData struct {
	Content string
}

func Zine() *Node {
	return Div(Class("zine-page"),
		Div(Id("panel_1"), Class("zine-panel")),
		Div(Id("panel_2"), Class("zine-panel")),
		Div(Id("panel_3"), Class("zine-panel")),
		Div(Id("panel_4"), Class("zine-panel")),
		Div(Id("panel_5"), Class("zine-panel upsidedown")),
		Div(Id("panel_6"), Class("zine-panel upsidedown")),
		Div(Id("panel_7"), Class("zine-panel upsidedown")),
		Div(Id("panel_8"), Class("zine-panel upsidedown")),
	)
}
