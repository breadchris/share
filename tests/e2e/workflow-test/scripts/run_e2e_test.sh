#!/bin/bash

# End-to-End Workflow Test Runner
# This script orchestrates the complete testing of the workflow infrastructure

set -euo pipefail

# Configuration
TEST_NAME="workflow-e2e-$(date +%Y%m%d-%H%M%S)"
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$TEST_DIR/../../.." && pwd)"
AWS_REGION="${AWS_REGION:-us-east-1}"
CLEANUP_ON_EXIT="${CLEANUP_ON_EXIT:-true}"
MAX_EXECUTION_TIME="${MAX_EXECUTION_TIME:-1800}" # 30 minutes
MAX_COST_THRESHOLD="${MAX_COST_THRESHOLD:-5.00}" # $5 USD

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    log_info "Starting cleanup process..."
    
    if [ "$CLEANUP_ON_EXIT" = "true" ]; then
        # Clean up Pulumi stack
        if [ -n "${PULUMI_STACK_NAME:-}" ]; then
            log_info "Destroying Pulumi stack: $PULUMI_STACK_NAME"
            cd "$TEST_DIR/infrastructure"
            pulumi destroy --stack "$PULUMI_STACK_NAME" --yes --skip-preview || log_warning "Failed to destroy stack"
            pulumi stack rm "$PULUMI_STACK_NAME" --yes || log_warning "Failed to remove stack"
        fi
        
        # Clean up any remaining AWS resources
        log_info "Cleaning up any remaining AWS resources with tag: test-name=$TEST_NAME"
        "$TEST_DIR/scripts/cleanup_aws_resources.sh" "$TEST_NAME" || log_warning "AWS cleanup script failed"
    else
        log_warning "Skipping cleanup (CLEANUP_ON_EXIT=false)"
        log_info "Manual cleanup command: $TEST_DIR/scripts/cleanup_aws_resources.sh $TEST_NAME"
    fi
    
    # Generate final report
    generate_test_report "$exit_code"
    
    if [ $exit_code -eq 0 ]; then
        log_success "End-to-end test completed successfully!"
    else
        log_error "End-to-end test failed with exit code: $exit_code"
    fi
    
    exit $exit_code
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required tools
    local tools=("aws" "pulumi" "go" "jq" "curl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    # Check AWS region
    if [ -z "$AWS_REGION" ]; then
        log_error "AWS_REGION not set"
        exit 1
    fi
    
    # Check Go version
    local go_version=$(go version | cut -d' ' -f3 | tr -d 'go')
    if [[ $(echo "$go_version 1.21" | tr ' ' '\n' | sort -V | head -n1) != "1.21" ]]; then
        log_error "Go 1.21 or higher required, found: $go_version"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Function to set up test environment
setup_test_environment() {
    log_info "Setting up test environment: $TEST_NAME"
    
    # Create test output directory
    export TEST_OUTPUT_DIR="$TEST_DIR/output/$TEST_NAME"
    mkdir -p "$TEST_OUTPUT_DIR"
    
    # Set up environment variables
    export PULUMI_STACK_NAME="$TEST_NAME"
    export AWS_REGION="$AWS_REGION"
    export TEST_TAG="test-name=$TEST_NAME"
    
    # Initialize test logging
    export TEST_LOG_FILE="$TEST_OUTPUT_DIR/test.log"
    touch "$TEST_LOG_FILE"
    
    log_success "Test environment ready: $TEST_OUTPUT_DIR"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying test infrastructure..."
    
    cd "$TEST_DIR/infrastructure"
    
    # Initialize Pulumi stack
    pulumi stack init "$PULUMI_STACK_NAME" || log_warning "Stack already exists"
    pulumi stack select "$PULUMI_STACK_NAME"
    
    # Set configuration
    pulumi config set projectName "$TEST_NAME"
    pulumi config set region "$AWS_REGION"
    pulumi config set --path workflows --plaintext "$(cat ../testdata/test-workflow.json)"
    
    # Deploy infrastructure
    log_info "Deploying Pulumi infrastructure..."
    if ! pulumi up --yes --skip-preview; then
        log_error "Infrastructure deployment failed"
        exit 1
    fi
    
    # Get deployment outputs
    export LAMBDA_FUNCTION_ARNS=$(pulumi stack output --json | jq -r '."data-pipeline-workflow-lambdas"[]' | tr '\n' ' ')
    export S3_BUCKET_NAME=$(pulumi stack output --json | jq -r '."data-pipeline-workflow-buckets"[0]' || echo "")
    export SQS_QUEUE_URL=$(pulumi stack output --json | jq -r '."data-pipeline-workflow-queues"[0]' || echo "")
    
    log_success "Infrastructure deployed successfully"
    log_info "Lambda ARNs: $LAMBDA_FUNCTION_ARNS"
    log_info "S3 Bucket: $S3_BUCKET_NAME"
    log_info "SQS Queue: $SQS_QUEUE_URL"
}

# Function to run infrastructure tests
run_infrastructure_tests() {
    log_info "Running infrastructure validation tests..."
    
    cd "$TEST_DIR"
    if ! go test -v ./internal/infrastructure -args \
        -test-name="$TEST_NAME" \
        -aws-region="$AWS_REGION" \
        -s3-bucket="$S3_BUCKET_NAME" \
        -sqs-queue="$SQS_QUEUE_URL" \
        -lambda-arns="$LAMBDA_FUNCTION_ARNS"; then
        log_error "Infrastructure tests failed"
        exit 1
    fi
    
    log_success "Infrastructure tests passed"
}

# Function to run workflow definition tests
run_workflow_tests() {
    log_info "Running workflow definition tests..."
    
    cd "$TEST_DIR"
    if ! go test -v ./internal/workflow -args \
        -test-data-dir="$TEST_DIR/testdata"; then
        log_error "Workflow definition tests failed"
        exit 1
    fi
    
    log_success "Workflow definition tests passed"
}

# Function to run execution tests
run_execution_tests() {
    log_info "Running workflow execution tests..."
    
    cd "$TEST_DIR"
    if ! go test -v ./internal/execution -timeout=20m -args \
        -test-name="$TEST_NAME" \
        -aws-region="$AWS_REGION" \
        -s3-bucket="$S3_BUCKET_NAME" \
        -sqs-queue="$SQS_QUEUE_URL" \
        -lambda-arns="$LAMBDA_FUNCTION_ARNS" \
        -test-data-dir="$TEST_DIR/testdata"; then
        log_error "Execution tests failed"
        exit 1
    fi
    
    log_success "Execution tests passed"
}

# Function to run integration tests
run_integration_tests() {
    log_info "Running integration tests..."
    
    cd "$TEST_DIR"
    if ! go test -v ./internal/integration -timeout=25m -args \
        -test-name="$TEST_NAME" \
        -aws-region="$AWS_REGION" \
        -output-dir="$TEST_OUTPUT_DIR"; then
        log_error "Integration tests failed"
        exit 1
    fi
    
    log_success "Integration tests passed"
}

# Function to generate test report
generate_test_report() {
    local exit_code=$1
    local report_file="$TEST_OUTPUT_DIR/test-report.json"
    
    log_info "Generating test report: $report_file"
    
    cat > "$report_file" << EOF
{
  "testName": "$TEST_NAME",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "exitCode": $exit_code,
  "status": "$([ $exit_code -eq 0 ] && echo "PASSED" || echo "FAILED")",
  "duration": "$(($(date +%s) - ${TEST_START_TIME:-$(date +%s)}))",
  "environment": {
    "awsRegion": "$AWS_REGION",
    "pulumiStack": "${PULUMI_STACK_NAME:-}",
    "testOutputDir": "$TEST_OUTPUT_DIR"
  },
  "resources": {
    "s3Bucket": "${S3_BUCKET_NAME:-}",
    "sqsQueue": "${SQS_QUEUE_URL:-}",
    "lambdaFunctions": "${LAMBDA_FUNCTION_ARNS:-}"
  },
  "artifacts": [
    "test.log",
    "test-report.json"
  ]
}
EOF
    
    # Generate human-readable report
    local readable_report="$TEST_OUTPUT_DIR/test-report.txt"
    cat > "$readable_report" << EOF
End-to-End Workflow Test Report
===============================

Test Name: $TEST_NAME
Status: $([ $exit_code -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
Timestamp: $(date)
Duration: $(($(date +%s) - ${TEST_START_TIME:-$(date +%s)})) seconds

Environment:
- AWS Region: $AWS_REGION
- Pulumi Stack: ${PULUMI_STACK_NAME:-}
- Output Directory: $TEST_OUTPUT_DIR

AWS Resources Created:
- S3 Bucket: ${S3_BUCKET_NAME:-"None"}
- SQS Queue: ${SQS_QUEUE_URL:-"None"}
- Lambda Functions: ${LAMBDA_FUNCTION_ARNS:-"None"}

Artifacts:
- Logs: $TEST_OUTPUT_DIR/test.log
- JSON Report: $TEST_OUTPUT_DIR/test-report.json
- Human Report: $TEST_OUTPUT_DIR/test-report.txt

$([ $exit_code -eq 0 ] && echo "All tests completed successfully!" || echo "Some tests failed. Check the logs for details.")
EOF
    
    log_info "Reports generated:"
    log_info "  - JSON: $report_file"
    log_info "  - Text: $readable_report"
}

# Main execution function
main() {
    export TEST_START_TIME=$(date +%s)
    
    log_info "Starting end-to-end workflow test: $TEST_NAME"
    log_info "Max execution time: ${MAX_EXECUTION_TIME}s"
    log_info "Max cost threshold: \$${MAX_COST_THRESHOLD}"
    log_info "Cleanup on exit: $CLEANUP_ON_EXIT"
    
    # Set overall timeout
    (
        sleep "$MAX_EXECUTION_TIME"
        log_error "Test execution timeout reached (${MAX_EXECUTION_TIME}s)"
        kill -TERM $$
    ) &
    local timeout_pid=$!
    
    # Run test phases
    check_prerequisites
    setup_test_environment
    deploy_infrastructure
    run_infrastructure_tests
    run_workflow_tests
    run_execution_tests
    run_integration_tests
    
    # Cancel timeout if we get here
    kill $timeout_pid 2>/dev/null || true
    
    log_success "All test phases completed successfully!"
}

# Show usage if requested
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    cat << EOF
End-to-End Workflow Test Runner

Usage: $0 [options]

Environment Variables:
  AWS_REGION           AWS region for testing (default: us-east-1)
  CLEANUP_ON_EXIT      Clean up resources on exit (default: true)
  MAX_EXECUTION_TIME   Maximum test time in seconds (default: 1800)
  MAX_COST_THRESHOLD   Maximum AWS cost in USD (default: 5.00)

Examples:
  # Run with default settings
  $0
  
  # Run with custom region and no cleanup
  AWS_REGION=us-west-2 CLEANUP_ON_EXIT=false $0
  
  # Run with extended timeout
  MAX_EXECUTION_TIME=3600 $0

The test will create a unique test environment and clean up automatically
unless CLEANUP_ON_EXIT is set to false.
EOF
    exit 0
fi

# Run main function
main "$@"