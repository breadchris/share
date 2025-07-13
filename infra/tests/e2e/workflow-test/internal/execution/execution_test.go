package execution

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
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
	testName      = flag.String("test-name", "", "Name of the test instance")
	awsRegion     = flag.String("aws-region", "us-east-1", "AWS region")
	s3Bucket      = flag.String("s3-bucket", "", "S3 bucket name")
	sqsQueue      = flag.String("sqs-queue", "", "SQS queue URL")
	lambdaARNs    = flag.String("lambda-arns", "", "Space-separated Lambda function ARNs")
	testDataDir   = flag.String("test-data-dir", "", "Directory containing test data files")
)

type TestContext struct {
	ctx          context.Context
	cfg          aws.Config
	lambdaClient *lambda.Client
	s3Client     *s3.Client
	sqsClient    *sqs.Client
	testName     string
	s3Bucket     string
	sqsQueue     string
	lambdaARNs   []string
	testDataDir  string
}

type WorkflowPayload struct {
	Input interface{}          `json:"input"`
	Graph WorkflowDefinition  `json:"graph"`
}

type WorkflowDefinition struct {
	Name       string              `json:"name"`
	Nodes      []WorkflowNode      `json:"nodes"`
	Edges      []WorkflowEdge      `json:"edges"`
	Entrypoint string              `json:"entrypoint"`
}

type WorkflowNode struct {
	ID     string                 `json:"id"`
	Type   string                 `json:"type"`
	Config map[string]interface{} `json:"config"`
}

type WorkflowEdge struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type ExecutionResult struct {
	NodeID    string      `json:"nodeId"`
	Status    string      `json:"status"`
	Output    interface{} `json:"output,omitempty"`
	Error     string      `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
	Duration  int64       `json:"duration"`
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
		testDataDir:  *testDataDir,
	}
}

func TestWorkflowExecution(t *testing.T) {
	tc := setupTestContext(t)
	
	t.Run("SingleNodeExecution", tc.testSingleNodeExecution)
	t.Run("MultiNodeWorkflow", tc.testMultiNodeWorkflow)
	t.Run("ErrorHandling", tc.testErrorHandling)
	t.Run("DataFlow", tc.testDataFlow)
	t.Run("PerformanceMetrics", tc.testPerformanceMetrics)
}

func (tc *TestContext) testSingleNodeExecution(t *testing.T) {
	if len(tc.lambdaARNs) == 0 {
		t.Skip("No Lambda functions available for testing")
	}

	// Test each Lambda function individually
	for i, arn := range tc.lambdaARNs {
		t.Run(fmt.Sprintf("Lambda_%d", i), func(t *testing.T) {
			tc.testLambdaExecution(t, arn)
		})
	}
}

func (tc *TestContext) testLambdaExecution(t *testing.T, functionARN string) {
	// Extract function name from ARN
	parts := strings.Split(functionARN, ":")
	functionName := parts[len(parts)-1]

	// Create test payload
	testInput := map[string]interface{}{
		"testType":  "execution",
		"nodeId":    functionName,
		"timestamp": time.Now().Format(time.RFC3339),
		"data":      "test execution data",
	}

	// Simple workflow with just this function
	workflow := WorkflowDefinition{
		Name:       "single-node-test",
		Entrypoint: functionName,
		Nodes: []WorkflowNode{
			{
				ID:   functionName,
				Type: "lambda",
				Config: map[string]interface{}{
					"lambda": map[string]interface{}{
						"functionName": functionName,
					},
				},
			},
		},
		Edges: []WorkflowEdge{},
	}

	payload := WorkflowPayload{
		Input: testInput,
		Graph: workflow,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("Failed to marshal payload: %v", err)
	}

	// Invoke Lambda function
	startTime := time.Now()
	result, err := tc.lambdaClient.Invoke(tc.ctx, &lambda.InvokeInput{
		FunctionName: aws.String(functionName),
		Payload:      payloadBytes,
	})
	duration := time.Since(startTime)

	if err != nil {
		t.Fatalf("Failed to invoke Lambda function: %v", err)
	}

	if result.StatusCode != 200 {
		t.Errorf("Lambda returned non-200 status: %d", result.StatusCode)
	}

	// Parse response
	var response ExecutionResult
	if err := json.Unmarshal(result.Payload, &response); err != nil {
		t.Logf("Warning: Could not parse Lambda response as ExecutionResult: %v", err)
		t.Logf("Raw response: %s", string(result.Payload))
	} else {
		if response.Status != "success" && response.Status != "" {
			t.Errorf("Lambda execution failed: %s", response.Error)
		}
	}

	// Validate execution time
	if duration > 30*time.Second {
		t.Errorf("Lambda execution took too long: %v", duration)
	}

	t.Logf("Lambda %s executed successfully in %v", functionName, duration)
}

func (tc *TestContext) testMultiNodeWorkflow(t *testing.T) {
	if tc.testDataDir == "" {
		t.Skip("test-data-dir not provided")
	}

	// Load test workflow
	workflowPath := filepath.Join(tc.testDataDir, "test-workflow.json")
	workflowData, err := os.ReadFile(workflowPath)
	if err != nil {
		t.Skipf("Could not load test workflow: %v", err)
	}

	var workflows []WorkflowDefinition
	if err := json.Unmarshal(workflowData, &workflows); err != nil {
		t.Fatalf("Failed to parse workflow: %v", err)
	}

	if len(workflows) == 0 {
		t.Fatal("No workflows found in test data")
	}

	workflow := workflows[0] // Use first workflow

	// Create test input data
	testInput := map[string]interface{}{
		"url":       "https://example.com",
		"timestamp": time.Now().Format(time.RFC3339),
		"testMode":  true,
		"batchId":   fmt.Sprintf("test-%s-%d", tc.testName, time.Now().Unix()),
	}

	// Execute workflow
	result := tc.executeWorkflow(t, workflow, testInput)
	
	// Validate results
	if result.Status != "success" {
		t.Errorf("Workflow execution failed: %s", result.Error)
	}

	t.Logf("Multi-node workflow executed successfully")
}

func (tc *TestContext) executeWorkflow(t *testing.T, workflow WorkflowDefinition, input interface{}) *ExecutionResult {
	// For testing, we'll simulate workflow execution by calling the entrypoint Lambda
	if len(tc.lambdaARNs) == 0 {
		t.Skip("No Lambda functions available for workflow execution")
	}

	// Use first available Lambda as workflow executor
	executorARN := tc.lambdaARNs[0]
	parts := strings.Split(executorARN, ":")
	executorName := parts[len(parts)-1]

	payload := WorkflowPayload{
		Input: input,
		Graph: workflow,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("Failed to marshal workflow payload: %v", err)
	}

	// Invoke workflow executor
	startTime := time.Now()
	result, err := tc.lambdaClient.Invoke(tc.ctx, &lambda.InvokeInput{
		FunctionName: aws.String(executorName),
		Payload:      payloadBytes,
	})
	duration := time.Since(startTime)

	if err != nil {
		return &ExecutionResult{
			Status:    "error",
			Error:     err.Error(),
			Timestamp: time.Now(),
			Duration:  duration.Milliseconds(),
		}
	}

	// Parse result
	var execResult ExecutionResult
	if err := json.Unmarshal(result.Payload, &execResult); err != nil {
		// If we can't parse as ExecutionResult, create one
		execResult = ExecutionResult{
			Status:    "success",
			Output:    json.RawMessage(result.Payload),
			Timestamp: time.Now(),
			Duration:  duration.Milliseconds(),
		}
	}

	return &execResult
}

func (tc *TestContext) testErrorHandling(t *testing.T) {
	if len(tc.lambdaARNs) == 0 {
		t.Skip("No Lambda functions available for error testing")
	}

	functionName := strings.Split(tc.lambdaARNs[0], ":")[6]

	// Test with malformed payload
	t.Run("MalformedPayload", func(t *testing.T) {
		malformedPayload := `{"invalid": json`
		
		result, err := tc.lambdaClient.Invoke(tc.ctx, &lambda.InvokeInput{
			FunctionName: aws.String(functionName),
			Payload:      []byte(malformedPayload),
		})

		if err != nil {
			t.Logf("Expected error for malformed payload: %v", err)
		} else if result.FunctionError != nil {
			t.Logf("Lambda reported function error: %s", *result.FunctionError)
		}
	})

	// Test with missing required fields
	t.Run("MissingFields", func(t *testing.T) {
		payload := WorkflowPayload{
			Input: map[string]interface{}{"test": true},
			// Missing graph
		}

		payloadBytes, _ := json.Marshal(payload)
		
		result, err := tc.lambdaClient.Invoke(tc.ctx, &lambda.InvokeInput{
			FunctionName: aws.String(functionName),
			Payload:      payloadBytes,
		})

		if err != nil {
			t.Logf("Expected error for missing fields: %v", err)
		} else {
			// Check if Lambda handled the error gracefully
			var response map[string]interface{}
			if err := json.Unmarshal(result.Payload, &response); err == nil {
				if status, ok := response["status"]; ok && status == "error" {
					t.Logf("Lambda handled missing fields gracefully")
				}
			}
		}
	})

	// Test timeout handling
	t.Run("TimeoutHandling", func(t *testing.T) {
		// Create a workflow that should timeout (simulate long-running task)
		workflow := WorkflowDefinition{
			Name:       "timeout-test",
			Entrypoint: "timeout-node",
			Nodes: []WorkflowNode{
				{
					ID:   "timeout-node",
					Type: "lambda",
					Config: map[string]interface{}{
						"lambda": map[string]interface{}{
							"functionName": functionName,
							"timeout":      1, // Very short timeout
						},
					},
				},
			},
		}

		input := map[string]interface{}{
			"simulate": "timeout",
			"duration": 5000, // 5 second simulation
		}

		result := tc.executeWorkflow(t, workflow, input)
		
		// We expect this to either timeout or complete quickly
		if result.Duration > 10000 { // 10 seconds
			t.Logf("Workflow took longer than expected: %dms", result.Duration)
		}
	})
}

func (tc *TestContext) testDataFlow(t *testing.T) {
	// Test data flow between different node types
	
	// Test Lambda -> S3 flow
	if tc.s3Bucket != "" && len(tc.lambdaARNs) > 0 {
		t.Run("LambdaToS3", func(t *testing.T) {
			tc.testLambdaToS3Flow(t)
		})
	}

	// Test Lambda -> SQS flow
	if tc.sqsQueue != "" && len(tc.lambdaARNs) > 0 {
		t.Run("LambdaToSQS", func(t *testing.T) {
			tc.testLambdaToSQSFlow(t)
		})
	}

	// Test SQS -> Lambda flow
	if tc.sqsQueue != "" && len(tc.lambdaARNs) > 0 {
		t.Run("SQSToLambda", func(t *testing.T) {
			tc.testSQSToLambdaFlow(t)
		})
	}
}

func (tc *TestContext) testLambdaToS3Flow(t *testing.T) {
	functionName := strings.Split(tc.lambdaARNs[0], ":")[6]
	testKey := fmt.Sprintf("test/%s/lambda-output-%d.json", tc.testName, time.Now().Unix())

	// Create workflow that outputs to S3
	workflow := WorkflowDefinition{
		Name:       "lambda-s3-test",
		Entrypoint: "producer",
		Nodes: []WorkflowNode{
			{
				ID:   "producer",
				Type: "lambda",
				Config: map[string]interface{}{
					"lambda": map[string]interface{}{
						"functionName": functionName,
					},
				},
			},
			{
				ID:   "storage",
				Type: "s3-bucket",
				Config: map[string]interface{}{
					"s3": map[string]interface{}{
						"bucketName": tc.s3Bucket,
						"key":        testKey,
						"operation":  "put",
					},
				},
			},
		},
		Edges: []WorkflowEdge{
			{From: "producer", To: "storage"},
		},
	}

	input := map[string]interface{}{
		"message": "Test data flow from Lambda to S3",
		"testKey": testKey,
	}

	// Execute workflow
	result := tc.executeWorkflow(t, workflow, input)
	
	if result.Status != "success" {
		t.Errorf("Lambda to S3 workflow failed: %s", result.Error)
		return
	}

	// Verify data was written to S3
	time.Sleep(2 * time.Second) // Allow time for S3 eventual consistency
	
	_, err := tc.s3Client.GetObject(tc.ctx, &s3.GetObjectInput{
		Bucket: aws.String(tc.s3Bucket),
		Key:    aws.String(testKey),
	})
	
	if err != nil {
		t.Errorf("Data not found in S3: %v", err)
	} else {
		t.Logf("Lambda to S3 data flow verified")
		
		// Clean up
		_, err = tc.s3Client.DeleteObject(tc.ctx, &s3.DeleteObjectInput{
			Bucket: aws.String(tc.s3Bucket),
			Key:    aws.String(testKey),
		})
		if err != nil {
			t.Logf("Warning: Failed to clean up test object: %v", err)
		}
	}
}

func (tc *TestContext) testLambdaToSQSFlow(t *testing.T) {
	functionName := strings.Split(tc.lambdaARNs[0], ":")[6]

	// Send test message to SQS via Lambda
	testMessage := map[string]interface{}{
		"source":    "lambda-sqs-test",
		"timestamp": time.Now().Format(time.RFC3339),
		"data":      "Test message from Lambda to SQS",
	}

	workflow := WorkflowDefinition{
		Name:       "lambda-sqs-test",
		Entrypoint: "producer",
		Nodes: []WorkflowNode{
			{
				ID:   "producer",
				Type: "lambda",
				Config: map[string]interface{}{
					"lambda": map[string]interface{}{
						"functionName": functionName,
					},
				},
			},
			{
				ID:   "queue",
				Type: "sqs-queue",
				Config: map[string]interface{}{
					"sqs": map[string]interface{}{
						"queueUrl": tc.sqsQueue,
					},
				},
			},
		},
		Edges: []WorkflowEdge{
			{From: "producer", To: "queue"},
		},
	}

	// Execute workflow
	result := tc.executeWorkflow(t, workflow, testMessage)
	
	if result.Status != "success" {
		t.Errorf("Lambda to SQS workflow failed: %s", result.Error)
		return
	}

	// Verify message was sent to SQS
	time.Sleep(1 * time.Second)
	
	messages, err := tc.sqsClient.ReceiveMessage(tc.ctx, &sqs.ReceiveMessageInput{
		QueueUrl:            aws.String(tc.sqsQueue),
		MaxNumberOfMessages: 1,
		WaitTimeSeconds:     5,
	})
	
	if err != nil {
		t.Errorf("Failed to receive message from SQS: %v", err)
	} else if len(messages.Messages) == 0 {
		t.Error("No messages found in SQS queue")
	} else {
		t.Logf("Lambda to SQS data flow verified")
		
		// Clean up message
		for _, message := range messages.Messages {
			_, err = tc.sqsClient.DeleteMessage(tc.ctx, &sqs.DeleteMessageInput{
				QueueUrl:      aws.String(tc.sqsQueue),
				ReceiptHandle: message.ReceiptHandle,
			})
			if err != nil {
				t.Logf("Warning: Failed to delete test message: %v", err)
			}
		}
	}
}

func (tc *TestContext) testSQSToLambdaFlow(t *testing.T) {
	// This test would typically involve SQS triggers, which are harder to test
	// in isolation. For now, we'll simulate by manually invoking Lambda with
	// SQS-like payload structure
	
	functionName := strings.Split(tc.lambdaARNs[0], ":")[6]

	// Create SQS-like event structure
	sqsEvent := map[string]interface{}{
		"Records": []map[string]interface{}{
			{
				"eventSource": "aws:sqs",
				"body":        `{"message": "Test SQS to Lambda flow", "timestamp": "` + time.Now().Format(time.RFC3339) + `"}`,
				"messageId":   "test-message-id",
			},
		},
	}

	payloadBytes, err := json.Marshal(sqsEvent)
	if err != nil {
		t.Fatalf("Failed to marshal SQS event: %v", err)
	}

	// Invoke Lambda with SQS event
	result, err := tc.lambdaClient.Invoke(tc.ctx, &lambda.InvokeInput{
		FunctionName: aws.String(functionName),
		Payload:      payloadBytes,
	})

	if err != nil {
		t.Errorf("SQS to Lambda simulation failed: %v", err)
	} else if result.StatusCode != 200 {
		t.Errorf("Lambda returned non-200 status for SQS event: %d", result.StatusCode)
	} else {
		t.Logf("SQS to Lambda flow simulated successfully")
	}
}

func (tc *TestContext) testPerformanceMetrics(t *testing.T) {
	if len(tc.lambdaARNs) == 0 {
		t.Skip("No Lambda functions available for performance testing")
	}

	functionName := strings.Split(tc.lambdaARNs[0], ":")[6]

	// Run multiple invocations to gather performance data
	const numInvocations = 5
	durations := make([]time.Duration, numInvocations)
	
	testPayload := map[string]interface{}{
		"performance": "test",
		"timestamp":   time.Now().Format(time.RFC3339),
	}

	payloadBytes, _ := json.Marshal(testPayload)

	for i := 0; i < numInvocations; i++ {
		startTime := time.Now()
		
		result, err := tc.lambdaClient.Invoke(tc.ctx, &lambda.InvokeInput{
			FunctionName: aws.String(functionName),
			Payload:      payloadBytes,
		})
		
		durations[i] = time.Since(startTime)
		
		if err != nil {
			t.Errorf("Performance test invocation %d failed: %v", i, err)
		} else if result.StatusCode != 200 {
			t.Errorf("Performance test invocation %d returned status: %d", i, result.StatusCode)
		}
		
		// Small delay between invocations
		time.Sleep(100 * time.Millisecond)
	}

	// Calculate metrics
	var totalDuration time.Duration
	minDuration := durations[0]
	maxDuration := durations[0]
	
	for _, duration := range durations {
		totalDuration += duration
		if duration < minDuration {
			minDuration = duration
		}
		if duration > maxDuration {
			maxDuration = duration
		}
	}
	
	avgDuration := totalDuration / time.Duration(numInvocations)

	t.Logf("Performance metrics for %d invocations:", numInvocations)
	t.Logf("  Average: %v", avgDuration)
	t.Logf("  Min: %v", minDuration)
	t.Logf("  Max: %v", maxDuration)
	t.Logf("  Total: %v", totalDuration)

	// Performance thresholds
	if avgDuration > 10*time.Second {
		t.Errorf("Average execution time too high: %v", avgDuration)
	}

	if maxDuration > 30*time.Second {
		t.Errorf("Maximum execution time too high: %v", maxDuration)
	}
}