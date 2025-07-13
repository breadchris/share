package infrastructure

import (
	"context"
	"flag"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

var (
	testName    = flag.String("test-name", "", "Name of the test instance")
	awsRegion   = flag.String("aws-region", "us-east-1", "AWS region")
	s3Bucket    = flag.String("s3-bucket", "", "S3 bucket name")
	sqsQueue    = flag.String("sqs-queue", "", "SQS queue URL")
	lambdaARNs  = flag.String("lambda-arns", "", "Space-separated Lambda function ARNs")
)

type TestContext struct {
	ctx         context.Context
	cfg         aws.Config
	lambdaClient *lambda.Client
	s3Client     *s3.Client
	sqsClient    *sqs.Client
	testName     string
	s3Bucket     string
	sqsQueue     string
	lambdaARNs   []string
}

func setupTestContext(t *testing.T) *TestContext {
	ctx := context.Background()
	
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(*awsRegion))
	if err != nil {
		t.Fatalf("Failed to load AWS config: %v", err)
	}

	lambdaARNs := []string{}
	if *lambdaARNs != "" {
		lambdaARNs = strings.Fields(*lambdaARNs)
	}

	return &TestContext{
		ctx:          ctx,
		cfg:          cfg,
		lambdaClient: lambda.NewFromConfig(cfg),
		s3Client:     s3.NewFromConfig(cfg),
		sqsClient:    sqs.NewFromConfig(cfg),
		testName:     *testName,
		s3Bucket:     *s3Bucket,
		sqsQueue:     *sqsQueue,
		lambdaARNs:   lambdaARNs,
	}
}

func TestInfrastructureDeployment(t *testing.T) {
	tc := setupTestContext(t)
	
	t.Run("ValidateS3Bucket", tc.testS3BucketExists)
	t.Run("ValidateSQSQueue", tc.testSQSQueueExists)
	t.Run("ValidateLambdaFunctions", tc.testLambdaFunctionsExist)
	t.Run("ValidateResourceTags", tc.testResourceTags)
	t.Run("ValidateResourcePermissions", tc.testResourcePermissions)
}

func (tc *TestContext) testS3BucketExists(t *testing.T) {
	if tc.s3Bucket == "" {
		t.Skip("No S3 bucket configured")
	}

	t.Logf("Testing S3 bucket: %s", tc.s3Bucket)
	
	// Check if bucket exists
	_, err := tc.s3Client.HeadBucket(tc.ctx, &s3.HeadBucketInput{
		Bucket: aws.String(tc.s3Bucket),
	})
	if err != nil {
		t.Fatalf("S3 bucket %s does not exist or is not accessible: %v", tc.s3Bucket, err)
	}

	// Check bucket location
	location, err := tc.s3Client.GetBucketLocation(tc.ctx, &s3.GetBucketLocationInput{
		Bucket: aws.String(tc.s3Bucket),
	})
	if err != nil {
		t.Fatalf("Failed to get bucket location: %v", err)
	}
	
	expectedRegion := *awsRegion
	if expectedRegion == "us-east-1" {
		expectedRegion = "" // us-east-1 returns empty string
	}
	
	actualRegion := string(location.LocationConstraint)
	if actualRegion != expectedRegion {
		t.Errorf("Expected bucket region %s, got %s", expectedRegion, actualRegion)
	}

	// Check bucket encryption
	encryption, err := tc.s3Client.GetBucketEncryption(tc.ctx, &s3.GetBucketEncryptionInput{
		Bucket: aws.String(tc.s3Bucket),
	})
	if err != nil {
		t.Logf("Warning: Could not get bucket encryption: %v", err)
	} else {
		if len(encryption.ServerSideEncryptionConfiguration.Rules) == 0 {
			t.Error("S3 bucket should have encryption enabled")
		}
	}

	// Check public access block
	publicAccess, err := tc.s3Client.GetPublicAccessBlock(tc.ctx, &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(tc.s3Bucket),
	})
	if err != nil {
		t.Logf("Warning: Could not get public access block: %v", err)
	} else {
		config := publicAccess.PublicAccessBlockConfiguration
		if !config.BlockPublicAcls || !config.BlockPublicPolicy || 
		   !config.IgnorePublicAcls || !config.RestrictPublicBuckets {
			t.Error("S3 bucket should block all public access")
		}
	}

	t.Logf("S3 bucket validation passed")
}

func (tc *TestContext) testSQSQueueExists(t *testing.T) {
	if tc.sqsQueue == "" {
		t.Skip("No SQS queue configured")
	}

	t.Logf("Testing SQS queue: %s", tc.sqsQueue)
	
	// Get queue attributes
	attrs, err := tc.sqsClient.GetQueueAttributes(tc.ctx, &sqs.GetQueueAttributesInput{
		QueueUrl: aws.String(tc.sqsQueue),
		AttributeNames: []string{"All"},
	})
	if err != nil {
		t.Fatalf("SQS queue %s does not exist or is not accessible: %v", tc.sqsQueue, err)
	}

	// Validate queue attributes
	if attrs.Attributes["VisibilityTimeout"] == "" {
		t.Error("SQS queue should have visibility timeout set")
	}

	if attrs.Attributes["MessageRetentionPeriod"] == "" {
		t.Error("SQS queue should have message retention period set")
	}

	t.Logf("SQS queue validation passed")
}

func (tc *TestContext) testLambdaFunctionsExist(t *testing.T) {
	if len(tc.lambdaARNs) == 0 {
		t.Skip("No Lambda functions configured")
	}

	t.Logf("Testing %d Lambda functions", len(tc.lambdaARNs))
	
	for i, arn := range tc.lambdaARNs {
		t.Run(fmt.Sprintf("Lambda_%d", i), func(t *testing.T) {
			tc.testSingleLambdaFunction(t, arn)
		})
	}
}

func (tc *TestContext) testSingleLambdaFunction(t *testing.T, functionARN string) {
	// Extract function name from ARN
	parts := strings.Split(functionARN, ":")
	if len(parts) < 6 {
		t.Fatalf("Invalid Lambda ARN format: %s", functionARN)
	}
	functionName := parts[6]

	t.Logf("Testing Lambda function: %s", functionName)
	
	// Get function configuration
	config, err := tc.lambdaClient.GetFunction(tc.ctx, &lambda.GetFunctionInput{
		FunctionName: aws.String(functionName),
	})
	if err != nil {
		t.Fatalf("Lambda function %s does not exist or is not accessible: %v", functionName, err)
	}

	// Validate function configuration
	if config.Configuration.State != "Active" {
		t.Errorf("Lambda function %s should be in Active state, got %s", functionName, config.Configuration.State)
	}

	if config.Configuration.Runtime == "" {
		t.Error("Lambda function should have runtime specified")
	}

	if config.Configuration.Role == nil || *config.Configuration.Role == "" {
		t.Error("Lambda function should have IAM role")
	}

	// Test function invocation (basic smoke test)
	testPayload := `{"test": true, "source": "infrastructure-test"}`
	invoke, err := tc.lambdaClient.Invoke(tc.ctx, &lambda.InvokeInput{
		FunctionName: aws.String(functionName),
		Payload:      []byte(testPayload),
	})
	if err != nil {
		t.Errorf("Failed to invoke Lambda function %s: %v", functionName, err)
	} else if invoke.StatusCode != 200 {
		t.Errorf("Lambda function %s returned non-200 status: %d", functionName, invoke.StatusCode)
	}

	t.Logf("Lambda function %s validation passed", functionName)
}

func (tc *TestContext) testResourceTags(t *testing.T) {
	expectedTags := map[string]string{
		"Project":  tc.testName,
		"TestName": tc.testName,
	}

	// Test S3 bucket tags
	if tc.s3Bucket != "" {
		t.Run("S3BucketTags", func(t *testing.T) {
			tc.validateS3BucketTags(t, expectedTags)
		})
	}

	// Test Lambda function tags
	for i, arn := range tc.lambdaARNs {
		t.Run(fmt.Sprintf("LambdaTags_%d", i), func(t *testing.T) {
			tc.validateLambdaTags(t, arn, expectedTags)
		})
	}
}

func (tc *TestContext) validateS3BucketTags(t *testing.T, expectedTags map[string]string) {
	tags, err := tc.s3Client.GetBucketTagging(tc.ctx, &s3.GetBucketTaggingInput{
		Bucket: aws.String(tc.s3Bucket),
	})
	if err != nil {
		t.Logf("Warning: Could not get S3 bucket tags: %v", err)
		return
	}

	tagMap := make(map[string]string)
	for _, tag := range tags.TagSet {
		tagMap[*tag.Key] = *tag.Value
	}

	for key, expectedValue := range expectedTags {
		if actualValue, exists := tagMap[key]; !exists {
			t.Errorf("S3 bucket missing expected tag: %s", key)
		} else if actualValue != expectedValue {
			t.Errorf("S3 bucket tag %s: expected %s, got %s", key, expectedValue, actualValue)
		}
	}
}

func (tc *TestContext) validateLambdaTags(t *testing.T, functionARN string, expectedTags map[string]string) {
	tags, err := tc.lambdaClient.ListTags(tc.ctx, &lambda.ListTagsInput{
		Resource: aws.String(functionARN),
	})
	if err != nil {
		t.Errorf("Failed to get Lambda function tags: %v", err)
		return
	}

	for key, expectedValue := range expectedTags {
		if actualValue, exists := tags.Tags[key]; !exists {
			t.Errorf("Lambda function missing expected tag: %s", key)
		} else if actualValue != expectedValue {
			t.Errorf("Lambda function tag %s: expected %s, got %s", key, expectedValue, actualValue)
		}
	}
}

func (tc *TestContext) testResourcePermissions(t *testing.T) {
	// Test that resources can communicate with each other
	
	// Test S3 write/read permissions
	if tc.s3Bucket != "" {
		t.Run("S3Permissions", func(t *testing.T) {
			tc.testS3Permissions(t)
		})
	}

	// Test SQS send/receive permissions
	if tc.sqsQueue != "" {
		t.Run("SQSPermissions", func(t *testing.T) {
			tc.testSQSPermissions(t)
		})
	}
}

func (tc *TestContext) testS3Permissions(t *testing.T) {
	testKey := fmt.Sprintf("test/%s/permission-test.txt", tc.testName)
	testContent := fmt.Sprintf("Test content from infrastructure test at %s", time.Now().Format(time.RFC3339))

	// Test write permission
	_, err := tc.s3Client.PutObject(tc.ctx, &s3.PutObjectInput{
		Bucket: aws.String(tc.s3Bucket),
		Key:    aws.String(testKey),
		Body:   strings.NewReader(testContent),
	})
	if err != nil {
		t.Errorf("Failed to write to S3 bucket: %v", err)
		return
	}

	// Test read permission
	obj, err := tc.s3Client.GetObject(tc.ctx, &s3.GetObjectInput{
		Bucket: aws.String(tc.s3Bucket),
		Key:    aws.String(testKey),
	})
	if err != nil {
		t.Errorf("Failed to read from S3 bucket: %v", err)
		return
	}
	obj.Body.Close()

	// Clean up test object
	_, err = tc.s3Client.DeleteObject(tc.ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(tc.s3Bucket),
		Key:    aws.String(testKey),
	})
	if err != nil {
		t.Logf("Warning: Failed to clean up test object: %v", err)
	}

	t.Logf("S3 permissions test passed")
}

func (tc *TestContext) testSQSPermissions(t *testing.T) {
	testMessage := fmt.Sprintf(`{"test": true, "timestamp": "%s", "source": "infrastructure-test"}`, time.Now().Format(time.RFC3339))

	// Test send permission
	send, err := tc.sqsClient.SendMessage(tc.ctx, &sqs.SendMessageInput{
		QueueUrl:    aws.String(tc.sqsQueue),
		MessageBody: aws.String(testMessage),
	})
	if err != nil {
		t.Errorf("Failed to send message to SQS queue: %v", err)
		return
	}

	// Test receive permission
	receive, err := tc.sqsClient.ReceiveMessage(tc.ctx, &sqs.ReceiveMessageInput{
		QueueUrl:            aws.String(tc.sqsQueue),
		MaxNumberOfMessages: 1,
		WaitTimeSeconds:     5,
	})
	if err != nil {
		t.Errorf("Failed to receive message from SQS queue: %v", err)
		return
	}

	// Clean up test message if received
	if len(receive.Messages) > 0 {
		for _, message := range receive.Messages {
			_, err = tc.sqsClient.DeleteMessage(tc.ctx, &sqs.DeleteMessageInput{
				QueueUrl:      aws.String(tc.sqsQueue),
				ReceiptHandle: message.ReceiptHandle,
			})
			if err != nil {
				t.Logf("Warning: Failed to delete test message: %v", err)
			}
		}
	}

	t.Logf("SQS permissions test passed (MessageId: %s)", *send.MessageId)
}

func TestInfrastructureCleanup(t *testing.T) {
	tc := setupTestContext(t)
	
	t.Run("VerifyNoLeftoverTestData", tc.testNoLeftoverTestData)
}

func (tc *TestContext) testNoLeftoverTestData(t *testing.T) {
	// Check for any leftover test objects in S3
	if tc.s3Bucket != "" {
		objects, err := tc.s3Client.ListObjectsV2(tc.ctx, &s3.ListObjectsV2Input{
			Bucket: aws.String(tc.s3Bucket),
			Prefix: aws.String(fmt.Sprintf("test/%s/", tc.testName)),
		})
		if err != nil {
			t.Logf("Warning: Could not list S3 objects: %v", err)
		} else if len(objects.Contents) > 0 {
			t.Logf("Found %d leftover test objects in S3", len(objects.Contents))
			for _, obj := range objects.Contents {
				t.Logf("  - %s", *obj.Key)
			}
		}
	}

	// Check for any leftover messages in SQS
	if tc.sqsQueue != "" {
		attrs, err := tc.sqsClient.GetQueueAttributes(tc.ctx, &sqs.GetQueueAttributesInput{
			QueueUrl:       aws.String(tc.sqsQueue),
			AttributeNames: []string{"ApproximateNumberOfMessages"},
		})
		if err != nil {
			t.Logf("Warning: Could not get SQS queue attributes: %v", err)
		} else if attrs.Attributes["ApproximateNumberOfMessages"] != "0" {
			t.Logf("Warning: SQS queue has %s messages remaining", attrs.Attributes["ApproximateNumberOfMessages"])
		}
	}
}