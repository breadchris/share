package workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// Executor handles workflow execution
type Executor struct {
	awsClient *AWSClient
	workflow  *Workflow
	context   map[string]interface{}
	mu        sync.Mutex
}

// ExecutionState tracks the state of workflow execution
type ExecutionState struct {
	NodeExecutions map[string]*NodeExecution
	CurrentNodes   []string
	CompletedNodes map[string]bool
	FailedNodes    map[string]bool
	StartTime      time.Time
	EndTime        time.Time
	mu             sync.RWMutex
}

// NewExecutor creates a new workflow executor
func NewExecutor(workflow *Workflow, awsClient *AWSClient) *Executor {
	return &Executor{
		awsClient: awsClient,
		workflow:  workflow,
		context:   make(map[string]interface{}),
	}
}

// Execute runs the workflow with the given input
func (e *Executor) Execute(ctx context.Context, input interface{}) (*WorkflowResponse, error) {
	// Validate workflow
	if err := e.workflow.Validate(); err != nil {
		return &WorkflowResponse{
			Success: false,
			Errors:  []string{fmt.Sprintf("workflow validation failed: %v", err)},
		}, nil
	}

	// Initialize execution state
	state := &ExecutionState{
		NodeExecutions: make(map[string]*NodeExecution),
		CompletedNodes: make(map[string]bool),
		FailedNodes:    make(map[string]bool),
		StartTime:      time.Now(),
	}

	// Resolve node configurations
	for _, node := range e.workflow.Nodes {
		if err := e.awsClient.ResolveNodeConfig(ctx, node); err != nil {
			return &WorkflowResponse{
				Success: false,
				Errors:  []string{fmt.Sprintf("failed to resolve node %s config: %v", node.ID, err)},
			}, nil
		}
	}

	// Start execution from entrypoint
	output, err := e.executeNode(ctx, e.workflow.Entrypoint, input, state)
	state.EndTime = time.Now()

	// Build response
	response := &WorkflowResponse{
		Success: err == nil,
		Output:  output,
		Execution: map[string]interface{}{
			"startTime":      state.StartTime.Format(time.RFC3339),
			"endTime":        state.EndTime.Format(time.RFC3339),
			"duration":       state.EndTime.Sub(state.StartTime).String(),
			"nodeExecutions": state.NodeExecutions,
		},
	}

	if err != nil {
		response.Errors = []string{err.Error()}
	}

	return response, nil
}

// executeNode executes a single node in the workflow
func (e *Executor) executeNode(ctx context.Context, nodeID string, input interface{}, state *ExecutionState) (interface{}, error) {
	// Check if node already executed
	state.mu.RLock()
	if state.CompletedNodes[nodeID] {
		exec := state.NodeExecutions[nodeID]
		state.mu.RUnlock()
		return exec.Output, nil
	}
	state.mu.RUnlock()

	// Get node
	node, exists := e.workflow.Nodes[nodeID]
	if !exists {
		return nil, fmt.Errorf("node %s not found", nodeID)
	}

	// Create node execution record
	execution := &NodeExecution{
		NodeID:    nodeID,
		Status:    "running",
		StartTime: time.Now().Format(time.RFC3339),
		Input:     input,
	}

	state.mu.Lock()
	state.NodeExecutions[nodeID] = execution
	state.mu.Unlock()

	// Execute node based on type
	var output interface{}
	var err error

	switch node.Type {
	case NodeTypeLambda:
		output, err = e.executeLambdaNode(ctx, node, input)
	case NodeTypeSQSQueue:
		output, err = e.executeSQSNode(ctx, node, input)
	case NodeTypeSNSTopic:
		output, err = e.executeSNSNode(ctx, node, input)
	case NodeTypeS3Bucket:
		output, err = e.executeS3Node(ctx, node, input)
	default:
		err = fmt.Errorf("unsupported node type: %s", node.Type)
	}

	// Update execution record
	execution.EndTime = time.Now().Format(time.RFC3339)
	if err != nil {
		execution.Status = "failed"
		execution.Error = err.Error()
		state.mu.Lock()
		state.FailedNodes[nodeID] = true
		state.mu.Unlock()
		return nil, err
	}

	execution.Status = "completed"
	execution.Output = output

	state.mu.Lock()
	state.CompletedNodes[nodeID] = true
	state.mu.Unlock()

	// Execute downstream nodes
	outgoingEdges := e.workflow.GetOutgoingEdges(nodeID)
	for _, edge := range outgoingEdges {
		// Check edge condition
		if !e.shouldTraverseEdge(edge, err) {
			continue
		}

		// Apply transformation if specified
		edgeInput := output
		if edge.Transform != "" {
			edgeInput = e.applyTransformation(output, edge.Transform)
		}

		// Execute next node
		_, nextErr := e.executeNode(ctx, edge.To, edgeInput, state)
		if nextErr != nil {
			// Log error but continue with other edges
			fmt.Printf("Error executing node %s: %v\n", edge.To, nextErr)
		}
	}

	return output, nil
}

// executeLambdaNode executes a Lambda node
func (e *Executor) executeLambdaNode(ctx context.Context, node *Node, input interface{}) (interface{}, error) {
	var config LambdaNodeConfig
	if err := mapToStruct(node.Config, &config); err != nil {
		return nil, fmt.Errorf("invalid lambda config: %v", err)
	}

	return e.awsClient.InvokeLambda(ctx, &config, input)
}

// executeSQSNode executes an SQS node
func (e *Executor) executeSQSNode(ctx context.Context, node *Node, input interface{}) (interface{}, error) {
	var config SQSNodeConfig
	if err := mapToStruct(node.Config, &config); err != nil {
		return nil, fmt.Errorf("invalid sqs config: %v", err)
	}

	return e.awsClient.SendToSQS(ctx, &config, input)
}

// executeSNSNode executes an SNS node
func (e *Executor) executeSNSNode(ctx context.Context, node *Node, input interface{}) (interface{}, error) {
	// Extract topic ARN from config
	topicArn, ok := node.Config["topicArn"].(string)
	if !ok || topicArn == "" {
		return nil, fmt.Errorf("sns node must have topicArn")
	}

	return e.awsClient.PublishToSNS(ctx, topicArn, input)
}

// shouldTraverseEdge determines if an edge should be traversed based on conditions
func (e *Executor) shouldTraverseEdge(edge *Edge, nodeError error) bool {
	switch EdgeCondition(edge.Condition) {
	case ConditionSuccess:
		return nodeError == nil
	case ConditionFailure:
		return nodeError != nil
	case ConditionAlways, "":
		return true
	default:
		return false
	}
}

// applyTransformation applies a transformation to the data
func (e *Executor) applyTransformation(data interface{}, transform string) interface{} {
	// For now, we'll implement simple JSONPath-like transformations
	// In a production system, you'd want a more robust transformation engine
	
	// If transform starts with $, treat as JSONPath
	if len(transform) > 0 && transform[0] == '$' {
		// Simple field extraction
		if transform == "$.data" {
			if m, ok := data.(map[string]interface{}); ok {
				if val, exists := m["data"]; exists {
					return val
				}
			}
		}
		// Add more JSONPath support as needed
	}

	// If transform is "stringify", convert to JSON string
	if transform == "stringify" {
		jsonBytes, err := json.Marshal(data)
		if err == nil {
			return string(jsonBytes)
		}
	}

	// Default: return data as-is
	return data
}

// ExecuteParallel executes multiple nodes in parallel
func (e *Executor) ExecuteParallel(ctx context.Context, nodeIDs []string, input interface{}, state *ExecutionState) (map[string]interface{}, error) {
	results := make(map[string]interface{})
	errors := make(map[string]error)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for _, nodeID := range nodeIDs {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()
			
			output, err := e.executeNode(ctx, id, input, state)
			
			mu.Lock()
			if err != nil {
				errors[id] = err
			} else {
				results[id] = output
			}
			mu.Unlock()
		}(nodeID)
	}

	wg.Wait()

	// If any errors occurred, return them
	if len(errors) > 0 {
		errMsg := "parallel execution errors: "
		for nodeID, err := range errors {
			errMsg += fmt.Sprintf("%s: %v; ", nodeID, err)
		}
		return results, fmt.Errorf(errMsg)
	}

	return results, nil
}

// executeS3Node executes an S3 node
func (e *Executor) executeS3Node(ctx context.Context, node *Node, input interface{}) (interface{}, error) {
	var config S3NodeConfig
	if err := mapToStruct(node.Config, &config); err != nil {
		return nil, fmt.Errorf("invalid s3 config: %v", err)
	}

	return e.awsClient.ProcessS3Operation(ctx, &config, input)
}