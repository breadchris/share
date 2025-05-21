package ai

import (
	"context"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

type AI struct {
	DB     *gorm.DB
	Client *openai.Client
}

func New(c config.AppConfig, db *gorm.DB) *AI {
	return &AI{
		DB:     db,
		Client: openai.NewClient(c.OpenAIKey),
	}
}

func WithContext(ctx context.Context) context.Context {
	return context.WithValue(ctx, "ctx_id", uuid.NewString())
}

func WithContextID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, "ctx_id", id)
}

func (c *AI) CreateChatCompletion(
	ctx context.Context,
	request openai.ChatCompletionRequest,
) (response openai.ChatCompletionResponse, err error) {
	resp, err := c.Client.CreateChatCompletion(ctx, request)
	if err != nil {
		return response, err
	}

	ctxID := ctx.Value("ctx_id").(string)
	if err := c.DB.WithContext(ctx).Save(&models.PromptContext{
		ID:        uuid.NewString(),
		ContextID: ctxID,
		Request:   &models.JSONField[openai.ChatCompletionRequest]{Data: request},
		Response:  &models.JSONField[openai.ChatCompletionResponse]{Data: response},
	}).Error; err != nil {
		return response, err
	}
	return resp, nil
}
