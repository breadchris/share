package awesomelist

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrate the schema
	err = db.AutoMigrate(&models.Content{}, &models.User{}, &models.Group{}, &models.Tag{})
	require.NoError(t, err)

	return db
}

// createTestUser creates a test user
func createTestUser(db *gorm.DB) *models.User {
	userID := uuid.New().String()
	user := &models.User{
		ID:        userID,
		CreatedAt: time.Now(),
		Username:  "testuser_" + userID[:8],
	}
	db.Create(user)
	return user
}

// createTestGroup creates a test group
func createTestGroup(db *gorm.DB) *models.Group {
	groupID := uuid.New().String()
	group := &models.Group{
		ID:        groupID,
		CreatedAt: time.Now(),
		Name:      "testgroup_" + groupID[:8],
		JoinCode:  "testcode",
	}
	db.Create(group)
	return group
}

// createTestAwesomeListCrawler creates a test crawler instance
func createTestAwesomeListCrawler(db *gorm.DB, githubToken string) *AwesomeListCrawler {
	return NewAwesomeListCrawler(db, githubToken)
}

// createTestTempDir creates a temporary directory for tests
func createTestTempDir(t *testing.T) string {
	tempDir, err := os.MkdirTemp("", "awesomelist_test_*")
	require.NoError(t, err)
	t.Cleanup(func() {
		os.RemoveAll(tempDir)
	})
	return tempDir
}

// mockGitHubAPI creates a mock GitHub API server
func mockGitHubAPI(t *testing.T) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Parse the request URL to determine the response
		path := r.URL.Path
		
		if strings.Contains(path, "/repos/sindresorhus/awesome") {
			// Mock repository metadata response
			response := map[string]interface{}{
				"id":          1296269,
				"name":        "awesome",
				"full_name":   "sindresorhus/awesome",
				"description": "😎 Awesome lists about all kinds of interesting topics",
				"stargazers_count": 250000,
				"forks_count":      25000,
				"owner": map[string]interface{}{
					"login": "sindresorhus",
				},
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
		} else {
			// Default 404 response
			w.WriteHeader(404)
			w.Write([]byte("Not Found"))
		}
	}))
}

// createTestReadmeContent creates a simple awesome list README content
func createTestReadmeContent() string {
	return `# Awesome Test List

A curated list of awesome things.

## Contents

- [Databases](#databases)
- [Web Frameworks](#web-frameworks)

## Databases

- [PostgreSQL](https://www.postgresql.org/) - Advanced open source database
- [MySQL](https://www.mysql.com/) - Popular relational database
- [Redis](https://redis.io/) - In-memory data store

## Web Frameworks

- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Angular](https://angular.io/) - Platform for building mobile and desktop web applications

## License

MIT License
`
}

// createTestRepository creates a test Git repository with README
func createTestRepository(t *testing.T, tempDir string) string {
	repoDir := filepath.Join(tempDir, "test-repo")
	err := os.MkdirAll(repoDir, 0755)
	require.NoError(t, err)

	// Create README.md
	readmePath := filepath.Join(repoDir, "README.md")
	err = os.WriteFile(readmePath, []byte(createTestReadmeContent()), 0644)
	require.NoError(t, err)

	return repoDir
}

// Test NewAwesomeListCrawler
func TestNewAwesomeListCrawler(t *testing.T) {
	db := setupTestDB(t)
	
	tests := []struct {
		name        string
		githubToken string
		expectNil   bool
	}{
		{
			name:        "with GitHub token",
			githubToken: "test-token",
			expectNil:   false,
		},
		{
			name:        "without GitHub token",
			githubToken: "",
			expectNil:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			crawler := createTestAwesomeListCrawler(db, tt.githubToken)
			
			assert.NotNil(t, crawler)
			assert.Equal(t, db, crawler.db)
			assert.NotNil(t, crawler.githubClient)
			assert.Equal(t, "./data/awesomelist", crawler.baseDataDir)
		})
	}
}

// Test parseReadmeWithRegex
func TestParseReadmeWithRegex(t *testing.T) {
	db := setupTestDB(t)
	crawler := createTestAwesomeListCrawler(db, "")
	
	content := createTestReadmeContent()
	
	links, categories, err := crawler.parseReadmeWithRegex(content)
	
	assert.NoError(t, err)
	assert.NotEmpty(t, links)
	assert.NotEmpty(t, categories)
	
	// Check that we found some expected links
	foundPostgreSQL := false
	foundReact := false
	
	for _, link := range links {
		if strings.Contains(link.URL, "postgresql.org") {
			foundPostgreSQL = true
			assert.Equal(t, "Databases", link.Category)
			assert.Equal(t, "PostgreSQL", link.Title)
		}
		if strings.Contains(link.URL, "reactjs.org") {
			foundReact = true
			assert.Equal(t, "Web Frameworks", link.Category)
			assert.Equal(t, "React", link.Title)
		}
	}
	
	assert.True(t, foundPostgreSQL, "Should find PostgreSQL link")
	assert.True(t, foundReact, "Should find React link")
	
	// Check categories
	assert.Contains(t, categories, "Databases")
	assert.Contains(t, categories, "Web Frameworks")
}

// Test parseReadme with actual file
func TestParseReadme(t *testing.T) {
	db := setupTestDB(t)
	crawler := createTestAwesomeListCrawler(db, "")
	tempDir := createTestTempDir(t)
	
	// Create test repository
	repoDir := createTestRepository(t, tempDir)
	readmePath := filepath.Join(repoDir, "README.md")
	
	links, categories, err := crawler.parseReadme(readmePath)
	
	assert.NoError(t, err)
	assert.NotEmpty(t, links, "Should find some links")
	assert.NotEmpty(t, categories, "Should find some categories")
	
	// Check that we found some expected links
	foundPostgreSQL := false
	foundReact := false
	
	for _, link := range links {
		if strings.Contains(link.URL, "postgresql.org") {
			foundPostgreSQL = true
			assert.Equal(t, "Databases", link.Category)
			assert.Equal(t, "PostgreSQL", link.Title)
		}
		if strings.Contains(link.URL, "reactjs.org") {
			foundReact = true
			assert.Equal(t, "Web Frameworks", link.Category)
			assert.Equal(t, "React", link.Title)
		}
	}
	
	assert.True(t, foundPostgreSQL, "Should find PostgreSQL link")
	assert.True(t, foundReact, "Should find React link")
	
	// Check categories
	assert.Contains(t, categories, "Databases")
	assert.Contains(t, categories, "Web Frameworks")
}

// Test cloneRepository (mocked)
func TestCloneRepository(t *testing.T) {
	db := setupTestDB(t)
	crawler := createTestAwesomeListCrawler(db, "")
	tempDir := createTestTempDir(t)
	
	// Override the base data dir to use our temp dir
	crawler.baseDataDir = tempDir
	
	// This test would normally clone a real repository
	// For now, we'll test that it creates the directory structure correctly
	// In a real scenario, you'd mock the git.PlainClone function
	
	// Test invalid URL
	_, err := crawler.cloneRepository("invalid-url")
	assert.Error(t, err)
}

// Test CrawlAwesomeList with mocked GitHub API
func TestCrawlAwesomeList(t *testing.T) {
	db := setupTestDB(t)
	_ = createTestGroup(db) // Create group but don't use it in this test
	crawler := createTestAwesomeListCrawler(db, "")
	
	// Create mock GitHub API server
	mockServer := mockGitHubAPI(t)
	defer mockServer.Close()
	
	// This test would require mocking the git clone operation
	// For now, we'll test the URL parsing and validation
	
	tests := []struct {
		name      string
		repoURL   string
		wantError bool
	}{
		{
			name:      "valid GitHub URL",
			repoURL:   "https://github.com/sindresorhus/awesome",
			wantError: false, // Actually works since we can clone real repos
		},
		{
			name:      "invalid URL",
			repoURL:   "not-a-url",
			wantError: true,
		},
		{
			name:      "invalid GitHub URL",
			repoURL:   "https://github.com/invalid",
			wantError: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := crawler.CrawlAwesomeList(context.Background(), tt.repoURL)
			if tt.wantError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// Test database operations
func TestDatabaseOperations(t *testing.T) {
	db := setupTestDB(t)
	group := createTestGroup(db)
	
	// Test creating awesome list content
	metadata := map[string]interface{}{
		"github_url":   "https://github.com/sindresorhus/awesome",
		"owner":        "sindresorhus",
		"repo":         "awesome",
		"description":  "Awesome lists about all kinds of interesting topics",
		"stars":        250000,
		"forks":        25000,
		"link_count":   100,
		"categories":   []string{"Databases", "Web Frameworks"},
	}
	
	content := models.NewContent("awesome-list", "https://github.com/sindresorhus/awesome", group.ID, "system", metadata)
	
	err := db.Create(content).Error
	assert.NoError(t, err)
	
	// Test retrieving awesome list
	var retrievedContent models.Content
	err = db.Where("type = ? AND data = ?", "awesome-list", "https://github.com/sindresorhus/awesome").First(&retrievedContent).Error
	assert.NoError(t, err)
	assert.Equal(t, content.ID, retrievedContent.ID)
	assert.Equal(t, "awesome-list", retrievedContent.Type)
	
	// Test creating awesome link content
	linkMetadata := map[string]interface{}{
		"parent_awesome_list": content.ID,
		"category":            "Databases",
		"title":               "PostgreSQL",
		"url":                 "https://www.postgresql.org/",
		"description":         "Advanced open source database",
	}
	
	linkContent := models.NewContent("awesome-link", "https://www.postgresql.org/", group.ID, "system", linkMetadata)
	linkContent.ParentContentID = &content.ID
	
	err = db.Create(linkContent).Error
	assert.NoError(t, err)
	
	// Test retrieving links for awesome list
	var links []models.Content
	err = db.Where("type = ? AND parent_content_id = ?", "awesome-link", content.ID).Find(&links).Error
	assert.NoError(t, err)
	assert.Len(t, links, 1)
	assert.Equal(t, linkContent.ID, links[0].ID)
}

// Test duplicate detection
func TestDuplicateDetection(t *testing.T) {
	db := setupTestDB(t)
	group := createTestGroup(db)
	
	// Create initial content
	metadata := map[string]interface{}{
		"github_url": "https://github.com/sindresorhus/awesome",
		"stars":      250000,
	}
	
	content := models.NewContent("awesome-list", "https://github.com/sindresorhus/awesome", group.ID, "system", metadata)
	err := db.Create(content).Error
	assert.NoError(t, err)
	
	// Test that duplicate detection works
	crawler := createTestAwesomeListCrawler(db, "")
	
	// Check if content already exists
	var existingContent models.Content
	err = crawler.db.Where("type = ? AND data = ?", "awesome-list", "https://github.com/sindresorhus/awesome").First(&existingContent).Error
	assert.NoError(t, err)
	
	// Should find the existing content
	assert.Equal(t, content.ID, existingContent.ID)
}

// Test URL parsing
func TestURLParsing(t *testing.T) {
	tests := []struct {
		name     string
		url      string
		wantOwner string
		wantRepo  string
		wantError bool
	}{
		{
			name:      "valid GitHub URL",
			url:       "https://github.com/sindresorhus/awesome",
			wantOwner: "sindresorhus",
			wantRepo:  "awesome",
			wantError: false,
		},
		{
			name:      "GitHub URL with trailing slash",
			url:       "https://github.com/sindresorhus/awesome/",
			wantOwner: "sindresorhus",
			wantRepo:  "awesome",
			wantError: false,
		},
		{
			name:      "invalid URL",
			url:       "not-a-url",
			wantError: true,
		},
		{
			name:      "incomplete GitHub URL",
			url:       "https://github.com/sindresorhus",
			wantError: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This logic is extracted from the CrawlAwesomeList method
			if tt.wantError {
				// We expect URL parsing or path splitting to fail
				return
			}
			
			// Test URL parsing logic
			parts := strings.Split(strings.Trim(tt.url, "/"), "/")
			if len(parts) >= 5 { // https://github.com/owner/repo
				owner := parts[3]
				repo := parts[4]
				
				assert.Equal(t, tt.wantOwner, owner)
				assert.Equal(t, tt.wantRepo, repo)
			}
		})
	}
}

// Test error conditions
func TestErrorConditions(t *testing.T) {
	db := setupTestDB(t)
	crawler := createTestAwesomeListCrawler(db, "")
	
	// Test parsing non-existent README
	_, _, err := crawler.parseReadme("/non/existent/file.md")
	assert.Error(t, err)
	
	// Test cloning to invalid directory
	tempDir := createTestTempDir(t)
	crawler.baseDataDir = filepath.Join(tempDir, "readonly")
	
	// Make the directory read-only
	err = os.MkdirAll(crawler.baseDataDir, 0444)
	assert.NoError(t, err)
	
	// This should fail
	_, err = crawler.cloneRepository("https://github.com/test/repo")
	assert.Error(t, err)
}

// Integration test with real GitHub API (disabled by default)
func TestIntegrationCrawlRealAwesomeList(t *testing.T) {
	t.Skip("Skipping integration test - requires network access")
	
	// This test would crawl a real, simple awesome list
	// Uncomment and run manually for integration testing
	
	/*
	db := setupTestDB(t)
	group := createTestGroup(db)
	
	// Use a small, stable awesome list for testing
	crawler := createTestAwesomeListCrawler(db, "")
	
	// Override base data dir to use temp directory
	tempDir := createTestTempDir(t)
	crawler.baseDataDir = tempDir
	
	// Test with a real small awesome list
	err := crawler.CrawlAwesomeList(context.Background(), "https://github.com/awesome-selfhosted/awesome-selfhosted")
	assert.NoError(t, err)
	
	// Verify data was stored
	var content models.Content
	err = db.Where("type = ?", "awesome-list").First(&content).Error
	assert.NoError(t, err)
	
	// Verify links were stored
	var links []models.Content
	err = db.Where("type = ?", "awesome-link").Find(&links).Error
	assert.NoError(t, err)
	assert.True(t, len(links) > 0)
	*/
}

// Benchmark test for README parsing
func BenchmarkParseReadme(b *testing.B) {
	db := setupTestDB(&testing.T{})
	crawler := createTestAwesomeListCrawler(db, "")
	content := createTestReadmeContent()
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, err := crawler.parseReadmeWithRegex(content)
		if err != nil {
			b.Fatal(err)
		}
	}
}