package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/chromedp/chromedp"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// getMobbinChromeOptions returns standardized Chrome options for Mobbin scraping
// This ensures consistent browser behavior between setup and scraping tests
func getMobbinChromeOptions(userDataDir string, headless bool) []chromedp.ExecAllocatorOption {
	return append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", headless),
		chromedp.Flag("disable-gpu", false),
		chromedp.Flag("no-sandbox", false),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-web-security", false),                    // Keep security for real login
		chromedp.Flag("disable-blink-features", "AutomationControlled"), // Avoid detection
		chromedp.Flag("exclude-switches", "enable-automation"),
		chromedp.Flag("disable-extensions", false), // Allow extensions if needed
		chromedp.Flag("disable-background-timer-throttling", false),
		chromedp.Flag("disable-backgrounding-occluded-windows", false),
		chromedp.Flag("disable-renderer-backgrounding", false),
		chromedp.UserDataDir(userDataDir), // Persistent profile directory
		chromedp.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"),
	)
}

// verifyMobbinAuthentication checks if the user is currently logged in to Mobbin
func verifyMobbinAuthentication(ctx context.Context) (bool, string, error) {
	var currentURL string
	var isAuthenticated bool

	err := chromedp.Run(ctx,
		chromedp.Navigate("https://mobbin.com"),
		chromedp.Sleep(3*time.Second),
		chromedp.Location(&currentURL),
		chromedp.Evaluate(`
			(function() {
				// Check for various authentication indicators
				const profileElements = document.querySelectorAll('[data-testid*="profile"], [class*="profile"], [class*="avatar"]');
				const logoutElements = document.querySelectorAll('[href*="logout"], [class*="logout"]');
				const discoverElements = document.querySelectorAll('[href*="discover"], [class*="browse"]');
				const loginElements = document.querySelectorAll('[href*="login"], [class*="login"]');
				
				const authIndicators = profileElements.length + logoutElements.length + discoverElements.length;
				const loginIndicators = loginElements.length;
				
				// If we're on a discover/browse page, we're likely authenticated
				const urlIndicatesAuth = window.location.href.includes('/discover') || 
				                         window.location.href.includes('/browse') ||
				                         window.location.href.includes('/apps');
				
				const isLoggedIn = authIndicators > 0 || urlIndicatesAuth;
				
				console.log('Authentication check:', {
					url: window.location.href,
					authIndicators: authIndicators,
					loginIndicators: loginIndicators,
					urlIndicatesAuth: urlIndicatesAuth,
					isLoggedIn: isLoggedIn
				});
				
				return isLoggedIn;
			})();
		`, &isAuthenticated),
	)

	return isAuthenticated, currentURL, err
}

// TestSetupMobbinChromeProfile sets up a Chrome browser profile with persistent login
// for Mobbin.com authentication. This should be run first to establish a logged-in session.
func TestSetupMobbinChromeProfile(t *testing.T) {
	// Create a dedicated profile directory for Mobbin scraping
	userDataDir := "./data/chrome-profile/mobbin-scraper"
	if err := os.MkdirAll(userDataDir, 0755); err != nil {
		t.Fatalf("Failed to create Chrome profile directory: %v", err)
	}

	fmt.Println("🌐 Setting up Chrome profile for Mobbin authentication...")
	fmt.Println("📝 This test will:")
	fmt.Println("   1. Open a Chrome browser window")
	fmt.Println("   2. Navigate to https://mobbin.com/login")
	fmt.Println("   3. Wait for you to manually log in")
	fmt.Println("   4. Monitor for successful login (redirect to discover page)")
	fmt.Println("   5. Save the authenticated session for future scraping")
	fmt.Println()

	// Configure Chrome with persistent profile using shared configuration
	opts := getMobbinChromeOptions(userDataDir, false) // false = not headless for manual login

	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	// Extended timeout for manual login process
	ctx, cancel = context.WithTimeout(ctx, 600*time.Second) // 10 minutes
	defer cancel()

	var currentURL string
	var loginSuccess bool

	fmt.Println("🚀 Opening browser for Mobbin login...")

	err := chromedp.Run(ctx,
		// Navigate to Mobbin login page
		chromedp.Navigate("https://mobbin.com/login"),

		// Wait for page to load
		chromedp.Sleep(3*time.Second),

		// Log initial state
		chromedp.Evaluate(`
			console.log('=== MOBBIN LOGIN SETUP ===');
			console.log('Current URL:', window.location.href);
			console.log('Page title:', document.title);
			console.log('Please log in to your Mobbin account in this browser window');
		`, nil),
	)

	if err != nil {
		t.Fatalf("Failed to navigate to Mobbin login: %v", err)
	}

	fmt.Println("⏳ Please log in to your Mobbin account in the browser window...")
	fmt.Println("💡 The test will automatically detect when you're successfully logged in")
	fmt.Println("🎯 Looking for redirect to: https://mobbin.com/discover/apps/ios/latest")
	fmt.Println()

	// Monitor for successful login by checking URL changes
	for i := 0; i < 120; i++ { // Check for up to 10 minutes (120 * 5 seconds)
		err = chromedp.Run(ctx,
			chromedp.Location(&currentURL),
			chromedp.Evaluate(`
				(function() {
					const url = window.location.href;
					const isDiscoverPage = url.includes('/discover/apps/ios/latest');
					const isLoggedIn = url.includes('/discover') || 
					                  document.querySelector('[data-testid*="profile"]') ||
					                  document.querySelector('[class*="profile"]') ||
					                  document.querySelector('[href*="logout"]');
					
					return isDiscoverPage;
				})();
			`, &loginSuccess),
		)

		if err != nil {
			fmt.Printf("Warning: Error checking login status: %v\n", err)
			continue
		}

		// Check if we've reached the target discover page
		if strings.Contains(currentURL, "/discover/apps/ios/latest") || loginSuccess {
			fmt.Printf("✅ Login successful! Detected redirect to: %s\n", currentURL)
			break
		}

		// Check for other successful login indicators
		if strings.Contains(currentURL, "/discover") || strings.Contains(currentURL, "/browse") {
			fmt.Printf("✅ Login successful! Detected authenticated page: %s\n", currentURL)
			break
		}

		// Provide periodic feedback to user
		if i%12 == 0 && i > 0 { // Every minute
			fmt.Printf("⏳ Still waiting for login... Current URL: %s\n", currentURL)
			fmt.Println("   Please complete the login process in the browser window")
		} else if i%4 == 0 { // Every 20 seconds, show a dot for progress
			fmt.Print(".")
		}

		time.Sleep(5 * time.Second)
	}

	// Final verification
	err = chromedp.Run(ctx,
		chromedp.Location(&currentURL),
		chromedp.Evaluate(`
			console.log('=== FINAL LOGIN VERIFICATION ===');
			console.log('Final URL:', window.location.href);
			console.log('Page title:', document.title);
			
			// Check for various login success indicators
			const profileElements = document.querySelectorAll('[data-testid*="profile"], [class*="profile"], [class*="avatar"]');
			const logoutElements = document.querySelectorAll('[href*="logout"], [class*="logout"]');
			const discoverContent = document.querySelectorAll('[class*="discover"], [class*="browse"]');
			
			const authIndicators = profileElements.length + logoutElements.length + discoverContent.length;
			console.log('Authentication indicators found:', authIndicators);
			
			const finalSuccess = authIndicators > 0 || 
			                    window.location.href.includes('/discover') ||
			                    window.location.href.includes('/browse');
			                    
			console.log('Login verification result:', finalSuccess);
			finalSuccess;
		`, &loginSuccess),
	)

	if err != nil {
		t.Fatalf("Failed to verify login status: %v", err)
	}

	if loginSuccess || strings.Contains(currentURL, "/discover") || strings.Contains(currentURL, "/browse") {
		fmt.Println()
		fmt.Println("🎉 Chrome profile setup completed successfully!")
		fmt.Printf("📁 Profile saved to: %s\n", userDataDir)
		fmt.Printf("🌐 Final URL: %s\n", currentURL)

		// Double-check authentication one more time
		fmt.Println("🔍 Performing final authentication verification...")
		finalAuth, finalURL, err := verifyMobbinAuthentication(ctx)
		if err != nil {
			fmt.Printf("⚠️  Warning: Could not perform final verification: %v\n", err)
		} else if finalAuth {
			fmt.Printf("✅ Final verification successful! URL: %s\n", finalURL)
		} else {
			fmt.Printf("⚠️  Final verification shows potential issue. URL: %s\n", finalURL)
		}

		fmt.Println()
		fmt.Println("✅ You can now run scraping tests that will use this authenticated session")
		fmt.Println()
		fmt.Println("💡 Next steps:")
		fmt.Println("   1. Run TestScrapeMobbinWithExtensionLogic to scrape with this authenticated profile")
		fmt.Println("   2. The profile will persist between test runs")
		fmt.Println("   3. Re-run this setup if you need to refresh the authentication")
		fmt.Println()
		fmt.Println("📋 Test command:")
		fmt.Println("   go test -v -run TestScrapeMobbinWithExtensionLogic -timeout 10m .")
	} else {
		fmt.Println()
		fmt.Println("❌ Login setup may not have completed successfully")
		fmt.Printf("🌐 Current URL: %s\n", currentURL)
		fmt.Println("🔄 You may need to:")
		fmt.Println("   1. Try running this test again")
		fmt.Println("   2. Ensure you complete the full login process")
		fmt.Println("   3. Check that you're redirected to a Mobbin authenticated page")
		fmt.Println("   4. Make sure you see content that requires authentication")
		t.Fatalf("Login setup did not complete successfully")
	}

	// Keep browser open briefly for final verification
	fmt.Println("⏳ Keeping browser open for 10 seconds for final verification...")
	time.Sleep(10 * time.Second)
}

// Helper function to download images with proper headers
func downloadImageWithHeaders(url, outputDir, filename string) error {
	// Create HTTP client with timeout and proper headers
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Create request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	// Add headers similar to browser request
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Referer", "https://mobbin.com/")
	req.Header.Set("Sec-Fetch-Dest", "image")
	req.Header.Set("Sec-Fetch-Mode", "no-cors")
	req.Header.Set("Sec-Fetch-Site", "cross-site")

	// Make request
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	// Determine file extension from content type or URL
	ext := filepath.Ext(url)
	if ext == "" || ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" {
		// Use extension from URL if it's an image extension
	} else {
		// Determine from content type
		contentType := resp.Header.Get("Content-Type")
		switch contentType {
		case "image/jpeg", "image/jpg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/gif":
			ext = ".gif"
		case "image/webp":
			ext = ".webp"
		case "image/svg+xml":
			ext = ".svg"
		default:
			ext = ".jpg" // default
		}
	}

	// Create file
	filePath := filepath.Join(outputDir, filename+ext)
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	// Copy response body to file
	_, err = io.Copy(file, resp.Body)
	return err
}

// TestScrapeMobbinWithExtensionLogic integrates the browser extension's content script
// logic for slow scrolling and dynamic image capture during the scraping process
func TestScrapeMobbinWithExtensionLogic(t *testing.T) {
	// Target URL for testing - can be changed to any Mobbin URL
	targetURL := "https://mobbin.com/apps/origin-ios-64b7dd15-3fac-4131-8afb-b8660a29b98d/dc546033-0a54-461e-8473-1fb5f56ce297/screens"

	// Extract page metadata first (will create dynamic directory after getting title)
	fmt.Println("🎯 Target URL:", targetURL)

	// Use the same persistent profile directory that was set up in TestSetupMobbinChromeProfile
	userDataDir := "./data/chrome-profile/mobbin-scraper"
	if _, err := os.Stat(userDataDir); os.IsNotExist(err) {
		t.Fatalf("Chrome profile not found at %s. Please run TestSetupMobbinChromeProfile first to set up authentication.", userDataDir)
	}

	fmt.Printf("🔗 Using authenticated Chrome profile from: %s\n", userDataDir)

	// Use shared Chrome configuration for consistent session behavior
	opts := getMobbinChromeOptions(userDataDir, false) // false = visible for debugging

	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	// Extended timeout for slow scrolling process
	ctx, cancel = context.WithTimeout(ctx, 180*time.Second)
	defer cancel()

	type ScrapingResult struct {
		HTML             string                 `json:"html"`
		DiscoveredImages []DiscoveredImageJS    `json:"discoveredImages"`
		ImageCount       int                    `json:"imageCount"`
		ScrollMetrics    map[string]interface{} `json:"scrollMetrics"`
	}

	var result ScrapingResult

	fmt.Println("🌐 Starting enhanced mobbin scraper with extension logic...")
	fmt.Printf("🎯 Target URL: %s\n", targetURL)

	// First, verify authentication status
	fmt.Println("🔐 Verifying authentication status...")
	isAuthenticated, currentURL, err := verifyMobbinAuthentication(ctx)
	if err != nil {
		t.Fatalf("Failed to verify authentication: %v", err)
	}

	if !isAuthenticated {
		fmt.Printf("❌ Authentication verification failed!\n")
		fmt.Printf("📍 Current URL: %s\n", currentURL)
		fmt.Println("🔄 Please run TestSetupMobbinChromeProfile again to re-authenticate")
		fmt.Println("💡 This can happen if:")
		fmt.Println("   - Your session has expired")
		fmt.Println("   - Cookies were cleared")
		fmt.Println("   - Mobbin changed their authentication system")
		t.Fatalf("Not authenticated - please re-run setup test")
	}

	fmt.Printf("✅ Authentication verified! Current URL: %s\n", currentURL)
	fmt.Println("🚀 Proceeding with authenticated scraping...")

	// Navigate and extract page metadata for dynamic directory creation
	var pageMetadata PageMetadata

	err = chromedp.Run(ctx,
		// Navigate to the target URL
		chromedp.Navigate(targetURL),

		// Wait for initial page load
		chromedp.Sleep(5*time.Second),

		// Extract page metadata for slug-based organization
		chromedp.Evaluate(`
			(function() {
				// Extract title from the page
				let title = document.title || '';
				
				// Try to get app name from various selectors (Mobbin-specific)
				let appName = '';
				
				// Try multiple selectors for app name
				const appSelectors = [
					'h1[data-testid="app-name"]',
					'h1.text-2xl',
					'.app-header h1',
					'[data-testid="app-title"]',
					'h1'
				];
				
				for (const selector of appSelectors) {
					const element = document.querySelector(selector);
					if (element && element.textContent.trim()) {
						appName = element.textContent.trim();
						break;
					}
				}
				
				// Extract platform and category if available
				let platform = '';
				let category = '';
				
				// Try to get platform from URL or page content
				const url = window.location.href;
				if (url.includes('/ios/')) platform = 'iOS';
				else if (url.includes('/android/')) platform = 'Android';
				else if (url.includes('/web/')) platform = 'Web';
				
				// Try to get category from breadcrumbs or meta
				const categorySelectors = [
					'[data-testid="category"]',
					'.breadcrumb .category',
					'meta[name="category"]'
				];
				
				for (const selector of categorySelectors) {
					const element = document.querySelector(selector);
					if (element) {
						category = element.textContent || element.getAttribute('content') || '';
						if (category.trim()) break;
					}
				}
				
				return {
					title: title,
					appName: appName,
					url: url,
					platform: platform,
					category: category,
					timestamp: new Date().toISOString()
				};
			})()
		`, &pageMetadata),
	)

	if err != nil {
		t.Fatalf("Failed to navigate and extract metadata: %v", err)
	}

	// Process the extracted metadata and create slug-based directory
	// Use app name if available, otherwise fall back to page title
	slugSource := pageMetadata.AppName
	if slugSource == "" {
		slugSource = pageMetadata.Title
	}
	pageMetadata.Slug = createSlugFromTitle(slugSource)

	// Create dynamic output directory based on page slug
	outputDir := filepath.Join("data", "scrape", "mobbin.com", pageMetadata.Slug)

	// Create the output directory
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		t.Fatalf("Failed to create output directory %s: %v", outputDir, err)
	}

	fmt.Printf("📋 Page Metadata:\n")
	fmt.Printf("   Title: %s\n", pageMetadata.Title)
	fmt.Printf("   App Name: %s\n", pageMetadata.AppName)
	fmt.Printf("   Slug: %s\n", pageMetadata.Slug)
	fmt.Printf("   Platform: %s\n", pageMetadata.Platform)
	fmt.Printf("   Category: %s\n", pageMetadata.Category)
	fmt.Printf("📁 Output Directory: %s\n", outputDir)

	// Save page metadata to output directory
	metadataPath := filepath.Join(outputDir, "page_metadata.json")
	metadataJSON, err := json.MarshalIndent(pageMetadata, "", "  ")
	if err != nil {
		t.Fatalf("Failed to marshal page metadata: %v", err)
	}

	if err := os.WriteFile(metadataPath, metadataJSON, 0644); err != nil {
		t.Fatalf("Failed to save page metadata: %v", err)
	}

	fmt.Printf("💾 Saved page metadata to: %s\n", metadataPath)

	// Continue with scraping process
	err = chromedp.Run(ctx,
		// Check if we're still authenticated after navigation
		chromedp.Evaluate(`
			console.log('=== POST-NAVIGATION AUTH CHECK ===');
			console.log('Current URL after navigation:', window.location.href);
			console.log('Page title:', document.title);
			
			// Check for login redirect
			if (window.location.href.includes('/login')) {
				console.log('🚨 REDIRECTED TO LOGIN PAGE - Authentication may have failed!');
			} else {
				console.log('✅ Not on login page - likely still authenticated');
			}
			
			// Count images to verify content
			const imageCount = document.querySelectorAll('img').length;
			console.log('Images found on target page:', imageCount);
		`, nil),

		// Inject extension content script logic
		chromedp.Evaluate(getExtensionContentScript(), nil),

		// Wait longer for the script to initialize properly
		chromedp.Sleep(5*time.Second),

		// Validate that extension functions are loaded
		chromedp.Evaluate(`
			console.log('🔍 Validating extension functions...');
			console.log('discoveredImages array:', typeof window.discoveredImages);
			console.log('extensionScrollAndCapture function:', typeof window.extensionScrollAndCapture);
			console.log('captureImageMetadata function:', typeof window.captureImageMetadata);
			
			if (typeof window.extensionScrollAndCapture !== 'function') {
				console.error('❌ Extension scroll function not loaded!');
			} else {
				console.log('✅ Extension functions loaded successfully');
			}
		`, nil),
	)

	if err != nil {
		t.Fatalf("Failed to inject and validate extension script: %v", err)
	}

	// Now execute the scrolling process step by step with proper error handling
	fmt.Println("🚀 Starting enhanced scraping process...")

	// Get initial page state
	var initialMetrics map[string]interface{}
	err = chromedp.Run(ctx,
		chromedp.Evaluate(`
			console.log('📊 Collecting initial page metrics...');
			const metrics = {
				height: document.body.scrollHeight,
				images: document.querySelectorAll('img').length,
				discoveredImages: window.discoveredImages ? window.discoveredImages.length : 0,
				scrollTop: (document.scrollingElement || document.body).scrollTop,
				clientHeight: (document.scrollingElement || document.body).clientHeight
			};
			console.log('Initial metrics:', metrics);
			metrics;
		`, &initialMetrics),
	)

	if err != nil {
		t.Fatalf("Failed to get initial page metrics: %v", err)
	}

	fmt.Printf("📊 Initial state: Height=%v, Images=%v, Discovered=%v\n",
		initialMetrics["height"], initialMetrics["images"], initialMetrics["discoveredImages"])

	// Execute scrolling with progress monitoring
	fmt.Println("📜 Starting extension-style scrolling...")

	// Start the scrolling process
	err = chromedp.Run(ctx,
		chromedp.Evaluate(`
			// Set up progress tracking
			window.scrollProgress = {
				completed: false,
				error: null,
				stepCount: 0,
				lastUpdate: Date.now()
			};
			
			// Execute scrolling asynchronously but track progress synchronously
			if (typeof window.extensionScrollAndCapture === 'function') {
				console.log('🚀 Launching extension scroll function...');
				window.extensionScrollAndCapture(window.location.href)
					.then(() => {
						console.log('✅ Scrolling completed successfully');
						window.scrollProgress.completed = true;
						window.scrollProgress.lastUpdate = Date.now();
					})
					.catch((error) => {
						console.error('❌ Scrolling failed:', error);
						window.scrollProgress.error = error.message;
						window.scrollProgress.lastUpdate = Date.now();
					});
				console.log('📡 Scroll process initiated, will monitor progress...');
			} else {
				console.error('❌ Extension scroll function not available!');
				window.scrollProgress.error = 'Extension scroll function not loaded';
			}
		`, nil),
	)

	if err != nil {
		t.Fatalf("Failed to start scrolling process: %v", err)
	}

	// Monitor scrolling progress with timeout
	fmt.Println("⏳ Monitoring scroll progress...")
	scrollTimeout := time.Now().Add(180 * time.Second) // 3 minutes timeout

	for time.Now().Before(scrollTimeout) {
		var progress map[string]interface{}
		err = chromedp.Run(ctx,
			chromedp.Evaluate(`window.scrollProgress`, &progress),
		)

		if err != nil {
			fmt.Printf("Warning: Failed to check scroll progress: %v\n", err)
			break
		}

		if progress["completed"] == true {
			fmt.Println("✅ Scrolling completed successfully!")
			break
		}

		if progress["error"] != nil {
			fmt.Printf("⚠️  Extension scrolling failed: %v\n", progress["error"])
			fmt.Println("🔄 Attempting fallback scroll method...")

			// Fallback to simple scroll method
			err = chromedp.Run(ctx,
				chromedp.Evaluate(`
					console.log('🚀 Starting fallback scroll method...');
					const scrollingEl = document.scrollingElement || document.body;
					const initialHeight = scrollingEl.scrollHeight;
					const scrollStep = 300;
					let scrolled = 0;
					
					// Simple scroll to bottom
					while (scrollingEl.scrollTop < scrollingEl.scrollHeight - scrollingEl.clientHeight && scrolled < 50) {
						scrollingEl.scrollTop += scrollStep;
						scrolled++;
						console.log('Fallback scroll step:', scrolled, 'scrollTop:', scrollingEl.scrollTop);
						
						// Give time for content to load
						await new Promise(resolve => setTimeout(resolve, 500));
					}
					
					console.log('✅ Fallback scroll completed, steps:', scrolled);
					
					// Capture all visible images
					const images = document.querySelectorAll('img');
					if (!window.discoveredImages) window.discoveredImages = [];
					
					images.forEach(img => {
						if (img.complete && img.naturalWidth > 50 && img.naturalHeight > 50) {
							const existing = window.discoveredImages.find(existing => existing.src === img.src);
							if (!existing) {
								window.discoveredImages.push({
									src: img.src,
									alt: img.alt || '',
									width: img.naturalWidth || img.width || 0,
									height: img.naturalHeight || img.height || 0,
									loading: img.loading || 'eager',
									timestamp: Date.now(),
									loadedDuringScroll: true
								});
								console.log('Captured fallback image:', img.src);
							}
						}
					});
					
					console.log('Fallback method found', window.discoveredImages.length, 'total images');
				`, nil),
			)

			if err != nil {
				t.Fatalf("❌ Both extension and fallback scroll methods failed: %v", err)
			}

			fmt.Println("✅ Fallback scroll method completed")
			break
		}

		// Show progress every 10 seconds
		if progress["stepCount"] != nil {
			fmt.Printf("📊 Scroll progress: %v steps completed\n", progress["stepCount"])
		}

		time.Sleep(5 * time.Second)
	}

	if time.Now().After(scrollTimeout) {
		fmt.Println("⚠️  Scroll timeout reached, collecting current results...")
	}

	// Collect final results
	err = chromedp.Run(ctx,
		chromedp.Evaluate(`
			console.log('🔍 Collecting final results...');
			
			// Get final page state
			const finalHeight = document.body.scrollHeight;
			const finalImageCount = document.querySelectorAll('img').length;
			const discoveredCount = window.discoveredImages ? window.discoveredImages.length : 0;
			
			console.log('📊 Final state:', {
				height: finalHeight,
				images: finalImageCount,
				discoveredImages: discoveredCount
			});
			
			// Return comprehensive results
			const result = {
				html: document.documentElement.outerHTML,
				discoveredImages: window.discoveredImages || [],
				imageCount: discoveredCount,
				scrollMetrics: {
					initialHeight: window.initialHeight || 0,
					finalHeight: finalHeight,
					initialImageCount: window.initialImages || 0,
					finalImageCount: finalImageCount,
					dynamicImagesFound: window.discoveredImages ? 
						window.discoveredImages.filter(img => img.loadedDuringScroll).length : 0
				}
			};
			
			console.log('📦 Results packaged:', {
				imageCount: result.imageCount,
				scrollMetrics: result.scrollMetrics
			});
			
			result;
		`, &result),

		// Pass initial metrics as separate evaluation
		chromedp.Evaluate(fmt.Sprintf(`
			// Set initial metrics for comparison
			window.initialHeight = %v;
			window.initialImages = %v;
		`, initialMetrics["height"], initialMetrics["images"]), nil),
	)

	if err != nil {
		t.Fatalf("Failed to execute enhanced scraping: %v", err)
	}

	// Save comprehensive results
	fmt.Printf("✅ Scraping completed successfully!\n")
	fmt.Printf("📊 Results:\n")
	fmt.Printf("   - Discovered images: %d\n", result.ImageCount)
	fmt.Printf("   - Initial height: %.0f px\n", result.ScrollMetrics["initialHeight"])
	fmt.Printf("   - Final height: %.0f px\n", result.ScrollMetrics["finalHeight"])
	fmt.Printf("   - Dynamic images: %.0f\n", result.ScrollMetrics["dynamicImagesFound"])

	// Save HTML content
	htmlFile := filepath.Join(outputDir, "page_content_extension.html")
	if err := os.WriteFile(htmlFile, []byte(result.HTML), 0644); err != nil {
		fmt.Printf("Warning: Failed to save HTML content: %v\n", err)
	} else {
		fmt.Printf("📄 Saved HTML to: %s\n", htmlFile)
	}

	// Save discovered images metadata
	metadataFile := filepath.Join(outputDir, "discovered_images.json")
	imagesJSON, err := json.MarshalIndent(result.DiscoveredImages, "", "  ")
	if err != nil {
		fmt.Printf("Warning: Failed to marshal metadata: %v\n", err)
	} else {
		if err := os.WriteFile(metadataFile, imagesJSON, 0644); err != nil {
			fmt.Printf("Warning: Failed to save metadata: %v\n", err)
		} else {
			fmt.Printf("📋 Saved metadata to: %s\n", metadataFile)
		}
	}

	// Save comprehensive results
	resultsFile := filepath.Join(outputDir, "scraping_results.json")
	resultsJSON, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Printf("Warning: Failed to marshal results: %v\n", err)
	} else {
		if err := os.WriteFile(resultsFile, resultsJSON, 0644); err != nil {
			fmt.Printf("Warning: Failed to save results: %v\n", err)
		} else {
			fmt.Printf("💾 Saved complete results to: %s\n", resultsFile)
		}
	}

	// Download images using discovered metadata
	if len(result.DiscoveredImages) > 0 {
		fmt.Printf("\n🖼️  Downloading %d discovered images...\n", len(result.DiscoveredImages))
		downloadedCount := 0

		for i, imgData := range result.DiscoveredImages {
			// Make URL absolute if needed
			imgURL := imgData.Src
			if !strings.HasPrefix(imgURL, "http") {
				baseURL, _ := url.Parse(targetURL)
				imgURLParsed, err := baseURL.Parse(imgURL)
				if err != nil {
					fmt.Printf("Error parsing relative URL %s: %v\n", imgURL, err)
					continue
				}
				imgURL = imgURLParsed.String()
			}

			// Create enhanced filename with metadata
			filename := fmt.Sprintf("extension_img_%03d_%dx%d", i+1, imgData.Width, imgData.Height)
			if imgData.LoadedDuringScroll {
				filename += "_dynamic"
			} else {
				filename += "_static"
			}

			if err := downloadImageWithHeaders(imgURL, outputDir, filename); err != nil {
				fmt.Printf("Failed to download image %s: %v\n", imgURL, err)
			} else {
				downloadedCount++
				fmt.Printf("✅ Downloaded [%d/%d]: %dx%d %s\n",
					downloadedCount, len(result.DiscoveredImages),
					imgData.Width, imgData.Height, imgURL)
			}
		}

		fmt.Printf("\n🎉 Successfully downloaded %d out of %d images\n", downloadedCount, len(result.DiscoveredImages))
	} else {
		fmt.Println("⚠️  No images were discovered during scraping")
	}

	fmt.Printf("📁 All files saved to: %s\n", outputDir)
}

// DiscoveredImageJS represents the JavaScript image metadata structure
type DiscoveredImageJS struct {
	Src                string `json:"src"`
	Alt                string `json:"alt"`
	Width              int    `json:"width"`
	Height             int    `json:"height"`
	Loading            string `json:"loading"`
	Timestamp          int64  `json:"timestamp"`
	LoadedDuringScroll bool   `json:"loadedDuringScroll"`
}

// ExtensionScrapeResult contains comprehensive results from extension-based scraping
type ExtensionScrapeResult struct {
	URL              string                 `json:"url"`
	Success          bool                   `json:"success"`
	Skipped          bool                   `json:"skipped"`
	Error            string                 `json:"error,omitempty"`
	Metadata         PageMetadata           `json:"metadata"`
	OutputDirectory  string                 `json:"outputDirectory"`
	HTML             string                 `json:"html,omitempty"`
	DiscoveredImages []DiscoveredImageJS    `json:"discoveredImages"`
	ImageCount       int                    `json:"imageCount"`
	DownloadedCount  int                    `json:"downloadedCount"`
	ScrollMetrics    map[string]interface{} `json:"scrollMetrics"`
	ProcessingTime   time.Duration          `json:"processingTime"`
	MaxScrolls       int                    `json:"maxScrolls"`
}

// scrapeMobbinPageWithExtension scrapes a Mobbin page using extension logic with configurable settings
func scrapeMobbinPageWithExtension(ctx context.Context, targetURL string, maxScrolls int, outputBaseDir string) (*ExtensionScrapeResult, error) {
	startTime := time.Now()

	// Initialize result
	result := &ExtensionScrapeResult{
		URL:        targetURL,
		Success:    false,
		MaxScrolls: maxScrolls,
	}

	fmt.Printf("🎯 Starting extension-based scrape of: %s (maxScrolls: %d)\n", targetURL, maxScrolls)

	// Extract slug from URL for deduplication
	slug := createSlugFromURL(targetURL)

	// Check if already scraped
	outputDir := filepath.Join(outputBaseDir, slug)
	if isSlugAlreadyScrapedExtension(slug) {
		fmt.Printf("⏭️  Skipping already scraped app: %s\n", slug)
		result.Success = true
		result.Skipped = true
		result.Metadata = PageMetadata{Slug: slug}
		result.OutputDirectory = outputDir
		result.ProcessingTime = time.Since(startTime)
		return result, nil
	}

	// Create output directory
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		result.Error = fmt.Sprintf("Failed to create output directory: %v", err)
		return result, fmt.Errorf("failed to create output directory: %w", err)
	}
	result.OutputDirectory = outputDir

	// Navigate and verify authentication
	fmt.Println("🔐 Navigating and verifying authentication...")
	err := chromedp.Run(ctx,
		chromedp.Navigate(targetURL),
		chromedp.Sleep(3*time.Second),
	)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to navigate: %v", err)
		return result, err
	}

	// Check if redirected to login
	var currentURL string
	err = chromedp.Run(ctx,
		chromedp.Location(&currentURL),
		chromedp.Evaluate(`window.location.href.includes('/login')`, &result.Skipped),
	)
	if result.Skipped {
		result.Error = "Redirected to login page - authentication required"
		return result, fmt.Errorf("authentication required")
	}

	// Extract page metadata
	var pageMetadata PageMetadata
	err = chromedp.Run(ctx,
		chromedp.Evaluate(`
			(function() {
				let title = document.title || '';
				let appName = '';
				let platform = '';
				let category = '';
				
				// Extract app name from URL or page
				const url = window.location.href;
				const urlParts = url.split('/');
				if (urlParts.includes('apps') && urlParts.length > 4) {
					appName = urlParts[4].replace(/-web-.*/, '').replace(/-ios-.*/, '').replace(/-android-.*/, '').replace(/-/g, ' ');
				}
				
				// Try to get platform from URL
				if (url.includes('-web-')) platform = 'web';
				else if (url.includes('-ios-')) platform = 'ios';  
				else if (url.includes('-android-')) platform = 'android';
				
				// Try to extract category from page content
				const categorySelectors = [
					'[data-testid="category"]',
					'.category',
					'[class*="category"]'
				];
				
				for (const selector of categorySelectors) {
					const element = document.querySelector(selector);
					if (element) {
						category = element.textContent || element.getAttribute('content') || '';
						if (category.trim()) break;
					}
				}
				
				return {
					title: title,
					appName: appName,
					url: url,
					platform: platform,
					category: category,
					timestamp: new Date().toISOString()
				};
			})()
		`, &pageMetadata),
	)

	if err != nil {
		result.Error = fmt.Sprintf("Failed to extract metadata: %v", err)
		return result, err
	}

	pageMetadata.Slug = slug
	result.Metadata = pageMetadata

	fmt.Printf("📋 Page Metadata: %s (%s)\n", pageMetadata.AppName, pageMetadata.Platform)

	// Inject extension script with custom maxScrolls
	fmt.Printf("💉 Injecting extension script with maxScrolls=%d...\n", maxScrolls)
	err = chromedp.Run(ctx,
		chromedp.Evaluate(getExtensionContentScriptWithMaxScrolls(maxScrolls), nil),
		chromedp.Sleep(2*time.Second),
	)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to inject extension script: %v", err)
		return result, err
	}

	// Start scrolling and capturing
	fmt.Println("📜 Starting scrolling and image capture...")
	err = chromedp.Run(ctx,
		chromedp.Evaluate(`
			window.scrollProgress = {
				completed: false,
				error: null,
				stepCount: 0,
				lastUpdate: Date.now()
			};
			
			window.extensionDiscovery = {
				scrolling: true,
				completed: false,
				totalScrolls: 0,
				imageCount: 0
			};
			
			// Start scrolling
			if (typeof window.extensionScrollAndCapture === 'function') {
				window.extensionScrollAndCapture(window.location.href)
					.then(() => {
						window.scrollProgress.completed = true;
						window.extensionDiscovery.completed = true;
						window.extensionDiscovery.scrolling = false;
					})
					.catch((error) => {
						window.scrollProgress.error = error.message;
						window.extensionDiscovery.completed = true;
						window.extensionDiscovery.scrolling = false;
					});
			}
		`, nil),
	)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to start scrolling: %v", err)
		return result, err
	}

	// Monitor progress
	timeout := time.After(time.Duration(maxScrolls*2) * time.Second) // 2 seconds per scroll max
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			fmt.Println("⏰ Scrolling timeout reached")
			goto finishScrolling

		case <-ticker.C:
			var progress struct {
				Completed    bool   `json:"completed"`
				TotalScrolls int    `json:"totalScrolls"`
				ImageCount   int    `json:"imageCount"`
				Error        string `json:"error"`
			}

			err := chromedp.Run(ctx, chromedp.Evaluate(`({
				completed: window.scrollProgress ? window.scrollProgress.completed : false,
				totalScrolls: window.extensionDiscovery ? window.extensionDiscovery.totalScrolls : 0,
				imageCount: window.discoveredImages ? window.discoveredImages.length : 0,
				error: window.scrollProgress ? window.scrollProgress.error : null
			})`, &progress))

			if err != nil {
				fmt.Printf("⚠️  Error checking progress: %v\n", err)
				goto finishScrolling
			}

			fmt.Printf("📊 Progress: %d scrolls, %d images\n", progress.TotalScrolls, progress.ImageCount)

			if progress.Error != "" {
				result.Error = progress.Error
				goto finishScrolling
			}

			if progress.Completed {
				fmt.Println("✅ Scrolling completed")
				goto finishScrolling
			}
		}
	}

finishScrolling:
	// Collect results
	err = chromedp.Run(ctx,
		// Get HTML
		chromedp.OuterHTML("html", &result.HTML),

		// Get discovered images
		chromedp.Evaluate(`window.discoveredImages || []`, &result.DiscoveredImages),

		// Get scroll metrics
		chromedp.Evaluate(`({
			totalScrolls: window.extensionDiscovery ? window.extensionDiscovery.totalScrolls : 0,
			finalHeight: document.body.scrollHeight,
			viewportHeight: window.innerHeight,
			completed: window.extensionDiscovery ? window.extensionDiscovery.completed : false
		})`, &result.ScrollMetrics),
	)

	if err != nil {
		result.Error = fmt.Sprintf("Failed to collect results: %v", err)
		return result, err
	}

	result.ImageCount = len(result.DiscoveredImages)
	fmt.Printf("📸 Discovered %d images\n", result.ImageCount)

	// Save HTML
	htmlFile := filepath.Join(outputDir, "page_content_extension.html")
	if err := os.WriteFile(htmlFile, []byte(result.HTML), 0644); err != nil {
		fmt.Printf("⚠️  Failed to save HTML: %v\n", err)
	}

	// Save metadata
	metadataFile := filepath.Join(outputDir, "page_metadata.json")
	if metadataJSON, err := json.MarshalIndent(pageMetadata, "", "  "); err == nil {
		os.WriteFile(metadataFile, metadataJSON, 0644)
	}

	// Save discovered images
	imagesFile := filepath.Join(outputDir, "discovered_images.json")
	if imagesJSON, err := json.MarshalIndent(result.DiscoveredImages, "", "  "); err == nil {
		os.WriteFile(imagesFile, imagesJSON, 0644)
	}

	// Download images
	if len(result.DiscoveredImages) > 0 {
		fmt.Printf("💾 Downloading %d images...\n", len(result.DiscoveredImages))
		downloadedCount := 0

		for i, imgData := range result.DiscoveredImages {
			// Make URL absolute if needed
			imgURL := imgData.Src
			if !strings.HasPrefix(imgURL, "http") {
				if baseURL, err := url.Parse(targetURL); err == nil {
					if imgURLParsed, err := baseURL.Parse(imgURL); err == nil {
						imgURL = imgURLParsed.String()
					}
				}
			}

			// Create filename
			filename := fmt.Sprintf("img_%03d_%dx%d", i+1, imgData.Width, imgData.Height)
			if imgData.LoadedDuringScroll {
				filename += "_dynamic"
			} else {
				filename += "_static"
			}

			if err := downloadImageWithHeaders(imgURL, outputDir, filename); err == nil {
				downloadedCount++
			}
		}

		result.DownloadedCount = downloadedCount
		fmt.Printf("✅ Downloaded %d/%d images\n", downloadedCount, len(result.DiscoveredImages))
	}

	// Save scraping results
	result.Success = true
	result.ProcessingTime = time.Since(startTime)

	resultsFile := filepath.Join(outputDir, "scraping_results.json")
	if resultsJSON, err := json.MarshalIndent(result, "", "  "); err == nil {
		os.WriteFile(resultsFile, resultsJSON, 0644)
	}

	return result, nil
}

// getExtensionContentScriptWithMaxScrolls returns the JavaScript code with configurable max scrolls
func getExtensionContentScriptWithMaxScrolls(maxScrolls int) string {
	return fmt.Sprintf(`
// Extension Content Script Logic with configurable maxScrolls
// This implements the same functionality as the browser extension

// Global variables for image tracking
window.discoveredImages = [];

// Image capture system from extension content.js
window.captureImageMetadata = function(img) {
	// Filter out tiny images and tracking pixels
	const minSize = 50;
	if (img.naturalWidth < minSize || img.naturalHeight < minSize) {
		return null;
	}
	
	// Skip if already captured
	if (window.discoveredImages.some(existing => existing.src === img.src)) {
		return null;
	}
	
	const imageData = {
		src: img.src,
		alt: img.alt || '',
		width: img.naturalWidth || img.width || 0,
		height: img.naturalHeight || img.height || 0,
		loading: img.loading || 'eager',
		timestamp: Date.now(),
		loadedDuringScroll: true
	};
	
	window.discoveredImages.push(imageData);
	console.log('🖼️  Captured new image:', imageData.src, imageData.width + 'x' + imageData.height);
	return imageData;
};

window.captureNewImages = function(node) {
	if (node.tagName === 'IMG') {
		// Wait for image to load before capturing metadata
		if (node.complete && node.naturalWidth > 0) {
			window.captureImageMetadata(node);
		} else {
			node.addEventListener('load', () => window.captureImageMetadata(node), { once: true });
		}
	} else if (node.querySelectorAll) {
		// Check for img elements within the added node
		const images = node.querySelectorAll('img');
		images.forEach(img => {
			if (img.complete && img.naturalWidth > 0) {
				window.captureImageMetadata(img);
			} else {
				img.addEventListener('load', () => window.captureImageMetadata(img), { once: true });
			}
		});
	}
};

// Set up MutationObserver to watch for new images (from content.js)
window.imageObserver = new MutationObserver(mutations => {
	mutations.forEach(mutation => {
		mutation.addedNodes.forEach(node => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				window.captureNewImages(node);
			}
		});
	});
});

// Start observing for image changes
window.imageObserver.observe(document.body, {
	childList: true,
	subtree: true
});

// Capture existing images on page load
const existingImages = document.querySelectorAll('img');
existingImages.forEach(img => {
	if (img.complete && img.naturalWidth > 0) {
		const imageData = window.captureImageMetadata(img);
		if (imageData) {
			imageData.loadedDuringScroll = false; // Mark as pre-existing
		}
	} else {
		img.addEventListener('load', () => {
			const imageData = window.captureImageMetadata(img);
			if (imageData) {
				imageData.loadedDuringScroll = false; // Mark as pre-existing
			}
		}, { once: true });
	}
});

// Extension-style scrolling logic from scrape.js with configurable maxScrolls
window.extensionScrollAndCapture = async function(url) {
	console.log('📜 Starting extension-style scrolling with maxScrolls=%d...', %d);
	
	const scrollingEl = document.scrollingElement || document.body;
	let currentScrollHeight = scrollingEl.scrollHeight;
	
	console.log('📏 Initial scroll metrics:', {
		scrollTop: scrollingEl.scrollTop,
		scrollHeight: currentScrollHeight,
		clientHeight: scrollingEl.clientHeight
	});
	
	let scrollCount = 0;
	const maxScrolls = %d; // Configurable max scrolls
	const scrollIncrement = 150;
	let consecutiveNoScroll = 0;
	const maxNoScrollAttempts = 3;
	
	// Update progress tracking
	if (window.scrollProgress) {
		window.scrollProgress.stepCount = 0;
		window.scrollProgress.lastUpdate = Date.now();
	}
	
	// Update extensionDiscovery tracking if available
	if (window.extensionDiscovery) {
		window.extensionDiscovery.scrolling = true;
		window.extensionDiscovery.totalScrolls = 0;
	}
	
	// Slow progressive scrolling with image capture
	while (scrollCount < maxScrolls && window.location.href === url) {
		const prevScrollTop = scrollingEl.scrollTop;
		
		// Recalculate scroll height for infinite scroll pages
		const newScrollHeight = scrollingEl.scrollHeight;
		if (newScrollHeight > currentScrollHeight) {
			currentScrollHeight = newScrollHeight;
			console.log('📏 Page height increased to:', currentScrollHeight);
		}
		
		// Check if we're near the bottom
		const distanceFromBottom = currentScrollHeight - scrollingEl.scrollTop - scrollingEl.clientHeight;
		if (distanceFromBottom < 100) {
			console.log('📍 Near bottom, distance remaining:', distanceFromBottom);
			// Wait longer for potential infinite scroll content
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Check if more content loaded
			const newestHeight = scrollingEl.scrollHeight;
			if (newestHeight === currentScrollHeight) {
				console.log('🏁 Reached true bottom of page');
				break;
			}
		}
		
		// Perform scroll
		scrollingEl.scrollTop += scrollIncrement;
		scrollCount++;
		
		// Update progress tracking
		if (window.scrollProgress) {
			window.scrollProgress.stepCount = scrollCount;
			window.scrollProgress.lastUpdate = Date.now();
		}
		
		// Update extensionDiscovery tracking
		if (window.extensionDiscovery) {
			window.extensionDiscovery.totalScrolls = scrollCount;
			window.extensionDiscovery.imageCount = window.discoveredImages ? window.discoveredImages.length : 0;
		}
		
		console.log('⬇️  Scroll step', scrollCount, ':', prevScrollTop, '->', scrollingEl.scrollTop, 
			'(page height:', currentScrollHeight + ')');
		
		// Wait for new content to load and images to render
		await new Promise((resolve) => {
			setTimeout(resolve, 400); // Slightly longer wait
		});
		
		// Check if scroll actually moved
		if (scrollingEl.scrollTop === prevScrollTop) {
			consecutiveNoScroll++;
			console.log('⚠️  No scroll movement detected, attempt', consecutiveNoScroll);
			
			if (consecutiveNoScroll >= maxNoScrollAttempts) {
				console.log('🛑 Multiple failed scroll attempts - likely at bottom');
				break;
			}
			
			// Try a larger scroll increment
			scrollingEl.scrollTop += scrollIncrement * 2;
		} else {
			consecutiveNoScroll = 0; // Reset counter if scroll was successful
		}
		
		// Log progress periodically
		if (scrollCount %% 5 === 0) {
			console.log('📊 Progress:', scrollCount, 'scrolls,', window.discoveredImages.length, 'images found,',
				'height:', currentScrollHeight, 'scrollTop:', scrollingEl.scrollTop);
		}
	}
	
	console.log('📜 Scrolling completed:', scrollCount, 'steps (max was', maxScrolls, ')');
	console.log('📏 Final page metrics:', {
		finalHeight: scrollingEl.scrollHeight,
		finalScrollTop: scrollingEl.scrollTop,
		totalImages: window.discoveredImages.length
	});
	
	// Don't return to original position - stay at current position to capture final state
	console.log('📍 Staying at current scroll position for final capture');
	
	// Wait for any final content to settle
	await new Promise((resolve) => {
		setTimeout(resolve, 1000); // Longer final wait
	});
	
	// Final image capture sweep
	console.log('🔍 Final image capture sweep...');
	const finalImages = document.querySelectorAll('img');
	finalImages.forEach(img => {
		if (img.complete && img.naturalWidth > 0) {
			window.captureImageMetadata(img);
		}
	});
	
	console.log('✅ Extension-style scrolling and capture completed');
	console.log('📊 Total images discovered:', window.discoveredImages.length);
};

console.log('🎯 Extension content script logic loaded successfully (maxScrolls=%d)');
console.log('📊 Initial images on page:', document.querySelectorAll('img').length);
`, maxScrolls, maxScrolls, maxScrolls, maxScrolls)
}

// getExtensionContentScript returns the JavaScript code that implements
// the browser extension's content script logic for image capture and scrolling
func getExtensionContentScript() string {
	// Default to 100 scrolls for backward compatibility
	return getExtensionContentScriptWithMaxScrolls(100)
}

// OLD VERSION - KEPT FOR REFERENCE BUT NOT USED
func getExtensionContentScriptOld() string {
	return `
// Extension Content Script Logic
// This implements the same functionality as the browser extension

// Global variables for image tracking
window.discoveredImages = [];

// Image capture system from extension content.js
window.captureImageMetadata = function(img) {
	// Filter out tiny images and tracking pixels
	const minSize = 50;
	if (img.naturalWidth < minSize || img.naturalHeight < minSize) {
		return null;
	}
	
	// Skip if already captured
	if (window.discoveredImages.some(existing => existing.src === img.src)) {
		return null;
	}
	
	const imageData = {
		src: img.src,
		alt: img.alt || '',
		width: img.naturalWidth || img.width || 0,
		height: img.naturalHeight || img.height || 0,
		loading: img.loading || 'eager',
		timestamp: Date.now(),
		loadedDuringScroll: true
	};
	
	window.discoveredImages.push(imageData);
	console.log('🖼️  Captured new image:', imageData.src, imageData.width + 'x' + imageData.height);
	return imageData;
};

window.captureNewImages = function(node) {
	if (node.tagName === 'IMG') {
		// Wait for image to load before capturing metadata
		if (node.complete && node.naturalWidth > 0) {
			window.captureImageMetadata(node);
		} else {
			node.addEventListener('load', () => window.captureImageMetadata(node), { once: true });
		}
	} else if (node.querySelectorAll) {
		// Check for img elements within the added node
		const images = node.querySelectorAll('img');
		images.forEach(img => {
			if (img.complete && img.naturalWidth > 0) {
				window.captureImageMetadata(img);
			} else {
				img.addEventListener('load', () => window.captureImageMetadata(img), { once: true });
			}
		});
	}
};

// Set up MutationObserver to watch for new images (from content.js)
window.imageObserver = new MutationObserver(mutations => {
	mutations.forEach(mutation => {
		mutation.addedNodes.forEach(node => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				window.captureNewImages(node);
			}
		});
	});
});

// Start observing for image changes
window.imageObserver.observe(document.body, {
	childList: true,
	subtree: true
});

// Capture existing images on page load
const existingImages = document.querySelectorAll('img');
existingImages.forEach(img => {
	if (img.complete && img.naturalWidth > 0) {
		const imageData = window.captureImageMetadata(img);
		if (imageData) {
			imageData.loadedDuringScroll = false; // Mark as pre-existing
		}
	} else {
		img.addEventListener('load', () => {
			const imageData = window.captureImageMetadata(img);
			if (imageData) {
				imageData.loadedDuringScroll = false; // Mark as pre-existing
			}
		}, { once: true });
	}
});

// Extension-style scrolling logic from scrape.js
window.extensionScrollAndCapture = async function(url) {
	console.log('📜 Starting extension-style scrolling...');
	
	const scrollingEl = document.scrollingElement || document.body;
	const lastScrollPos = scrollingEl.scrollTop;
	let currentScrollHeight = scrollingEl.scrollHeight;
	
	console.log('📏 Initial scroll metrics:', {
		scrollTop: scrollingEl.scrollTop,
		scrollHeight: currentScrollHeight,
		clientHeight: scrollingEl.clientHeight
	});
	
	let scrollCount = 0;
	const maxScrolls = 100; // Increased for longer pages
	const scrollIncrement = 150;
	let consecutiveNoScroll = 0;
	const maxNoScrollAttempts = 3;
	
	// Update progress tracking
	if (window.scrollProgress) {
		window.scrollProgress.stepCount = 0;
		window.scrollProgress.lastUpdate = Date.now();
	}
	
	// Update extensionDiscovery tracking if available
	if (window.extensionDiscovery) {
		window.extensionDiscovery.scrolling = true;
		window.extensionDiscovery.totalScrolls = 0;
	}
	
	// Slow progressive scrolling with image capture
	while (scrollCount < maxScrolls && window.location.href === url) {
		const prevScrollTop = scrollingEl.scrollTop;
		
		// Recalculate scroll height for infinite scroll pages
		const newScrollHeight = scrollingEl.scrollHeight;
		if (newScrollHeight > currentScrollHeight) {
			currentScrollHeight = newScrollHeight;
			console.log('📏 Page height increased to:', currentScrollHeight);
		}
		
		// Check if we're near the bottom
		const distanceFromBottom = currentScrollHeight - scrollingEl.scrollTop - scrollingEl.clientHeight;
		if (distanceFromBottom < 100) {
			console.log('📍 Near bottom, distance remaining:', distanceFromBottom);
			// Wait longer for potential infinite scroll content
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Check if more content loaded
			const newestHeight = scrollingEl.scrollHeight;
			if (newestHeight === currentScrollHeight) {
				console.log('🏁 Reached true bottom of page');
				break;
			}
		}
		
		// Perform scroll
		scrollingEl.scrollTop += scrollIncrement;
		scrollCount++;
		
		// Update progress tracking
		if (window.scrollProgress) {
			window.scrollProgress.stepCount = scrollCount;
			window.scrollProgress.lastUpdate = Date.now();
		}
		
		// Update extensionDiscovery tracking
		if (window.extensionDiscovery) {
			window.extensionDiscovery.totalScrolls = scrollCount;
			window.extensionDiscovery.imageCount = window.discoveredImages ? window.discoveredImages.length : 0;
		}
		
		console.log('⬇️  Scroll step', scrollCount, ':', prevScrollTop, '->', scrollingEl.scrollTop, 
			'(page height:', currentScrollHeight + ')');
		
		// Wait for new content to load and images to render
		await new Promise((resolve) => {
			setTimeout(resolve, 400); // Slightly longer wait
		});
		
		// Check if scroll actually moved
		if (scrollingEl.scrollTop === prevScrollTop) {
			consecutiveNoScroll++;
			console.log('⚠️  No scroll movement detected, attempt', consecutiveNoScroll);
			
			if (consecutiveNoScroll >= maxNoScrollAttempts) {
				console.log('🛑 Multiple failed scroll attempts - likely at bottom');
				break;
			}
			
			// Try a larger scroll increment
			scrollingEl.scrollTop += scrollIncrement * 2;
		} else {
			consecutiveNoScroll = 0; // Reset counter if scroll was successful
		}
		
		// Log progress periodically
		if (scrollCount % 5 === 0) {
			console.log('📊 Progress:', scrollCount, 'scrolls,', window.discoveredImages.length, 'images found,',
				'height:', currentScrollHeight, 'scrollTop:', scrollingEl.scrollTop);
		}
	}
	
	console.log('📜 Scrolling completed:', scrollCount, 'steps');
	console.log('📏 Final page metrics:', {
		finalHeight: scrollingEl.scrollHeight,
		finalScrollTop: scrollingEl.scrollTop,
		totalImages: window.discoveredImages.length
	});
	
	// Don't return to original position - stay at current position to capture final state
	console.log('📍 Staying at current scroll position for final capture');
	
	// Wait for any final content to settle
	await new Promise((resolve) => {
		setTimeout(resolve, 1000); // Longer final wait
	});
	
	// Final image capture sweep
	console.log('🔍 Final image capture sweep...');
	const finalImages = document.querySelectorAll('img');
	finalImages.forEach(img => {
		if (img.complete && img.naturalWidth > 0) {
			window.captureImageMetadata(img);
		}
	});
	
	console.log('✅ Extension-style scrolling and capture completed');
	console.log('📊 Total images discovered:', window.discoveredImages.length);
};

console.log('🎯 Extension content script logic loaded successfully');
console.log('📊 Initial images on page:', document.querySelectorAll('img').length);
`
}

// discoverScrapeFolders finds all available scrape folders and returns their metadata
func discoverScrapeFolders(baseDir string) ([]string, error) {
	var scrapeFolders []string

	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read base directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			folderPath := filepath.Join(baseDir, entry.Name())

			// Check if the folder contains scraped content (look for page_metadata.json or images)
			if containsScrapedContent(folderPath) {
				scrapeFolders = append(scrapeFolders, folderPath)
			}
		}
	}

	return scrapeFolders, nil
}

// containsScrapedContent checks if a directory contains scraped content
func containsScrapedContent(dirPath string) bool {
	// Check for metadata file
	metadataPath := filepath.Join(dirPath, "page_metadata.json")
	if _, err := os.Stat(metadataPath); err == nil {
		return true
	}

	// Check for other scrape indicator files
	indicators := []string{
		"discovered_images.json",
		"scraping_results.json",
		"page_content_extension.html",
	}

	for _, indicator := range indicators {
		indicatorPath := filepath.Join(dirPath, indicator)
		if _, err := os.Stat(indicatorPath); err == nil {
			return true
		}
	}

	return false
}

// TestSyncPhotosToGCS syncs scraped photos and metadata to Google Cloud Storage bucket
// This test uploads all scraped content to the protoflow-ml-training bucket with organized structure
func TestSyncPhotosToGCS(t *testing.T) {
	// Configuration
	bucketName := "protoflow-ml-training"
	baseSourceDir := "./data/scrape/mobbin.com/extension-ui-elements"
	projectID := "planar-sun-402202"
	serviceAccountName := "mobbin-scraper-access"

	// Check if base directory exists
	if _, err := os.Stat(baseSourceDir); os.IsNotExist(err) {
		t.Fatalf("Base scrape directory does not exist: %s. Please run TestScrapeMobbinWithExtensionLogic first.", baseSourceDir)
	}

	// Discover all available scrape folders (slug-based organization)
	sourceDirs, err := discoverScrapeFolders(baseSourceDir)
	if err != nil {
		t.Fatalf("Failed to discover scrape folders: %v", err)
	}

	if len(sourceDirs) == 0 {
		t.Fatalf("No scrape folders found in base directory: %s. Please run TestScrapeMobbinWithExtensionLogic first.", baseSourceDir)
	}

	fmt.Printf("📁 Found %d scrape folders to sync:\n", len(sourceDirs))
	for i, dir := range sourceDirs {
		fmt.Printf("   %d. %s\n", i+1, dir)
	}

	// Create timestamped folder for this sync
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	remotePath := fmt.Sprintf("gs://%s/mobbin-scrapes/%s/", bucketName, timestamp)

	fmt.Printf("☁️  Syncing to Google Cloud Storage...\n")
	fmt.Printf("🎯 Target: %s\n", remotePath)

	// Step 1: Verify gcloud is authenticated and configured
	fmt.Println("🔐 Verifying gcloud authentication...")
	if err := runCommand("gcloud", "auth", "list", "--filter=status:ACTIVE", "--format=value(account)"); err != nil {
		t.Fatalf("gcloud not authenticated. Please run: gcloud auth login")
	}

	// Step 2: Check if bucket exists and is accessible
	fmt.Printf("🗄️  Verifying bucket access: %s\n", bucketName)
	if err := runCommand("gsutil", "ls", fmt.Sprintf("gs://%s/", bucketName)); err != nil {
		t.Fatalf("Cannot access bucket %s. Error: %v", bucketName, err)
	}

	// Step 3: Create organized directory structure and sync files
	fmt.Println("📤 Starting file sync...")

	var totalFilesSynced int

	// Sync each scrape folder individually
	for i, sourceDir := range sourceDirs {
		// Extract slug from directory path for organized storage
		slug := filepath.Base(sourceDir)
		remoteSlugPath := fmt.Sprintf("gs://%s/mobbin-scrapes/%s/%s/", bucketName, timestamp, slug)

		fmt.Printf("\n📁 [%d/%d] Syncing %s -> %s\n", i+1, len(sourceDirs), slug, remoteSlugPath)

		// Load metadata if available to show more context
		metadataPath := filepath.Join(sourceDir, "page_metadata.json")
		if _, err := os.Stat(metadataPath); err == nil {
			var metadata PageMetadata
			if data, err := os.ReadFile(metadataPath); err == nil {
				if err := json.Unmarshal(data, &metadata); err == nil {
					fmt.Printf("   📋 App: %s | Platform: %s\n", metadata.AppName, metadata.Platform)
				}
			}
		}

		// Use gsutil rsync for efficient synchronization
		syncCmd := exec.Command("gsutil", "-m", "rsync", "-r", "-d", sourceDir+"/", remoteSlugPath)
		syncCmd.Stdout = os.Stdout
		syncCmd.Stderr = os.Stderr

		fmt.Printf("🚀 Running: %s\n", strings.Join(syncCmd.Args, " "))
		if err := syncCmd.Run(); err != nil {
			t.Fatalf("Failed to sync folder %s to GCS: %v", slug, err)
		}

		// Count files in this directory
		files, err := os.ReadDir(sourceDir)
		if err == nil {
			totalFilesSynced += len(files)
		}

		fmt.Printf("✅ Successfully synced %s\n", slug)
	}

	fmt.Printf("\n🎉 All folders synced successfully! Total files: %d\n", totalFilesSynced)

	// Step 4: Verify sync was successful
	fmt.Println("✅ Sync completed! Verifying upload...")

	// List uploaded files to confirm - check the base mobbin-scrapes path
	baseRemotePath := fmt.Sprintf("gs://%s/mobbin-scrapes/%s/", bucketName, timestamp)
	listCmd := exec.Command("gsutil", "ls", "-r", baseRemotePath)
	listOutput, err := listCmd.Output()
	if err != nil {
		fmt.Printf("Warning: Could not verify upload: %v\n", err)
	} else {
		uploadedFiles := strings.Count(string(listOutput), "\n") - 1 // Subtract header line
		fmt.Printf("📊 Verified %d files uploaded successfully\n", uploadedFiles)
	}

	// Step 5: Create/update service account for external access
	fmt.Printf("🔑 Setting up service account: %s\n", serviceAccountName)

	// Check if service account already exists
	checkCmd := exec.Command("gcloud", "iam", "service-accounts", "describe",
		fmt.Sprintf("%s@%s.iam.gserviceaccount.com", serviceAccountName, projectID),
		"--project", projectID)

	if err := checkCmd.Run(); err != nil {
		// Service account doesn't exist, create it
		fmt.Println("📝 Creating new service account...")
		createCmd := exec.Command("gcloud", "iam", "service-accounts", "create", serviceAccountName,
			"--display-name", "Mobbin Scraper Access",
			"--description", "Service account for accessing scraped Mobbin data in GCS",
			"--project", projectID)

		if err := createCmd.Run(); err != nil {
			t.Fatalf("Failed to create service account: %v", err)
		}
		fmt.Println("✅ Service account created successfully")
	} else {
		fmt.Println("ℹ️  Service account already exists")
	}

	// Step 6: Grant bucket access permissions
	fmt.Println("🔐 Configuring bucket permissions...")
	serviceAccountEmail := fmt.Sprintf("%s@%s.iam.gserviceaccount.com", serviceAccountName, projectID)

	// Grant Storage Object Admin role (read/write objects)
	policyCmd1 := exec.Command("gsutil", "iam", "ch",
		fmt.Sprintf("serviceAccount:%s:roles/storage.objectAdmin", serviceAccountEmail),
		fmt.Sprintf("gs://%s", bucketName))

	if err := policyCmd1.Run(); err != nil {
		fmt.Printf("Warning: Failed to grant objectAdmin role: %v\n", err)
	}

	// Grant Storage Legacy Bucket Reader role (list bucket contents)
	policyCmd2 := exec.Command("gsutil", "iam", "ch",
		fmt.Sprintf("serviceAccount:%s:roles/storage.legacyBucketReader", serviceAccountEmail),
		fmt.Sprintf("gs://%s", bucketName))

	if err := policyCmd2.Run(); err != nil {
		fmt.Printf("Warning: Failed to grant legacyBucketReader role: %v\n", err)
	}

	fmt.Println("✅ Bucket permissions configured")

	// Step 7: Generate service account key for external sharing
	keyFileName := fmt.Sprintf("%s-key.json", serviceAccountName)
	keyFilePath := filepath.Join("./data", keyFileName)

	// Ensure data directory exists
	os.MkdirAll("./data", 0755)

	fmt.Printf("🔑 Generating service account key: %s\n", keyFilePath)
	keyCmd := exec.Command("gcloud", "iam", "service-accounts", "keys", "create", keyFilePath,
		"--iam-account", serviceAccountEmail,
		"--project", projectID)

	if err := keyCmd.Run(); err != nil {
		fmt.Printf("Warning: Failed to generate service account key: %v\n", err)
	} else {
		fmt.Printf("✅ Service account key saved to: %s\n", keyFilePath)
	}

	// Step 8: Display summary and usage instructions
	fmt.Println("\n🎉 Google Cloud Storage sync completed successfully!")
	fmt.Printf("📊 Summary:\n")
	fmt.Printf("   • Synced %d scrape folders with %d total files\n", len(sourceDirs), totalFilesSynced)
	fmt.Printf("   • Organized by app slugs under: %s\n", baseRemotePath)
	fmt.Printf("   • Service Account: %s\n", serviceAccountEmail)
	fmt.Printf("   • Credentials File: %s\n", keyFilePath)
	fmt.Printf("   • Bucket: gs://%s\n", bucketName)

	fmt.Println("\n💡 Usage Instructions for External Access:")
	fmt.Println("   1. Share the generated key file with collaborators")
	fmt.Println("   2. Set environment variable: export GOOGLE_APPLICATION_CREDENTIALS=" + keyFilePath)
	fmt.Println("   3. Use gsutil or client libraries to access the bucket")
	fmt.Printf("   4. List all scrapes: gsutil ls %s\n", fmt.Sprintf("gs://%s/mobbin-scrapes/%s/", bucketName, timestamp))
	fmt.Printf("   5. Browse specific app: gsutil ls %s[APP-SLUG]/\n", baseRemotePath)

	fmt.Println("\n🔐 Security Notes:")
	fmt.Println("   • Key file contains sensitive credentials - store securely")
	fmt.Println("   • Access is scoped to the " + bucketName + " bucket only")
	fmt.Println("   • Permissions: Read/Write objects, List bucket contents")
}

// TestListAvailableScrapes lists all available scrapes organized by slug
func TestListAvailableScrapes(t *testing.T) {
	baseDir := "./data/scrape/mobbin.com"

	fmt.Println("📂 Available Mobbin Scrapes:")
	fmt.Println("=" + strings.Repeat("=", 50))

	// Check if base directory exists
	if _, err := os.Stat(baseDir); os.IsNotExist(err) {
		fmt.Println("❌ No scrapes found. Run TestScrapeMobbinWithExtensionLogic first.")
		return
	}

	// Discover all scrape folders
	scrapeFolders, err := discoverScrapeFolders(baseDir)
	if err != nil {
		t.Fatalf("Failed to discover scrape folders: %v", err)
	}

	if len(scrapeFolders) == 0 {
		fmt.Println("📭 No scrape folders found in", baseDir)
		return
	}

	fmt.Printf("Found %d scrape(s):\n\n", len(scrapeFolders))

	for i, folderPath := range scrapeFolders {
		slug := filepath.Base(folderPath)

		// Load metadata if available
		metadataPath := filepath.Join(folderPath, "page_metadata.json")
		var metadata PageMetadata
		hasMetadata := false

		if data, err := os.ReadFile(metadataPath); err == nil {
			if err := json.Unmarshal(data, &metadata); err == nil {
				hasMetadata = true
			}
		}

		// Count files
		files, err := os.ReadDir(folderPath)
		fileCount := 0
		imageCount := 0
		if err == nil {
			fileCount = len(files)
			for _, file := range files {
				if strings.HasSuffix(strings.ToLower(file.Name()), ".png") ||
					strings.HasSuffix(strings.ToLower(file.Name()), ".jpg") ||
					strings.HasSuffix(strings.ToLower(file.Name()), ".jpeg") {
					imageCount++
				}
			}
		}

		fmt.Printf("%d. 📱 %s\n", i+1, slug)
		fmt.Printf("   📁 Path: %s\n", folderPath)

		if hasMetadata {
			fmt.Printf("   📋 App: %s\n", metadata.AppName)
			if metadata.Platform != "" {
				fmt.Printf("   💻 Platform: %s\n", metadata.Platform)
			}
			if metadata.Category != "" {
				fmt.Printf("   🏷️  Category: %s\n", metadata.Category)
			}
			if metadata.URL != "" {
				fmt.Printf("   🔗 URL: %s\n", metadata.URL)
			}
			if metadata.Timestamp != "" {
				fmt.Printf("   ⏰ Scraped: %s\n", metadata.Timestamp)
			}
		}

		fmt.Printf("   📊 Files: %d total, %d images\n", fileCount, imageCount)

		// Show available files
		if fileCount > 0 && fileCount <= 10 { // Only show files for small directories
			fmt.Printf("   📄 Contents: ")
			fileNames := make([]string, 0, len(files))
			for _, file := range files {
				fileNames = append(fileNames, file.Name())
			}
			fmt.Printf("%s\n", strings.Join(fileNames, ", "))
		}

		fmt.Println() // Empty line between entries
	}

	fmt.Println("💡 Usage:")
	fmt.Println("   • View specific scrape: cd", baseDir+"/{slug}")
	fmt.Println("   • Sync to GCS: go test -v -run TestSyncPhotosToGCS")
	fmt.Println("   • View images: open", baseDir+"/{slug}/*.png")
}

// saveDiscoveryResults saves discovery results for a specific platform with metadata
func saveDiscoveryResults(outputDir, platform string, links []string, timestamp string) error {
	filename := fmt.Sprintf("%s-links-%s.json", platform, timestamp)
	outputFile := filepath.Join(outputDir, filename)

	result := struct {
		Platform  string   `json:"platform"`
		Links     []string `json:"links"`
		Timestamp string   `json:"timestamp"`
		Count     int      `json:"count"`
	}{
		Platform:  platform,
		Links:     links,
		Timestamp: timestamp,
		Count:     len(links),
	}

	jsonData, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	if err := os.WriteFile(outputFile, jsonData, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	fmt.Printf("💾 Saved %d %s links to: %s\n", len(links), platform, outputFile)
	return nil
}

// TestDiscoverMobbinApps discovers app screen links from Mobbin's discovery pages
func TestDiscoverMobbinApps(t *testing.T) {
	// Use the same persistent profile directory that was set up in TestSetupMobbinChromeProfile
	userDataDir := "./data/chrome-profile/mobbin-scraper"
	if _, err := os.Stat(userDataDir); os.IsNotExist(err) {
		t.Fatalf("Chrome profile not found at %s. Please run TestSetupMobbinChromeProfile first to set up authentication.", userDataDir)
	}

	fmt.Printf("🔗 Using authenticated Chrome profile from: %s\n", userDataDir)

	// Use shared Chrome configuration for consistent session behavior
	opts := getMobbinChromeOptions(userDataDir, false) // false = visible for debugging

	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	// Extended timeout for discovery process
	ctx, cancel = context.WithTimeout(ctx, 300*time.Second) // 5 minutes
	defer cancel()

	fmt.Println("🔍 Starting Mobbin app discovery...")

	// First, verify authentication status
	fmt.Println("🔐 Verifying authentication status...")
	isAuthenticated, currentURL, err := verifyMobbinAuthentication(ctx)
	if err != nil {
		t.Fatalf("Failed to verify authentication: %v", err)
	}

	if !isAuthenticated {
		fmt.Printf("❌ Authentication verification failed!\n")
		fmt.Printf("📍 Current URL: %s\n", currentURL)
		fmt.Println("🔄 Please run TestSetupMobbinChromeProfile again to re-authenticate")
		t.Fatalf("Not authenticated - please re-run setup test")
	}

	fmt.Printf("✅ Authentication verified! Current URL: %s\n", currentURL)
	fmt.Println("🚀 Proceeding with app discovery...")

	// Create output directory early to ensure it exists
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	outputDir := "./data/discover/mobbin.com"
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		t.Fatalf("Failed to create output directory: %v", err)
	}
	fmt.Printf("📁 Output directory ready: %s\n", outputDir)

	// Discovery pages to process
	discoveryPages := []string{
		"https://mobbin.com/discover/apps/web/latest",
		"https://mobbin.com/discover/apps/ios/latest",
	}

	var allLinks []string

	// Process each discovery page
	for i, pageURL := range discoveryPages {
		platform := "ios"
		if strings.Contains(pageURL, "/web/") {
			platform = "web"
		}

		fmt.Printf("\n📱 [%d/%d] Discovering %s apps from: %s\n", i+1, len(discoveryPages), platform, pageURL)

		// Discover links from this page (don't fail completely on error)
		pageLinks, err := discoverAppsFromPage(ctx, pageURL, platform)
		if err != nil {
			fmt.Printf("⚠️  Error during %s discovery: %v\n", platform, err)
			fmt.Printf("🔄 Continuing with partial results if any...\n")
		}

		fmt.Printf("✅ Discovered %d unique links from %s page\n", len(pageLinks), platform)

		// Save platform-specific results immediately (preserve partial results)
		if len(pageLinks) > 0 {
			if err := saveDiscoveryResults(outputDir, platform, pageLinks, timestamp); err != nil {
				fmt.Printf("⚠️  Failed to save %s results: %v\n", platform, err)
			}
		} else {
			fmt.Printf("⚠️  No links discovered for %s platform\n", platform)
		}

		// Add to master list (filtering duplicates)
		for _, link := range pageLinks {
			if !contains(allLinks, link) {
				allLinks = append(allLinks, link)
			}
		}
	}

	fmt.Printf("\n🎉 Discovery completed! Total unique links: %d\n", len(allLinks))

	// Save combined results to JSON file
	outputFile := filepath.Join(outputDir, fmt.Sprintf("discovered-app-links-combined-%s.json", timestamp))

	// Create enhanced JSON structure with metadata
	result := struct {
		Links     []string `json:"links"`
		Timestamp string   `json:"timestamp"`
		Count     int      `json:"count"`
		Platforms []string `json:"platforms"`
		Summary   string   `json:"summary"`
	}{
		Links:     allLinks,
		Timestamp: timestamp,
		Count:     len(allLinks),
		Platforms: []string{"ios", "web"},
		Summary:   fmt.Sprintf("Combined discovery results from %d platforms", len(discoveryPages)),
	}

	jsonData, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Printf("⚠️  Failed to marshal combined JSON: %v\n", err)
	} else {
		if err := os.WriteFile(outputFile, jsonData, 0644); err != nil {
			fmt.Printf("⚠️  Failed to write combined results file: %v\n", err)
		} else {
			fmt.Printf("💾 Saved combined %d app links to: %s\n", len(allLinks), outputFile)
		}
	}

	// Always show final summary, even if file operations failed
	fmt.Println("\n📊 Discovery Summary:")
	fmt.Printf("   • Total unique links: %d\n", len(allLinks))
	fmt.Printf("   • Output directory: %s\n", outputDir)
	fmt.Printf("   • Individual platform files: {platform}-links-%s.json\n", timestamp)
	fmt.Printf("   • Combined results: discovered-app-links-combined-%s.json\n", timestamp)
}

// discoverAppsFromPage discovers app screen links from a single Mobbin discovery page
func discoverAppsFromPage(ctx context.Context, pageURL, platform string) ([]string, error) {
	fmt.Printf("🌐 Navigating to %s discovery page...\n", platform)

	var discoveredLinks []string

	err := chromedp.Run(ctx,
		// Navigate to the discovery page
		chromedp.Navigate(pageURL),

		// Wait for initial page load
		chromedp.Sleep(5*time.Second),

		// Check if we're still authenticated after navigation
		chromedp.Evaluate(`
			console.log('=== DISCOVERY PAGE LOADED ===');
			console.log('Current URL:', window.location.href);
			console.log('Page title:', document.title);
			
			// Check for login redirect
			if (window.location.href.includes('/login')) {
				console.log('🚨 REDIRECTED TO LOGIN PAGE - Authentication may have failed!');
			} else {
				console.log('✅ On discovery page - authenticated');
			}
		`, nil),

		// Inject discovery JavaScript
		chromedp.Evaluate(getDiscoveryScript(), nil),

		// Start the discovery process with progressive scrolling
		chromedp.Evaluate(`
			console.log('🔍 Starting app discovery process...');
			window.startAppDiscovery();
		`, nil),

		// Wait for discovery to complete (progressive scrolling)
		chromedp.Sleep(2*time.Second),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to navigate to discovery page: %w", err)
	}

	// Monitor discovery progress with improved timeout handling
	fmt.Printf("📊 Monitoring discovery progress for %s apps...\n", platform)

	var previousCount int
	stableCount := 0
	maxStableChecks := 10 // Stop after 10 checks with no new links
	totalChecks := 0
	maxTotalChecks := 60 // Maximum 3 minutes of monitoring (60 * 3 seconds)

	for stableCount < maxStableChecks && totalChecks < maxTotalChecks {
		// Check current progress
		var currentCount int
		err := chromedp.Run(ctx,
			chromedp.Evaluate(`window.discoveredAppLinks ? window.discoveredAppLinks.length : 0`, &currentCount),
		)

		if err != nil {
			fmt.Printf("⚠️  Error checking progress (continuing with partial results): %v\n", err)
			break // Exit loop but don't fail completely
		}

		if currentCount > previousCount {
			fmt.Printf("   📱 Found %d apps so far (+%d new)\n", currentCount, currentCount-previousCount)
			previousCount = currentCount
			stableCount = 0 // Reset stable count when new links found

			// Checkpoint progress every 25 new apps
			if currentCount > 0 && currentCount%25 == 0 {
				fmt.Printf("   💾 Checkpoint: %d apps discovered so far\n", currentCount)
			}
		} else {
			stableCount++
			fmt.Printf("   ⏳ No new apps found (%d/%d stable checks, %d/%d total checks)\n",
				stableCount, maxStableChecks, totalChecks, maxTotalChecks)
		}

		totalChecks++

		// Wait before next check
		time.Sleep(3 * time.Second)
	}

	// Report why loop exited
	if stableCount >= maxStableChecks {
		fmt.Printf("✅ Discovery completed: reached stable state\n")
	} else if totalChecks >= maxTotalChecks {
		fmt.Printf("⏰ Discovery timed out: maximum monitoring time reached\n")
	}

	// Get final results (always attempt to retrieve whatever was found)
	err = chromedp.Run(ctx,
		chromedp.Evaluate(`window.discoveredAppLinks || []`, &discoveredLinks),
	)

	if err != nil {
		fmt.Printf("⚠️  Error retrieving final results for %s: %v\n", platform, err)
		fmt.Printf("🔄 Returning empty results due to error\n")
		return []string{}, err // Return empty but don't completely fail
	}

	fmt.Printf("🎯 Discovery completed for %s: %d total links\n", platform, len(discoveredLinks))

	// Return discovered links even if there were errors during the process
	return discoveredLinks, nil
}

// getDiscoveryScript returns JavaScript code for discovering app links with progressive scrolling
func getDiscoveryScript() string {
	return `
		// Initialize discovery variables
		window.discoveredAppLinks = [];
		window.discoveryComplete = false;
		
		// Function to extract app links from current DOM
		function extractAppLinks() {
			const links = document.querySelectorAll('a[href*="/apps/"][href*="/screens"]');
			const newLinks = [];
			
			links.forEach(link => {
				const href = link.getAttribute('href');
				if (href && !window.discoveredAppLinks.includes(href)) {
					window.discoveredAppLinks.push(href);
					newLinks.push(href);
				}
			});
			
			if (newLinks.length > 0) {
				console.log('🔗 Found', newLinks.length, 'new app links. Total:', window.discoveredAppLinks.length);
			}
			
			return newLinks.length;
		}
		
		// Progressive scrolling function
		function scrollAndDiscover() {
			return new Promise((resolve) => {
				let scrollAttempts = 0;
				const maxScrollAttempts = 50; // Prevent infinite scrolling
				let lastScrollHeight = document.body.scrollHeight;
				let noChangeCount = 0;
				
				function performScroll() {
					// Extract links before scrolling
					const beforeCount = window.discoveredAppLinks.length;
					extractAppLinks();
					const afterCount = window.discoveredAppLinks.length;
					
					// Check if we've reached the bottom
					const currentScrollHeight = document.body.scrollHeight;
					const isAtBottom = (window.innerHeight + window.scrollY) >= (currentScrollHeight - 100);
					
					if (currentScrollHeight === lastScrollHeight) {
						noChangeCount++;
					} else {
						noChangeCount = 0;
						lastScrollHeight = currentScrollHeight;
					}
					
					// Stop conditions
					if (isAtBottom && noChangeCount >= 3) {
						console.log('📍 Reached bottom of page after', scrollAttempts, 'scrolls');
						resolve();
						return;
					}
					
					if (scrollAttempts >= maxScrollAttempts) {
						console.log('⏰ Max scroll attempts reached');
						resolve();
						return;
					}
					
					// Scroll down by 800px (similar to extension logic but faster)
					window.scrollBy(0, 800);
					scrollAttempts++;
					
					// Wait for content to load, then continue
					setTimeout(performScroll, 1500); // 1.5 second delay for loading
				}
				
				// Start scrolling
				performScroll();
			});
		}
		
		// Start the discovery process
		window.startAppDiscovery = async function() {
			console.log('🚀 Starting progressive app discovery...');
			
			// Initial extraction
			extractAppLinks();
			console.log('📊 Initial apps found:', window.discoveredAppLinks.length);
			
			// Scroll and discover
			await scrollAndDiscover();
			
			// Final extraction
			extractAppLinks();
			console.log('✅ Discovery complete! Total apps:', window.discoveredAppLinks.length);
			
			window.discoveryComplete = true;
		};
		
		console.log('📝 Discovery script loaded successfully');
	`
}

// contains checks if a string slice contains a specific string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// loadDiscoveredWebLinks loads and parses web links JSON file
func loadDiscoveredWebLinks(filePath string) ([]string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file %s: %w", filePath, err)
	}

	var result struct {
		Platform  string   `json:"platform"`
		Links     []string `json:"links"`
		Timestamp string   `json:"timestamp"`
		Count     int      `json:"count"`
	}

	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	if result.Platform != "web" {
		return nil, fmt.Errorf("expected web platform, got: %s", result.Platform)
	}

	return result.Links, nil
}

// convertToUIElementsURL converts a /screens path to /ui-elements path
func convertToUIElementsURL(screenPath string) string {
	if !strings.Contains(screenPath, "/screens") {
		return screenPath // Return as-is if no /screens found
	}

	uiElementsPath := strings.Replace(screenPath, "/screens", "/ui-elements", 1)
	return "https://mobbin.com" + uiElementsPath
}

// scrapeMobbinURL scrapes a single Mobbin URL and returns structured results
func scrapeMobbinURL(ctx context.Context, targetURL string) (*ScrapeResult, error) {
	startTime := time.Now()

	fmt.Printf("🎯 Starting scrape of: %s\n", targetURL)

	// Create slug from URL for deduplication check
	slug := createSlugFromURL(targetURL)

	// Check if already scraped (deduplication)
	if isSlugAlreadyScraped(slug) {
		return &ScrapeResult{
			URL:            targetURL,
			Success:        true,
			Skipped:        true,
			Metadata:       PageMetadata{Slug: slug},
			ProcessingTime: time.Since(startTime),
		}, nil
	}

	result := &ScrapeResult{
		URL:     targetURL,
		Success: false,
	}

	type ScrapingInternalResult struct {
		HTML             string                 `json:"html"`
		DiscoveredImages []DiscoveredImageJS    `json:"discoveredImages"`
		ImageCount       int                    `json:"imageCount"`
		ScrollMetrics    map[string]interface{} `json:"scrollMetrics"`
	}

	var internalResult ScrapingInternalResult

	// First, verify authentication status
	fmt.Println("🔐 Verifying authentication status...")
	isAuthenticated, currentURL, err := verifyMobbinAuthentication(ctx)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to verify authentication: %v", err)
		return result, err
	}

	if !isAuthenticated {
		result.Error = fmt.Sprintf("Not authenticated - current URL: %s", currentURL)
		return result, fmt.Errorf("not authenticated")
	}

	fmt.Printf("✅ Authentication verified! Current URL: %s\n", currentURL)

	// Navigate and extract page metadata for dynamic directory creation
	var pageMetadata PageMetadata

	err = chromedp.Run(ctx,
		// Navigate to the target URL
		chromedp.Navigate(targetURL),

		// Wait for initial page load
		chromedp.Sleep(5*time.Second),

		// Extract page metadata for slug-based organization
		chromedp.Evaluate(`
			(function() {
				// Extract title from the page
				let title = document.title || '';
				
				// Try to get app name from various selectors (Mobbin-specific)
				let appName = '';
				
				// Try multiple selectors for app name
				const appSelectors = [
					'h1[data-testid="app-name"]',
					'h1.text-2xl',
					'.app-header h1',
					'[data-testid="app-title"]',
					'h1'
				];
				
				for (const selector of appSelectors) {
					const element = document.querySelector(selector);
					if (element && element.textContent.trim()) {
						appName = element.textContent.trim();
						break;
					}
				}
				
				// Extract platform and category if available
				let platform = '';
				let category = '';
				
				// Try to get platform from URL or page content
				const url = window.location.href;
				if (url.includes('/ios/')) platform = 'iOS';
				else if (url.includes('/android/')) platform = 'Android';
				else if (url.includes('/web/')) platform = 'Web';
				
				// Try to get category from breadcrumbs or meta
				const categorySelectors = [
					'[data-testid="category"]',
					'.breadcrumb .category',
					'meta[name="category"]'
				];
				
				for (const selector of categorySelectors) {
					const element = document.querySelector(selector);
					if (element) {
						category = element.textContent || element.getAttribute('content') || '';
						if (category.trim()) break;
					}
				}
				
				return {
					title: title,
					appName: appName,
					url: url,
					platform: platform,
					category: category,
					timestamp: new Date().toISOString()
				};
			})()
		`, &pageMetadata),
	)

	if err != nil {
		result.Error = fmt.Sprintf("Failed to navigate and extract metadata: %v", err)
		return result, err
	}

	// Process the extracted metadata and create slug-based directory
	// Use app name if available, otherwise fall back to page title
	slugSource := pageMetadata.AppName
	if slugSource == "" {
		slugSource = pageMetadata.Title
	}
	pageMetadata.Slug = createSlugFromTitle(slugSource)

	// Check if this slug has already been scraped
	if isSlugAlreadyScraped(pageMetadata.Slug) {
		fmt.Printf("⏭️  Skipping already scraped app: %s\n", pageMetadata.Slug)

		// Return a successful result indicating it was skipped
		result.Success = true
		result.Skipped = true
		result.Metadata = pageMetadata
		result.OutputDirectory = filepath.Join("data", "scrape", "mobbin.com", "ui-elements", pageMetadata.Slug)
		result.ProcessingTime = time.Since(startTime)
		result.ImageCount = 0 // We don't count images for skipped items

		return result, nil
	}

	// Create dynamic output directory based on page slug and UI elements
	outputDir := filepath.Join("data", "scrape", "mobbin.com", "ui-elements", pageMetadata.Slug)

	// Create the output directory
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		result.Error = fmt.Sprintf("Failed to create output directory %s: %v", outputDir, err)
		return result, err
	}

	fmt.Printf("📋 Page Metadata:\n")
	fmt.Printf("   Title: %s\n", pageMetadata.Title)
	fmt.Printf("   App Name: %s\n", pageMetadata.AppName)
	fmt.Printf("   Slug: %s\n", pageMetadata.Slug)
	fmt.Printf("   Platform: %s\n", pageMetadata.Platform)
	fmt.Printf("📁 Output Directory: %s\n", outputDir)

	result.Metadata = pageMetadata
	result.OutputDirectory = outputDir

	// Inject extension script for image discovery and scrolling
	err = chromedp.Run(ctx,
		// Inject the extension content script
		chromedp.Evaluate(getExtensionContentScript(), nil),

		// Wait a moment for script initialization
		chromedp.Sleep(2*time.Second),

		// Start the scrolling and discovery process
		chromedp.Evaluate(`
			console.log('🚀 Starting UI elements scraping process...');
			
			// Initialize discovery state
			window.extensionDiscovery = {
				scrolling: true,  // Set to true immediately since we're starting
				completed: false,
				totalScrolls: 0,
				imageCount: 0,
				error: null
			};
			
			// Check if extension functions are loaded
			console.log('🔍 Checking loaded functions:');
			console.log('- discoveredImages:', typeof window.discoveredImages);
			console.log('- captureImageMetadata:', typeof window.captureImageMetadata);
			console.log('- extensionScrollAndCapture:', typeof window.extensionScrollAndCapture);
			console.log('- captureNewImages:', typeof window.captureNewImages);
			
			// Start scrolling with the extension function
			if (typeof window.extensionScrollAndCapture === 'function') {
				console.log('📜 Calling extension scroll function...');
				window.extensionScrollAndCapture(window.location.href)
					.then(() => {
						console.log('✅ Scrolling completed successfully');
						window.extensionDiscovery.completed = true;
						window.extensionDiscovery.scrolling = false;
						window.extensionDiscovery.imageCount = window.discoveredImages ? window.discoveredImages.length : 0;
					})
					.catch((error) => {
						console.error('❌ Scrolling failed:', error);
						window.extensionDiscovery.error = error.message || error.toString();
						window.extensionDiscovery.completed = true;
						window.extensionDiscovery.scrolling = false;
					});
			} else {
				console.error('❌ Extension scroll function not found!');
				window.extensionDiscovery.error = 'extensionScrollAndCapture not defined';
				window.extensionDiscovery.completed = true;
				window.extensionDiscovery.scrolling = false;
			}
		`, nil),
	)

	if err != nil {
		result.Error = fmt.Sprintf("Failed to inject extension script: %v", err)
		return result, err
	}

	// Wait for scrolling to complete with progress monitoring
	fmt.Println("📜 Starting progressive scrolling and image discovery...")

	// Monitor scrolling progress
	timeout := time.After(120 * time.Second) // 2 minutes timeout
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	// Stall detection variables
	var (
		lastScrollCount    = 0
		stallCount         = 0
		maxStalls          = 6 // 30 seconds of no progress (6 * 5 second intervals)
		completionReported = false
	)

	for {
		select {
		case <-timeout:
			fmt.Println("⏰ Scrolling timeout reached, collecting current results...")
			goto collectResults

		case <-ticker.C:
			// Skip if already completed and reported
			if completionReported {
				fmt.Println("🔄 Completion already reported, exiting monitoring loop...")
				goto collectResults
			}
			var progress struct {
				Completed    bool   `json:"completed"`
				Scrolling    bool   `json:"scrolling"`
				TotalScrolls int    `json:"totalScrolls"`
				ImageCount   int    `json:"imageCount"`
				Status       string `json:"status"`
				Error        string `json:"error"`
			}

			err := chromedp.Run(ctx,
				chromedp.Evaluate(`
					(function() {
						if (!window.extensionDiscovery) {
							return {completed: false, scrolling: false, totalScrolls: 0, imageCount: 0, status: 'not_initialized'};
						}
						
						return {
							completed: window.extensionDiscovery.completed || false,
							scrolling: window.extensionDiscovery.scrolling || false,
							totalScrolls: window.extensionDiscovery.totalScrolls || 0,
							imageCount: window.discoveredImages ? window.discoveredImages.length : 0,
							status: window.extensionDiscovery.completed ? 'completed' : 
							        (window.extensionDiscovery.error ? 'error' : 
							         (window.extensionDiscovery.scrolling ? 'scrolling' : 'waiting')),
							error: window.extensionDiscovery.error || null
						};
					})()
				`, &progress),
			)

			if err != nil {
				fmt.Printf("⚠️  Error checking progress: %v\n", err)
				continue
			}

			fmt.Printf("📊 Progress: %s | Scrolls: %d | Images: %d\n", progress.Status, progress.TotalScrolls, progress.ImageCount)

			// Check for stall detection
			if progress.TotalScrolls == lastScrollCount {
				stallCount++
				if stallCount >= maxStalls {
					fmt.Printf("⚠️  Scrolling appears stalled (%d checks with no progress), moving to next URL\n", stallCount)
					break
				}
			} else {
				lastScrollCount = progress.TotalScrolls
				stallCount = 0
			}

			if progress.Error != "" {
				fmt.Printf("❌ Scrolling error: %s\n", progress.Error)
				break
			}

			if progress.Completed {
				fmt.Printf("✅ Scrolling completed! Total scrolls: %d, Images found: %d\n", progress.TotalScrolls, progress.ImageCount)
				completionReported = true
				break
			}
		}
	}

collectResults:
	// Collect final results
	err = chromedp.Run(ctx,
		// Get the final HTML
		chromedp.Evaluate(`document.documentElement.outerHTML`, &internalResult.HTML),

		// Get discovered images
		chromedp.Evaluate(`
			(function() {
				if (!window.discoveredImages || !Array.isArray(window.discoveredImages)) {
					console.log('⚠️  No discovered images found');
					return [];
				}
				
				console.log('📸 Collecting', window.discoveredImages.length, 'discovered images');
				return window.discoveredImages;
			})()
		`, &internalResult.DiscoveredImages),

		// Get scroll metrics
		chromedp.Evaluate(`
			(function() {
				return {
					totalScrolls: window.extensionDiscovery ? window.extensionDiscovery.totalScrolls : 0,
					finalScrollHeight: document.body.scrollHeight,
					viewportHeight: window.innerHeight,
					timestamp: new Date().toISOString(),
					completed: window.extensionDiscovery ? window.extensionDiscovery.completed : false
				};
			})()
		`, &internalResult.ScrollMetrics),
	)

	if err != nil {
		result.Error = fmt.Sprintf("Failed to collect final results: %v", err)
		return result, err
	}

	internalResult.ImageCount = len(internalResult.DiscoveredImages)

	fmt.Printf("📊 Scraping completed: %d images discovered\n", internalResult.ImageCount)

	// Save HTML content
	htmlFile := filepath.Join(outputDir, "page_content_ui_elements.html")
	if err := os.WriteFile(htmlFile, []byte(internalResult.HTML), 0644); err != nil {
		result.Error = fmt.Sprintf("Failed to save HTML: %v", err)
		return result, err
	}

	// Save discovered images metadata
	if len(internalResult.DiscoveredImages) > 0 {
		imagesJSON, err := json.MarshalIndent(internalResult.DiscoveredImages, "", "  ")
		if err != nil {
			result.Error = fmt.Sprintf("Failed to marshal images JSON: %v", err)
			return result, err
		}

		imagesFile := filepath.Join(outputDir, "discovered_images.json")
		if err := os.WriteFile(imagesFile, imagesJSON, 0644); err != nil {
			result.Error = fmt.Sprintf("Failed to save images metadata: %v", err)
			return result, err
		}

		// Download images (similar to existing image extraction logic)
		fmt.Printf("💾 Downloading %d images...\n", len(internalResult.DiscoveredImages))

		downloadedCount := 0
		for i, imgData := range internalResult.DiscoveredImages {
			// Determine image type and create appropriate filename
			imageType := "static"
			if imgData.LoadedDuringScroll {
				imageType = "dynamic"
			}

			// Create filename with metadata
			filename := fmt.Sprintf("ui_elements_img_%03d_%dx%d_%s.png", i+1, imgData.Width, imgData.Height, imageType)
			imgPath := filepath.Join(outputDir, filename)

			// Download the image using chromedp screenshot capability
			if err := downloadImageFromURL(imgData.Src, imgPath); err != nil {
				fmt.Printf("⚠️  Failed to download image %d: %v\n", i+1, err)
				continue
			}

			downloadedCount++
		}

		fmt.Printf("✅ Successfully downloaded %d/%d images\n", downloadedCount, len(internalResult.DiscoveredImages))
	}

	// Save scraping results metadata
	scrapingResults := map[string]interface{}{
		"url":             targetURL,
		"timestamp":       time.Now().Format(time.RFC3339),
		"processingTime":  time.Since(startTime).String(),
		"pageMetadata":    pageMetadata,
		"imageCount":      internalResult.ImageCount,
		"scrollMetrics":   internalResult.ScrollMetrics,
		"outputDirectory": outputDir,
		"success":         true,
	}

	resultsJSON, err := json.MarshalIndent(scrapingResults, "", "  ")
	if err == nil {
		resultsFile := filepath.Join(outputDir, "scraping_results.json")
		os.WriteFile(resultsFile, resultsJSON, 0644)
	}

	// Update result structure
	result.Success = true
	result.ProcessingTime = time.Since(startTime)
	result.ImageCount = internalResult.ImageCount
	result.DiscoveredImages = internalResult.DiscoveredImages
	result.ScrollMetrics = internalResult.ScrollMetrics

	return result, nil
}

// runCommand is a helper function to execute commands with error handling
func runCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Command failed: %s %s\n", name, strings.Join(args, " "))
		fmt.Printf("Output: %s\n", output)
		return err
	}
	return nil
}

// createSlugFromTitle generates a URL-safe slug from a page title
func createSlugFromTitle(title string) string {
	if title == "" {
		return "untitled-app"
	}

	// Convert to lowercase
	slug := strings.ToLower(title)

	// Replace common separators and whitespace with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")
	slug = strings.ReplaceAll(slug, ".", "-")
	slug = strings.ReplaceAll(slug, "/", "-")
	slug = strings.ReplaceAll(slug, "\\", "-")
	slug = strings.ReplaceAll(slug, "|", "-")
	slug = strings.ReplaceAll(slug, ":", "-")

	// Remove special characters (keep only alphanumeric and hyphens)
	var result []rune
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result = append(result, r)
		}
	}
	slug = string(result)

	// Remove multiple consecutive hyphens
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}

	// Remove leading/trailing hyphens
	slug = strings.Trim(slug, "-")

	// Limit length to reasonable size (50 characters)
	if len(slug) > 50 {
		slug = slug[:50]
		slug = strings.Trim(slug, "-") // Remove trailing hyphen if cut mid-word
	}

	// Ensure we have a valid slug
	if slug == "" {
		slug = "untitled-app"
	}

	return slug
}

// downloadImageFromURL downloads an image from a URL to a local file path
func downloadImageFromURL(imageURL, outputPath string) error {
	// Create HTTP client with timeout and proper headers
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Create request with proper headers
	req, err := http.NewRequest("GET", imageURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Add headers to mimic a browser request
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
	req.Header.Set("Accept", "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Referer", "https://mobbin.com/")

	// Make the request
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	// Check if request was successful
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	// Create output file
	out, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer out.Close()

	// Copy image data to file
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return fmt.Errorf("failed to save image: %w", err)
	}

	return nil
}

// removeSingletonLock removes the Chrome SingletonLock file if it exists
func removeSingletonLock(userDataDir string) {
	lockFile := filepath.Join(userDataDir, "SingletonLock")
	if err := os.Remove(lockFile); err != nil && !os.IsNotExist(err) {
		fmt.Printf("⚠️  Warning: Could not remove SingletonLock: %v\n", err)
	} else if err == nil {
		fmt.Println("🔓 Removed SingletonLock file")
	}
}

// isSlugAlreadyScraped checks if a slug directory exists and contains scraped data
func isSlugAlreadyScraped(slug string) bool {
	outputDir := filepath.Join("data", "scrape", "mobbin.com", "ui-elements", slug)

	// Check if directory exists
	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		return false
	}

	// Check if it contains essential files indicating successful scraping
	essentialFiles := []string{
		"scraping_results.json",
		"discovered_images.json",
		"page_content_ui_elements.html",
	}

	for _, file := range essentialFiles {
		filePath := filepath.Join(outputDir, file)
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			return false // Missing essential file, needs re-scraping
		}
	}

	return true // All essential files exist
}

// isSlugAlreadyScrapedExtension checks if a slug directory exists in the extension-ui-elements directory and contains scraped data
func isSlugAlreadyScrapedExtension(slug string) bool {
	outputDir := filepath.Join("data", "scrape", "mobbin.com", "extension-ui-elements", slug)

	// Check if directory exists
	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		return false
	}

	// Check if it contains essential files indicating successful scraping
	essentialFiles := []string{
		"scraping_results.json",
		"discovered_images.json",
		"page_content_extension.html",
	}

	for _, file := range essentialFiles {
		filePath := filepath.Join(outputDir, file)
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			return false // Missing essential file, needs re-scraping
		}
	}

	return true // All essential files exist
}

// extractPageMetadata contains page title and app information
type PageMetadata struct {
	Title     string `json:"title"`
	Slug      string `json:"slug"`
	AppName   string `json:"appName"`
	URL       string `json:"url"`
	Platform  string `json:"platform"`
	Category  string `json:"category"`
	Timestamp string `json:"timestamp"`
}

// ScrapeResult contains the results of scraping a single URL
type ScrapeResult struct {
	URL              string                 `json:"url"`
	Success          bool                   `json:"success"`
	Skipped          bool                   `json:"skipped"` // New field to indicate skip
	Error            string                 `json:"error,omitempty"`
	Metadata         PageMetadata           `json:"metadata"`
	OutputDirectory  string                 `json:"outputDirectory"`
	ImageCount       int                    `json:"imageCount"`
	DiscoveredImages []DiscoveredImageJS    `json:"discoveredImages"`
	ProcessingTime   time.Duration          `json:"processingTime"`
	ScrollMetrics    map[string]interface{} `json:"scrollMetrics"`
}

// createSlugFromURL creates a slug from the URL path for deduplication
func createSlugFromURL(targetURL string) string {
	// Parse URL to extract app name
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return "unknown-app"
	}

	parts := strings.Split(parsedURL.Path, "/")

	// Look for app ID pattern: /apps/{app-name-with-id}/
	for i, part := range parts {
		if part == "apps" && i+1 < len(parts) {
			appID := parts[i+1]
			// Extract app name (remove UUID suffix)
			if idx := strings.LastIndex(appID, "-"); idx != -1 {
				// Check if everything after the last dash looks like a UUID
				suffix := appID[idx+1:]
				if len(suffix) >= 8 { // UUID parts are at least 8 chars
					appName := appID[:idx]
					return createSlugFromTitle(appName)
				}
			}
			return createSlugFromTitle(appID)
		}
	}

	return "unknown-app"
}

// TestScrapeWebUIElements loads web links and scrapes UI elements from each page
func TestScrapeWebUIElements(t *testing.T) {
	// Define the path to the discovered web links JSON file
	webLinksFile := "./data/discover/mobbin.com/web-links-2025-08-05_19-28-49.json"

	// Check if the web links file exists
	if _, err := os.Stat(webLinksFile); os.IsNotExist(err) {
		t.Fatalf("Web links file not found: %s. Please run TestDiscoverMobbinApps first to discover web app links.", webLinksFile)
	}

	// Load discovered web links
	fmt.Printf("📖 Loading web links from: %s\n", webLinksFile)
	webLinks, err := loadDiscoveredWebLinks(webLinksFile)
	if err != nil {
		t.Fatalf("Failed to load web links: %v", err)
	}

	fmt.Printf("✅ Loaded %d web app links for UI elements scraping\n", len(webLinks))

	// Use the same persistent profile directory that was set up in TestSetupMobbinChromeProfile
	userDataDir := "./data/chrome-profile/mobbin-scraper"
	if _, err := os.Stat(userDataDir); os.IsNotExist(err) {
		t.Fatalf("Chrome profile not found at %s. Please run TestSetupMobbinChromeProfile first to set up authentication.", userDataDir)
	}

	fmt.Printf("🔗 Using authenticated Chrome profile from: %s\n", userDataDir)

	// Create batch processing summary
	batchStartTime := time.Now()
	batchResults := struct {
		StartTime        time.Time       `json:"startTime"`
		TotalLinks       int             `json:"totalLinks"`
		ProcessedLinks   int             `json:"processedLinks"`
		SuccessfulLinks  int             `json:"successfulLinks"`
		SkippedLinks     int             `json:"skippedLinks"` // New field for skipped count
		FailedLinks      int             `json:"failedLinks"`
		TotalImages      int             `json:"totalImages"`
		TotalProcessTime time.Duration   `json:"totalProcessTime"`
		Results          []*ScrapeResult `json:"results"`
		Errors           []string        `json:"errors,omitempty"`
	}{
		StartTime:  batchStartTime,
		TotalLinks: len(webLinks),
		Results:    make([]*ScrapeResult, 0, len(webLinks)),
	}

	fmt.Printf("🚀 Starting batch UI elements scraping of %d web applications...\n", len(webLinks))
	fmt.Println("📋 Each link will be converted from /screens to /ui-elements path")
	fmt.Println()

	// Helper function to create Chrome instance with retry logic
	createChromeInstance := func() (context.Context, context.CancelFunc, error) {
		// Try to remove any existing lock first
		removeSingletonLock(userDataDir)

		fmt.Println("🔄 Creating Chrome allocator...")
		opts := getMobbinChromeOptions(userDataDir, false) // true = headless for stability
		allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(), opts...)

		fmt.Println("🔄 Creating Chrome context...")
		ctx, ctxCancel := chromedp.NewContext(allocCtx)

		// Combine cancel functions
		combinedCancel := func() {
			ctxCancel()
			allocCancel()
		}

		// Test the connection with timeout
		fmt.Println("🔄 Testing Chrome connection...")
		testCtx, testCancel := context.WithTimeout(ctx, 30*time.Second)
		defer testCancel()

		var alive bool
		err := chromedp.Run(testCtx, chromedp.Evaluate(`true`, &alive))
		if err == nil {
			fmt.Println("✅ Chrome connection test successful")
		}
		if err != nil {
			combinedCancel()

			// If SingletonLock error, remove and retry once
			if strings.Contains(err.Error(), "SingletonLock") {
				fmt.Println("🔄 SingletonLock detected, removing and retrying...")
				removeSingletonLock(userDataDir)
				time.Sleep(2 * time.Second)

				// Retry creation
				allocCtx2, allocCancel2 := chromedp.NewExecAllocator(context.Background(), opts...)
				ctx2, ctxCancel2 := chromedp.NewContext(allocCtx2)

				combinedCancel2 := func() {
					ctxCancel2()
					allocCancel2()
				}

				// Test again with timeout
				testCtx2, testCancel2 := context.WithTimeout(ctx2, 30*time.Second)
				defer testCancel2()

				if err := chromedp.Run(testCtx2, chromedp.Evaluate(`true`, &alive)); err != nil {
					combinedCancel2()
					return nil, nil, err
				}

				return ctx2, combinedCancel2, nil
			}

			return nil, nil, err
		}

		return ctx, combinedCancel, nil
	}

	// Create initial Chrome instance
	chromeCtx, chromeCleanup, err := createChromeInstance()
	if err != nil {
		t.Fatalf("Failed to create Chrome instance: %v", err)
	}
	defer chromeCleanup()

	fmt.Println("✅ Chrome instance created successfully")

	// Process all web links with deduplication
	testLinks := webLinks
	fmt.Printf("🚀 Processing all %d web applications with deduplication enabled\n", len(testLinks))

	// Process each web link
	for i, screenPath := range testLinks {
		// Convert to UI elements URL
		uiElementsURL := convertToUIElementsURL(screenPath)

		fmt.Printf("🎯 [%d/%d] Processing: %s\n", i+1, len(testLinks), uiElementsURL)
		fmt.Printf("   Original: https://mobbin.com%s\n", screenPath)
		fmt.Printf("   UI Elements: %s\n", uiElementsURL)

		// Every 10 URLs, check Chrome health
		if i > 0 && i%10 == 0 {
			var alive bool
			if err := chromedp.Run(chromeCtx, chromedp.Evaluate(`true`, &alive)); err != nil {
				fmt.Println("🔄 Chrome health check failed, recreating instance...")
				chromeCleanup()

				chromeCtx, chromeCleanup, err = createChromeInstance()
				if err != nil {
					fmt.Printf("❌ Failed to recreate Chrome instance: %v\n", err)
					// Continue with next URL, instance will be recreated on next iteration
				}
			}
		}

		// Scrape this URL
		result, err := scrapeMobbinURL(chromeCtx, uiElementsURL)

		// If Chrome crashed or SingletonLock error, recreate instance and retry
		if err != nil && (strings.Contains(err.Error(), "SingletonLock") ||
			strings.Contains(err.Error(), "context canceled") ||
			strings.Contains(err.Error(), "chrome failed to start")) {
			fmt.Println("🔄 Chrome instance issue detected, recreating...")
			chromeCleanup() // Clean up old instance

			chromeCtx, chromeCleanup, err = createChromeInstance()
			if err != nil {
				fmt.Printf("❌ Failed to recreate Chrome: %v\n", err)
				batchResults.FailedLinks++
				batchResults.Errors = append(batchResults.Errors, fmt.Sprintf("URL %s: Chrome recreation failed: %v", uiElementsURL, err))

				result = &ScrapeResult{
					URL:     uiElementsURL,
					Success: false,
					Error:   fmt.Sprintf("Chrome recreation failed: %v", err),
				}
			} else {
				// Retry the current URL with new Chrome instance
				fmt.Println("🔄 Retrying with new Chrome instance...")
				result, err = scrapeMobbinURL(chromeCtx, uiElementsURL)
			}
		}

		if err != nil && result == nil {
			fmt.Printf("❌ Failed to scrape %s: %v\n", uiElementsURL, err)
			batchResults.FailedLinks++
			batchResults.Errors = append(batchResults.Errors, fmt.Sprintf("URL %s: %v", uiElementsURL, err))

			// Continue with next URL
			result = &ScrapeResult{
				URL:     uiElementsURL,
				Success: false,
				Error:   err.Error(),
			}
		} else if err == nil {
			if result.Success {
				if result.Skipped {
					fmt.Printf("⏭️  Skipped %s (already scraped)\n", result.Metadata.Slug)
					batchResults.SkippedLinks++
				} else {
					fmt.Printf("✅ Successfully scraped %s - %d images, %s\n",
						result.Metadata.Slug, result.ImageCount, result.ProcessingTime.Round(time.Second))
					batchResults.SuccessfulLinks++
					batchResults.TotalImages += result.ImageCount
				}
			} else {
				fmt.Printf("❌ Failed to scrape %s: %s\n", uiElementsURL, result.Error)
				batchResults.FailedLinks++
				batchResults.Errors = append(batchResults.Errors, fmt.Sprintf("URL %s: %s", uiElementsURL, result.Error))
			}
		}

		batchResults.ProcessedLinks++
		batchResults.Results = append(batchResults.Results, result)

		// Brief pause between requests to be respectful to the server
		time.Sleep(2 * time.Second)

		fmt.Println() // Empty line for readability
	}

	// Calculate final batch metrics
	batchResults.TotalProcessTime = time.Since(batchStartTime)

	// Save batch processing summary
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	summaryDir := "./data/scrape/mobbin.com/ui-elements-batch"
	if err := os.MkdirAll(summaryDir, 0755); err != nil {
		fmt.Printf("⚠️  Failed to create summary directory: %v\n", err)
	} else {
		summaryFile := filepath.Join(summaryDir, fmt.Sprintf("batch-summary-%s.json", timestamp))
		summaryJSON, err := json.MarshalIndent(batchResults, "", "  ")
		if err == nil {
			if err := os.WriteFile(summaryFile, summaryJSON, 0644); err == nil {
				fmt.Printf("📊 Batch summary saved to: %s\n", summaryFile)
			}
		}
	}

	// Print final summary
	fmt.Println("🎉 Batch UI Elements Scraping Completed!")
	fmt.Println("=" + strings.Repeat("=", 50))
	fmt.Printf("📊 Total Links Processed: %d/%d\n", batchResults.ProcessedLinks, batchResults.TotalLinks)
	fmt.Printf("✅ Successful Scrapes: %d\n", batchResults.SuccessfulLinks)
	fmt.Printf("⏭️  Skipped Scrapes: %d\n", batchResults.SkippedLinks)
	fmt.Printf("❌ Failed Scrapes: %d\n", batchResults.FailedLinks)
	fmt.Printf("📸 Total Images Downloaded: %d\n", batchResults.TotalImages)
	fmt.Printf("⏱️  Total Processing Time: %s\n", batchResults.TotalProcessTime.Round(time.Second))
	fmt.Printf("⚡ Average Time per Link: %s\n", (batchResults.TotalProcessTime / time.Duration(batchResults.ProcessedLinks)).Round(time.Second))

	if len(batchResults.Errors) > 0 {
		fmt.Printf("\n⚠️  Errors encountered (%d):\n", len(batchResults.Errors))
		for i, errMsg := range batchResults.Errors {
			if i < 5 { // Show first 5 errors
				fmt.Printf("   • %s\n", errMsg)
			}
		}
		if len(batchResults.Errors) > 5 {
			fmt.Printf("   • ... and %d more errors (see batch summary)\n", len(batchResults.Errors)-5)
		}
	}

	fmt.Println()
	fmt.Println("💡 Next Steps:")
	fmt.Println("   • Individual scrape results: ./data/scrape/mobbin.com/ui-elements/{app-slug}/")
	fmt.Println("   • Batch summary: " + summaryDir)
	fmt.Println("   • Sync to GCS: go test -v -run TestSyncPhotosToGCS")
}

// TestScrapeWebLinksWithExtension loads web links and scrapes them using extension logic with limited scrolling
func TestScrapeWebLinksWithExtension(t *testing.T) {
	// Configuration
	maxScrolls := 100 // Increased to 100 scrolls for comprehensive content capture

	// Load web links from JSON file
	webLinksFile := "./data/discover/mobbin.com/web-links-2025-08-05_19-28-49.json"

	if _, err := os.Stat(webLinksFile); os.IsNotExist(err) {
		t.Fatalf("Web links file not found: %s. Please run TestDiscoverMobbinApps first.", webLinksFile)
	}

	fmt.Printf("📖 Loading web links from: %s\n", webLinksFile)
	webLinks, err := loadDiscoveredWebLinks(webLinksFile)
	if err != nil {
		t.Fatalf("Failed to load web links: %v", err)
	}

	fmt.Printf("✅ Loaded %d web app links for extension-based scraping (maxScrolls=%d per page)\n", len(webLinks), maxScrolls)

	// Use authenticated Chrome profile
	userDataDir := "./data/chrome-profile/mobbin-scraper"
	if _, err := os.Stat(userDataDir); os.IsNotExist(err) {
		t.Fatalf("Chrome profile not found at %s. Please run TestSetupMobbinChromeProfile first.", userDataDir)
	}

	fmt.Printf("🔗 Using authenticated Chrome profile from: %s\n", userDataDir)

	// Chrome context recovery function
	createExtensionChromeInstance := func() (context.Context, context.CancelFunc, error) {
		// Try to remove any existing lock first
		removeSingletonLock(userDataDir)

		fmt.Println("🔄 Creating Chrome allocator...")
		opts := getMobbinChromeOptions(userDataDir, true) // true = headless for efficiency
		allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(), opts...)

		fmt.Println("🔄 Creating Chrome context...")
		ctx, ctxCancel := chromedp.NewContext(allocCtx)

		// Combine cancel functions
		combinedCancel := func() {
			ctxCancel()
			allocCancel()
		}

		// Test the connection with timeout
		//fmt.Println("🔄 Testing Chrome connection...")
		//testCtx, testCancel := context.WithTimeout(ctx, 30*time.Second)
		//defer testCancel()
		//
		//err := chromedp.Run(testCtx, chromedp.Navigate("https://mobbin.com/"))
		//if err != nil {
		//	combinedCancel()
		//	return nil, nil, fmt.Errorf("failed to create Chrome context: %v", err)
		//}

		return ctx, combinedCancel, nil
	}

	// Create initial Chrome instance
	fmt.Println("🔄 Creating initial Chrome instance...")
	ctx, ctxCancel, err := createExtensionChromeInstance()
	if err != nil {
		t.Fatalf("Failed to create initial Chrome instance: %v", err)
	}
	defer ctxCancel()

	// Verify authentication first with recovery
	fmt.Println("🔐 Verifying authentication...")
	isAuthenticated, currentURL, err := verifyMobbinAuthentication(ctx)

	// If authentication verification fails due to context issues, try recovery
	if err != nil && (strings.Contains(err.Error(), "context canceled") ||
		strings.Contains(err.Error(), "SingletonLock") ||
		strings.Contains(err.Error(), "chrome failed")) {

		fmt.Println("🔄 Authentication verification failed, attempting Chrome recovery...")
		ctxCancel() // Clean up old context

		ctx, ctxCancel, err = createExtensionChromeInstance()
		if err == nil {
			fmt.Println("✅ Chrome recovered, retrying authentication verification...")
			isAuthenticated, currentURL, err = verifyMobbinAuthentication(ctx)
		}
	}

	if err != nil {
		t.Fatalf("Failed to verify authentication (even after recovery): %v", err)
	}

	if !isAuthenticated {
		fmt.Printf("❌ Not authenticated - current URL: %s\n", currentURL)
		t.Fatalf("Please run TestSetupMobbinChromeProfile to authenticate first")
	}

	fmt.Printf("✅ Authentication verified! Ready to scrape.\n\n")

	// Batch processing summary
	batchStartTime := time.Now()
	batchResults := struct {
		StartTime        time.Time                `json:"startTime"`
		MaxScrolls       int                      `json:"maxScrolls"`
		TotalLinks       int                      `json:"totalLinks"`
		ProcessedLinks   int                      `json:"processedLinks"`
		SuccessfulLinks  int                      `json:"successfulLinks"`
		SkippedLinks     int                      `json:"skippedLinks"`
		FailedLinks      int                      `json:"failedLinks"`
		TotalImages      int                      `json:"totalImages"`
		TotalDownloaded  int                      `json:"totalDownloaded"`
		TotalProcessTime time.Duration            `json:"totalProcessTime"`
		Results          []*ExtensionScrapeResult `json:"results"`
		Errors           []string                 `json:"errors,omitempty"`
	}{
		StartTime:  batchStartTime,
		MaxScrolls: maxScrolls,
		TotalLinks: len(webLinks),
		Results:    make([]*ExtensionScrapeResult, 0, len(webLinks)),
	}

	fmt.Printf("🚀 Starting batch extension scraping of %d web applications\n", len(webLinks))
	fmt.Printf("⚙️  Configuration: maxScrolls=%d per page\n", maxScrolls)
	fmt.Println("📋 Each link will be converted from /screens to /ui-elements path")
	fmt.Println()

	// Process each web link
	outputBaseDir := "./data/scrape/mobbin.com/extension-ui-elements"

	for i, screenPath := range webLinks {
		// Convert to UI elements URL
		uiElementsURL := convertToUIElementsURL(screenPath)
		if isSlugAlreadyScrapedExtension(createSlugFromURL(uiElementsURL)) {
			fmt.Printf("⏭️  Skipping %s (already scraped)\n", screenPath)
			batchResults.SkippedLinks++
			continue // Skip to next link if already scraped
		}

		fmt.Printf("🎯 [%d/%d] Processing: %s\n", i+1, len(webLinks), uiElementsURL)

		// Scrape using the new extension function
		result, err := scrapeMobbinPageWithExtension(ctx, uiElementsURL, maxScrolls, outputBaseDir)

		if err != nil {
			fmt.Printf("❌ Error scraping: %v\n", err)

			// Check if Chrome context was cancelled and try to recover
			if strings.Contains(err.Error(), "context canceled") ||
				strings.Contains(err.Error(), "SingletonLock") ||
				strings.Contains(err.Error(), "chrome failed to start") ||
				strings.Contains(err.Error(), "connection refused") {

				fmt.Println("🔄 Chrome context issue detected, attempting recovery...")
				ctxCancel() // Clean up old context

				// Try to recreate Chrome context
				newCtx, newCtxCancel, chromeErr := createExtensionChromeInstance()
				if chromeErr == nil {
					fmt.Println("✅ Chrome context recovered successfully")
					ctx = newCtx
					ctxCancel = newCtxCancel

					// Retry the current URL with new Chrome context
					fmt.Printf("🔄 Retrying %s with new Chrome context...\n", uiElementsURL)
					result, err = scrapeMobbinPageWithExtension(ctx, uiElementsURL, maxScrolls, outputBaseDir)

					if err == nil {
						fmt.Printf("✅ Retry successful after Chrome recovery!\n")
					} else {
						fmt.Printf("❌ Retry still failed after Chrome recovery: %v\n", err)
					}
				} else {
					fmt.Printf("❌ Failed to recover Chrome context: %v\n", chromeErr)
					err = fmt.Errorf("Chrome recovery failed: %v", chromeErr)
				}
			}

			// If still error after potential recovery, log as failed
			if err != nil {
				batchResults.FailedLinks++
				batchResults.Errors = append(batchResults.Errors, fmt.Sprintf("URL %s: %v", uiElementsURL, err))

				// Store failed result
				if result == nil {
					result = &ExtensionScrapeResult{
						URL:        uiElementsURL,
						Success:    false,
						Error:      err.Error(),
						MaxScrolls: maxScrolls,
					}
				}
			}
		} else {
			if result.Success {
				if result.Skipped {
					fmt.Printf("⏭️  Skipped (already scraped): %s\n", result.Metadata.Slug)
					batchResults.SkippedLinks++
				} else {
					fmt.Printf("✅ Success: %s - %d images (%d downloaded), %s\n",
						result.Metadata.Slug, result.ImageCount, result.DownloadedCount,
						result.ProcessingTime.Round(time.Second))
					batchResults.SuccessfulLinks++
					batchResults.TotalImages += result.ImageCount
					batchResults.TotalDownloaded += result.DownloadedCount
				}
			} else {
				fmt.Printf("⚠️  Failed: %s\n", result.Error)
				batchResults.FailedLinks++
				batchResults.Errors = append(batchResults.Errors, fmt.Sprintf("URL %s: %s", uiElementsURL, result.Error))
			}
		}

		batchResults.ProcessedLinks++
		batchResults.Results = append(batchResults.Results, result)

		// Brief pause between requests
		if i < len(webLinks)-1 {
			time.Sleep(2 * time.Second)
		}

		fmt.Println() // Empty line for readability
	}

	// Calculate final metrics
	batchResults.TotalProcessTime = time.Since(batchStartTime)

	// Save batch summary
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	summaryDir := "./data/scrape/mobbin.com/extension-batch-summaries"
	if err := os.MkdirAll(summaryDir, 0755); err != nil {
		fmt.Printf("⚠️  Failed to create summary directory: %v\n", err)
	} else {
		summaryFile := filepath.Join(summaryDir, fmt.Sprintf("batch-summary-%s.json", timestamp))
		if summaryJSON, err := json.MarshalIndent(batchResults, "", "  "); err == nil {
			if err := os.WriteFile(summaryFile, summaryJSON, 0644); err == nil {
				fmt.Printf("📊 Batch summary saved to: %s\n", summaryFile)
			}
		}
	}

	// Print final summary
	fmt.Println("🎉 Batch Extension Scraping Completed!")
	fmt.Println("=" + strings.Repeat("=", 50))
	fmt.Printf("⚙️  Configuration: maxScrolls=%d per page\n", maxScrolls)
	fmt.Printf("📊 Total Links Processed: %d/%d\n", batchResults.ProcessedLinks, batchResults.TotalLinks)
	fmt.Printf("✅ Successful Scrapes: %d\n", batchResults.SuccessfulLinks)
	fmt.Printf("⏭️  Skipped (Already Scraped): %d\n", batchResults.SkippedLinks)
	fmt.Printf("❌ Failed Scrapes: %d\n", batchResults.FailedLinks)
	fmt.Printf("📸 Total Images Discovered: %d\n", batchResults.TotalImages)
	fmt.Printf("💾 Total Images Downloaded: %d\n", batchResults.TotalDownloaded)
	fmt.Printf("⏱️  Total Processing Time: %s\n", batchResults.TotalProcessTime.Round(time.Second))

	if batchResults.ProcessedLinks > 0 {
		avgTime := batchResults.TotalProcessTime / time.Duration(batchResults.ProcessedLinks)
		fmt.Printf("⚡ Average Time per Link: %s\n", avgTime.Round(time.Second))
	}

	if len(batchResults.Errors) > 0 {
		fmt.Printf("\n⚠️  Errors encountered (%d):\n", len(batchResults.Errors))
		for i, errMsg := range batchResults.Errors {
			if i < 5 { // Show first 5 errors
				fmt.Printf("   • %s\n", errMsg)
			}
		}
		if len(batchResults.Errors) > 5 {
			fmt.Printf("   • ... and %d more errors (see batch summary)\n", len(batchResults.Errors)-5)
		}
	}

	fmt.Println()
	fmt.Println("💡 Next Steps:")
	fmt.Printf("   • Individual results: %s/{app-slug}/\n", outputBaseDir)
	fmt.Printf("   • Batch summary: %s\n", summaryDir)
	fmt.Println("   • Increase maxScrolls for deeper scraping")
	fmt.Println("   • Run with more links by adjusting maxLinks variable")
}

// TestSlugDeduplicationValidation validates the slug-based deduplication logic using real directories
func TestSlugDeduplicationValidation(t *testing.T) {
	fmt.Println("🧪 Testing slug-based deduplication logic with real directories")

	// Load real web links from JSON file
	webLinksFile := "./data/discover/mobbin.com/web-links-2025-08-05_19-28-49.json"

	if _, err := os.Stat(webLinksFile); os.IsNotExist(err) {
		t.Fatalf("Web links file not found: %s. Please run TestDiscoverMobbinApps first.", webLinksFile)
	}

	fmt.Printf("📖 Loading web links from: %s\n", webLinksFile)
	webLinks, err := loadDiscoveredWebLinks(webLinksFile)
	if err != nil {
		t.Fatalf("Failed to load web links: %v", err)
	}

	fmt.Printf("✅ Loaded %d web app links for deduplication testing\n", len(webLinks))

	// Test 1: Check which slugs are already scraped in real directory
	fmt.Println("\n🔍 Phase 1: Analyzing existing scraped data...")
	existingSlugs := []string{}
	missingSlugs := []string{}

	for i, screenPath := range webLinks {
		if i >= 20 { // Test first 20 links for reasonable output
			break
		}

		uiElementsURL := convertToUIElementsURL(screenPath)
		slug := createSlugFromURL(uiElementsURL)

		if isSlugAlreadyScrapedExtension(slug) {
			existingSlugs = append(existingSlugs, slug)
			fmt.Printf("✅ Found existing: %s\n", slug)
		} else {
			missingSlugs = append(missingSlugs, slug)
			fmt.Printf("❌ Missing: %s\n", slug)
		}
	}

	fmt.Printf("\n📊 Summary of first 20 links:\n")
	fmt.Printf("   ✅ Already scraped: %d slugs\n", len(existingSlugs))
	fmt.Printf("   ❌ Not yet scraped: %d slugs\n", len(missingSlugs))

	// Test 2: Validate directory structure for existing slugs
	if len(existingSlugs) > 0 {
		fmt.Println("\n🔍 Phase 2: Validating existing slug directories...")

		essentialFiles := []string{
			"scraping_results.json",
			"discovered_images.json",
			"page_content_extension.html",
		}

		for i, slug := range existingSlugs {
			if i >= 5 { // Check first 5 existing slugs
				break
			}

			outputDir := filepath.Join("data", "scrape", "mobbin.com", "extension-ui-elements", slug)
			fmt.Printf("🔍 Validating: %s\n", slug)

			allFilesExist := true
			for _, file := range essentialFiles {
				filePath := filepath.Join(outputDir, file)
				if _, err := os.Stat(filePath); os.IsNotExist(err) {
					fmt.Printf("   ❌ Missing file: %s\n", file)
					allFilesExist = false
				} else {
					fmt.Printf("   ✅ Found file: %s\n", file)
				}
			}

			if allFilesExist {
				fmt.Printf("   ✅ Directory complete: %s\n", slug)
			} else {
				fmt.Printf("   ⚠️  Directory incomplete: %s\n", slug)
			}
		}
	} else {
		fmt.Println("\n🔍 Phase 2: No existing slugs found to validate")
	}

	// Test 3: Test URL to slug conversion
	fmt.Println("\n🔍 Phase 3: Testing URL to slug conversion...")
	testUrls := []string{
		"https://mobbin.com/apps/hbo-max-web-5e94c701-1fa8-463a-99be-c7e11a1069d3/c4ade448-562b-4b31-b3a3-d572b7a6c3d7/ui-elements",
		"https://mobbin.com/apps/canva-web-fa57d6b5-b412-42e1-9c3a-c3d23a2c563d/f934501d-3e39-4d5e-b431-1fcb4b8bbe16/ui-elements",
	}

	for _, testUrl := range testUrls {
		slug := createSlugFromURL(testUrl)
		fmt.Printf("📝 URL: %s\n", testUrl)
		fmt.Printf("📝 Slug: %s\n", slug)
		fmt.Printf("📝 Already scraped: %t\n\n", isSlugAlreadyScrapedExtension(slug))
	}

	// Test 4: Simulate the actual skipping logic from main test
	fmt.Println("🔍 Phase 4: Simulating main test skipping logic...")
	testLinks := webLinks[:10] // Test first 10 links
	skippedCount := 0
	wouldProcessCount := 0

	for i, screenPath := range testLinks {
		uiElementsURL := convertToUIElementsURL(screenPath)
		slug := createSlugFromURL(uiElementsURL)

		fmt.Printf("[%d/10] Testing: %s\n", i+1, slug)

		if isSlugAlreadyScrapedExtension(slug) {
			fmt.Printf("   ⏭️  Would SKIP (already scraped)\n")
			skippedCount++
		} else {
			fmt.Printf("   🔄 Would PROCESS (not scraped)\n")
			wouldProcessCount++
		}
	}

	fmt.Printf("\n🎉 Deduplication Test Results:\n")
	fmt.Printf("   ⏭️  Would skip: %d apps\n", skippedCount)
	fmt.Printf("   🔄 Would process: %d apps\n", wouldProcessCount)
	fmt.Printf("   📊 Skip efficiency: %.1f%%\n", float64(skippedCount)/float64(len(testLinks))*100)

	if skippedCount > 0 {
		fmt.Println("✅ Deduplication logic working correctly - existing apps will be skipped!")
	} else {
		fmt.Println("ℹ️  No existing apps found - all apps would be processed")
	}
}
