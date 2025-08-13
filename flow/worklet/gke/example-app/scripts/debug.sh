#\!/bin/bash
# Debug script - Start Skaffold in debug mode with remote debugging

set -e

echo "🐛 Starting Flow Worklet in debug mode..."
echo "📡 Remote debugging will be available on port 40000"
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

echo "🔄 Starting Skaffold in debug mode..."
echo "   - Remote debugging via Delve"
echo "   - Debug port: localhost:40000"
echo "   - Application port: localhost:8080"
echo ""
echo "📝 Debug setup instructions:"
echo "   1. Wait for 'Waiting for incoming connections...' message"
echo "   2. Connect your debugger to localhost:40000"
echo "   3. Set breakpoints in your Go code"
echo "   4. Make requests to http://localhost:8080"
echo ""
echo "🔗 VS Code launch.json configuration:"
echo '   {'
echo '     "name": "Connect to Skaffold Debug",'
echo '     "type": "go",'
echo '     "request": "attach",'
echo '     "mode": "remote",'
echo '     "remotePath": "/app",'
echo '     "port": 40000,'
echo '     "host": "127.0.0.1"'
echo '   }'
echo ""
echo "💡 Press Ctrl+C to stop debug server"
echo ""

exec skaffold dev --profile=debug --port-forward
