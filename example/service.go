package example

import (
	"context"
	"fmt"
	"sync"

	"github.com/breadchris/share/gen/proto/example"
	"github.com/breadchris/share/gen/proto/example/exampleconnect"
	"github.com/bufbuild/connect-go"
	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// Service implements the ExampleServiceHandler interface
type Service struct {
	mu    sync.RWMutex
	items map[string]*example.Item
}

var _ exampleconnect.ExampleServiceHandler = (*Service)(nil)

// NewService creates a new instance of the example service
func NewService() *Service {
	return &Service{
		items: make(map[string]*example.Item),
	}
}

// CreateItem creates a new item
func (s *Service) CreateItem(
	ctx context.Context,
	req *connect.Request[example.CreateItemRequest],
) (*connect.Response[example.CreateItemResponse], error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Generate a new ID
	id := uuid.New().String()
	now := timestamppb.Now()

	// Create the item
	item := &example.Item{
		Id:          id,
		Name:        req.Msg.Name,
		Description: req.Msg.Description,
		Metadata:    req.Msg.Metadata,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Store the item
	s.items[id] = item

	return connect.NewResponse(&example.CreateItemResponse{
		Item: item,
	}), nil
}

// GetItem retrieves an item by ID
func (s *Service) GetItem(
	ctx context.Context,
	req *connect.Request[example.GetItemRequest],
) (*connect.Response[example.GetItemResponse], error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	item, found := s.items[req.Msg.Id]
	
	return connect.NewResponse(&example.GetItemResponse{
		Item:  item,
		Found: found,
	}), nil
}

// UpdateItem updates an existing item
func (s *Service) UpdateItem(
	ctx context.Context,
	req *connect.Request[example.UpdateItemRequest],
) (*connect.Response[example.UpdateItemResponse], error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, found := s.items[req.Msg.Id]
	if !found {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("item with id %s not found", req.Msg.Id))
	}

	// Update the item
	item.Name = req.Msg.Name
	item.Description = req.Msg.Description
	item.Metadata = req.Msg.Metadata
	item.UpdatedAt = timestamppb.Now()

	return connect.NewResponse(&example.UpdateItemResponse{
		Item: item,
	}), nil
}

// DeleteItem deletes an item by ID
func (s *Service) DeleteItem(
	ctx context.Context,
	req *connect.Request[example.DeleteItemRequest],
) (*connect.Response[emptypb.Empty], error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, found := s.items[req.Msg.Id]
	if !found {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("item with id %s not found", req.Msg.Id))
	}

	delete(s.items, req.Msg.Id)

	return connect.NewResponse(&emptypb.Empty{}), nil
}

// ListItems returns a paginated list of items
func (s *Service) ListItems(
	ctx context.Context,
	req *connect.Request[example.ListItemsRequest],
) (*connect.Response[example.ListItemsResponse], error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Convert map to slice for pagination
	var allItems []*example.Item
	for _, item := range s.items {
		// Simple filter implementation (checks if filter is contained in name or description)
		if req.Msg.Filter == "" || 
		   containsIgnoreCase(item.Name, req.Msg.Filter) ||
		   containsIgnoreCase(item.Description, req.Msg.Filter) {
			allItems = append(allItems, item)
		}
	}

	// Simple pagination
	pageSize := int(req.Msg.PageSize)
	if pageSize <= 0 {
		pageSize = 10 // default page size
	}
	if pageSize > 100 {
		pageSize = 100 // max page size
	}

	start := 0
	if req.Msg.PageToken != "" {
		// In a real implementation, you'd decode the page token properly
		// For simplicity, we'll assume it's just the start index as a string
		if startIdx, err := parseInt(req.Msg.PageToken); err == nil {
			start = startIdx
		}
	}

	end := start + pageSize
	if end > len(allItems) {
		end = len(allItems)
	}

	var items []*example.Item
	var nextPageToken string

	if start < len(allItems) {
		items = allItems[start:end]
		
		// Set next page token if there are more items
		if end < len(allItems) {
			nextPageToken = fmt.Sprintf("%d", end)
		}
	}

	return connect.NewResponse(&example.ListItemsResponse{
		Items:         items,
		NextPageToken: nextPageToken,
		TotalCount:    int32(len(allItems)),
	}), nil
}

// Helper functions

func containsIgnoreCase(s, substr string) bool {
	// Simple case-insensitive contains check
	// In a real implementation, you might use strings.ToLower or more sophisticated text search
	return len(substr) == 0 || len(s) >= len(substr) && 
		   (s == substr || searchIgnoreCase(s, substr))
}

func searchIgnoreCase(s, substr string) bool {
	// Simplified case-insensitive search
	sLower := toLower(s)
	substrLower := toLower(substr)
	
	for i := 0; i <= len(sLower)-len(substrLower); i++ {
		if sLower[i:i+len(substrLower)] == substrLower {
			return true
		}
	}
	return false
}

func toLower(s string) string {
	// Simple ASCII lowercase conversion
	result := make([]byte, len(s))
	for i, b := range []byte(s) {
		if b >= 'A' && b <= 'Z' {
			result[i] = b + 32
		} else {
			result[i] = b
		}
	}
	return string(result)
}

func parseInt(s string) (int, error) {
	// Simple integer parsing
	result := 0
	for _, r := range s {
		if r < '0' || r > '9' {
			return 0, fmt.Errorf("invalid integer: %s", s)
		}
		result = result*10 + int(r-'0')
	}
	return result, nil
}