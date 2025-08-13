#!/bin/bash

# Sync Mobbin Scraped Photos to Google Cloud Storage
# This script runs the TestSyncPhotosToGCS function to upload scraped images and metadata

echo "🚀 Starting Google Cloud Storage sync..."
echo "📋 This will:"
echo "   • Upload all scraped images and metadata to gs://protoflow-ml-training"
echo "   • Create a service account for external access"
echo "   • Generate credentials for sharing"
echo ""

# Check prerequisites
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK first."
    exit 1
fi

if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil not found. Please install Google Cloud SDK first."
    exit 1
fi

# Check if source directory exists
if [ ! -d "./data/scrape/mobbin.com/extension-logic" ]; then
    echo "❌ No scraped data found. Please run the scraping test first:"
    echo "   go test -v -run TestScrapeMobbinWithExtensionLogic -timeout 10m ."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Run the sync test
echo "🚀 Running sync test..."
go test -v -run TestSyncPhotosToGCS -timeout 15m .

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Sync completed successfully!"
    echo "📁 Check ./data/ for the generated service account key file"
    echo "☁️  Files are now available in gs://protoflow-ml-training/mobbin-scrapes/"
else
    echo ""
    echo "❌ Sync failed. Please check the error messages above."
    exit 1
fi