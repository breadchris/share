#!/bin/bash

# AWS Resource Cleanup Script
# Cleans up AWS resources created during testing based on tags

set -euo pipefail

TEST_NAME="${1:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[CLEANUP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[CLEANUP]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[CLEANUP]${NC} $1"
}

log_error() {
    echo -e "${RED}[CLEANUP]${NC} $1"
}

if [ -z "$TEST_NAME" ]; then
    log_error "Usage: $0 <test-name>"
    exit 1
fi

log_info "Cleaning up AWS resources for test: $TEST_NAME"
log_info "Region: $AWS_REGION"

# Function to clean up Lambda functions
cleanup_lambda_functions() {
    log_info "Cleaning up Lambda functions..."
    
    local functions=$(aws lambda list-functions \
        --region "$AWS_REGION" \
        --query "Functions[?contains(FunctionName, '$TEST_NAME')].FunctionName" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$functions" ]; then
        for func in $functions; do
            log_info "Deleting Lambda function: $func"
            aws lambda delete-function \
                --region "$AWS_REGION" \
                --function-name "$func" 2>/dev/null || log_warning "Failed to delete function: $func"
        done
    else
        log_info "No Lambda functions to clean up"
    fi
}

# Function to clean up S3 buckets
cleanup_s3_buckets() {
    log_info "Cleaning up S3 buckets..."
    
    # List buckets with the test name
    local buckets=$(aws s3api list-buckets \
        --query "Buckets[?contains(Name, '$TEST_NAME')].Name" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$buckets" ]; then
        for bucket in $buckets; do
            log_info "Emptying and deleting S3 bucket: $bucket"
            
            # Empty bucket first
            aws s3 rm "s3://$bucket" --recursive 2>/dev/null || log_warning "Failed to empty bucket: $bucket"
            
            # Delete bucket versioning objects if versioning is enabled
            aws s3api delete-objects \
                --bucket "$bucket" \
                --delete "$(aws s3api list-object-versions \
                    --bucket "$bucket" \
                    --query '{Objects: [].{Key: Key, VersionId: VersionId}}' \
                    --output json 2>/dev/null || echo '{}')" 2>/dev/null || true
            
            # Delete bucket
            aws s3api delete-bucket \
                --bucket "$bucket" \
                --region "$AWS_REGION" 2>/dev/null || log_warning "Failed to delete bucket: $bucket"
        done
    else
        log_info "No S3 buckets to clean up"
    fi
}

# Function to clean up SQS queues
cleanup_sqs_queues() {
    log_info "Cleaning up SQS queues..."
    
    local queues=$(aws sqs list-queues \
        --region "$AWS_REGION" \
        --queue-name-prefix "$TEST_NAME" \
        --query "QueueUrls[]" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$queues" ]; then
        for queue in $queues; do
            log_info "Deleting SQS queue: $queue"
            aws sqs delete-queue \
                --region "$AWS_REGION" \
                --queue-url "$queue" 2>/dev/null || log_warning "Failed to delete queue: $queue"
        done
    else
        log_info "No SQS queues to clean up"
    fi
}

# Function to clean up IAM roles
cleanup_iam_roles() {
    log_info "Cleaning up IAM roles..."
    
    local roles=$(aws iam list-roles \
        --query "Roles[?contains(RoleName, '$TEST_NAME')].RoleName" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$roles" ]; then
        for role in $roles; do
            log_info "Deleting IAM role: $role"
            
            # Detach managed policies
            local attached_policies=$(aws iam list-attached-role-policies \
                --role-name "$role" \
                --query "AttachedPolicies[].PolicyArn" \
                --output text 2>/dev/null || echo "")
            
            for policy in $attached_policies; do
                aws iam detach-role-policy \
                    --role-name "$role" \
                    --policy-arn "$policy" 2>/dev/null || true
            done
            
            # Delete inline policies
            local inline_policies=$(aws iam list-role-policies \
                --role-name "$role" \
                --query "PolicyNames[]" \
                --output text 2>/dev/null || echo "")
            
            for policy in $inline_policies; do
                aws iam delete-role-policy \
                    --role-name "$role" \
                    --policy-name "$policy" 2>/dev/null || true
            done
            
            # Delete role
            aws iam delete-role \
                --role-name "$role" 2>/dev/null || log_warning "Failed to delete role: $role"
        done
    else
        log_info "No IAM roles to clean up"
    fi
}

# Function to clean up CloudWatch logs
cleanup_cloudwatch_logs() {
    log_info "Cleaning up CloudWatch log groups..."
    
    local log_groups=$(aws logs describe-log-groups \
        --region "$AWS_REGION" \
        --log-group-name-prefix "/aws/lambda/$TEST_NAME" \
        --query "logGroups[].logGroupName" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$log_groups" ]; then
        for log_group in $log_groups; do
            log_info "Deleting CloudWatch log group: $log_group"
            aws logs delete-log-group \
                --region "$AWS_REGION" \
                --log-group-name "$log_group" 2>/dev/null || log_warning "Failed to delete log group: $log_group"
        done
    else
        log_info "No CloudWatch log groups to clean up"
    fi
}

# Function to clean up ECR repositories
cleanup_ecr_repositories() {
    log_info "Cleaning up ECR repositories..."
    
    local repos=$(aws ecr describe-repositories \
        --region "$AWS_REGION" \
        --query "repositories[?contains(repositoryName, '$TEST_NAME')].repositoryName" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$repos" ]; then
        for repo in $repos; do
            log_info "Deleting ECR repository: $repo"
            aws ecr delete-repository \
                --region "$AWS_REGION" \
                --repository-name "$repo" \
                --force 2>/dev/null || log_warning "Failed to delete repository: $repo"
        done
    else
        log_info "No ECR repositories to clean up"
    fi
}

# Function to verify cleanup
verify_cleanup() {
    log_info "Verifying cleanup completion..."
    
    local remaining_resources=0
    
    # Check Lambda functions
    local lambda_count=$(aws lambda list-functions \
        --region "$AWS_REGION" \
        --query "length(Functions[?contains(FunctionName, '$TEST_NAME')])" \
        --output text 2>/dev/null || echo "0")
    remaining_resources=$((remaining_resources + lambda_count))
    
    # Check S3 buckets
    local s3_count=$(aws s3api list-buckets \
        --query "length(Buckets[?contains(Name, '$TEST_NAME')])" \
        --output text 2>/dev/null || echo "0")
    remaining_resources=$((remaining_resources + s3_count))
    
    # Check SQS queues
    local sqs_count=$(aws sqs list-queues \
        --region "$AWS_REGION" \
        --queue-name-prefix "$TEST_NAME" \
        --query "length(QueueUrls[])" \
        --output text 2>/dev/null || echo "0")
    remaining_resources=$((remaining_resources + sqs_count))
    
    if [ "$remaining_resources" -eq 0 ]; then
        log_success "Cleanup completed successfully - no remaining resources found"
    else
        log_warning "Cleanup completed with $remaining_resources remaining resources"
        log_warning "Some resources may take time to be fully deleted or may require manual cleanup"
    fi
}

# Main cleanup execution
main() {
    log_info "Starting AWS resource cleanup for: $TEST_NAME"
    
    # Run cleanup functions in order
    cleanup_lambda_functions
    cleanup_sqs_queues
    cleanup_s3_buckets
    cleanup_iam_roles
    cleanup_cloudwatch_logs
    cleanup_ecr_repositories
    
    # Wait a moment for eventual consistency
    sleep 10
    
    # Verify cleanup
    verify_cleanup
    
    log_success "AWS resource cleanup completed for: $TEST_NAME"
}

# Run main function
main "$@"