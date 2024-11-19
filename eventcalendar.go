package main

import (
	"bytes"
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/yuin/goldmark"
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
	m.HandleFunc("/{id}/event/modal", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		date := r.URL.Query().Get("date")
		render(w, r,
			renderModal(
				Form(
					HxPost(fmt.Sprintf("/%s/event/", id)),
					Attr("hx-target", "#calendar-container"),
					Attr("hx-swap", "outerHTML"),
					Class("space-y-4"),
					Input(Type("text"), Name("name"), Placeholder("Event Name"), Class("w-full p-2 border border-gray-300 rounded")),
					TextArea(Name("description"), Placeholder("Description"), Class("w-full p-2 border border-gray-300 rounded")),
					Input(Type("date"), Value(date), Name("date"), Class("w-full p-2 border border-gray-300 rounded")),
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
		)
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
					Attr("hx-target", "#calendar-container"),
					Attr("hx-swap", "outerHTML"),
					Class("space-y-4"),
					Input(Type("text"), Name("name"), Value(evt.Name), Placeholder("Event Name"), Class("w-full p-2 border border-gray-300 rounded")),
					TextArea(Name("description"), Value(evt.Description), Placeholder("Description"), Class("w-full p-2 border border-gray-300 rounded")),
					Input(Type("date"), Value(evt.Date.Format("2006-01-02")), Name("date"), Class("w-full p-2 border border-gray-300 rounded")),
					Div(
						Button(Type("submit"), T("Update Event"), Class("bg-blue-500 text-white px-4 py-2 rounded")),
						Button(
							T("Cancel"),
							Type("button"),
							Class("modal-close bg-gray-500 text-white px-4 py-2 rounded ml-2"),
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
			render(w, r, renderModal(
				Div(
					Img(
						Src(evt.ImageURL),
					),
					H2(Class("text-2xl font-bold mb-4"), T(evt.Name)),
					P(Class("mb-2"), T("Description: "+evt.Description)),
					P(Class("mb-2"), T("Date: "+evt.Date.Format("2006-01-02"))),
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
				CreateEventButton(c.ID, dateStr),
			),
		))
	})
	return m
}

func CreateEventButton(calID, date string) *Node {
	return Button(
		T("Create Event"),
		Type("button"),
		Class("border border-gray-300 rounded px-2 py-1"),
		HxGet(fmt.Sprintf("/%s/event/modal?date=%s", calID, date)),
		HxTarget("#event-modal"),
		HxSwap("innerHTML"),
	)
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
			CreateEventButton(c.ID, ""),
		),
	)
	return Div(
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
			Class("p-2 bg-white box-border h-full overflow-hidden"),
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
		Style(Raw(`
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
`)),
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
