package eventposter

import (
	"fmt"
	"strings"
	"testing"
)

func TestSearch1001Tracklists(t *testing.T) {
	// Test with a simple query
	results, err := Search1001Tracklists("levity shambhala 2025")
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}
	
	fmt.Printf("Debug: Found %d results\n\n", len(results))
	
	// Print first 3 results for debugging
	for i := 0; i < 3 && i < len(results); i++ {
		result := results[i]
		fmt.Printf("Result %d:\n", i+1)
		fmt.Printf("  Title: %s\n", result.Title)
		fmt.Printf("  Artist: %s\n", result.Artist)
		fmt.Printf("  Event: %s\n", result.Event)
		fmt.Printf("  Date: %s\n", result.Date)
		fmt.Printf("  URL: %s\n", result.URL)
		fmt.Printf("  Views: %d\n", result.ViewCount)
		fmt.Printf("  Tracks: %d/%d IDed\n", result.TracksIDed, result.TotalTracks)
		fmt.Printf("  Duration: %s\n", result.Duration)
		fmt.Printf("  Music Styles: %v\n", result.MusicStyles)
		fmt.Printf("  Has Video: %v\n", result.HasVideo)
		fmt.Printf("  Has SoundCloud: %v\n", result.HasSoundCloud)
		fmt.Println()
	}
	
	// Verify we got some results
	if len(results) == 0 {
		t.Error("Expected to find some results, but got none")
	}
	
	// Test specific expectations
	if len(results) > 0 {
		first := results[0]
		if first.Artist == "" {
			t.Error("Expected first result to have an artist")
		}
		if first.URL == "" {
			t.Error("Expected first result to have a URL")
		}
		if !strings.HasPrefix(first.URL, "https://www.1001tracklists.com") {
			t.Errorf("Expected URL to start with https://www.1001tracklists.com, got %s", first.URL)
		}
	}
}

func TestSearchTracklistsForArtists(t *testing.T) {
	// Test with multiple artists
	artists := []string{"Deadmau5", "Skrillex", "Calvin Harris"}
	results, err := SearchTracklistsForArtists(artists)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}
	
	fmt.Printf("Debug: Found results for %d artists\n\n", len(results))
	
	for artist, artistResults := range results {
		fmt.Printf("Artist: %s (%d sets)\n", artist, len(artistResults))
		for i, result := range artistResults {
			if i >= 2 { // Only show first 2 results per artist
				break
			}
			fmt.Printf("  %d. %s (%d views)\n", i+1, result.Title, result.ViewCount)
		}
		fmt.Println()
	}
	
	// We expect at least some results for popular artists
	if len(results) == 0 {
		t.Log("Warning: No tracklist results found for any artist (this might be due to rate limiting or site changes)")
	}
}