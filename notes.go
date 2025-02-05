package main

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/breadchris/share/calendar"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"github.com/russross/blackfriday/v2"
)

type NotesState struct {
	Posts []PostState
}

type PostState struct {
	ID            string
	Date          string
	Content       string
	CommentURL    string
	Address       string
	UserReactions []UserReaction
	References    []Reference
	UserID        string
}

type UserReaction struct {
	Emoji string
	Count int
	Label string
}

type Reference struct {
	ID   string
	Text string
	URL  string
}																																																																																																																																																																																																																											

func NewNotes(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "baseURL", "/notes")

		id := r.PathValue("id")

		userID, err := d.Session.GetUserID(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var notesState NotesState
		if err := d.Docs.Get("notes", &notesState); err != nil {
			notesState = NotesState{}
			if err = d.Docs.Set("notes", notesState); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
		switch r.Method {
		case http.MethodGet:
			if id != "" {
				for _, post := range notesState.Posts {
					if post.ID == id {
						DefaultLayout(Post(&post)).RenderPageCtx(ctx, w, r)
						return
					}
				}
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			DefaultLayout(
				MemoInterface(notesState),
			).RenderPageCtx(ctx, w, r)
		case http.MethodDelete:
			var newPosts []PostState
			for _, post := range notesState.Posts {
				if post.ID == id && post.UserID != userID {
					http.Error(w, "unauthorized", http.StatusUnauthorized)
					return
				}
				if post.ID != id {
					newPosts = append(newPosts, post)
				}
			}
			notesState.Posts = newPosts

			if err := d.Docs.Set("notes", notesState); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		case http.MethodPost:
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			md := r.FormValue("markdown")
			//h := r.FormValue("html")
			//bn := r.FormValue("blocknote")

			renderer := blackfriday.NewHTMLRenderer(blackfriday.HTMLRendererParameters{})
			b := blackfriday.Run([]byte(md), blackfriday.WithRenderer(renderer))

			p := PostState{
				ID:            uuid.NewString(),
				Content:       string(b),
				Date:          time.Now().Format("2006-01-02T15:04:05.000Z"),
				UserReactions: []UserReaction{},
				UserID:        userID,
			}
			notesState.Posts = append([]PostState{p}, notesState.Posts...)

			if err := d.Docs.Set("notes", notesState); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			Post(&p).RenderPageCtx(ctx, w, r)
		}
	})
	return mux
}

func MemoInterface(notesState NotesState) *Node {
	events := []calendar.Event{
		{
			ID:          "1",
			Title:       "cook food",
			Start:       time.Date(2024, time.October, 12, 18, 0, 0, 0, time.UTC),
			End:         time.Date(2024, time.October, 12, 21, 0, 0, 0, time.UTC),
			AllDay:      false,
			IsRecurring: false,
		},
	}
	cal := calendar.InitializeCalendar(time.Now(), "Month", events)

	return DefaultLayout(
		Div(
			Link(Href_("/breadchris/static/editor.css"), Rel("stylesheet"), Type("text/css")),
			Script(Src("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js")),
			Style(T(`
					 h1 { font-size: 2em; }
					 h2 { font-size: 1.5em; }
					 h3 { font-size: 1.17em; }
					 h4 { font-size: 1.00em; }
					 h5 { font-size: 0.8em; }
				 `)),
			RenderMemo(cal, notesState),
			Script(Src_("/breadchris/static/editor.js"), Type("module")),
		),
	)
}

func RenderSmallCalendar(state calendar.State) *Node {
	var events []calendar.Event
	for _, week := range state.DaysInView {
		for _, day := range week {
			events = append(events, day.Events...)
		}
	}
	return Div(
		Class("hidden md:block"),
		H2(
			Class("text-base font-semibold"),
		),
		Div(
			//Class("lg:grid lg:grid-cols-12 lg:gap-x-16"),
			Div(
				Class("text-center lg:col-start-8 lg:col-end-13 lg:row-start-1 lg:mt-9 xl:col-start-9"),
				Div(
					Class("flex items-center"),
					Button(
						Type("button"),
						Class("-m-1.5 flex flex-none items-center justify-center p-1.5"),
						Span(Class("sr-only"), Text("Previous month")),
						Svg(
							Class("h-5 w-5"),
							ViewBox("0 0 20 20"),
							Fill("currentColor"),
							Path(FillRule("evenodd"), D("M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"), ClipRule("evenodd")),
						),
					),
					Div(Class("flex-auto text-sm font-semibold"), Text(state.Month.String())),
					Button(
						Type("button"),
						Class("-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"),
						Span(Class("sr-only"), Text("Next month")),
						Svg(
							Class("h-5 w-5"),
							ViewBox("0 0 20 20"),
							Fill("currentColor"),
							Path(FillRule("evenodd"), D("M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"), ClipRule("evenodd")),
						),
					),
				),
				Div(
					Class("mt-6 grid grid-cols-7 text-xs/6 text-gray-500"),
					Ch(stringMap([]string{"M", "T", "W", "T", "F", "S", "S"}, func(day string) *Node {
						return Div(Text(day))
					})),
				),
				Div(
					Class("isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200"),
					Ch(calendar.WeekMap(state.DaysInView, func(week []calendar.Day, i int) []*Node {
						return calendar.DayMap(week, func(day calendar.Day, i int) *Node {
							return Button(
								Type("button"),
								Class(
									dayButtonClass(day),
								),
								Time(
									Datetime(day.Date.Format("2006-01-02")),
									Class("mx-auto flex h-7 w-7 items-center justify-center rounded-full"),
									Text(fmt.Sprintf("%d", day.Date.Day())),
								),
							)
						})
					})),
				),
				//Button(
				//	Type("button"),
				//	Class("mt-8 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"),
				//	Text("Add event"),
				//),
			),
			Ol(
				Class("mt-4 divide-y divide-gray-100 text-sm/6 lg:col-span-7 xl:col-span-8"),
				Ch(calendar.EventMap(events, func(event calendar.Event, i int) *Node {
					return Li(
						Class("relative flex space-x-6 py-6 xl:static"),
						Img(
							Src("https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"),
							Alt(""),
							Class("h-14 w-14 flex-none rounded-full"),
						),
						Div(
							Class("flex-auto"),
							H3(Class("pr-10 font-semibold xl:pr-0"), Text(event.Title)),
							Dl(
								Class("mt-2 flex flex-col text-gray-500 xl:flex-row"),
								renderEventDetails(event),
							),
						),
					)
				})),
			),
		),
	)
}

func stringMap(strings []string, iteratee func(string) *Node) []*Node {
	var nodes []*Node
	for _, s := range strings {
		nodes = append(nodes, iteratee(s))
	}
	return nodes
}

func dayButtonClass(day calendar.Day) string {
	var classes []string
	if day.IsToday {
		classes = append(classes, "bg-white font-semibold text-indigo-600")
	} else {
		classes = append(classes, "bg-gray-50 text-gray-400")
	}
	return strings.Join(classes, " ")
}

func renderEventDetails(event calendar.Event) *Node {
	return Div(
		Class("flex items-start space-x-3"),
		Dt(Class("mt-0.5"), Span(Class("sr-only"), Text("Date"))),
		Svg(
			Class("h-5 w-5 text-gray-400"),
			ViewBox("0 0 20 20"),
			Fill("currentColor"),
			Path(FillRule("evenodd"), D("M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"), ClipRule("evenodd")),
		),
		Dd(Text(event.Start.Format("January 2, 2006 at 3:04 PM"))),
	)
}

func Post(state *PostState) *Node {
	var references []*Node
	for _, ref := range state.References {
		references = append(references, A(
			Class("w-auto max-w-full flex flex-row justify-start items-center text-sm leading-5 text-gray-600 dark:text-gray-400 dark:border-zinc-700 dark:bg-zinc-900 hover:underline"),
			Href(ref.URL),
			Span(Class("text-xs opacity-60 leading-4 border font-mono px-1 rounded-full mr-1 dark:border-zinc-700"), Text(ref.ID)),
			Span(Class("truncate"), Text(ref.Text)),
		))
	}
	var reactions []*Node
	for _, reaction := range state.UserReactions {
		reactions = append(reactions, Div(
			Class("h-7 border px-2 py-0.5 rounded-full font-memo flex flex-row justify-center items-center gap-1 dark:border-zinc-700 cursor-pointer bg-blue-100 border-blue-200 dark:bg-zinc-900"),
			AriaLabel(fmt.Sprintf("yourselfhosted reacted with %s", reaction.Emoji)),
			Span(Text(reaction.Emoji)),
			Span(Class("text-sm text-gray-500 dark:text-gray-400"), Text(fmt.Sprintf("%d", reaction.Count))),
		))
	}
	return Div(
		Class("group relative flex flex-col justify-start items-start w-full px-4 py-3 mb-2 gap-2 bg-white dark:bg-zinc-800 rounded-lg border border-white dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700"),
		Id("div-"+state.ID),
		Div(
			Class("w-full flex flex-row justify-between items-center gap-2"),
			Div(
				Class("w-auto max-w-[calc(100%-8rem)] grow flex flex-row justify-start items-center"),
				Div(
					Class("w-full text-sm leading-tight text-gray-400 dark:text-gray-500 select-none"),
					Datetime(state.Date),
				),
			),
			Div(
				Class("flex flex-row justify-end items-center select-none shrink-0 gap-2"),
				Div(
					Class("w-auto invisible group-hover:visible flex flex-row justify-between items-center gap-2"),
					Div(
						AriaControls(":rq:"),
						Tabindex("0"),
						Class("MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd"),
						Role("button"),
						AriaHaspopup("menu"),
						AriaExpanded("false"),
						Span(
							Class("h-7 w-7 flex justify-center items-center rounded-full border dark:border-zinc-700 hover:opacity-70 border-none w-auto h-auto"),
							HxGet("/"+state.ID),
							RenderPencilSvg(),
						),
					),
				),
				Div(
					Class("w-auto invisible group-hover:visible flex flex-row justify-between items-center gap-2"),
					Div(
						AriaControls(":rq:"),
						Tabindex("0"),
						Class("MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd"),
						Role("button"),
						AriaHaspopup("menu"),
						AriaExpanded("false"),
						Span(
							Class("h-7 w-7 flex justify-center items-center rounded-full border dark:border-zinc-700 hover:opacity-70 border-none w-auto h-auto"),
							HxDelete("/"+state.ID),
							HxTarget("#div-"+state.ID),
							HxSwap("outerHTML"),
							RenderTrashSvg(),
						),
					),
				),
				Div(
					Class("w-auto invisible group-hover:visible flex flex-row justify-between items-center gap-2"),
					Div(
						AriaControls(":rq:"),
						Tabindex("0"),
						Class("MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd"),
						Role("button"),
						AriaHaspopup("menu"),
						AriaExpanded("false"),
						A(
							Class("h-7 w-7 flex justify-center items-center rounded-full border dark:border-zinc-700 hover:opacity-70 border-none w-auto h-auto"),
							Href("/"+state.ID),
							RenderShare(),
						),
					),
				),
				Div(
					Class("w-auto invisible group-hover:visible flex flex-row justify-between items-center gap-2"),
					Div(
						AriaControls(":rq:"),
						Tabindex("0"),
						Class("MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd"),
						Role("button"),
						AriaHaspopup("menu"),
						AriaExpanded("false"),
						Span(
							Class("h-7 w-7 flex justify-center items-center rounded-full border dark:border-zinc-700 hover:opacity-70 border-none w-auto h-auto"),
							Svg(
								Stroke("currentColor"), StrokeLinejoin("round"), Xmlns("http://www.w3.org/2000/svg"), Width("24"), Height("24"),
								ViewBox("0 0 24 24"), Fill("none"), StrokeWidth("2"), StrokeLinecap("round"),
								Class("lucide lucide-smile-plus w-4 h-4 mx-auto text-gray-500 dark:text-gray-400"),
								Path(D("M22 11v1a10 10 0 1 1-9-10")),
								Path(D("M8 14s1.5 2 4 2 4-2 4-2")),
								Line(X1("9"), X2("9.01"), Y1("9"), Y2("9")),
								Line(X1("15"), X2("15.01"), Y1("9"), Y2("9")),
								Path(D("M16 5h6")),
								Path(D("M19 2v6")),
							),
						),
					),
				),
				If(state.CommentURL != "",
					A(
						Class("flex flex-row justify-start items-center hover:opacity-70 invisible group-hover:visible"),
						Href(state.CommentURL),
						Svg(
							Fill("none"), StrokeLinecap("round"), StrokeLinejoin("round"),
							Class("lucide lucide-message-circle-more w-4 h-4 mx-auto text-gray-500 dark:text-gray-400"),
							StrokeWidth("2"), Xmlns("http://www.w3.org/2000/svg"), Width("24"), Height("24"),
							ViewBox("0 0 24 24"), Stroke("currentColor"),
							Path(D("M7.9 20A9 9 0 1 0 4 16.1L2 22Z")),
							Path(D("M8 12h.01")),
							Path(D("M12 12h.01")),
							Path(D("M16 12h.01")),
						),
					),
					Nil(),
				),
			),
		),
		Div(
			Class("w-full flex flex-col justify-start items-start text-gray-800 dark:text-gray-400"),
			Div(
				Class("relative w-full max-w-full word-break text-base leading-snug space-y-2 whitespace-pre-wrap"),
				P(Span(Raw(state.Content))),
			),
		),
		If(state.Address != "",
			P(
				Class("w-full flex flex-row gap-0.5 items-center text-gray-500"),
				Type("button"),
				AriaHaspopup("dialog"),
				AriaExpanded("false"),
				AriaControls("radix-:r19:"),
				Svg(
					Width("24"), ViewBox("0 0 24 24"), Fill("none"), Stroke("currentColor"), StrokeLinecap("round"),
					Class("lucide lucide-map-pin w-4 h-auto shrink-0"), Xmlns("http://www.w3.org/2000/svg"), Height("24"), StrokeWidth("2"), StrokeLinejoin("round"),
					Path(D("M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0")),
					Circle(Cx("12"), Cy("10"), R("3")),
				),
				Span(Class("text-sm font-normal text-ellipsis whitespace-nowrap overflow-hidden"), Text(state.Address)),
			), Nil(),
		),
		If(len(references) > 0,
			Div(
				Class("relative flex flex-col justify-start items-start w-full px-2 pt-2 pb-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700"),
				Div(
					Class("w-full flex flex-row justify-start items-center mb-1 gap-3 opacity-60"),
					Button(
						Class("w-auto flex flex-row justify-start items-center text-xs gap-0.5 text-gray-500 text-gray-800 dark:text-gray-400"),
						Svg(
							Width("24"), Height("24"), StrokeWidth("2"), StrokeLinejoin("round"), Xmlns("http://www.w3.org/2000/svg"),
							ViewBox("0 0 24 24"), Fill("none"), Stroke("currentColor"), StrokeLinecap("round"),
							Class("lucide lucide-link w-3 h-auto shrink-0 opacity-70"),
							Path(D("M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71")),
							Path(D("M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71")),
						),
						Span(Text("Referencing")),
						Span(Class("opacity-80"), Text("(1)")),
					),
				),
				Div(
					Class("w-full flex flex-col justify-start items-start"),
					Ch(references),
				),
			), Nil()),
		Div(
			Class("w-full flex flex-row justify-start items-start flex-wrap gap-1 select-none"),
			Ch(reactions),
		),
	)
}

func RenderPencilSvg() *Node {
	return Svg(
		Height("24"),
		ViewBox("0 0 24 24"),
		Fill("none"),
		Stroke("currentColor"),
		StrokeLinejoin("round"),
		Class("lucide lucide-message-circle-more w-4 h-4 mx-auto text-gray-500 dark:text-gray-400"),
		Xmlns("http://www.w3.org/2000/svg"),
		Width("24"),
		StrokeWidth("2"),
		StrokeLinecap("round"),
		Path(
			D(
				"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
			),
		),
		Path(D("m15 5 4 4")),
	)
}

func RenderShare() *Node {
	return Svg(
		Width("24"),
		Height("24"),
		ViewBox("0 0 24 24"),
		StrokeLinecap("round"),
		Class("lucide lucide-share-2"),
		Xmlns("http://www.w3.org/2000/svg"),
		Fill("none"),
		Stroke("currentColor"),
		StrokeWidth("2"),
		StrokeLinejoin("round"),
		Circle(Cx("18"), Cy("5"), R("3")),
		Circle(R("3"), Cx("6"), Cy("12")),
		Circle(Cx("18"), Cy("19"), R("3")),
		Line(X1("8.59"), X2("15.42"), Y1("13.51"), Y2("17.49")),
		Line(Y2("10.49"), X1("15.41"), X2("8.59"), Y1("6.51")),
	)
}

func RenderTrashSvg() *Node {
	return Svg(
		StrokeLinejoin("round"),
		Xmlns("http://www.w3.org/2000/svg"),
		ViewBox("0 0 24 24"),
		Fill("none"),
		StrokeLinecap("round"),
		Class("lucide lucide-message-circle-more w-4 h-4 mx-auto text-gray-500 dark:text-gray-400"),
		Width("24"),
		Height("24"),
		Stroke("currentColor"),
		StrokeWidth("2"),
		Path(D("M3 6h18")),
		Path(D("M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6")),
		Path(D("M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2")),
	)
}


func RenderMemo(cal calendar.State, notesState NotesState) *Node {
	var posts []*Node
	for _, s := range notesState.Posts {
		posts = append(posts, Post(&s))
	}
	return Div(
		Class("w-full min-h-full"),
		Div(
			Class(
				"w-full transition-all mx-auto flex flex-row justify-center items-start sm:pl-56",
			),
			Div(
				Class(
					"hidden sm:block group flex flex-col justify-start items-start fixed top-0 left-0 select-none border-r dark:border-zinc-800 h-full bg-zinc-50 dark:bg-zinc-800 dark:bg-opacity-40 transition-all hover:shadow-xl z-2 w-56 px-4",
				),
				Header(
					Class(
						"w-full h-full overflow-auto flex flex-col justify-start items-start py-4 md:pt-6 z-30 hide-scrollbar !h-auto",
					),
					Div(
						Class("relative w-full h-auto px-1 shrink-0"),
						Div(
							AriaControls(":r0:"),
							Tabindex("0"),
							Class(
								"MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd",
							),
							Role("button"),
							AriaHaspopup("menu"),
							AriaExpanded("false"),
							Div(
								Class(
									"py-1 my-1 w-auto flex flex-row justify-start items-center cursor-pointer text-gray-800 dark:text-gray-400 px-3",
								),
								//Div(
								//	Class("w-8 h-8 overflow-clip rounded-xl shrink-0"),
								//	Img(
								//		Class(
								//			"w-full h-auto shadow min-w-full min-h-full object-cover dark:opacity-80",
								//		),
								//		Src("/full-logo.webp"),
								//		Alt(""),
								//	),
								//),
								Span(
									Class(
										"ml-2 text-lg font-medium text-slate-800 dark:text-gray-300 shrink truncate",
									),
									Text("notes"),
								),
							),
						),
					),
					Div(
						Class(
							"w-full px-1 py-2 flex flex-col justify-start items-start shrink-0 space-y-2",
						),
						A(
							Id("header-home"),
							Class(
								"px-2 py-2 rounded-2xl border flex flex-row items-center text-lg text-gray-800 dark:text-gray-400 hover:bg-white hover:border-gray-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 w-full px-4 bg-white drop-shadow-sm dark:bg-zinc-800 border-gray-200 dark:border-zinc-700",
							),
							Href("/"),
							Svg(
								Fill("none"),
								StrokeWidth("2"),
								StrokeLinejoin("round"),
								Class("lucide lucide-house w-6 h-auto opacity-70 shrink-0"),
								Xmlns("http://www.w3.org/2000/svg"),
								Width("24"),
								Height("24"),
								ViewBox("0 0 24 24"),
								Stroke("currentColor"),
								StrokeLinecap("round"),
								Path(D("M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8")),
								Path(
									D(
										"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
									),
								),
							),
							Span(Class("ml-3 truncate"), Text("Home")),
						),
					),
				),
				Div(
					Class("w-full grow h-auto flex flex-col justify-end items-start"),
					Div(
						Class("hidden py-3 group-hover:flex flex-col justify-center items-center"),
						Button(
							Class(
								"border-box inline-flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-none text-sm px-3 py-2 h-9 cursor-pointer hover:opacity-80 bg-transparent rounded-xl",
							),
							Svg(
								Height("24"),
								Stroke("currentColor"),
								StrokeLinecap("round"),
								StrokeLinejoin("round"),
								Width("24"),
								ViewBox("0 0 24 24"),
								Fill("none"),
								StrokeWidth("2"),
								Class("lucide lucide-chevron-left w-5 h-auto opacity-70 mr-1"),
								Xmlns("http://www.w3.org/2000/svg"),
								Path(D("m15 18-6-6 6-6")),
							),
							Text("Collapse"),
						),
					),
				),
			),
			Main(
				Class("w-full h-auto flex-grow shrink flex flex-col justify-start items-center"),
				Section(
					Class(
						"@container w-full max-w-5xl min-h-full flex flex-col justify-start items-center sm:pt-3 md:pt-6 pb-8",
					),
					Div(
						Class("w-full flex flex-row justify-start items-start px-4 sm:px-6 gap-4"),
						Div(
							Class("w-full md:w-[calc(100%-15rem)]"),
							Div(
								Class(
									"mb-2 relative w-full flex flex-col justify-start items-start bg-white dark:bg-zinc-800 px-4 pt-4 rounded-lg border border-gray-200 dark:border-zinc-700",
								),
								Tabindex("0"),
								Form(
									Class("w-full flex flex-col justify-start items-start"),
									HxPost("/"),
									HxTarget("#posts"),
									HxSwap("afterbegin"),
									Div(
										// editor
										Class(
											"flex flex-col justify-start items-start relative w-full h-auto bg-inherit dark:text-gray-300",
										),
										//TextArea(
										//	Class(
										//		"w-full h-full my-1 text-base resize-none overflow-x-hidden overflow-y-auto bg-transparent outline-none whitespace-pre-wrap word-break",
										//	),
										//	Placeholder("Any thoughts..."),
										//),
										Div(Class("w-full"), Id("editor")),
										Input(Type("hidden"), Id("markdown"), Name("markdown")),
										Input(Type("hidden"), Id("html"), Name("html")),
										Input(Type("hidden"), Id("blocknote"), Name("blocknote")),
									),
									Div(
										Class(
											"w-full flex flex-row justify-between items-center py-3 dark:border-t-zinc-500",
										),
										Div(
											Class(
												"shrink-0 flex flex-row justify-end items-center gap-2",
											),
											Button(
												Class(
													"btn",
												),
												Type("submit"),
												Text("Save"),
												Svg(
													StrokeLinecap("round"),
													StrokeLinejoin("round"),
													Class("lucide lucide-send w-4 h-auto ml-1"),
													ViewBox("0 0 24 24"),
													Fill("none"),
													Stroke("currentColor"),
													StrokeWidth("2"),
													Xmlns("http://www.w3.org/2000/svg"),
													Width("24"),
													Height("24"),
													Path(
														D(
															"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
														),
													),
													Path(D("m21.854 2.147-10.94 10.939")),
												),
											),
										),
									),
								),
							),
							Div(
								Id("posts"),
								Ch(posts),
							),
						),
						RenderSmallCalendar(cal),
					),
				),
			),
		),
	)
}

func MemoCal() *Node {
	return Div(
		Class("sticky lg:visible top-0 left-0 shrink-0 -mt-6 w-56 h-full"),
		Aside(
			Class(
				"relative w-full h-auto max-h-screen overflow-auto hide-scrollbar flex flex-col justify-start items-start py-6",
			),
			Div(
				Class(
					"relative w-full h-auto flex flex-row justify-start items-center",
				),
				Svg(
					Stroke("currentColor"),
					StrokeWidth("2"),
					Class(
						"lucide lucide-search absolute left-3 w-4 h-auto opacity-40",
					),
					Width("24"),
					ViewBox("0 0 24 24"),
					Fill("none"),
					StrokeLinecap("round"),
					StrokeLinejoin("round"),
					Xmlns("http://www.w3.org/2000/svg"),
					Height("24"),
					Circle(Cx("11"), Cy("11"), R("8")),
					Path(D("m21 21-4.3-4.3")),
				),
				Input(
					Class(
						"w-full text-gray-500 dark:text-gray-400 bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 text-sm leading-7 rounded-lg p-1 pl-8 outline-none",
					),
					Placeholder("Search memos"),
					Value(""),
				),
				Button(
					AriaHaspopup("dialog"),
					AriaExpanded("false"),
					AriaControls("radix-:r6:"),
					Class("absolute right-3 top-3 opacity-40"),
					Type("button"),
					Svg(
						Xmlns("http://www.w3.org/2000/svg"),
						Width("24"),
						Fill("none"),
						StrokeLinejoin("round"),
						Class("lucide lucide-settings2 w-4 h-auto shrink-0"),
						Height("24"),
						ViewBox("0 0 24 24"),
						Stroke("currentColor"),
						StrokeWidth("2"),
						StrokeLinecap("round"),
						Path(D("M20 7h-9")),
						Path(D("M14 17H5")),
						Circle(Cx("17"), Cy("17"), R("3")),
						Circle(Cy("7"), R("3"), Cx("7")),
					),
				),
			),
			Div(
				Class(
					"group w-full border mt-2 py-2 px-3 rounded-lg space-y-0.5 text-gray-500 dark:text-gray-400 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800",
				),
				Div(
					Class(
						"w-full mb-1 flex flex-row justify-between items-center",
					),
					Div(
						Class(
							"relative text-base font-medium leading-6 flex flex-row items-center dark:text-gray-400",
						),
						Svg(
							StrokeWidth("1.5"),
							Class(
								"lucide lucide-calendar-days w-5 h-auto mr-1 opacity-60",
							),
							Width("24"),
							Stroke("currentColor"),
							ViewBox("0 0 24 24"),
							Fill("none"),
							StrokeLinecap("round"),
							StrokeLinejoin("round"),
							Xmlns("http://www.w3.org/2000/svg"),
							Height("24"),
							Path(D("M8 2v4")),
							Path(D("M16 2v4")),
							Rect(
								Rx("2"),
								Width("18"),
								Height("18"),
								X("3"),
								Y("4"),
							),
							Path(D("M3 10h18")),
							Path(D("M8 14h.01")),
							Path(D("M12 14h.01")),
							Path(D("M16 14h.01")),
							Path(D("M8 18h.01")),
							Path(D("M12 18h.01")),
							Path(D("M16 18h.01")),
						),
						Span(Text("October 2024")),
					),
					Div(
						Class(
							"invisible group-hover:visible flex justify-end items-center",
						),
						Button(
							AriaControls("radix-:r7:"),
							Type("button"),
							AriaHaspopup("dialog"),
							AriaExpanded("false"),
							Svg(
								Stroke("currentColor"),
								StrokeWidth("2"),
								StrokeLinecap("round"),
								Class(
									"lucide lucide-ellipsis-vertical w-4 h-auto shrink-0 opacity-60",
								),
								Width("24"),
								Height("24"),
								Fill("none"),
								Xmlns("http://www.w3.org/2000/svg"),
								ViewBox("0 0 24 24"),
								StrokeLinejoin("round"),
								Circle(Cy("12"), R("1"), Cx("12")),
								Circle(R("1"), Cx("12"), Cy("5")),
								Circle(Cx("12"), Cy("19"), R("1")),
							),
						),
					),
				),
				Div(
					Class("w-full"),
					Div(
						Class(
							"w-full h-auto shrink-0 grid grid-cols-7 grid-flow-row gap-1",
						),
						Div(
							Class(
								"w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60",
							),
							Text("Sun"),
						),
						Div(
							Class(
								"w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60",
							),
							Text("Mon"),
						),
						Div(
							Class(
								"w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60",
							),
							Text("Tue"),
						),
						Div(
							Class(
								"w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60",
							),
							Text("Wed"),
						),
						Div(
							Class(
								"w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60",
							),
							Text("Thu"),
						),
						Div(
							Class(
								"w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60",
							),
							Text("Fri"),
						),
						Div(
							Class(
								"w-6 h-5 text-xs flex justify-center items-center cursor-default opacity-60",
							),
							Text("Sat"),
						),
						Div(Class("shrink-0 w-6 h-6 opacity-0")),
						Div(Class("shrink-0 w-6 h-6 opacity-0")),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("1"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("2"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("3"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("4"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("5"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("6"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("7"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("8"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("9"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("10"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("11"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("12"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("13"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("14"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("15"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("16"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("17"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("18"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("19"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("20"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("21"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("22"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("23"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("24"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("25"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("26"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("27"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("28"),
						),
						Div(
							Class(
								"shrink-0 w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-teal-700 text-gray-100 dark:opacity-80 border-zinc-400 dark:border-zinc-300 font-bold border-zinc-400 dark:border-zinc-300",
							),
							AriaLabel("51 memos in 2024-10-29"),
							Text("29"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("30"),
						),
						Div(
							Class(
								"w-6 h-6 text-xs rounded-xl flex justify-center items-center border cursor-default bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 border-transparent",
							),
							Text("31"),
						),
						Div(Class("shrink-0 w-6 h-6 opacity-0")),
						Div(Class("shrink-0 w-6 h-6 opacity-0")),
					),
					P(
						Class("mt-1 w-full text-xs italic opacity-80"),
						Span(Text("51")),
						Text("memos in"),
						Span(Text("1")),
						Text("day"),
					),
				),
				Hr(
					Class(
						"MuiDivider-root MuiDivider-horizontal !my-2 opacity-50 css-w2e6ki",
					),
				),
				Div(
					Class(
						"w-full flex flex-row justify-start items-center gap-x-2 gap-y-1 flex-wrap",
					),
					Div(
						Class(
							"w-auto border dark:border-zinc-800 pl-1 pr-1.5 rounded-md flex justify-between items-center",
						),
						Div(
							Class(
								"w-auto flex justify-start items-center mr-1",
							),
							Svg(
								Fill("none"),
								StrokeLinejoin("round"),
								Class("lucide lucide-link w-4 h-auto mr-1"),
								ViewBox("0 0 24 24"),
								Width("24"),
								Height("24"),
								Stroke("currentColor"),
								StrokeWidth("2"),
								StrokeLinecap("round"),
								Xmlns("http://www.w3.org/2000/svg"),
								Path(
									D(
										"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
									),
								),
								Path(
									D(
										"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
									),
								),
							),
							Span(Class("block text-sm"), Text("Links")),
						),
						Span(Class("text-sm truncate"), Text("1")),
					),
					Div(
						Class(
							"w-auto border dark:border-zinc-800 pl-1 pr-1.5 rounded-md flex justify-between items-center",
						),
						Div(
							Class(
								"w-auto flex justify-start items-center mr-1",
							),
							Svg(
								Width("24"),
								Height("24"),
								ViewBox("0 0 24 24"),
								Xmlns("http://www.w3.org/2000/svg"),
								Fill("none"),
								Stroke("currentColor"),
								StrokeWidth("2"),
								StrokeLinecap("round"),
								StrokeLinejoin("round"),
								Class(
									"lucide lucide-list-todo w-4 h-auto mr-1",
								),
								Rect(
									X("3"),
									Y("5"),
									Width("6"),
									Height("6"),
									Rx("1"),
								),
								Path(D("m3 17 2 2 4-4")),
								Path(D("M13 6h8")),
								Path(D("M13 12h8")),
								Path(D("M13 18h8")),
							),
							Span(Class("block text-sm"), Text("To-do")),
						),
						Div(
							AriaLabel("Done / Total"),
							Class(
								"text-sm flex flex-row items-start justify-center",
							),
							Span(Class("truncate"), Text("3")),
							Span(Class("font-mono opacity-50"), Text("/")),
							Span(Class("truncate"), Text("4")),
						),
					),
					Div(
						Class(
							"w-auto border dark:border-zinc-800 pl-1 pr-1.5 rounded-md flex justify-between items-center",
						),
						Div(
							Class(
								"w-auto flex justify-start items-center mr-1",
							),
							Svg(
								Stroke("currentColor"),
								StrokeLinecap("round"),
								StrokeLinejoin("round"),
								Width("24"),
								ViewBox("0 0 24 24"),
								Fill("none"),
								StrokeWidth("2"),
								Class("lucide lucide-code-xml w-4 h-auto mr-1"),
								Xmlns("http://www.w3.org/2000/svg"),
								Height("24"),
								Path(D("m18 16 4-4-4-4")),
								Path(D("m6 8-4 4 4 4")),
								Path(D("m14.5 4-5 16")),
							),
							Span(Class("block text-sm"), Text("Code")),
						),
						Span(Class("text-sm truncate"), Text("7")),
					),
				),
			),
			Div(
				Class(
					"flex flex-col justify-start items-start w-full mt-3 px-1 h-auto shrink-0 flex-nowrap hide-scrollbar",
				),
				Div(
					Class(
						"flex flex-row justify-between items-center w-full gap-1 mb-1 text-sm leading-6 text-gray-400 select-none",
					),
					Span(Text("Tags")),
					Button(
						Type("button"),
						AriaHaspopup("dialog"),
						AriaExpanded("false"),
						AriaControls("radix-:rb:"),
						Svg(
							Height("24"),
							Fill("none"),
							Stroke("currentColor"),
							StrokeLinecap("round"),
							Xmlns("http://www.w3.org/2000/svg"),
							ViewBox("0 0 24 24"),
							StrokeWidth("2"),
							StrokeLinejoin("round"),
							Class(
								"lucide lucide-ellipsis-vertical w-4 h-auto shrink-0 opacity-60",
							),
							Width("24"),
							Circle(Cx("12"), Cy("12"), R("1")),
							Circle(Cx("12"), Cy("5"), R("1")),
							Circle(Cx("12"), Cy("19"), R("1")),
						),
					),
				),
				Div(
					Class(
						"w-full flex flex-row justify-start items-center relative flex-wrap gap-x-2 gap-y-1",
					),
					Div(
						Class(
							"shrink-0 w-auto max-w-full text-sm rounded-md leading-6 flex flex-row justify-start items-center select-none hover:opacity-80 text-gray-600 dark:text-gray-400 dark:border-zinc-800",
						),
						Div(
							AriaHaspopup("menu"),
							AriaExpanded("false"),
							AriaControls(":rc:"),
							Tabindex("0"),
							Class(
								"MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd",
							),
							Role("button"),
							Div(
								Class("shrink-0 group"),
								Svg(
									Class(
										"lucide lucide-hash group-hover:hidden w-4 h-auto shrink-0 opacity-40",
									),
									Width("24"),
									Height("24"),
									ViewBox("0 0 24 24"),
									Stroke("currentColor"),
									StrokeLinejoin("round"),
									Xmlns("http://www.w3.org/2000/svg"),
									Fill("none"),
									StrokeWidth("2"),
									StrokeLinecap("round"),
									Line(Y2("9"), X1("4"), X2("20"), Y1("9")),
									Line(X1("4"), X2("20"), Y1("15"), Y2("15")),
									Line(X1("10"), X2("8"), Y1("3"), Y2("21")),
									Line(Y2("21"), X1("16"), X2("14"), Y1("3")),
								),
								Svg(
									StrokeLinejoin("round"),
									Height("24"),
									StrokeWidth("2"),
									StrokeLinecap("round"),
									Fill("none"),
									Stroke("currentColor"),
									Class(
										"lucide lucide-ellipsis-vertical hidden group-hover:block w-4 h-auto shrink-0 opacity-60",
									),
									Xmlns("http://www.w3.org/2000/svg"),
									Width("24"),
									ViewBox("0 0 24 24"),
									Circle(Cx("12"), Cy("12"), R("1")),
									Circle(Cx("12"), Cy("5"), R("1")),
									Circle(Cx("12"), Cy("19"), R("1")),
								),
							),
						),
						Div(
							Class(
								"inline-flex flex-nowrap ml-0.5 gap-0.5 cursor-pointer max-w-[calc(100%-16px)]",
							),
							Span(
								Class("truncate dark:opacity-80"),
								Text("uih"),
							),
							Span(Class("opacity-60 shrink-0"), Text("(4)")),
						),
					),
					Div(
						Class(
							"shrink-0 w-auto max-w-full text-sm rounded-md leading-6 flex flex-row justify-start items-center select-none hover:opacity-80 text-gray-600 dark:text-gray-400 dark:border-zinc-800",
						),
						Div(
							AriaControls(":rd:"),
							Tabindex("0"),
							Class(
								"MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd",
							),
							Role("button"),
							AriaHaspopup("menu"),
							AriaExpanded("false"),
							Div(
								Class("shrink-0 group"),
								Svg(
									Xmlns("http://www.w3.org/2000/svg"),
									ViewBox("0 0 24 24"),
									StrokeWidth("2"),
									StrokeLinecap("round"),
									Class(
										"lucide lucide-hash group-hover:hidden w-4 h-auto shrink-0 opacity-40",
									),
									Width("24"),
									Height("24"),
									Fill("none"),
									Stroke("currentColor"),
									StrokeLinejoin("round"),
									Line(Y2("9"), X1("4"), X2("20"), Y1("9")),
									Line(X1("4"), X2("20"), Y1("15"), Y2("15")),
									Line(Y2("21"), X1("10"), X2("8"), Y1("3")),
									Line(X1("16"), X2("14"), Y1("3"), Y2("21")),
								),
								Svg(
									Height("24"),
									StrokeLinecap("round"),
									StrokeLinejoin("round"),
									Fill("none"),
									Stroke("currentColor"),
									StrokeWidth("2"),
									Class(
										"lucide lucide-ellipsis-vertical hidden group-hover:block w-4 h-auto shrink-0 opacity-60",
									),
									Xmlns("http://www.w3.org/2000/svg"),
									Width("24"),
									ViewBox("0 0 24 24"),
									Circle(Cx("12"), Cy("12"), R("1")),
									Circle(Cx("12"), Cy("5"), R("1")),
									Circle(R("1"), Cx("12"), Cy("19")),
								),
							),
						),
						Div(
							Class(
								"inline-flex flex-nowrap ml-0.5 gap-0.5 cursor-pointer max-w-[calc(100%-16px)]",
							),
							Span(Class("truncate dark:opacity-80"), Text("11")),
						),
					),
					Div(
						Class(
							"shrink-0 w-auto max-w-full text-sm rounded-md leading-6 flex flex-row justify-start items-center select-none hover:opacity-80 text-gray-600 dark:text-gray-400 dark:border-zinc-800",
						),
						Div(
							AriaHaspopup("menu"),
							AriaExpanded("false"),
							AriaControls(":re:"),
							Tabindex("0"),
							Class(
								"MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd",
							),
							Role("button"),
							Div(
								Class("shrink-0 group"),
								Svg(
									StrokeLinecap("round"),
									Width("24"),
									Stroke("currentColor"),
									StrokeWidth("2"),
									Fill("none"),
									StrokeLinejoin("round"),
									Class(
										"lucide lucide-hash group-hover:hidden w-4 h-auto shrink-0 opacity-40",
									),
									Xmlns("http://www.w3.org/2000/svg"),
									Height("24"),
									ViewBox("0 0 24 24"),
									Line(X1("4"), X2("20"), Y1("9"), Y2("9")),
									Line(Y1("15"), Y2("15"), X1("4"), X2("20")),
									Line(X1("10"), X2("8"), Y1("3"), Y2("21")),
									Line(X1("16"), X2("14"), Y1("3"), Y2("21")),
								),
								Svg(
									Height("24"),
									ViewBox("0 0 24 24"),
									Fill("none"),
									Stroke("currentColor"),
									Class(
										"lucide lucide-ellipsis-vertical hidden group-hover:block w-4 h-auto shrink-0 opacity-60",
									),
									Xmlns("http://www.w3.org/2000/svg"),
									Width("24"),
									StrokeWidth("2"),
									StrokeLinecap("round"),
									StrokeLinejoin("round"),
									Circle(Cy("12"), R("1"), Cx("12")),
									Circle(Cx("12"), Cy("5"), R("1")),
									Circle(Cx("12"), Cy("19"), R("1")),
								),
							),
						),
						Div(
							Class(
								"inline-flex flex-nowrap ml-0.5 gap-0.5 cursor-pointer max-w-[calc(100%-16px)]",
							),
							Span(
								Class("truncate dark:opacity-80"),
								Text("feature"),
							),
						),
					),
				),
			),
		),
	)
}

func ToolbarIcons() *Node {
	return Div(
		// file upload and other icons
		Class(
			"hidden relative w-full flex flex-row justify-between items-center pt-2",
		),
		Div(
			Class(
				"flex flex-row justify-start items-center opacity-80 dark:opacity-60 -space-x-1",
			),
			Button(
				AriaControls(":r1:"),
				Tabindex("0"),
				Type("button"),
				Class(
					"border-box inline-flex items-center justify-center rounded-md text-zinc-900 dark:text-zinc-100 shadow-none text-xs px-2 py-1 h-8 cursor-pointer hover:opacity-80 bg-transparent MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd",
				),
				AriaHaspopup("menu"),
				AriaExpanded("false"),
				Svg(
					Fill("none"),
					Stroke("currentColor"),
					StrokeWidth("2"),
					StrokeLinecap("round"),
					Class("lucide lucide-hash w-5 h-5 mx-auto"),
					Xmlns("http://www.w3.org/2000/svg"),
					Width("24"),
					StrokeLinejoin("round"),
					Height("24"),
					ViewBox("0 0 24 24"),
					Line(X1("4"), X2("20"), Y1("9"), Y2("9")),
					Line(X1("4"), X2("20"), Y1("15"), Y2("15")),
					Line(X1("10"), X2("8"), Y1("3"), Y2("21")),
					Line(X1("16"), X2("14"), Y1("3"), Y2("21")),
				),
			),
			Button(
				AriaExpanded("false"),
				AriaControls(":r2:"),
				Tabindex("0"),
				Type("button"),
				Class(
					"border-box inline-flex items-center justify-center rounded-md text-zinc-900 dark:text-zinc-100 shadow-none text-xs px-2 py-1 h-8 cursor-pointer hover:opacity-80 bg-transparent MuiMenuButton-root MuiMenuButton-variantOutlined MuiMenuButton-colorNeutral MuiMenuButton-sizeMd",
				),
				AriaHaspopup("menu"),
				Svg(
					StrokeLinejoin("round"),
					Xmlns("http://www.w3.org/2000/svg"),
					Fill("none"),
					Stroke("currentColor"),
					StrokeWidth("2"),
					StrokeLinecap("round"),
					Width("24"),
					Height("24"),
					ViewBox("0 0 24 24"),
					Class("lucide lucide-square-slash w-5 h-5 mx-auto"),
					Rect(
						Y("3"),
						Rx("2"),
						Width("18"),
						Height("18"),
						X("3"),
					),
					Line(Y1("15"), Y2("9"), X1("9"), X2("15")),
				),
			),
			Button(
				Class(
					"border-box inline-flex items-center justify-center rounded-md text-zinc-900 dark:text-zinc-100 shadow-none text-xs px-2 py-1 h-8 cursor-pointer hover:opacity-80 bg-transparent relative",
				),
				Svg(
					Class("lucide lucide-paperclip w-5 h-5 mx-auto"),
					Xmlns("http://www.w3.org/2000/svg"),
					Width("24"),
					Height("24"),
					ViewBox("0 0 24 24"),
					Fill("none"),
					StrokeLinejoin("round"),
					Stroke("currentColor"),
					StrokeWidth("2"),
					StrokeLinecap("round"),
					Path(
						D(
							"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",
						),
					),
				),
				Input(
					Class(
						"absolute inset-0 w-full h-full opacity-0 cursor-pointer",
					),
					Type("file"),
					Id("files"),
				),
			),
			Button(
				Class("w-9"),
				Type("button"),
				AriaHaspopup("dialog"),
				AriaExpanded("false"),
				AriaControls("radix-:r3:"),
				Svg(
					StrokeWidth("2"),
					StrokeLinecap("round"),
					Height("24"),
					Fill("none"),
					ViewBox("0 0 24 24"),
					Stroke("currentColor"),
					StrokeLinejoin("round"),
					Class(
						"lucide lucide-link border-box rounded-md text-zinc-900 dark:text-zinc-100 shadow-none text-xs cursor-pointer hover:opacity-80 bg-transparent flex items-center justify-center w-5 h-5 mx-auto p-0",
					),
					Xmlns("http://www.w3.org/2000/svg"),
					Width("24"),
					Path(
						D(
							"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
						),
					),
					Path(
						D(
							"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
						),
					),
				),
			),
			Button(
				Type("button"),
				AriaHaspopup("dialog"),
				AriaExpanded("false"),
				AriaControls("radix-:r4:"),
			),
			Button(
				Class(
					"border-box rounded-md text-zinc-900 dark:text-zinc-100 shadow-none text-xs px-2 py-1 h-8 cursor-pointer hover:opacity-80 bg-transparent flex items-center justify-center",
				),
				Svg(
					Xmlns("http://www.w3.org/2000/svg"),
					Width("24"),
					Height("24"),
					ViewBox("0 0 24 24"),
					StrokeLinecap("round"),
					Class(
						"lucide lucide-map-pin w-5 h-5 mx-auto shrink-0",
					),
					Fill("none"),
					Stroke("currentColor"),
					StrokeWidth("2"),
					StrokeLinejoin("round"),
					Path(
						D(
							"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
						),
					),
					Circle(Cx("12"), Cy("10"), R("3")),
				),
			),
		),
		Hr(
			Class(
				"MuiDivider-root MuiDivider-horizontal !mt-2 opacity-40 css-w2e6ki",
			),
		),
	)
}

func Sidebar() *Node {
	return Div(
		A(
			Id("header-resources"),
			Class(
				"px-2 py-2 rounded-2xl border flex flex-row items-center text-lg text-gray-800 dark:text-gray-400 hover:bg-white hover:border-gray-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 w-full px-4 border-transparent",
			),
			Href("/resources"),
			Svg(
				StrokeLinejoin("round"),
				Xmlns("http://www.w3.org/2000/svg"),
				Width("24"),
				Height("24"),
				Fill("none"),
				Stroke("currentColor"),
				StrokeWidth("2"),
				StrokeLinecap("round"),
				ViewBox("0 0 24 24"),
				Class("lucide lucide-paperclip w-6 h-auto opacity-70 shrink-0"),
				Path(
					D(
						"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",
					),
				),
			),
			Span(Class("ml-3 truncate"), Text("Resources")),
		),
		A(
			Id("header-explore"),
			Class(
				"px-2 py-2 rounded-2xl border flex flex-row items-center text-lg text-gray-800 dark:text-gray-400 hover:bg-white hover:border-gray-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 w-full px-4 border-transparent",
			),
			Href("/explore"),
			Svg(
				Fill("none"),
				StrokeWidth("2"),
				StrokeLinejoin("round"),
				Width("24"),
				Height("24"),
				Stroke("currentColor"),
				StrokeLinecap("round"),
				Class("lucide lucide-earth w-6 h-auto opacity-70 shrink-0"),
				Xmlns("http://www.w3.org/2000/svg"),
				ViewBox("0 0 24 24"),
				Path(D("M21.54 15H17a2 2 0 0 0-2 2v4.54")),
				Path(
					D(
						"M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17",
					),
				),
				Path(
					D(
						"M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05",
					),
				),
				Circle(Cx("12"), Cy("12"), R("10")),
			),
			Span(Class("ml-3 truncate"), Text("Explore")),
		),
		A(
			Id("header-profile"),
			Class(
				"px-2 py-2 rounded-2xl border flex flex-row items-center text-lg text-gray-800 dark:text-gray-400 hover:bg-white hover:border-gray-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 w-full px-4 border-transparent",
			),
			Href("/u/yourselfhosted"),
			Svg(
				StrokeLinejoin("round"),
				Class("lucide lucide-user-round w-6 h-auto opacity-70 shrink-0"),
				Width("24"),
				Fill("none"),
				Stroke("currentColor"),
				StrokeWidth("2"),
				Xmlns("http://www.w3.org/2000/svg"),
				Height("24"),
				ViewBox("0 0 24 24"),
				StrokeLinecap("round"),
				Circle(Cx("12"), Cy("8"), R("5")),
				Path(D("M20 21a8 8 0 0 0-16 0")),
			),
			Span(Class("ml-3 truncate"), Text("Profile")),
		),
		A(
			Id("header-inbox"),
			Class(
				"px-2 py-2 rounded-2xl border flex flex-row items-center text-lg text-gray-800 dark:text-gray-400 hover:bg-white hover:border-gray-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 w-full px-4 border-transparent",
			),
			Href("/inbox"),
			Div(
				Class("relative"),
				Svg(
					Height("24"),
					Fill("none"),
					StrokeLinecap("round"),
					Xmlns("http://www.w3.org/2000/svg"),
					Width("24"),
					ViewBox("0 0 24 24"),
					Stroke("currentColor"),
					StrokeWidth("2"),
					StrokeLinejoin("round"),
					Class("lucide lucide-bell w-6 h-auto opacity-70 shrink-0"),
					Path(D("M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9")),
					Path(D("M10.3 21a1.94 1.94 0 0 0 3.4 0")),
				),
			),
			Span(Class("ml-3 truncate"), Text("Inbox")),
		),
		A(
			Id("header-archived"),
			Class(
				"px-2 py-2 rounded-2xl border flex flex-row items-center text-lg text-gray-800 dark:text-gray-400 hover:bg-white hover:border-gray-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 w-full px-4 border-transparent",
			),
			Href("/archived"),
			Svg(
				StrokeLinecap("round"),
				Class("lucide lucide-archive w-6 h-auto opacity-70 shrink-0"),
				Xmlns("http://www.w3.org/2000/svg"),
				Width("24"),
				ViewBox("0 0 24 24"),
				Stroke("currentColor"),
				Height("24"),
				Fill("none"),
				StrokeWidth("2"),
				StrokeLinejoin("round"),
				Rect(Y("3"), Rx("1"), Width("20"), Height("5"), X("2")),
				Path(D("M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8")),
				Path(D("M10 12h4")),
			),
			Span(Class("ml-3 truncate"), Text("Archived")),
		),
		A(
			Class(
				"px-2 py-2 rounded-2xl border flex flex-row items-center text-lg text-gray-800 dark:text-gray-400 hover:bg-white hover:border-gray-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 w-full px-4 border-transparent",
			),
			Href("/setting"),
			Id("header-setting"),
			Svg(
				Height("24"),
				Fill("none"),
				StrokeWidth("2"),
				StrokeLinecap("round"),
				StrokeLinejoin("round"),
				Class("lucide lucide-settings w-6 h-auto opacity-70 shrink-0"),
				Xmlns("http://www.w3.org/2000/svg"),
				Width("24"),
				ViewBox("0 0 24 24"),
				Stroke("currentColor"),
				Path(
					D(
						"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
					),
				),
				Circle(R("3"), Cx("12"), Cy("12")),
			),
			Span(Class("ml-3 truncate"), Text("Settings")),
		),
	)
}
