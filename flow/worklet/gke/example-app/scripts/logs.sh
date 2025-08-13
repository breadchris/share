#\!/bin/bash
# Logs script - View application logs

set -e

echo "📋 Flow Worklet Logs Viewer"
echo ""

# Default values
NAMESPACE="default"
FOLLOW=false
LINES=100

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        --lines)
            LINES="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -n, --namespace   Kubernetes namespace (default: default)"
            echo "  -f, --follow      Follow log output"
            echo "  --lines          Number of lines to show (default: 100)"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Show recent logs"
            echo "  $0 -f                 # Follow logs"
            echo "  $0 -n test            # Logs from test namespace"
            echo "  $0 -f --lines 50      # Follow last 50 lines"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h for help"
            exit 1
            ;;
    esac
done

# Check if kubectl is available
if \! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed"
    exit 1
fi

# Check if we can connect to cluster
if \! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster"
    exit 1
fi

# Get pod names
PODS=$(kubectl get pods -n "$NAMESPACE" -l app=flow-worklet -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)

if [[ -z "$PODS" ]]; then
    echo "❌ No flow-worklet pods found in namespace '$NAMESPACE'"
    echo ""
    echo "Available namespaces with pods:"
    kubectl get pods --all-namespaces -l app=flow-worklet -o custom-columns="NAMESPACE:.metadata.namespace,NAME:.metadata.name" --no-headers 2>/dev/null || echo "None found"
    exit 1
fi

echo "📦 Found pods in namespace '$NAMESPACE': $PODS"
echo ""

# Build kubectl logs command
CMD="kubectl logs -n $NAMESPACE -l app=flow-worklet --tail=$LINES"

if [[ "$FOLLOW" == "true" ]]; then
    CMD="$CMD -f"
    echo "🔄 Following logs (Press Ctrl+C to stop)..."
else
    echo "📖 Showing last $LINES lines..."
fi

echo ""

# Execute the command
exec $CMD
