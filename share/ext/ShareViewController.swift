//
//  ShareViewController.swift
//  ext
//
//  Created by hacked on 11/13/24.
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
        
        if let item = extensionContext?.inputItems.first as? NSExtensionItem,
           let itemProvider = item.attachments?.first {

            if itemProvider.hasItemConformingToTypeIdentifier("public.url") {
                itemProvider.loadItem(forTypeIdentifier: "public.url", options: nil) { (url, error) in
                    if let shareURL = url as? URL {
                        self.sendToJustShare(url: shareURL)
                    } else {
                        DispatchQueue.main.async {
                            self.showError("Failed to get URL from shared content")
                        }
                    }
                }
            } else {
                self.showError("No URL found in shared content")
            }
        } else {
            self.showError("No content to share")
        }
    }
    
    private func sendToJustShare(url: URL) {
        // Get the user's comment/note if any
        let userComment = self.contentText ?? ""
        
        // Create the request to send the URL
        guard let requestURL = URL(string: "\(serverURL)/extension/save") else {
            DispatchQueue.main.async {
                self.showError("Invalid server URL")
            }
            return
        }
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "url": url.absoluteString,
            "title": url.absoluteString, // We could potentially get the page title later
            "note": userComment
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
                        print("Successfully sent URL to \(self.serverURL)")
                        self.showSuccess("URL saved successfully!")
                    } else {
                        print("Server returned status code: \(httpResponse.statusCode)")
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
