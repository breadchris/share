#\!/bin/bash
# Local script - Run locally without pushing to registry

set -e

echo "🏠 Starting Flow Worklet in local mode..."
echo "📦 Using local Docker daemon (no registry push)"
echo ""

# Check prerequisites
if \! command -v skaffold &> /dev/null; then
    echo "❌ Skaffold is not installed"
    exit 1
fi

if \! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not running"
    exit 1
fi

if \! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl is not configured"
    echo "   For local development, you might want to use:"
    echo "   - minikube: https://minikube.sigs.k8s.io/"
    echo "   - kind: https://kind.sigs.k8s.io/"
    echo "   - Docker Desktop with Kubernetes enabled"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

echo "🔄 Starting Skaffold in local mode..."
echo "   - Building images locally (no push to registry)"
echo "   - Using development Dockerfile"
echo "   - Port forwarding: localhost:8080 -> service:80"
echo ""
echo "💡 This mode is perfect for:"
echo "   - Working offline"
echo "   - Testing on local Kubernetes clusters"
echo "   - Avoiding registry push delays"
echo ""
echo "📝 Application will be available at:"
echo "   🌐 http://localhost:8080"
echo ""

exec skaffold dev --profile=local --port-forward
