package main

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	"net/http"
	"strconv"
	"time"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
)

type Calendar struct {
	ID          string
	Name        string
	Description string
	OwnerID     string
	IsPublic    bool
	Events      []CalendarEvent
}

type CalendarEvent struct {
	ID          string
	CalendarID  int
	Name        string
	Description string
	Link        string
	Attendees   []string
	Date        time.Time
	ImageURL    string
	EventURL    string
}

var (
	userCalendars      = map[string][]int{}    // User ID to Calendar IDs
	eventAttendees     = map[string][]string{} // Event ID to User IDs
	userEventsFilePath = "data/calendar2/"
	userEventsFilename = "user-events.json"
)

var (
	userIDCounter     = 1
	calendarIDCounter = 1
)

var (
	userSelectedCalendars = map[string]map[int]bool{} // User ID to selected Calendar IDs
)

func NewCalendar(d deps.Deps) *http.ServeMux {
	db := d.Docs.WithCollection("calendar")

	m := http.NewServeMux()
	render := func(w http.ResponseWriter, r *http.Request, page *Node) {
		ctx := context.WithValue(r.Context(), "baseURL", "/calendar")
		page.RenderPageCtx(ctx, w, r)
	}
	m.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
			// create new calendar
			id = uuid.NewString()
			c := Calendar{
				ID: id,
			}
			if err := db.Set(id, c); err != nil {
				http.Error(w, "Error creating calendar", http.StatusInternalServerError)
				return
			}
			http.Redirect(w, r, fmt.Sprintf("/calendar/%s", id), http.StatusSeeOther)
			return
		}

		var c Calendar
		if err := db.Get(id, &c); err != nil {
			http.Error(w, "Calendar not found", http.StatusNotFound)
			return
		}

		switch r.Method {
		case http.MethodGet:
			render(w, r, RenderCalendar(c))
		case http.MethodPost:
			if err := r.ParseForm(); err != nil {
				http.Error(w, "Error parsing form data", http.StatusBadRequest)
				return
			}
			monthStr := r.FormValue("month")
			yearStr := r.FormValue("year")
			month, _ := strconv.Atoi(monthStr)
			year, _ := strconv.Atoi(yearStr)

			render(w, r, GenerateCalendar(
				month, year,
				c,
			))
		}
	})
	m.HandleFunc("/{id}/event/modal", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		render(w, r, createModal("event-modal",
			Div(
				Form(
					HxPost(fmt.Sprintf("/%s/event/", id)),
					Attr("hx-target", "#calendar-container"),
					Attr("hx-swap", "outerHTML"),
					Class("space-y-4"),
					Input(Type("text"), Name("name"), Placeholder("Event Name"), Class("w-full p-2 border border-gray-300 rounded")),
					TextArea(Name("description"), Placeholder("Description"), Class("w-full p-2 border border-gray-300 rounded")),
					Input(Type("date"), Name("date"), Class("w-full p-2 border border-gray-300 rounded")),
					Div(
						Button(Type("submit"), T("Create Event"), Class("bg-blue-500 text-white px-4 py-2 rounded")),
						Button(
							T("Cancel"),
							Type("button"),
							Class("modal-close bg-gray-500 text-white px-4 py-2 rounded ml-2"),
							Attr("onclick", "document.getElementById('event-modal').innerHTML = '';"),
						),
					),
				),
			),
		))
	})
	m.HandleFunc("/{id}/event/{eid...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		eid := r.PathValue("eid")

		var c Calendar
		if err := db.Get(id, &c); err != nil {
			http.Error(w, "Calendar not found", http.StatusNotFound)
			return
		}

		var evt CalendarEvent

		if eid != "" {
			for _, e := range c.Events {
				if e.ID == eid {
					evt = e
					break
				}
			}
			if evt.ID == "" {
				http.Error(w, "Event not found", http.StatusNotFound)
				return
			}
		}

		switch r.Method {
		case http.MethodGet:
			render(w, r, createModal("event-modal",
				Div(
					Img(
						Src(evt.ImageURL),
					),
					H2(Class("text-2xl font-bold mb-4"), T(evt.Name)),
					P(Class("mb-2"), T("Description: "+evt.Description)),
					P(Class("mb-2"), T("Date: "+evt.Date.Format("2006-01-02"))),
					A(Class("mb-2 no-underline hover:underline"), Href(evt.EventURL), T("Event Link")),
					Div(
						Class("flex justify-end mt-4"),
						Button(
							T("Delete"),
							Type("button"),
							Class("bg-red-500 text-white px-4 py-2 rounded mr-2"),
							HxDelete(fmt.Sprintf("/%s/event/%s", c.ID, evt.ID)),
							HxTarget("#calendar-container"),
							HxSwap("innerHTML"),
						),
						Button(
							T("Close"),
							Type("button"),
							Class("modal-close bg-gray-500 text-white px-4 py-2 rounded"),
							Attr("onclick", "document.getElementById('event-modal').innerHTML = '';"),
						),
					),
				),
			))
		case http.MethodDelete:
			var newEvents []CalendarEvent
			for _, e := range c.Events {
				if e.ID != eid {
					newEvents = append(newEvents, e)
				}
			}

			c.Events = newEvents
			if err := db.Set(id, c); err != nil {
				http.Error(w, "Error deleting event", http.StatusInternalServerError)
				return
			}

			month := int(evt.Date.Month())
			year := evt.Date.Year()

			render(w, r, GenerateCalendar(month, year, c))
		case http.MethodPost:
			err := r.ParseForm()
			if err != nil {
				http.Error(w, "Error parsing form data", http.StatusBadRequest)
				return
			}
			name := r.FormValue("name")
			description := r.FormValue("description")
			dateStr := r.FormValue("date")
			date, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				http.Error(w, "Invalid date format", http.StatusBadRequest)
				return
			}

			newEvent := CalendarEvent{
				ID:          uuid.NewString(),
				Name:        name,
				Description: description,
				Date:        date,
			}
			c.Events = append(c.Events, newEvent)
			if err := db.Set(id, c); err != nil {
				http.Error(w, "Error creating event", http.StatusInternalServerError)
				return
			}

			month := int(date.Month())
			year := date.Year()

			render(w, r, GenerateCalendar(
				month, year,
				c,
			))
		}
	})
	m.HandleFunc("/{id}/day_events", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		dateStr := r.URL.Query().Get("date")
		if dateStr == "" {
			http.Error(w, "Date parameter is missing", http.StatusBadRequest)
			return
		}

		var c Calendar
		if err := db.Get(id, &c); err != nil {
			http.Error(w, "Calendar not found", http.StatusNotFound)
			return
		}

		var eventsOnDate []CalendarEvent
		for _, evt := range c.Events {
			if evt.Date.Format("2006-01-02") == dateStr {
				eventsOnDate = append(eventsOnDate, evt)
			}
		}

		modalContent := createModal("event-modal",
			Div(
				H2(Class("text-2xl font-bold mb-4"), T(fmt.Sprintf("Events on %s", dateStr))),
				func() *Node {
					if len(eventsOnDate) == 0 {
						return P(T("No events on this day."))
					}
					var eventItems []*Node
					for _, evt := range eventsOnDate {
						eventItems = append(eventItems, Div(
							Class("mb-2"),
							Img(
								Src(evt.ImageURL),
							),
							H3(Class("text-xl font-semibold"), T(evt.Name)),
							P(T(evt.Description)),
							A(Class("mb-2 no-underline hover:underline"), Href(evt.EventURL), T("Event Link")),
							Div(
								Class("flex"),
								Button(
									T("View"),
									Type("button"),
									Class("bg-blue-500 text-white px-4 py-2 rounded mr-2"),
									HxGet(fmt.Sprintf("/event/%s", evt.ID)),
									HxTarget("#event-modal"),
									HxSwap("innerHTML"),
								),
								Button(
									T("Delete"),
									Type("button"),
									Class("bg-red-500 text-white px-4 py-2 rounded"),
									HxDelete(fmt.Sprintf("/%s/event/%s", c.ID, evt.ID)),
									HxTarget("#calendar-container"),
									HxSwap("innerHTML"),
								),
							),
						))
					}
					return Div(Chl(eventItems...))
				}(),
				Button(
					T("Close"),
					Type("button"),
					Class("modal-close bg-gray-500 text-white px-4 py-2 rounded mt-4"),
					Attr("onclick", "document.getElementById('event-modal').innerHTML = '';"),
				),
			),
		)
		modalContent.RenderPage(w, r)
	})
	return m
}

func RenderCalendar(c Calendar) *Node {
	month := int(time.Now().Month())
	year := time.Now().Year()

	monthOptions := []*Node{}
	for i := 1; i <= 12; i++ {
		monthName := time.Month(i).String()
		option := Option(
			Value(strconv.Itoa(i)),
			T(monthName),
		)
		if i == month {
			option.Attrs["selected"] = "selected"
		}
		monthOptions = append(monthOptions, option)
	}

	currentYear := time.Now().Year()
	yearOptions := []*Node{}
	for i := currentYear - 5; i <= currentYear+5; i++ {
		option := Option(
			Value(strconv.Itoa(i)),
			T(strconv.Itoa(i)),
		)
		if i == year {
			option.Attrs["selected"] = "selected"
		}
		yearOptions = append(yearOptions, option)
	}

	selectionForm := Form(
		HxPost("/"),
		Attr("hx-target", "#calendar-container"),
		HxTrigger("change from:select"),
		Attr("hx-swap", "innerHTML"),
		Class("flex items-center justify-center mb-4"),
		Div(
			Select(
				Name("month"),
				Chl(monthOptions...),
				Class("border border-gray-300 rounded px-2 py-1 mr-2"),
			),
			Select(
				Name("year"),
				Chl(yearOptions...),
				Class("border border-gray-300 rounded px-2 py-1 mr-2"),
			),
			Button(
				T("Go"),
				Type("submit"),
				Class("border border-gray-300 rounded px-2 py-1 mr-2"),
			),
			Button(
				T("Create Event"),
				Type("button"),
				Class("border border-gray-300 rounded px-2 py-1"),
				HxGet(fmt.Sprintf("%s/event/modal", c.ID)),
				HxTarget("#event-modal"),
				HxSwap("innerHTML"),
			),
		),
	)

	calendarModal := Div(Id("calendar-modal"))

	calendarNode := GenerateCalendar(month, year, c)

	eventModal := Div(Id("event-modal"))

	page := Html(
		Head(
			Title(T("Calendar Dashboard")),
			HTMX,
			TailwindCSS,
			Style(T(`
				.modal {
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background-color: rgba(0,0,0,0.5);
				display: flex;
				justify-content: center;
				align-items: center;
			}
			.modal-content {
				background-color: #fff;
				padding: 20px;
				border-radius: 8px;
				width: 90%;
				max-width: 500px;
				max-height: 80vh;
				overflow-y: auto;
			}
				.modal-close {
					margin-top: 10px;
					background-color: #f44336;
					color: white;
					border: none;
					padding: 10px;
					border-radius: 5px;
					cursor: pointer;
				}
			`)),
		),
		Body(
			selectionForm,
			eventModal,
			calendarModal,
			calendarNode,
		),
	)

	return page
}

func GenerateCalendar(month, year int, c Calendar) *Node {
	firstOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	firstWeekday := int(firstOfMonth.Weekday())
	daysInMonth := time.Date(year, time.Month(month)+1, 0, 0, 0, 0, 0, time.UTC).Day()

	weekdays := []string{"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"}

	headerCells := []*Node{}
	for _, day := range weekdays {
		headerCells = append(headerCells, Div(
			Class("p-2 bg-gray-200 font-bold text-center"),
			T(day),
		))
	}

	headerGrid := Div(
		Class("grid grid-cols-7 gap-1 bg-gray-300"),
		Chl(headerCells...),
	)

	eventsByDate := make(map[string][]CalendarEvent)
	for _, event := range c.Events {
		dateStr := event.Date.Format("2006-01-02")
		eventsByDate[dateStr] = append(eventsByDate[dateStr], event)
	}

	var cells []*Node
	for i := 0; i < firstWeekday; i++ {
		cells = append(cells, Div(Class("p-2 bg-white h-full")))
	}

	for day := 1; day <= daysInMonth; day++ {
		date := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
		dateStr := date.Format("2006-01-02")
		dayEvents := eventsByDate[dateStr]
		eventNodes := []*Node{}
		for _, evt := range dayEvents {
			eventNodes = append(eventNodes, Div(
				Class("bg-blue-100 p-1 mt-1 rounded"),
				Attr("onclick", "event.stopPropagation();"),
				A(
					Href("#"),
					T(evt.Name),
					HxGet(fmt.Sprintf("/%s/event/%s", c.ID, evt.ID)),
					HxTarget("#event-modal"),
					HxSwap("innerHTML"),
					Class("text-blue-700 hover:underline"),
				),
			))
		}
		cells = append(cells, Div(
			Class("p-2 bg-white box-border h-full overflow-hidden"),
			HxGet(fmt.Sprintf("/day_events?date=%s", dateStr)),
			HxTarget("#event-modal"),
			HxSwap("innerHTML"),
			Attr("style", "cursor:pointer"),
			Div(Class("text-right text-sm font-bold text-gray-800"), T(strconv.Itoa(day))),
			Chl(eventNodes...),
		))
	}

	totalCells := firstWeekday + daysInMonth
	if totalCells%7 != 0 {
		for i := 0; i < 7-(totalCells%7); i++ {
			cells = append(cells, Div(Class("p-2 bg-white h-full")))
		}
	}

	calendarGrid := Div(
		Id("calendar"),
		Class("grid grid-cols-7 gap-1 bg-gray-300 h-[calc(100vh-160px)] auto-rows-fr"),
		Chl(cells...),
	)

	calendar := Div(
		Id("calendar-container"),
		Chl(
			headerGrid,
			calendarGrid,
		),
	)
	return calendar
}

func createModal(containerID string, content *Node) *Node {
	modalContent := Div(
		Class("modal-content"),
	)
	modalContent.Children = append(modalContent.Children, content.Children...)

	return Div(
		Class("modal"),
		Attr("onclick", fmt.Sprintf("if(event.target === this){ document.getElementById('%s').innerHTML = ''; }", containerID)),
		modalContent,
	)
}
