package coderunner

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestLoadModule(t *testing.T) {
	// Test that LoadModule generates valid script content
	node := LoadModule("test/TestComponent.tsx", "TestComponent")
	
	rendered := node.Render()
	
	// Check that it contains the expected module import path
	if !strings.Contains(rendered, "/coderunner/module/test/TestComponent.tsx") {
		t.Errorf("LoadModule should contain correct import path")
	}
	
	// Check that it references the component name
	if !strings.Contains(rendered, "TestComponent") {
		t.Errorf("LoadModule should reference the component name")
	}
	
	// Check that it's a script tag with module type
	if !strings.Contains(rendered, `<script type="module">`) {
		t.Errorf("LoadModule should generate a script tag with module type")
	}
}

func TestServeReactApp(t *testing.T) {
	// Create a test HTTP response recorder
	w := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/", nil)
	
	// Call ServeReactApp
	ServeReactApp(w, r, "test/TestApp.tsx", "TestApp")
	
	// Check response
	if w.Code != 200 {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
	
	body := w.Body.String()
	
	// Check that it contains essential React app elements
	if !strings.Contains(body, `<div id="root">`) {
		t.Errorf("ServeReactApp should include root div")
	}
	
	if !strings.Contains(body, "https://esm.sh/react@18") {
		t.Errorf("ServeReactApp should include React import map")
	}
	
	if !strings.Contains(body, "https://cdn.tailwindcss.com") {
		t.Errorf("ServeReactApp should include Tailwind CSS")
	}
	
	if !strings.Contains(body, "/coderunner/module/test/TestApp.tsx") {
		t.Errorf("ServeReactApp should include component module import")
	}
}

func TestServeReactAppWithProps(t *testing.T) {
	// Create a test HTTP response recorder  
	w := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/", nil)
	
	// Call ServeReactAppWithProps with additional elements
	ServeReactAppWithProps(w, r, "test/TestApp.tsx", "TestApp")
	
	// Check response
	if w.Code != 200 {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
	
	body := w.Body.String()
	
	// Should still have all the basic React app elements
	if !strings.Contains(body, `<div id="root">`) {
		t.Errorf("ServeReactAppWithProps should include root div")
	}
}