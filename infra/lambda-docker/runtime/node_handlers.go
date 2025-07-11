package runtime

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"../workflow"
)

// NodeHandler handles execution of specific node types
type NodeHandler struct {
	nodeType  workflow.NodeType
	awsClient *workflow.AWSClient
}

// NewNodeHandler creates a new node handler
func NewNodeHandler(nodeType workflow.NodeType) (*NodeHandler, error) {
	awsClient, err := workflow.NewAWSClient(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS client: %v", err)
	}

	return &NodeHandler{
		nodeType:  nodeType,
		awsClient: awsClient,
	}, nil
}

// HandleExecution handles node execution with proper error handling and logging
func (h *NodeHandler) HandleExecution(ctx context.Context, node *workflow.Node, input interface{}) (*workflow.NodeExecution, error) {
	execution := &workflow.NodeExecution{
		NodeID:    node.ID,
		Status:    "running",
		StartTime: time.Now().Format(time.RFC3339),
		Input:     input,
	}

	// Execute based on node type
	var output interface{}
	var err error

	switch h.nodeType {
	case workflow.NodeTypeLambda:
		output, err = h.handleLambdaExecution(ctx, node, input)
	case workflow.NodeTypeSQSQueue:
		output, err = h.handleSQSExecution(ctx, node, input)
	case workflow.NodeTypeSNSTopic:
		output, err = h.handleSNSExecution(ctx, node, input)
	default:
		err = fmt.Errorf("unsupported node type: %s", h.nodeType)
	}

	// Update execution record
	execution.EndTime = time.Now().Format(time.RFC3339)
	if err != nil {
		execution.Status = "failed"
		execution.Error = err.Error()
	} else {
		execution.Status = "completed"
		execution.Output = output
	}

	return execution, err
}

// handleLambdaExecution handles Lambda function invocation
func (h *NodeHandler) handleLambdaExecution(ctx context.Context, node *workflow.Node, input interface{}) (interface{}, error) {
	var config workflow.LambdaNodeConfig
	if err := mapToStruct(node.Config, &config); err != nil {
		return nil, fmt.Errorf("invalid lambda config: %v", err)
	}

	// Resolve configuration
	if err := h.awsClient.ResolveNodeConfig(ctx, node); err != nil {
		return nil, fmt.Errorf("failed to resolve lambda config: %v", err)
	}

	// Set default invocation type if not specified
	if config.InvocationType == "" {
		config.InvocationType = "RequestResponse"
	}

	// Invoke the Lambda function
	return h.awsClient.InvokeLambda(ctx, &config, input)
}

// handleSQSExecution handles SQS message sending
func (h *NodeHandler) handleSQSExecution(ctx context.Context, node *workflow.Node, input interface{}) (interface{}, error) {
	var config workflow.SQSNodeConfig
	if err := mapToStruct(node.Config, &config); err != nil {
		return nil, fmt.Errorf("invalid sqs config: %v", err)
	}

	// Resolve configuration
	if err := h.awsClient.ResolveNodeConfig(ctx, node); err != nil {
		return nil, fmt.Errorf("failed to resolve sqs config: %v", err)
	}

	// Send message to SQS
	return h.awsClient.SendToSQS(ctx, &config, input)
}

// handleSNSExecution handles SNS message publishing
func (h *NodeHandler) handleSNSExecution(ctx context.Context, node *workflow.Node, input interface{}) (interface{}, error) {
	topicArn, ok := node.Config["topicArn"].(string)
	if !ok || topicArn == "" {
		return nil, fmt.Errorf("sns node must have topicArn")
	}

	// Publish to SNS
	return h.awsClient.PublishToSNS(ctx, topicArn, input)
}

// ValidateNodeConfig validates node configuration for the handler's node type
func (h *NodeHandler) ValidateNodeConfig(node *workflow.Node) error {
	if node.Type != h.nodeType {
		return fmt.Errorf("node type mismatch: expected %s, got %s", h.nodeType, node.Type)
	}

	switch h.nodeType {
	case workflow.NodeTypeLambda:
		var config workflow.LambdaNodeConfig
		if err := mapToStruct(node.Config, &config); err != nil {
			return fmt.Errorf("invalid lambda config: %v", err)
		}
		if config.ARN == "" && config.FunctionName == "" {
			return fmt.Errorf("lambda node must have ARN or FunctionName")
		}

	case workflow.NodeTypeSQSQueue:
		var config workflow.SQSNodeConfig
		if err := mapToStruct(node.Config, &config); err != nil {
			return fmt.Errorf("invalid sqs config: %v", err)
		}
		if config.QueueURL == "" && config.QueueName == "" {
			return fmt.Errorf("sqs node must have QueueURL or QueueName")
		}

	case workflow.NodeTypeSNSTopic:
		topicArn, ok := node.Config["topicArn"].(string)
		if !ok || topicArn == "" {
			return fmt.Errorf("sns node must have topicArn")
		}
	}

	return nil
}

// PrepareNodeForExecution prepares a node for execution by resolving configurations
func (h *NodeHandler) PrepareNodeForExecution(ctx context.Context, node *workflow.Node) error {
	// Validate configuration
	if err := h.ValidateNodeConfig(node); err != nil {
		return err
	}

	// Resolve configuration
	return h.awsClient.ResolveNodeConfig(ctx, node)
}

// GetNodeMetrics returns metrics for node execution
func (h *NodeHandler) GetNodeMetrics(execution *workflow.NodeExecution) map[string]interface{} {
	metrics := map[string]interface{}{
		"nodeId":   execution.NodeID,
		"status":   execution.Status,
		"nodeType": h.nodeType,
	}

	// Calculate duration if both times are available
	if execution.StartTime != "" && execution.EndTime != "" {
		startTime, err1 := time.Parse(time.RFC3339, execution.StartTime)
		endTime, err2 := time.Parse(time.RFC3339, execution.EndTime)
		if err1 == nil && err2 == nil {
			duration := endTime.Sub(startTime)
			metrics["duration"] = duration.String()
			metrics["durationMs"] = duration.Milliseconds()
		}
	}

	// Add error information if available
	if execution.Error != "" {
		metrics["error"] = execution.Error
	}

	// Add output size if available
	if execution.Output != nil {
		if outputBytes, err := json.Marshal(execution.Output); err == nil {
			metrics["outputSize"] = len(outputBytes)
		}
	}

	return metrics
}