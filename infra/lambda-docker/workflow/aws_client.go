package workflow

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/lambda/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

// AWSClient encapsulates AWS service clients
type AWSClient struct {
	Lambda *lambda.Client
	SQS    *sqs.Client
	SNS    *sns.Client
	S3     *s3.Client
	Config aws.Config
}

// NewAWSClient creates a new AWS client with the necessary service clients
func NewAWSClient(ctx context.Context) (*AWSClient, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %v", err)
	}

	return &AWSClient{
		Lambda: lambda.NewFromConfig(cfg),
		SQS:    sqs.NewFromConfig(cfg),
		SNS:    sns.NewFromConfig(cfg),
		S3:     s3.NewFromConfig(cfg),
		Config: cfg,
	}, nil
}

// InvokeLambda invokes a Lambda function
func (c *AWSClient) InvokeLambda(ctx context.Context, nodeConfig *LambdaNodeConfig, payload interface{}) (interface{}, error) {
	// Marshal payload to JSON
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %v", err)
	}

	// Determine invocation type
	invocationType := types.InvocationTypeRequestResponse
	if nodeConfig.InvocationType == "Event" {
		invocationType = types.InvocationTypeEvent
	}

	// Build invoke input
	input := &lambda.InvokeInput{
		FunctionName:   aws.String(nodeConfig.ARN),
		InvocationType: invocationType,
		Payload:        payloadBytes,
	}

	if nodeConfig.Qualifier != "" {
		input.Qualifier = aws.String(nodeConfig.Qualifier)
	}

	// Set timeout context if specified
	invokeCtx := ctx
	if nodeConfig.Timeout > 0 {
		var cancel context.CancelFunc
		invokeCtx, cancel = context.WithTimeout(ctx, time.Duration(nodeConfig.Timeout)*time.Second)
		defer cancel()
	}

	// Invoke the function
	result, err := c.Lambda.Invoke(invokeCtx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to invoke lambda: %v", err)
	}

	// Check for function errors
	if result.FunctionError != nil {
		return nil, fmt.Errorf("lambda function error: %s", *result.FunctionError)
	}

	// For async invocations, we don't get a response payload
	if invocationType == types.InvocationTypeEvent {
		return map[string]interface{}{
			"statusCode": result.StatusCode,
			"async":      true,
		}, nil
	}

	// Parse response payload
	var response interface{}
	if len(result.Payload) > 0 {
		if err := json.Unmarshal(result.Payload, &response); err != nil {
			// If unmarshaling fails, return raw string
			response = string(result.Payload)
		}
	}

	return response, nil
}

// SendToSQS sends a message to an SQS queue
func (c *AWSClient) SendToSQS(ctx context.Context, nodeConfig *SQSNodeConfig, message interface{}) (interface{}, error) {
	// Marshal message to JSON
	messageBody, err := json.Marshal(message)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal message: %v", err)
	}

	// Build send message input
	input := &sqs.SendMessageInput{
		QueueUrl:    aws.String(nodeConfig.QueueURL),
		MessageBody: aws.String(string(messageBody)),
	}

	// Add delay if specified
	if nodeConfig.DelaySeconds > 0 {
		input.DelaySeconds = aws.Int32(int32(nodeConfig.DelaySeconds))
	}

	// Add message group ID for FIFO queues
	if nodeConfig.MessageGroupID != "" {
		input.MessageGroupId = aws.String(nodeConfig.MessageGroupID)
		// For FIFO queues, we also need a deduplication ID
		// Using timestamp + random for now
		input.MessageDeduplicationId = aws.String(fmt.Sprintf("%d", time.Now().UnixNano()))
	}

	// Send the message
	result, err := c.SQS.SendMessage(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to send SQS message: %v", err)
	}

	return map[string]interface{}{
		"messageId": *result.MessageId,
		"queueUrl":  nodeConfig.QueueURL,
	}, nil
}

// PublishToSNS publishes a message to an SNS topic
func (c *AWSClient) PublishToSNS(ctx context.Context, topicArn string, message interface{}) (interface{}, error) {
	// Marshal message to JSON
	messageBody, err := json.Marshal(message)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal message: %v", err)
	}

	// Publish the message
	result, err := c.SNS.Publish(ctx, &sns.PublishInput{
		TopicArn: aws.String(topicArn),
		Message:  aws.String(string(messageBody)),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to publish SNS message: %v", err)
	}

	return map[string]interface{}{
		"messageId": *result.MessageId,
		"topicArn":  topicArn,
	}, nil
}

// GetLambdaARN resolves a Lambda function name to its ARN
func (c *AWSClient) GetLambdaARN(ctx context.Context, functionName string) (string, error) {
	result, err := c.Lambda.GetFunction(ctx, &lambda.GetFunctionInput{
		FunctionName: aws.String(functionName),
	})
	if err != nil {
		return "", fmt.Errorf("failed to get lambda function: %v", err)
	}

	if result.Configuration != nil && result.Configuration.FunctionArn != nil {
		return *result.Configuration.FunctionArn, nil
	}

	return "", fmt.Errorf("lambda function ARN not found")
}

// GetSQSQueueURL resolves a queue name to its URL
func (c *AWSClient) GetSQSQueueURL(ctx context.Context, queueName string) (string, error) {
	result, err := c.SQS.GetQueueUrl(ctx, &sqs.GetQueueUrlInput{
		QueueName: aws.String(queueName),
	})
	if err != nil {
		return "", fmt.Errorf("failed to get queue URL: %v", err)
	}

	if result.QueueUrl != nil {
		return *result.QueueUrl, nil
	}

	return "", fmt.Errorf("queue URL not found")
}

// ResolveNodeConfig resolves node configuration, filling in missing values
func (c *AWSClient) ResolveNodeConfig(ctx context.Context, node *Node) error {
	switch node.Type {
	case NodeTypeLambda:
		var config LambdaNodeConfig
		if err := mapToStruct(node.Config, &config); err != nil {
			return err
		}

		// If only function name is provided, resolve ARN
		if config.ARN == "" && config.FunctionName != "" {
			arn, err := c.GetLambdaARN(ctx, config.FunctionName)
			if err != nil {
				return err
			}
			config.ARN = arn
		}

		// Update node config
		configMap, err := structToMap(config)
		if err != nil {
			return err
		}
		node.Config = configMap

	case NodeTypeSQSQueue:
		var config SQSNodeConfig
		if err := mapToStruct(node.Config, &config); err != nil {
			return err
		}

		// If only queue name is provided, resolve URL
		if config.QueueURL == "" && config.QueueName != "" {
			url, err := c.GetSQSQueueURL(ctx, config.QueueName)
			if err != nil {
				return err
			}
			config.QueueURL = url
		}

		// Update node config
		configMap, err := structToMap(config)
		if err != nil {
			return err
		}
		node.Config = configMap
	}

	return nil
}

// PutToS3 stores data in an S3 bucket
func (c *AWSClient) PutToS3(ctx context.Context, nodeConfig *S3NodeConfig, data interface{}) (interface{}, error) {
	// Determine the key to use
	key := nodeConfig.Key
	if key == "" && nodeConfig.KeyPrefix != "" {
		// Generate a key with timestamp if only prefix is provided
		key = fmt.Sprintf("%s%d.json", nodeConfig.KeyPrefix, time.Now().Unix())
	} else if key == "" {
		return nil, fmt.Errorf("either Key or KeyPrefix must be specified")
	}

	// Convert data to bytes
	var body []byte
	var contentType string
	var err error

	switch v := data.(type) {
	case string:
		body = []byte(v)
		contentType = "text/plain"
	case []byte:
		body = v
		contentType = "application/octet-stream"
	default:
		// JSON marshal for other types
		body, err = json.Marshal(data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal data: %v", err)
		}
		contentType = "application/json"
	}

	// Use configured content type if provided
	if nodeConfig.ContentType != "" {
		contentType = nodeConfig.ContentType
	}

	// Build put object input
	putInput := &s3.PutObjectInput{
		Bucket:      aws.String(nodeConfig.BucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(body),
		ContentType: aws.String(contentType),
	}

	// Add storage class if specified
	if nodeConfig.StorageClass != "" {
		putInput.StorageClass = s3.StorageClass(nodeConfig.StorageClass)
	}

	// Add server-side encryption if specified
	if nodeConfig.Encryption != "" {
		putInput.ServerSideEncryption = s3.ServerSideEncryption(nodeConfig.Encryption)
	}

	// Add metadata if specified
	if len(nodeConfig.Metadata) > 0 {
		metadata := make(map[string]string)
		for k, v := range nodeConfig.Metadata {
			metadata[k] = v
		}
		putInput.Metadata = metadata
	}

	// Add tags if specified
	if len(nodeConfig.Tags) > 0 {
		var tagSet []string
		for k, v := range nodeConfig.Tags {
			tagSet = append(tagSet, fmt.Sprintf("%s=%s", k, v))
		}
		putInput.Tagging = aws.String(strings.Join(tagSet, "&"))
	}

	// Put the object
	result, err := c.S3.PutObject(ctx, putInput)
	if err != nil {
		return nil, fmt.Errorf("failed to put S3 object: %v", err)
	}

	return map[string]interface{}{
		"bucket":    nodeConfig.BucketName,
		"key":       key,
		"etag":      aws.ToString(result.ETag),
		"versionId": aws.ToString(result.VersionId),
		"size":      len(body),
	}, nil
}

// GetFromS3 retrieves data from an S3 bucket
func (c *AWSClient) GetFromS3(ctx context.Context, nodeConfig *S3NodeConfig) (interface{}, error) {
	if nodeConfig.Key == "" {
		return nil, fmt.Errorf("Key must be specified for S3 get operation")
	}

	// Get the object
	result, err := c.S3.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(nodeConfig.BucketName),
		Key:    aws.String(nodeConfig.Key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get S3 object: %v", err)
	}
	defer result.Body.Close()

	// Read the body
	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(result.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read S3 object body: %v", err)
	}

	// Parse based on content type
	contentType := aws.ToString(result.ContentType)
	if strings.Contains(contentType, "application/json") {
		var jsonData interface{}
		if err := json.Unmarshal(buf.Bytes(), &jsonData); err != nil {
			// Return as string if JSON parsing fails
			return buf.String(), nil
		}
		return jsonData, nil
	}

	// Return as string for text content
	if strings.HasPrefix(contentType, "text/") {
		return buf.String(), nil
	}

	// Return as bytes for binary content
	return buf.Bytes(), nil
}

// DeleteFromS3 deletes an object from S3
func (c *AWSClient) DeleteFromS3(ctx context.Context, nodeConfig *S3NodeConfig) (interface{}, error) {
	if nodeConfig.Key == "" {
		return nil, fmt.Errorf("Key must be specified for S3 delete operation")
	}

	// Delete the object
	result, err := c.S3.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(nodeConfig.BucketName),
		Key:    aws.String(nodeConfig.Key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to delete S3 object: %v", err)
	}

	return map[string]interface{}{
		"bucket":    nodeConfig.BucketName,
		"key":       nodeConfig.Key,
		"versionId": aws.ToString(result.VersionId),
		"deleted":   true,
	}, nil
}

// ListS3Objects lists objects in an S3 bucket
func (c *AWSClient) ListS3Objects(ctx context.Context, nodeConfig *S3NodeConfig) (interface{}, error) {
	// Build list input
	listInput := &s3.ListObjectsV2Input{
		Bucket: aws.String(nodeConfig.BucketName),
	}

	// Add prefix if specified
	if nodeConfig.KeyPrefix != "" {
		listInput.Prefix = aws.String(nodeConfig.KeyPrefix)
	}

	// List objects
	result, err := c.S3.ListObjectsV2(ctx, listInput)
	if err != nil {
		return nil, fmt.Errorf("failed to list S3 objects: %v", err)
	}

	// Convert to response format
	var objects []map[string]interface{}
	for _, obj := range result.Contents {
		objects = append(objects, map[string]interface{}{
			"key":          aws.ToString(obj.Key),
			"size":         obj.Size,
			"lastModified": obj.LastModified.Format(time.RFC3339),
			"etag":         aws.ToString(obj.ETag),
			"storageClass": string(obj.StorageClass),
		})
	}

	return map[string]interface{}{
		"bucket":      nodeConfig.BucketName,
		"prefix":      nodeConfig.KeyPrefix,
		"objects":     objects,
		"count":       len(objects),
		"isTruncated": result.IsTruncated,
	}, nil
}

// ProcessS3Operation handles different S3 operations based on configuration
func (c *AWSClient) ProcessS3Operation(ctx context.Context, nodeConfig *S3NodeConfig, data interface{}) (interface{}, error) {
	operation := nodeConfig.Operation
	if operation == "" {
		operation = "put" // Default operation
	}

	switch operation {
	case "put":
		return c.PutToS3(ctx, nodeConfig, data)
	case "get":
		return c.GetFromS3(ctx, nodeConfig)
	case "delete":
		return c.DeleteFromS3(ctx, nodeConfig)
	case "list":
		return c.ListS3Objects(ctx, nodeConfig)
	default:
		return nil, fmt.Errorf("unsupported S3 operation: %s", operation)
	}
}

func structToMap(v interface{}) (map[string]interface{}, error) {
	data, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return result, nil
}