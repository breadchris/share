package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
)

// GoogleTokenRequest represents the request to exchange auth code for token
type GoogleTokenRequest struct {
	Code        string `json:"code"`
	RedirectURI string `json:"redirect_uri"`
}

// GoogleTokenResponse represents the response from Google OAuth2 token endpoint
type GoogleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	Scope        string `json:"scope,omitempty"`
	Error        string `json:"error,omitempty"`
	ErrorDesc    string `json:"error_description,omitempty"`
}

// handleGoogleTokenExchange handles POST /api/auth/google/token
func handleGoogleTokenExchange(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	// Handle preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var req GoogleTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
		return
	}

	if req.Code == "" {
		http.Error(w, `{"error":"Authorization code is required"}`, http.StatusBadRequest)
		return
	}

	// Get environment variables
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	
	if clientID == "" || clientSecret == "" {
		http.Error(w, `{"error":"Google OAuth not configured"}`, http.StatusInternalServerError)
		return
	}

	// Prepare token exchange request
	tokenURL := "https://oauth2.googleapis.com/token"
	formData := url.Values{
		"code":          {req.Code},
		"client_id":     {clientID},
		"client_secret": {clientSecret},
		"redirect_uri":  {req.RedirectURI},
		"grant_type":    {"authorization_code"},
	}

	// Make request to Google
	resp, err := http.PostForm(tokenURL, formData)
	if err != nil {
		http.Error(w, `{"error":"Failed to exchange token"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Parse Google's response
	var tokenResp GoogleTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		http.Error(w, `{"error":"Failed to parse token response"}`, http.StatusInternalServerError)
		return
	}

	// Check for errors from Google
	if tokenResp.Error != "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": tokenResp.Error,
			"error_description": tokenResp.ErrorDesc,
		})
		return
	}

	// Return successful response
	json.NewEncoder(w).Encode(tokenResp)
}

// handleGoogleOAuthCallback handles GET /auth/google/callback
func handleGoogleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Note: code and error are handled by the JavaScript in the HTML response

	// Serve a simple HTML page that handles the callback
	html := `<!DOCTYPE html>
<html>
<head>
    <title>Google OAuth Callback</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .loading { color: #666; }
        .error { color: #d32f2f; }
    </style>
</head>
<body>
    <div id="status" class="loading">Processing authentication...</div>
    
    <script>
        async function handleCallback() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            const statusDiv = document.getElementById('status');
            
            if (error) {
                statusDiv.className = 'error';
                statusDiv.textContent = 'Authentication failed: ' + error;
                setTimeout(() => {
                    window.close();
                }, 2000);
                return;
            }
            
            if (code) {
                try {
                    // Get the redirect URI from the referrer or use default
                    const redirectUri = '%s';
                    
                    // Exchange code for token
                    const response = await fetch('/api/auth/google/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            code: code,
                            redirect_uri: redirectUri
                        }),
                    });
                    
                    const tokenData = await response.json();
                    
                    if (tokenData.access_token) {
                        // Store token and notify parent window
                        localStorage.setItem('google_access_token', tokenData.access_token);
                        
                        // Try to communicate with parent window
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'google_auth_success',
                                token: tokenData.access_token
                            }, '*');
                        }
                        
                        statusDiv.textContent = 'Authentication successful! You can close this window.';
                        setTimeout(() => {
                            window.close();
                        }, 1500);
                    } else {
                        throw new Error(tokenData.error || 'Failed to get access token');
                    }
                } catch (err) {
                    statusDiv.className = 'error';
                    statusDiv.textContent = 'Authentication failed: ' + err.message;
                    setTimeout(() => {
                        window.close();
                    }, 2000);
                }
            } else {
                statusDiv.className = 'error';
                statusDiv.textContent = 'No authorization code received';
                setTimeout(() => {
                    window.close();
                }, 2000);
            }
        }
        
        // Handle the callback when page loads
        handleCallback();
    </script>
</body>
</html>`

	// Use the current request's host to build the redirect URI
	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	redirectURI := fmt.Sprintf("%s://%s/auth/google/callback", scheme, r.Host)
	
	// Format the HTML with the redirect URI
	formattedHTML := fmt.Sprintf(html, redirectURI)
	
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(formattedHTML))
}