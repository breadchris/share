//
//  ContentView.swift
//  share
//
//  Created by hacked on 11/13/24.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "square.and.arrow.up")
                .imageScale(.large)
                .foregroundStyle(.tint)
                .font(.system(size: 60))
            
            VStack(spacing: 15) {
                Text("Share to JustShare")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Share URLs from Safari and other apps directly to justshare.io")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            VStack(spacing: 20) {
                HStack {
                    Image(systemName: "1.circle.fill")
                        .foregroundColor(.blue)
                    Text("Open Safari and navigate to any webpage")
                        .font(.body)
                }
                
                HStack {
                    Image(systemName: "2.circle.fill")
                        .foregroundColor(.blue)
                    Text("Tap the Share button")
                        .font(.body)
                }
                
                HStack {
                    Image(systemName: "3.circle.fill")
                        .foregroundColor(.blue)
                    Text("Select 'share' from the share sheet")
                        .font(.body)
                }
                
                HStack {
                    Image(systemName: "4.circle.fill")
                        .foregroundColor(.blue)
                    Text("Add a note (optional) and tap 'Post'")
                        .font(.body)
                }
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(10)
            
            Text("URLs will be saved to justshare.io")
                .font(.caption)
                .foregroundColor(.secondary)
            
            Spacer()
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
