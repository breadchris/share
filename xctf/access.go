package xctf

import (
	"encoding/csv"
	"fmt"
	"io"
	"math/rand"
	"strconv"
	"time"
)

// AccessLogEntry represents a single row in the access log.
type AccessLogEntry struct {
	Timestamp      string
	UserID         string
	IPAddress      string
	Method         string
	URL            string
	Status         string
	ResponseTimeMs string
	Referrer       string
	UserAgent      string
}

// FillerContent holds sample data for generating log entries.
type FillerContent struct {
	Users      []string
	Methods    []string
	URLs       []string
	Statuses   []string
	Referrers  []string
	UserAgents []string
}

// defaultFillerContent returns a FillerContent with pre-defined sample values.
func defaultFillerContent() FillerContent {
	return FillerContent{
		Users:     []string{"u1001", "u1002", "u1003", "u1004", "u1005"},
		Methods:   []string{"GET", "POST", "PUT"},
		URLs:      []string{"/catalog", "/books/9783161484100", "/account", "/admin", "/search?q=golang"},
		Statuses:  []string{"200", "404", "500", "302"},
		Referrers: []string{"", "https://www.google.com", "https://library.example.com", "https://news.example.com"},
		UserAgents: []string{
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/90.0.4430.93 Safari/537.36",
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
			"Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/88.0",
		},
	}
}

// generateAccessLogEntries creates a slice of AccessLogEntry using the provided filler content.
func generateAccessLogEntries(numRecords int, fillers FillerContent) []AccessLogEntry {
	entries := make([]AccessLogEntry, numRecords)
	baseTime := time.Now().Add(-24 * time.Hour)
	rand.Seed(time.Now().UnixNano())

	for i := 0; i < numRecords; i++ {
		entries[i] = AccessLogEntry{
			Timestamp:      baseTime.Add(time.Duration(rand.Intn(86400)) * time.Second).Format(time.RFC3339),
			UserID:         fillers.Users[rand.Intn(len(fillers.Users))],
			IPAddress:      fmt.Sprintf("%d.%d.%d.%d", rand.Intn(256), rand.Intn(256), rand.Intn(256), rand.Intn(256)),
			Method:         fillers.Methods[rand.Intn(len(fillers.Methods))],
			URL:            fillers.URLs[rand.Intn(len(fillers.URLs))],
			Status:         fillers.Statuses[rand.Intn(len(fillers.Statuses))],
			ResponseTimeMs: strconv.Itoa(rand.Intn(491) + 10), // random between 10ms and 500ms
			Referrer:       fillers.Referrers[rand.Intn(len(fillers.Referrers))],
			UserAgent:      fillers.UserAgents[rand.Intn(len(fillers.UserAgents))],
		}
	}
	return entries
}

func writeAccessLogCSV(w io.Writer, entries []AccessLogEntry) error {
	writer := csv.NewWriter(w)
	defer writer.Flush()

	header := []string{
		"Timestamp",
		"UserID",
		"IP Address",
		"Method",
		"URL",
		"Status",
		"Response Time (ms)",
		"Referrer",
		"User Agent",
	}
	if err := writer.Write(header); err != nil {
		return err
	}

	for _, entry := range entries {
		record := []string{
			entry.Timestamp,
			entry.UserID,
			entry.IPAddress,
			entry.Method,
			entry.URL,
			entry.Status,
			entry.ResponseTimeMs,
			entry.Referrer,
			entry.UserAgent,
		}
		if err := writer.Write(record); err != nil {
			return err
		}
	}
	return nil
}
