#!/bin/bash

# Deploy script for scraper Lambda example

set -e

echo "🚀 Deploying Scraper Lambda Example"
echo "=================================="

# Check if Pulumi is installed
if ! command -v pulumi &> /dev/null; then
    echo "❌ Pulumi CLI not found. Please install it first: https://www.pulumi.com/docs/get-started/install/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Set working directory
cd "$(dirname "$0")"

# Initialize Go modules
echo "📦 Initializing Go modules..."
go mod tidy

# Build and test locally first
echo "🔨 Building Lambda function..."
GOOS=linux GOARCH=amd64 go build -o bootstrap ./cmd/lambda

# Clean up build artifact
rm -f bootstrap

# Initialize Pulumi stack if it doesn't exist
if ! pulumi stack ls | grep -q "dev"; then
    echo "📋 Initializing Pulumi stack..."
    pulumi stack init dev
fi

# Deploy infrastructure
echo "☁️  Deploying to AWS..."
pulumi up --yes

# Get the deployed endpoint
ENDPOINT=$(pulumi stack output endpoint 2>/dev/null || echo "Not available")

echo ""
echo "✅ Deployment completed successfully!"
echo "=================================="
echo "🔗 API Endpoint: $ENDPOINT"
echo ""
echo "📝 Test the function with:"
echo "curl -X POST $ENDPOINT/scrape \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"url\":\"https://example.com\",\"javascript\":true,\"extractData\":true}'"
echo ""
echo "📚 See README.md for more usage examples"