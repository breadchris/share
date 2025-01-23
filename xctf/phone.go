package xctf

import (
	"fmt"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/xctf/chalgen"
	"time"
)

type PhoneState struct {
	Flag          string
	TrackerLogin  string
	TrackerAuthed bool
	NextAttempt   time.Time
}

type TrackerEvent struct {
	Timestamp int64
	Name      string
}

type Phone struct {
	Name string
	Apps []chalgen.PhoneApp
}

func App(state PhoneState, i int, a *chalgen.PhoneApp) *Node {
	if a.App == nil {
		if a.HTML != "" {
			return Raw(a.HTML)
		} else {
			return Iframe(Src(a.URL), Class("w-full h-96"))
		}
	}
	switch t := a.App.Value.(type) {
	// TODO breadchris this isn't going to work, need type and value for apps
	case *chalgen.PhotoGallery:
		return Div(Class("flex flex-col items-center"),
			H1(Class("text-2xl font-bold"), T(a.Name)),
			Div(Class("carousel carousel-center max-w-md p-4 space-x-4 bg-neutral rounded-box"),
				func() *Node {
					photos := []*Node{}
					for j, p := range t.URLs {
						photos = append(photos, Div(
							Class("carousel-item relative w-64 h-96 overflow-hidden"),
							Attr("onclick", fmt.Sprintf("document.getElementById('photo_%d_%d').classList.toggle('w-full');", i, j)),
							Id(fmt.Sprintf("photo_%d_%d", i, j)),
							Img(Src(p), Class("rounded-box min-w-full min-h-full object-cover top-1/2 transform")),
						))
					}
					return Ch(photos)
				}(),
			),
		)
	case *chalgen.Tracker:
		if state.TrackerAuthed {
			return Div(Class("flex flex-col items-center"),
				H1(Class("text-2xl font-bold"), T(a.Name)),
				Ul(Class("timeline timeline-vertical"),
					func() *Node {
						events := []*Node{}
						for _, e := range t.Events {
							events = append(events, Li(
								Div(Class("timeline-start"), T(time.Unix(e.Timestamp, 0).Format(time.RFC822))),
								Div(Class("timeline-middle"), Svg(
									Attr("xmlns", "http://www.w3.org/2000/svg"),
									Attr("viewBox", "0 0 20 20"),
									Attr("fill", "currentColor"),
									Class("w-5 h-5"),
									Path(Attrs(map[string]string{
										"fill-rule": "evenodd",
										"d":         "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
										"clip-rule": "evenodd",
									})),
								)),
								Div(Class("timeline-end timeline-box"), T(e.Name)),
							))
						}
						return Ch(events)
					}(),
				),
			)
		} else {
			return Div(
				P(T("enter your fingerprint")),
				Form(Class("space-y-2"), Method("POST"), Action(state.TrackerLogin),
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
			)
		}
	default:
		return P(T("unknown app type"))
	}
	return nil
}

func RenderPhone(state PhoneState, phone *chalgen.Phone) *Node {
	return Div(Class("flex h-screen flex-col space-y-4"),
		Div(Class("mockup-phone overflow-y-scroll h-fit"),
			Div(Class("camera")),
			Div(Class("display overflow-y-scroll"),
				Div(Class("artboard artboard-demo phone-1 overflow-y-scroll"),
					Div(Class("flex flex-col items-center space-y-12"),
						H1(Class("text-2xl font-bold"), T(phone.Name)),
						Div(Class("grid grid-cols-3 gap-4"),
							func() *Node {
								apps := []*Node{}
								for i, a := range phone.Apps {
									apps = append(apps,
										A(Class("btn w-20 h-20 bg-blue-500 flex justify-center items-center text-white"), Attr("onclick", fmt.Sprintf("document.getElementById('my_modal_%d').showModal()", i)),
											T(a.Name)),
										Dialog(Id(fmt.Sprintf("my_modal_%d", i)), Class("modal"),
											Div(Class("modal-box"),
												App(state, i, &a),
												Div(Class("modal-action"),
													Form(Method("dialog"),
														Button(Class("btn"), T("Close")))),
											),
										),
									)
								}
								return Ch(apps)
							}(),
						),
					),
				),
			),
		),
		Div(Class("text-center"),
			P(T(state.Flag)),
		),
	)
}
