package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/google/uuid"
	"github.com/yuin/goldmark"

	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/websocket"
)

type Calendar struct {
	ID          string
	Name        string
	Description string
	OwnerID     string
	IsPublic    bool
	Events      []CalendarEvent
}

type RSVP struct {
	ID   string
	Name string
	Note string
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
	RSVPs       []RSVP
}

func NewCalendar(d deps.Deps) *http.ServeMux {
	db := d.Docs.WithCollection("calendar")

	// load everout events
	ee := loadEvents()

	var events []CalendarEvent
	for d, e := range ee {
		for _, evt := range e {
			if strings.HasSuffix(d, "-top") {
				d = strings.TrimSuffix(d, "-top")
			}
			t, err := time.Parse("2006-01-02", d)
			if err != nil {
				println("error parsing date", err)
				continue
			}
			events = append(events, CalendarEvent{
				ID:          uuid.NewString(),
				Name:        evt.Title,
				Description: evt.Location,
				Date:        t,
				ImageURL:    evt.ImageURL,
				EventURL:    evt.EventURL,
			})
		}
	}

	everoutCal := Calendar{
		ID:          "everout",
		Name:        "Everout Events",
		Description: "Events from Everout",
		OwnerID:     "everout",
		IsPublic:    true,
		Events:      events,
	}

	m := http.NewServeMux()
	render := func(w http.ResponseWriter, r *http.Request, page *Node) {
		ctx := context.WithValue(r.Context(), "baseURL", "/calendar")
		page.RenderPageCtx(ctx, w, r)
	}
	m.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id == "" {
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
			c.Events = append(c.Events, everoutCal.Events...)
			render(w, r, DefaultLayout(RenderCalendar(c)))
		case http.MethodPost:
			if err := r.ParseForm(); err != nil {
				http.Error(w, "Error parsing form data", http.StatusBadRequest)
				return
			}
			monthStr := r.FormValue("month")
			yearStr := r.FormValue("year")
			month, _ := strconv.Atoi(monthStr)
			year, _ := strconv.Atoi(yearStr)

			render(w, r, GenerateCalendar(month, year, c))
		}
	})
	renderModal := func(c *Node) *Node {
		return Dialog(
			Id("modal"),
			Class("modal"),
			Open(true),
			Div(
				Class("modal-box"),
				c,
				Div(
					Class("modal-action"),
					Form(Method("dialog"), Button(Class("btn"), T("close"))),
				),
			),
		)
	}
	eventForm := func(calID, date string) *Node {
		return renderModal(
			Form(
				HxPost(fmt.Sprintf("/%s/event/", calID)),
				HxTrigger("click from:#modal-create-event"),
				HxTarget("#modal"),
				HxSwap("outerHTML"),
				Class("space-y-4"),
				Input(Type("text"), Name("name"), Placeholder("Event Name"), Class("w-full input")),
				TextArea(Name("description"), Placeholder("Description"), Class("w-full input")),
				Input(Type("date"), Value(date), Name("date"), Class("w-full input")),
				Div(
					Div(
						Id("modal-create-event"),
						Class("btn"),
						T("Create Event"),
					),
					Button(
						T("Cancel"),
						Type("button"),
						Class("btn"),
						Attr("onclick", "document.getElementById('event-modal').innerHTML = '';"),
					),
				),
			),
		)
	}
	m.HandleFunc("/{id}/event/modal", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		date := r.URL.Query().Get("date")
		render(w, r, eventForm(id, date))
	})
	loadCalendarAndEvent := func(w http.ResponseWriter, r *http.Request) (Calendar, CalendarEvent, error) {
		id := r.PathValue("id")
		eid := r.PathValue("eid")

		var c Calendar
		if err := db.Get(id, &c); err != nil {
			return Calendar{}, CalendarEvent{}, err
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
				return Calendar{}, CalendarEvent{}, fmt.Errorf("event not found")
			}
		}
		return c, evt, nil
	}
	m.HandleFunc("/{id}/event/{eid}/edit", func(w http.ResponseWriter, r *http.Request) {
		c, evt, err := loadCalendarAndEvent(w, r)
		if err != nil {
			http.Error(w, "Calendar or Event not found", http.StatusNotFound)
			return
		}

		render(w, r,
			renderModal(
				Form(
					HxPost(fmt.Sprintf("/%s/event/%s", c.ID, evt.ID)),
					HxTarget("#modal"),
					HxSwap("outerHTML"),
					Class("space-y-4"),
					Input(Type("text"), Name("name"), Value(evt.Name), Placeholder("Event Name"), Class("w-full p-2 border border-gray-300 rounded")),
					TextArea(Name("description"), T(evt.Description), Placeholder("Description"), Class("w-full p-2 border border-gray-300 rounded")),
					Input(Type("date"), Value(evt.Date.Format("2006-01-02")), Name("date"), Class("w-full p-2 border border-gray-300 rounded")),
					Div(
						Button(Type("submit"), T("Update Event"), Class("btn")),
						Button(
							T("Cancel"),
							Type("button"),
							Class("modal-close btn"),
							Attr("onclick", "document.getElementById('event-modal').innerHTML = '';"),
						),
					),
				),
			),
		)
	})
	m.HandleFunc("/{id}/event/{eid}/invite", func(w http.ResponseWriter, r *http.Request) {
		c, evt, err := loadCalendarAndEvent(w, r)
		if err != nil {
			http.Error(w, "Calendar or Event not found", http.StatusNotFound)
			return
		}

		switch r.Method {
		case http.MethodGet:
			rsvps := []*Node{}
			for _, rsvp := range evt.RSVPs {
				rsvps = append(rsvps, Div(
					Class("p-1 mt-1 rounded"),
					H3(Class("text-xl font-semibold"), T(rsvp.Name)),
					P(T(rsvp.Note)),
				))
			}
			md := goldmark.New()
			var buf bytes.Buffer
			if err := md.Convert([]byte(evt.Description), &buf); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			render(w, r, DefaultLayout(
				RenderOrigami(
					Div(
						Class("max-w-md mx-auto p-4"),
						P(Class("text-2xl font-bold mb-4"), T(evt.Name)),
						Div(Raw(buf.String())),
						Form(
							Method("POST"),
							Action(fmt.Sprintf("/%s/event/%s/invite", c.ID, evt.ID)),
							Class("space-y-4"),
							Input(Type("text"), Name("name"), Placeholder("Name"), Class("input text-white w-full p-2 border rounded")),
							TextArea(Name("note"), Placeholder("Note"), Class("input text-white w-full p-2 border rounded")),
							Button(Type("submit"), T("RSVP"), Class("bg-blue-500 text-white px-4 py-2 rounded")),
						),
						P(Class("text-2xl font-bold mb-4 mt-4"), T("Attendees")),
						Ch(rsvps),
						Iframe(Width("100%"), Height("315"), Src("https://www.youtube.com/embed/MAM4vbVy_Q8?si=3-ijyjJBBQ-rdY-R"), Attrs(map[string]string{
							"frameborder":        "0",
							"allow":              "accelerometer",
							"autoplay":           "clipboard-write",
							"encrypted-media":    "gyroscope",
							"picture-in-picture": "",
							"web-share":          "",
							"referrerpolicy":     "strict-origin-when-cross-origin",
							"allowfullscreen":    "",
						})),
					),
				),
			))
		case http.MethodPost:
			if err := r.ParseForm(); err != nil {
				http.Error(w, "Error parsing form data", http.StatusBadRequest)
				return
			}

			rsvp := RSVP{
				ID:   uuid.NewString(),
				Name: r.FormValue("name"),
				Note: r.FormValue("note"),
			}
			evt.RSVPs = append(evt.RSVPs, rsvp)
			for i, e := range c.Events {
				if e.ID == evt.ID {
					c.Events[i] = evt
					break
				}
			}
			if err := db.Set(c.ID, c); err != nil {
				http.Error(w, "Error saving RSVP", http.StatusInternalServerError)
				return
			}
			http.Redirect(w, r, fmt.Sprintf("/calendar/%s", c.ID), http.StatusSeeOther)
		}
	})
	m.HandleFunc("/{id}/event/{eid...}", func(w http.ResponseWriter, r *http.Request) {
		c, evt, err := loadCalendarAndEvent(w, r)
		if err != nil {
			http.Error(w, "Calendar or Event not found", http.StatusNotFound)
			return
		}

		switch r.Method {
		case http.MethodGet:
			rsvps := []*Node{}
			for _, rsvp := range evt.RSVPs {
				rsvps = append(rsvps, Div(
					Class("p-1 mt-1 rounded"),
					H3(Class("text-xl font-semibold"), T(rsvp.Name)),
					P(T(rsvp.Note)),
				))
			}
			md := goldmark.New()
			var buf bytes.Buffer
			if err := md.Convert([]byte(evt.Description), &buf); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			render(w, r, renderModal(
				Div(
					Img(
						Src(evt.ImageURL),
					),
					H2(Class("text-2xl font-bold mb-4"), T(evt.Name)),
					P(Class("mb-2"), T("Date: "+evt.Date.Format("2006-01-02"))),
					Div(Raw(buf.String())),
					A(
						Class("btn mb-2 no-underline hover:underline"),
						HxGet(fmt.Sprintf("/%s/event/%s/edit", c.ID, evt.ID)),
						HxTarget("#event-modal"),
						HxSwap("innerHTML"),
						T("Edit"),
					),
					A(Class("btn mb-2 no-underline hover:underline"), Href(evt.EventURL), T("Event Link")),
					A(Class("btn mb-2 no-underline hover:underline"), Href(fmt.Sprintf("/%s/event/%s/invite", c.ID, evt.ID)), T("Invite Attendees")),
					Div(Ch(rsvps)),
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
					),
				),
			))
		case http.MethodDelete:
			var newEvents []CalendarEvent
			for _, e := range c.Events {
				if e.ID != e.ID {
					newEvents = append(newEvents, e)
				}
			}

			c.Events = newEvents
			if err := db.Set(c.ID, c); err != nil {
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

			id := uuid.NewString()
			if evt.ID != "" {
				id = evt.ID
			}
			newEvent := CalendarEvent{
				ID:          id,
				Name:        name,
				Description: description,
				Date:        date,
			}
			if evt.ID == "" {
				c.Events = append(c.Events, newEvent)
			} else {
				for i, e := range c.Events {
					if e.ID == evt.ID {
						c.Events[i] = newEvent
						break
					}
				}
			}
			if err := db.Set(c.ID, c); err != nil {
				http.Error(w, "Error creating event", http.StatusInternalServerError)
				return
			}
			w.Header().Set("HX-Trigger", "update-calendar")
			return
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

		c.Events = append(c.Events, everoutCal.Events...)

		ds, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			http.Error(w, "Invalid date format", http.StatusBadRequest)
			return
		}

		var eventsOnDate []CalendarEvent
		for _, evt := range c.Events {
			if evt.Date.Year() == ds.Year() && evt.Date.Month() == ds.Month() && evt.Date.Day() == ds.Day() {
				eventsOnDate = append(eventsOnDate, evt)
			}
		}

		render(w, r, renderModal(
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
									HxGet(fmt.Sprintf("/%s/event/%s", c.ID, evt.ID)),
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
					HxGet(fmt.Sprintf("/%s/event/modal?date=%s", c.ID, dateStr)),
					HxTarget("#event-modal"),
					HxSwap("innerHTML"),
					Class("btn"),
					T("Create Event"),
				),
			),
		))
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
		HxPost(fmt.Sprintf("/%s", c.ID)),
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
				HxGet(fmt.Sprintf("/%s/event/modal?date=%s", c.ID, "")),
				HxTarget("#event-modal"),
				HxSwap("innerHTML"),
				Class("btn"),
				T("Create Event"),
			),
		),
	)
	return Div(
		HxGet("/"+c.ID),
		HxTrigger("update-calendar"),
		selectionForm,
		Div(Id("event-modal")),
		Div(Id("calendar-modal")),
		GenerateCalendar(month, year, c),
	)
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
			Class("p-2 bg-white box-border h-full overflow-scroll"),
			HxGet(fmt.Sprintf("/%s/day_events?date=%s", c.ID, dateStr)),
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

func RenderOrigami(c *Node) *Node {
	return Div(
		Class("wrapper"),
		Style(Raw(origamiCss)),
		Div(
			Class("bg"),
			Div(
				Class("img-wrapper"),
				Div(Class("img")),
				Div(
					Class("img-border overflow-y-scroll"),
					c,
				),
				Div(
					Class("corner-shadows"),
					Div(Class("top-left")),
					Div(Class("top-right")),
					Div(Class("bottom-right")),
					Div(Class("bottom-left")),
				),
			),
			Div(Class("square-large")),
			Div(Class("square-small-top")),
			Div(Class("square-small-bottom")),
		),
	)
}

type EverOutEvent struct {
	Title       string
	Category    string
	Date        string
	EveroutDate string
	Time        string
	Location    string
	Region      string
	Price       string
	ImageURL    string
	EventURL    string
	Liked       bool
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

func ScraperUiForm(d deps.Deps) *Node {
	eventsDB := d.Docs.WithCollection("events")
	topEventsDB := d.Docs.WithCollection("topEvents")

	var events []EverOutEvent
	var topEvents []EverOutEvent

	docs, err := eventsDB.List()
	if err != nil {
		fmt.Println("Error listing events:", err)
	}
	for _, e := range docs {
		var event EverOutEvent
		if err := json.Unmarshal(e.Data, &event); err != nil {
			fmt.Println("Error unmarshalling event:", err)
			continue
		}
		events = append(events, event)
	}

	docs, err = topEventsDB.List()
	if err != nil {
		fmt.Println("Error listing top events:", err)
	}
	for _, e := range docs {
		var event EverOutEvent
		if err := json.Unmarshal(e.Data, &event); err != nil {
			fmt.Println("Error unmarshalling top event:", err)
			continue
		}
		topEvents = append(topEvents, event)
	}

	eventsByDate := make(map[string][]EverOutEvent)
	for _, e := range events {
		eventsByDate[e.Date] = append(eventsByDate[e.Date], e)
	}
	for _, e := range topEvents {
		eventsByDate[e.Date] = append(eventsByDate[e.Date], e)
	}

	return DefaultLayout(
		Div(
			Class("p-4"),
			Form(
				Method("POST"),
				Div(
					Class("mb-4"),
					Label(
						For("scrape"),
						Text("Scrape events:"),
					),
					Select(
						Name("scrape"),
						Option(Value("all"), Text("All events")),
						Option(Value("date"), Text("By date")),
						Option(Value("top"), Text("Top events")),
					),
				),
				Div(
					Class("mb-4"),
					Label(
						For("date"),
						Text("Date (YYYY-MM-DD):"),
					),
					Input(
						Type("text"),
						Name("date"),
						Placeholder("YYYY-MM-DD"),
					),
				),
				Button(
					Type("submit"),
					Text("Scrape"),
				),
			),
			H1(Class("text-2xl font-semibold mb-4"), Text("Events")),
			RenderEverout(eventsByDate),
		),
	)
}

func NewEverout(d deps.Deps) *http.ServeMux {
	eventsDB := d.Docs.WithCollection("events")
	topEventsDB := d.Docs.WithCollection("topEvents")

	// topEventsDB.DeleteAll()
	// eventsDB.DeleteAll()

	d.WebsocketRegistry.Register2("like", func(message string, hub *websocket.Hub, msgMap map[string]interface{}) {
		eventsDB := d.Docs.WithCollection("events")
		id := msgMap["id"].(string)

		var event EverOutEvent
		eventsDB.Get(id, &event)
		if event.Liked {
			event.Liked = false
		} else {
			event.Liked = true
		}

		eventsDB.Set(id, event)

		cmdMsgs := []string{
			LikeButton(id, event.Liked).Render(),
		}
		for _, msg := range cmdMsgs {
			hub.Broadcast <- websocket.Message{
				Room:    id,
				Content:  []byte(msg),
			}
		}
	})

	m := http.NewServeMux()
	m.HandleFunc("/ui", func(w http.ResponseWriter, r *http.Request) {
		var events []EverOutEvent
		var topEvents []EverOutEvent

		if r.Method == "POST" {
			r.ParseForm()
			if r.Form.Get("scrape") == "all" {
				events, topEvents = ScrapeEverOut(1, 10)
			} else if r.Form.Get("scrape") == "date" {
				dateStr := r.Form.Get("date")
				date, err := time.Parse("2006-01-02", dateStr)
				if err != nil {
					fmt.Fprintf(w, "Error parsing date: %v", err)
					return
				}
				events = ScrapeEverOutByDate(date)
			} else if r.Form.Get("scrape") == "top" {
				dateStr := r.Form.Get("date")
				date, err := time.Parse("2006-01-02", dateStr)
				if err != nil {
					fmt.Fprintf(w, "Error parsing date: %v", err)
					return
				}
				events = ScrapeTopEventsByDate(date)
			}
			for _, e := range events {
				eventsDB.Set(e.Title, e)
			}
			for _, e := range topEvents {
				topEventsDB.Set(e.Title, e)
			}
		}

		ScraperUiForm(d).RenderPage(w, r)
	})

	var events []EverOutEvent
	var topEvents []EverOutEvent

	docs, err := eventsDB.List()
	if err != nil {
		fmt.Println("Error listing events:", err)
	}
	for _, e := range docs {
		var event EverOutEvent
		if err := json.Unmarshal(e.Data, &event); err != nil {
			fmt.Println("Error unmarshalling event:", err)
			continue
		}
		events = append(events, event)
	}

	eventsByDate := make(map[string][]EverOutEvent)
	for _, e := range events {
		eventsByDate[e.Date] = append(eventsByDate[e.Date], e)
	}

	topDocs, err := topEventsDB.List()
	if err != nil {
		fmt.Println("Error listing top events:", err)
	}
	for _, e := range topDocs {
		var event EverOutEvent
		if err := json.Unmarshal(e.Data, &event); err != nil {
			fmt.Println("Error unmarshalling top event:", err)
			continue
		}
		topEvents = append(topEvents, event)
	}

	topEventsByDate := make(map[string][]EverOutEvent)
	for _, e := range topEvents {
		topEventsByDate[e.Date] = append(topEventsByDate[e.Date], e)
	}

	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				ReloadNode("everout.go"),
				RenderEverout(eventsByDate),
			),
		).RenderPage(w, r)
	})
	return m
}

func runJob() {
	loc, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		fmt.Println("Error loading location:", err)
		return
	}
	eventDataDir := "data/everout/"
	if _, err := os.Stat(eventDataDir); os.IsNotExist(err) {
		os.Mkdir(eventDataDir, 0755)
	}
	today := time.Now().In(loc)

	for {
		thursStartMin := rand.Intn(60)
		sunStartMin := rand.Intn(60)

		nextThursday := nextOccurrence(time.Thursday, 4, thursStartMin, 0, loc)
		nextSunday := nextOccurrence(time.Sunday, 4, sunStartMin, 0, loc)

		var next time.Time
		if nextThursday.Before(nextSunday) {
			next = nextThursday
		} else {
			next = nextSunday
		}

		now := time.Now().In(loc)
		duration := next.Sub(now)
		fmt.Printf("Sleeping for %v until %v\n", duration, next)

		time.Sleep(duration)

		fmt.Println("Running scraper at", time.Now().In(loc))
		ScrapeDaysFrom(today, 60)
	}
}

func loadEvents() map[string][]EverOutEvent {
	eventsByDate := make(map[string][]EverOutEvent)

	dirPath := "data/everout"
	files, err := os.ReadDir(dirPath)
	if err != nil {
		fmt.Println("Error reading directory:", err)
		return eventsByDate
	}

	for _, file := range files {
		if !file.IsDir() {
			filename := file.Name()
			if strings.HasSuffix(filename, ".json") {
				dateStr := strings.TrimSuffix(filename, ".json")
				filePath := filepath.Join(dirPath, filename)

				data, err := os.ReadFile(filePath)
				if err != nil {
					fmt.Printf("Error reading file %s: %v\n", filename, err)
					continue
				}

				var events []EverOutEvent
				err = json.Unmarshal(data, &events)
				if err != nil {
					fmt.Printf("Error unmarshalling events from file %s: %v\n", filename, err)
					continue
				}

				eventsByDate[dateStr] = events
			}
		}
	}

	return eventsByDate
}

func LikeButton(id string, liked bool) *Node {
	var bntClass *Node
	if liked {
		bntClass = Class("btn btn-success p-1 border-none")
	} else {
		bntClass = Class("btn btn-outline btn-error p-1 border-none")
	}

	return Form(
		Id(id),
		Attr("ws-send", "submit"),
		Input(
			Type("hidden"),
			Name("id"),
			Value(id),
		),
		Input(
			Type("hidden"),
			Name("like"),
			Attr("readonly", ""),
		),
		Button(
			Type("submit"),
			Attr("onclick", "this.classList.toggle('btn-outline'); this.classList.toggle('btn-error'); this.classList.toggle('btn-success');"),
			bntClass,
			Svg(
				Attr("xmlns", "http://www.w3.org/2000/svg"),
				Class("h-6 w-6"),
				Fill("none"),
				ViewBox("0 0 24 24"),
				Stroke("currentColor"),
				Path(
					StrokeLinecap("round"),
					StrokeLinejoin("round"),
					StrokeWidth("2"),
					Attr("d", "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"),
				),
			),
		),
	)
}

func RenderEverout(eventsByDate map[string][]EverOutEvent) *Node {
	var dateNodes []*Node

	dates := make([]string, 0, len(eventsByDate))
	for date := range eventsByDate {
		dates = append(dates, date)
	}
	sort.Strings(dates)

	for _, date := range dates {
		events := eventsByDate[date]
		dateHeader := H2(Class("text-2xl font-bold my-4"), Text(date))
		var eventNodes []*Node
		for _, event := range events {
			eventNodes = append(eventNodes, Div(
				Class("bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"),
				Div(
					Class("h-48 bg-cover bg-center"),
					Style_(fmt.Sprintf("background-image: url('%s');", event.ImageURL)),
					LikeButton(event.Title, event.Liked),
				),
				Div(
					Class("p-4"),
					H2(Class("text-xl font-semibold mb-2"), Text(event.Title)),
					P(Class("text-sm text-gray-500 mb-2"), Text(event.Category)),
					P(Class("text-sm text-gray-500 mb-2"), Text(fmt.Sprintf("%s at %s", event.Date, event.Time))),
					P(Class("text-sm text-gray-500 mb-2"), Text(fmt.Sprintf("%s, %s", event.Location, event.Region))),
					P(Class("text-sm text-gray-700 font-semibold mb-4"), Text(event.Price)),
					A(
						Class("text-blue-500 hover:text-blue-700 underline"),
						Href(event.EventURL),
						Text("More info"),
					),
				),
			))
		}
		eventsGrid := Div(
			Class("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4"),
			Ch(eventNodes),
		)
		dateNodes = append(dateNodes, dateHeader, eventsGrid)
	}

	return Div(
		Ch(dateNodes),
	)
}

func ScrapeEverOut(startPage, endPage int) ([]EverOutEvent, []EverOutEvent) {
	// date := time.Now()
	// dateStr := date.Format("2006-01-02")
	var events []EverOutEvent
	var topEvents []EverOutEvent
	for page := startPage; page <= endPage; page++ {
		sleepDuration := time.Duration(rand.Intn(3)+1) * time.Second
		time.Sleep(sleepDuration)

		var url string
		var topUrl string
		if page == 1 {
			url = "https://everout.com/seattle/events/"
			topUrl = "https://everout.com/seattle/events/?staff-pick=true"
		} else {
			url = fmt.Sprintf("https://everout.com/seattle/events/?page=%d", page)
			topUrl = fmt.Sprintf("https://everout.com/seattle/events/?page=%d&staff-pick=true", page)
		}
		fmt.Printf("Scraping page %d: %s\n", page, url)
		evt, err := ScrapeEvents(url, "")
		if err != nil {
			fmt.Println("Error scraping page", page, ":", err)
			continue
		}
		if len(evt) == 0 {
			fmt.Println("No more events found on page", page)
			break
		}

		events = append(events, evt...)

		topEvts, err := ScrapeEvents(topUrl, "")
		if err != nil {
			fmt.Println("Error scraping top events for page", page, ":", err)
			continue
		}
		if len(topEvts) == 0 {
			fmt.Println("No more top events found on page", page)
			break
		}

		topEvents = append(topEvents, topEvts...)

		// SaveEveroutEvents(events, fmt.Sprintf("data/everout/%s.json", dateStr))
		// SaveEveroutEvents(topEvents, fmt.Sprintf("data/everout/%s-top.json", dateStr))

		// date = date.AddDate(0, 0, 1)
		// dateStr = date.Format("2006-01-02")
	}

	return events, topEvents
}

func SaveEveroutEvents(events []EverOutEvent, path string) {
	eventsStr, err := json.MarshalIndent(events, "", "    ")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	os.WriteFile(path, eventsStr, 0644)
}

func ScrapeEverOutByDate(startDate time.Time) []EverOutEvent {
	events, err := ScrapeEventsByDate(startDate)
	if err != nil {
		fmt.Println("Error scraping date", startDate.Format("2006-01-02"), ":", err)
	}

	return events
}

func ScrapeTopEventsByDate(startDate time.Time) []EverOutEvent {
	date := startDate

	events, err := ScrapeTopEventsForDate(date)
	if err != nil {
		fmt.Println("Error scraping top events for date", date.Format("2006-01-02"), ":", err)
	}
	return events
}
func ScrapeDaysFrom(startDate time.Time, days int) {
	for i := 0; i < days; i++ {
		date := startDate.AddDate(0, 0, i)
		fmt.Println("Scraping date", date.Format("2006-01-02"))
		events, err := ScrapeEventsByDate(date)
		if err != nil {
			fmt.Println("Error scraping date", date.Format("2006-01-02"), ":", err)
		}

		topEvents, err := ScrapeTopEventsForDate(date)
		if err != nil {
			fmt.Println("Error scraping top events for date", date.Format("2006-01-02"), ":", err)
		}
		SaveEveroutEvents(events, fmt.Sprintf("data/everout/%s.json", date.Format("2006-01-02")))
		SaveEveroutEvents(topEvents, fmt.Sprintf("data/everout/%s-top.json", date.Format("2006-01-02")))
		updateEvents(events)
	}
}

func ScrapeEventsByDate(date time.Time) ([]EverOutEvent, error) {
	var allEvents []EverOutEvent
	page := 1
	totalPages := 1

	for page <= totalPages {
		sleepDuration := time.Duration(rand.Intn(3)+1) * time.Second
		time.Sleep(sleepDuration)

		url := fmt.Sprintf("https://everout.com/seattle/events/?page=%d&start-date=%s", page, date.Format("2006-01-02"))
		fmt.Printf("Scraping date %s, page %d of %d: %s\n", date.Format("2006-01-02"), page, totalPages, url)
		events, totalPagesFromPage, err := ScrapeEventsWithPagination(url, date.Format("2006-01-02"))
		if err != nil {
			return allEvents, err
		}
		if len(events) == 0 {
			fmt.Println("No events found on page", page)
			break
		}
		allEvents = append(allEvents, events...)
		fmt.Println("Events", events[0].Title)
		if page == 1 && totalPagesFromPage > 0 {
			totalPages = totalPagesFromPage
		}
		page++
	}

	return allEvents, nil
}

func ScrapeEventsWithPagination(url string, date string) ([]EverOutEvent, int, error) {
	var events []EverOutEvent
	totalPages := 1
	fmt.Println("Scraping events with pagination", url)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return events, totalPages, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; EventScraper/1.0)")
	req.Header.Set("Accept", "text/html")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error making request", err)
		return events, totalPages, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return events, totalPages, fmt.Errorf("status code error: %d %s", resp.StatusCode, resp.Status)
	}
	fmt.Println("Response status", resp.StatusCode)

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		fmt.Println("Error parsing HTML", err)
		return events, totalPages, err
	}
	fmt.Println("HTML parsed successfully")
	events = ParseDoc(doc, date)

	fmt.Println("Events found", len(events))
	paginationText := doc.Find("div.pagination-description").Text()
	totalPages = extractTotalPages(paginationText)
	fmt.Printf("Total pages found: %d\n", totalPages)

	return events, totalPages, nil
}

// extractTotalPages parses the total number of pages from the pagination text
func extractTotalPages(paginationText string) int {
	paginationText = strings.TrimSpace(paginationText)
	if paginationText == "" {
		return 1 // Default to 1 if pagination text is empty
	}

	parts := strings.Fields(paginationText)
	if len(parts) < 4 {
		return 1 // Default to 1 if format is unexpected
	}

	totalPagesStr := parts[len(parts)-1]
	totalPagesStr = strings.TrimSpace(totalPagesStr)
	totalPages, err := strconv.Atoi(totalPagesStr)
	if err != nil {
		fmt.Println("Error parsing total pages:", err)
		return 1
	}

	return totalPages
}

func ScrapeTopEventsForDate(date time.Time) ([]EverOutEvent, error) {
	var allEvents []EverOutEvent
	page := 1

	for {
		sleepDuration := time.Duration(rand.Intn(3)+1) * time.Second
		time.Sleep(sleepDuration)

		url := fmt.Sprintf("https://everout.com/seattle/events/?page=%d&start-date=%s&staff-pick=true", page, date.Format("2006-01-02"))
		fmt.Printf("Scraping top events for date %s, page %d: %s\n", date.Format("2006-01-02"), page, url)
		events, err := ScrapeEvents(url, date.Format("2006-01-02"))

		if err != nil {
			return allEvents, err
		}
		if len(events) == 0 {
			break
		}
		if slices.Contains(allEvents, events[len(events)-1]) {
			fmt.Println("No more top events found on page", page)
			break
		}
		allEvents = append(allEvents, events...)
		page++
	}

	return allEvents, nil
}

func ParseDoc(doc *goquery.Document, date string) []EverOutEvent {
	events := []EverOutEvent{}
	doc.Find("div.event.list-item").Each(func(i int, s *goquery.Selection) {
		var event EverOutEvent

		title := s.Find("h2.event-title a span.title-link").Text()
		title = strings.Replace(title, "\u0026", "and", -1)
		event.Title = title

		category := s.Find("a.fw-bold.text-uppercase.fs-8.text-gray-3").Text()
		category = strings.Replace(category, "\u0026", "and", -1)
		event.Category = category

		everoutDate := stripChars(s.Find("div.event-date").Text(), "\n")
		everoutDate = stripChars(everoutDate, " ")
		event.EveroutDate = everoutDate
		event.Date = date 

		fmt.Println("THE DATE IS: ", date)

		timeStr := stripChars(s.Find("div.event-time").Text(), "\n")
		timeStr = stripChars(timeStr, " ")
		event.Time = timeStr

		event.Location = s.Find("div.location-name a").Text()

		region := stripChars(s.Find("div.location-region").Text(), "\n")
		region = stripChars(region, " ")
		event.Region = region

		event.Price = s.Find("ul.event-tags li").First().Text()

		imgSrc, exists := s.Find("div.col-md-3 a img.img-responsive").Attr("src")
		if exists {
			event.ImageURL = imgSrc
		}

		eventURL, exists := s.Find("h2.event-title a").Attr("href")
		if exists {
			event.EventURL = eventURL
		}

		events = append(events, event)
	})
	return events
}

func ScrapeEvents(url string, date string) ([]EverOutEvent, error) {
	var events []EverOutEvent

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return events, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "+
		"AppleWebKit/537.36 (KHTML, like Gecko) "+
		"Chrome/93.0.4577.82 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,"+
		"image/avif,image/webp,image/apng,*/*;q=0.8,"+
		"application/signed-exchange;v=b3;q=0.9")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Connection", "keep-alive")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return events, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return events, fmt.Errorf("status code error: %d %s", resp.StatusCode, resp.Status)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return events, err
	}

	newEvents := ParseDoc(doc, date)
	events = append(events, newEvents...)

	return events, nil
}

func stripChars(str, chr string) string {
	return strings.Map(func(r rune) rune {
		if strings.IndexRune(chr, r) < 0 {
			return r
		}
		return -1
	}, str)
}

func eventExists(event EverOutEvent, events []EverOutEvent) bool {
	for _, e := range events {
		if e.EventURL == event.EventURL {
			return true
		}
	}
	return false
}

func updateEvents(newEvents []EverOutEvent) {
	var existingEvents []EverOutEvent
	data, err := os.ReadFile("everout.json")
	if err == nil {
		err = json.Unmarshal(data, &existingEvents)
		if err != nil {
			fmt.Println("Error reading existing events:", err)
			existingEvents = []EverOutEvent{}
		}
	} else {
		existingEvents = []EverOutEvent{}
	}

	for _, event := range newEvents {
		if !eventExists(event, existingEvents) {
			existingEvents = append(existingEvents, event)
			fmt.Printf("New event found: %+v\n", event)
		}
	}

	data, err = json.MarshalIndent(existingEvents, "", "    ")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	err = os.WriteFile("everout.json", data, 0644)
	if err != nil {
		fmt.Println("Error writing to everout.json:", err)
	}
}

func everoutScraperUI(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		r.ParseForm()
		if r.Form.Get("scrape") == "all" {
			ScrapeEverOut(1, 10)
		} else if r.Form.Get("scrape") == "date" {
			dateStr := r.Form.Get("date")
			date, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				fmt.Fprintf(w, "Error parsing date: %v", err)
				return
			}
			ScrapeEverOutByDate(date)
		} else if r.Form.Get("scrape") == "top" {
			dateStr := r.Form.Get("date")
			date, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				fmt.Fprintf(w, "Error parsing date: %v", err)
				return
			}
			ScrapeTopEventsByDate(date)
		}
	}

	events := loadEvents()
	DefaultLayout(
		Div(
			Class("p-4"),
			Form(
				Method("POST"),
				Div(
					Class("mb-4"),
					Label(
						For("scrape"),
						Text("Scrape events:"),
					),
					Select(
						Name("scrape"),
						Option(Value("all"), Text("All events")),
						Option(Value("date"), Text("By date")),
						Option(Value("top"), Text("Top events")),
					),
				),
				Div(
					Class("mb-4"),
					Label(
						For("date"),
						Text("Date (YYYY-MM-DD):"),
					),
					Input(
						Type("text"),
						Name("date"),
						Placeholder("YYYY-MM-DD"),
					),
				),
				Button(
					Type("submit"),
					Text("Scrape"),
				),
			),
			H1(Class("text-2xl font-semibold mb-4"), Text("Events")),
			RenderEverout(events),
		),
	).RenderPage(w, r)
}

func nextOccurrence(weekday time.Weekday, hour, min, sec int, loc *time.Location) time.Time {
	now := time.Now().In(loc)
	next := time.Date(now.Year(), now.Month(), now.Day(), hour, min, sec, 0, loc)
	daysUntil := (int(weekday) - int(now.Weekday()) + 7) % 7
	if daysUntil == 0 && now.After(next) {
		daysUntil = 7
	}
	next = next.AddDate(0, 0, daysUntil)
	return next
}

var origamiCss = `
*{
box-sizing: border-box;
-webkit-font-smoothing: subpixel-antialiased;
}

a{
text-decoration: none;
color: #222222;
transform: translateZ(0);
backface-visibility: hidden;
transform: translate3d(0,0,0);
}

a:hover {
text-decoration: underline;
font-weight: bold;
}


body {
height: 100vh;
display: grid;
place-content: center;
font-family: 'Annie Use Your Telescope', cursive;
font-size: 1.2rem;
line-height: 1.5;
color: #222222;
}

.wrapper {
-o-transform: scale(0.8,0.8) rotate(-45deg);
-ms-transform: scale(0.8,0.8) rotate(-45deg);
-moz-transform: scale(0.8,0.8) rotate(-45deg);
-webkit-transform: scale(0.8,0.8) rotate(-45deg);
transform: scale(0.8,0.8) rotate(-45deg);

-o-transition: all .4s ease-out;
-moz-transition: all .4s ease-out;
-webkit-transition: all .4s ease-out;
transition: all .4s ease-out;
}

.wrapper:hover {
-o-transform: scale(1.1,1.1) rotate(-3deg);
-ms-transform: scale(1.1,1.1) rotate(-3deg);
-moz-transform: scale(1.1,1.1) rotate(-3deg);
-webkit-transform: scale(1.1,1.1) rotate(-3deg);
transform: scale(1.1,1.1) rotate(-3deg);

-o-transition: all .5s ease-in;
-moz-transition: all .5s ease-in;
-webkit-transition: all .5s ease-in;
transition: all .5s ease-in;
}


.bg {
width: 260px;
height: 260px;
background: url('https://ik.imagekit.io/webdigitalalien/paper-texture_rme04pvze.jpg?ik-sdk-version=javascript-1.4.3&updatedAt=1643796293371');
background-size: 350px;
box-shadow: 2px 2px 5px 0 rgba(0,0,0,0.3);
position: relative;
z-index: 1;

-o-transform: perspective(2000px);
-ms-transform: perspective(2000px);
-moz-transform: perspective(2000px);
-webkit-transform: perspective(2000px);
transform: perspective(2000px);

-o-transition: all .3s ease-in;
-moz-transition: all .3s ease-in;
-webkit-transition: all .3s ease-in;
transition: all .3s ease-in;
}

.wrapper:hover .bg {
box-shadow: 6px 6px 20px 15px rgba(0,0,0,0.3);
}

.bg::after {
content: '';
position:absolute;
top: 0;
right: 0;
bottom: 0;
left: 0;
background-color: #18A5C4;
mix-blend-mode: multiply;
}

.img-wrapper {
position: absolute;
top: 15px;
left: 15px;
bottom: 15px;
right: 15px;
z-index: 2;
--cornerCut: 10px;
-webkit-clip-path: polygon(
0% var(--cornerCut),
var(--cornerCut) 0%,
calc(100% - var(--cornerCut)) 0%,
100% var(--cornerCut),
100% calc(100% - var(--cornerCut)),
calc(100% - var(--cornerCut)) 100%,
var(--cornerCut) 100%,
0% calc(100% - var(--cornerCut))
);
clip-path: polygon(
0% var(--cornerCut),
var(--cornerCut) 0%,
calc(100% - var(--cornerCut)) 0%,
100% var(--cornerCut),
100% calc(100% - var(--cornerCut)),
calc(100% - var(--cornerCut)) 100%,
var(--cornerCut) 100%,
0% calc(100% - var(--cornerCut))
);
opacity: 0;

-o-transition: opacity .6s ease;
-moz-transition: opacity .6s ease;
-webkit-transition: opacity .6s ease;
transition: opacity .6s ease;
}

.wrapper:hover .img-wrapper {
opacity: 1;
}

.img {
position: absolute;
top: 120px;
left: 120px;
width: 100%;
height: 100%;
z-index: 3;
background: #f2f2f2;
background-position: center;
background-size: cover;
background-repeat: no-repeat;

-o-transform: translate(-50%, -50%);
-ms-transform: translate(-50%, -50%);
-moz-transform: translate(-50%, -50%);
-webkit-transform: translate(-50%, -50%);
transform: translate(-50%, -50%);
}

h1 {
font-size: 1.5rem;
transform: translateZ(0);
backface-visibility: hidden;
transform: translate3d(0,0,0);
margin-bottom: -10px;
}

.img-border {
width: 101%;
height: 101%;
position: absolute;
top: 50%;
left: 50%;
z-index: 5;
background:transparent;
border: 8px solid white;

-o-transform: translate(-50%,-50%);
-ms-transform: translate(-50%,-50%);
-moz-transform: translate(-50%,-50%);
-webkit-transform: translate(-50%,-50%);
transform: translate(-50%,-50%);
}

.corner-shadows {
width: 100%;
height: 100%;
position: relative;
}

.corner-shadows > div {
width: 50px;
--corner-size: 1.7em;
border-left: var(--corner-size) solid lighten(#000, 3%);
border-bottom: calc(var(--corner-size)) solid transparent;
border-top: calc(var(--corner-size)) solid transparent;
position: absolute;
box-shadow: -3px 0 2px -3px rgba(0,0,0,0.7);
z-index: 7;
}

.top-left {
transform: translate(-100%, -50%) rotate(225deg);
}

.top-right {
top: 0;
right: 0;
transform: translate(100%, -51%) rotate(-46deg);
}

.bottom-right {
right: 0;
bottom: 0;
transform: translate(102%, 51%) rotate(46deg);
}

.bottom-left {
left: 0;
bottom: 0;
transform: translate(-102%, 51%) rotate(134deg);
}
.square-small-bottom {
width: 160px;
height: 130px;
background: url('https://ik.imagekit.io/webdigitalalien/paper-texture_rme04pvze.jpg?ik-sdk-version=javascript-1.4.3&updatedAt=1643796293371');
background-size: 350px;
box-shadow: 0 -4px 10px 0 rgba(0,0,0,0.25);
display: inline-block;
position: absolute;
bottom: 1px;
right: 0;
z-index: 8;

-o-transform-origin: bottom;
-ms-transform-origin: bottom;
-moz-transform-origin: bottom;
-webkit-transform-origin: bottom;
transform-origin: bottom;

-moz-transform-style: preserve-3d;
-webkit-transform-style: preserve-3d;
transform-style: preserve-3d;

-o-transform: perspective(2000px);
-ms-transform: perspective(2000px);
-moz-transform: perspective(2000px);
-webkit-transform: perspective(2000px);
transform: perspective(2000px);

-o-transition: all .2s ease-in-out;
-moz-transition: all .2s ease-in-out;
-webkit-transition: all .2s ease-in-out;
transition: all .2s ease-in-out;
}
.wrapper:hover .square-small-bottom {
box-shadow: 5px -5px 10px 0 rgba(0,0,0,0.25);

-o-transform: perspective(2000px) rotateX(-175deg);
-ms-transform: perspective(2000px) rotateX(-175deg);
-moz-transform: perspective(2000px) rotateX(-175deg);
-webkit-transform: perspective(2000px) rotateX(-175deg);
transform: perspective(2000px) rotateX(-175deg);

-o-transition: all .5s .2s ease-in-out;
-moz-transition: all .5s .2s ease-in-out;
-webkit-transition: all .5s .2s ease-in-out;
transition: all .5s .2s ease-in-out;
}
.square-small-bottom::after {
content: '';
position:absolute;
top: 0;
right: 0;
bottom: 0;
left: 0;
background-color: #18A5C4;
mix-blend-mode: multiply;
border-bottom: 2px solid rgba(4,82,99,0);

-o-transition: all .2s .3s ease;
-moz-transition: all .2s .3s ease;
-webkit-transition: all .2s .3s ease;
transition: all .2s .3s ease;
}


.wrapper:hover .square-small-bottom::after {
border-bottom: 2px solid rgba(4,82,99,0.1);
}

.square-small-top {
width: 130px;
height: 160px;
background: url('https://ik.imagekit.io/webdigitalalien/paper-texture_rme04pvze.jpg?ik-sdk-version=javascript-1.4.3&updatedAt=1643796293371');
background-size: 350px;

box-shadow: 4px 4px 10px 0 rgba(0,0,0,0.25);

display: inline-block;
position: absolute;
left: 0;
bottom: 0;
z-index: 9;

-o-transform-origin: left;
-ms-transform-origin: left;
-moz-transform-origin: left;
-webkit-transform-origin: left;
transform-origin: left;

-moz-transform-style: preserve-3d;
-webkit-transform-style: preserve-3d;
transform-style: preserve-3d;

-o-transform: perspective(2000px);
-ms-transform: perspective(2000px);
-moz-transform: perspective(2000px);
-webkit-transform: perspective(2000px);
transform: perspective(2000px);

-o-transition: all .2s .1s ease-in-out;
-moz-transition: all .2s .1s ease-in-out;
-webkit-transition: all .2s .1s ease-in-out;
transition: all .2s .1s ease-in-out;
}


.wrapper:hover .square-small-top {

box-shadow: 4px 4px 10px 0 rgba(0,0,0,0);

-o-transform: perspective(2000px) rotateY(-160deg);
-ms-transform: perspective(2000px) rotateY(-160deg);
-moz-transform: perspective(2000px) rotateY(-160deg);
-webkit-transform: perspective(2000px) rotateY(-160deg);
transform: perspective(2000px) rotateY(-160deg);

-o-transition: all .5s .1s ease-in-out;
-moz-transition: all .5s .1s ease-in-out;
-webkit-transition: all .5s .1s ease-in-out;
transition: all .5s .1s ease-in-out;
}
.square-small-top::after {
content: '';
position:absolute;
top: 0;
right: 0;
bottom: 0;
left: 0;
background-color: #18ABCB;
mix-blend-mode: multiply;
border-left: 2px solid rgba(4,82,99,0);

-o-transition: all .2s .3s ease;
-moz-transition: all .2s .3s ease;
-webkit-transition: all .2s .3s ease;
transition: all .2s .3s ease;
}

.wrapper:hover .square-small-top::after {
background-color: #18A5C4;
border-left: 2px solid rgba(4,82,99,0.1);
}

.square-large {
width: 100%;
height: 130px;
background: url('https://ik.imagekit.io/webdigitalalien/paper-texture_rme04pvze.jpg?ik-sdk-version=javascript-1.4.3&updatedAt=1643796293371');
background-size: 350px;
box-shadow: 0 4px 10px 0 rgba(0,0,0,0.25);
position: absolute;
top: 0;
left: 0;
right: 0;
z-index: 10;

-o-transform-origin: top;
-ms-transform-origin: top;
-moz-transform-origin: top;
-webkit-transform-origin: top;
transform-origin: top;

-moz-transform-style: preserve-3d;
-webkit-transform-style: preserve-3d;
transform-style: preserve-3d;

-o-transform: perspective(2000px);
-ms-transform: perspective(2000px);
-moz-transform: perspective(2000px);
-webkit-transform: perspective(2000px);
transform: perspective(2000px);

-o-transition: all .2s .2s ease-in-out;
-moz-transition: all .2s .2s ease-in-out;
-webkit-transition: all .2s .2s ease-in-out;
transition: all .2s .2s ease-in-out;
}

.wrapper:hover .square-large {
background-color: #18A5C4;
box-shadow: 0 4px 10px 0 rgba(0,0,0,0);

-o-transform: perspective(2000px) rotateX(175deg);
-ms-transform: perspective(2000px) rotateX(175deg);
-moz-transform: perspective(2000px) rotateX(175deg);
-webkit-transform: perspective(2000px) rotateX(175deg);
transform: perspective(2000px) rotateX(175deg);

-o-transition: all .5s ease-in-out;
-moz-transition: all .5s ease-in-out;
-webkit-transition: all .5s ease-in-out;
transition: all .5s ease-in-out;
}


.square-large::after {
content: '';
position:absolute;
top: 0;
right: 0;
bottom: 0;
left: 0;
background-color: #17AECF;
mix-blend-mode: multiply;
border-top: 2px solid rgba(4,82,99,0);


-o-transition: all .2s .3s ease;
-moz-transition: all .2s .3s ease;
-webkit-transition: all .2s .3s ease;
transition: all .2s .3s ease;
}


.wrapper:hover .square-large::after {
background-color: #18A5C4;
border-top: 2px solid rgba(4,82,99,0.1);
}
`
