# Flow Worklet GKE Deployment - Fully Automated

This package contains Pulumi code for **completely automated** deployment of a production-ready GKE cluster with:
- Traefik ingress controller with automatic TLS certificates
- cert-manager for Let's Encrypt integration  
- Complete application deployment
- ACME-compatible configuration (no manual intervention required)

## What Gets Deployed Automatically

✅ **GCP APIs**: Container, Compute, and Container Registry APIs enabled  
✅ **GKE Cluster**: Production-ready cluster with autoscaling node pool  
✅ **cert-manager**: Automatic TLS certificate management  
✅ **Traefik**: LoadBalancer with proper ACME HTTP-01 challenge support  
✅ **Application**: Full deployment with ingress, services, and certificates  
✅ **Security**: HTTPS redirects, security headers, and TLS termination  

## Prerequisites

1. **Install required tools**:
   ```bash
   # Install Pulumi
   brew install pulumi  # or use installer from https://www.pulumi.com/docs/get-started/install/
   
   # Install Google Cloud SDK  
   brew install google-cloud-sdk  # or use installer from https://cloud.google.com/sdk/docs/install
   ```

2. **Configure Google Cloud authentication**:
   ```bash
   gcloud auth login
   gcloud auth application-default login  # Required for Pulumi
   gcloud config set project planar-sun-402202
   ```

3. **Domain Setup** (can be done after deployment):
   - You need DNS control for `flow-worklet.baked.mom`
   - DNS configuration is done after getting the LoadBalancer IP

## One-Command Deployment

```bash
cd flow/worklet/gke

# Initialize Pulumi (first time only)
pulumi login --local
export PULUMI_CONFIG_PASSPHRASE="flow-worklet-gke"
pulumi stack init production
pulumi config set gcp:project planar-sun-402202

# Deploy everything
pulumi up
```

**That's it!** No manual steps required.

## What Happens During Deployment

1. **API Enablement** (30 seconds)
   - Enables GKE, Compute Engine, and Container Registry APIs
   
2. **Infrastructure Creation** (5-8 minutes)
   - Creates GKE cluster with autoscaling node pool (1-5 nodes)
   - Configures proper OAuth scopes for container registry access
   
3. **Platform Installation** (2-3 minutes)
   - Installs cert-manager with CRDs
   - Installs Traefik with ACME-compatible configuration
   - Creates Let's Encrypt ClusterIssuer
   
4. **Application Deployment** (1-2 minutes)
   - Deploys example application (3 replicas)
   - Creates services and ingress routes
   - Requests TLS certificate from Let's Encrypt

## Post-Deployment: Configure DNS

1. **Get the LoadBalancer IP**:
   ```bash
   kubectl get svc -n traefik-system traefik
   ```

2. **Configure DNS**:
   - Set A record: `flow-worklet.baked.mom` → `[LoadBalancer IP]`

3. **Verify deployment**:
   ```bash
   # Check certificate status (should be ready within 1-2 minutes after DNS)
   kubectl get certificate flow-worklet-tls
   
   # Test application
   curl https://flow-worklet.baked.mom
   ```

## Key Improvements Over Manual Setup

| Manual Process | Automated Process |
|----------------|-------------------|
| 8+ manual steps | 1 command |
| ~30 minutes | ~10 minutes |
| Error-prone | Reliable |
| Inconsistent | Reproducible |
| Manual ACME fixes | ACME-compatible from start |
| Image tag issues | Proper image references |
| Missing dependencies | Complete dependency management |

## Architecture

The deployment creates:

```
Internet → LoadBalancer (35.x.x.x) → Traefik → Application Pods
                ↓
         Let's Encrypt TLS Certificate
         (via HTTP-01 challenge)
```

### Components:
- **GKE Cluster**: `flow-worklet-cluster` in `us-central1-a`
- **Node Pool**: `primary-pool` with 1-5 autoscaling nodes
- **Traefik**: Single replica LoadBalancer (required for ACME)
- **cert-manager**: Handles automatic certificate lifecycle
- **Application**: Go web server with health checks

### Security Features:
- **TLS Certificates**: Automatic Let's Encrypt certificates
- **HTTPS Redirect**: HTTP traffic redirected to HTTPS  
- **Security Headers**: HSTS, XSS protection, content type protection
- **Resource Limits**: CPU and memory limits on all containers

## ACME Certificate Process

The deployment is specifically configured to work with Let's Encrypt's HTTP-01 challenge:

1. ✅ **No Global HTTPS Redirect**: Allows ACME challenges over HTTP
2. ✅ **Traefik Ingress Provider**: Handles cert-manager HTTP challenges  
3. ✅ **Single Replica**: Required for ACME with file storage
4. ✅ **Proper Dependencies**: cert-manager installed before certificates requested

## Configuration

The deployment uses hardcoded values optimized for the flow-worklet use case:

- **Project**: `planar-sun-402202`
- **Domain**: `flow-worklet.baked.mom`  
- **Email**: `chris@breadchris.com`
- **Image**: `gcr.io/planar-sun-402202/flow-worklet-example:latest`

To customize for different projects, update the variables in `main.go`.

## Outputs

After deployment, Pulumi exports:

```bash
pulumi stack output kubeconfig > kubeconfig.yaml
pulumi stack output instructions  # Step-by-step instructions
```

## Troubleshooting

### Certificate Issues
```bash
# Check certificate status
kubectl describe certificate flow-worklet-tls

# Check ACME challenges  
kubectl get challenges

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager
```

### Application Issues
```bash
# Check pod status
kubectl get pods

# Check application logs
kubectl logs -l app=flow-worklet

# Check ingress
kubectl get ingressroute
```

### Traefik Issues
```bash
# Check Traefik logs
kubectl logs -n traefik-system -l app.kubernetes.io/name=traefik

# Check LoadBalancer
kubectl get svc -n traefik-system traefik
```

## Clean Up

```bash
pulumi destroy  # Removes all resources
```

## Development Workflow

For ongoing development after initial deployment:

```bash
# Build and push new image
cd example-app  
docker build -t gcr.io/planar-sun-402202/flow-worklet-example:latest .
docker push gcr.io/planar-sun-402202/flow-worklet-example:latest

# Update deployment
kubectl rollout restart deployment flow-worklet-app
```

## Production Considerations

- **Monitoring**: Add Prometheus/Grafana for monitoring
- **Backup**: Configure automated backups for persistent data
- **Secrets**: Use Google Secret Manager for sensitive data
- **Multi-region**: Consider multi-region deployment for HA
- **Resource Scaling**: Adjust node pool sizing based on load

This automated deployment provides a solid foundation for production workloads with industry-standard security and reliability practices.