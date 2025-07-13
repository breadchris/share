//
//  ContentView.swift
//  share
//
//  Created by hacked on 11/13/24.
//

import SwiftUI
import WebKit
import Security
import AuthenticationServices

struct ContentView: View {
    @StateObject private var webViewStore = WebViewStore()
    @State private var showingAPIKeyAlert = false
    @State private var apiKeyMessage = ""
    @State private var isAuthenticating = false
    
    var body: some View {
        NavigationView {
            WebView(webView: webViewStore.webView)
                .navigationTitle("JustShare")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Refresh") {
                            webViewStore.webView.reload()
                        }
                    }
                }
                .onAppear {
                    loadJustShare()
                    setupNotificationObserver()
                }
                .alert("API Key", isPresented: $showingAPIKeyAlert) {
                    Button("OK") { }
                } message: {
                    Text(apiKeyMessage)
                }
        }
    }
    
    private func loadJustShare() {
        guard let url = URL(string: "https://justshare.io") else { return }
        let request = URLRequest(url: url)
        webViewStore.webView.load(request)
    }
    
    private func setupNotificationObserver() {
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("APIKeyStored"),
            object: nil,
            queue: .main
        ) { notification in
            if let message = notification.userInfo?["message"] as? String {
                apiKeyMessage = message
                showingAPIKeyAlert = true
            }
        }
        
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("GoogleAuthRequired"),
            object: nil,
            queue: .main
        ) { notification in
            if let authURL = notification.userInfo?["authURL"] as? String {
                performGoogleAuthentication(authURL: authURL)
            }
        }
    }
    
    private func performGoogleAuthentication(authURL: String) {
        guard !isAuthenticating else { return }
        
        // Add final_redirect parameter to redirect back to custom scheme
        var urlComponents = URLComponents(string: authURL)
        var queryItems = urlComponents?.queryItems ?? []
        queryItems.append(URLQueryItem(name: "final_redirect", value: "justshare://auth/success"))
        urlComponents?.queryItems = queryItems
        
        guard let url = urlComponents?.url else { return }
        
        isAuthenticating = true
        
        let session = ASWebAuthenticationSession(
            url: url,
            callbackURLScheme: "justshare"
        ) { callbackURL, error in
            DispatchQueue.main.async {
                isAuthenticating = false
                
                if let error = error {
                    print("Google authentication error: \(error.localizedDescription)")
                    if let authError = error as? ASWebAuthenticationSessionError,
                       authError.code != .canceledLogin {
                        // Show error message for non-cancellation errors
                        apiKeyMessage = "Authentication failed: \(error.localizedDescription)"
                        showingAPIKeyAlert = true
                    }
                    return
                }
                
                if let callbackURL = callbackURL {
                    print("Google authentication callback: \(callbackURL)")
                    
                    // Extract access token from the callback URL if present
                    if let urlComponents = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false),
                       let queryItems = urlComponents.queryItems,
                       let accessToken = queryItems.first(where: { $0.name == "access_token" })?.value {
                        print("Received access token: \(accessToken)")
                    }
                    
                    // Handle successful authentication by reloading the web view
                    // The backend should have set the appropriate session cookies
                    webViewStore.webView.reload()
                }
            }
        }
        
        session.presentationContextProvider = ASWebAuthenticationPresentationContextProvider()
        session.start()
    }
}

class WebViewStore: ObservableObject {
    let webView: WKWebView
    
    init() {
        let configuration = WKWebViewConfiguration()
        
        // Add JavaScript handlers
        let contentController = WKUserContentController()
        let messageHandler = MessageHandler()
        contentController.add(messageHandler, name: "apiKeyHandler")
        contentController.add(messageHandler, name: "authHandler")
        configuration.userContentController = contentController
        
        // Inject JavaScript to detect API key creation and Google auth attempts
        let script = WKUserScript(
            source: """
                // Monitor for API key creation responses
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    return originalFetch.apply(this, args).then(response => {
                        if (response.url.includes('/api/auth/keys') && response.status === 200) {
                            response.clone().json().then(data => {
                                if (data.token && data.token.startsWith('ak_')) {
                                    window.webkit.messageHandlers.apiKeyHandler.postMessage({
                                        type: 'apiKey',
                                        token: data.token,
                                        name: data.name || 'Mobile App Key'
                                    });
                                }
                            }).catch(e => console.log('Error parsing API key response:', e));
                        }
                        return response;
                    });
                };
                
                // Monitor for XMLHttpRequest responses
                const originalXHROpen = XMLHttpRequest.prototype.open;
                const originalXHRSend = XMLHttpRequest.prototype.send;
                
                XMLHttpRequest.prototype.open = function(method, url, ...args) {
                    this._url = url;
                    return originalXHROpen.apply(this, [method, url, ...args]);
                };
                
                XMLHttpRequest.prototype.send = function(...args) {
                    this.addEventListener('load', function() {
                        if (this._url && this._url.includes('/api/auth/keys') && this.status === 200) {
                            try {
                                const data = JSON.parse(this.responseText);
                                if (data.token && data.token.startsWith('ak_')) {
                                    window.webkit.messageHandlers.apiKeyHandler.postMessage({
                                        type: 'apiKey',
                                        token: data.token,
                                        name: data.name || 'Mobile App Key'
                                    });
                                }
                            } catch (e) {
                                console.log('Error parsing API key response:', e);
                            }
                        }
                    });
                    return originalXHRSend.apply(this, args);
                };
                
                // Intercept Google authentication attempts
                function interceptGoogleAuth() {
                    const links = document.querySelectorAll('a[href*="/auth/google"], button[onclick*="/auth/google"]');
                    links.forEach(link => {
                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            const authURL = this.href || '/auth/google';
                            window.webkit.messageHandlers.authHandler.postMessage({
                                type: 'googleAuth',
                                authURL: authURL
                            });
                        });
                    });
                    
                    // Also watch for programmatic redirects to Google auth
                    const originalAssign = window.location.assign;
                    window.location.assign = function(url) {
                        if (url.includes('/auth/google')) {
                            window.webkit.messageHandlers.authHandler.postMessage({
                                type: 'googleAuth',
                                authURL: url
                            });
                            return;
                        }
                        return originalAssign.call(this, url);
                    };
                    
                    const originalReplace = window.location.replace;
                    window.location.replace = function(url) {
                        if (url.includes('/auth/google')) {
                            window.webkit.messageHandlers.authHandler.postMessage({
                                type: 'googleAuth',
                                authURL: url
                            });
                            return;
                        }
                        return originalReplace.call(this, url);
                    };
                }
                
                // Run interceptor when DOM is ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', interceptGoogleAuth);
                } else {
                    interceptGoogleAuth();
                }
                
                // Re-run interceptor when content changes (for SPAs)
                const observer = new MutationObserver(function(mutations) {
                    interceptGoogleAuth();
                });
                observer.observe(document.body, { childList: true, subtree: true });
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        contentController.addUserScript(script)
        
        self.webView = WKWebView(frame: .zero, configuration: configuration)
        self.webView.navigationDelegate = NavigationDelegate()
    }
}

class MessageHandler: NSObject, WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let type = body["type"] as? String else {
            return
        }
        
        switch type {
        case "apiKey":
            handleAPIKey(body: body)
        case "googleAuth":
            handleGoogleAuth(body: body)
        default:
            print("Unknown message type: \(type)")
        }
    }
    
    private func handleAPIKey(body: [String: Any]) {
        guard let token = body["token"] as? String else {
            return
        }
        
        let name = body["name"] as? String ?? "Mobile App Key"
        
        // Store API key in Keychain
        if storeAPIKeyInKeychain(token: token, name: name) {
            print("API key stored successfully in Keychain")
            
            // Show success alert
            DispatchQueue.main.async {
                NotificationCenter.default.post(
                    name: NSNotification.Name("APIKeyStored"),
                    object: nil,
                    userInfo: ["message": "API key saved! You can now share content from other apps."]
                )
            }
        } else {
            print("Failed to store API key in Keychain")
        }
    }
    
    private func handleGoogleAuth(body: [String: Any]) {
        guard let authURL = body["authURL"] as? String else {
            return
        }
        
        print("Google authentication intercepted: \(authURL)")
        
        // Trigger native Google authentication
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("GoogleAuthRequired"),
                object: nil,
                userInfo: ["authURL": authURL]
            )
        }
    }
    
    private func storeAPIKeyInKeychain(token: String, name: String) -> Bool {
        let service = "justshare.io"
        let account = "api_key"
        
        // Create query
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: token.data(using: .utf8)!,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete any existing key first
        SecItemDelete(query as CFDictionary)
        
        // Add new key
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
}

class NavigationDelegate: NSObject, WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Optionally inject additional JavaScript after page load
    }
}

struct WebView: UIViewRepresentable {
    let webView: WKWebView
    
    func makeUIView(context: Context) -> WKWebView {
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
        // Updates handled by WebViewStore
    }
}

// ASWebAuthenticationSession presentation context provider
class ASWebAuthenticationPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return ASPresentationAnchor()
    }
}

#Preview {
    ContentView()
}
