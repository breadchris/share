package workflow

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

var (
	testDataDir = flag.String("test-data-dir", "", "Directory containing test data files")
)

type WorkflowConfig struct {
	Name        string                `json:"name"`
	Description string                `json:"description,omitempty"`
	Nodes       []WorkflowNodeConfig  `json:"nodes"`
	Edges       []WorkflowEdgeConfig  `json:"edges"`
	Entrypoint  string                `json:"entrypoint"`
}

type WorkflowNodeConfig struct {
	ID     string                 `json:"id"`
	Type   string                 `json:"type"`
	Config map[string]interface{} `json:"config"`
}

type WorkflowEdgeConfig struct {
	From string `json:"from"`
	To   string `json:"to"`
}

func TestWorkflowDefinitions(t *testing.T) {
	if *testDataDir == "" {
		t.Fatal("test-data-dir flag is required")
	}

	// Load all workflow definition files
	workflowFiles, err := filepath.Glob(filepath.Join(*testDataDir, "*workflow*.json"))
	if err != nil {
		t.Fatalf("Failed to find workflow files: %v", err)
	}

	if len(workflowFiles) == 0 {
		t.Fatal("No workflow definition files found")
	}

	for _, file := range workflowFiles {
		t.Run(filepath.Base(file), func(t *testing.T) {
			testWorkflowFile(t, file)
		})
	}
}

func testWorkflowFile(t *testing.T, filePath string) {
	t.Logf("Testing workflow definition: %s", filePath)

	// Read and parse workflow file
	data, err := os.ReadFile(filePath)
	if err != nil {
		t.Fatalf("Failed to read workflow file: %v", err)
	}

	var workflow WorkflowConfig
	if err := json.Unmarshal(data, &workflow); err != nil {
		t.Fatalf("Failed to parse workflow JSON: %v", err)
	}

	// Run validation tests
	t.Run("BasicValidation", func(t *testing.T) {
		validateBasicWorkflow(t, &workflow)
	})

	t.Run("NodeValidation", func(t *testing.T) {
		validateNodes(t, &workflow)
	})

	t.Run("EdgeValidation", func(t *testing.T) {
		validateEdges(t, &workflow)
	})

	t.Run("GraphValidation", func(t *testing.T) {
		validateWorkflowGraph(t, &workflow)
	})

	t.Run("ConfigValidation", func(t *testing.T) {
		validateNodeConfigurations(t, &workflow)
	})
}

func validateBasicWorkflow(t *testing.T, workflow *WorkflowConfig) {
	// Check required fields
	if workflow.Name == "" {
		t.Error("Workflow must have a name")
	}

	if len(workflow.Nodes) == 0 {
		t.Error("Workflow must have at least one node")
	}

	if workflow.Entrypoint == "" {
		t.Error("Workflow must have an entrypoint")
	}

	// Check entrypoint exists
	entrypointExists := false
	for _, node := range workflow.Nodes {
		if node.ID == workflow.Entrypoint {
			entrypointExists = true
			break
		}
	}
	if !entrypointExists {
		t.Errorf("Entrypoint node '%s' not found in workflow nodes", workflow.Entrypoint)
	}
}

func validateNodes(t *testing.T, workflow *WorkflowConfig) {
	nodeIDs := make(map[string]bool)
	supportedTypes := map[string]bool{
		"lambda":     true,
		"sqs-queue":  true,
		"sns-topic":  true,
		"s3-bucket":  true,
	}

	for i, node := range workflow.Nodes {
		// Check node ID uniqueness
		if node.ID == "" {
			t.Errorf("Node %d must have an ID", i)
			continue
		}

		if nodeIDs[node.ID] {
			t.Errorf("Duplicate node ID: %s", node.ID)
		}
		nodeIDs[node.ID] = true

		// Check node type
		if node.Type == "" {
			t.Errorf("Node %s must have a type", node.ID)
		} else if !supportedTypes[node.Type] {
			t.Errorf("Node %s has unsupported type: %s", node.ID, node.Type)
		}

		// Check node configuration exists
		if node.Config == nil {
			t.Errorf("Node %s must have configuration", node.ID)
		}
	}
}

func validateEdges(t *testing.T, workflow *WorkflowConfig) {
	nodeIDs := make(map[string]bool)
	for _, node := range workflow.Nodes {
		nodeIDs[node.ID] = true
	}

	for i, edge := range workflow.Edges {
		// Check edge has both from and to
		if edge.From == "" {
			t.Errorf("Edge %d must have 'from' field", i)
		}
		if edge.To == "" {
			t.Errorf("Edge %d must have 'to' field", i)
		}

		// Check nodes exist
		if !nodeIDs[edge.From] {
			t.Errorf("Edge %d references non-existent 'from' node: %s", i, edge.From)
		}
		if !nodeIDs[edge.To] {
			t.Errorf("Edge %d references non-existent 'to' node: %s", i, edge.To)
		}

		// Check for self-referencing edges
		if edge.From == edge.To {
			t.Errorf("Edge %d is self-referencing: %s -> %s", i, edge.From, edge.To)
		}
	}
}

func validateWorkflowGraph(t *testing.T, workflow *WorkflowConfig) {
	// Build adjacency list
	graph := make(map[string][]string)
	inDegree := make(map[string]int)
	
	// Initialize all nodes
	for _, node := range workflow.Nodes {
		graph[node.ID] = []string{}
		inDegree[node.ID] = 0
	}

	// Add edges
	for _, edge := range workflow.Edges {
		graph[edge.From] = append(graph[edge.From], edge.To)
		inDegree[edge.To]++
	}

	// Check for cycles using DFS
	t.Run("CycleDetection", func(t *testing.T) {
		visited := make(map[string]bool)
		recStack := make(map[string]bool)

		var hasCycle func(string) bool
		hasCycle = func(nodeID string) bool {
			visited[nodeID] = true
			recStack[nodeID] = true

			for _, neighbor := range graph[nodeID] {
				if !visited[neighbor] {
					if hasCycle(neighbor) {
						return true
					}
				} else if recStack[neighbor] {
					return true
				}
			}

			recStack[nodeID] = false
			return false
		}

		for _, node := range workflow.Nodes {
			if !visited[node.ID] {
				if hasCycle(node.ID) {
					t.Error("Workflow contains cycles")
					break
				}
			}
		}
	})

	// Check reachability from entrypoint
	t.Run("ReachabilityCheck", func(t *testing.T) {
		reachable := make(map[string]bool)
		var dfs func(string)
		dfs = func(nodeID string) {
			reachable[nodeID] = true
			for _, neighbor := range graph[nodeID] {
				if !reachable[neighbor] {
					dfs(neighbor)
				}
			}
		}

		dfs(workflow.Entrypoint)

		unreachableNodes := []string{}
		for _, node := range workflow.Nodes {
			if !reachable[node.ID] {
				unreachableNodes = append(unreachableNodes, node.ID)
			}
		}

		if len(unreachableNodes) > 0 {
			t.Errorf("Unreachable nodes from entrypoint: %v", unreachableNodes)
		}
	})

	// Check for orphaned nodes (no incoming edges except entrypoint)
	t.Run("OrphanedNodesCheck", func(t *testing.T) {
		orphanedNodes := []string{}
		for nodeID, degree := range inDegree {
			if degree == 0 && nodeID != workflow.Entrypoint {
				orphanedNodes = append(orphanedNodes, nodeID)
			}
		}

		if len(orphanedNodes) > 0 {
			t.Logf("Warning: Orphaned nodes (no incoming edges): %v", orphanedNodes)
		}
	})
}

func validateNodeConfigurations(t *testing.T, workflow *WorkflowConfig) {
	for _, node := range workflow.Nodes {
		t.Run(fmt.Sprintf("Node_%s", node.ID), func(t *testing.T) {
			switch node.Type {
			case "lambda":
				validateLambdaConfig(t, node)
			case "sqs-queue":
				validateSQSConfig(t, node)
			case "sns-topic":
				validateSNSConfig(t, node)
			case "s3-bucket":
				validateS3Config(t, node)
			}
		})
	}
}

func validateLambdaConfig(t *testing.T, node WorkflowNodeConfig) {
	config := node.Config["lambda"]
	if config == nil {
		t.Error("Lambda node must have 'lambda' configuration")
		return
	}

	lambdaConfig, ok := config.(map[string]interface{})
	if !ok {
		t.Error("Lambda configuration must be an object")
		return
	}

	// Check required fields
	if lambdaConfig["functionName"] == nil {
		t.Error("Lambda configuration must have 'functionName'")
	}

	// Check optional fields have valid values
	if runtime, exists := lambdaConfig["runtime"]; exists {
		if runtimeStr, ok := runtime.(string); ok {
			validRuntimes := map[string]bool{
				"nodejs18.x": true,
				"python3.9":  true,
				"python3.10": true,
				"go1.x":      true,
			}
			if !validRuntimes[runtimeStr] {
				t.Errorf("Invalid runtime: %s", runtimeStr)
			}
		}
	}

	if timeout, exists := lambdaConfig["timeout"]; exists {
		if timeoutFloat, ok := timeout.(float64); ok {
			if timeoutFloat < 1 || timeoutFloat > 900 {
				t.Errorf("Invalid timeout: %f (must be 1-900 seconds)", timeoutFloat)
			}
		}
	}
}

func validateSQSConfig(t *testing.T, node WorkflowNodeConfig) {
	config := node.Config["sqs"]
	if config == nil {
		t.Error("SQS node must have 'sqs' configuration")
		return
	}

	sqsConfig, ok := config.(map[string]interface{})
	if !ok {
		t.Error("SQS configuration must be an object")
		return
	}

	// Check required fields
	if sqsConfig["queueName"] == nil {
		t.Error("SQS configuration must have 'queueName'")
	}

	// Validate numeric fields
	if visibilityTimeout, exists := sqsConfig["visibilityTimeoutSeconds"]; exists {
		if timeout, ok := visibilityTimeout.(float64); ok {
			if timeout < 0 || timeout > 43200 {
				t.Errorf("Invalid visibility timeout: %f (must be 0-43200 seconds)", timeout)
			}
		}
	}

	if retention, exists := sqsConfig["messageRetentionSeconds"]; exists {
		if retentionTime, ok := retention.(float64); ok {
			if retentionTime < 60 || retentionTime > 1209600 {
				t.Errorf("Invalid message retention: %f (must be 60-1209600 seconds)", retentionTime)
			}
		}
	}
}

func validateSNSConfig(t *testing.T, node WorkflowNodeConfig) {
	config := node.Config["sns"]
	if config == nil {
		t.Error("SNS node must have 'sns' configuration")
		return
	}

	snsConfig, ok := config.(map[string]interface{})
	if !ok {
		t.Error("SNS configuration must be an object")
		return
	}

	// Check required fields
	if snsConfig["topicName"] == nil {
		t.Error("SNS configuration must have 'topicName'")
	}
}

func validateS3Config(t *testing.T, node WorkflowNodeConfig) {
	config := node.Config["s3"]
	if config == nil {
		t.Error("S3 node must have 's3' configuration")
		return
	}

	s3Config, ok := config.(map[string]interface{})
	if !ok {
		t.Error("S3 configuration must be an object")
		return
	}

	// Check required fields
	if s3Config["bucketName"] == nil {
		t.Error("S3 configuration must have 'bucketName'")
	}

	// Validate storage class if specified
	if storageClass, exists := s3Config["storageClass"]; exists {
		if storageClassStr, ok := storageClass.(string); ok {
			validClasses := map[string]bool{
				"STANDARD":            true,
				"STANDARD_IA":         true,
				"ONEZONE_IA":          true,
				"REDUCED_REDUNDANCY":  true,
				"GLACIER":             true,
				"DEEP_ARCHIVE":        true,
			}
			if !validClasses[storageClassStr] {
				t.Errorf("Invalid storage class: %s", storageClassStr)
			}
		}
	}

	// Validate operation if specified
	if operation, exists := s3Config["operation"]; exists {
		if operationStr, ok := operation.(string); ok {
			validOperations := map[string]bool{
				"put":    true,
				"get":    true,
				"delete": true,
				"list":   true,
			}
			if !validOperations[operationStr] {
				t.Errorf("Invalid S3 operation: %s", operationStr)
			}
		}
	}
}

func TestWorkflowCompatibility(t *testing.T) {
	if *testDataDir == "" {
		t.Skip("test-data-dir flag is required")
	}

	// Test that workflow definitions are compatible with the execution engine
	workflowFiles, err := filepath.Glob(filepath.Join(*testDataDir, "*workflow*.json"))
	if err != nil {
		t.Fatalf("Failed to find workflow files: %v", err)
	}

	for _, file := range workflowFiles {
		t.Run(filepath.Base(file), func(t *testing.T) {
			testWorkflowCompatibility(t, file)
		})
	}
}

func testWorkflowCompatibility(t *testing.T, filePath string) {
	// Read workflow
	data, err := os.ReadFile(filePath)
	if err != nil {
		t.Fatalf("Failed to read workflow file: %v", err)
	}

	var workflow WorkflowConfig
	if err := json.Unmarshal(data, &workflow); err != nil {
		t.Fatalf("Failed to parse workflow JSON: %v", err)
	}

	// Test JSON roundtrip
	t.Run("JSONRoundtrip", func(t *testing.T) {
		marshaled, err := json.Marshal(&workflow)
		if err != nil {
			t.Fatalf("Failed to marshal workflow: %v", err)
		}

		var remarshaled WorkflowConfig
		if err := json.Unmarshal(marshaled, &remarshaled); err != nil {
			t.Fatalf("Failed to unmarshal workflow: %v", err)
		}

		// Basic comparison
		if remarshaled.Name != workflow.Name {
			t.Errorf("Name mismatch after roundtrip: %s != %s", remarshaled.Name, workflow.Name)
		}

		if len(remarshaled.Nodes) != len(workflow.Nodes) {
			t.Errorf("Node count mismatch after roundtrip: %d != %d", len(remarshaled.Nodes), len(workflow.Nodes))
		}

		if len(remarshaled.Edges) != len(workflow.Edges) {
			t.Errorf("Edge count mismatch after roundtrip: %d != %d", len(remarshaled.Edges), len(workflow.Edges))
		}
	})

	// Test that configurations can be used to create AWS resources
	t.Run("AWSResourceCompatibility", func(t *testing.T) {
		for _, node := range workflow.Nodes {
			validateAWSResourceNames(t, node)
		}
	})
}

func validateAWSResourceNames(t *testing.T, node WorkflowNodeConfig) {
	switch node.Type {
	case "lambda":
		config := node.Config["lambda"]
		if config != nil {
			if lambdaConfig, ok := config.(map[string]interface{}); ok {
				if funcName, exists := lambdaConfig["functionName"]; exists {
					if nameStr, ok := funcName.(string); ok {
						if len(nameStr) > 64 {
							t.Errorf("Lambda function name too long: %s", nameStr)
						}
					}
				}
			}
		}

	case "s3-bucket":
		config := node.Config["s3"]
		if config != nil {
			if s3Config, ok := config.(map[string]interface{}); ok {
				if bucketName, exists := s3Config["bucketName"]; exists {
					if nameStr, ok := bucketName.(string); ok {
						if len(nameStr) < 3 || len(nameStr) > 63 {
							t.Errorf("S3 bucket name invalid length: %s", nameStr)
						}
					}
				}
			}
		}

	case "sqs-queue":
		config := node.Config["sqs"]
		if config != nil {
			if sqsConfig, ok := config.(map[string]interface{}); ok {
				if queueName, exists := sqsConfig["queueName"]; exists {
					if nameStr, ok := queueName.(string); ok {
						if len(nameStr) > 80 {
							t.Errorf("SQS queue name too long: %s", nameStr)
						}
					}
				}
			}
		}
	}
}