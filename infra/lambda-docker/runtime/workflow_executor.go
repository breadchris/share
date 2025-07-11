package runtime

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"../workflow"
)

// RuntimeExecutor handles workflow execution within Lambda runtime
type RuntimeExecutor struct {
	awsClient *workflow.AWSClient
	context   map[string]interface{}
}

// NewRuntimeExecutor creates a new runtime executor
func NewRuntimeExecutor() (*RuntimeExecutor, error) {
	awsClient, err := workflow.NewAWSClient(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS client: %v", err)
	}

	return &RuntimeExecutor{
		awsClient: awsClient,
		context:   make(map[string]interface{}),
	}, nil
}

// ExecuteWorkflow executes a complete workflow
func (e *RuntimeExecutor) ExecuteWorkflow(ctx context.Context, workflowRequest *workflow.WorkflowRequest) (*workflow.WorkflowResponse, error) {
	// Add request context
	if workflowRequest.Context != nil {
		for k, v := range workflowRequest.Context {
			e.context[k] = v
		}
	}

	// Create executor and run workflow
	executor := workflow.NewExecutor(workflowRequest.Workflow, e.awsClient)
	return executor.Execute(ctx, workflowRequest.Input)
}

// ExecuteNode executes a single node in the workflow
func (e *RuntimeExecutor) ExecuteNode(ctx context.Context, nodeID string, input interface{}) (interface{}, error) {
	// Get workflow definition from environment
	workflowDef := os.Getenv("WORKFLOW_DEFINITION")
	if workflowDef == "" {
		return nil, fmt.Errorf("no workflow definition found")
	}

	var workflowConfig workflow.Workflow
	if err := json.Unmarshal([]byte(workflowDef), &workflowConfig); err != nil {
		return nil, fmt.Errorf("failed to parse workflow definition: %v", err)
	}

	// Find the node
	node, exists := workflowConfig.Nodes[nodeID]
	if !exists {
		return nil, fmt.Errorf("node %s not found", nodeID)
	}

	// Execute based on node type
	switch node.Type {
	case workflow.NodeTypeLambda:
		return e.executeLambdaNode(ctx, node, input)
	case workflow.NodeTypeSQSQueue:
		return e.executeSQSNode(ctx, node, input)
	case workflow.NodeTypeSNSTopic:
		return e.executeSNSNode(ctx, node, input)
	default:
		return nil, fmt.Errorf("unsupported node type: %s", node.Type)
	}
}

// executeLambdaNode executes a Lambda node
func (e *RuntimeExecutor) executeLambdaNode(ctx context.Context, node *workflow.Node, input interface{}) (interface{}, error) {
	var config workflow.LambdaNodeConfig
	if err := mapToStruct(node.Config, &config); err != nil {
		return nil, fmt.Errorf("invalid lambda config: %v", err)
	}

	// Resolve ARN if needed
	if err := e.awsClient.ResolveNodeConfig(ctx, node); err != nil {
		return nil, fmt.Errorf("failed to resolve node config: %v", err)
	}

	return e.awsClient.InvokeLambda(ctx, &config, input)
}

// executeSQSNode executes an SQS node
func (e *RuntimeExecutor) executeSQSNode(ctx context.Context, node *workflow.Node, input interface{}) (interface{}, error) {
	var config workflow.SQSNodeConfig
	if err := mapToStruct(node.Config, &config); err != nil {
		return nil, fmt.Errorf("invalid sqs config: %v", err)
	}

	// Resolve queue URL if needed
	if err := e.awsClient.ResolveNodeConfig(ctx, node); err != nil {
		return nil, fmt.Errorf("failed to resolve node config: %v", err)
	}

	return e.awsClient.SendToSQS(ctx, &config, input)
}

// executeSNSNode executes an SNS node
func (e *RuntimeExecutor) executeSNSNode(ctx context.Context, node *workflow.Node, input interface{}) (interface{}, error) {
	topicArn, ok := node.Config["topicArn"].(string)
	if !ok || topicArn == "" {
		return nil, fmt.Errorf("sns node must have topicArn")
	}

	return e.awsClient.PublishToSNS(ctx, topicArn, input)
}

// ContinueWorkflow continues workflow execution from a specific node
func (e *RuntimeExecutor) ContinueWorkflow(ctx context.Context, nodeID string, input interface{}, workflow *workflow.Workflow) (*workflow.WorkflowResponse, error) {
	// Create execution state
	state := &workflow.ExecutionState{
		NodeExecutions: make(map[string]*workflow.NodeExecution),
		CompletedNodes: make(map[string]bool),
		FailedNodes:    make(map[string]bool),
		StartTime:      time.Now(),
	}

	// Execute from the specified node
	executor := workflow.NewExecutor(workflow, e.awsClient)
	output, err := executor.Execute(ctx, input)
	
	state.EndTime = time.Now()

	// Build response
	response := &workflow.WorkflowResponse{
		Success: err == nil,
		Output:  output,
		Execution: map[string]interface{}{
			"startTime":      state.StartTime.Format(time.RFC3339),
			"endTime":        state.EndTime.Format(time.RFC3339),
			"duration":       state.EndTime.Sub(state.StartTime).String(),
			"nodeExecutions": state.NodeExecutions,
			"continuedFrom":  nodeID,
		},
	}

	if err != nil {
		response.Errors = []string{err.Error()}
	}

	return response, nil
}

// GetWorkflowStatus returns the current status of a workflow execution
func (e *RuntimeExecutor) GetWorkflowStatus(executionID string) (*workflow.WorkflowResponse, error) {
	// This would typically query a database or state store
	// For now, return a placeholder response
	return &workflow.WorkflowResponse{
		Success: true,
		Execution: map[string]interface{}{
			"executionId": executionID,
			"status":      "running",
		},
	}, nil
}

// Helper function to convert map to struct
func mapToStruct(m map[string]interface{}, v interface{}) error {
	data, err := json.Marshal(m)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}