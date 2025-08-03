package eventposter

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/ai"
	"github.com/breadchris/share/coderunner"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	"github.com/evanw/esbuild/pkg/api"
	"github.com/zmb3/spotify/v2"
	"github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2/clientcredentials"
)

// Enhanced struct for structured AI analysis using JSON schema
type EventPosterAnalysis struct {
	EventName   string       `json:"event_name" description:"Name of the event or festival"`
	EventDate   *string      `json:"event_date" description:"Date of the event (if visible)"`
	Venue       *string      `json:"venue" description:"Venue or location name (if visible)"`
	Artists     []ArtistInfo `json:"artists" description:"List of artists with roles and confidence"`
	Genre       *string      `json:"genre" description:"Music genre or style (if identifiable)"`
	TicketInfo  *string      `json:"ticket_info" description:"Ticket price or purchase information (if visible)"`
	SocialMedia []string     `json:"social_media" description:"Social media handles or websites mentioned"`
	RawText     string       `json:"raw_text" description:"All text visible in the poster"`
}

// Enhanced artist info with role classification
type ArtistInfo struct {
	Name       string  `json:"name" description:"Artist or band name"`
	Confidence float64 `json:"confidence" description:"Confidence score from 0.0 to 1.0"`
	Role       string  `json:"role" description:"Role: 'headliner', 'support', 'dj', 'host', or 'unknown'"`
}

type EventData struct {
	EventName string                `json:"event_name" description:"Name of the event"`
	EventDate *string               `json:"event_date" description:"Event date if found"`
	Venue     *string               `json:"venue" description:"Venue name if found"`
	Artists   []models.Artist       `json:"artists" description:"Extracted artists"`
	Tracks    []models.SpotifyTrack `json:"tracks" description:"Spotify tracks found"`
	PosterURL string                `json:"poster_url" description:"URL to poster image"`
}

// Request/Response types for API generation

type AnalyzePosterRequest struct {
	ImageData string `json:"image_data" description:"Base64 encoded image data"`
	MimeType  string `json:"mime_type" description:"Image MIME type (image/jpeg, image/png)"`
}

type AnalyzePosterResponse struct {
	EventName string          `json:"event_name" description:"Extracted event name"`
	EventDate *string         `json:"event_date" description:"Extracted event date"`
	Venue     *string         `json:"venue" description:"Extracted venue name"`
	Artists   []models.Artist `json:"artists" description:"List of extracted artists"`
	RawText   string          `json:"raw_text" description:"All text extracted from poster"`
	Success   bool            `json:"success" description:"Whether analysis succeeded"`
	Error     string          `json:"error" description:"Error message if analysis failed"`
}

type SearchSpotifyTracksRequest struct {
	Artists []string `json:"artists" description:"List of artist names to search"`
	Limit   int      `json:"limit" description:"Number of tracks per artist (default: 5)"`
}

type SearchSpotifyTracksResponse struct {
	Tracks  []models.SpotifyTrack `json:"tracks" description:"Found Spotify tracks"`
	Success bool                  `json:"success" description:"Whether search succeeded"`
	Error   string                `json:"error" description:"Error message if search failed"`
}

type SaveEventDataRequest struct {
	EventData     EventData `json:"event_data" description:"Event data to save"`
	SpreadsheetID string    `json:"spreadsheet_id" description:"Google Sheets spreadsheet ID"`
}

type SaveEventDataResponse struct {
	Success bool   `json:"success" description:"Whether save succeeded"`
	RowID   string `json:"row_id,omitempty" description:"Google Sheets row ID"`
	Error   string `json:"error,omitempty" description:"Error message if save failed"`
}

type ListEventPostersRequest struct {
	Search  string `json:"search,omitempty" description:"Search term for event name or artist"`
	Offset  int    `json:"offset" description:"Pagination offset"`
	Limit   int    `json:"limit" description:"Number of results to return (max 50)"`
	UserID  string `json:"user_id,omitempty" description:"Filter by user ID"`
}

type ListEventPostersResponse struct {
	EventPosters []EventPosterListItem `json:"event_posters" description:"List of event posters"`
	Total        int                   `json:"total" description:"Total number of results"`
	HasMore      bool                  `json:"has_more" description:"Whether there are more results"`
	NextOffset   int                   `json:"next_offset" description:"Next pagination offset"`
	Success      bool                  `json:"success" description:"Whether request succeeded"`
	Error        string                `json:"error,omitempty" description:"Error message if request failed"`
}

type EventPosterListItem struct {
	ID          string               `json:"id" description:"Event poster ID"`
	EventName   string               `json:"event_name" description:"Name of the event"`
	EventDate   *string              `json:"event_date,omitempty" description:"Date of the event"`
	Venue       *string              `json:"venue,omitempty" description:"Venue name"`
	PosterURL   string               `json:"poster_url" description:"URL to poster image"`
	ArtistCount int                  `json:"artist_count" description:"Number of extracted artists"`
	TrackCount  int                  `json:"track_count" description:"Number of found tracks"`
	CreatedAt   string               `json:"created_at" description:"Creation timestamp"`
	UpdatedAt   string               `json:"updated_at" description:"Last update timestamp"`
	UserID      string               `json:"user_id" description:"User who created this poster"`
	Artists     []models.Artist      `json:"artists,omitempty" description:"Extracted artists"`
	Tracks      []models.SpotifyTrack `json:"tracks,omitempty" description:"Found Spotify tracks"`
}

// Enhanced analysis request and response types

type EnhancedAnalysisRequest struct {
	ImageData string `json:"image_data" description:"Base64 encoded image data"`
	MimeType  string `json:"mime_type" description:"Image MIME type (image/jpeg, image/png)"`
}

type EnhancedAnalysisResponse struct {
	EventAnalysis   AnalyzePosterResponse       `json:"event_analysis" description:"AI analysis results"`
	VerifiedArtists []VerifiedArtist           `json:"verified_artists" description:"Artists with Spotify verification"`
	SpotifyTracks   []models.SpotifyTrack      `json:"spotify_tracks" description:"All Spotify tracks found"`
	DJSets          map[string][]TracklistSearchResult `json:"dj_sets" description:"DJ sets by artist name"`
	TotalDJSets     int                        `json:"total_dj_sets" description:"Total number of DJ sets found"`
	Success         bool                       `json:"success" description:"Whether analysis succeeded"`
	Error           string                     `json:"error,omitempty" description:"Error message if analysis failed"`
}

type SearchTracklistsRequest struct {
	Artists []string `json:"artists" description:"List of artist names to search"`
}

type SearchTracklistsResponse struct {
	Results map[string][]TracklistSearchResult `json:"results" description:"DJ sets by artist name"`
	Success bool                               `json:"success" description:"Whether search succeeded"`
	Error   string                             `json:"error,omitempty" description:"Error message if search failed"`
}

// New creates a new HTTP handler for the eventposter package
func New(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()

	// API endpoints
	mux.HandleFunc("/analyzeposter", handleAnalyzePoster(d))
	mux.HandleFunc("/searchspotifytracks", handleSearchSpotifyTracks(d))
	mux.HandleFunc("/saveeventdata", handleSaveEventData(d))
	mux.HandleFunc("/list", handleListEventPosters(d))
	
	// Enhanced endpoints
	mux.HandleFunc("/enhancedanalysis", handleEnhancedAnalysis(d))
	mux.HandleFunc("/searchtracklists", handleSearchTracklists(d))

	// Component routes
	mux.HandleFunc("/viewer", func(w http.ResponseWriter, r *http.Request) {
		coderunner.ServeReactApp(w, r, "eventposter/EventPosterViewer.tsx", "EventPosterViewer")
	})

	// Serve the React component (only for exact match)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		coderunner.ServeReactApp(w, r, "eventposter/EventPosterArtistExtractor.tsx", "EventPosterArtistExtractor")
	})

	return mux
}

func handleAnalyzePoster(d deps.Deps) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req AnalyzePosterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// Create context with dependencies
		ctx := context.WithValue(r.Context(), "deps", d)

		resp, err := AnalyzePoster(ctx, req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

func handleSearchSpotifyTracks(d deps.Deps) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req SearchSpotifyTracksRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// Create Spotify client
		spotifyClient, err := createSpotifyClientFromConfig(d.Config)
		if err != nil {
			http.Error(w, "Spotify client error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Create context with dependencies and Spotify client
		ctx := context.WithValue(r.Context(), "deps", d)
		ctx = context.WithValue(ctx, "spotify", spotifyClient)

		resp := searchSpotifyTracksWithClient(ctx, req, spotifyClient)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

func handleSaveEventData(d deps.Deps) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req SaveEventDataRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// Create context with dependencies
		ctx := context.WithValue(r.Context(), "deps", d)

		resp, err := SaveEventData(ctx, req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

func handleListEventPosters(d deps.Deps) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req ListEventPostersRequest

		// Handle both GET (query params) and POST (JSON body) methods
		if r.Method == http.MethodPost {
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "Invalid JSON", http.StatusBadRequest)
				return
			}
		} else {
			// Parse query parameters for GET requests
			req.Search = r.URL.Query().Get("search")
			if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
				if offset, err := strconv.Atoi(offsetStr); err == nil {
					req.Offset = offset
				}
			}
			if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
				if limit, err := strconv.Atoi(limitStr); err == nil {
					req.Limit = limit
				}
			}
			req.UserID = r.URL.Query().Get("user_id")
		}

		// Set default limit and validate
		if req.Limit <= 0 {
			req.Limit = 20 // Default limit
		}
		if req.Limit > 50 {
			req.Limit = 50 // Maximum limit
		}

		// Create context with dependencies
		ctx := context.WithValue(r.Context(), "deps", d)

		resp, err := ListEventPosters(ctx, req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

func handleEnhancedAnalysis(d deps.Deps) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req EnhancedAnalysisRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// Create context with dependencies
		ctx := context.WithValue(r.Context(), "deps", d)

		resp, err := EnhancedAnalysisPoster(ctx, req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

func handleSearchTracklists(d deps.Deps) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req SearchTracklistsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// Search tracklists for all artists
		results, err := SearchTracklistsForArtists(req.Artists)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(SearchTracklistsResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(SearchTracklistsResponse{
			Results: results,
			Success: true,
		})
	}
}

// Helper function to create Spotify client from config
func createSpotifyClientFromConfig(c config.AppConfig) (*spotify.Client, error) {
	config := &clientcredentials.Config{
		ClientID:     c.Spotify.ClientID,
		ClientSecret: c.Spotify.ClientSecret,
		TokenURL:     spotifyauth.TokenURL,
		Scopes: []string{
			spotifyauth.ScopeUserReadPlaybackState, spotifyauth.ScopeUserModifyPlaybackState,
		},
	}

	token, err := config.Token(context.Background())
	if err != nil {
		return nil, err
	}

	a := spotifyauth.New(
		spotifyauth.WithScopes(spotifyauth.ScopeUserReadPlaybackState, spotifyauth.ScopeUserModifyPlaybackState),
		spotifyauth.WithClientID(c.Spotify.ClientID),
		spotifyauth.WithClientSecret(c.Spotify.ClientSecret),
	)

	httpClient := a.Client(context.Background(), token)
	client := spotify.New(httpClient)

	return client, nil
}

// searchSpotifyTracksWithClient handles the Spotify search with an actual client
func searchSpotifyTracksWithClient(ctx context.Context, req SearchSpotifyTracksRequest, client *spotify.Client) SearchSpotifyTracksResponse {
	limit := req.Limit
	if limit <= 0 {
		limit = 5 // Default to 5 tracks per artist
	}

	var allTracks []models.SpotifyTrack

	for _, artistName := range req.Artists {
		// Search for the artist
		results, err := client.Search(ctx, artistName, spotify.SearchTypeTrack, spotify.Limit(limit))
		if err != nil {
			continue // Skip failed searches, don't fail entire request
		}

		if results.Tracks == nil || len(results.Tracks.Tracks) == 0 {
			continue // No tracks found for this artist
		}

		// Convert Spotify tracks to our format
		for _, track := range results.Tracks.Tracks {
			println("Found track:", track.Name, "by", track.Artists[0].Name, artistName)
			if len(allTracks) >= 50 { // Reasonable limit
				break
			}

			// Get primary artist name
			primaryArtist := ""
			if len(track.Artists) > 0 {
				primaryArtist = track.Artists[0].Name
			}

			// Get album artwork
			imageURL := ""
			if len(track.Album.Images) > 0 {
				imageURL = track.Album.Images[0].URL
			}

			// Get preview URL
			previewURL := ""
			if track.PreviewURL != "" {
				previewURL = track.PreviewURL
			}

			spotifyTrack := models.SpotifyTrack{
				ID:         track.ID.String(),
				Name:       track.Name,
				Artist:     primaryArtist,
				Album:      track.Album.Name,
				SpotifyURL: track.ExternalURLs["spotify"],
				PreviewURL: previewURL,
				ImageURL:   imageURL,
				Duration:   int(track.Duration),
				Popularity: int(track.Popularity),
			}

			allTracks = append(allTracks, spotifyTrack)
		}
	}

	return SearchSpotifyTracksResponse{
		Tracks:  allTracks,
		Success: true,
	}
}

// handleServeModule builds and serves a React component as an ES module
func handleServeModule(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract path from URL - note that the "/eventposter" prefix is already stripped by the time it reaches this handler
	componentPath := strings.TrimPrefix(r.URL.Path, "/module/")
	if componentPath == "" {
		http.Error(w, "Component path is required", http.StatusBadRequest)
		return
	}

	// Validate and sanitize the path
	cleanPath := filepath.Clean(componentPath)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Build source path - look in the eventposter directory
	srcPath := filepath.Join("eventposter", cleanPath)

	// Check if source file exists
	if _, err := os.Stat(srcPath); os.IsNotExist(err) {
		http.Error(w, "Source file not found", http.StatusNotFound)
		return
	}

	// Read the source code to build
	sourceCode, err := os.ReadFile(srcPath)
	if err != nil {
		http.Error(w, "Failed to read source file", http.StatusInternalServerError)
		return
	}

	// Build with esbuild using stdin to avoid file system dependencies
	result := api.Build(api.BuildOptions{
		Stdin: &api.StdinOptions{
			Contents:   string(sourceCode),
			ResolveDir: "eventposter",
			Sourcefile: cleanPath,
		},
		Loader: map[string]api.Loader{
			".js":  api.LoaderJS,
			".jsx": api.LoaderJSX,
			".ts":  api.LoaderTS,
			".tsx": api.LoaderTSX,
			".css": api.LoaderCSS,
		},
		Format:          api.FormatESModule,
		Bundle:          true,
		Write:           false, // We want the result in memory
		TreeShaking:     api.TreeShakingTrue,
		Target:          api.ES2017,
		JSX:             api.JSXAutomatic,
		JSXImportSource: "react",
		LogLevel:        api.LogLevelSilent,
		TsconfigRaw: `{
			"compilerOptions": {
				"jsx": "react-jsx",
				"allowSyntheticDefaultImports": true,
				"esModuleInterop": true,
				"moduleResolution": "node",
				"target": "ES2017",
				"lib": ["ES2017", "DOM", "DOM.Iterable"],
				"allowJs": true,
				"skipLibCheck": true,
				"strict": false,
				"forceConsistentCasingInFileNames": true,
				"resolveJsonModule": true,
				"isolatedModules": true
			}
		}`,
	})

	// Check for build errors
	if len(result.Errors) > 0 {
		errorMessages := make([]string, len(result.Errors))
		for i, err := range result.Errors {
			errorMessages[i] = err.Text
		}

		// Return JavaScript that logs the error
		w.Header().Set("Content-Type", "application/javascript")
		errorJS := "console.error('EventPoster build failed:', " + strings.ReplaceAll(errorMessages[0], "'", "\\'") + ");"
		w.Write([]byte(errorJS))
		return
	}

	// Check if we have output files
	if len(result.OutputFiles) == 0 {
		http.Error(w, "No output generated", http.StatusInternalServerError)
		return
	}

	// Serve the compiled JavaScript as an ES module
	w.Header().Set("Content-Type", "application/javascript")
	w.Header().Set("Cache-Control", "no-cache") // Disable caching for development
	w.Write(result.OutputFiles[0].Contents)
}

// Use types from models package to avoid duplication
// API Functions for code generation

func AnalyzePoster(ctx context.Context, req AnalyzePosterRequest) (AnalyzePosterResponse, error) {
	// Get dependencies from context (will be injected by handlers)
	deps := ctx.Value("deps").(deps.Deps)

	// Decode base64 image to validate
	_, err := base64.StdEncoding.DecodeString(req.ImageData)
	if err != nil {
		return AnalyzePosterResponse{
			Success: false,
			Error:   "Invalid base64 image data",
		}, nil
	}

	// Create AI client
	aiClient := ai.New(deps.Config, deps.DB)

	// Generate JSON schema for structured output
	var analysis EventPosterAnalysis
	schema, err := jsonschema.GenerateSchemaForType(analysis)
	if err != nil {
		return AnalyzePosterResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to generate schema: %v", err),
		}, nil
	}

	// Create OpenAI request with structured output
	messages := []openai.ChatCompletionMessage{
		{
			Role: openai.ChatMessageRoleSystem,
			Content: `You are an expert at analyzing event posters and concert flyers. Extract detailed information about events, artists, venues, and other relevant details from the provided image.

For artists, classify their roles based on text size and positioning:
- "headliner": Main artists in large, prominent text
- "support": Supporting acts in smaller text
- "dj": DJs or electronic music performers
- "host": Event hosts or MCs
- "unknown": When role cannot be determined

Pay attention to:
- Event names and festival titles
- Date and time information
- Venue names and locations
- Artist names and their hierarchy
- Ticket information and pricing
- Social media handles or websites
- Music genres or event types`,
		},
		{
			Role: openai.ChatMessageRoleUser,
			MultiContent: []openai.ChatMessagePart{
				{
					Type: openai.ChatMessagePartTypeText,
					Text: "Analyze this event poster and extract all the information you can find. Be thorough but accurate with confidence scores.",
				},
				{
					Type: openai.ChatMessagePartTypeImageURL,
					ImageURL: &openai.ChatMessageImageURL{
						URL:    fmt.Sprintf("data:%s;base64,%s", req.MimeType, req.ImageData),
						Detail: openai.ImageURLDetailHigh,
					},
				},
			},
		},
	}

	// Make AI request with structured output
	aiReq := openai.ChatCompletionRequest{
		Model:       openai.GPT4Dot1Mini,
		Messages:    messages,
		Temperature: 0.1,
		ResponseFormat: &openai.ChatCompletionResponseFormat{
			Type: openai.ChatCompletionResponseFormatTypeJSONSchema,
			JSONSchema: &openai.ChatCompletionResponseFormatJSONSchema{
				Name:   "analyze_event_poster",
				Schema: schema,
				Strict: true,
			},
		},
	}

	ct := ai.WithContextID(ctx, uuid.NewString())
	resp, err := aiClient.CreateChatCompletion(ct, aiReq)
	if err != nil {
		return AnalyzePosterResponse{
			Success: false,
			Error:   fmt.Sprintf("AI analysis failed: %v", err),
		}, nil
	}

	if len(resp.Choices) == 0 {
		return AnalyzePosterResponse{
			Success: false,
			Error:   "No response from AI",
		}, nil
	}

	// Parse structured response with Unicode sanitization
	content := resp.Choices[0].Message.Content
	sanitizedContent := sanitizeUnicodeEscapes(content)

	var result EventPosterAnalysis
	err = json.Unmarshal([]byte(sanitizedContent), &result)
	if err != nil {
		return AnalyzePosterResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to parse structured response: %v", err),
			RawText: content,
		}, nil
	}

	// Convert enhanced ArtistInfo to models.Artist for backward compatibility
	var artists []models.Artist
	for _, artistInfo := range result.Artists {
		artists = append(artists, models.Artist{
			Name:       artistInfo.Name,
			Confidence: artistInfo.Confidence,
		})
	}

	return AnalyzePosterResponse{
		EventName: result.EventName,
		EventDate: result.EventDate,
		Venue:     result.Venue,
		Artists:   artists,
		RawText:   result.RawText,
		Success:   true,
	}, nil
}

// Helper function to safely convert *string to string
func stringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// sanitizeUnicodeEscapes cleans malformed Unicode escape sequences from AI responses
func sanitizeUnicodeEscapes(content string) string {
	// Remove malformed Unicode escapes like \\u00183, \\u0000d6
	// Pattern matches backslash-backslash-u followed by invalid sequences
	malformedUnicodePattern := regexp.MustCompile(`\\\\u[0-9a-fA-F]{5,}`)
	content = malformedUnicodePattern.ReplaceAllString(content, "")

	// Also remove double-backslash Unicode escapes that aren't properly formed
	doubleBackslashPattern := regexp.MustCompile(`\\\\u[0-9a-fA-F]{4}`)
	content = doubleBackslashPattern.ReplaceAllStringFunc(content, func(match string) string {
		// Convert \\uXXXX to \uXXXX (single backslash for proper JSON)
		return strings.Replace(match, "\\\\u", "\\u", 1)
	})

	return content
}

func SearchSpotifyTracks(ctx context.Context, req SearchSpotifyTracksRequest) (SearchSpotifyTracksResponse, error) {
	// Note: This function is now mainly for type definitions
	// The actual implementation is in handlers.go using searchSpotifyTracksWithClient
	return SearchSpotifyTracksResponse{
		Success: false,
		Error:   "Use searchSpotifyTracksWithClient in handlers.go",
	}, nil
}

func SaveEventData(ctx context.Context, req SaveEventDataRequest) (SaveEventDataResponse, error) {
	// For now, just save to database
	// Google Sheets integration can be added later using existing PhotoEntrySheet pattern
	deps := ctx.Value("deps").(deps.Deps)

	// Create event poster record
	eventPoster := &models.EventPoster{
		Model: models.Model{
			ID: uuid.NewString(),
		},
		EventName: req.EventData.EventName,
		EventDate: stringValue(req.EventData.EventDate),
		Venue:     stringValue(req.EventData.Venue),
		PosterURL: req.EventData.PosterURL,
		UserID:    "default-user", // TODO: Get from authenticated user context
		Artists:   models.MakeJSONField(req.EventData.Artists),
		Tracks:    models.MakeJSONField(req.EventData.Tracks),
	}

	err := deps.DB.Create(eventPoster).Error
	if err != nil {
		return SaveEventDataResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to save event data: %v", err),
		}, nil
	}

	return SaveEventDataResponse{
		Success: true,
		RowID:   eventPoster.ID,
	}, nil
}

// EnhancedAnalysisPoster performs complete analysis including AI, Spotify, and tracklists
func EnhancedAnalysisPoster(ctx context.Context, req EnhancedAnalysisRequest) (EnhancedAnalysisResponse, error) {
	// Step 1: Perform AI analysis
	analysisReq := AnalyzePosterRequest{
		ImageData: req.ImageData,
		MimeType:  req.MimeType,
	}
	
	analysisResp, err := AnalyzePoster(ctx, analysisReq)
	if err != nil {
		return EnhancedAnalysisResponse{
			Success: false,
			Error:   fmt.Sprintf("AI analysis failed: %v", err),
		}, nil
	}
	
	if !analysisResp.Success {
		return EnhancedAnalysisResponse{
			EventAnalysis: analysisResp,
			Success:       false,
			Error:         analysisResp.Error,
		}, nil
	}
	
	// Step 2: Search Spotify for all artists
	var spotifyTracks []models.SpotifyTrack
	if len(analysisResp.Artists) > 0 {
		deps := ctx.Value("deps").(deps.Deps)
		spotifyClient, err := createSpotifyClientFromConfig(deps.Config)
		if err == nil {
			spotifyCtx := context.WithValue(ctx, "spotify", spotifyClient)
			artistNames := make([]string, len(analysisResp.Artists))
			for i, artist := range analysisResp.Artists {
				artistNames[i] = artist.Name
			}
			
			spotifyResp := searchSpotifyTracksWithClient(spotifyCtx, SearchSpotifyTracksRequest{
				Artists: artistNames,
				Limit:   5,
			}, spotifyClient)
			
			if spotifyResp.Success {
				spotifyTracks = spotifyResp.Tracks
			}
		}
	}
	
	// Step 3: Verify artists with Spotify results
	verifiedArtists := VerifyArtistsWithSpotify(analysisResp.Artists, spotifyTracks)
	
	// Step 4: Search 1001tracklists for each artist
	artistNames := make([]string, len(analysisResp.Artists))
	for i, artist := range analysisResp.Artists {
		artistNames[i] = artist.Name
	}
	
	djSets, err := SearchTracklistsForArtists(artistNames)
	if err != nil {
		// Don't fail the entire request if tracklist search fails
		djSets = make(map[string][]TracklistSearchResult)
	}
	
	// Step 5: Add tracklist data to verified artists
	verifiedArtists = AddTracklistData(verifiedArtists, djSets)
	
	// Count total DJ sets
	totalDJSets := 0
	for _, sets := range djSets {
		totalDJSets += len(sets)
	}
	
	return EnhancedAnalysisResponse{
		EventAnalysis:   analysisResp,
		VerifiedArtists: verifiedArtists,
		SpotifyTracks:   spotifyTracks,
		DJSets:          djSets,
		TotalDJSets:     totalDJSets,
		Success:         true,
	}, nil
}

// Note: Spotify client creation is now handled in handlers.go

// Additional helper functions

func ProcessImageUpload(file multipart.File, header *multipart.FileHeader) (string, string, error) {
	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		return "", "", fmt.Errorf("failed to read file: %v", err)
	}

	// Encode to base64
	encoded := base64.StdEncoding.EncodeToString(data)

	// Get MIME type from header
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		// Default based on file extension
		if strings.HasSuffix(strings.ToLower(header.Filename), ".png") {
			mimeType = "image/png"
		} else {
			mimeType = "image/jpeg"
		}
	}

	return encoded, mimeType, nil
}
