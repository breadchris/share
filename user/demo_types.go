//go:generate go run generate.go

package user

import (
	"context"
	"time"

	"github.com/breadchris/share/pkg/httpcontext"
)

// Todo represents a task item
type Todo struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      TodoStatus `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DueDate     *time.Time `json:"due_date,omitempty"`
}

type TodoStatus string

const (
	TodoStatusPending   TodoStatus = "pending"
	TodoStatusCompleted TodoStatus = "completed"
	TodoStatusCancelled TodoStatus = "cancelled"
)

// API Request/Response types
type CreateTodoRequest struct {
	Title       string     `json:"title"`
	Description string     `json:"description,omitempty"`
	DueDate     *time.Time `json:"due_date,omitempty"`
}

type CreateTodoResponse struct {
	Todo Todo `json:"todo"`
}

type ListTodosRequest struct {
	UserID string     `json:"user_id"`
	Status TodoStatus `json:"status,omitempty"`
	Limit  int        `json:"limit,omitempty"`
	Offset int        `json:"offset,omitempty"`
}

type ListTodosResponse struct {
	Todos []Todo `json:"todos"`
	Total int    `json:"total"`
}

type GetTodoRequest struct {
	ID string `json:"id"`
}

type GetTodoResponse struct {
	Todo Todo `json:"todo"`
}

type UpdateTodoRequest struct {
	ID          string      `json:"id"`
	Title       *string     `json:"title,omitempty"`
	Description *string     `json:"description,omitempty"`
	Status      *TodoStatus `json:"status,omitempty"`
	DueDate     *time.Time  `json:"due_date,omitempty"`
}

type UpdateTodoResponse struct {
	Todo Todo `json:"todo"`
}

type DeleteTodoRequest struct {
	ID string `json:"id"`
}

type DeleteTodoResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// API Functions that match the pattern: func(ctx context.Context, req T) (resp T, error)
func CreateTodo(ctx context.Context, req CreateTodoRequest) (CreateTodoResponse, error) {
	// Example: Access HTTP request for authentication
	if httpcontext.HasRequest(ctx) {
		r := httpcontext.HTTPRequestFromContext(ctx)
		userID := r.Header.Get("X-User-ID")
		_ = userID // Use for authentication/authorization
	}

	// Example: Set response headers
	if httpcontext.HasWriter(ctx) {
		w := httpcontext.HTTPWriterFromContext(ctx)
		w.Header().Set("X-Created-Resource", "todo")
	}

	// Implementation would go here
	return CreateTodoResponse{}, nil
}

func ListTodos(ctx context.Context, req ListTodosRequest) (ListTodosResponse, error) {
	// Example: Access request headers for filtering
	if httpcontext.HasRequest(ctx) {
		r := httpcontext.HTTPRequestFromContext(ctx)
		sortOrder := r.Header.Get("X-Sort-Order")
		_ = sortOrder // Use for sorting results
	}

	// Implementation would go here
	return ListTodosResponse{}, nil
}

func GetTodo(ctx context.Context, req GetTodoRequest) (GetTodoResponse, error) {
	// Example: Check if resource exists and set appropriate status
	if httpcontext.HasWriter(ctx) {
		w := httpcontext.HTTPWriterFromContext(ctx)
		// Could set 404 status if todo not found
		_ = w
	}

	// Implementation would go here
	return GetTodoResponse{}, nil
}

func UpdateTodo(ctx context.Context, req UpdateTodoRequest) (UpdateTodoResponse, error) {
	// Example: Access request for audit logging
	if httpcontext.HasRequest(ctx) {
		r := httpcontext.HTTPRequestFromContext(ctx)
		userAgent := r.Header.Get("User-Agent")
		clientIP := r.RemoteAddr
		_, _ = userAgent, clientIP // Use for audit logs
	}

	// Implementation would go here
	return UpdateTodoResponse{}, nil
}

func DeleteTodo(ctx context.Context, req DeleteTodoRequest) (DeleteTodoResponse, error) {
	// Example: Set custom response headers
	if httpcontext.HasWriter(ctx) {
		w := httpcontext.HTTPWriterFromContext(ctx)
		w.Header().Set("X-Deleted-Resource", req.ID)
	}

	// Implementation would go here
	return DeleteTodoResponse{Success: true, Message: "Todo deleted successfully"}, nil
}
