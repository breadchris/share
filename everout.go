package main

import (
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

	"github.com/breadchris/share/deps"

	"github.com/PuerkitoBio/goquery"
	. "github.com/breadchris/share/html"
)

// EverOutEvent represents the structure of an event
type EverOutEvent struct {
	Title    string
	Category string
	Date     string
	Time     string
	Location string
	Region   string
	Price    string
	ImageURL string
	EventURL string
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

func NewEverout(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()
	events := loadEvents()
	fmt.Println(events)
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		DefaultLayout(
			Div(
				ReloadNode("everout.go"),
				RenderEverout(events),
			),
		).RenderPage(w, r)
	})
	return m
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

func RenderEverout(eventsByDate map[string][]EverOutEvent) *Node {
	var dateNodes []*Node

	// Collect and sort the dates
	dates := make([]string, 0, len(eventsByDate))
	for date := range eventsByDate {
		dates = append(dates, date)
	}
	sort.Strings(dates)

	// For each date, render the events
	for _, date := range dates {
		events := eventsByDate[date]
		// Create a header for the date
		dateHeader := H2(Class("text-2xl font-bold my-4"), Text(date))
		// Render the events for this date
		eventNodes := Map[EverOutEvent, *Node](events, func(event EverOutEvent, i int) *Node {
			return Div(
				Class("bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"),
				Div(
					Class("h-48 bg-cover bg-center"),
					Style_(fmt.Sprintf("background-image: url('%s');", event.ImageURL)),
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
			)
		})
		// Wrap the events in a grid
		eventsGrid := Div(
			Class("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4"),
			Ch(eventNodes),
		)
		// Add the date header and events grid to the dateNodes
		dateNodes = append(dateNodes, dateHeader, eventsGrid)
	}

	// Combine all date nodes into a single Div
	return Div(
		Ch(dateNodes),
	)
}

// ScrapeEverOut scrapes events from the specified page range and updates the JSON file
func ScrapeEverOut(startPage, endPage int) {
	var allEvents []EverOutEvent

	// Loop through the specified page range
	for page := startPage; page <= endPage; page++ {
		sleepDuration := time.Duration(rand.Intn(3)+1) * time.Second
		time.Sleep(sleepDuration)

		var url string
		if page == 1 {
			url = "https://everout.com/seattle/events/"
		} else {
			url = fmt.Sprintf("https://everout.com/seattle/events/?page=%d", page)
		}
		fmt.Printf("Scraping page %d: %s\n", page, url)
		events, err := ScrapeEvents(url)
		if err != nil {
			fmt.Println("Error scraping page", page, ":", err)
			continue
		}
		if len(events) == 0 {
			fmt.Println("No more events found on page", page)
			break
		}
		allEvents = append(allEvents, events...)
	}

	// Update the JSON file with the new events
	updateEvents(allEvents)
}

// ScrapeEverOutByDate scrapes events day by day until there are no more new events
func ScrapeEverOutByDate(startDate time.Time) []EverOutEvent {
	events, err := ScrapeEventsByDate(startDate)
	if err != nil {
		fmt.Println("Error scraping date", startDate.Format("2006-01-02"), ":", err)
	}

	return events
}

// ScrapeTopEventsByDate scrapes top events (staff picks) day by day until there are no more new events
func ScrapeTopEventsByDate(startDate time.Time) {
	date := startDate

	events, err := ScrapeTopEventsForDate(date)
	if err != nil {
		fmt.Println("Error scraping top events for date", date.Format("2006-01-02"), ":", err)
	}
	// Update the JSON file with the new top events
	updateEvents(events)
}

// ScrapeEventsByDate scrapes all events for a specific date
func ScrapeEventsByDate(date time.Time) ([]EverOutEvent, error) {
	var allEvents []EverOutEvent
	page := 1
	totalPages := 1 // We'll update this after scraping the first page

	for page <= totalPages {
		sleepDuration := time.Duration(rand.Intn(3)+1) * time.Second
		time.Sleep(sleepDuration)

		url := fmt.Sprintf("https://everout.com/seattle/events/?page=%d&start-date=%s", page, date.Format("2006-01-02"))
		fmt.Printf("Scraping date %s, page %d of %d: %s\n", date.Format("2006-01-02"), page, totalPages, url)
		events, totalPagesFromPage, err := ScrapeEventsWithPagination(url)
		if err != nil {
			return allEvents, err
		}
		if len(events) == 0 {
			fmt.Println("No events found on page", page)
			break
		}
		allEvents = append(allEvents, events...)
		fmt.Println("Events", events[0].Title)
		// Update totalPages after scraping the first page
		if page == 1 && totalPagesFromPage > 0 {
			totalPages = totalPagesFromPage
		}
		page++
	}

	return allEvents, nil
}

// ScrapeEventsWithPagination scrapes events and extracts pagination info from the given URL
func ScrapeEventsWithPagination(url string) ([]EverOutEvent, int, error) {
	var events []EverOutEvent
	totalPages := 1
	fmt.Println("Scraping events with pagination", url)
	// Create a new HTTP request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return events, totalPages, err
	}

	// Set headers to mimic a real browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; EventScraper/1.0)")
	req.Header.Set("Accept", "text/html")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	// Create an HTTP client and make the request
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

	// Parse the HTML
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		fmt.Println("Error parsing HTML", err)
		return events, totalPages, err
	}
	fmt.Println("HTML parsed successfully")
	// Find the event items (same as before)
	events = ParseDoc(doc)

	fmt.Println("Events found", len(events))
	// Extract total pages from pagination element
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

	// Expected format: "Page X of Y"
	parts := strings.Fields(paginationText)
	if len(parts) < 4 {
		return 1 // Default to 1 if format is unexpected
	}

	totalPagesStr := parts[len(parts)-1] // Last part should be the total pages number
	totalPagesStr = strings.TrimSpace(totalPagesStr)
	totalPages, err := strconv.Atoi(totalPagesStr)
	if err != nil {
		fmt.Println("Error parsing total pages:", err)
		return 1 // Default to 1 if conversion fails
	}

	return totalPages
}

// ScrapeTopEventsForDate scrapes top events (staff picks) for a specific date
func ScrapeTopEventsForDate(date time.Time) ([]EverOutEvent, error) {
	var allEvents []EverOutEvent
	page := 1

	for {
		sleepDuration := time.Duration(rand.Intn(3)+1) * time.Second
		time.Sleep(sleepDuration)

		url := fmt.Sprintf("https://everout.com/seattle/events/?page=%d&start-date=%s&staff-pick=true", page, date.Format("2006-01-02"))
		fmt.Printf("Scraping top events for date %s, page %d: %s\n", date.Format("2006-01-02"), page, url)
		events, err := ScrapeEvents(url)

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

func ParseDoc(doc *goquery.Document) []EverOutEvent {
	events := []EverOutEvent{}
	doc.Find("div.event.list-item").Each(func(i int, s *goquery.Selection) {
		var event EverOutEvent

		// Extract the event title
		title := s.Find("h2.event-title a span.title-link").Text()
		title = strings.Replace(title, "\u0026", "and", -1)
		event.Title = title

		// Extract the event category
		category := s.Find("a.fw-bold.text-uppercase.fs-8.text-gray-3").Text()
		category = strings.Replace(category, "\u0026", "and", -1)
		event.Category = category

		// Extract the event date
		date := stripChars(s.Find("div.event-date").Text(), "\n")
		date = stripChars(date, " ")
		event.Date = date

		// Extract the event time
		timeStr := stripChars(s.Find("div.event-time").Text(), "\n")
		timeStr = stripChars(timeStr, " ")
		event.Time = timeStr

		// Extract the event location
		event.Location = s.Find("div.location-name a").Text()

		// Extract the location region
		region := stripChars(s.Find("div.location-region").Text(), "\n")
		region = stripChars(region, " ")
		event.Region = region

		// Extract the price
		event.Price = s.Find("ul.event-tags li").First().Text()

		// Extract the image URL
		imgSrc, exists := s.Find("div.col-md-3 a img.img-responsive").Attr("src")
		if exists {
			event.ImageURL = imgSrc
		}

		// Extract the event URL
		eventURL, exists := s.Find("h2.event-title a").Attr("href")
		if exists {
			event.EventURL = eventURL
		}

		events = append(events, event)
	})
	return events
}

// ScrapeEvents scrapes events from the given URL
func ScrapeEvents(url string) ([]EverOutEvent, error) {
	var events []EverOutEvent

	// Create a new HTTP request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return events, err
	}

	// Set headers to mimic a real browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "+
		"AppleWebKit/537.36 (KHTML, like Gecko) "+
		"Chrome/93.0.4577.82 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,"+
		"image/avif,image/webp,image/apng,*/*;q=0.8,"+
		"application/signed-exchange;v=b3;q=0.9")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Connection", "keep-alive")

	// Create an HTTP client and make the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return events, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return events, fmt.Errorf("status code error: %d %s", resp.StatusCode, resp.Status)
	}

	// Parse the HTML
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return events, err
	}

	// Find the event items
	newEvents := ParseDoc(doc)
	events = append(events, newEvents...)

	return events, nil
}

// stripChars removes specified characters from a string
func stripChars(str, chr string) string {
	return strings.Map(func(r rune) rune {
		if strings.IndexRune(chr, r) < 0 {
			return r
		}
		return -1
	}, str)
}

// eventExists checks if an event already exists in the list
func eventExists(event EverOutEvent, events []EverOutEvent) bool {
	for _, e := range events {
		if e.EventURL == event.EventURL {
			return true
		}
	}
	return false
}

// updateEvents updates the everout.json file with new events
func updateEvents(newEvents []EverOutEvent) {
	// Read existing events from everout.json
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

	// Check for new events and update the existing events
	for _, event := range newEvents {
		if !eventExists(event, existingEvents) {
			existingEvents = append(existingEvents, event)
			fmt.Printf("New event found: %+v\n", event)
		}
	}

	// Write the updated events back to everout.json
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

// A simple UI to trigger the scraper manually for testing
// It tests each of the scraping functions
// The results are updated in the everout.json file and displayed on the page
// It is styled using Tailwind CSS
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

// scheduleScraping runs the scraper every Sunday and Thursday at random time at the hour of 4am Pacific Time
func scheduleScraping() {
	http.HandleFunc("/scrape-everout/", everoutScraperUI)
	loc, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		fmt.Println("Error loading location:", err)
		return
	}
	eventDataDir := "data/everout/"
	if _, err := os.Stat(eventDataDir); os.IsNotExist(err) {
		os.Mkdir(eventDataDir, 0755)
	}
	// scrape the next two months
	today := time.Now().In(loc)

	for i := 0; i < 4; i++ {
		date := today.AddDate(0, 0, i)
		fmt.Println("Scraping date", date.Format("2006-01-02"))
		events, err := ScrapeEventsByDate(date)

		eventsStr, err := json.MarshalIndent(events, "", "    ")
		if err != nil {
			fmt.Println("Error:", err)
			return
		}

		if err != nil {
			fmt.Println("Error scraping date", date.Format("2006-01-02"), ":", err)
		}
		// Update the JSON file with the new events
		// save the events to a file
		os.WriteFile(eventDataDir+date.Format("2006-01-02")+".json", eventsStr, 0644)
	}

	// for {
	// 	thusStartMin := rand.Intn(60)
	// 	sunStartMin := rand.Intn(60)

	// 	nextThursday := nextOccurrence(time.Thursday, 4, thusStartMin, 0, loc)
	// 	nextSunday := nextOccurrence(time.Sunday, 4, sunStartMin, 0, loc)

	// 	var next time.Time
	// 	if nextThursday.Before(nextSunday) {
	// 		next = nextThursday
	// 	} else {
	// 		next = nextSunday
	// 	}

	// 	now := time.Now().In(loc)
	// 	duration := next.Sub(now)
	// 	fmt.Printf("Sleeping for %v until %v\n", duration, next)

	// 	time.Sleep(duration)

	// 	// Run the scraper
	// 	fmt.Println("Running scraper at", time.Now().In(loc))
	// 	ScrapeEverOut(1, 420)
	// }
}

// nextOccurrence calculates the next occurrence of the specified weekday at the given time
func nextOccurrence(weekday time.Weekday, hour, min, sec int, loc *time.Location) time.Time {
	now := time.Now().In(loc)
	// Start from today's date at the specified time
	next := time.Date(now.Year(), now.Month(), now.Day(), hour, min, sec, 0, loc)
	daysUntil := (int(weekday) - int(now.Weekday()) + 7) % 7
	if daysUntil == 0 && now.After(next) {
		// If it's today but the time has already passed, schedule for next week
		daysUntil = 7
	}
	next = next.AddDate(0, 0, daysUntil)
	return next
}
