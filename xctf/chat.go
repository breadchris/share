package xctf

import (
	"fmt"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/xctf/chalgen"
	"time"
)

type ChatState struct {
	Flag       string
	Username   string
	Channel    chalgen.Channel
	UserLookup map[string]chalgen.User
}

type Message struct {
	Username  string
	Content   string
	Timestamp int64
}

func Chat(slack *chalgen.Slack, state ChatState) *Node {
	user, ok := state.UserLookup[state.Username]
	return Div(Class("flex flex-col h-screen"),
		Style(Attr("type", "text/tailwindcss"), T(`
a {
   @apply underline text-blue-600 hover:text-blue-800 visited:text-purple-600
}
`)),
		Div(Class("navbar bg-base-100"),
			Div(Class("flex-1"),
				A(Href("#"), Class("btn btn-ghost text-xl"), T("slick"))),
			Div(Class("flex-none"),
				Ul(Class("menu menu-horizontal px-1 space-x-2"),
					Li(A(Href("#"), T(state.Flag))),
					func() *Node {
						if ok {
							return Ch([]*Node{
								Li(Button(Class("btn"), Attr("onclick", "my_modal_2.showModal()"), T(user.Username))),
								Dialog(Id("my_modal_2"), Class("modal"),
									Div(Class("modal-box"),
										T(user.Bio)),
									Form(Method("dialog"), Class("modal-backdrop"),
										Button(T("close")))),
								Li(A(Href("/logout"), T("logout"))),
							})
						} else {
							return Ch([]*Node{
								Li(Button(Class("btn"), Attr("onclick", "login_modal.showModal()"), T("login"))),
								Dialog(Id("login_modal"), Class("modal"),
									Div(Class("modal-box"),
										Form(Class("space-y-2"), Method("POST"), Action("/login"),
											Label(Class("input input-bordered flex items-center gap-2"),
												Svg(Class("w-4 h-4 opacity-70"), Attr("xmlns", "http://www.w3.org/2000/svg"), Attr("viewBox", "0 0 16 16"),
													Path(Attrs(map[string]string{"d": "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"}))),
												Input(Type("text"), Name("username"), Class("grow"), Placeholder("username"))),
											Label(Class("input input-bordered flex items-center gap-2"),
												Svg(Class("w-4 h-4 opacity-70"), Attr("xmlns", "http://www.w3.org/2000/svg"), Attr("viewBox", "0 0 16 16"),
													Path(Attrs(map[string]string{"d": "M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Z"}))),
												Input(Type("password"), Name("password"), Class("grow")),
											),
											Button(Type("submit"), Class("btn align-right"), T("login")),
										),
										Div(Class("modal-action"),
											Form(Method("dialog"),
												Button(Class("btn"), T("close")),
											),
										),
									),
								),
							})
						}
					}(),
				),
			),
		),
		If(len(slack.Channels) == 0,
			Div(Class("flex-1 flex items-center justify-center"),
				H1(Class("text-3xl font-semibold"), T("Login to view chat messages!")),
			),
			Div(Class("flex bg-gray-900 h-full"),
				Div(Class("w-48 bg-gray-800 text-white flex flex-col"),
					Div(Class("px-4 py-6"),
						H2(Class("text-xl font-semibold"), T("Channels")),
						Ul(Class("mt-6"),
							func() *Node {
								var channels []*Node
								for i, c := range slack.Channels {
									channels = append(channels, Li(Class("mt-2"),
										A(Href(fmt.Sprintf("/?channel_id=%d", i)), Class("flex items-center space-x-2 px-4 py-2 bg-gray-900 rounded-md"),
											Span(T(c.Name))),
									))
								}
								return Ch(channels)
							}(),
						),
					),
				),
				Div(Class("flex-1 overflow-y-auto text-white"),
					Div(Class("px-4 py-6"),
						H1(Class("text-3xl font-semibold"), T(state.Channel.Name)),
						P(Class("mt-4"),
							func() *Node {
								var messages []*Node
								for i, m := range state.Channel.Messages {
									messages = append(messages,
										Div(
											Class("flex items-start space-x-4"),
											Div(
												Class("flex-shrink-0 align-center"),
												Img(Class("h-10 w-10 rounded-full"), Src(state.UserLookup[m.Username].Image), Alt("User avatar")),
											),
											Div(
												Div(Attr("onclick", fmt.Sprintf("openModal('msg_bio_modal_%d')", i)), Class("pointer-cursor text-sm text-gray-700"), T(m.Username)),
												Dialog(
													Id(fmt.Sprintf("msg_bio_modal_%d", i)),
													Class("modal"),
													Div(
														Class("modal-box"),
														T(state.UserLookup[m.Username].Bio),
													),
													Form(
														Method("dialog"),
														Class("modal-backdrop"),
														Button(T("close")),
													),
												),
												Div(Class("mt-1 text-sm font-medium"), Raw(m.Content)),
												Div(Class("text-sm text-gray-700"), T(time.Unix(m.Timestamp, 0).Format(time.ANSIC))),
											),
										),
									)
									messages = append(messages, Div(Class("mt-4")))
								}
								return Ch(messages)
							}(),
						),
					),
				),
			),
		),
	)
}
