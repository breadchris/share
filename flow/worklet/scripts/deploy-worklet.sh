#!/bin/bash

# Worklet Deployment Script for Kind Cluster
# This script deploys the flow/worklet service to the Kind cluster

set -e

echo "🚀 Deploying Flow/Worklet service to Kind cluster..."

# Check if kubectl is configured for the Kind cluster
if ! kubectl cluster-info --context kind-flow-worklet &> /dev/null; then
    echo "❌ Kind cluster 'flow-worklet' not found or not accessible."
    echo "   Run ./scripts/setup-kind.sh first."
    exit 1
fi

# Set context to Kind cluster
kubectl config use-context kind-flow-worklet

# Apply namespace
echo "📁 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply RBAC
echo "🔐 Applying RBAC configuration..."
kubectl apply -f k8s/worklet-rbac.yaml

# Apply secrets and config (prompt for GitHub token if needed)
echo "🔑 Applying secrets and configuration..."
kubectl apply -f k8s/worklet-secrets.yaml

# Check if GitHub token is set
if ! kubectl get secret flow-worklet-secrets -n flow-worklet -o jsonpath='{.data.github-token}' | base64 -d | grep -q "."; then
    echo ""
    echo "⚠️  GitHub token not configured in secrets."
    read -p "🔑 Enter your GitHub token (optional, press Enter to skip): " github_token
    if [[ -n "$github_token" ]]; then
        kubectl patch secret flow-worklet-secrets -n flow-worklet -p="{\"data\":{\"github-token\":\"$(echo -n "$github_token" | base64)\"}}"
        echo "✅ GitHub token configured."
    else
        echo "ℹ️  Skipping GitHub token. You can set it later with:"
        echo "   kubectl patch secret flow-worklet-secrets -n flow-worklet -p='{\"data\":{\"github-token\":\"<base64-token>\"}'"
    fi
fi

# Apply services
echo "🌐 Creating services..."
kubectl apply -f k8s/worklet-service.yaml

# Build worklet image (if Dockerfile exists)
if [[ -f "../Dockerfile" ]]; then
    echo "🏗️  Building worklet Docker image..."
    docker build -t flow-worklet:latest -f ../Dockerfile ..
    
    echo "📦 Loading image into Kind cluster..."
    kind load docker-image flow-worklet:latest --name flow-worklet
else
    echo "⚠️  No Dockerfile found at ../Dockerfile"
    echo "   You'll need to build and load the worklet image manually:"
    echo "   docker build -t flow-worklet:latest ."
    echo "   kind load docker-image flow-worklet:latest --name flow-worklet"
fi

# Apply deployment
echo "🚀 Creating deployment..."
kubectl apply -f k8s/worklet-deployment.yaml

# Apply ingress routes
echo "🌐 Creating ingress routes..."
kubectl apply -f k8s/worklet-ingressroute.yaml

# Wait for deployment
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --namespace flow-worklet \
    --for=condition=available deployment/flow-worklet-service \
    --timeout=300s || echo "⚠️  Deployment may still be starting..."

# Get status
echo "📊 Deployment status:"
kubectl get pods -n flow-worklet
kubectl get services -n flow-worklet
kubectl get ingressroutes -n flow-worklet

# Test endpoints
echo ""
echo "🧪 Testing endpoints..."

# Test if Traefik is responding
if curl -s --connect-timeout 5 http://localhost:30080 > /dev/null; then
    echo "✅ Traefik is responding on port 30080"
else
    echo "❌ Traefik is not responding on port 30080"
fi

# Test worklet endpoint (might not be ready yet)
if curl -s --connect-timeout 5 -H "Host: worklet.local" http://localhost:30080/health > /dev/null; then
    echo "✅ Worklet service is responding"
else
    echo "⚠️  Worklet service not ready yet (this is normal for first deployment)"
fi

echo ""
echo "🎉 Flow/Worklet deployment complete!"
echo ""
echo "📋 Access URLs (after DNS is configured):"
echo "   • Main worklet service: http://worklet.local"
echo "   • API endpoint: http://api.worklet.local"
echo "   • Traefik dashboard: http://traefik.worklet.local:9000"
echo ""
echo "🔧 Useful commands:"
echo "   • Check pods: kubectl get pods -n flow-worklet"
echo "   • Check logs: kubectl logs -n flow-worklet deployment/flow-worklet-service"
echo "   • Port forward: kubectl port-forward -n flow-worklet svc/flow-worklet-service 8080:80"
echo "   • Update deployment: kubectl rollout restart deployment/flow-worklet-service -n flow-worklet"