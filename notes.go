package main

import (
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"net/http"
	"strings"
	"time"
)

func NewNotes(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// set
		DefaultLayout(
			MemoInterface(),
		).RenderPage(w, r)
	})
	return mux
}

func MemoInterface() *Node {
	sidebar := Nav(
		Div(Class("flex flex-col w-64 p-4 bg-gray-100 min-h-screen"),
			Div(Class("text-center font-bold text-xl mb-8"), Text("yourselfhosted")),
			Nav(
				Ul(Class("space-y-4"),
					Li(A(Href("#"), T("Home"))),
					Li(A(Href("#"), T("Resources"))),
					Li(A(Href("#"), T("Explore"))),
					Li(A(Href("#"), T("Profile"))),
					Li(A(Href("#"), T("Inbox"))),
					Li(A(Href("#"), T("Archived"))),
					Li(A(Href("#"), T("Settings"))),
				),
			),
		),
	)

	events := []CalEvent{
		{
			ID:          "1",
			Title:       "cook food",
			Start:       time.Date(2024, time.October, 12, 18, 0, 0, 0, time.UTC),
			End:         time.Date(2024, time.October, 12, 21, 0, 0, 0, time.UTC),
			AllDay:      false,
			IsRecurring: false,
		},
	}
	calendar := InitializeCalendar(time.Now(), "Month", events)

	rightCalendarSidebar := Div(
		Class("flex flex-col w-64 p-4 bg-gray-100 min-h-screen"),
		RenderSmallCalendar(calendar),
	)

	content := Div(Class("flex-grow p-4"),
		Div(Class("mb-4"),
			Input(Type("text"), Placeholder("Any thoughts..."), Class("w-full p-2 border rounded")),
			Div(Class("flex space-x-2 mt-2"),
				Span(Class("text-blue-500 cursor-pointer"), T("#")),
				Span(Class("text-blue-500 cursor-pointer"), T("📎")),
				Span(Class("text-blue-500 cursor-pointer"), T("📷")),
				Span(Class("text-blue-500 cursor-pointer"), T("🔗")),
			),
		),
		Div(Class("space-y-4"),
			Div(Class("p-4 border rounded-lg shadow-sm"),
				Div(Class("flex justify-between"),
					Span(Class("text-gray-500 text-sm"), T("10 hours ago")),
					Span(Class("text-gray-500 text-sm"), T("Private")),
				),
				Div(Class("mt-2"), Text("Hello world. This is my first memo! #hello")),
				Div(Class("mt-2 text-sm text-blue-500"), Text("Referenced by (1)")),
				Div(Class("flex space-x-2 mt-2"),
					Span(Class("text-gray-500 cursor-pointer"), T("👍")),
					Span(Class("text-gray-500 cursor-pointer"), T("❤️")),
					Span(Class("text-gray-500 cursor-pointer"), T("🔥")),
					Span(Class("text-gray-500 cursor-pointer"), T("😆")),
				),
			),
			Div(Class("p-4 border rounded-lg shadow-sm"),
				Div(Class("flex justify-between"),
					Span(Class("text-gray-500 text-sm"), T("10 hours ago")),
					Span(Class("text-gray-500 text-sm"), T("Private")),
				),
				Div(Class("mt-2"), Text("Wow, it can be referenced too! REALLY GREAT!!! #features")),
				Div(Class("mt-2 text-sm text-blue-500"), Text("Referencing (1)")),
			),
			Div(Class("p-4 border rounded-lg shadow-sm"),
				Div(Class("flex justify-between"),
					Span(Class("text-gray-500 text-sm"), T("10 hours ago")),
					Span(Class("text-gray-500 text-sm"), T("To-do")),
				),
				Div(Class("mt-2"), Text("And here are my tasks. #todo")),
				Div(Class("mt-2"),
					Input(Type("checkbox"), Checked(true)),
					Span(Class("ml-2"), Text("deploy memos for myself;")),
				),
				Div(Class("mt-2"),
					Input(Type("checkbox")),
					Span(Class("ml-2"), Text("share to my friends;")),
				),
				Div(Class("mt-2"),
					Input(Type("checkbox")),
					Span(Class("ml-2"), Text("sounds good to me!")),
				),
			),
		),
	)
	return DefaultLayout(
		Div(Class("flex"),
			sidebar,
			content,
			rightCalendarSidebar,
		),
	)
}

func RenderSmallCalendar(state CalendarState) *Node {
	var events []CalEvent
	for _, week := range state.DaysInView {
		for _, day := range week {
			events = append(events, day.Events...)
		}
	}
	return Div(
		H2(
			Class("text-base font-semibold text-gray-900"),
			Text("Upcoming meetings"),
		),
		Div(
			//Class("lg:grid lg:grid-cols-12 lg:gap-x-16"),
			Div(
				Class("mt-10 text-center lg:col-start-8 lg:col-end-13 lg:row-start-1 lg:mt-9 xl:col-start-9"),
				Div(
					Class("flex items-center text-gray-900"),
					Button(
						Type("button"),
						Class("-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"),
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
					Ch(weekMap(state.DaysInView, func(week []Day, i int) []*Node {
						return dayMap(week, func(day Day, i int) *Node {
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
				Button(
					Type("button"),
					Class("mt-8 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"),
					Text("Add event"),
				),
			),
			Ol(
				Class("mt-4 divide-y divide-gray-100 text-sm/6 lg:col-span-7 xl:col-span-8"),
				Ch(eventMap(events, func(event CalEvent, i int) *Node {
					return Li(
						Class("relative flex space-x-6 py-6 xl:static"),
						Img(
							Src("https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"),
							Alt(""),
							Class("h-14 w-14 flex-none rounded-full"),
						),
						Div(
							Class("flex-auto"),
							H3(Class("pr-10 font-semibold text-gray-900 xl:pr-0"), Text(event.Title)),
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

func dayButtonClass(day Day) string {
	var classes []string
	if day.IsToday {
		classes = append(classes, "bg-white font-semibold text-indigo-600")
	} else {
		classes = append(classes, "bg-gray-50 text-gray-400")
	}
	return strings.Join(classes, " ")
}

func renderEventDetails(event CalEvent) *Node {
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
