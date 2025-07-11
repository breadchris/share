package workflow

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// S3Helper provides utility functions for S3 operations
type S3Helper struct {
	client *AWSClient
}

// NewS3Helper creates a new S3 helper
func NewS3Helper(client *AWSClient) *S3Helper {
	return &S3Helper{client: client}
}

// GenerateKey generates an S3 key based on template and context
func (h *S3Helper) GenerateKey(template string, context map[string]interface{}) string {
	key := template
	
	// Replace common template variables
	if context != nil {
		for k, v := range context {
			placeholder := fmt.Sprintf("{{.%s}}", k)
			replacement := fmt.Sprintf("%v", v)
			key = strings.ReplaceAll(key, placeholder, replacement)
		}
	}
	
	// Add timestamp if not present
	if !strings.Contains(key, "{{.timestamp}}") && !strings.Contains(key, "{{.date}}") {
		timestamp := time.Now().Unix()
		key = fmt.Sprintf("%s%d", key, timestamp)
	}
	
	return key
}

// PutJSONData stores JSON data with proper content type
func (h *S3Helper) PutJSONData(ctx context.Context, bucketName, key string, data interface{}) (interface{}, error) {
	config := &S3NodeConfig{
		BucketName:  bucketName,
		Key:         key,
		ContentType: "application/json",
		Operation:   "put",
	}
	
	return h.client.ProcessS3Operation(ctx, config, data)
}

// PutTextData stores text data with proper content type
func (h *S3Helper) PutTextData(ctx context.Context, bucketName, key, data string) (interface{}, error) {
	config := &S3NodeConfig{
		BucketName:  bucketName,
		Key:         key,
		ContentType: "text/plain",
		Operation:   "put",
	}
	
	return h.client.ProcessS3Operation(ctx, config, data)
}

// PutBinaryData stores binary data
func (h *S3Helper) PutBinaryData(ctx context.Context, bucketName, key string, data []byte, contentType string) (interface{}, error) {
	config := &S3NodeConfig{
		BucketName:  bucketName,
		Key:         key,
		ContentType: contentType,
		Operation:   "put",
	}
	
	return h.client.ProcessS3Operation(ctx, config, data)
}

// GetData retrieves data from S3
func (h *S3Helper) GetData(ctx context.Context, bucketName, key string) (interface{}, error) {
	config := &S3NodeConfig{
		BucketName: bucketName,
		Key:        key,
		Operation:  "get",
	}
	
	return h.client.ProcessS3Operation(ctx, config, nil)
}

// ListObjects lists objects in a bucket with optional prefix
func (h *S3Helper) ListObjects(ctx context.Context, bucketName, prefix string) (interface{}, error) {
	config := &S3NodeConfig{
		BucketName: bucketName,
		KeyPrefix:  prefix,
		Operation:  "list",
	}
	
	return h.client.ProcessS3Operation(ctx, config, nil)
}

// DeleteObject deletes an object from S3
func (h *S3Helper) DeleteObject(ctx context.Context, bucketName, key string) (interface{}, error) {
	config := &S3NodeConfig{
		BucketName: bucketName,
		Key:        key,
		Operation:  "delete",
	}
	
	return h.client.ProcessS3Operation(ctx, config, nil)
}

// UploadWorkflowResult uploads workflow result with proper metadata
func (h *S3Helper) UploadWorkflowResult(ctx context.Context, bucketName, workflowName, nodeID string, result interface{}) (interface{}, error) {
	key := fmt.Sprintf("workflows/%s/%s/%s/%d.json", 
		workflowName, 
		nodeID, 
		time.Now().Format("2006/01/02"), 
		time.Now().Unix())
	
	config := &S3NodeConfig{
		BucketName:  bucketName,
		Key:         key,
		ContentType: "application/json",
		Operation:   "put",
		Metadata: map[string]string{
			"workflow":  workflowName,
			"node":      nodeID,
			"timestamp": fmt.Sprintf("%d", time.Now().Unix()),
		},
		Tags: map[string]string{
			"Workflow": workflowName,
			"Node":     nodeID,
			"Type":     "result",
		},
	}
	
	return h.client.ProcessS3Operation(ctx, config, result)
}

// CreatePresignedURL creates a presigned URL for S3 object access
func (h *S3Helper) CreatePresignedURL(ctx context.Context, bucketName, key string, expiration time.Duration) (string, error) {
	// This would require additional AWS SDK functionality
	// For now, return a placeholder
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucketName, key), nil
}

// BatchUpload uploads multiple objects to S3
func (h *S3Helper) BatchUpload(ctx context.Context, bucketName string, objects map[string]interface{}) (map[string]interface{}, error) {
	results := make(map[string]interface{})
	
	for key, data := range objects {
		result, err := h.PutJSONData(ctx, bucketName, key, data)
		if err != nil {
			results[key] = map[string]interface{}{
				"error": err.Error(),
			}
		} else {
			results[key] = result
		}
	}
	
	return results, nil
}

// S3PathResolver resolves S3 paths with various formats
type S3PathResolver struct {
	BucketName string
	Region     string
}

// NewS3PathResolver creates a new path resolver
func NewS3PathResolver(bucketName, region string) *S3PathResolver {
	return &S3PathResolver{
		BucketName: bucketName,
		Region:     region,
	}
}

// ResolvePath resolves various S3 path formats
func (r *S3PathResolver) ResolvePath(path string) (bucket, key string, err error) {
	// Handle different path formats:
	// s3://bucket/key
	// bucket/key
	// /bucket/key
	// key (uses default bucket)
	
	if strings.HasPrefix(path, "s3://") {
		path = strings.TrimPrefix(path, "s3://")
		parts := strings.SplitN(path, "/", 2)
		if len(parts) >= 2 {
			return parts[0], parts[1], nil
		}
		return parts[0], "", nil
	}
	
	if strings.HasPrefix(path, "/") {
		path = strings.TrimPrefix(path, "/")
		parts := strings.SplitN(path, "/", 2)
		if len(parts) >= 2 {
			return parts[0], parts[1], nil
		}
		return parts[0], "", nil
	}
	
	if strings.Contains(path, "/") && r.BucketName == "" {
		// Assume first part is bucket
		parts := strings.SplitN(path, "/", 2)
		return parts[0], parts[1], nil
	}
	
	// Use default bucket
	if r.BucketName == "" {
		return "", "", fmt.Errorf("no bucket specified and no default bucket configured")
	}
	
	return r.BucketName, path, nil
}

// GetURL returns the HTTP URL for an S3 object
func (r *S3PathResolver) GetURL(key string) string {
	if r.Region == "" {
		return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", r.BucketName, key)
	}
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", r.BucketName, r.Region, key)
}

// GetConsoleURL returns the AWS Console URL for an S3 object
func (r *S3PathResolver) GetConsoleURL(key string) string {
	region := r.Region
	if region == "" {
		region = "us-east-1"
	}
	return fmt.Sprintf("https://console.aws.amazon.com/s3/object/%s?region=%s&prefix=%s", 
		r.BucketName, region, key)
}