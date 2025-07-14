//
//  ExtensionAPI.swift
//  share
//
//  Extension API client for saving URLs
//

import Foundation

struct PageInfo: Codable {
    let id: String
    let url: String
    let title: String
    let html: String
    let createdAt: Int64
    let article: String
    let hitCount: Int
    
    enum CodingKeys: String, CodingKey {
        case id, url, title, html, article
        case createdAt = "created_at"
        case hitCount = "hit_count"
    }
}

struct SaveURLRequest: Codable {
    let url: String
    let title: String?
    let html: String?
}

enum ExtensionAPIError: Error, LocalizedError {
    case invalidURL
    case noResponse
    case invalidResponse
    case serverError(String)
    case networkError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL provided"
        case .noResponse:
            return "No response from server"
        case .invalidResponse:
            return "Invalid response format"
        case .serverError(let message):
            return "Server error: \(message)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}

class ExtensionAPI {
    private let baseURL: String
    private let session: URLSession
    
    init(baseURL: String = "https://justshare.io") {
        self.baseURL = baseURL
        self.session = URLSession.shared
    }
    
    /// Save a URL using the extension API
    func saveURL(_ urlString: String, title: String? = nil, html: String? = nil) async throws -> PageInfo {
        guard let url = URL(string: "\(baseURL)/extension/save") else {
            throw ExtensionAPIError.invalidURL
        }
        
        print(url)
        
        let request = SaveURLRequest(url: urlString, title: title, html: html)
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            throw ExtensionAPIError.networkError(error)
        }
        
        do {
            let (data, response) = try await session.data(for: urlRequest)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw ExtensionAPIError.noResponse
            }
            
            if httpResponse.statusCode != 200 {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                throw ExtensionAPIError.serverError(errorMessage)
            }
            
            let pageInfo = try JSONDecoder().decode(PageInfo.self, from: data)
            return pageInfo
            
        } catch let error as ExtensionAPIError {
            throw error
        } catch {
            throw ExtensionAPIError.networkError(error)
        }
    }
    
    /// Save a URL with just the URL string (simplified version)
    func saveURLSimple(_ urlString: String) async throws -> PageInfo {
        return try await saveURL(urlString, title: nil, html: nil)
    }
    
    /// Validate if a URL string is valid
    func isValidURL(_ urlString: String) -> Bool {
        guard let url = URL(string: urlString),
              let scheme = url.scheme,
              scheme.lowercased() == "http" || scheme.lowercased() == "https",
              url.host != nil else {
            return false
        }
        return true
    }
    
    /// Format URL string by adding https:// if no scheme is present
    func formatURL(_ urlString: String) -> String {
        let trimmed = urlString.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://") {
            return trimmed
        }
        
        return "https://\(trimmed)"
    }
}

// Singleton instance for app-wide use
extension ExtensionAPI {
    static let shared = ExtensionAPI()
}
