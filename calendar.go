package main

import (
	"context"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"net/http"
	"time"
)

type CalEvent struct {
	ID          string
	Title       string
	Description string
	Start       time.Time
	End         time.Time
	AllDay      bool
	IsRecurring bool
}

type Day struct {
	Date       time.Time
	Events     []CalEvent
	IsToday    bool
	IsSelected bool
}

type CalendarState struct {
	Year         int
	Month        time.Month
	CurrentDate  time.Time
	ViewType     string
	DaysInView   [][]Day
	SelectedDate time.Time
}

func InitializeCalendar(currentTime time.Time, viewType string, events []CalEvent) CalendarState {
	firstOfMonth := time.Date(currentTime.Year(), currentTime.Month(), 1, 0, 0, 0, 0, currentTime.Location())
	weekday := int(firstOfMonth.Weekday())
	if weekday == 0 {
		weekday = 7
	}

	currentMonthDays := daysInMonth(currentTime.Year(), currentTime.Month())

	daysInView := [][]Day{}
	var currentWeek []Day

	previousMonth := currentTime.AddDate(0, -1, 0)
	prevMonthDays := daysInMonth(previousMonth.Year(), previousMonth.Month())

	for i := prevMonthDays - weekday + 2; i <= prevMonthDays; i++ {
		currentWeek = append(currentWeek, Day{
			Date: time.Date(previousMonth.Year(), previousMonth.Month(), i, 0, 0, 0, 0, currentTime.Location()),
		})
	}

	for day := 1; day <= currentMonthDays; day++ {
		if len(currentWeek) == 7 {
			daysInView = append(daysInView, currentWeek)
			currentWeek = []Day{}
		}

		isToday := currentTime.Year() == time.Now().Year() && currentTime.Month() == time.Now().Month() && day == time.Now().Day()

		d := Day{
			Date:    time.Date(currentTime.Year(), currentTime.Month(), day, 0, 0, 0, 0, currentTime.Location()),
			IsToday: isToday,
		}
		for _, event := range events {
			if event.Start.Day() == d.Date.Day() {
				d.Events = append(d.Events, event)
			}
		}

		currentWeek = append(currentWeek, d)
	}

	nextMonth := currentTime.AddDate(0, 1, 0)
	for day := 1; len(currentWeek) < 7; day++ {
		currentWeek = append(currentWeek, Day{
			Date: time.Date(nextMonth.Year(), nextMonth.Month(), day, 0, 0, 0, 0, currentTime.Location()),
		})
	}
	daysInView = append(daysInView, currentWeek)

	for len(daysInView) < 6 {
		var week []Day
		for day := 1; day <= 7; day++ {
			d := Day{
				Date: time.Date(nextMonth.Year(), nextMonth.Month(), day, 0, 0, 0, 0, currentTime.Location()),
			}
			week = append(week, d)
			nextMonth = nextMonth.AddDate(0, 0, 1)
		}
		daysInView = append(daysInView, week)
	}

	return CalendarState{
		Year:         currentTime.Year(),
		Month:        currentTime.Month(),
		CurrentDate:  currentTime,
		ViewType:     viewType,
		DaysInView:   daysInView,
		SelectedDate: currentTime,
	}
}

func daysInMonth(year int, month time.Month) int {
	return time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()
}

func NewCalendar(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		var calendar CalendarState
		if len(id) > 0 {
			if err := d.Docs.Get(id, &calendar); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		} else {
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

			id := uuid.NewString()
			if err := d.Docs.Set(id, calendar); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			http.Redirect(w, r, fmt.Sprintf("/calendar/%s", id), http.StatusFound)
		}

		ctx := context.WithValue(r.Context(), "baseURL", "/calendar")
		DefaultLayout(
			Div(
				Class("container mx-auto px-4 py-8"),
				ReloadNode("calendar.go"),
				//BuildFormCtx(BuildCtx{
				//	CurrentFieldPath: "",
				//	Name:             "calendar",
				//}, calendar),
				Div(
					RenderCalendar(calendar),
				),
			),
		).RenderPageCtx(ctx, w, r)
	})
	return mux
}

func weekMap(weeks [][]Day, f func(day []Day, _ int) []*Node) []*Node {
	var n []*Node
	for i, week := range weeks {
		for _, nd := range f(week, i) {
			n = append(n, nd)
		}
	}
	return n
}

func dayMap(days []Day, f func(day Day, _ int) *Node) []*Node {
	var n []*Node
	for i, day := range days {
		n = append(n, f(day, i))
	}
	return n
}

func eventMap(events []CalEvent, f func(event CalEvent, _ int) *Node) []*Node {
	var n []*Node
	for i, event := range events {
		n = append(n, f(event, i))
	}
	return n
}

func NewEventModal() *Node {
	return Dialog(
		Id("event_modal"),
		Class("modal"),
		Div(
			Class("modal-box"),
			BuildFormCtx(BuildCtx{
				CurrentFieldPath: "",
				Name:             "event",
			}, CalEvent{}),
			Div(Class("modal-action"), Form(Method("dialog"), Button(Class("btn"), Text("Close")))),
		),
	)
}

func RenderCalendar(state CalendarState) *Node {
	return Div(
		Class("lg:flex lg:h-full lg:flex-col"),
		Header(
			Class("flex items-center justify-between border-b border-gray-200 px-6 py-4 lg:flex-none"),
			H1(
				Class("text-base font-semibold leading-6 text-gray-900"),
				Time(Datetime(fmt.Sprintf("%d-%02d", state.Year, state.Month)),
					Text(fmt.Sprintf("%s %d", state.Month, state.Year))),
			),
			Div(
				Class("flex items-center space-x-2"),
				Div(
					Class("relative flex items-center rounded-md bg-white shadow-sm md:items-stretch"),
					// Previous month button
					Button(
						Type("button"),
						Class("flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"),
						Span(Class("sr-only"), Text("Previous month")),
						Svg(
							Class("h-5 w-5"),
							ViewBox("0 0 20 20"),
							Fill("currentColor"),
							AriaHidden("true"),
							Path(FillRule("evenodd"), D("M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"), ClipRule("evenodd")),
						),
					),
					// Today button
					Button(
						Type("button"),
						Class("hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"),
						Text("Today"),
					),
					// Next month button
					Button(
						Type("button"),
						Class("flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"),
						Span(Class("sr-only"), Text("Next month")),
						Svg(
							Class("h-5 w-5"),
							ViewBox("0 0 20 20"),
							Fill("currentColor"),
							AriaHidden("true"),
							Path(FillRule("evenodd"), D("M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"), ClipRule("evenodd")),
						),
					),
				),
				Div(
					Class("flex flex-row"),
					Div(
						Button(
							Type("button"),
							Class("flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"),
							Text(fmt.Sprintf("%s view", state.ViewType)),
							Svg(
								AriaHidden("true"),
								Class("-mr-1 h-5 w-5 text-gray-400"),
								ViewBox("0 0 20 20"),
								Fill("currentColor"),
								Path(FillRule("evenodd"), D("M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"), ClipRule("evenodd")),
							),
						),
						// View options (Day, Week, Month, Year)
						//Div(
						//	Role("menu"),
						//	Class("absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"),
						//	Div(
						//		Class("py-1"),
						//		Role("none"),
						//		A(Class("block px-4 py-2 text-sm text-gray-700"), Text("Day view")),
						//		A(Class("block px-4 py-2 text-sm text-gray-700"), Text("Week view")),
						//		A(Class("block px-4 py-2 text-sm text-gray-700"), Text("Month view")),
						//		A(Class("block px-4 py-2 text-sm text-gray-700"), Text("Year view")),
						//	),
						//),
					),
					Button(
						Type("button"),
						Class("ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"),
						Text("Add event"),
						OnClick("event_modal.showModal()"),
					),
					NewEventModal(),
				),
			),
		),
		Div(
			Class("shadow ring-1 ring-black ring-opacity-5 lg:flex lg:flex-auto lg:flex-col"),
			Div(
				Class("grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs font-semibold leading-6 text-gray-700 lg:flex-none"),
				Div(Class("flex justify-center bg-white py-2"), Span(Text("M"))),
				Div(Class("flex justify-center bg-white py-2"), Span(Text("T"))),
				Div(Class("flex justify-center bg-white py-2"), Span(Text("W"))),
				Div(Class("flex justify-center bg-white py-2"), Span(Text("T"))),
				Div(Class("flex justify-center bg-white py-2"), Span(Text("F"))),
				Div(Class("flex justify-center bg-white py-2"), Span(Text("S"))),
				Div(Class("flex justify-center bg-white py-2"), Span(Text("S"))),
			),
			Div(
				Class("flex bg-gray-200 text-xs leading-6 text-gray-700 lg:flex-auto"),
				Div(
					Class("grid w-full grid-cols-7 gap-px"),
					Ch(
						weekMap(state.DaysInView, func(week []Day, _ int) []*Node {
							return dayMap(week, func(day Day, _ int) *Node {
								return Div(
									Class("relative bg-white px-3 py-2"),
									Time(
										Datetime(day.Date.Format("2006-01-02")),
										Text(day.Date.Format("2")),
									),
									Div(
										Class("mt-2 overflow-auto h-24"),
										Ol(
											Class("space-y-1"),
											Ch(
												eventMap(day.Events, func(event CalEvent, _ int) *Node {
													return Li(
														A(
															Href("#"),
															Class("group flex"),
															P(Class("flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600"), Text(event.Title)),
															Time(
																Datetime(event.Start.Format(time.RFC3339)),
																Class("ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block"),
																Text(event.Start.Format("3PM")),
															),
														),
													)
												}),
											),
										),
									),
								)
							})
						}),
					),
				),
			),
		),
	)
}
