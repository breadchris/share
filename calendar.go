package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
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
}

type CalendarEvent struct {
	ID          int
	CalendarID  int
	Name        string
	Description string
	Link        string
	Attendees   []string // List of User IDs
	Date        time.Time
}

// In-memory Data Stores
var (
	calendars      = map[int]*Calendar{}
	events         = map[string]CalendarEvent{}
	userCalendars  = map[string][]int{}    // User ID to Calendar IDs
	eventAttendees = map[string][]string{} // Event ID to User IDs
	dataMutex      sync.Mutex
	eventsFilePath = "data/calendar/events.json"
)

// Generate unique IDs
var (
	userIDCounter     = 1
	calendarIDCounter = 1
	eventIDCounter    = 1
)

var (
	userSelectedCalendars = map[string]map[int]bool{} // User ID to selected Calendar IDs
)

// Handlers
func SetupCalendar() {
	http.HandleFunc("/calendar/", handleCalendar)
	http.HandleFunc("/calendar/month", createMonth)
	http.HandleFunc("/calendar/create_event_form", createEventForm)
	http.HandleFunc("/calendar/submit_event", submitEvent)
	http.HandleFunc("/calendar/delete_event/", deleteEvent)
	http.HandleFunc("/calendar/event/", viewEvent)
	http.HandleFunc("/calendar/create_calendar_form", createCalendarForm)
	http.HandleFunc("/calendar/submit_calendar", submitCalendar)
	http.HandleFunc("/calendar/load_user_calendars", loadUserCalendars)
	http.HandleFunc("/calendar/toggle_calendar", toggleCalendar)
}

func NewCalendar(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				ReloadNode("calendar.go"),
				RenderCalendar(getCalenderEvents()),
			),
		).RenderPage(w, r)
	})
	return m
}

func toggleCalendar(w http.ResponseWriter, r *http.Request) {
	user := getCurrentUser(r)
	calendarIDStr := r.FormValue("calendar_id")
	calendarID, _ := strconv.Atoi(calendarIDStr)

	dataMutex.Lock()
	defer dataMutex.Unlock()

	if userSelectedCalendars[user.ID] == nil {
		userSelectedCalendars[user.ID] = make(map[int]bool)
	}

	_, isSelected := userSelectedCalendars[user.ID][calendarID]
	if isSelected {
		delete(userSelectedCalendars[user.ID], calendarID)
	} else {
		userSelectedCalendars[user.ID][calendarID] = true
	}

	// Update the calendar display
	// Collect events for the current month and year
	month := int(time.Now().Month())
	year := time.Now().Year()

	// Gather events from selected calendars
	monthEvents := []CalendarEvent{}
	for calID := range userSelectedCalendars[user.ID] {
		for _, evt := range events {
			if evt.CalendarID == calID && evt.Date.Year() == year && int(evt.Date.Month()) == month {
				monthEvents = append(monthEvents, evt)
			}
		}
	}

	// Generate the updated calendar
	calendarNode := GenerateCalendar(month, year, monthEvents)

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, calendarNode.Render())
}

func loadUserCalendars(w http.ResponseWriter, r *http.Request) {
	user := getCurrentUser(r)

	dataMutex.Lock()
	calIDs := userCalendars[user.ID]
	dataMutex.Unlock()

	calendarItems := []*Node{}
	for _, calID := range calIDs {
		dataMutex.Lock()
		cal, exists := calendars[calID]
		dataMutex.Unlock()
		if exists {
			checkbox := Input(
				Type("checkbox"),
				Name("calendar_ids"),
				Value(cal.ID),
				Class("mr-2"),
				Checked(true),
				HxPost("/calendar/toggle_calendar"),
				HxTarget("#calendar-container"),
				HxSwap("innerHTML"),
				// HxVals(map[string]string{"calendar_id": cal.ID}),
			)
			label := Label(
				Class("flex items-center mb-2"),
				checkbox,
				Span(T(cal.Name)),
			)
			calendarItems = append(calendarItems, label)
		}
	}

	list := Div(
		Chl(calendarItems...),
	)

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, list.Render())
}

// Simulate current logged-in user
func getCurrentUser(r *http.Request) *User {
	// Placeholder for user authentication
	return &User{ID: "1", DisplayName: "Chris"}
}

func getCalenderEvents() []CalendarEvent {
	var calendarEvents []CalendarEvent

	eventsByDate := loadEvents()

	for dateStr, events := range eventsByDate {
		dateStr := strings.Split(dateStr, "-top")[0]
		// Parse the date string into time.Time
		eventDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			fmt.Printf("Invalid date format: %s\n", dateStr)
			continue
		}
		for _, evt := range events {
			calendarEvents = append(calendarEvents, CalendarEvent{
				Name:        evt.Title,
				Description: fmt.Sprintf("%s, %s", evt.Location, evt.Region),
				Date:        eventDate,
			})
		}
	}
	return calendarEvents
}

func RenderCalendar(events []CalendarEvent) *Node {
	month := int(time.Now().Month())
	year := time.Now().Year()

	// Create month and year dropdowns
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

	toggleSidePanelButton := Button(
		T("Calendars"),
		Type("button"),
		Class("border border-gray-300 rounded px-2 py-1 mr-2"),
		Attr("onclick", "toggleSidePanel()"),
	)

	// Create the form for month and year selection
	selectionForm := Form(
		Attr("hx-post", "/calendar/month"),
		Attr("hx-target", "#calendar-container"),
		Attr("hx-swap", "innerHTML"),
		Attr("enctype", "multipart/form-data"),
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
				HxGet("/calendar/create_event_form"),
				HxTarget("#event-modal"),
				HxSwap("innerHTML"),
			),
		),
	)

	sidePanel := Div(
		Id("side-panel"),
		Class("side-panel hidden"),
		Div(
			Class("side-panel-content"),
			H2(Class("text-xl font-bold mb-4"), T("Your Calendars")),
			Div(
				Id("calendar-list"),
				// Calendars will be loaded here
			),
			Button(
				T("Create New Calendar"),
				Type("button"),
				Class("bg-blue-500 text-white px-4 py-2 rounded mt-4"),
				HxGet("/calendar/create_calendar_form"),
				HxTarget("#calendar-list"),
				HxSwap("innerHTML"),
			),
		),
	)

	calendarModal := Div(Id("calendar-modal"))

	script := Script(T(`
		function toggleSidePanel() {
			var panel = document.getElementById('side-panel');
			panel.classList.toggle('hidden');
		}
	`))

	// Collect events for the current month and year
	dataMutex.Lock()
	monthEvents := []CalendarEvent{}
	for _, evt := range events {
		if evt.Date.Year() == year && int(evt.Date.Month()) == month {
			monthEvents = append(monthEvents, evt)
		}
	}
	dataMutex.Unlock()

	// Generate the calendar node
	calendarNode := GenerateCalendar(month, year, monthEvents)

	// Include a div for the event modal
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
				.side-panel {
					position: fixed;
					top: 0;
					left: 0;
					width: 250px;
					height: 100%;
					background-color: #f9f9f9;
					border-right: 1px solid #ccc;
					overflow-y: auto;
					z-index: 1000;
					transition: transform 0.3s ease;
				}
				.side-panel.hidden {
					transform: translateX(-100%);
				}
				.side-panel-content {
					padding: 20px;
				}
			`)),
		),
		Body(
			toggleSidePanelButton,
			selectionForm,
			eventModal,
			calendarModal,
			sidePanel,
			calendarNode,
			script,
		),
	)

	return page
}

// Serve the user dashboard
func handleCalendar(w http.ResponseWriter, r *http.Request) {

	user := getCurrentUser(r)
	dataMutex.Lock()
	userCalIDs := userCalendars[user.ID]
	userCals := []*Calendar{}
	for _, calID := range userCalIDs {
		if cal, exists := calendars[calID]; exists {
			userCals = append(userCals, cal)
		}
	}
	dataMutex.Unlock()

	var calendarEvents []CalendarEvent
	for dateStr, events := range loadEvents() {
		// Parse the date string into time.Time
		eventDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			fmt.Printf("Invalid date format: %s\n", dateStr)
			continue
		}
		for _, evt := range events {
			calendarEvents = append(calendarEvents, CalendarEvent{
				Name:        evt.Title,
				Description: fmt.Sprintf("%s, %s", evt.Location, evt.Region),
				Date:        eventDate,
			})
		}
	}

	page := RenderCalendar(calendarEvents)

	page.RenderPage(w, r)
}

func createEventForm(w http.ResponseWriter, r *http.Request) {
	form := Div(
		Class("modal"),
		Div(
			Class("modal-content"),
			Form(
				Method("POST"),
				Action("/calendar/submit_event"),
				Attr("hx-post", "/calendar/submit_event"),
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
	)

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, form.Render())
}

func submitEvent(w http.ResponseWriter, r *http.Request) {
	fmt.Println("submitEvent")
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Parse form data
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

	// Create new event
	dataMutex.Lock()
	eventID := eventIDCounter
	eventIDCounter++
	newEvent := CalendarEvent{
		ID:          eventID,
		Name:        name,
		Description: description,
		Date:        date,
	}
	events[strconv.Itoa(eventID)] = newEvent
	// SaveEvents()
	dataMutex.Unlock()

	// Collect events for the month and year
	month := int(date.Month())
	year := date.Year()

	dataMutex.Lock()
	monthEvents := getCalenderEvents()
	for _, evt := range events {
		if evt.Date.Year() == year && int(evt.Date.Month()) == month {
			monthEvents = append(monthEvents, evt)
		}
	}
	dataMutex.Unlock()

	// Generate the updated calendar
	calendarNode := GenerateCalendar(month, year, monthEvents)

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, calendarNode.Render())
}

func createMonth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Parse form data
	err := r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}
	monthStr := r.FormValue("month")
	yearStr := r.FormValue("year")
	month, _ := strconv.Atoi(monthStr)
	year, _ := strconv.Atoi(yearStr)

	// Collect events for the selected month and year
	// dataMutex.Lock()
	// monthEvents := []*CalendarEvent{}
	// for _, evt := range events {
	// 	if evt.Date.Year() == year && int(evt.Date.Month()) == month {
	// 		monthEvents = append(monthEvents, evt)
	// 	}
	// }
	// dataMutex.Unlock()
	monthEvents := getCalenderEvents()

	// Generate the calendar node
	calendarNode := GenerateCalendar(month, year, monthEvents)

	// Render the calendar
	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, calendarNode.Render())
}

// GenerateCalendar creates an HTML calendar with events
func GenerateCalendar(month, year int, events []CalendarEvent) *Node {
	// Create a time.Time object for the first day of the month
	firstOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)

	// Get the weekday of the first day of the month (0 = Sunday, 6 = Saturday)
	firstWeekday := int(firstOfMonth.Weekday())

	// Get the number of days in the month
	daysInMonth := time.Date(year, time.Month(month)+1, 0, 0, 0, 0, 0, time.UTC).Day()

	// Weekday names
	weekdays := []string{"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"}

	// Create the header cells for the weekdays
	headerCells := []*Node{}
	for _, day := range weekdays {
		headerCells = append(headerCells, Div(
			Class("p-2 bg-gray-200 font-bold text-center"),
			T(day),
		))
	}

	// Create the header grid
	headerGrid := Div(
		Class("grid grid-cols-7 gap-1 bg-gray-300"),
		Chl(headerCells...),
	)

	// Map events by date for quick lookup
	eventsByDate := make(map[string][]CalendarEvent)
	for _, event := range events {
		dateStr := event.Date.Format("2006-01-02")
		eventsByDate[dateStr] = append(eventsByDate[dateStr], event)
	}

	// Create the day cells
	cells := []*Node{}

	// Empty cells before the first day of the month
	for i := 0; i < firstWeekday; i++ {
		cells = append(cells, Div(Class("p-2 bg-white h-full")))
	}

	// Add the day cells for each day in the month
	for day := 1; day <= daysInMonth; day++ {
		date := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
		dateStr := date.Format("2006-01-02")
		dayEvents := eventsByDate[dateStr]
		eventNodes := []*Node{}
		for _, evt := range dayEvents {
			eventNodes = append(eventNodes, Div(
				Class("bg-blue-100 p-1 mt-1 rounded"),
				A(
					Href("#"),
					T(evt.Name),
					HxGet(fmt.Sprintf("/calendar/event/%d", evt.ID)),
					HxTarget("#event-modal"),
					HxSwap("innerHTML"),
					Class("text-blue-700 hover:underline"),
				),
			))
		}
		cells = append(cells, Div(
			Class("p-2 bg-white box-border h-full overflow-hidden"),
			Div(Class("text-right text-sm font-bold text-gray-800"), T(strconv.Itoa(day))),
			Chl(eventNodes...),
		))
	}

	// Fill the remaining cells to complete the grid
	totalCells := firstWeekday + daysInMonth
	if totalCells%7 != 0 {
		for i := 0; i < 7-(totalCells%7); i++ {
			cells = append(cells, Div(Class("p-2 bg-white h-full")))
		}
	}

	// Create the calendar grid container with Tailwind classes
	calendarGrid := Div(
		Id("calendar"),
		Class("grid grid-cols-7 gap-1 bg-gray-300 h-[calc(100vh-160px)] auto-rows-fr"),
		Chl(cells...),
	)

	// Wrap everything in a container div
	calendar := Div(
		Id("calendar-container"),
		Chl(
			headerGrid,
			calendarGrid,
		),
	)

	return calendar
}

func viewEvent(w http.ResponseWriter, r *http.Request) {
	// Extract event ID from URL
	idStr := strings.TrimPrefix(r.URL.Path, "/calendar/event/")
	eventID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	dataMutex.Lock()
	evt, exists := events[strconv.Itoa(eventID)]
	dataMutex.Unlock()
	if !exists {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Create modal content
	modalContent := Div(
		Class("modal"),
		Div(
			Class("modal-content"),
			H2(Class("text-2xl font-bold mb-4"), T(evt.Name)),
			P(Class("mb-2"), T("Description: "+evt.Description)),
			P(Class("mb-2"), T("Date: "+evt.Date.Format("2006-01-02"))),
			Div(
				Class("flex justify-end mt-4"),
				Button(
					T("Delete"),
					Type("button"),
					Class("bg-red-500 text-white px-4 py-2 rounded mr-2"),
					HxPost(fmt.Sprintf("/calendar/delete_event/%d", evt.ID)),
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
	)

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, modalContent.Render())
}

func deleteEvent(w http.ResponseWriter, r *http.Request) {
	// Extract event ID from URL
	idStr := strings.TrimPrefix(r.URL.Path, "/calendar/delete_event/")
	eventID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	dataMutex.Lock()
	evt, exists := events[strconv.Itoa(eventID)]
	if !exists {
		dataMutex.Unlock()
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Remove the event from the events map
	delete(events, strconv.Itoa(eventID))
	dataMutex.Unlock()

	// Collect events for the month and year
	month := int(evt.Date.Month())
	year := evt.Date.Year()

	dataMutex.Lock()
	monthEvents := []CalendarEvent{}
	for _, e := range events {
		if e.Date.Year() == year && int(e.Date.Month()) == month {
			monthEvents = append(monthEvents, e)
		}
	}
	dataMutex.Unlock()

	// Generate the updated calendar
	calendarNode := GenerateCalendar(month, year, monthEvents)

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, calendarNode.Render())
}

func createCalendarForm(w http.ResponseWriter, r *http.Request) {
	fmt.Println("createCalendarForm")
	form := Div(
		Class("modal"),
		Div(
			Class("modal-content"),
			Form(
				Method("POST"),
				Action("/calendar/submit_calendar"),
				Attr("hx-post", "/calendar/submit_calendar"),
				Attr("hx-target", "#calendar-list"),
				Attr("hx-swap", "innerHTML"),
				Class("space-y-4"),
				Input(Type("text"), Name("name"), Placeholder("Calendar Name"), Class("w-full p-2 border border-gray-300 rounded")),
				TextArea(Name("description"), Placeholder("Description"), Class("w-full p-2 border border-gray-300 rounded")),
				Div(
					Button(Type("submit"), T("Create Calendar"), Class("bg-blue-500 text-white px-4 py-2 rounded")),
					Button(
						T("Cancel"),
						Type("button"),
						Class("modal-close bg-gray-500 text-white px-4 py-2 rounded ml-2"),
						Attr("onclick", "document.getElementById('calendar-modal').innerHTML = '';"),
					),
				),
			),
		),
	)

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, form.Render())
}

func submitCalendar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Parse form data
	err := r.ParseForm()
	if err != nil {
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	user := getCurrentUser(r)
	name := r.FormValue("name")
	description := r.FormValue("description")

	// Create new calendar
	dataMutex.Lock()
	calendarID := calendarIDCounter
	calendarIDCounter++
	newCalendar := &Calendar{
		ID:          string(calendarID),
		Name:        name,
		Description: description,
		OwnerID:     user.ID,
		IsPublic:    false,
	}
	calendars[calendarID] = newCalendar
	userCalendars[user.ID] = append(userCalendars[user.ID], calendarID)
	dataMutex.Unlock()

	// Return success and close the modal
	// responseHTML := `<div id="calendar-modal"></div>`

	checkBoxes := Div()
	for _, calID := range userCalendars[user.ID] {
		cal := calendars[calID]
		checkBox := Input(
			Type("checkbox"),
			Name("calendar_ids"),
			Value(cal.ID),
			Class("mr-2"),
			Checked(true),
			HxPost("/calendar/toggle_calendar"),
			HxTarget("#calendar-container"),
			HxSwap("innerHTML"),
		)
		label := Label(
			Class("flex items-center mb-2"),
			checkBox,
			Span(T(cal.Name)),
		)
		checkBoxes.Children = append(checkBoxes.Children, label)
	}

	// Input(
	// 	Type("checkbox"),
	// 	Name("calendar_ids"),
	// 	Value(string(calendarID)),
	// 	Class("mr-2"),
	// 	Checked(true),
	// 	HxPost("/calendar/toggle_calendar"),
	// 	HxTarget("#calendar-container"),
	// 	HxSwap("innerHTML"),
	// )

	responseHTML := checkBoxes.Render() + `<div id="calendar-modal"></div>`

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, responseHTML)
}

func SaveEvents() error {
	dataMutex.Lock()
	defer dataMutex.Unlock()

	// Marshal the events map to JSON
	data, err := json.MarshalIndent(events, "", "  ")
	if err != nil {
		return err
	}

	// Ensure the directory exists
	err = os.MkdirAll(filepath.Dir(eventsFilePath), os.ModePerm)
	if err != nil {
		return err
	}

	// Write the JSON data to the file
	err = os.WriteFile(eventsFilePath, data, 0644)
	if err != nil {
		return err
	}

	return nil
}
