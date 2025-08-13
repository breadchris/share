#\!/bin/bash
# Clean script - Clean up resources and images

set -e

echo "🧹 Flow Worklet Cleanup Script"
echo ""

# Default values
NAMESPACE="default"
ALL_NAMESPACES=false
IMAGES=false
CONFIRM=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --all-namespaces)
            ALL_NAMESPACES=true
            shift
            ;;
        --images)
            IMAGES=true
            shift
            ;;
        -y|--yes)
            CONFIRM=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -n, --namespace      Clean specific namespace (default: default)"
            echo "  --all-namespaces     Clean from all namespaces"
            echo "  --images             Also clean Docker images"
            echo "  -y, --yes            Skip confirmation prompts"
            echo "  -h, --help           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Clean default namespace"
            echo "  $0 -n test             # Clean test namespace"  
            echo "  $0 --all-namespaces    # Clean all namespaces"
            echo "  $0 --images -y         # Clean images without confirmation"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h for help"
            exit 1
            ;;
    esac
done

# Check prerequisites
if \! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed"
    exit 1
fi

if [[ "$IMAGES" == "true" ]] && \! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed (needed for image cleanup)"
    exit 1
fi

echo "🔍 What will be cleaned:"

# Build namespace selector
if [[ "$ALL_NAMESPACES" == "true" ]]; then
    NS_FLAG="--all-namespaces"
    NS_DESC="all namespaces"
else
    NS_FLAG="-n $NAMESPACE"
    NS_DESC="namespace '$NAMESPACE'"
fi

# Check what resources exist
DEPLOYMENTS=$(kubectl get deployments $NS_FLAG -l app=flow-worklet -o name 2>/dev/null | wc -l)
SERVICES=$(kubectl get services $NS_FLAG -l app=flow-worklet -o name 2>/dev/null | wc -l)
PODS=$(kubectl get pods $NS_FLAG -l app=flow-worklet -o name 2>/dev/null | wc -l)

echo "   📦 Deployments: $DEPLOYMENTS in $NS_DESC"
echo "   🌐 Services: $SERVICES in $NS_DESC"
echo "   🏃 Pods: $PODS in $NS_DESC"

if [[ "$IMAGES" == "true" ]]; then
    DOCKER_IMAGES=$(docker images | grep flow-worklet-example | wc -l)
    echo "   🐳 Docker images: $DOCKER_IMAGES flow-worklet-example images"
fi

echo ""

# Confirmation
if [[ "$CONFIRM" == "true" ]]; then
    read -p "Are you sure you want to clean these resources? (y/N): " -n 1 -r
    echo
    if [[ \! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cleanup cancelled"
        exit 1
    fi
fi

echo "🧹 Starting cleanup..."

# Clean Kubernetes resources
if [[ $DEPLOYMENTS -gt 0 ]]; then
    echo "   🗑️  Deleting deployments..."
    kubectl delete deployments $NS_FLAG -l app=flow-worklet
fi

if [[ $SERVICES -gt 0 ]]; then
    echo "   🗑️  Deleting services..."
    kubectl delete services $NS_FLAG -l app=flow-worklet
fi

if [[ $PODS -gt 0 ]]; then
    echo "   🗑️  Deleting pods..."
    kubectl delete pods $NS_FLAG -l app=flow-worklet
fi

# Clean Docker images
if [[ "$IMAGES" == "true" ]] && [[ $DOCKER_IMAGES -gt 0 ]]; then
    echo "   🗑️  Deleting Docker images..."
    docker images | grep flow-worklet-example | awk '{print $3}' | xargs -r docker rmi -f
fi

echo ""
echo "✅ Cleanup completed successfully\!"

# Show remaining resources
echo ""
echo "🔍 Remaining resources:"
kubectl get all $NS_FLAG -l app=flow-worklet 2>/dev/null || echo "   None found"

if [[ "$IMAGES" == "true" ]]; then
    echo ""
    echo "🐳 Remaining Docker images:"
    docker images | grep flow-worklet-example || echo "   None found"
fi
