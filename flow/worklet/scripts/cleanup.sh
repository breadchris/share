#!/bin/bash

# Cleanup Script for Flow/Worklet Development Environment
# This script removes all components of the development setup

set -e

echo "🧹 Cleaning up Flow/Worklet development environment..."

# Ask for confirmation
read -p "⚠️  This will remove the Kind cluster, DNS configuration, and dnsmasq service. Continue? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

# Remove Kind cluster
if kind get clusters | grep -q "flow-worklet"; then
    echo "🗑️  Removing Kind cluster..."
    kind delete cluster --name flow-worklet
else
    echo "ℹ️  No Kind cluster found."
fi

# Stop and remove dnsmasq service
echo "🛑 Stopping dnsmasq service..."
sudo launchctl unload /Library/LaunchDaemons/com.dnsmasq.daemon.plist 2>/dev/null || echo "ℹ️  dnsmasq service not loaded."

echo "🗑️  Removing dnsmasq configuration..."
sudo rm -f /Library/LaunchDaemons/com.dnsmasq.daemon.plist
sudo rm -f /usr/local/etc/dnsmasq.conf
sudo rm -f /etc/resolver/worklet
sudo rm -rf /usr/local/var/log/dnsmasq*

# Clean up temp directories
echo "🗑️  Cleaning up temporary directories..."
sudo rm -rf /tmp/worklet-repos

# Flush DNS cache
echo "🔄 Flushing DNS cache..."
sudo dscacheutil -flushcache

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "📋 Manual cleanup (optional):"
echo "   • Uninstall dnsmasq: brew uninstall dnsmasq"
echo "   • Remove Docker images: docker rmi flow-worklet:latest"
echo "   • Remove unused Docker resources: docker system prune"