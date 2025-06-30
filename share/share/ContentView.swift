//
//  ContentView.swift
//  share
//
//  Created by hacked on 11/13/24.
//

import SwiftUI
import WebKit
import Security

struct ContentView: View {
    @StateObject private var webViewStore = WebViewStore()
    @State private var showingAPIKeyAlert = false
    @State private var apiKeyMessage = ""
    
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
}

class WebViewStore: ObservableObject {
    let webView: WKWebView
    
    init() {
        let configuration = WKWebViewConfiguration()
        
        // Add JavaScript handler for API key extraction
        let contentController = WKUserContentController()
        contentController.add(MessageHandler(), name: "apiKeyHandler")
        configuration.userContentController = contentController
        
        // Inject JavaScript to detect API key creation and extract it
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
              let type = body["type"] as? String,
              type == "apiKey",
              let token = body["token"] as? String else {
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

#Preview {
    ContentView()
}
