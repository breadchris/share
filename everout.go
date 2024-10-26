package main

import (
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/deps"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

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

func loadEvents() []EverOutEvent {
	data, err := os.ReadFile("everout.json")
	if err != nil {
		fmt.Println("Error reading events:", err)
		return []EverOutEvent{}
	}

	var events []EverOutEvent
	err = json.Unmarshal(data, &events)
	if err != nil {
		fmt.Println("Error unmarshalling events:", err)
		return []EverOutEvent{}
	}

	return events
}

func RenderEverout(events []EverOutEvent) *Node {
	return Div(
		Class("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4"),
		Ch(Map[EverOutEvent, *Node](events, func(event EverOutEvent, i int) *Node {
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
		})),
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
		allEvents = append(allEvents, events...)
	}

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
	newEvents := []EverOutEvent{}
	for _, event := range allEvents {
		if !eventExists(event, existingEvents) {
			newEvents = append(newEvents, event)
			existingEvents = append(existingEvents, event)
		}
	}

	// Write the updated events back to everout.json
	data, err = json.MarshalIndent(existingEvents, "", "    ")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	os.WriteFile("everout.json", data, 0644)

	// Print new events
	for _, event := range newEvents {
		fmt.Printf("New event found: %+v\n", event)
	}
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

// scheduleScraping runs the scraper every Sunday and Thursday at random time at the hour of 4am Pacific Time
func scheduleScraping() {
	loc, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		fmt.Println("Error loading location:", err)
		return
	}
	for {
		thusStartMin := rand.Intn(60)
		sunStartMin := rand.Intn(60)

		nextThursday := nextOccurrence(time.Thursday, 4, thusStartMin, 0, loc)
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

		// Run the scraper
		fmt.Println("Running scraper at", time.Now().In(loc))
		ScrapeEverOut(1, 420)
	}
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
