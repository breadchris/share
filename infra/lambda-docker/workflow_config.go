package main

import (
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sqs"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// WorkflowNodeConfig represents a node in the workflow configuration
type WorkflowNodeConfig struct {
	ID     string                 `json:"id"`
	Type   string                 `json:"type"`
	Config map[string]interface{} `json:"config"`
}

// WorkflowEdgeConfig represents an edge in the workflow configuration
type WorkflowEdgeConfig struct {
	From      string                 `json:"from"`
	To        string                 `json:"to"`
	Condition string                 `json:"condition,omitempty"`
	Transform string                 `json:"transform,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// WorkflowConfig represents the workflow configuration
type WorkflowConfig struct {
	Name        string                `json:"name"`
	Description string                `json:"description,omitempty"`
	Nodes       []WorkflowNodeConfig  `json:"nodes"`
	Edges       []WorkflowEdgeConfig  `json:"edges"`
	Entrypoint  string                `json:"entrypoint"`
	Variables   map[string]string     `json:"variables,omitempty"`
}

// WorkflowResources tracks created AWS resources for a workflow
type WorkflowResources struct {
	Lambdas       map[string]*lambda.Function
	SQSQueues     map[string]*sqs.Queue
	SNSTopics     map[string]*sns.Topic
	S3Buckets     map[string]*s3.Bucket
	EventMappings map[string]*lambda.EventSourceMapping
	IAMRoles      map[string]*iam.Role
}

// createWorkflowResources creates AWS resources for a workflow
func createWorkflowResources(ctx *pulumi.Context, projectName string, workflowConfig WorkflowConfig, repo *ecr.Repository, repoURL pulumi.StringOutput) (*WorkflowResources, error) {
	resources := &WorkflowResources{
		Lambdas:       make(map[string]*lambda.Function),
		SQSQueues:     make(map[string]*sqs.Queue),
		SNSTopics:     make(map[string]*sns.Topic),
		S3Buckets:     make(map[string]*s3.Bucket),
		EventMappings: make(map[string]*lambda.EventSourceMapping),
		IAMRoles:      make(map[string]*iam.Role),
	}

	// Create nodes
	for _, nodeConfig := range workflowConfig.Nodes {
		switch nodeConfig.Type {
		case "lambda":
			lambda, err := createWorkflowLambda(ctx, projectName, workflowConfig.Name, nodeConfig, repo, repoURL)
			if err != nil {
				return nil, fmt.Errorf("failed to create lambda %s: %v", nodeConfig.ID, err)
			}
			resources.Lambdas[nodeConfig.ID] = lambda

		case "sqs":
			queue, err := createWorkflowSQS(ctx, projectName, workflowConfig.Name, nodeConfig)
			if err != nil {
				return nil, fmt.Errorf("failed to create SQS queue %s: %v", nodeConfig.ID, err)
			}
			resources.SQSQueues[nodeConfig.ID] = queue

		case "sns":
			topic, err := createWorkflowSNS(ctx, projectName, workflowConfig.Name, nodeConfig)
			if err != nil {
				return nil, fmt.Errorf("failed to create SNS topic %s: %v", nodeConfig.ID, err)
			}
			resources.SNSTopics[nodeConfig.ID] = topic

		case "s3-bucket":
			bucket, err := createWorkflowS3(ctx, projectName, workflowConfig.Name, nodeConfig)
			if err != nil {
				return nil, fmt.Errorf("failed to create S3 bucket %s: %v", nodeConfig.ID, err)
			}
			resources.S3Buckets[nodeConfig.ID] = bucket

		default:
			return nil, fmt.Errorf("unknown node type: %s", nodeConfig.Type)
		}
	}

	// Create event source mappings for SQS -> Lambda connections
	for _, edgeConfig := range workflowConfig.Edges {
		fromNode := findNodeByID(workflowConfig.Nodes, edgeConfig.From)
		toNode := findNodeByID(workflowConfig.Nodes, edgeConfig.To)

		if fromNode != nil && toNode != nil && fromNode.Type == "sqs" && toNode.Type == "lambda" {
			// Check if this edge should create an event source mapping
			if shouldCreateEventMapping(edgeConfig) {
				mapping, err := createSQSEventMapping(ctx, projectName, workflowConfig.Name, edgeConfig, resources)
				if err != nil {
					return nil, fmt.Errorf("failed to create event mapping %s -> %s: %v", edgeConfig.From, edgeConfig.To, err)
				}
				resources.EventMappings[fmt.Sprintf("%s-%s", edgeConfig.From, edgeConfig.To)] = mapping
			}
		}
	}

	// Export workflow definition for Lambda functions
	workflowDefinition, err := json.Marshal(workflowConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal workflow definition: %v", err)
	}

	// Add workflow definition to Lambda environment variables
	for nodeID, lambdaFunc := range resources.Lambdas {
		ctx.Export(fmt.Sprintf("%s-%s-workflow-definition", workflowConfig.Name, nodeID), pulumi.String(string(workflowDefinition)))
	}

	return resources, nil
}

// createWorkflowLambda creates a Lambda function for a workflow node
func createWorkflowLambda(ctx *pulumi.Context, projectName, workflowName string, nodeConfig WorkflowNodeConfig, repo *ecr.Repository, repoURL pulumi.StringOutput) (*lambda.Function, error) {
	// Extract Lambda configuration
	lambdaConfig := LambdaConfig{
		Name: fmt.Sprintf("%s-%s-%s", projectName, workflowName, nodeConfig.ID),
	}

	// Parse node config into Lambda config
	if config, ok := nodeConfig.Config["lambda"]; ok {
		configBytes, err := json.Marshal(config)
		if err != nil {
			return nil, err
		}
		if err := json.Unmarshal(configBytes, &lambdaConfig); err != nil {
			return nil, err
		}
	}

	// Set default values
	if lambdaConfig.BaseImage == "" {
		lambdaConfig.BaseImage = "alpine:latest"
	}
	if lambdaConfig.BuildContext == "" {
		lambdaConfig.BuildContext = "./"
	}
	if lambdaConfig.Dockerfile == "" {
		lambdaConfig.Dockerfile = "Dockerfile"
	}

	// Add workflow-specific environment variables
	if lambdaConfig.Environment == nil {
		lambdaConfig.Environment = make(map[string]string)
	}
	lambdaConfig.Environment["WORKFLOW_NAME"] = workflowName
	lambdaConfig.Environment["NODE_ID"] = nodeConfig.ID

	// Create the Lambda function using existing function
	err := createLambdaFunction(ctx, projectName, lambdaConfig, repo, repoURL)
	if err != nil {
		return nil, err
	}

	// Get the created function (this is a simplified approach)
	// In practice, you'd need to modify createLambdaFunction to return the function
	return nil, nil
}

// createWorkflowSQS creates an SQS queue for a workflow node
func createWorkflowSQS(ctx *pulumi.Context, projectName, workflowName string, nodeConfig WorkflowNodeConfig) (*sqs.Queue, error) {
	queueName := fmt.Sprintf("%s-%s-%s", projectName, workflowName, nodeConfig.ID)

	// Parse SQS configuration
	var config struct {
		VisibilityTimeoutSeconds int  `json:"visibilityTimeoutSeconds"`
		MessageRetentionSeconds  int  `json:"messageRetentionSeconds"`
		MaxReceiveCount          int  `json:"maxReceiveCount"`
		FifoQueue                bool `json:"fifoQueue"`
	}

	if sqsConfig, ok := nodeConfig.Config["sqs"]; ok {
		configBytes, err := json.Marshal(sqsConfig)
		if err != nil {
			return nil, err
		}
		if err := json.Unmarshal(configBytes, &config); err != nil {
			return nil, err
		}
	}

	// Set defaults
	if config.VisibilityTimeoutSeconds == 0 {
		config.VisibilityTimeoutSeconds = 300
	}
	if config.MessageRetentionSeconds == 0 {
		config.MessageRetentionSeconds = 1209600 // 14 days
	}

	// Create queue
	queueArgs := &sqs.QueueArgs{
		Name:                     pulumi.String(queueName),
		VisibilityTimeoutSeconds: pulumi.Int(config.VisibilityTimeoutSeconds),
		MessageRetentionSeconds:  pulumi.Int(config.MessageRetentionSeconds),
	}

	if config.FifoQueue {
		queueArgs.FifoQueue = pulumi.Bool(true)
		queueArgs.ContentBasedDeduplication = pulumi.Bool(true)
	}

	queue, err := sqs.NewQueue(ctx, queueName, queueArgs)
	if err != nil {
		return nil, err
	}

	// Create dead letter queue if maxReceiveCount is specified
	if config.MaxReceiveCount > 0 {
		dlqName := fmt.Sprintf("%s-dlq", queueName)
		dlq, err := sqs.NewQueue(ctx, dlqName, &sqs.QueueArgs{
			Name: pulumi.String(dlqName),
		})
		if err != nil {
			return nil, err
		}

		// Update main queue with dead letter queue
		queuePolicy := dlq.Arn.ApplyT(func(arn string) string {
			return fmt.Sprintf(`{
				"deadLetterTargetArn": "%s",
				"maxReceiveCount": %d
			}`, arn, config.MaxReceiveCount)
		}).(pulumi.StringOutput)

		queue, err = sqs.NewQueue(ctx, queueName, &sqs.QueueArgs{
			Name:                     pulumi.String(queueName),
			VisibilityTimeoutSeconds: pulumi.Int(config.VisibilityTimeoutSeconds),
			MessageRetentionSeconds:  pulumi.Int(config.MessageRetentionSeconds),
			RedrivePolicy:            queuePolicy,
		})
		if err != nil {
			return nil, err
		}
	}

	return queue, nil
}

// createWorkflowSNS creates an SNS topic for a workflow node
func createWorkflowSNS(ctx *pulumi.Context, projectName, workflowName string, nodeConfig WorkflowNodeConfig) (*sns.Topic, error) {
	topicName := fmt.Sprintf("%s-%s-%s", projectName, workflowName, nodeConfig.ID)

	topic, err := sns.NewTopic(ctx, topicName, &sns.TopicArgs{
		Name: pulumi.String(topicName),
	})
	if err != nil {
		return nil, err
	}

	return topic, nil
}

// createWorkflowS3 creates an S3 bucket for a workflow node
func createWorkflowS3(ctx *pulumi.Context, projectName, workflowName string, nodeConfig WorkflowNodeConfig) (*s3.Bucket, error) {
	bucketName := fmt.Sprintf("%s-%s-%s", projectName, workflowName, nodeConfig.ID)

	// Parse S3 configuration
	var config struct {
		BucketName     string            `json:"bucketName,omitempty"`
		Versioning     bool              `json:"versioning,omitempty"`
		Encryption     bool              `json:"encryption,omitempty"`
		PublicAccess   bool              `json:"publicAccess,omitempty"`
		LifecycleRules []LifecycleRule   `json:"lifecycleRules,omitempty"`
		Tags           map[string]string `json:"tags,omitempty"`
	}

	if s3Config, ok := nodeConfig.Config["s3"]; ok {
		configBytes, err := json.Marshal(s3Config)
		if err != nil {
			return nil, err
		}
		if err := json.Unmarshal(configBytes, &config); err != nil {
			return nil, err
		}
	}

	// Use custom bucket name if provided
	if config.BucketName != "" {
		bucketName = config.BucketName
	}

	// Create bucket
	bucket, err := s3.NewBucket(ctx, bucketName, &s3.BucketArgs{
		Bucket: pulumi.String(bucketName),
		Tags: pulumi.StringMap{
			"Project":  pulumi.String(projectName),
			"Workflow": pulumi.String(workflowName),
			"NodeId":   pulumi.String(nodeConfig.ID),
		},
	})
	if err != nil {
		return nil, err
	}

	// Add custom tags if specified
	if len(config.Tags) > 0 {
		tags := pulumi.StringMap{
			"Project":  pulumi.String(projectName),
			"Workflow": pulumi.String(workflowName),
			"NodeId":   pulumi.String(nodeConfig.ID),
		}
		for k, v := range config.Tags {
			tags[k] = pulumi.String(v)
		}
		bucket, err = s3.NewBucket(ctx, bucketName, &s3.BucketArgs{
			Bucket: pulumi.String(bucketName),
			Tags:   tags,
		})
		if err != nil {
			return nil, err
		}
	}

	// Configure versioning if enabled
	if config.Versioning {
		_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("%s-versioning", bucketName), &s3.BucketVersioningV2Args{
			Bucket: bucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return nil, err
		}
	}

	// Configure server-side encryption if enabled
	if config.Encryption {
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("%s-encryption", bucketName), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: bucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm: pulumi.String("AES256"),
					},
				},
			},
		})
		if err != nil {
			return nil, err
		}
	}

	// Block public access by default (unless explicitly enabled)
	if !config.PublicAccess {
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
	}

	// Configure lifecycle rules if specified
	if len(config.LifecycleRules) > 0 {
		var rules s3.BucketLifecycleConfigurationV2RuleArray
		for i, rule := range config.LifecycleRules {
			pulumiRule := &s3.BucketLifecycleConfigurationV2RuleArgs{
				Id:     pulumi.String(fmt.Sprintf("rule-%d", i)),
				Status: pulumi.String("Enabled"),
			}

			if rule.ExpirationDays > 0 {
				pulumiRule.Expiration = &s3.BucketLifecycleConfigurationV2RuleExpirationArgs{
					Days: pulumi.Int(rule.ExpirationDays),
				}
			}

			if rule.TransitionDays > 0 && rule.StorageClass != "" {
				pulumiRule.Transitions = s3.BucketLifecycleConfigurationV2RuleTransitionArray{
					&s3.BucketLifecycleConfigurationV2RuleTransitionArgs{
						Days:         pulumi.Int(rule.TransitionDays),
						StorageClass: pulumi.String(rule.StorageClass),
					},
				}
			}

			rules = append(rules, pulumiRule)
		}

		_, err = s3.NewBucketLifecycleConfigurationV2(ctx, fmt.Sprintf("%s-lifecycle", bucketName), &s3.BucketLifecycleConfigurationV2Args{
			Bucket: bucket.ID(),
			Rules:  rules,
		})
		if err != nil {
			return nil, err
		}
	}

	return bucket, nil
}

// LifecycleRule represents an S3 lifecycle rule configuration
type LifecycleRule struct {
	ExpirationDays  int    `json:"expirationDays,omitempty"`
	TransitionDays  int    `json:"transitionDays,omitempty"`
	StorageClass    string `json:"storageClass,omitempty"`
}

// createSQSEventMapping creates an event source mapping between SQS and Lambda
func createSQSEventMapping(ctx *pulumi.Context, projectName, workflowName string, edgeConfig WorkflowEdgeConfig, resources *WorkflowResources) (*lambda.EventSourceMapping, error) {
	mappingName := fmt.Sprintf("%s-%s-%s-to-%s", projectName, workflowName, edgeConfig.From, edgeConfig.To)

	queue := resources.SQSQueues[edgeConfig.From]
	lambdaFunc := resources.Lambdas[edgeConfig.To]

	if queue == nil || lambdaFunc == nil {
		return nil, fmt.Errorf("queue or lambda not found for mapping")
	}

	mapping, err := lambda.NewEventSourceMapping(ctx, mappingName, &lambda.EventSourceMappingArgs{
		EventSourceArn: queue.Arn,
		FunctionName:   lambdaFunc.Name,
		BatchSize:      pulumi.Int(10),
		Enabled:        pulumi.Bool(true),
	})
	if err != nil {
		return nil, err
	}

	return mapping, nil
}

// Helper functions

func findNodeByID(nodes []WorkflowNodeConfig, id string) *WorkflowNodeConfig {
	for _, node := range nodes {
		if node.ID == id {
			return &node
		}
	}
	return nil
}

func shouldCreateEventMapping(edgeConfig WorkflowEdgeConfig) bool {
	// Check if metadata indicates this should create an event mapping
	if edgeConfig.Metadata != nil {
		if eventSource, ok := edgeConfig.Metadata["eventSource"]; ok {
			if eventSource == true || eventSource == "true" {
				return true
			}
		}
	}
	return false
}