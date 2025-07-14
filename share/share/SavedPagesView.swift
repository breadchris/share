//
//  SavedPagesView.swift
//  share
//
//  View for displaying saved pages
//

import SwiftUI
import SafariServices

struct SavedPagesView: View {
    @ObservedObject var appState: AppState
    @State private var showingDeleteAlert = false
    @State private var pageToDelete: SavedPage?
    
    var body: some View {
        NavigationView {
            VStack {
                if appState.savedPages.isEmpty {
                    EmptyStateView()
                } else {
                    List {
                        ForEach(appState.savedPages) { page in
                            SavedPageRow(page: page)
                                .contextMenu {
                                    Button("Open in Safari") {
                                        openInSafari(page.url)
                                    }
                                    
                                    Button("Copy URL") {
                                        UIPasteboard.general.string = page.url
                                    }
                                    
                                    Button("Delete", role: .destructive) {
                                        pageToDelete = page
                                        showingDeleteAlert = true
                                    }
                                }
                        }
                        .onDelete(perform: deletePages)
                    }
                    .listStyle(PlainListStyle())
                }
            }
            .navigationTitle("Saved Pages")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Clear All") {
                            showingDeleteAlert = true
                            pageToDelete = nil
                        }
                        
                        Button("Refresh") {
                            // Could add refresh functionality if needed
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .alert("Delete Page", isPresented: $showingDeleteAlert) {
                if let page = pageToDelete {
                    Button("Cancel", role: .cancel) { }
                    Button("Delete", role: .destructive) {
                        appState.removePage(page)
                    }
                } else {
                    Button("Cancel", role: .cancel) { }
                    Button("Clear All", role: .destructive) {
                        appState.clearAllPages()
                    }
                }
            } message: {
                if pageToDelete != nil {
                    Text("Are you sure you want to delete this saved page?")
                } else {
                    Text("Are you sure you want to clear all saved pages?")
                }
            }
        }
    }
    
    private func deletePages(offsets: IndexSet) {
        for index in offsets {
            appState.removePage(appState.savedPages[index])
        }
    }
    
    private func openInSafari(_ urlString: String) {
        guard let url = URL(string: urlString) else { return }
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootViewController = window.rootViewController {
            
            let safariVC = SFSafariViewController(url: url)
            rootViewController.present(safariVC, animated: true)
        }
    }
}

struct SavedPageRow: View {
    let page: SavedPage
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Title
            Text(page.displayTitle)
                .font(.headline)
                .lineLimit(2)
                .foregroundColor(.primary)
            
            // URL and domain
            HStack {
                Image(systemName: "link")
                    .foregroundColor(.secondary)
                    .font(.caption)
                
                Text(page.domain)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(page.savedAt, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Article preview
            if !page.article.isEmpty {
                Text(page.shortArticle)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }
            
            // Hit count if > 1
            if page.hitCount > 1 {
                HStack {
                    Image(systemName: "arrow.clockwise")
                        .foregroundColor(.blue)
                        .font(.caption)
                    
                    Text("Saved \(page.hitCount) times")
                        .font(.caption)
                        .foregroundColor(.blue)
                    
                    Spacer()
                }
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .onTapGesture {
            openInSafari(page.url)
        }
    }
    
    private func openInSafari(_ urlString: String) {
        guard let url = URL(string: urlString) else { return }
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootViewController = window.rootViewController {
            
            let safariVC = SFSafariViewController(url: url)
            rootViewController.present(safariVC, animated: true)
        }
    }
}

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "bookmark")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No Saved Pages")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
            
            Text("Save URLs you find interesting and they'll appear here")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: "1.circle.fill")
                        .foregroundColor(.blue)
                    Text("Enter a URL in the input field above")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                }
                
                HStack {
                    Image(systemName: "2.circle.fill")
                        .foregroundColor(.blue)
                    Text("Tap Save to add it to your collection")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                }
                
                HStack {
                    Image(systemName: "3.circle.fill")
                        .foregroundColor(.blue)
                    Text("Use the share sheet to save from other apps")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .padding(.horizontal)
        }
        .padding()
    }
}

#Preview {
    SavedPagesView(appState: AppState())
}