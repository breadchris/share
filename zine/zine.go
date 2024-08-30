package zine

import (
	"net/http"

	. "github.com/breadchris/share/html"
)

type ZineMaker struct {
	OpenAIKey string
}

func NewZineMaker(openAIKey string) *ZineMaker {
	return &ZineMaker{OpenAIKey: openAIKey}
}

func (z *ZineMaker) RenderZine(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(ZineIndex().Render()))
}

func ZineIndex() *Node {
	return Html(
		Head(
			Title(T("Zine Maker!")),
			Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
			Script(Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js")),
			Script(Src("https://cdn.tailwindcss.com")),
			Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"), Attr("rel", "stylesheet"), Attr("type", "text/css")),
			Link(Rel("stylesheet"), Href("/zine/styles.css")),
			Style(T("body { font-family: 'Inter', sans-serif; }")),
		),
		Body(Class("min-h-screen flex flex-col"),
			Div(Class("container mx-auto text-center mt-16"),
				H1(Class("text-4xl font-bold mb-4"), T("Zine Creator")),
				PanelNav(),
				PanelForm(),
				Zine(),
				CreateZineButton(),
			),
		),
	)
}

func CreateZineButton() *Node {
	return Div(Class("mt-8"),
		Button(Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"),
			Attr("hx-post", "/zine/generate-zine-image"),
			Attr("hx-include", "#new-zine"),
			// Attr("hx-params", "content=#new-zine.outerHTML&div_id=new-zine"),
			Attr("hx-target", "#zine-image"),
			T("Generate Zine Image"),
		),
		Div(Id("zine-image"), Class("mt-4")),
	)
}

func PanelForm() *Node {
	return Div(Id("panel_form_div"), Class("pt-4"),
		Form(Id("panel_form"), Attr("hx-post", "/zine/create-panel"), Attr("hx-target", "#panel_1"),
			Attr("hx-swap", "innerHTML"), Attr("enctype", "multipart/form-data"), Attr("hx-on::after-request", "this.reset()"),
			Div(Class("flex justify-center space-x-4"),
				TextArea(Name("content"), Placeholder("Write your text here")),
				Div(Id("AddImage"), Input(Type("file"), Name("uploadfile"))),
				Div(
					Button(Class("bg-blue-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Type("submit"),
						T("Create Panel")),
					Button(Id("ImageGenButton"), Class("bg-green-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"), Type("button"),
						Attr("hx-post", "/zine/generate-image"), Attr("hx-target", "#panel_1"),
						Attr("hx-swap", "innerHTML"), T("Generate Image")),
				),
			),
		),
	)
}

func PanelNav() *Node {
	return Div(Class("flex justify-center space-x-4"),
		Button(Id("1"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "1"), T("Page 1")),
		Button(Id("2"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "2"), T("Page 2")),
		Button(Id("3"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "3"), T("Page 3")),
		Button(Id("4"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "4"), T("Page 4")),
		Button(Id("5"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "5"), T("Page 5")),
		Button(Id("6"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "6"), T("Page 6")),
		Button(Id("7"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "7"), T("Page 7")),
		Button(Id("8"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "8"), T("Page 8")),
		Script(T(`
						buttons = document.getElementsByClassName("panelselctionbutton")
						for (var i = 0; i < buttons.length; i++) {
							buttons[i].addEventListener("click", function() {
								var dynamicElement = document.getElementById("panel_form");
								var dynamicButton = document.getElementById("ImageGenButton");

								dynamicElement.setAttribute("hx-target", "#panel_" + this.value);
								dynamicButton.setAttribute("hx-target", "#panel_" + this.value);
								

								// Remove the "active" class from all buttons
								for (var j = 0; j < buttons.length; j++) {
									buttons[j].style.backgroundColor="rgb(16 185 129)";
								}

								// Add the "active" class to the clicked button
								this.style.backgroundColor="rgb(6 78 59)";
							});
						}
						document.addEventListener('htmx:configRequest', (event) => {
						const newZineElement = document.querySelector("#new-zine");
						if (newZineElement) {
							const htmlContent = newZineElement.outerHTML;
							event.detail.parameters['new-zine'] = htmlContent;
							event.detail.parameters['div_id'] = 'new-zine'; // Add the div_id if needed
						}
});
					`),
		),
	)
}

type PanelData struct {
	Content string
}

func Zine() *Node {
	return Div(Id("new-zine"), ZinePage(), Class("text-black"),
		Div(Id("panel_2"), ZinePanel(), T("Panel 2")),
		Div(Id("panel_3"), ZinePanel(), T("Panel 3")),
		Div(Id("panel_4"), ZinePanel(), T("Panel 4")),
		Div(Id("panel_5"), ZinePanel(), T("Panel 5")),
		Div(Id("panel_1"), ZinePanelUpsideDown(), P(T("Panel 1"))),
		Div(Id("panel_8"), ZinePanelUpsideDown(), P(T("Panel 8"))),
		Div(Id("panel_7"), ZinePanelUpsideDown(), P(T("Panel 7"))),
		Div(Id("panel_6"), ZinePanelUpsideDown(), P(T("Panel 6"))),
	)
}
