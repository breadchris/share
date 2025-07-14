# Workflow Scraper Example

This example demonstrates a complete web scraping workflow using the graph-based workflow execution system. The workflow consists of multiple AWS Lambda functions and an SQS queue that work together to scrape web pages, process the data, and store the results.

## Workflow Architecture

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐    ┌─────────────┐
│   Scraper   │───▶│ Processing Queue │───▶│  Processor  │───▶│ S3 Storage  │
│   Lambda    │    │    (SQS)        │    │   Lambda    │    │   Bucket    │
└─────────────┘    └─────────────────┘    └─────────────┘    └─────────────┘
```

### Workflow Components

1. **Scraper Lambda** (`scraper`)
   - Uses ChromeDP for browser automation
   - Scrapes multiple URLs in parallel
   - Extracts structured data (links, images, metadata)
   - Optionally captures screenshots

2. **Processing Queue** (`processing-queue`)
   - SQS queue that receives scraped data
   - Configured with dead letter queue for error handling
   - Triggers the processor Lambda

3. **Processor Lambda** (`processor`)
   - Processes and transforms scraped data
   - Applies data cleaning and normalization
   - Enriches data with additional metadata

4. **S3 Storage Bucket** (`storage`)
   - Directly stores processed data in S3
   - Automatically handles JSON serialization
   - Supports versioning, encryption, and lifecycle policies
   - Provides cost-optimized storage with automatic transitions

## Usage

### Deploy the Workflow

1. Navigate to the example directory:
```bash
cd examples/workflow-scraper
```

2. Deploy the infrastructure:
```bash
pulumi up
```

3. Test the workflow:
```bash
curl -X POST https://your-api-endpoint/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "nodes": {
        "scraper": {
          "type": "lambda",
          "config": {
            "arn": "arn:aws:lambda:us-east-1:123456789012:function:scraper"
          }
        },
        "processing-queue": {
          "type": "sqs-queue",
          "config": {
            "queueUrl": "https://sqs.us-east-1.amazonaws.com/123456789012/processing-queue"
          }
        },
        "processor": {
          "type": "lambda",
          "config": {
            "arn": "arn:aws:lambda:us-east-1:123456789012:function:processor"
          }
        },
        "storage": {
          "type": "s3-bucket",
          "config": {
            "bucketName": "scraped-data-bucket",
            "keyPrefix": "scraped-data/",
            "operation": "put",
            "contentType": "application/json",
            "storageClass": "STANDARD_IA"
          }
        }
      },
      "edges": [
        {
          "from": "scraper",
          "to": "processing-queue",
          "condition": "success",
          "transform": "$.data"
        },
        {
          "from": "processing-queue",
          "to": "processor"
        },
        {
          "from": "processor",
          "to": "storage",
          "condition": "success",
          "transform": "$.processedData"
        }
      ],
      "entrypoint": "scraper"
    },
    "input": {
      "urls": [
        "https://example.com",
        "https://httpbin.org/json",
        "https://jsonplaceholder.typicode.com/posts/1"
      ],
      "extractData": true,
      "screenshot": false
    }
  }'
```

### Request Format

The workflow accepts requests with two main components:

#### Workflow Definition
```json
{
  "workflow": {
    "nodes": {
      "node-id": {
        "type": "lambda|sqs-queue|sns-topic",
        "config": {
          // Node-specific configuration
        }
      }
    },
    "edges": [
      {
        "from": "source-node",
        "to": "target-node",
        "condition": "success|failure|always",
        "transform": "JSONPath or transformation expression"
      }
    ],
    "entrypoint": "starting-node-id"
  }
}
```

#### Input Data
```json
{
  "input": {
    "urls": ["https://example.com"],
    "selector": ".content",
    "waitFor": ".loading-complete",
    "extractData": true,
    "screenshot": false,
    "headers": {
      "User-Agent": "Custom Bot"
    }
  }
}
```

## S3 Node Configuration

The S3 storage node supports various configuration options:

### Basic Configuration
```json
{
  "type": "s3-bucket",
  "config": {
    "bucketName": "my-bucket",
    "keyPrefix": "data/",
    "operation": "put",
    "contentType": "application/json"
  }
}
```

### Advanced Configuration
```json
{
  "type": "s3-bucket",
  "config": {
    "bucketName": "my-bucket",
    "keyPrefix": "data/{{.date}}/",
    "key": "specific-key.json",
    "operation": "put",
    "storageClass": "STANDARD_IA",
    "encryption": "AES256",
    "contentType": "application/json",
    "metadata": {
      "source": "workflow",
      "version": "1.0"
    },
    "tags": {
      "Environment": "production",
      "Project": "scraper"
    }
  }
}
```

### S3 Operations
- `put`: Store data in S3 (default)
- `get`: Retrieve data from S3
- `delete`: Delete object from S3
- `list`: List objects in bucket

### Template Variables
Key prefixes support template variables:
- `{{.date}}`: Current date (YYYY-MM-DD)
- `{{.timestamp}}`: Unix timestamp
- `{{.workflow}}`: Workflow name
- `{{.node}}`: Node ID

### Response Format

```json
{
  "success": true,
  "output": {
    "data": [
      {
        "url": "https://example.com",
        "title": "Example Domain",
        "content": "<html>...</html>",
        "extractedData": {
          "title": "Example Domain",
          "links": [
            {"href": "/page1", "text": "Page 1"}
          ],
          "images": [
            {"src": "/logo.png", "alt": "Logo"}
          ]
        },
        "metadata": {
          "timestamp": 1234567890,
          "method": "chrome"
        }
      }
    ]
  },
  "execution": {
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-01T00:01:00Z",
    "duration": "1m0s",
    "nodeExecutions": {
      "scraper": {
        "nodeId": "scraper",
        "status": "completed",
        "startTime": "2024-01-01T00:00:00Z",
        "endTime": "2024-01-01T00:00:30Z",
        "output": {...}
      }
    }
  }
}
```

## Local Development

### Build and Test Locally

1. Build the Docker image:
```bash
docker build -f Dockerfile.scraper -t workflow-scraper .
```

2. Run locally with Lambda RIE:
```bash
docker run -p 9000:8080 workflow-scraper
```

3. Test the function:
```bash
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{
    "httpMethod": "POST",
    "body": "{\"workflow\":{...},\"input\":{\"urls\":[\"https://httpbin.org/json\"]}}"
  }'
```

### Development Workflow

1. **Modify the scraper logic** in `cmd/lambda/main.go`
2. **Update Chrome configurations** in `NewScraperService()`
3. **Add new data extractors** in `extractStructuredData()`
4. **Test with different websites** using various selectors
5. **Rebuild and redeploy** with `pulumi up`

## Configuration Options

### Scraper Configuration

- `urls`: Array of URLs to scrape
- `selector`: CSS selector to extract specific content
- `waitFor`: CSS selector to wait for before scraping
- `extractData`: Whether to extract structured data
- `screenshot`: Whether to capture screenshots
- `headers`: Custom HTTP headers

### Chrome Configuration

The scraper uses optimized Chrome flags for Lambda:
- `--no-sandbox`: Required for Lambda environment
- `--disable-gpu`: Disable GPU acceleration
- `--disable-dev-shm-usage`: Use /tmp instead of /dev/shm
- `--headless`: Run in headless mode

### SQS Configuration

- `visibilityTimeoutSeconds`: 300 seconds
- `messageRetentionSeconds`: 14 days
- `maxReceiveCount`: 3 (with dead letter queue)

## Error Handling

The workflow includes comprehensive error handling:

1. **Node-level errors**: Each node can fail independently
2. **Retry logic**: SQS provides automatic retry with dead letter queue
3. **Conditional execution**: Edges can be traversed based on success/failure
4. **Error propagation**: Errors are captured and included in the response

## Monitoring and Observability

### CloudWatch Metrics

- Lambda execution duration and memory usage
- SQS message counts and dead letter queue activity
- Error rates and success rates per node

### Logging

Each Lambda function logs:
- Execution start/end times
- Input/output data sizes
- Error messages and stack traces
- Performance metrics

### Tracing

The workflow supports distributed tracing:
- Each node execution gets a unique trace ID
- Execution context is passed between nodes
- End-to-end latency tracking

## Advanced Features

### Data Transformations

Use JSONPath expressions to transform data between nodes:
```json
{
  "transform": "$.data[*].extractedData"
}
```

### Conditional Routing

Route data based on conditions:
```json
{
  "condition": "success",
  "transform": "$.data"
}
```

### Parallel Processing

The workflow supports parallel execution:
- Multiple URLs can be scraped simultaneously
- Results are aggregated before passing to next node

### Custom Node Types

Extend the workflow with custom node types:
- Database nodes for direct data storage
- API nodes for external service calls
- Notification nodes for alerts

## Best Practices

1. **Resource Management**: Set appropriate timeouts and memory limits
2. **Error Handling**: Use dead letter queues for failed messages
3. **Data Validation**: Validate input data before processing
4. **Monitoring**: Set up CloudWatch alarms for error rates
5. **Security**: Use IAM roles with minimal permissions
6. **Testing**: Test with various website types and structures

## Cost Optimization

- Use provisioned concurrency for predictable workloads
- Implement result caching for frequently scraped URLs
- Use SQS batch processing to reduce Lambda invocations
- Monitor and optimize memory allocation

## Troubleshooting

### Common Issues

1. **Chrome crashes**: Increase memory or adjust Chrome flags
2. **Network timeouts**: Increase Lambda timeout or implement retry logic
3. **Queue processing delays**: Check SQS visibility timeout settings
4. **Data transformation errors**: Validate JSONPath expressions

### Debug Commands

```bash
# Check Lambda logs
aws logs tail /aws/lambda/scraper --follow

# Check SQS queue status
aws sqs get-queue-attributes --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/processing-queue

# Test individual Lambda function
aws lambda invoke --function-name scraper --payload '{"test": true}' output.json
```