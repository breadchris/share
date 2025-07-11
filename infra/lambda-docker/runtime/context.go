package runtime

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"../workflow"
)

// ExecutionContext manages workflow execution context and state
type ExecutionContext struct {
	WorkflowID      string                            `json:"workflowId"`
	ExecutionID     string                            `json:"executionId"`
	StartTime       time.Time                         `json:"startTime"`
	CurrentNode     string                            `json:"currentNode"`
	NodeExecutions  map[string]*workflow.NodeExecution `json:"nodeExecutions"`
	CompletedNodes  map[string]bool                   `json:"completedNodes"`
	FailedNodes     map[string]bool                   `json:"failedNodes"`
	Variables       map[string]interface{}            `json:"variables"`
	Metadata        map[string]interface{}            `json:"metadata"`
	mu              sync.RWMutex
}

// NewExecutionContext creates a new execution context
func NewExecutionContext(workflowID, executionID string) *ExecutionContext {
	return &ExecutionContext{
		WorkflowID:     workflowID,
		ExecutionID:    executionID,
		StartTime:      time.Now(),
		NodeExecutions: make(map[string]*workflow.NodeExecution),
		CompletedNodes: make(map[string]bool),
		FailedNodes:    make(map[string]bool),
		Variables:      make(map[string]interface{}),
		Metadata:       make(map[string]interface{}),
	}
}

// SetCurrentNode sets the currently executing node
func (ec *ExecutionContext) SetCurrentNode(nodeID string) {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	ec.CurrentNode = nodeID
}

// GetCurrentNode gets the currently executing node
func (ec *ExecutionContext) GetCurrentNode() string {
	ec.mu.RLock()
	defer ec.mu.RUnlock()
	return ec.CurrentNode
}

// AddNodeExecution adds a node execution record
func (ec *ExecutionContext) AddNodeExecution(execution *workflow.NodeExecution) {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	ec.NodeExecutions[execution.NodeID] = execution
}

// GetNodeExecution gets a node execution record
func (ec *ExecutionContext) GetNodeExecution(nodeID string) *workflow.NodeExecution {
	ec.mu.RLock()
	defer ec.mu.RUnlock()
	return ec.NodeExecutions[nodeID]
}

// MarkNodeCompleted marks a node as completed
func (ec *ExecutionContext) MarkNodeCompleted(nodeID string) {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	ec.CompletedNodes[nodeID] = true
}

// MarkNodeFailed marks a node as failed
func (ec *ExecutionContext) MarkNodeFailed(nodeID string) {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	ec.FailedNodes[nodeID] = true
}

// IsNodeCompleted checks if a node is completed
func (ec *ExecutionContext) IsNodeCompleted(nodeID string) bool {
	ec.mu.RLock()
	defer ec.mu.RUnlock()
	return ec.CompletedNodes[nodeID]
}

// IsNodeFailed checks if a node has failed
func (ec *ExecutionContext) IsNodeFailed(nodeID string) bool {
	ec.mu.RLock()
	defer ec.mu.RUnlock()
	return ec.FailedNodes[nodeID]
}

// SetVariable sets a context variable
func (ec *ExecutionContext) SetVariable(key string, value interface{}) {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	ec.Variables[key] = value
}

// GetVariable gets a context variable
func (ec *ExecutionContext) GetVariable(key string) interface{} {
	ec.mu.RLock()
	defer ec.mu.RUnlock()
	return ec.Variables[key]
}

// SetMetadata sets metadata
func (ec *ExecutionContext) SetMetadata(key string, value interface{}) {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	ec.Metadata[key] = value
}

// GetMetadata gets metadata
func (ec *ExecutionContext) GetMetadata(key string) interface{} {
	ec.mu.RLock()
	defer ec.mu.RUnlock()
	return ec.Metadata[key]
}

// GetExecutionSummary returns a summary of the execution
func (ec *ExecutionContext) GetExecutionSummary() map[string]interface{} {
	ec.mu.RLock()
	defer ec.mu.RUnlock()

	summary := map[string]interface{}{
		"workflowId":      ec.WorkflowID,
		"executionId":     ec.ExecutionID,
		"startTime":       ec.StartTime.Format(time.RFC3339),
		"currentNode":     ec.CurrentNode,
		"completedNodes":  len(ec.CompletedNodes),
		"failedNodes":     len(ec.FailedNodes),
		"totalNodes":      len(ec.NodeExecutions),
		"variables":       ec.Variables,
		"metadata":        ec.Metadata,
	}

	// Add execution duration
	duration := time.Since(ec.StartTime)
	summary["duration"] = duration.String()
	summary["durationMs"] = duration.Milliseconds()

	return summary
}

// GetNodeExecutionHistory returns the execution history for all nodes
func (ec *ExecutionContext) GetNodeExecutionHistory() map[string]*workflow.NodeExecution {
	ec.mu.RLock()
	defer ec.mu.RUnlock()

	// Create a copy to avoid race conditions
	history := make(map[string]*workflow.NodeExecution)
	for nodeID, execution := range ec.NodeExecutions {
		history[nodeID] = execution
	}

	return history
}

// ToJSON converts the context to JSON
func (ec *ExecutionContext) ToJSON() ([]byte, error) {
	ec.mu.RLock()
	defer ec.mu.RUnlock()
	return json.Marshal(ec)
}

// FromJSON loads context from JSON
func (ec *ExecutionContext) FromJSON(data []byte) error {
	ec.mu.Lock()
	defer ec.mu.Unlock()
	return json.Unmarshal(data, ec)
}

// ContextManager manages multiple execution contexts
type ContextManager struct {
	contexts map[string]*ExecutionContext
	mu       sync.RWMutex
}

// NewContextManager creates a new context manager
func NewContextManager() *ContextManager {
	return &ContextManager{
		contexts: make(map[string]*ExecutionContext),
	}
}

// CreateContext creates a new execution context
func (cm *ContextManager) CreateContext(workflowID, executionID string) *ExecutionContext {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	ctx := NewExecutionContext(workflowID, executionID)
	cm.contexts[executionID] = ctx
	return ctx
}

// GetContext gets an execution context
func (cm *ContextManager) GetContext(executionID string) *ExecutionContext {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return cm.contexts[executionID]
}

// RemoveContext removes an execution context
func (cm *ContextManager) RemoveContext(executionID string) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	delete(cm.contexts, executionID)
}

// ListContexts lists all execution contexts
func (cm *ContextManager) ListContexts() []string {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	var ids []string
	for id := range cm.contexts {
		ids = append(ids, id)
	}
	return ids
}

// CleanupOldContexts removes old contexts based on age
func (cm *ContextManager) CleanupOldContexts(maxAge time.Duration) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	cutoff := time.Now().Add(-maxAge)
	for id, ctx := range cm.contexts {
		if ctx.StartTime.Before(cutoff) {
			delete(cm.contexts, id)
		}
	}
}

// GetContextStats returns statistics about managed contexts
func (cm *ContextManager) GetContextStats() map[string]interface{} {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	stats := map[string]interface{}{
		"totalContexts": len(cm.contexts),
		"contexts":      []map[string]interface{}{},
	}

	for id, ctx := range cm.contexts {
		contextStats := map[string]interface{}{
			"executionId": id,
			"workflowId":  ctx.WorkflowID,
			"startTime":   ctx.StartTime.Format(time.RFC3339),
			"currentNode": ctx.GetCurrentNode(),
		}
		stats["contexts"] = append(stats["contexts"].([]map[string]interface{}), contextStats)
	}

	return stats
}

// WithContext adds the execution context to the Go context
func WithContext(ctx context.Context, execCtx *ExecutionContext) context.Context {
	return context.WithValue(ctx, "executionContext", execCtx)
}

// FromContext extracts the execution context from the Go context
func FromContext(ctx context.Context) (*ExecutionContext, bool) {
	execCtx, ok := ctx.Value("executionContext").(*ExecutionContext)
	return execCtx, ok
}