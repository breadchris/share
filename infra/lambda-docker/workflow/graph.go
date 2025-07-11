package workflow

import (
	"encoding/json"
	"fmt"
)

// NodeType represents the type of node in the workflow graph
type NodeType string

const (
	NodeTypeLambda   NodeType = "lambda"
	NodeTypeSQSQueue NodeType = "sqs-queue"
	NodeTypeSNSTopic NodeType = "sns-topic"
	NodeTypeS3Bucket NodeType = "s3-bucket"
)

// Node represents a node in the workflow graph
type Node struct {
	ID     string                 `json:"id"`
	Type   NodeType               `json:"type"`
	Config map[string]interface{} `json:"config"`
}

// LambdaNodeConfig represents configuration for a Lambda node
type LambdaNodeConfig struct {
	ARN            string            `json:"arn"`
	FunctionName   string            `json:"functionName,omitempty"`
	Qualifier      string            `json:"qualifier,omitempty"`
	InvocationType string            `json:"invocationType,omitempty"` // Event or RequestResponse
	Timeout        int               `json:"timeout,omitempty"`
	Environment    map[string]string `json:"environment,omitempty"`
}

// SQSNodeConfig represents configuration for an SQS queue node
type SQSNodeConfig struct {
	QueueURL          string `json:"queueUrl"`
	QueueName         string `json:"queueName,omitempty"`
	MessageGroupID    string `json:"messageGroupId,omitempty"`
	DelaySeconds      int    `json:"delaySeconds,omitempty"`
	VisibilityTimeout int    `json:"visibilityTimeout,omitempty"`
}

// S3NodeConfig represents configuration for an S3 bucket node
type S3NodeConfig struct {
	BucketName   string            `json:"bucketName"`
	KeyPrefix    string            `json:"keyPrefix,omitempty"`
	Key          string            `json:"key,omitempty"`
	StorageClass string            `json:"storageClass,omitempty"`
	Encryption   string            `json:"encryption,omitempty"`
	ContentType  string            `json:"contentType,omitempty"`
	Metadata     map[string]string `json:"metadata,omitempty"`
	Tags         map[string]string `json:"tags,omitempty"`
	Versioning   bool              `json:"versioning,omitempty"`
	Operation    string            `json:"operation,omitempty"` // put, get, delete, list
}

// Edge represents an edge in the workflow graph
type Edge struct {
	From      string                 `json:"from"`
	To        string                 `json:"to"`
	Condition string                 `json:"condition,omitempty"` // success, failure, always
	Transform string                 `json:"transform,omitempty"` // JSONPath or transformation expression
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// EdgeCondition represents conditions for edge traversal
type EdgeCondition string

const (
	ConditionSuccess EdgeCondition = "success"
	ConditionFailure EdgeCondition = "failure"
	ConditionAlways  EdgeCondition = "always"
)

// Workflow represents the complete workflow graph
type Workflow struct {
	Nodes      map[string]*Node `json:"nodes"`
	Edges      []*Edge          `json:"edges"`
	Entrypoint string           `json:"entrypoint"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// WorkflowRequest represents the Lambda input with workflow and user data
type WorkflowRequest struct {
	Workflow *Workflow              `json:"workflow"`
	Input    interface{}            `json:"input"`
	Context  map[string]interface{} `json:"context,omitempty"`
}

// WorkflowResponse represents the Lambda output
type WorkflowResponse struct {
	Success   bool                   `json:"success"`
	Output    interface{}            `json:"output,omitempty"`
	Errors    []string               `json:"errors,omitempty"`
	Execution map[string]interface{} `json:"execution,omitempty"`
}

// NodeExecution represents the execution result of a single node
type NodeExecution struct {
	NodeID    string      `json:"nodeId"`
	Status    string      `json:"status"`
	StartTime string      `json:"startTime"`
	EndTime   string      `json:"endTime"`
	Input     interface{} `json:"input,omitempty"`
	Output    interface{} `json:"output,omitempty"`
	Error     string      `json:"error,omitempty"`
}

// Validate validates the workflow graph
func (w *Workflow) Validate() error {
	if w == nil {
		return fmt.Errorf("workflow is nil")
	}

	if len(w.Nodes) == 0 {
		return fmt.Errorf("workflow has no nodes")
	}

	if w.Entrypoint == "" {
		return fmt.Errorf("workflow has no entrypoint")
	}

	// Check if entrypoint exists
	if _, exists := w.Nodes[w.Entrypoint]; !exists {
		return fmt.Errorf("entrypoint node '%s' does not exist", w.Entrypoint)
	}

	// Validate nodes
	for id, node := range w.Nodes {
		if node.ID != id {
			return fmt.Errorf("node ID mismatch: %s != %s", node.ID, id)
		}

		if err := node.Validate(); err != nil {
			return fmt.Errorf("node %s validation failed: %v", id, err)
		}
	}

	// Validate edges
	for i, edge := range w.Edges {
		if err := edge.Validate(w); err != nil {
			return fmt.Errorf("edge %d validation failed: %v", i, err)
		}
	}

	// Check for cycles
	if hasCycle := w.HasCycle(); hasCycle {
		return fmt.Errorf("workflow graph contains a cycle")
	}

	return nil
}

// Validate validates a single node
func (n *Node) Validate() error {
	if n.ID == "" {
		return fmt.Errorf("node has no ID")
	}

	switch n.Type {
	case NodeTypeLambda:
		var config LambdaNodeConfig
		if err := mapToStruct(n.Config, &config); err != nil {
			return fmt.Errorf("invalid lambda config: %v", err)
		}
		if config.ARN == "" && config.FunctionName == "" {
			return fmt.Errorf("lambda node must have ARN or FunctionName")
		}
	case NodeTypeSQSQueue:
		var config SQSNodeConfig
		if err := mapToStruct(n.Config, &config); err != nil {
			return fmt.Errorf("invalid sqs config: %v", err)
		}
		if config.QueueURL == "" && config.QueueName == "" {
			return fmt.Errorf("sqs node must have QueueURL or QueueName")
		}
	case NodeTypeSNSTopic:
		// TODO: Implement SNS validation
	case NodeTypeS3Bucket:
		var config S3NodeConfig
		if err := mapToStruct(n.Config, &config); err != nil {
			return fmt.Errorf("invalid s3 config: %v", err)
		}
		if config.BucketName == "" {
			return fmt.Errorf("s3 node must have BucketName")
		}
		// Validate operation if specified
		if config.Operation != "" {
			validOps := []string{"put", "get", "delete", "list"}
			valid := false
			for _, op := range validOps {
				if config.Operation == op {
					valid = true
					break
				}
			}
			if !valid {
				return fmt.Errorf("invalid s3 operation: %s", config.Operation)
			}
		}
	default:
		return fmt.Errorf("unknown node type: %s", n.Type)
	}

	return nil
}

// Validate validates an edge
func (e *Edge) Validate(w *Workflow) error {
	if e.From == "" || e.To == "" {
		return fmt.Errorf("edge must have from and to nodes")
	}

	if _, exists := w.Nodes[e.From]; !exists {
		return fmt.Errorf("edge from node '%s' does not exist", e.From)
	}

	if _, exists := w.Nodes[e.To]; !exists {
		return fmt.Errorf("edge to node '%s' does not exist", e.To)
	}

	// Validate condition
	if e.Condition != "" {
		switch EdgeCondition(e.Condition) {
		case ConditionSuccess, ConditionFailure, ConditionAlways:
			// Valid conditions
		default:
			return fmt.Errorf("invalid edge condition: %s", e.Condition)
		}
	}

	return nil
}

// HasCycle checks if the workflow graph contains a cycle
func (w *Workflow) HasCycle() bool {
	visited := make(map[string]bool)
	recStack := make(map[string]bool)

	for nodeID := range w.Nodes {
		if !visited[nodeID] {
			if w.hasCycleDFS(nodeID, visited, recStack) {
				return true
			}
		}
	}

	return false
}

// hasCycleDFS is a helper function for cycle detection using DFS
func (w *Workflow) hasCycleDFS(nodeID string, visited, recStack map[string]bool) bool {
	visited[nodeID] = true
	recStack[nodeID] = true

	// Get all edges from this node
	for _, edge := range w.Edges {
		if edge.From == nodeID {
			if !visited[edge.To] {
				if w.hasCycleDFS(edge.To, visited, recStack) {
					return true
				}
			} else if recStack[edge.To] {
				return true
			}
		}
	}

	recStack[nodeID] = false
	return false
}

// GetNodesByType returns all nodes of a specific type
func (w *Workflow) GetNodesByType(nodeType NodeType) []*Node {
	var nodes []*Node
	for _, node := range w.Nodes {
		if node.Type == nodeType {
			nodes = append(nodes, node)
		}
	}
	return nodes
}

// GetOutgoingEdges returns all edges from a specific node
func (w *Workflow) GetOutgoingEdges(nodeID string) []*Edge {
	var edges []*Edge
	for _, edge := range w.Edges {
		if edge.From == nodeID {
			edges = append(edges, edge)
		}
	}
	return edges
}

// GetIncomingEdges returns all edges to a specific node
func (w *Workflow) GetIncomingEdges(nodeID string) []*Edge {
	var edges []*Edge
	for _, edge := range w.Edges {
		if edge.To == nodeID {
			edges = append(edges, edge)
		}
	}
	return edges
}

// mapToStruct converts a map to a struct using JSON marshaling
func mapToStruct(m map[string]interface{}, v interface{}) error {
	data, err := json.Marshal(m)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}