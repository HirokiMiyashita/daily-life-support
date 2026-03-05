package onboardingplanapplyusecase

import (
	"context"
	"errors"
	"strings"

	"daily-life-support/apps/api/internal/llm"
	onboardingplanapplyservice "daily-life-support/apps/api/internal/service/onboardingplanapply"
	onboardingplanstructuredusecase "daily-life-support/apps/api/internal/usecase/onboardingplanstructured"
)

type Usecase interface {
	Execute(ctx context.Context, accessToken string, input llm.OnboardingPlanInput) (*llm.OnboardingPlanApplyOutput, error)
}

type usecase struct {
	structuredUsecase onboardingplanstructuredusecase.Usecase
	service           onboardingplanapplyservice.Service
	isConfigured      bool
}

func New(
	structuredUsecase onboardingplanstructuredusecase.Usecase,
	service onboardingplanapplyservice.Service,
	isConfigured bool,
) Usecase {
	return &usecase{
		structuredUsecase: structuredUsecase,
		service:           service,
		isConfigured:      isConfigured,
	}
}

func (u *usecase) Execute(ctx context.Context, accessToken string, input llm.OnboardingPlanInput) (*llm.OnboardingPlanApplyOutput, error) {
	if !u.isConfigured {
		return nil, errors.New("supabase server config is missing")
	}
	token := strings.TrimSpace(accessToken)
	if token == "" {
		return nil, errors.New("authorization bearer token is required")
	}

	authUser, err := u.service.ResolveAuthUser(ctx, token)
	if err != nil {
		return nil, err
	}

	plan, err := u.structuredUsecase.Execute(ctx, input)
	if err != nil {
		return nil, err
	}

	if err := u.service.SaveGeneratedPlan(ctx, authUser.ID, plan); err != nil {
		return nil, err
	}

	return &llm.OnboardingPlanApplyOutput{
		Message: "AIプランを作成して保存しました。開始できます。",
	}, nil
}
