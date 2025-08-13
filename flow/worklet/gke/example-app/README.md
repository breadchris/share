# Flow Worklet Skaffold Example

A comprehensive example demonstrating how to use Skaffold for rapid Kubernetes development and deployment workflows with the Flow Worklet service.

## Overview

This example provides a complete development-to-production pipeline using Skaffold with multiple profiles:

- **🔧 Development**: Hot reloading with file sync
- **🐛 Debug**: Remote debugging with Delve
- **🏠 Local**: Local builds without registry
- **🧪 Test**: Automated testing with deployment
- **🚀 Production**: Optimized production deployment

## Quick Start

### Prerequisites

Install required tools:

```bash
# Install Skaffold
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
sudo install skaffold /usr/local/bin/

# Install kubectl (if not already installed)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/

# Configure kubectl for your GKE cluster
gcloud container clusters get-credentials flow-worklet-cluster --zone=us-central1-a --project=planar-sun-402202
```

### Quick Development

```bash
# Start development with hot reloading
./scripts/dev.sh

# Or manually:
skaffold dev --profile=dev --port-forward
```

Visit http://localhost:8080 to see your application with development features enabled.

## Profiles and Use Cases

### 🔧 Development Profile (`dev`)

**Best for**: Daily development work with instant feedback

```bash
./scripts/dev.sh
# or
skaffold dev --profile=dev --port-forward
```

**Features**:
- File sync for `*.go` files (no rebuild needed)
- Hot reloading with Air
- Enhanced development UI with debugging endpoints  
- Single replica for fast iteration
- Relaxed health checks
- Debug logging enabled

**Endpoints**:
- 🌐 **Application**: http://localhost:8080
- 🏥 **Health**: http://localhost:8080/health
- 📊 **Status**: http://localhost:8080/status  
- ⚙️ **Config**: http://localhost:8080/config
- 🐛 **Debug**: http://localhost:8080/debug/request

### 🐛 Debug Profile (`debug`)

**Best for**: Troubleshooting and step-through debugging

```bash
./scripts/debug.sh
# or  
skaffold dev --profile=debug --port-forward
```

**Features**:
- Remote debugging with Delve
- Debug port forwarded to localhost:40000
- Source maps available for breakpoints
- Higher resource limits for debugging overhead

**VS Code Configuration**:
```json
{
  "name": "Connect to Skaffold Debug",
  "type": "go", 
  "request": "attach",
  "mode": "remote",
  "remotePath": "/app",
  "port": 40000,
  "host": "127.0.0.1"
}
```

### 🏠 Local Profile (`local`)

**Best for**: Offline development and local Kubernetes testing

```bash
./scripts/local.sh
# or
skaffold dev --profile=local --port-forward
```

**Features**:
- No registry push (uses local Docker daemon)
- Works with minikube, kind, or Docker Desktop
- Fast builds without network dependencies
- Perfect for airplane coding

### 🧪 Test Profile (`test`)

**Best for**: Continuous integration and automated testing

```bash
./scripts/test.sh
# or
skaffold run --profile=test
```

**Features**:
- Runs `go test ./...` during Docker build
- Build fails if tests fail
- Deploys to `test` namespace
- 2 replicas for load testing
- Production-like environment

### 🚀 Production Profile (`prod`)

**Best for**: Production deployments with proper versioning

```bash
./scripts/deploy.sh
# or
skaffold run --profile=prod
```

**Features**:
- Git commit-based tagging
- 3 replicas for high availability
- Full TLS certificates via Let's Encrypt
- Security headers and HTTPS redirects
- Resource limits and health checks
- Optimized Docker builds

## File Structure

```
example-app/
├── main.go                     # Enhanced Go application
├── go.mod                      # Go module file
├── Dockerfile                  # Production Dockerfile
├── Dockerfile.dev              # Development with hot reloading
├── Dockerfile.debug            # Debug with Delve
├── Dockerfile.test             # Test execution
├── skaffold.yaml              # Multi-profile configuration
├── scripts/
│   ├── dev.sh                 # Development workflow
│   ├── debug.sh               # Debug workflow  
│   ├── local.sh               # Local workflow
│   ├── test.sh                # Test workflow
│   ├── deploy.sh              # Production deployment
│   ├── logs.sh                # View logs
│   └── clean.sh               # Cleanup resources
└── k8s/
    ├── deployment.yaml        # Production deployment
    ├── deployment-dev.yaml    # Development deployment
    ├── deployment-debug.yaml  # Debug deployment
    ├── deployment-local.yaml  # Local deployment
    ├── deployment-test.yaml   # Test deployment
    ├── service.yaml           # Service definition
    ├── ingress.yaml           # Ingress configuration
    ├── middleware.yaml        # Traefik middleware
    └── certificate.yaml       # TLS certificates
```

## Development Workflows

### Making Changes

1. **Start development mode**:
   ```bash
   ./scripts/dev.sh
   ```

2. **Edit Go files**: Changes are synced instantly (no rebuild)

3. **Edit other files**: Triggers automatic rebuild and redeploy

4. **View logs**:
   ```bash
   ./scripts/logs.sh -f  # Follow logs
   ```

### Debugging Issues

1. **Start debug mode**:
   ```bash
   ./scripts/debug.sh
   ```

2. **Connect debugger** to localhost:40000

3. **Set breakpoints** in your IDE

4. **Make requests** to trigger breakpoints

### Testing Changes

1. **Run tests locally**:
   ```bash
   go test ./...
   ```

2. **Test in cluster**:
   ```bash
   ./scripts/test.sh
   ```

3. **View test results** in build logs

### Deploying to Production

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Your changes"  
   ```

2. **Deploy**:
   ```bash
   ./scripts/deploy.sh
   ```

3. **Verify deployment**:
   ```bash
   kubectl get pods -l app=flow-worklet
   curl https://flow-worklet.baked.mom
   ```

## Environment-Specific Features

### Development Environment

- **Rich HTML interface** with styled debugging information
- **Multiple endpoints** for inspecting application state
- **Verbose logging** with emojis for easy parsing
- **Hot reloading** via Air for instant feedback
- **File sync** to avoid rebuilds on Go file changes

### Debug Environment  

- **Delve integration** for step-through debugging
- **Source map support** for breakpoint accuracy
- **Remote debugging** accessible from any IDE
- **Higher resource limits** to handle debugging overhead

### Test Environment

- **Automated testing** as part of the build process
- **Test namespace isolation** to avoid conflicts
- **Production-like setup** for realistic testing
- **Multiple replicas** for load testing scenarios

### Production Environment

- **Optimized builds** with minimal image size
- **Git-based versioning** for traceability  
- **High availability** with 3 replicas
- **Security headers** and TLS termination
- **Resource limits** for predictable performance

## Configuration

### Environment Variables

| Variable | Development | Debug | Test | Production |
|----------|-------------|-------|------|------------|
| `ENV` | development | debug | test | production |
| `DEBUG_MODE` | true | true | false | false |
| `LOG_LEVEL` | debug | debug | info | info |
| `PORT` | 8080 | 8080 | 8080 | 8080 |

### Resource Limits

| Profile | Memory Request | Memory Limit | CPU Request | CPU Limit |
|---------|----------------|--------------|-------------|-----------|
| Development | 128Mi | 256Mi | 250m | 1000m |
| Debug | 256Mi | 512Mi | 500m | 1000m |
| Test | 64Mi | 128Mi | 250m | 500m |
| Production | 64Mi | 128Mi | 250m | 500m |
| Local | 64Mi | 128Mi | 100m | 500m |

## Troubleshooting

### Common Issues

**Skaffold not found**:
```bash
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
sudo install skaffold /usr/local/bin/
```

**kubectl not configured**:
```bash
gcloud container clusters get-credentials flow-worklet-cluster \
  --zone=us-central1-a --project=planar-sun-402202
```

**Docker daemon not accessible**:
```bash
# Check Docker is running
docker version

# For Linux users, add to docker group:
sudo usermod -aG docker $USER
# Then log out and back in
```

**Port already in use**:
```bash
# Kill processes using port 8080
sudo lsof -i :8080
sudo kill -9 <PID>
```

### Debugging Skaffold

**Verbose output**:
```bash
skaffold dev --profile=dev -v debug
```

**Check configuration**:
```bash
skaffold config list
skaffold diagnose
```  

**View events**:
```bash
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Application Debugging

**View all logs**:
```bash
./scripts/logs.sh --all-namespaces -f
```

**Check pod status**:  
```bash
kubectl get pods -l app=flow-worklet -o wide
kubectl describe pod <pod-name>
```

**Test endpoints**:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/status  
curl http://localhost:8080/debug/request
```

## Script Reference

### `./scripts/dev.sh`
Start development with hot reloading and file sync.

### `./scripts/debug.sh` 
Start with remote debugging via Delve on port 40000.

### `./scripts/local.sh`
Run locally without pushing to container registry.

### `./scripts/test.sh`
Run tests and deploy to test namespace.

### `./scripts/deploy.sh`
Deploy to production with git commit tagging.

### `./scripts/logs.sh [OPTIONS]`
View application logs with flexible options.

**Options**:
- `-n, --namespace`: Specify namespace
- `-f, --follow`: Follow log output  
- `--lines`: Number of lines to show

### `./scripts/clean.sh [OPTIONS]`
Clean up Kubernetes resources and Docker images.

**Options**:
- `-n, --namespace`: Clean specific namespace
- `--all-namespaces`: Clean all namespaces
- `--images`: Also clean Docker images
- `-y, --yes`: Skip confirmations

## Performance Tips

### Faster Development Builds

1. **Use file sync** instead of rebuilds for Go files
2. **Layer Docker images** properly for better caching
3. **Use local profile** when working offline
4. **Exclude unnecessary files** in .dockerignore

### Efficient Resource Usage

1. **Set appropriate resource limits** for each profile
2. **Use single replica** in development 
3. **Clean up unused resources** regularly
4. **Monitor resource usage** with kubectl top

### Network Optimization

1. **Use local registry** when possible
2. **Enable image caching** in your CI/CD
3. **Compress Docker images** for faster pulls
4. **Use multi-stage builds** to reduce image size

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy to GKE
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: google-github-actions/setup-gcloud@v0
      with:
        service_account_key: ${{ secrets.GKE_SA_KEY }}
        project_id: planar-sun-402202
    - run: gcloud container clusters get-credentials flow-worklet-cluster --zone us-central1-a
    - uses: GoogleContainerTools/skaffold-action@v0
      with:
        skaffold-version: latest
        command: run
        profile: prod
```

### GitLab CI Example

```yaml
deploy:
  image: google/cloud-sdk:alpine
  script:
    - gcloud auth activate-service-account --key-file $SERVICE_ACCOUNT_KEY
    - gcloud container clusters get-credentials flow-worklet-cluster --zone us-central1-a --project planar-sun-402202
    - curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64 && chmod +x skaffold
    - ./skaffold run --profile=prod
  only:
    - main
```

This example provides a complete, production-ready development workflow using Skaffold. Each profile is optimized for its specific use case, and the convenience scripts make it easy to switch between different development modes.