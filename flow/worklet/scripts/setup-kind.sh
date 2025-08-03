#!/bin/bash

# Kind Cluster Setup Script for Flow/Worklet Development
# This script creates a Kind cluster with proper ingress configuration

set -e

echo "🚀 Setting up Kind cluster for Flow/Worklet development..."

# Check if Kind is installed
if ! command -v kind &> /dev/null; then
    echo "❌ Kind is required. Install it with:"
    echo "   brew install kind"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is required. Install it with:"
    echo "   brew install kubectl"
    exit 1
fi

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo "❌ Helm is required. Install it with:"
    echo "   brew install helm"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Create tmp directory for worklet repos
echo "📁 Creating worklet repositories directory..."
mkdir -p /tmp/worklet-repos

# Delete existing cluster if it exists
if kind get clusters | grep -q "flow-worklet"; then
    echo "🗑️  Deleting existing flow-worklet cluster..."
    kind delete cluster --name flow-worklet
fi

# Create Kind cluster
echo "🏗️  Creating Kind cluster..."
kind create cluster --config k8s/kind-config.yaml --wait 300s

# Set kubectl context
echo "⚙️  Setting kubectl context..."
kubectl cluster-info --context kind-flow-worklet

# Add Traefik Helm repository
echo "📦 Adding Traefik Helm repository..."
helm repo add traefik https://helm.traefik.io/traefik
helm repo update

# Install Traefik with local configuration
echo "🌐 Installing Traefik ingress controller..."
helm upgrade --install traefik traefik/traefik \
    --namespace traefik-system \
    --create-namespace \
    --values k8s/traefik-values-local.yaml \
    --wait

# Wait for Traefik to be ready
echo "⏳ Waiting for Traefik to be ready..."
kubectl wait --namespace traefik-system \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/name=traefik \
    --timeout=300s

# Get cluster info
echo "📊 Cluster information:"
kubectl get nodes
kubectl get pods -A

echo ""
echo "🎉 Kind cluster setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run ./scripts/deploy-worklet.sh to deploy the worklet service"
echo "   2. Test Traefik dashboard: http://traefik.worklet.local:9000"
echo ""
echo "🔧 Useful commands:"
echo "   • Check cluster: kubectl get nodes"
echo "   • Check Traefik: kubectl get pods -n traefik-system"
echo "   • Port forward Traefik dashboard: kubectl port-forward -n traefik-system svc/traefik 9000:9000"
echo "   • Delete cluster: kind delete cluster --name flow-worklet"