#\!/bin/bash
# Test script - Run tests and deploy to test namespace

set -e

echo "🧪 Starting Flow Worklet in test mode..."
echo "📋 Running tests before deployment"
echo ""

# Check prerequisites
if \! command -v skaffold &> /dev/null; then
    echo "❌ Skaffold is not installed"
    exit 1
fi

if \! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl is not configured or cluster is not accessible"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Create test namespace if it doesn't exist
if \! kubectl get namespace test &> /dev/null; then
    echo "🏗️  Creating test namespace..."
    kubectl create namespace test
fi

echo "🔄 Starting Skaffold in test mode..."
echo "   - Running Go tests during build"
echo "   - Deploying to 'test' namespace"
echo "   - Build will fail if tests fail"
echo ""
echo "📝 Test workflow:"
echo "   1. Run 'go test ./...' during build"
echo "   2. Build application only if tests pass"
echo "   3. Deploy to test namespace"
echo "   4. Forward port for testing"
echo ""
echo "🎯 Use this for:"
echo "   - Continuous integration testing"
echo "   - Pre-production validation"
echo "   - Automated testing pipelines"
echo ""

exec skaffold run --profile=test
