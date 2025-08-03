package eventposter

import (
	"math"
	"strings"
	"unicode"

	"github.com/breadchris/share/models"
)

// VerifiedArtist represents an artist from the poster with Spotify verification data
type VerifiedArtist struct {
	PosterName      string                `json:"poster_name" description:"Artist name as extracted from poster"`
	SpotifyMatches  []SpotifyArtistMatch  `json:"spotify_matches" description:"Potential Spotify artist matches"`
	BestMatch       *SpotifyArtistMatch   `json:"best_match,omitempty" description:"Best Spotify match for this artist"`
	MatchConfidence float64               `json:"match_confidence" description:"Confidence score for best match (0.0-1.0)"`
	IsVerified      bool                  `json:"is_verified" description:"Whether we found a confident match"`
	HasDJSets       bool                  `json:"has_dj_sets" description:"Whether this artist has DJ sets on 1001tracklists"`
	DJSetCount      int                   `json:"dj_set_count" description:"Number of DJ sets found"`
	DJSets          []TracklistSearchResult `json:"dj_sets,omitempty" description:"DJ sets found for this artist"`
}

// SpotifyArtistMatch represents a potential Spotify artist match
type SpotifyArtistMatch struct {
	ArtistName      string  `json:"artist_name" description:"Spotify artist name"`
	MatchScore      float64 `json:"match_score" description:"Similarity score (0.0-1.0)"`
	Tracks          []models.SpotifyTrack `json:"tracks" description:"Tracks by this artist"`
	Popularity      int     `json:"popularity,omitempty" description:"Spotify popularity score"`
	IsExactMatch    bool    `json:"is_exact_match" description:"Whether this is an exact name match"`
}

// VerifyArtistsWithSpotify verifies poster artists against Spotify search results
func VerifyArtistsWithSpotify(posterArtists []models.Artist, spotifyTracks []models.SpotifyTrack) []VerifiedArtist {
	var verified []VerifiedArtist
	
	for _, posterArtist := range posterArtists {
		verifiedArtist := VerifiedArtist{
			PosterName:      posterArtist.Name,
			SpotifyMatches:  []SpotifyArtistMatch{},
			MatchConfidence: 0.0,
			IsVerified:      false,
		}
		
		// Group Spotify tracks by artist name
		artistTrackMap := make(map[string][]models.SpotifyTrack)
		for _, track := range spotifyTracks {
			artistTrackMap[track.Artist] = append(artistTrackMap[track.Artist], track)
		}
		
		// Find matches for this poster artist
		for spotifyArtistName, tracks := range artistTrackMap {
			matchScore := calculateSimilarity(posterArtist.Name, spotifyArtistName)
			isExact := strings.EqualFold(posterArtist.Name, spotifyArtistName)
			
			// Only include matches above a minimum threshold
			if matchScore >= 0.6 || isExact {
				match := SpotifyArtistMatch{
					ArtistName:   spotifyArtistName,
					MatchScore:   matchScore,
					Tracks:       tracks,
					IsExactMatch: isExact,
				}
				
				// Calculate popularity based on tracks
				if len(tracks) > 0 {
					totalPopularity := 0
					for _, track := range tracks {
						totalPopularity += track.Popularity
					}
					match.Popularity = totalPopularity / len(tracks)
				}
				
				verifiedArtist.SpotifyMatches = append(verifiedArtist.SpotifyMatches, match)
			}
		}
		
		// Find the best match
		if len(verifiedArtist.SpotifyMatches) > 0 {
			bestMatch := findBestMatch(verifiedArtist.SpotifyMatches)
			verifiedArtist.BestMatch = &bestMatch
			verifiedArtist.MatchConfidence = bestMatch.MatchScore
			verifiedArtist.IsVerified = bestMatch.MatchScore >= 0.8 || bestMatch.IsExactMatch
		}
		
		verified = append(verified, verifiedArtist)
	}
	
	return verified
}

// findBestMatch finds the best Spotify match based on score and other factors
func findBestMatch(matches []SpotifyArtistMatch) SpotifyArtistMatch {
	if len(matches) == 0 {
		return SpotifyArtistMatch{}
	}
	
	bestMatch := matches[0]
	bestScore := calculateMatchQuality(bestMatch)
	
	for _, match := range matches[1:] {
		score := calculateMatchQuality(match)
		if score > bestScore {
			bestMatch = match
			bestScore = score
		}
	}
	
	return bestMatch
}

// calculateMatchQuality calculates overall match quality considering multiple factors
func calculateMatchQuality(match SpotifyArtistMatch) float64 {
	quality := match.MatchScore
	
	// Boost exact matches
	if match.IsExactMatch {
		quality += 0.2
	}
	
	// Boost popular artists (but don't over-weight this)
	popularityBoost := float64(match.Popularity) / 100.0 * 0.1
	quality += popularityBoost
	
	// Boost artists with more tracks (they're more likely to be real artists)
	trackBoost := math.Min(float64(len(match.Tracks))/10.0, 0.1)
	quality += trackBoost
	
	return math.Min(quality, 1.0)
}

// calculateSimilarity calculates string similarity between two artist names
func calculateSimilarity(name1, name2 string) float64 {
	// Normalize names for comparison
	norm1 := normalizeArtistName(name1)
	norm2 := normalizeArtistName(name2)
	
	// Check for exact match after normalization
	if norm1 == norm2 {
		return 1.0
	}
	
	// Check if one name contains the other
	if strings.Contains(norm1, norm2) || strings.Contains(norm2, norm1) {
		return 0.9
	}
	
	// Use Levenshtein distance for fuzzy matching
	distance := levenshteinDistance(norm1, norm2)
	maxLen := math.Max(float64(len(norm1)), float64(len(norm2)))
	
	if maxLen == 0 {
		return 0.0
	}
	
	similarity := 1.0 - (float64(distance) / maxLen)
	return math.Max(0.0, similarity)
}

// normalizeArtistName normalizes artist names for better matching
func normalizeArtistName(name string) string {
	// Convert to lowercase
	name = strings.ToLower(name)
	
	// Remove common prefixes/suffixes
	name = strings.TrimSpace(name)
	
	// Remove punctuation and extra spaces
	var normalized strings.Builder
	for _, r := range name {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.IsSpace(r) {
			normalized.WriteRune(r)
		}
	}
	
	// Normalize whitespace
	words := strings.Fields(normalized.String())
	return strings.Join(words, " ")
}

// levenshteinDistance calculates the Levenshtein distance between two strings
func levenshteinDistance(s1, s2 string) int {
	if len(s1) == 0 {
		return len(s2)
	}
	if len(s2) == 0 {
		return len(s1)
	}
	
	matrix := make([][]int, len(s1)+1)
	for i := range matrix {
		matrix[i] = make([]int, len(s2)+1)
		matrix[i][0] = i
	}
	
	for j := range matrix[0] {
		matrix[0][j] = j
	}
	
	for i := 1; i <= len(s1); i++ {
		for j := 1; j <= len(s2); j++ {
			cost := 0
			if s1[i-1] != s2[j-1] {
				cost = 1
			}
			
			matrix[i][j] = min(
				matrix[i-1][j]+1,      // deletion
				matrix[i][j-1]+1,      // insertion
				matrix[i-1][j-1]+cost, // substitution
			)
		}
	}
	
	return matrix[len(s1)][len(s2)]
}

// min returns the minimum of three integers
func min(a, b, c int) int {
	if a < b {
		if a < c {
			return a
		}
		return c
	}
	if b < c {
		return b
	}
	return c
}

// AddTracklistData adds 1001tracklists data to verified artists
func AddTracklistData(verifiedArtists []VerifiedArtist, tracklistResults map[string][]TracklistSearchResult) []VerifiedArtist {
	for i := range verifiedArtists {
		artist := &verifiedArtists[i]
		
		// Look for DJ sets using the poster name
		if djSets, found := tracklistResults[artist.PosterName]; found && len(djSets) > 0 {
			artist.HasDJSets = true
			artist.DJSetCount = len(djSets)
			artist.DJSets = djSets
		} else {
			// Try with the best Spotify match name if available
			if artist.BestMatch != nil {
				if djSets, found := tracklistResults[artist.BestMatch.ArtistName]; found && len(djSets) > 0 {
					artist.HasDJSets = true
					artist.DJSetCount = len(djSets)
					artist.DJSets = djSets
				}
			}
		}
	}
	
	return verifiedArtists
}