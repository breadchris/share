# Lambda Docker Infrastructure

This directory contains generalized Pulumi infrastructure for deploying Go Lambda functions with custom Docker containers. It's designed to be flexible and reusable across different Lambda use cases.

## Overview

The infrastructure supports:
- **Multi-stage Docker builds** with Go Lambda builder
- **Custom base images** for specialized runtime environments
- **Flexible configuration** via JSON configuration
- **ECR repository management** for container images
- **IAM role and policy management**
- **Environment variable configuration**
- **Architecture and resource customization**

## Architecture

### Components

1. **ECR Repository**: Stores Docker images for Lambda functions
2. **Lambda Functions**: Containerized Lambda functions with custom base images
3. **IAM Roles**: Execution roles with configurable policies
4. **Docker Build**: Multi-stage build process with Go compilation

### Multi-stage Build Process

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Go Builder    │───▶│  Custom Base    │───▶│  Lambda Ready   │
│                 │    │     Image       │    │    Container    │
│ - Compile Go    │    │ - Runtime deps  │    │ - Go binary     │
│ - Create binary │    │ - AWS Lambda    │    │ - Entry script  │
│ - Optimize      │    │ - Custom tools  │    │ - Ready to run  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Configuration

### Pulumi Configuration

Configure your Lambda functions using the `lambdas` configuration key:

```yaml
# Pulumi.dev.yaml
config:
  projectName: my-lambdas
  region: us-east-1
  lambdas: |
    [{
      "name": "my-function",
      "baseImage": "alpine:latest",
      "buildContext": "./",
      "dockerfile": "Dockerfile",
      "environment": {
        "ENV_VAR": "value"
      },
      "timeout": 300,
      "memorySize": 512,
      "policies": ["arn:aws:iam::aws:policy/ReadOnlyAccess"]
    }]
```

### Lambda Configuration Schema

```json
{
  "name": "function-name",           // Required: Lambda function name
  "baseImage": "image:tag",          // Required: Base Docker image
  "buildContext": "./",              // Required: Docker build context
  "dockerfile": "Dockerfile",        // Required: Dockerfile path
  "environment": {                   // Optional: Environment variables
    "KEY": "value"
  },
  "timeout": 300,                    // Optional: Timeout in seconds (default: 60)
  "memorySize": 512,                 // Optional: Memory in MB (default: 512)
  "architecture": "x86_64",          // Optional: Architecture (default: x86_64)
  "policies": [                      // Optional: Managed policy ARNs
    "arn:aws:iam::aws:policy/ReadOnlyAccess"
  ],
  "inlinePolicies": {                // Optional: Inline policies
    "PolicyName": "policy-document-json"
  }
}
```

## Usage

### 1. Create Your Lambda Function

```go
// cmd/lambda/main.go
package main

import (
    "context"
    "github.com/aws/aws-lambda-go/lambda"
)

func handleRequest(ctx context.Context, event interface{}) (interface{}, error) {
    return map[string]string{"message": "Hello from Lambda!"}, nil
}

func main() {
    lambda.Start(handleRequest)
}
```

### 2. Create Dockerfile

```dockerfile
# Use the template and customize for your needs
FROM golang:1.21-alpine AS go-builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o bootstrap ./cmd/lambda

# Your custom base image
ARG BASE_IMAGE
FROM ${BASE_IMAGE}

# Install AWS Lambda Runtime Interface Emulator
RUN curl -sSL https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie -o /usr/local/bin/aws-lambda-rie && chmod +x /usr/local/bin/aws-lambda-rie

# Copy Lambda binary
COPY --from=go-builder /build/bootstrap /var/runtime/bootstrap

# Copy and set entry point
COPY entry.sh /entry.sh
RUN chmod +x /entry.sh

CMD ["/entry.sh"]
```

### 3. Configure and Deploy

```bash
# Initialize Pulumi
pulumi stack init dev

# Configure your Lambda
pulumi config set lambdas '[{
  "name": "my-function",
  "baseImage": "alpine:latest",
  "buildContext": "./",
  "dockerfile": "Dockerfile"
}]'

# Deploy
pulumi up
```

## Examples

### Basic Web Scraper

```json
{
  "name": "web-scraper",
  "baseImage": "chromedp/headless-shell:latest",
  "buildContext": "./",
  "dockerfile": "Dockerfile.scraper",
  "environment": {
    "CHROME_BIN": "/usr/bin/chromium-browser"
  },
  "timeout": 300,
  "memorySize": 1024,
  "policies": [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]
}
```

### Machine Learning Function

```json
{
  "name": "ml-inference",
  "baseImage": "tensorflow/tensorflow:latest",
  "buildContext": "./",
  "dockerfile": "Dockerfile.ml",
  "environment": {
    "MODEL_PATH": "/models/model.pb"
  },
  "timeout": 900,
  "memorySize": 3008,
  "policies": [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ],
  "inlinePolicies": {
    "S3ModelAccess": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"s3:GetObject\"],\"Resource\":\"arn:aws:s3:::my-models/*\"}]}"
  }
}
```

### Database Function

```json
{
  "name": "db-migration",
  "baseImage": "postgres:15",
  "buildContext": "./",
  "dockerfile": "Dockerfile.db",
  "environment": {
    "DB_HOST": "postgres.example.com",
    "DB_PORT": "5432"
  },
  "timeout": 600,
  "memorySize": 1024,
  "policies": [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  ]
}
```

## Best Practices

### Docker Optimization

1. **Multi-stage builds**: Keep final image size minimal
2. **Layer caching**: Order commands to maximize cache hits
3. **Security scanning**: Use minimal base images
4. **Dependency management**: Pin versions for reproducibility

### Lambda Configuration

1. **Memory allocation**: Start with 512MB and adjust based on profiling
2. **Timeout settings**: Set appropriate timeouts for your use case
3. **Environment variables**: Use for configuration, not secrets
4. **IAM permissions**: Follow principle of least privilege

### Performance Optimization

1. **Cold start reduction**: Use provisioned concurrency for critical functions
2. **Resource optimization**: Profile memory and CPU usage
3. **Container image optimization**: Use Alpine or distroless base images
4. **Dependency optimization**: Only include necessary dependencies

## Troubleshooting

### Common Issues

1. **Image too large**: Optimize Dockerfile and use multi-stage builds
2. **Permission errors**: Check IAM roles and policies
3. **Build failures**: Ensure Docker context includes all necessary files
4. **Runtime errors**: Check Lambda logs in CloudWatch

### Debug Commands

```bash
# Check Pulumi stack
pulumi stack ls

# View stack outputs
pulumi stack output

# Check Docker build
docker build --no-cache .

# Test Lambda locally
docker run -p 9000:8080 my-lambda-image
```

## Security

### IAM Best Practices

1. **Minimal permissions**: Only grant necessary permissions
2. **Resource-specific policies**: Limit access to specific resources
3. **Policy validation**: Use IAM policy simulator
4. **Regular auditing**: Review and update policies regularly

### Container Security

1. **Base image security**: Use official, minimal base images
2. **Vulnerability scanning**: Scan images for vulnerabilities
3. **Secret management**: Use AWS Secrets Manager or Parameter Store
4. **Network security**: Use VPC configuration when needed

## Cost Optimization

### Resource Management

1. **Right-sizing**: Match memory allocation to actual usage
2. **Concurrent execution**: Monitor and optimize concurrent executions
3. **Image optimization**: Reduce image size to minimize pull time
4. **Provisioned concurrency**: Use only when necessary

### Monitoring

1. **CloudWatch metrics**: Monitor duration, memory, and errors
2. **Cost allocation**: Use tags for cost tracking
3. **Performance profiling**: Identify optimization opportunities
4. **Alerting**: Set up alerts for cost and performance thresholds

## Related Projects

- [Scraper Lambda Example](../examples/scraper-lambda/) - Web scraping with ChromeDP
- [Flow Pulumi Slackbot](../../flow/pulumi-slackbot/) - Original Slack bot implementation
- [Share Repository](../../) - Main application with scraping capabilities