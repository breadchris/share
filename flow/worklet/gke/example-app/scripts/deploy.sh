#\!/bin/bash
# Deploy script - Deploy to production with proper tagging

set -e

echo "🚀 Deploying Flow Worklet to production..."
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

if \! command -v git &> /dev/null; then
    echo "❌ git is not installed (needed for commit tagging)"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ \! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

echo "✅ Prerequisites check passed"
echo ""

# Get git commit info
GIT_COMMIT=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "📋 Deployment details:"
echo "   Branch: $GIT_BRANCH"
echo "   Commit: $GIT_COMMIT"
echo "   Tag: git-$GIT_COMMIT"
echo ""

echo "🔄 Starting production deployment..."
echo "   - Building optimized production image"
echo "   - Tagging with git commit hash"
echo "   - Deploying with TLS certificates"
echo "   - 3 replicas for high availability"
echo ""
echo "⚠️  This will deploy to PRODUCTION environment"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ \! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Deploying to production..."

# Set git commit as environment variable for build args
export GIT_COMMIT

exec skaffold run --profile=prod
