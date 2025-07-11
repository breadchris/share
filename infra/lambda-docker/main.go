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

// LambdaConfig represents the configuration for a Lambda function
type LambdaConfig struct {
	Name           string            `json:"name"`
	Handler        string            `json:"handler,omitempty"`
	Runtime        string            `json:"runtime,omitempty"`
	BaseImage      string            `json:"baseImage"`
	BuildContext   string            `json:"buildContext"`
	Dockerfile     string            `json:"dockerfile"`
	Environment    map[string]string `json:"environment,omitempty"`
	Timeout        int               `json:"timeout,omitempty"`
	MemorySize     int               `json:"memorySize,omitempty"`
	Architecture   string            `json:"architecture,omitempty"`
	Policies       []string          `json:"policies,omitempty"`
	InlinePolicies map[string]string `json:"inlinePolicies,omitempty"`
}

// Config represents the overall configuration
type Config struct {
	ProjectName string           `json:"projectName"`
	Region      string           `json:"region,omitempty"`
	Lambdas     []LambdaConfig   `json:"lambdas"`
	Workflows   []WorkflowConfig `json:"workflows,omitempty"`
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Load configuration
		cfg := config.New(ctx, "")
		
		// Get project name from config or use stack name
		projectName := cfg.Get("projectName")
		if projectName == "" {
			projectName = ctx.Stack()
		}

		// Get AWS region
		region := cfg.Get("region")
		if region == "" {
			region = "us-east-1"
		}

		// Get lambdas configuration
		lambdasConfig := cfg.Get("lambdas")
		var lambdas []LambdaConfig
		if lambdasConfig != "" {
			if err := json.Unmarshal([]byte(lambdasConfig), &lambdas); err != nil {
				return fmt.Errorf("failed to parse lambdas config: %v", err)
			}
		}

		// Get workflows configuration
		workflowsConfig := cfg.Get("workflows")
		var workflows []WorkflowConfig
		if workflowsConfig != "" {
			if err := json.Unmarshal([]byte(workflowsConfig), &workflows); err != nil {
				return fmt.Errorf("failed to parse workflows config: %v", err)
			}
		}

		// Require at least one of lambdas or workflows
		if len(lambdas) == 0 && len(workflows) == 0 {
			return fmt.Errorf("either lambdas or workflows configuration is required")
		}

		// Create ECR repository for container images
		repo, err := ecr.NewRepository(ctx, fmt.Sprintf("%s-repo", projectName), &ecr.RepositoryArgs{
			Name: pulumi.String(fmt.Sprintf("%s-lambda", projectName)),
		})
		if err != nil {
			return err
		}

		// Get repository URL
		repoURL := repo.RepositoryUrl

		// Create Lambda functions
		for _, lambdaConfig := range lambdas {
			if err := createLambdaFunction(ctx, projectName, lambdaConfig, repo, repoURL); err != nil {
				return fmt.Errorf("failed to create lambda %s: %v", lambdaConfig.Name, err)
			}
		}

		// Create workflows
		for _, workflowConfig := range workflows {
			resources, err := createWorkflowResources(ctx, projectName, workflowConfig, repo, repoURL)
			if err != nil {
				return fmt.Errorf("failed to create workflow %s: %v", workflowConfig.Name, err)
			}

			// Export workflow resources
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

func createLambdaFunction(ctx *pulumi.Context, projectName string, config LambdaConfig, repo *ecr.Repository, repoURL pulumi.StringOutput) error {
	// Create IAM role for Lambda
	role, err := iam.NewRole(ctx, fmt.Sprintf("%s-role", config.Name), &iam.RoleArgs{
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
	})
	if err != nil {
		return err
	}

	// Attach basic Lambda execution role
	_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("%s-basic-execution", config.Name), &iam.RolePolicyAttachmentArgs{
		Role:      role.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})
	if err != nil {
		return err
	}

	// Attach additional managed policies
	for i, policyArn := range config.Policies {
		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("%s-policy-%d", config.Name, i), &iam.RolePolicyAttachmentArgs{
			Role:      role.Name,
			PolicyArn: pulumi.String(policyArn),
		})
		if err != nil {
			return err
		}
	}

	// Create inline policies
	for name, policy := range config.InlinePolicies {
		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("%s-inline-%s", config.Name, name), &iam.RolePolicyArgs{
			Role:   role.Name,
			Policy: pulumi.String(policy),
		})
		if err != nil {
			return err
		}
	}

	// Build and push Docker image
	image, err := docker.NewImage(ctx, fmt.Sprintf("%s-image", config.Name), &docker.ImageArgs{
		ImageName: repoURL.ApplyT(func(url string) string {
			return fmt.Sprintf("%s:%s", url, config.Name)
		}).(pulumi.StringOutput),
		Build: &docker.DockerBuildArgs{
			Context:    pulumi.String(config.BuildContext),
			Dockerfile: pulumi.String(config.Dockerfile),
			Args: pulumi.StringMap{
				"BASE_IMAGE": pulumi.String(config.BaseImage),
			},
		},
		Registry: &docker.RegistryArgs{
			Server: repoURL.ApplyT(func(url string) string {
				return url[:len(url)-len(fmt.Sprintf("/%s-lambda", projectName))]
			}).(pulumi.StringOutput),
		},
	})
	if err != nil {
		return err
	}

	// Set default values
	timeout := config.Timeout
	if timeout == 0 {
		timeout = 60
	}

	memorySize := config.MemorySize
	if memorySize == 0 {
		memorySize = 512
	}

	architecture := config.Architecture
	if architecture == "" {
		architecture = "x86_64"
	}

	// Create environment variables
	environment := pulumi.StringMap{}
	for key, value := range config.Environment {
		environment[key] = pulumi.String(value)
	}

	// Create Lambda function
	function, err := lambda.NewFunction(ctx, config.Name, &lambda.FunctionArgs{
		Role:         role.Arn,
		ImageUri:     image.ImageName,
		PackageType:  pulumi.String("Image"),
		Timeout:      pulumi.Int(timeout),
		MemorySize:   pulumi.Int(memorySize),
		Architectures: pulumi.StringArray{pulumi.String(architecture)},
		Environment: &lambda.FunctionEnvironmentArgs{
			Variables: environment,
		},
	})
	if err != nil {
		return err
	}

	// Export function ARN
	ctx.Export(fmt.Sprintf("%s-arn", config.Name), function.Arn)

	return nil
}

// getMapKeys returns the keys of a map as a string array
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
	case map[string]*sns.Topic:
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