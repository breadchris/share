#\!/bin/bash
# Development script - Start Skaffold in dev mode with hot reloading

set -e

echo "🚀 Starting Flow Worklet in development mode..."
echo "📦 Using Skaffold dev profile for hot reloading"
echo ""

# Check if skaffold is installed
if \! command -v skaffold &> /dev/null; then
    echo "❌ Skaffold is not installed. Please install it first:"
    echo "   curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64"
    echo "   sudo install skaffold /usr/local/bin/"
    exit 1
fi

# Check if kubectl is configured
if \! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl is not configured or cluster is not accessible"
    echo "   Make sure you're connected to your GKE cluster"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start development with hot reloading
echo "🔄 Starting Skaffold in dev mode..."
echo "   - File sync enabled for *.go files"
echo "   - Port forwarding: localhost:8080 -> service:80"
echo "   - Hot reloading via Air"
echo ""
echo "📝 Development endpoints will be available at:"
echo "   🌐 Application: http://localhost:8080"
echo "   🏥 Health: http://localhost:8080/health"  
echo "   📊 Status: http://localhost:8080/status"
echo "   🔧 Config: http://localhost:8080/config"
echo "   🐛 Debug: http://localhost:8080/debug/request"
echo ""
echo "💡 Press Ctrl+C to stop development server"
echo ""

exec skaffold dev --profile=dev --port-forward
