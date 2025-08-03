#!/bin/bash

# DNS Setup Script for Flow/Worklet Local Development
# This script sets up DNS routing for .worklet.local domains through dnsmasq

set -e

echo "🔧 Setting up DNS routing for Flow/Worklet development..."

# Check if running as root for system changes
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Run as your normal user."
   echo "   It will prompt for sudo when needed."
   exit 1
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is required. Install it from https://brew.sh/"
    exit 1
fi

# Install dnsmasq if not already installed
if ! command -v dnsmasq &> /dev/null; then
    echo "📦 Installing dnsmasq..."
    brew install dnsmasq
else
    echo "✅ dnsmasq is already installed"
fi

# Create necessary directories
echo "📁 Creating directories..."
sudo mkdir -p /usr/local/var/log
sudo mkdir -p /etc/resolver

# Copy dnsmasq configuration
echo "⚙️  Configuring dnsmasq..."
sudo cp dns/dnsmasq.conf /usr/local/etc/dnsmasq.conf
sudo chown root:wheel /usr/local/etc/dnsmasq.conf

# Copy DNS resolver configuration
echo "🌐 Configuring macOS DNS resolver..."
sudo cp dns/resolver-worklet /etc/resolver/worklet
sudo chown root:wheel /etc/resolver/worklet

# Copy and install launchd plist
echo "🚀 Setting up dnsmasq service..."
sudo cp dns/com.dnsmasq.daemon.plist /Library/LaunchDaemons/
sudo chown root:wheel /Library/LaunchDaemons/com.dnsmasq.daemon.plist

# Load and start dnsmasq service
echo "▶️  Starting dnsmasq service..."
sudo launchctl unload /Library/LaunchDaemons/com.dnsmasq.daemon.plist 2>/dev/null || true
sudo launchctl load /Library/LaunchDaemons/com.dnsmasq.daemon.plist

# Wait a moment for service to start
sleep 2

# Test DNS resolution
echo "🧪 Testing DNS resolution..."
if nslookup worklet.local 127.0.0.1 -port=53533 | grep -q "127.0.0.1"; then
    echo "✅ DNS resolution test passed!"
else
    echo "❌ DNS resolution test failed. Check the logs:"
    echo "   sudo tail -f /usr/local/var/log/dnsmasq.log"
    exit 1
fi

# Test system DNS resolution
echo "🧪 Testing system DNS resolution..."
if ping -c 1 -W 1000 worklet.local &> /dev/null; then
    echo "✅ System DNS resolution test passed!"
else
    echo "⚠️  System DNS resolution test failed. This might be normal on first setup."
    echo "   Try flushing DNS cache: sudo dscacheutil -flushcache"
fi

echo ""
echo "🎉 DNS setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run ./scripts/setup-kind.sh to create the Kind cluster"
echo "   2. Run ./scripts/deploy-worklet.sh to deploy the worklet service"
echo "   3. Test with: curl http://worklet.local"
echo ""
echo "🔧 Useful commands:"
echo "   • Check dnsmasq status: sudo launchctl list | grep dnsmasq"
echo "   • View dnsmasq logs: sudo tail -f /usr/local/var/log/dnsmasq.log"
echo "   • Restart dnsmasq: sudo launchctl unload /Library/LaunchDaemons/com.dnsmasq.daemon.plist && sudo launchctl load /Library/LaunchDaemons/com.dnsmasq.daemon.plist"
echo "   • Flush DNS cache: sudo dscacheutil -flushcache"