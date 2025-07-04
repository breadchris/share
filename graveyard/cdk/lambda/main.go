package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/kkdai/youtube/v2"
)

type Request struct {
	VideoID string `json:"video_id"`
}

type Response struct {
	Transcript string `json:"transcript"`
	Error      string `json:"error,omitempty"`
}

func handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var request Request
	if err := json.Unmarshal([]byte(req.Body), &request); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: http.StatusBadRequest,
			Body:       fmt.Sprintf(`{"error": "Invalid request body: %s"}`, err),
		}, nil
	}

	client := youtube.Client{}
	v, err := client.GetVideo(request.VideoID)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: http.StatusInternalServerError,
			Body:       fmt.Sprintf(`{"error": "Failed to fetch video: %s"}`, err),
		}, nil
	}

	println(v.Title)

	transcript := "" // Assume a function exists to fetch transcript
	// Implement logic to parse transcript (if available)

	response := Response{Transcript: transcript}
	responseBody, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: http.StatusOK,
		Body:       string(responseBody),
	}, nil
}

func main() {
	lambda.Start(handler)
}
