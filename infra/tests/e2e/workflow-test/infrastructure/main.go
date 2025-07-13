package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecr"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sqs"
	"github.com/pulumi/pulumi-docker/sdk/v4/go/docker"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

// Import the workflow infrastructure from the main project
// This is a simplified version for testing
func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Load configuration
		cfg := config.New(ctx, "")
		
		projectName := cfg.Get("projectName")
		if projectName == "" {
			projectName = ctx.Stack()
		}

		region := cfg.Get("region")
		if region == "" {
			region = "us-east-1"
		}

		// Get workflows configuration
		workflowsConfig := cfg.Get("workflows")
		if workflowsConfig == "" {
			return fmt.Errorf("workflows configuration is required")
		}

		var workflows []WorkflowConfig
		if err := json.Unmarshal([]byte(workflowsConfig), &workflows); err != nil {
			return fmt.Errorf("failed to parse workflows config: %v", err)
		}

		// Create ECR repository for container images
		repo, err := ecr.NewRepository(ctx, fmt.Sprintf("%s-repo", projectName), &ecr.RepositoryArgs{
			Name: pulumi.String(fmt.Sprintf("%s-lambda", projectName)),
			Tags: pulumi.StringMap{
				"Project":   pulumi.String(projectName),
				"Purpose":   pulumi.String("e2e-testing"),
				"TestName":  pulumi.String(projectName),
			},
		})
		if err != nil {
			return err
		}

		repoURL := repo.RepositoryUrl

		// Create workflows
		for _, workflowConfig := range workflows {
			resources, err := createTestWorkflowResources(ctx, projectName, workflowConfig, repo, repoURL)
			if err != nil {
				return fmt.Errorf("failed to create workflow %s: %v", workflowConfig.Name, err)
			}

			// Export workflow resources for testing
			ctx.Export(fmt.Sprintf("%s-workflow-lambdas", workflowConfig.Name), 
				pulumi.StringArray(getMapKeys(resources.Lambdas)))
			ctx.Export(fmt.Sprintf("%s-workflow-queues", workflowConfig.Name), 
				pulumi.StringArray(getMapKeys(resources.SQSQueues)))
			ctx.Export(fmt.Sprintf("%s-workflow-buckets", workflowConfig.Name), 
				pulumi.StringArray(getMapKeys(resources.S3Buckets)))
		}

		// Export repository URL
		ctx.Export("repositoryUrl", repoURL)

		return nil
	})
}

// Simplified workflow configuration for testing
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

type WorkflowResources struct {
	Lambdas   map[string]*lambda.Function
	SQSQueues map[string]*sqs.Queue
	S3Buckets map[string]*s3.Bucket
}

func createTestWorkflowResources(ctx *pulumi.Context, projectName string, workflowConfig WorkflowConfig, repo *ecr.Repository, repoURL pulumi.StringOutput) (*WorkflowResources, error) {
	resources := &WorkflowResources{
		Lambdas:   make(map[string]*lambda.Function),
		SQSQueues: make(map[string]*sqs.Queue),
		S3Buckets: make(map[string]*s3.Bucket),
	}

	// Create nodes
	for _, nodeConfig := range workflowConfig.Nodes {
		switch nodeConfig.Type {
		case "lambda":
			function, err := createTestLambda(ctx, projectName, workflowConfig.Name, nodeConfig, repo, repoURL)
			if err != nil {
				return nil, fmt.Errorf("failed to create lambda %s: %v", nodeConfig.ID, err)
			}
			resources.Lambdas[nodeConfig.ID] = function

		case "sqs":
			queue, err := createTestSQS(ctx, projectName, workflowConfig.Name, nodeConfig)
			if err != nil {
				return nil, fmt.Errorf("failed to create SQS queue %s: %v", nodeConfig.ID, err)
			}
			resources.SQSQueues[nodeConfig.ID] = queue

		case "s3-bucket":
			bucket, err := createTestS3(ctx, projectName, workflowConfig.Name, nodeConfig)
			if err != nil {
				return nil, fmt.Errorf("failed to create S3 bucket %s: %v", nodeConfig.ID, err)
			}
			resources.S3Buckets[nodeConfig.ID] = bucket
		}
	}

	return resources, nil
}

func createTestLambda(ctx *pulumi.Context, projectName, workflowName string, nodeConfig WorkflowNodeConfig, repo *ecr.Repository, repoURL pulumi.StringOutput) (*lambda.Function, error) {
	functionName := fmt.Sprintf("%s-%s-%s", projectName, workflowName, nodeConfig.ID)

	// Create IAM role
	role, err := iam.NewRole(ctx, fmt.Sprintf("%s-role", functionName), &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "lambda.amazonaws.com"
					}
				}
			]
		}`),
		Tags: pulumi.StringMap{
			"Project":  pulumi.String(projectName),
			"TestName": pulumi.String(projectName),
			"NodeType": pulumi.String("lambda"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Attach basic Lambda execution role
	_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("%s-basic-execution", functionName), &iam.RolePolicyAttachmentArgs{
		Role:      role.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})
	if err != nil {
		return nil, err
	}

	// For testing, create a simple Lambda function code
	functionCode := createTestLambdaCode(nodeConfig.ID)
	
	// Create Lambda function with inline code for testing
	function, err := lambda.NewFunction(ctx, functionName, &lambda.FunctionArgs{
		Role:    role.Arn,
		Code:    pulumi.NewStringAsset(functionCode),
		Handler: pulumi.String("index.handler"),
		Runtime: pulumi.String("nodejs18.x"),
		Timeout: pulumi.Int(60),
		Tags: pulumi.StringMap{
			"Project":  pulumi.String(projectName),
			"TestName": pulumi.String(projectName),
			"NodeId":   pulumi.String(nodeConfig.ID),
		},
	})
	if err != nil {
		return nil, err
	}

	return function, nil
}

func createTestSQS(ctx *pulumi.Context, projectName, workflowName string, nodeConfig WorkflowNodeConfig) (*sqs.Queue, error) {
	queueName := fmt.Sprintf("%s-%s-%s", projectName, workflowName, nodeConfig.ID)

	queue, err := sqs.NewQueue(ctx, queueName, &sqs.QueueArgs{
		Name:                     pulumi.String(queueName),
		VisibilityTimeoutSeconds: pulumi.Int(300),
		MessageRetentionSeconds:  pulumi.Int(1209600),
		Tags: pulumi.StringMap{
			"Project":  pulumi.String(projectName),
			"TestName": pulumi.String(projectName),
			"NodeId":   pulumi.String(nodeConfig.ID),
		},
	})
	if err != nil {
		return nil, err
	}

	return queue, nil
}

func createTestS3(ctx *pulumi.Context, projectName, workflowName string, nodeConfig WorkflowNodeConfig) (*s3.Bucket, error) {
	bucketName := fmt.Sprintf("%s-%s-%s", projectName, workflowName, nodeConfig.ID)

	bucket, err := s3.NewBucket(ctx, bucketName, &s3.BucketArgs{
		Bucket: pulumi.String(bucketName),
		Tags: pulumi.StringMap{
			"Project":  pulumi.String(projectName),
			"TestName": pulumi.String(projectName),
			"NodeId":   pulumi.String(nodeConfig.ID),
		},
	})
	if err != nil {
		return nil, err
	}

	// Block public access
	_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("%s-public-access-block", bucketName), &s3.BucketPublicAccessBlockArgs{
		Bucket:                bucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return nil, err
	}

	return bucket, nil
}

func createTestLambdaCode(nodeID string) string {
	return fmt.Sprintf(`
exports.handler = async (event, context) => {
    console.log('Test Lambda function %s called with event:', JSON.stringify(event, null, 2));
    
    // Simple test logic based on node ID
    const response = {
        statusCode: 200,
        nodeId: '%s',
        timestamp: new Date().toISOString(),
        input: event,
        processed: true
    };
    
    // Add some test-specific processing
    if (event.body) {
        try {
            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            response.processedData = {
                ...body,
                processedBy: '%s',
                processedAt: new Date().toISOString()
            };
        } catch (e) {
            response.error = 'Failed to parse input: ' + e.message;
        }
    }
    
    return response;
};
`, nodeID, nodeID, nodeID)
}

func getMapKeys(m interface{}) []string {
	var keys []string
	switch v := m.(type) {
	case map[string]*lambda.Function:
		for k := range v {
			keys = append(keys, k)
		}
	case map[string]*sqs.Queue:
		for k := range v {
			keys = append(keys, k)
		}
	case map[string]*s3.Bucket:
		for k := range v {
			keys = append(keys, k)
		}
	}
	return keys
}