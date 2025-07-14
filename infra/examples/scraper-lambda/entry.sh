#!/bin/bash

# Lambda entry point script for scraper function
# This script handles both local testing and AWS Lambda execution

if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
    # Local testing mode
    echo "Running in local testing mode"
    exec /usr/local/bin/aws-lambda-rie /var/runtime/bootstrap
else
    # AWS Lambda runtime mode
    echo "Running in AWS Lambda runtime mode"
    exec /var/runtime/bootstrap
fi