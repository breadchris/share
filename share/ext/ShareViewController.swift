//
//  ShareViewController.swift
//  ext
//
//  Created by hacked on 11/13/24.
//

import UIKit
import Social
import Security

class ShareViewController: SLComposeServiceViewController {
    
    private let serverURL = "https://justshare.io"
    private var defaultGroupID: String?

    override func isContentValid() -> Bool {
        // Do validation of contentText and/or NSExtensionContext attachments here
        return true
    }

    override func didSelectPost() {
        // This is called after the user selects Post. Do the upload of contentText and/or NSExtensionContext attachments.
        
        // First, get the API key from Keychain
        guard let apiKey = getAPIKeyFromKeychain() else {
            self.showError("Please open the main app and log in to JustShare first to enable sharing.")
            return
        }
        
        // Get default group first, then process the shared content
        getDefaultGroup(apiKey: apiKey) { [weak self] groupID in
            guard let self = self else { return }
            
            self.defaultGroupID = groupID
            
            if let item = self.extensionContext?.inputItems.first as? NSExtensionItem,
               let itemProvider = item.attachments?.first {

                if itemProvider.hasItemConformingToTypeIdentifier("public.url") {
                    itemProvider.loadItem(forTypeIdentifier: "public.url", options: nil) { (url, error) in
                        if let shareURL = url as? URL {
                            self.sendToJustShare(url: shareURL, apiKey: apiKey)
                        } else {
                            DispatchQueue.main.async {
                                self.showError("Failed to get URL from shared content")
                            }
                        }
                    }
                } else if itemProvider.hasItemConformingToTypeIdentifier("public.plain-text") {
                    itemProvider.loadItem(forTypeIdentifier: "public.plain-text", options: nil) { (text, error) in
                        if let sharedText = text as? String {
                            self.sendTextToJustShare(text: sharedText, apiKey: apiKey)
                        } else {
                            DispatchQueue.main.async {
                                self.showError("Failed to get text from shared content")
                            }
                        }
                    }
                } else {
                    self.showError("Unsupported content type. Please share URLs or text.")
                }
            } else {
                self.showError("No content to share")
            }
        }
    }
    
    private func getAPIKeyFromKeychain() -> String? {
        let service = "justshare.io"
        let account = "api_key"
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let apiKey = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return apiKey
    }
    
    private func getDefaultGroup(apiKey: String, completion: @escaping (String?) -> Void) {
        guard let requestURL = URL(string: "\(serverURL)/api/groups/default") else {
            completion(nil)
            return
        }
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = "GET"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data,
                  let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let groupID = json["id"] as? String else {
                completion(nil)
                return
            }
            
            completion(groupID)
        }
        task.resume()
    }
    
    private func sendToJustShare(url: URL, apiKey: String) {
        // Get the user's comment/note if any
        let userComment = self.contentText ?? ""
        
        // Create the request to send the URL using JustShare API
        guard let requestURL = URL(string: "\(serverURL)/api/content") else {
            DispatchQueue.main.async {
                self.showError("Invalid server URL")
            }
            return
        }
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "type": "url",
            "data": url.absoluteString,
            "group_id": defaultGroupID ?? "",
            "metadata": [
                "note": userComment,
                "title": url.absoluteString,
                "source": "ios_share_extension"
            ]
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            DispatchQueue.main.async {
                self.showError("Failed to prepare request")
            }
            return
        }

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("Error sending URL: \(error)")
                    self.showError("Failed to save URL: \(error.localizedDescription)")
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                        print("Successfully sent URL to JustShare")
                        self.showSuccess("URL saved to JustShare!")
                    } else if httpResponse.statusCode == 401 {
                        self.showError("Authentication failed. Please open the main app and log in again.")
                    } else if httpResponse.statusCode == 403 {
                        self.showError("Insufficient permissions. Please check your API key.")
                    } else {
                        print("Server returned status code: \(httpResponse.statusCode)")
                        if let data = data,
                           let responseBody = String(data: data, encoding: .utf8) {
                            print("Response body: \(responseBody)")
                        }
                        self.showError("Server error (status: \(httpResponse.statusCode))")
                    }
                } else {
                    self.showError("Invalid server response")
                }
            }
        }
        task.resume()
    }
    
    private func sendTextToJustShare(text: String, apiKey: String) {
        // Get the user's comment/note if any
        let userComment = self.contentText ?? ""
        
        // Create the request to send the text using JustShare API
        guard let requestURL = URL(string: "\(serverURL)/api/content") else {
            DispatchQueue.main.async {
                self.showError("Invalid server URL")
            }
            return
        }
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "type": "text",
            "data": text,
            "group_id": defaultGroupID ?? "",
            "metadata": [
                "note": userComment,
                "source": "ios_share_extension"
            ]
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            DispatchQueue.main.async {
                self.showError("Failed to prepare request")
            }
            return
        }

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("Error sending text: \(error)")
                    self.showError("Failed to save text: \(error.localizedDescription)")
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                        print("Successfully sent text to JustShare")
                        self.showSuccess("Text saved to JustShare!")
                    } else if httpResponse.statusCode == 401 {
                        self.showError("Authentication failed. Please open the main app and log in again.")
                    } else if httpResponse.statusCode == 403 {
                        self.showError("Insufficient permissions. Please check your API key.")
                    } else {
                        print("Server returned status code: \(httpResponse.statusCode)")
                        if let data = data,
                           let responseBody = String(data: data, encoding: .utf8) {
                            print("Response body: \(responseBody)")
                        }
                        self.showError("Server error (status: \(httpResponse.statusCode))")
                    }
                } else {
                    self.showError("Invalid server response")
                }
            }
        }
        task.resume()
    }
    
    private func showError(_ message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        })
        self.present(alert, animated: true)
    }
    
    private func showSuccess(_ message: String) {
        let alert = UIAlertController(title: "Success", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        })
        self.present(alert, animated: true)
    }

    override func configurationItems() -> [Any]! {
        // To add configuration options via table cells at the bottom of the sheet, return an array of SLComposeSheetConfigurationItem here.
        return []
    }
}
