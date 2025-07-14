#!/bin/bash

# Lambda entry point script for scraper workflow

if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
    # Local testing mode
    echo "Running scraper workflow in local testing mode"
    exec /usr/local/bin/aws-lambda-rie /var/runtime/bootstrap
else
    # AWS Lambda runtime mode
    echo "Running scraper workflow in AWS Lambda runtime mode"
    exec /var/runtime/bootstrap
fi