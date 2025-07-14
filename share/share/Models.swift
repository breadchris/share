//
//  Models.swift
//  share
//
//  Data models for the URL saver app
//

import Foundation

// MARK: - Saved Page Model
struct SavedPage: Identifiable, Codable {
    let id: String
    let url: String
    let title: String
    let article: String
    let hitCount: Int
    let savedAt: Date
    
    init(from pageInfo: PageInfo) {
        self.id = pageInfo.id
        self.url = pageInfo.url
        self.title = pageInfo.title.isEmpty ? pageInfo.url : pageInfo.title
        self.article = pageInfo.article
        self.hitCount = pageInfo.hitCount
        self.savedAt = Date(timeIntervalSince1970: TimeInterval(pageInfo.createdAt))
    }
    
    var displayTitle: String {
        return title.isEmpty ? url : title
    }
    
    var domain: String {
        guard let url = URL(string: url),
              let host = url.host else {
            return "Unknown"
        }
        return host
    }
    
    var shortArticle: String {
        let maxLength = 150
        if article.count <= maxLength {
            return article
        }
        return String(article.prefix(maxLength)) + "..."
    }
}

// MARK: - App State
class AppState: ObservableObject {
    @Published var savedPages: [SavedPage] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    private let userDefaults = UserDefaults.standard
    private let savedPagesKey = "SavedPages"
    
    init() {
        loadSavedPages()
    }
    
    func addSavedPage(_ pageInfo: PageInfo) {
        let savedPage = SavedPage(from: pageInfo)
        
        // Remove existing page with same URL if it exists
        savedPages.removeAll { $0.url == savedPage.url }
        
        // Add new page at the beginning
        savedPages.insert(savedPage, at: 0)
        
        // Save to UserDefaults
        savePagesToUserDefaults()
    }
    
    func removePage(_ page: SavedPage) {
        savedPages.removeAll { $0.id == page.id }
        savePagesToUserDefaults()
    }
    
    func clearAllPages() {
        savedPages.removeAll()
        savePagesToUserDefaults()
    }
    
    private func loadSavedPages() {
        guard let data = userDefaults.data(forKey: savedPagesKey),
              let pages = try? JSONDecoder().decode([SavedPage].self, from: data) else {
            return
        }
        
        self.savedPages = pages
    }
    
    private func savePagesToUserDefaults() {
        guard let data = try? JSONEncoder().encode(savedPages) else {
            print("Failed to encode saved pages")
            return
        }
        
        userDefaults.set(data, forKey: savedPagesKey)
    }
}

// MARK: - URL Validation
struct URLValidator {
    static func isValid(_ urlString: String) -> Bool {
        return ExtensionAPI.shared.isValidURL(urlString)
    }
    
    static func format(_ urlString: String) -> String {
        return ExtensionAPI.shared.formatURL(urlString)
    }
    
    static func extractDomain(from urlString: String) -> String? {
        guard let url = URL(string: urlString) else { return nil }
        return url.host
    }
}

// MARK: - Keychain Helper for API Keys
class KeychainHelper {
    private static let service = "justshare.io"
    private static let account = "api_key"
    
    static func storeAPIKey(_ apiKey: String) -> Bool {
        let data = apiKey.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete any existing key first
        SecItemDelete(query as CFDictionary)
        
        // Add new key
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    static func getAPIKey() -> String? {
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
    
    static func deleteAPIKey() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
    
    static func hasAPIKey() -> Bool {
        return getAPIKey() != nil
    }
}