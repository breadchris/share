# Mac DNS Routing Setup Guide: Kind → Kubernetes → Flow/Worklet

This guide sets up DNS routing on your Mac to route `.worklet.local` domains through a Kind (Kubernetes in Docker) cluster that hosts the flow/worklet system. This enables local development with Kubernetes-native DNS resolution and ingress routing.

## Architecture Overview

```
Mac DNS Request → dnsmasq → Kind Cluster → Traefik Ingress → Flow/Worklet Pods
```

When you access `http://worklet-123.worklet.local`:
1. macOS DNS resolver routes `.worklet.local` queries to dnsmasq (127.0.0.1:53533)
2. dnsmasq resolves all `.worklet.local` domains to 127.0.0.1 (localhost)
3. Traffic hits Kind cluster on port 80 (mapped to host port 30080)
4. Traefik ingress controller routes based on Host header to appropriate worklet service
5. Flow/Worklet service proxies to the actual worklet container

## Prerequisites

- macOS (tested on macOS 13+ but should work on earlier versions)
- [Homebrew](https://brew.sh/) package manager
- [Docker Desktop](https://www.docker.com/products/docker-desktop) running
- Admin/sudo access for system configuration

## Quick Start

1. **Install dependencies:**
   ```bash
   brew install kind kubectl helm dnsmasq
   ```

2. **Setup DNS routing:**
   ```bash
   cd flow/worklet
   ./scripts/setup-dns.sh
   ```

3. **Create Kind cluster:**
   ```bash
   ./scripts/setup-kind.sh
   ```

4. **Deploy worklet service:**
   ```bash
   ./scripts/deploy-worklet.sh
   ```

5. **Test the setup:**
   ```bash
   curl http://worklet.local
   # Should return worklet service response
   
   curl http://traefik.worklet.local:9000
   # Should show Traefik dashboard
   ```

## Detailed Setup Steps

### Step 1: DNS Configuration

The DNS setup configures dnsmasq to handle `.worklet.local` domains and routes them to your local Kind cluster.

**What it does:**
- Installs dnsmasq via Homebrew
- Configures dnsmasq to listen on port 53533 (to avoid conflicts)
- Routes all `*.worklet.local` domains to 127.0.0.1
- Sets up macOS resolver to use dnsmasq for `.worklet.local` domains
- Creates a launchd service to automatically start dnsmasq

**Files created:**
- `/usr/local/etc/dnsmasq.conf` - dnsmasq configuration
- `/etc/resolver/worklet` - macOS DNS resolver config
- `/Library/LaunchDaemons/com.dnsmasq.daemon.plist` - System service

### Step 2: Kind Cluster Setup

Creates a Kind cluster with proper port mappings for ingress traffic.

**What it does:**
- Creates a Kind cluster named `flow-worklet`
- Maps container ports to host ports (80→30080, 443→30443, 9000→30900)
- Mounts Docker socket for worklet container management
- Creates shared directory for worklet repositories
- Installs Traefik ingress controller with local development configuration

**Key features:**
- 3-node cluster (1 control-plane, 2 workers)
- Docker-in-Docker support for worklet containers
- Persistent storage for worklet repositories

### Step 3: Worklet Service Deployment

Deploys the flow/worklet service to the Kind cluster with proper Kubernetes resources.

**What it creates:**
- Namespace: `flow-worklet`
- ServiceAccount with RBAC permissions
- Deployment with worklet service
- Services (ClusterIP and NodePort)
- IngressRoutes for domain routing
- ConfigMap and Secret for configuration

## URL Structure

Once configured, you can access:

- **Main worklet service:** `http://worklet.local`
- **API endpoint:** `http://api.worklet.local`
- **Traefik dashboard:** `http://traefik.worklet.local:9000`
- **Individual worklets:** `http://worklet-{id}.worklet.local`

## Configuration Files

### DNS Configuration
- `dns/dnsmasq.conf` - Main dnsmasq configuration
- `dns/resolver-worklet` - macOS DNS resolver for .worklet.local
- `dns/com.dnsmasq.daemon.plist` - System service configuration

### Kubernetes Configuration
- `k8s/kind-config.yaml` - Kind cluster configuration
- `k8s/namespace.yaml` - Kubernetes namespace
- `k8s/worklet-deployment.yaml` - Main deployment
- `k8s/worklet-service.yaml` - Service definitions
- `k8s/worklet-rbac.yaml` - RBAC permissions
- `k8s/worklet-secrets.yaml` - Secrets and ConfigMap
- `k8s/worklet-ingressroute.yaml` - Traefik routing rules
- `k8s/traefik-values-local.yaml` - Traefik Helm values

## Troubleshooting

### DNS Issues

**Problem:** `worklet.local` doesn't resolve
```bash
# Test dnsmasq directly
nslookup worklet.local 127.0.0.1 -port=53533

# Check dnsmasq logs
sudo tail -f /usr/local/var/log/dnsmasq.log

# Restart dnsmasq service
sudo launchctl unload /Library/LaunchDaemons/com.dnsmasq.daemon.plist
sudo launchctl load /Library/LaunchDaemons/com.dnsmasq.daemon.plist

# Flush DNS cache
sudo dscacheutil -flushcache
```

**Problem:** System DNS doesn't use dnsmasq
```bash
# Check resolver configuration
ls -la /etc/resolver/
cat /etc/resolver/worklet

# Test with dig
dig @127.0.0.1 -p 53533 worklet.local
```

### Kubernetes Issues

**Problem:** Kind cluster not accessible
```bash
# Check cluster status
kind get clusters
kubectl cluster-info --context kind-flow-worklet

# Check node status
kubectl get nodes

# Recreate cluster
kind delete cluster --name flow-worklet
./scripts/setup-kind.sh
```

**Problem:** Traefik not responding
```bash
# Check Traefik pods
kubectl get pods -n traefik-system

# Check Traefik logs
kubectl logs -n traefik-system deployment/traefik --follow

# Check service ports
kubectl get svc -n traefik-system
```

**Problem:** Worklet service not responding
```bash
# Check worklet pods
kubectl get pods -n flow-worklet

# Check logs
kubectl logs -n flow-worklet deployment/flow-worklet-service --follow

# Check ingress routes
kubectl get ingressroutes -n flow-worklet

# Port forward for direct access
kubectl port-forward -n flow-worklet svc/flow-worklet-service 8080:80
# Then test: curl http://localhost:8080
```

### Network Issues

**Problem:** Can't reach services from browser
```bash
# Test direct port access
curl http://localhost:30080

# Test with Host header
curl -H "Host: worklet.local" http://localhost:30080

# Check port mappings
docker ps | grep kindest
```

## Development Workflow

### Creating a New Worklet

1. **Create worklet via API:**
   ```bash
   curl -X POST http://api.worklet.local/worklets \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My Test Worklet",
       "git_repo": "https://github.com/user/repo.git",
       "branch": "main",
       "base_prompt": "Create a simple React app"
     }'
   ```

2. **Access the worklet:**
   The response will include a URL like `http://worklet-abc123.worklet.local`

3. **Send prompts:**
   ```bash
   curl -X POST http://api.worklet.local/worklets/abc123/prompt \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Add a dark mode toggle"}'
   ```

### Updating the Worklet Service

1. **Make code changes to the worklet service**

2. **Rebuild and redeploy:**
   ```bash
   # Build new image
   docker build -t flow-worklet:latest .
   
   # Load into Kind
   kind load docker-image flow-worklet:latest --name flow-worklet
   
   # Restart deployment
   kubectl rollout restart deployment/flow-worklet-service -n flow-worklet
   ```

### Monitoring and Debugging

**View all components:**
```bash
# Check all pods
kubectl get pods -A

# Check services
kubectl get svc -A

# Check ingress routes
kubectl get ingressroutes -A
```

**Access logs:**
```bash
# Worklet service logs
kubectl logs -n flow-worklet deployment/flow-worklet-service --follow

# Traefik logs
kubectl logs -n traefik-system deployment/traefik --follow

# dnsmasq logs
sudo tail -f /usr/local/var/log/dnsmasq.log
```

## Cleanup

To completely remove the development environment:

```bash
./scripts/cleanup.sh
```

This will:
- Delete the Kind cluster
- Stop and remove dnsmasq service
- Remove DNS configuration files
- Clean up temporary directories
- Flush DNS cache

## Advanced Configuration

### Custom Domains

To use a different domain (e.g., `.worklet.dev`):

1. Update `dns/dnsmasq.conf`:
   ```
   address=/worklet.dev/127.0.0.1
   address=/.worklet.dev/127.0.0.1
   local=/worklet.dev/
   ```

2. Update `dns/resolver-worklet`:
   ```
   domain worklet.dev
   ```

3. Update Kubernetes configurations to use the new domain

### HTTPS Support

For HTTPS support with self-signed certificates:

1. Generate certificates:
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout worklet.local.key -out worklet.local.crt \
     -subj "/CN=*.worklet.local"
   ```

2. Create Kubernetes secret:
   ```bash
   kubectl create secret tls worklet-tls \
     --cert=worklet.local.crt --key=worklet.local.key \
     -n flow-worklet
   ```

3. Update IngressRoute to use TLS

### Resource Limits

Adjust resource limits in `k8s/worklet-deployment.yaml`:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

## Security Considerations

- dnsmasq runs as root (required for port binding)
- DNS queries are logged by default (disable in production)
- Docker socket is mounted in worklet containers (required for worklet functionality)
- No authentication is configured (add authentication for production use)

## Performance Tuning

- Increase DNS cache size in dnsmasq.conf
- Adjust Kubernetes resource limits based on workload
- Use local Docker registry for faster image loading
- Configure persistent volumes for worklet repositories

## FAQ

**Q: Why use dnsmasq instead of /etc/hosts?**
A: dnsmasq supports wildcard domains (*.worklet.local) which /etc/hosts doesn't support.

**Q: Can I use a different port for Traefik?**
A: Yes, update the port mappings in kind-config.yaml and the service configurations.

**Q: How do I access worklets from other devices on my network?**
A: You'll need to configure your router's DNS to point to your Mac's IP address for .worklet.local domains.

**Q: Does this affect my normal internet browsing?**
A: No, only .worklet.local domains are affected. All other DNS queries go to your normal DNS servers.

**Q: How do I backup my worklet configurations?**
A: Export Kubernetes resources with `kubectl get all -n flow-worklet -o yaml > backup.yaml`