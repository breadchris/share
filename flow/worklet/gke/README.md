# Flow Worklet GKE Deployment with Traefik Auto-TLS

This package contains Pulumi code for deploying a GKE cluster with Traefik ingress controller and automatic TLS certificate provisioning using Let's Encrypt.

## Prerequisites

1. Install required tools:
   - [Pulumi](https://www.pulumi.com/docs/get-started/install/)
   - [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
   - [kubectl](https://kubernetes.io/docs/tasks/tools/)
   - [Skaffold](https://skaffold.dev/docs/install/)
   - [Docker](https://docs.docker.com/get-docker/)
   - [Helm](https://helm.sh/docs/intro/install/)

2. Configure Google Cloud authentication:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Domain Configuration**:
   - You need a valid domain name for TLS certificates
   - Update `flow-worklet.example.com` in all configuration files to your domain
   - Ensure DNS A record points to the cluster's external IP

## Deploy GKE Cluster with Pulumi

1. Navigate to the Pulumi directory:
   ```bash
   cd flow/worklet/gke
   ```

2. Install Pulumi dependencies:
   ```bash
   go mod download
   ```

3. Create a new Pulumi stack:
   ```bash
   pulumi stack init dev
   ```

4. Configure the GCP project:
   ```bash
   pulumi config set gcp:project YOUR_PROJECT_ID
   ```

5. **Update configuration files**:
   Replace `admin@example.com` with your email in:
   - `main.go` (line 100)
   - `traefik-values.yaml`
   - `example-app/k8s/certificate.yaml`

6. Deploy the GKE cluster with Traefik:
   ```bash
   pulumi up
   ```

7. Get the kubeconfig and Traefik external IP:
   ```bash
   pulumi stack output kubeconfig > kubeconfig.yaml
   export KUBECONFIG=$(pwd)/kubeconfig.yaml
   
   # Get Traefik LoadBalancer external IP
   kubectl get svc -n traefik-system traefik
   ```

8. **Configure DNS**:
   Update your domain's DNS A record to point to the Traefik external IP.

## Deploy Example Application with Skaffold

1. Navigate to the example app directory:
   ```bash
   cd example-app
   ```

2. **Update domain configuration**:
   Replace `flow-worklet.example.com` with your domain in:
   - `k8s/ingress.yaml`
   - `k8s/certificate.yaml`

3. Configure Docker to use gcloud as a credential helper:
   ```bash
   gcloud auth configure-docker
   ```

4. Update the image name in `skaffold.yaml` to use your GCR registry:
   ```yaml
   build:
     artifacts:
     - image: gcr.io/YOUR_PROJECT_ID/flow-worklet-example
   ```

5. Install cert-manager for TLS certificate management:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

6. Deploy the application using Skaffold:
   ```bash
   skaffold dev
   ```

   This will:
   - Build the Docker image
   - Deploy it to the GKE cluster
   - Create Traefik IngressRoutes
   - Set up automatic TLS certificates
   - Set up port forwarding to localhost:8080
   - Watch for code changes and automatically redeploy

7. Access the application:
   ```bash
   # Via port forwarding (development)
   curl http://localhost:8080
   
   # Via domain with HTTPS (production)
   curl https://your-domain.com
   ```

## Production Deployment

For production deployment, use:
```bash
skaffold run
```

This will build and deploy without the development features like file watching and port forwarding.

## Traefik Features Enabled

### Automatic TLS Certificates
- **Let's Encrypt Integration**: Automatic certificate provisioning and renewal
- **HTTP to HTTPS Redirect**: All HTTP traffic automatically redirected to HTTPS
- **Certificate Storage**: Persistent volume for certificate data

### Security Features
- **Security Headers**: HSTS, frame options, and content type protection
- **Rate Limiting**: Protection against DDoS and abuse
- **Modern TLS**: TLS 1.2+ with secure cipher suites

### Monitoring and Observability
- **Traefik Dashboard**: Web UI for monitoring routes and services
- **Prometheus Metrics**: Built-in metrics for monitoring
- **Access Logs**: Detailed request logging

## Traefik Dashboard Access

Access the Traefik dashboard (optional):

1. Enable dashboard access by updating `traefik-values.yaml`:
   ```yaml
   ingressRoute:
     dashboard:
       enabled: true
       matchRule: Host(`traefik.your-domain.com`)
   ```

2. Access at: `https://traefik.your-domain.com`

## Cleanup

To destroy the GKE cluster and all resources:
```bash
cd ..
pulumi destroy
```

## Application Structure

- `main.go` - Pulumi code for GKE cluster and Traefik deployment
- `traefik-values.yaml` - Traefik Helm configuration values
- `example-app/` - Example Go application
  - `main.go` - Simple HTTP server
  - `Dockerfile` - Multi-stage Docker build
  - `k8s/` - Kubernetes manifests
    - `deployment.yaml` - Application deployment
    - `service.yaml` - ClusterIP service
    - `ingress.yaml` - Traefik IngressRoute configuration
    - `middleware.yaml` - Traefik middlewares (redirects, security)
    - `certificate.yaml` - TLS certificate configuration
  - `skaffold.yaml` - Skaffold configuration

## Troubleshooting

### TLS Certificate Issues
```bash
# Check certificate status
kubectl describe certificate flow-worklet-tls

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Check Traefik logs
kubectl logs -n traefik-system -l app.kubernetes.io/name=traefik
```

### DNS and Connectivity
```bash
# Test DNS resolution
nslookup your-domain.com

# Check Traefik service external IP
kubectl get svc -n traefik-system traefik

# Test HTTP to HTTPS redirect
curl -I http://your-domain.com
```

## Customization

- **Cluster Configuration**: Modify `main.go` for different node types or scaling
- **Traefik Settings**: Update `traefik-values.yaml` for advanced Traefik features
- **TLS Configuration**: Modify `certificate.yaml` for different domains or certificate settings
- **Application**: Customize `example-app/main.go` for your specific use case
- **Security**: Adjust middleware settings in `middleware.yaml`