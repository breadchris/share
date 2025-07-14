//
//  ContentView.swift
//  share
//
//  Native URL saver app using Extension API
//

import SwiftUI

struct ContentView: View {
    @StateObject private var appState = AppState()
    @State private var urlInput = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var alertTitle = ""
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // URL Input Section
                VStack(spacing: 16) {
                    Text("Save URLs")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("Enter any URL to save it with extracted content")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    // URL Input Field
                    VStack(spacing: 12) {
                        TextField("Enter URL here...", text: $urlInput)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.URL)
                            .autocapitalization(.none)
                            .autocorrectionDisabled()
                            .focused($isInputFocused)
                            .onSubmit {
                                saveURL()
                            }
                        
                        // Save Button
                        Button(action: saveURL) {
                            HStack {
                                if appState.isLoading {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                        .foregroundColor(.white)
                                } else {
                                    Image(systemName: "bookmark.fill")
                                }
                                
                                Text(appState.isLoading ? "Saving..." : "Save URL")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                (canSave && !appState.isLoading) ? Color.blue : Color.gray
                            )
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .disabled(!canSave || appState.isLoading)
                    }
                }
                .padding()
                .background(Color(.systemGroupedBackground))
                
                Divider()
                
                // Saved Pages List
                SavedPagesView(appState: appState)
            }
            .navigationBarHidden(true)
            .alert(alertTitle, isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
            .onTapGesture {
                // Dismiss keyboard when tapping outside
                isInputFocused = false
            }
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
    
    private var canSave: Bool {
        !urlInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        URLValidator.isValid(URLValidator.format(urlInput))
    }
    
    private func saveURL() {
        guard canSave else {
            showAlert(title: "Invalid URL", message: "Please enter a valid URL")
            return
        }
        
        let formattedURL = URLValidator.format(urlInput)
        
        appState.isLoading = true
        isInputFocused = false
        
        Task {
            do {
                let pageInfo = try await ExtensionAPI.shared.saveURLSimple(formattedURL)
                
                await MainActor.run {
                    appState.addSavedPage(pageInfo)
                    appState.isLoading = false
                    urlInput = ""
                    
                    showAlert(
                        title: "Success!",
                        message: "Saved \"\(pageInfo.title.isEmpty ? pageInfo.url : pageInfo.title)\""
                    )
                }
                
            } catch {
                await MainActor.run {
                    appState.isLoading = false
                    showAlert(
                        title: "Save Failed",
                        message: error.localizedDescription
                    )
                }
            }
        }
    }
    
    private func showAlert(title: String, message: String) {
        alertTitle = title
        alertMessage = message
        showingAlert = true
    }
}

// MARK: - Quick Actions View
struct QuickActionsView: View {
    @Binding var urlInput: String
    let onSave: () -> Void
    
    var body: some View {
        VStack(spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.primary)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                QuickActionButton(
                    title: "Paste & Save",
                    icon: "doc.on.clipboard",
                    color: .blue
                ) {
                    if let clipboardText = UIPasteboard.general.string,
                       URLValidator.isValid(URLValidator.format(clipboardText)) {
                        urlInput = clipboardText
                        onSave()
                    }
                }
                
                QuickActionButton(
                    title: "Clear",
                    icon: "trash",
                    color: .red
                ) {
                    urlInput = ""
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(8)
        }
    }
}

#Preview {
    ContentView()
}