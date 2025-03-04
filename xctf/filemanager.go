package xctf

import (
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/xctf/chalgen"
)

type FileManagerState struct {
	Flag     string
	BaseURL  string
	Username string
	URL      FileManagerURL
}

type FileManagerURL struct {
	Login string
}

func FileManager(state FileManagerState, fileManager *chalgen.FileManager) *Node {
	if state.Username != "" {
		return Div(Class("mx-4 space-y-4"),
			P(T(state.Flag)),
			A(Class("btn"), Href(state.BaseURL+"/logout"), T("logout")),
			Ul(Class("menu menu-xs bg-base-200 rounded-lg max-w-xs w-full"),
				func() *Node {
					items := []*Node{}
					for _, u := range fileManager.URLs {
						items = append(items, Li(
							A(Href(u),
								Svg(
									Attr("xmlns", "http://www.w3.org/2000/svg"),
									Attr("fill", "none"),
									Attr("viewBox", "0 0 24 24"),
									Attr("stroke-width", "1.5"),
									Attr("stroke", "currentColor"),
									Class("w-4 h-4"),
									Path(Attrs(map[string]string{
										"stroke-linecap":  "round",
										"stroke-linejoin": "round",
										"d":               "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
									}))),
								T(u),
							),
						))
					}
					return Ch(items)
				}(),
			),
		)
	} else {
		return Div(
			Button(Class("btn"), Attr("onclick", "login_modal.showModal()"), T("login")),
			Dialog(Id("login_modal"), Class("modal"),
				Div(Class("modal-box"),
					Form(Class("space-y-2"), Method("POST"), Action(state.URL.Login),
						Label(Class("input input-bordered flex items-center gap-2"),
							Svg(Attr("xmlns", "http://www.w3.org/2000/svg"), Attr("viewBox", "0 0 16 16"), Attr("fill", "currentColor"), Class("w-4 h-4 opacity-70"),
								Path(Attrs(map[string]string{
									"fill-rule": "evenodd",
									"d":         "M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z",
									"clip-rule": "evenodd",
								}))),
							Input(Type("password"), Name("password"), Class("grow")),
						),
						Button(Type("submit"), Class("btn"), T("login")),
					),
					Div(Class("modal-action"),
						Form(Method("dialog"),
							Button(Class("btn"), T("close")),
						),
					),
				),
			),
		)
	}
}
