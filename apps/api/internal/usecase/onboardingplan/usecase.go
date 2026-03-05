package onboardingplanusecase

import (
	"context"
	"errors"
	"strings"

	"daily-life-support/apps/api/internal/llm"
	"daily-life-support/apps/api/internal/prompt"
	llmservice "daily-life-support/apps/api/internal/service/llm"
)

type Usecase interface {
	Execute(ctx context.Context, input llm.OnboardingPlanInput) (*llm.ChatOutput, error)
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

func (u *usecase) Execute(ctx context.Context, input llm.OnboardingPlanInput) (*llm.ChatOutput, error) {
	if !u.hasAPIKey {
		return nil, errors.New("OPENAI_API_KEY is not configured")
	}
	if input.WeightKg <= 0 || input.HeightCm <= 0 || input.TargetWeightKg <= 0 {
		return nil, errors.New("weight, height and targetWeight must be positive")
	}
	if input.TargetDurationValue <= 0 {
		return nil, errors.New("targetDurationValue must be positive")
	}
	if input.TargetDurationUnit != "week" && input.TargetDurationUnit != "month" {
		return nil, errors.New("targetDurationUnit must be week or month")
	}
	if strings.TrimSpace(input.Occupation) == "" {
		return nil, errors.New("occupation is required")
	}
	if input.TrainingMode != "GYM" && input.TrainingMode != "BODYWEIGHT" {
		return nil, errors.New("trainingMode must be GYM or BODYWEIGHT")
	}

	req := llm.ChatInput{
		Model: u.defaultModel,
		Messages: []llm.Message{
			{
				Role:    "user",
				Content: prompt.BuildOnboardingSuggestion(input),
			},
		},
	}

	return u.service.Generate(ctx, req)
}
