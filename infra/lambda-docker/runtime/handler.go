package runtime

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"../workflow"
)

// WorkflowHandler handles Lambda requests with workflow support
type WorkflowHandler struct {
	workflowName string
	nodeID       string
	awsClient    *workflow.AWSClient
}

// NewWorkflowHandler creates a new workflow handler
func NewWorkflowHandler() (*WorkflowHandler, error) {
	// Get workflow configuration from environment
	workflowName := os.Getenv("WORKFLOW_NAME")
	nodeID := os.Getenv("NODE_ID")

	// Create AWS client
	awsClient, err := workflow.NewAWSClient(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS client: %v", err)
	}

	return &WorkflowHandler{
		workflowName: workflowName,
		nodeID:       nodeID,
		awsClient:    awsClient,
	}, nil
}

// HandleRequest handles incoming Lambda requests
func (h *WorkflowHandler) HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Parse the request body
	var workflowRequest workflow.WorkflowRequest
	if err := json.Unmarshal([]byte(request.Body), &workflowRequest); err != nil {
		return h.errorResponse(400, fmt.Sprintf("Invalid request body: %v", err))
	}

	// Validate that we have both workflow and input
	if workflowRequest.Workflow == nil {
		return h.errorResponse(400, "Missing workflow configuration")
	}

	// Execute the workflow
	executor := workflow.NewExecutor(workflowRequest.Workflow, h.awsClient)
	response, err := executor.Execute(ctx, workflowRequest.Input)
	if err != nil {
		return h.errorResponse(500, fmt.Sprintf("Workflow execution failed: %v", err))
	}

	// Return success response
	return h.successResponse(response)
}

// HandleSQSEvent handles SQS event source mappings
func (h *WorkflowHandler) HandleSQSEvent(ctx context.Context, event events.SQSEvent) error {
	for _, record := range event.Records {
		// Parse the SQS message body as workflow request
		var workflowRequest workflow.WorkflowRequest
		if err := json.Unmarshal([]byte(record.Body), &workflowRequest); err != nil {
			fmt.Printf("Failed to parse SQS message: %v\n", err)
			continue
		}

		// Execute the workflow
		executor := workflow.NewExecutor(workflowRequest.Workflow, h.awsClient)
		response, err := executor.Execute(ctx, workflowRequest.Input)
		if err != nil {
			fmt.Printf("Workflow execution failed: %v\n", err)
			continue
		}

		// Log the response (in production, you might want to send to another service)
		fmt.Printf("Workflow execution completed: %+v\n", response)
	}

	return nil
}

// HandleDirectInvocation handles direct Lambda invocations
func (h *WorkflowHandler) HandleDirectInvocation(ctx context.Context, payload interface{}) (interface{}, error) {
	// Parse the payload
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %v", err)
	}

	var workflowRequest workflow.WorkflowRequest
	if err := json.Unmarshal(payloadBytes, &workflowRequest); err != nil {
		return nil, fmt.Errorf("invalid payload: %v", err)
	}

	// Execute the workflow
	executor := workflow.NewExecutor(workflowRequest.Workflow, h.awsClient)
	return executor.Execute(ctx, workflowRequest.Input)
}

// HandleNodeExecution handles execution of a single node (for node-specific Lambda functions)
func (h *WorkflowHandler) HandleNodeExecution(ctx context.Context, input interface{}) (interface{}, error) {
	// If this Lambda is part of a workflow, get the workflow definition
	workflowDef := os.Getenv("WORKFLOW_DEFINITION")
	if workflowDef == "" {
		return nil, fmt.Errorf("no workflow definition found")
	}

	var workflowConfig workflow.Workflow
	if err := json.Unmarshal([]byte(workflowDef), &workflowConfig); err != nil {
		return nil, fmt.Errorf("failed to parse workflow definition: %v", err)
	}

	// Find the current node
	node, exists := workflowConfig.Nodes[h.nodeID]
	if !exists {
		return nil, fmt.Errorf("node %s not found in workflow", h.nodeID)
	}

	// Execute just this node
	executor := workflow.NewExecutor(&workflowConfig, h.awsClient)
	return executor.Execute(ctx, input)
}

// errorResponse creates an error response
func (h *WorkflowHandler) errorResponse(statusCode int, message string) (events.APIGatewayProxyResponse, error) {
	body := map[string]string{
		"error": message,
	}
	bodyJSON, _ := json.Marshal(body)

	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Body:       string(bodyJSON),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

// successResponse creates a success response
func (h *WorkflowHandler) successResponse(data interface{}) (events.APIGatewayProxyResponse, error) {
	bodyJSON, err := json.Marshal(data)
	if err != nil {
		return h.errorResponse(500, fmt.Sprintf("Failed to marshal response: %v", err))
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(bodyJSON),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

// StartWorkflowHandler starts the Lambda handler with workflow support
func StartWorkflowHandler() {
	handler, err := NewWorkflowHandler()
	if err != nil {
		panic(fmt.Sprintf("Failed to create workflow handler: %v", err))
	}

	// Determine handler type based on environment
	eventType := os.Getenv("EVENT_TYPE")
	switch eventType {
	case "sqs":
		lambda.Start(handler.HandleSQSEvent)
	case "direct":
		lambda.Start(handler.HandleDirectInvocation)
	case "node":
		lambda.Start(handler.HandleNodeExecution)
	default:
		// Default to API Gateway
		lambda.Start(handler.HandleRequest)
	}
}