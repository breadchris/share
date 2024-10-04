package main

import "testing"

func TestScrape(t *testing.T) {
	c := NewCrawler()

	err := c.Crawl("https://breadchris.com")
	if err != nil {
		t.Error(err)
	}
}
