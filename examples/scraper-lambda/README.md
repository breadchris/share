# Scraper Lambda Example

This example demonstrates how to deploy a web scraper Lambda function using the generalized infrastructure from the share repository. The Lambda function uses ChromeDP for browser automation and can extract structured data from web pages.

## Features

- **Browser Automation**: Uses ChromeDP with headless Chrome for JavaScript-heavy sites
- **Custom Docker Container**: Built on `chromedp/headless-shell:latest` base image
- **Structured Data Extraction**: Extracts metadata, Open Graph data, links, and images
- **Screenshot Capture**: Optional screenshot functionality
- **Fallback HTTP Scraping**: HTTP-based scraping for simple pages
- **AWS Lambda Ready**: Optimized for Lambda environment with proper timeouts and memory limits

## Architecture

The example uses a multi-stage Docker build:
1. **Builder Stage**: Compiles Go Lambda function
2. **Runtime Stage**: ChromeDP headless shell with Lambda runtime

## Usage

### Deploy the Lambda

1. Navigate to the example directory:
```bash
cd examples/scraper-lambda
```

2. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

3. Deploy the infrastructure:
```bash
pulumi up
```

### Test the Lambda

Send a POST request to the Lambda endpoint:

```bash
curl -X POST https://your-api-gateway-url/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "javascript": true,
    "extractData": true,
    "screenshot": false,
    "timeout": 30
  }'
```

### Request Parameters

- `url` (required): The URL to scrape
- `selector` (optional): CSS selector to extract specific content
- `waitFor` (optional): CSS selector to wait for before scraping
- `timeout` (optional): Timeout in seconds (default: 30)
- `screenshot` (optional): Whether to capture a screenshot
- `javascript` (optional): Whether to use Chrome for JavaScript execution
- `extractData` (optional): Whether to extract structured data
- `headers` (optional): Custom HTTP headers

### Response Format

```json
{
  "title": "Page Title",
  "content": "HTML content",
  "screenshot": "base64-encoded-screenshot",
  "metadata": {
    "method": "chrome",
    "url": "https://example.com",
    "timestamp": 1234567890
  },
  "extractedData": {
    "title": "Page Title",
    "description": "Page description",
    "openGraph": {
      "og:title": "OG Title",
      "og:description": "OG Description"
    },
    "links": [
      {"href": "/page1", "text": "Link 1"}
    ],
    "images": [
      {"src": "/image1.jpg", "alt": "Image 1"}
    ]
  }
}
```

## Local Development

### Build and Test Locally

1. Build the Docker image:
```bash
docker build -t scraper-lambda .
```

2. Run locally with Lambda RIE:
```bash
docker run -p 9000:8080 scraper-lambda
```

3. Test the function:
```bash
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{
    "body": "{\"url\":\"https://example.com\",\"javascript\":true}",
    "httpMethod": "POST"
  }'
```

### Environment Variables

- `CHROME_BIN`: Path to Chrome binary
- `CHROME_PATH`: Path to Chrome executable
- `DISPLAY`: Display for headless mode

## Configuration

The Lambda is configured via `Pulumi.dev.yaml`:

- **Memory**: 1024 MB (adjust based on scraping complexity)
- **Timeout**: 300 seconds (5 minutes max for Lambda)
- **Base Image**: `chromedp/headless-shell:latest`
- **Architecture**: x86_64

## Extending the Example

### Add More Extractors

Modify the `extractStructuredData` function to add custom data extractors:

```go
func (s *ScraperService) extractStructuredData(content string) map[string]interface{} {
    data := make(map[string]interface{})
    
    // Add custom extractors
    data["prices"] = s.extractPrices(content)
    data["products"] = s.extractProducts(content)
    
    return data
}
```

### Add S3 Integration

Store screenshots and extracted data in S3:

```go
func (s *ScraperService) uploadToS3(data []byte, key string) error {
    // Implement S3 upload logic
    return nil
}
```

### Add Database Integration

Store scraping results in DynamoDB:

```go
func (s *ScraperService) saveToDatabase(result *ScrapeResponse) error {
    // Implement database save logic
    return nil
}
```

## Security Considerations

- The Lambda runs with minimal IAM permissions
- Chrome runs in a sandboxed environment
- Network access is restricted to outbound HTTPS
- Input validation prevents malicious URLs

## Cost Optimization

- Use provisioned concurrency for consistent performance
- Implement caching for frequently scraped URLs
- Use Step Functions for long-running scraping jobs
- Monitor and optimize memory allocation

## Troubleshooting

### Common Issues

1. **Chrome crashes**: Increase memory allocation or adjust Chrome flags
2. **Timeout errors**: Increase Lambda timeout or implement pagination
3. **Network issues**: Check VPC configuration and security groups
4. **Memory errors**: Optimize Chrome flags and increase memory limit

### Debug Mode

Enable debug logging by setting environment variables:
```bash
export DEBUG=true
export CHROME_DEBUG=true
```

## Related Examples

- [Slack Bot Lambda](../slack-bot-lambda/) - AI-powered Slack bot
- [API Gateway Integration](../api-gateway/) - REST API with Lambda backend
- [Scheduled Scraper](../scheduled-scraper/) - EventBridge-triggered scraping