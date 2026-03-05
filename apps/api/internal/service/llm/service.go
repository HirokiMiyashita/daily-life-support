package llmservice

import (
	"context"
	"errors"

	"daily-life-support/apps/api/internal/llm"
	"daily-life-support/apps/api/internal/repository/openai"
)

type Service interface {
	Generate(ctx context.Context, input llm.ChatInput) (*llm.ChatOutput, error)
}

type service struct {
	repo openai.Repository
}

func New(repo openai.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Generate(ctx context.Context, input llm.ChatInput) (*llm.ChatOutput, error) {
	resp, err := s.repo.Chat(ctx, input)
	if err != nil {
		return nil, err
	}
	if len(resp.Choices) == 0 {
		return nil, errors.New("no choices returned from llm")
	}

	return &llm.ChatOutput{
		Message: resp.Choices[0].Message.Content,
		Model:   input.Model,
	}, nil
}
