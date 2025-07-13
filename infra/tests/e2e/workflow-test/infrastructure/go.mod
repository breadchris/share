module workflow-e2e-test-infra

go 1.21

require (
	github.com/aws/aws-sdk-go-v2 v1.24.0
	github.com/aws/aws-sdk-go-v2/config v1.26.2
	github.com/aws/aws-sdk-go-v2/service/lambda v1.49.0
	github.com/aws/aws-sdk-go-v2/service/s3 v1.48.0
	github.com/aws/aws-sdk-go-v2/service/sns v1.26.0
	github.com/aws/aws-sdk-go-v2/service/sqs v1.29.0
	github.com/pulumi/pulumi-aws/sdk/v6 v6.22.2
	github.com/pulumi/pulumi-docker/sdk/v4 v4.5.1
	github.com/pulumi/pulumi/sdk/v3 v3.105.0
)