package chatusecase

import (
	"context"
	"errors"

	"daily-life-support/apps/api/internal/llm"
	llmservice "daily-life-support/apps/api/internal/service/llm"
)

type Usecase interface {
	Execute(ctx context.Context, input llm.ChatInput) (*llm.ChatOutput, error)
}

type usecase struct {
	service      llmservice.Service
	defaultModel string
	hasAPIKey    bool
}

func New(service llmservice.Service, defaultModel string, hasAPIKey bool) Usecase {
	return &usecase{
		service:      service,
		defaultModel: defaultModel,
		hasAPIKey:    hasAPIKey,
	}
}

func (u *usecase) Execute(ctx context.Context, input llm.ChatInput) (*llm.ChatOutput, error) {
	if !u.hasAPIKey {
		return nil, errors.New("OPENAI_API_KEY is not configured")
	}
	if len(input.Messages) == 0 {
		return nil, errors.New("messages is required")
	}
	if input.Model == "" {
		input.Model = u.defaultModel
	}
	return u.service.Generate(ctx, input)
}
