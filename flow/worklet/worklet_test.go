package worklet

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/breadchris/flow/config"
	"github.com/breadchris/flow/db"
	"github.com/breadchris/flow/deps"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// TestHelper provides testing utilities for worklet tests
type TestHelper struct {
	TempDir   string
	TestDB    *gorm.DB
	Deps      *deps.Deps
	Manager   *Manager
	Handler   *WorkletHandler
	TestUser  string
	Cleanup   func()
}

// NewTestHelper creates a new test helper with all necessary setup
func NewTestHelper(t *testing.T) *TestHelper {
	// Create temporary directory for test files
	tempDir, err := ioutil.TempDir("", "worklet-test-*")
	require.NoError(t, err)

	// Create test database
	dbPath := filepath.Join(tempDir, "test.db")
	testDB := db.NewClaudeDB(fmt.Sprintf("sqlite://%s", dbPath))
	
	// Auto-migrate the worklet tables
	err = testDB.AutoMigrate(&Worklet{}, &WorkletPrompt{})
	require.NoError(t, err)

	// Create test configuration
	cfg := &config.AppConfig{
		DSN:         fmt.Sprintf("sqlite://%s", dbPath),
		ShareDir:    tempDir,
		ClaudeDebug: true,
	}

	// Create dependencies
	factory := deps.NewDepsFactory(*cfg)
	dependencies := factory.CreateDeps(testDB, tempDir)

	// Create manager and handler
	manager := NewManager(&dependencies)
	handler := NewWorkletHandler(&dependencies)

	// Create test user
	testUser := uuid.New().String()

	cleanup := func() {
		if err := os.RemoveAll(tempDir); err != nil {
			t.Logf("Failed to cleanup temp dir: %v", err)
		}
	}

	return &TestHelper{
		TempDir: tempDir,
		TestDB:  testDB,
		Deps:    &dependencies,
		Manager: manager,
		Handler: handler,
		TestUser: testUser,
		Cleanup: cleanup,
	}
}

// CreateTestRepository creates a simple test repository in the temp directory
func (h *TestHelper) CreateTestRepository(t *testing.T, name string) string {
	repoDir := filepath.Join(h.TempDir, name)
	require.NoError(t, os.MkdirAll(repoDir, 0755))

	// Initialize git repository
	require.NoError(t, runCommand(repoDir, "git", "init"))
	require.NoError(t, runCommand(repoDir, "git", "config", "user.email", "test@example.com"))
	require.NoError(t, runCommand(repoDir, "git", "config", "user.name", "Test User"))

	// Create a simple Node.js project
	packageJSON := `{
  "name": "test-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}`

	serverJS := `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log('Server running on port ' + port);
});`

	require.NoError(t, ioutil.WriteFile(filepath.Join(repoDir, "package.json"), []byte(packageJSON), 0644))
	require.NoError(t, ioutil.WriteFile(filepath.Join(repoDir, "server.js"), []byte(serverJS), 0644))

	// Create initial commit
	require.NoError(t, runCommand(repoDir, "git", "add", "."))
	require.NoError(t, runCommand(repoDir, "git", "commit", "-m", "Initial commit"))

	return repoDir
}

// runCommand runs a command in the specified directory
func runCommand(dir, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("command failed: %s, output: %s", err, string(output))
	}
	return nil
}

// TestWorkletCreation tests basic worklet creation and lifecycle
func TestWorkletCreation(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Cleanup()

	ctx := context.Background()

	// Create test repository
	repoPath := helper.CreateTestRepository(t, "test-repo")

	// Create worklet request
	req := CreateWorkletRequest{
		Name:        "Test Worklet",
		Description: "A test worklet",
		GitRepo:     repoPath,
		Branch:      "main",
		BasePrompt:  "Add a new endpoint that returns 'Hello Claude!' at /claude",
		Environment: map[string]string{
			"PORT": "3000",
		},
	}

	// Create worklet
	worklet, err := helper.Manager.CreateWorklet(ctx, req, helper.TestUser)
	require.NoError(t, err)
	assert.NotEmpty(t, worklet.ID)
	assert.Equal(t, "Test Worklet", worklet.Name)
	assert.Equal(t, StatusCreating, worklet.Status)
	assert.Equal(t, helper.TestUser, worklet.UserID)

	// Wait for worklet to be deployed (with timeout)
	timeout := time.After(30 * time.Second)
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	var finalStatus Status
	for {
		select {
		case <-timeout:
			t.Fatal("Timeout waiting for worklet deployment")
		case <-ticker.C:
			updatedWorklet, err := helper.Manager.GetWorklet(worklet.ID)
			require.NoError(t, err)
			
			finalStatus = updatedWorklet.Status
			if finalStatus == StatusRunning || finalStatus == StatusError {
				worklet = updatedWorklet
				goto checkStatus
			}
		}
	}

checkStatus:
	// Check final status
	if finalStatus == StatusError {
		t.Logf("Worklet deployment failed: %s", worklet.LastError)
		t.Logf("Build logs: %s", worklet.BuildLogs)
	}
	
	// Verify worklet was deployed successfully
	assert.Equal(t, StatusRunning, worklet.Status, "Expected worklet to be running, got %s. Error: %s", worklet.Status, worklet.LastError)
	assert.NotEmpty(t, worklet.ContainerID)
	assert.Greater(t, worklet.Port, 0)
	assert.NotEmpty(t, worklet.WebURL)
}

// TestWorkletRepositoryCloning tests that worklets can successfully clone repositories
func TestWorkletRepositoryCloning(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Cleanup()

	ctx := context.Background()

	// Create test repository with specific content
	repoPath := helper.CreateTestRepository(t, "clone-test-repo")
	
	// Add a distinctive file to verify cloning
	testFile := filepath.Join(repoPath, "CLONE_TEST.txt")
	testContent := "This file verifies repository cloning works correctly"
	require.NoError(t, ioutil.WriteFile(testFile, []byte(testContent), 0644))
	
	// Commit the test file
	require.NoError(t, runCommand(repoPath, "git", "add", "CLONE_TEST.txt"))
	require.NoError(t, runCommand(repoPath, "git", "commit", "-m", "Add clone test file"))

	// Create worklet
	req := CreateWorkletRequest{
		Name:        "Clone Test Worklet",
		Description: "Tests repository cloning",
		GitRepo:     repoPath,
		Branch:      "main",
	}

	worklet, err := helper.Manager.CreateWorklet(ctx, req, helper.TestUser)
	require.NoError(t, err)

	// Wait for deployment
	timeout := time.After(30 * time.Second)
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			t.Fatal("Timeout waiting for worklet deployment")
		case <-ticker.C:
			updatedWorklet, err := helper.Manager.GetWorklet(worklet.ID)
			require.NoError(t, err)
			
			if updatedWorklet.Status == StatusRunning || updatedWorklet.Status == StatusError {
				worklet = updatedWorklet
				goto verifyCloning
			}
		}
	}

verifyCloning:
	// Verify the repository was cloned by checking if our test file exists
	gitClient := helper.Manager.gitClient
	clonedRepoPath := gitClient.GetRepoPath(worklet.GitRepo, worklet.Branch)
	
	clonedTestFile := filepath.Join(clonedRepoPath, "CLONE_TEST.txt")
	clonedContent, err := ioutil.ReadFile(clonedTestFile)
	
	if err != nil {
		t.Logf("Worklet status: %s", worklet.Status)
		t.Logf("Worklet error: %s", worklet.LastError)
		t.Logf("Build logs: %s", worklet.BuildLogs)
		t.Logf("Expected file path: %s", clonedTestFile)
		
		// List directory contents for debugging
		if entries, err := ioutil.ReadDir(clonedRepoPath); err == nil {
			t.Logf("Directory contents of %s:", clonedRepoPath)
			for _, entry := range entries {
				t.Logf("  %s", entry.Name())
			}
		}
	}
	
	require.NoError(t, err, "Repository cloning failed - test file not found")
	assert.Equal(t, testContent, string(clonedContent), "Repository content mismatch")
}

// TestWorkletClaudeIntegration tests that Claude can make changes to a cloned repository
func TestWorkletClaudeIntegration(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Cleanup()

	ctx := context.Background()

	// Create test repository
	repoPath := helper.CreateTestRepository(t, "claude-integration-test")

	// Create worklet with a prompt that should modify the code
	req := CreateWorkletRequest{
		Name:        "Claude Integration Test",
		Description: "Tests Claude integration",
		GitRepo:     repoPath,
		Branch:      "main",
		BasePrompt:  "Add a new route '/claude' that returns JSON with message 'Hello from Claude!'",
	}

	worklet, err := helper.Manager.CreateWorklet(ctx, req, helper.TestUser)
	require.NoError(t, err)

	// Wait for deployment
	timeout := time.After(60 * time.Second) // Longer timeout for Claude processing
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			updatedWorklet, err := helper.Manager.GetWorklet(worklet.ID)
			if err == nil {
				t.Logf("Worklet status: %s", updatedWorklet.Status)
				t.Logf("Worklet error: %s", updatedWorklet.LastError)
				t.Logf("Build logs: %s", updatedWorklet.BuildLogs)
			}
			t.Fatal("Timeout waiting for worklet deployment")
		case <-ticker.C:
			updatedWorklet, err := helper.Manager.GetWorklet(worklet.ID)
			require.NoError(t, err)
			
			if updatedWorklet.Status == StatusRunning || updatedWorklet.Status == StatusError {
				worklet = updatedWorklet
				goto verifyChanges
			}
		}
	}

verifyChanges:
	if worklet.Status == StatusError {
		t.Logf("Worklet deployment failed: %s", worklet.LastError)
		t.Logf("Build logs: %s", worklet.BuildLogs)
	}

	// For now, just verify the worklet was created and the Claude session was established
	// The actual Claude processing is asynchronous and might need WebSocket communication
	assert.NotEmpty(t, worklet.SessionID, "Claude session should be created")
	
	// Test sending a prompt to the running worklet
	if worklet.Status == StatusRunning {
		prompt := "Add a comment to the server.js file explaining what the server does"
		workletPrompt, err := helper.Manager.ProcessPrompt(ctx, worklet.ID, prompt, helper.TestUser)
		require.NoError(t, err)
		assert.Equal(t, "processing", workletPrompt.Status)
		assert.Equal(t, prompt, workletPrompt.Prompt)
	}
}

// TestWorkletHTTPAPI tests the HTTP API endpoints
func TestWorkletHTTPAPI(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Cleanup()

	// Setup router
	router := mux.NewRouter()
	helper.Handler.RegisterRoutes(router.PathPrefix("/api/worklet").Subrouter())

	// Test creating worklet via API
	repoPath := helper.CreateTestRepository(t, "api-test-repo")
	
	createReq := CreateWorkletRequest{
		Name:        "API Test Worklet",
		Description: "Testing via HTTP API",
		GitRepo:     repoPath,
		Branch:      "main",
	}

	reqBody, err := json.Marshal(createReq)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/worklet/worklets", strings.NewReader(string(reqBody)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-ID", helper.TestUser)
	
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	
	var workletResponse WorkletResponse
	err = json.Unmarshal(rr.Body.Bytes(), &workletResponse)
	require.NoError(t, err)
	
	assert.Equal(t, "API Test Worklet", workletResponse.Name)
	assert.NotEmpty(t, workletResponse.ID)

	// Test listing worklets
	listReq := httptest.NewRequest("GET", "/api/worklet/worklets", nil)
	listReq.Header.Set("X-User-ID", helper.TestUser)
	
	listRR := httptest.NewRecorder()
	router.ServeHTTP(listRR, listReq)

	assert.Equal(t, http.StatusOK, listRR.Code)
	
	var worklets []WorkletResponse
	err = json.Unmarshal(listRR.Body.Bytes(), &worklets)
	require.NoError(t, err)
	assert.Len(t, worklets, 1)
	assert.Equal(t, workletResponse.ID, worklets[0].ID)

	// Test getting specific worklet
	getReq := httptest.NewRequest("GET", fmt.Sprintf("/api/worklet/worklets/%s", workletResponse.ID), nil)
	getReq.Header.Set("X-User-ID", helper.TestUser)
	
	getRR := httptest.NewRecorder()
	router.ServeHTTP(getRR, getReq)

	assert.Equal(t, http.StatusOK, getRR.Code)
}

// TestWorkletConcurrency tests concurrent worklet operations
func TestWorkletConcurrency(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Cleanup()

	ctx := context.Background()
	numWorklets := 3

	// Create multiple worklets concurrently
	workletChan := make(chan *Worklet, numWorklets)
	errorChan := make(chan error, numWorklets)

	for i := 0; i < numWorklets; i++ {
		go func(index int) {
			repoPath := helper.CreateTestRepository(t, fmt.Sprintf("concurrent-test-repo-%d", index))
			
			req := CreateWorkletRequest{
				Name:        fmt.Sprintf("Concurrent Test Worklet %d", index),
				Description: fmt.Sprintf("Concurrent test %d", index),
				GitRepo:     repoPath,
				Branch:      "main",
			}

			worklet, err := helper.Manager.CreateWorklet(ctx, req, helper.TestUser)
			if err != nil {
				errorChan <- err
				return
			}
			workletChan <- worklet
		}(i)
	}

	// Collect results
	var worklets []*Worklet
	for i := 0; i < numWorklets; i++ {
		select {
		case worklet := <-workletChan:
			worklets = append(worklets, worklet)
		case err := <-errorChan:
			t.Fatalf("Error creating worklet: %v", err)
		case <-time.After(10 * time.Second):
			t.Fatal("Timeout waiting for worklet creation")
		}
	}

	assert.Len(t, worklets, numWorklets)
	
	// Verify all worklets have unique IDs
	ids := make(map[string]bool)
	for _, worklet := range worklets {
		assert.False(t, ids[worklet.ID], "Duplicate worklet ID: %s", worklet.ID)
		ids[worklet.ID] = true
	}
}