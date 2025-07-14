//
//  ShareViewController.swift
//  ext
//
//  Share extension for saving URLs using Extension API
//

import UIKit
import Social

class ShareViewController: SLComposeServiceViewController {
    
    private let serverURL = "https://justshare.io"

    override func isContentValid() -> Bool {
        // Do validation of contentText and/or NSExtensionContext attachments here
        return true
    }

    override func didSelectPost() {
        // This is called after the user selects Post. Do the upload of contentText and/or NSExtensionContext attachments.
        
        if let item = self.extensionContext?.inputItems.first as? NSExtensionItem,
           let itemProvider = item.attachments?.first {

            if itemProvider.hasItemConformingToTypeIdentifier("public.url") {
                itemProvider.loadItem(forTypeIdentifier: "public.url", options: nil) { (url, error) in
                    if let shareURL = url as? URL {
                        self.saveToExtensionAPI(url: shareURL)
                    } else {
                        DispatchQueue.main.async {
                            self.showError("Failed to get URL from shared content")
                        }
                    }
                }
            } else if itemProvider.hasItemConformingToTypeIdentifier("public.plain-text") {
                itemProvider.loadItem(forTypeIdentifier: "public.plain-text", options: nil) { (text, error) in
                    if let sharedText = text as? String {
                        // Try to extract URL from text or save text directly
                        if self.isValidURL(sharedText) {
                            self.saveToExtensionAPI(urlString: sharedText)
                        } else {
                            self.saveTextToExtensionAPI(text: sharedText)
                        }
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
    
    private func saveToExtensionAPI(url: URL) {
        saveToExtensionAPI(urlString: url.absoluteString)
    }
    
    private func saveToExtensionAPI(urlString: String) {
        guard let requestURL = URL(string: "\(serverURL)/extension/save") else {
            DispatchQueue.main.async {
                self.showError("Invalid server URL")
            }
            return
        }
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let requestBody: [String: Any] = [
            "url": urlString,
            "title": contentText ?? "",
            "html": ""
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody, options: [])
        } catch {
            DispatchQueue.main.async {
                self.showError("Failed to prepare request")
            }
            return
        }

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("Error saving URL: \(error)")
                    self.showError("Failed to save URL: \(error.localizedDescription)")
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        print("Successfully saved URL to Extension API")
                        
                        // Parse response to get page title
                        var savedTitle = urlString
                        if let data = data,
                           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                           let title = json["title"] as? String,
                           !title.isEmpty {
                            savedTitle = title
                        }
                        
                        self.showSuccess("Saved \"\(savedTitle)\"")
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
    
    private func saveTextToExtensionAPI(text: String) {
        // For plain text, we'll save it as a URL if it contains URLs, otherwise skip
        // This is a simplified approach - could be enhanced to handle text content differently
        let urls = extractURLsFromText(text)
        
        if let firstURL = urls.first {
            saveToExtensionAPI(urlString: firstURL)
        } else {
            DispatchQueue.main.async {
                self.showError("No valid URLs found in the shared text")
            }
        }
    }
    
    private func extractURLsFromText(_ text: String) -> [String] {
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let matches = detector?.matches(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count))
        
        return matches?.compactMap { match in
            guard let range = Range(match.range, in: text) else { return nil }
            return String(text[range])
        } ?? []
    }
    
    private func isValidURL(_ string: String) -> Bool {
        guard let url = URL(string: string) else { return false }
        return url.scheme?.lowercased() == "http" || url.scheme?.lowercased() == "https"
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
