package main

import (
	"fmt"
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// Define the stack
type LambdaYouTubeTranscriptStackProps struct {
	awscdk.StackProps
}

type LambdaYouTubeTranscriptStack struct {
	awscdk.Stack
}

func NewLambdaYouTubeTranscriptStack(scope constructs.Construct, id string, props *LambdaYouTubeTranscriptStackProps) awscdk.Stack {
	stack := awscdk.NewStack(scope, &id, &props.StackProps)

	// Define the Lambda function
	lambdaFunction := awslambda.NewFunction(stack, jsii.String("YouTubeTranscriptFunction"), &awslambda.FunctionProps{
		Runtime:      awslambda.Runtime_PROVIDED_AL2023(),
		Architecture: awslambda.Architecture_ARM_64(),
		Handler:      jsii.String("main"),
		Code:         awslambda.Code_FromAsset(jsii.String("./lambda.zip"), nil),
		Environment:  &map[string]*string{},
	})

	api := awsapigateway.NewLambdaRestApi(stack, jsii.String("YouTubeTranscriptApi"), &awsapigateway.LambdaRestApiProps{
		Handler: lambdaFunction,
	})

	fmt.Printf("API Gateway URL: %s\n", *api.Url())

	return stack
}

func main() {
	app := awscdk.NewApp(nil)

	NewLambdaYouTubeTranscriptStack(app, "LambdaYouTubeTranscriptStack", &LambdaYouTubeTranscriptStackProps{
		StackProps: awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

func env() *awscdk.Environment {
	return &awscdk.Environment{
		Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
		Region:  jsii.String(os.Getenv("CDK_DEFAULT_REGION")),
	}
}
