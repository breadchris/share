# End-to-End Workflow Test Suite

This comprehensive test suite validates the workflow infrastructure from deployment through execution and cleanup. It provides automated testing for the generalized workflow system that supports custom Docker containers, Lambda functions, SQS queues, and S3 storage.

## Overview

The test suite covers:
- Infrastructure deployment and validation
- Workflow definition and validation
- Runtime execution testing
- Data flow verification
- Error handling and recovery
- Performance benchmarking
- Security validation
- Integration testing

## Architecture

```
tests/e2e/workflow-test/
├── scripts/                 # Test orchestration scripts
│   ├── run_e2e_test.sh     # Main test runner
│   └── cleanup_aws_resources.sh # Resource cleanup
├── infrastructure/          # Pulumi test infrastructure
│   ├── main.go             # Infrastructure deployment
│   ├── Pulumi.yaml         # Pulumi configuration
│   └── go.mod              # Dependencies
├── internal/               # Test implementations
│   ├── infrastructure/     # Infrastructure validation tests
│   ├── workflow/           # Workflow definition tests
│   ├── execution/          # Runtime execution tests
│   └── integration/        # End-to-end integration tests
├── testdata/               # Test data and workflows
│   ├── test-workflow.json  # Main test workflow
│   ├── simple-workflow.json # Simple test case
│   └── invalid-workflow.json # Validation test case
├── .github/workflows/      # CI/CD integration
│   └── e2e-test.yml        # GitHub Actions workflow
└── README.md               # This file
```

## Quick Start

### Prerequisites

- Go 1.21+
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- Docker (for container image testing)
- jq (for JSON processing)

### Environment Variables

```bash
# Required
export AWS_REGION="us-east-1"
export TEST_NAME="my-e2e-test-$(date +%Y%m%d-%H%M%S)"

# Optional
export CLEANUP_ON_EXIT="true"           # Clean up resources after test
export MAX_EXECUTION_TIME="1800"        # 30 minutes timeout
export MAX_COST_THRESHOLD="5.00"        # $5 USD cost limit
```

### Running Tests Locally

```bash
# Run the complete test suite
cd tests/e2e/workflow-test
./scripts/run_e2e_test.sh

# Run individual test components
go test -v ./internal/infrastructure -args -test-name="my-test" -aws-region="us-east-1"
go test -v ./internal/workflow -args -test-data-dir="./testdata"
go test -v ./internal/execution -timeout=20m -args -test-name="my-test"
go test -v ./internal/integration -timeout=25m -args -test-name="my-test"
```

### Quick Infrastructure Test

```bash
# Deploy test infrastructure only
cd infrastructure
pulumi stack init test-stack
pulumi config set projectName "quick-test"
pulumi config set workflows "$(cat ../testdata/simple-workflow.json)"
pulumi up

# Clean up
pulumi destroy
pulumi stack rm test-stack
```

## Test Components

### 1. Infrastructure Tests (`internal/infrastructure/`)

Validates that AWS resources are properly deployed and configured:

- **Resource Existence**: Verifies Lambda functions, S3 buckets, SQS queues exist
- **Configuration Validation**: Checks timeouts, permissions, encryption settings
- **Tagging Verification**: Ensures proper resource tagging for cost tracking
- **Permission Testing**: Validates cross-service permissions and access

Example:
```bash
go test -v ./internal/infrastructure \
  -args -test-name="my-test" \
  -aws-region="us-east-1" \
  -s3-bucket="my-test-bucket" \
  -sqs-queue="https://sqs.us-east-1.amazonaws.com/123456789012/my-queue" \
  -lambda-arns="arn:aws:lambda:us-east-1:123456789012:function:my-function"
```

### 2. Workflow Definition Tests (`internal/workflow/`)

Validates workflow JSON definitions and configurations:

- **Schema Validation**: Ensures workflows conform to expected structure
- **Graph Validation**: Detects cycles, unreachable nodes, orphaned nodes
- **Configuration Validation**: Validates node-specific configurations
- **Compatibility Testing**: Tests JSON serialization/deserialization

Example:
```bash
go test -v ./internal/workflow -args -test-data-dir="./testdata"
```

### 3. Execution Tests (`internal/execution/`)

Tests runtime workflow execution:

- **Single Node Execution**: Tests individual Lambda function invocation
- **Multi-Node Workflows**: Tests complete workflow execution
- **Data Flow Testing**: Verifies data passes correctly between nodes
- **Error Handling**: Tests timeout handling, malformed input, resource errors
- **Performance Metrics**: Measures execution times and throughput

Example:
```bash
go test -v ./internal/execution -timeout=20m \
  -args -test-name="my-test" \
  -aws-region="us-east-1" \
  -test-data-dir="./testdata"
```

### 4. Integration Tests (`internal/integration/`)

Comprehensive end-to-end testing:

- **Full Lifecycle Testing**: Complete workflow creation through cleanup
- **Concurrent Execution**: Tests multiple simultaneous workflow executions
- **Data Integrity**: Validates data integrity through the entire pipeline
- **Error Recovery**: Tests system behavior under various failure conditions
- **Scalability Testing**: Tests system behavior under increasing load
- **Security Validation**: Validates security configurations and access controls

Example:
```bash
go test -v ./internal/integration -timeout=25m \
  -args -test-name="my-test" \
  -aws-region="us-east-1" \
  -output-dir="./output"
```

## CI/CD Integration

### GitHub Actions

The test suite includes a comprehensive GitHub Actions workflow (`.github/workflows/e2e-test.yml`) that:

- **Triggers**: On pushes to main/develop, PRs, or manual dispatch
- **Security Scanning**: Checks for hardcoded credentials and insecure configurations
- **Pre-flight Checks**: Validates test configuration and determines if tests should run
- **Resource Management**: Automatic cleanup with cost monitoring
- **Notifications**: Creates GitHub issues on failure, comments on PRs
- **Artifacts**: Uploads test results, logs, and reports

#### Manual Trigger

```bash
# Trigger via GitHub CLI
gh workflow run e2e-test.yml \
  -f aws_region=us-west-2 \
  -f cleanup_on_exit=true \
  -f max_execution_time=2400 \
  -f test_environment=staging
```

#### Required Secrets

```bash
# GitHub repository secrets
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/github-actions-e2e-tests
```

### Integration with Other CI Systems

The test suite can be integrated with other CI systems by adapting the main test script:

```bash
# Jenkins Pipeline
pipeline {
    agent any
    environment {
        AWS_REGION = 'us-east-1'
        TEST_NAME = "jenkins-${BUILD_NUMBER}-${env.BUILD_ID}"
    }
    stages {
        stage('E2E Tests') {
            steps {
                sh './tests/e2e/workflow-test/scripts/run_e2e_test.sh'
            }
        }
    }
}

# GitLab CI
test_e2e:
  stage: test
  script:
    - export TEST_NAME="gitlab-${CI_PIPELINE_ID}"
    - ./tests/e2e/workflow-test/scripts/run_e2e_test.sh
  artifacts:
    reports:
      junit: tests/e2e/workflow-test/output/*/test-report.xml
```

## Configuration

### Test Configuration Files

#### Workflow Definitions (`testdata/`)

- `test-workflow.json`: Main integration test workflow with Lambda, S3, and SQS
- `simple-workflow.json`: Minimal workflow for basic testing
- `invalid-workflow.json`: Invalid workflow for validation testing

#### Pulumi Configuration (`infrastructure/Pulumi.yaml`)

```yaml
name: workflow-e2e-test
runtime: go
description: End-to-end test infrastructure for workflow system

config:
  projectName:
    type: string
    description: Name of the test project
    default: "workflow-e2e-test"
  region:
    type: string
    description: AWS region for deployment
    default: "us-east-1"
  workflows:
    type: string
    description: JSON configuration for test workflows
    secret: false
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_NAME` | Generated | Unique test instance identifier |
| `AWS_REGION` | `us-east-1` | AWS region for resource deployment |
| `CLEANUP_ON_EXIT` | `true` | Whether to clean up resources after test |
| `MAX_EXECUTION_TIME` | `1800` | Maximum test execution time (seconds) |
| `MAX_COST_THRESHOLD` | `5.00` | Maximum AWS cost threshold (USD) |
| `TEST_OUTPUT_DIR` | Generated | Directory for test outputs and artifacts |

## Test Data and Scenarios

### Test Workflows

#### Simple Data Pipeline
```json
{
  "name": "data-pipeline",
  "entrypoint": "scraper",
  "nodes": [
    {
      "id": "scraper",
      "type": "lambda",
      "config": {
        "lambda": {
          "functionName": "data-scraper",
          "runtime": "nodejs18.x",
          "timeout": 300
        }
      }
    },
    {
      "id": "storage",
      "type": "s3-bucket",
      "config": {
        "s3": {
          "bucketName": "scraped-data-bucket",
          "operation": "put",
          "keyPrefix": "scraped-data/"
        }
      }
    }
  ],
  "edges": [
    {"from": "scraper", "to": "storage"}
  ]
}
```

### Test Scenarios

1. **Happy Path**: Normal workflow execution with valid data
2. **Error Handling**: Invalid input, resource timeouts, service errors
3. **Concurrent Execution**: Multiple workflows running simultaneously
4. **Data Integrity**: Large payloads, binary data, special characters
5. **Performance**: High-frequency executions, long-running workflows
6. **Security**: Permission boundaries, data encryption, access logging

## Monitoring and Observability

### Test Metrics

The test suite collects and reports:

- **Execution Metrics**: Latency, throughput, success rate
- **Resource Utilization**: CPU, memory, network usage
- **Cost Metrics**: AWS resource costs during test execution
- **Error Rates**: Classification of errors by type and frequency

### Log Aggregation

Test logs are structured and include:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "component": "execution-test",
  "testName": "my-test",
  "nodeId": "scraper",
  "duration": 1250,
  "status": "success",
  "metadata": {
    "awsRegion": "us-east-1",
    "requestId": "req-123"
  }
}
```

### Alerting

The CI/CD pipeline includes alerting for:

- Test failures with automatic GitHub issue creation
- Cost threshold breaches
- Security policy violations
- Performance regression detection

## Troubleshooting

### Common Issues

#### Infrastructure Deployment Failures

```bash
# Check Pulumi state
cd infrastructure
pulumi stack select <stack-name>
pulumi refresh

# View detailed logs
pulumi logs --follow

# Clean up and retry
pulumi destroy
pulumi up
```

#### Test Execution Timeouts

```bash
# Increase timeout
export MAX_EXECUTION_TIME=3600  # 1 hour

# Check resource availability
aws lambda list-functions --region us-east-1
aws s3 ls
aws sqs list-queues --region us-east-1
```

#### Permission Errors

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:role/test-role \
  --action-names lambda:InvokeFunction s3:GetObject sqs:SendMessage \
  --resource-arns "*"
```

#### Cost Overruns

```bash
# Monitor costs during test
aws ce get-cost-and-usage \
  --time-period Start=2024-01-15,End=2024-01-16 \
  --granularity DAILY \
  --metrics BlendedCost

# Emergency cleanup
./scripts/cleanup_aws_resources.sh <test-name>
```

### Debug Mode

Enable verbose logging:

```bash
export DEBUG=true
export LOG_LEVEL=debug
./scripts/run_e2e_test.sh
```

### Resource Cleanup

If tests fail to clean up automatically:

```bash
# Manual cleanup script
./scripts/cleanup_aws_resources.sh <test-name>

# Nuclear option - clean all test resources
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Purpose,Values=e2e-testing \
  --query 'ResourceTagMappingList[].ResourceARN' \
  --output text | xargs -I {} aws lambda delete-function --function-name {}
```

## Contributing

### Adding New Tests

1. **Infrastructure Tests**: Add test functions to `internal/infrastructure/infrastructure_test.go`
2. **Workflow Tests**: Add validation functions to `internal/workflow/workflow_test.go`
3. **Execution Tests**: Add execution scenarios to `internal/execution/execution_test.go`
4. **Integration Tests**: Add end-to-end scenarios to `internal/integration/integration_test.go`

### Test Data

Add new workflow definitions to `testdata/` directory following the JSON schema.

### CI/CD Updates

Modify `.github/workflows/e2e-test.yml` for:
- New test phases
- Additional security checks
- Enhanced reporting
- Cost monitoring improvements

## Security Considerations

- All test resources are tagged for identification and cleanup
- Tests use minimal required permissions with least privilege principle
- Secrets are never logged or stored in artifacts
- Test data is sanitized and contains no real sensitive information
- Resources are automatically cleaned up to prevent security exposure

## Cost Management

- Tests are designed to complete within $5 USD cost threshold
- Automatic resource cleanup prevents cost overruns
- Cost monitoring alerts when threshold is approached
- Test duration limits prevent runaway resource usage

## Performance Benchmarks

Expected performance characteristics:

- **Infrastructure Deployment**: < 5 minutes
- **Single Workflow Execution**: < 30 seconds
- **Integration Test Suite**: < 25 minutes
- **Total Test Duration**: < 30 minutes

Performance regression alerts trigger when tests exceed 150% of baseline metrics.