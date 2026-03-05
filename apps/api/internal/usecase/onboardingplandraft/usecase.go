package onboardingplandraftusecase

import (
	"context"
	"errors"
	"strings"

	"daily-life-support/apps/api/internal/llm"
	onboardingplandraftservice "daily-life-support/apps/api/internal/service/onboardingplandraft"
	onboardingplanstructuredusecase "daily-life-support/apps/api/internal/usecase/onboardingplanstructured"
	"daily-life-support/apps/api/internal/user"
)

type Usecase interface {
	Create(ctx context.Context, accessToken string, input llm.OnboardingPlanInput) (*llm.OnboardingPlanDraftOutput, error)
	Apply(ctx context.Context, accessToken string) (*llm.OnboardingPlanApplyOutput, error)
	Delete(ctx context.Context, accessToken string) error
}

type usecase struct {
	structuredUsecase onboardingplanstructuredusecase.Usecase
	service           onboardingplandraftservice.Service
	isConfigured      bool
}

func New(
	structuredUsecase onboardingplanstructuredusecase.Usecase,
	service onboardingplandraftservice.Service,
	isConfigured bool,
) Usecase {
	return &usecase{
		structuredUsecase: structuredUsecase,
		service:           service,
		isConfigured:      isConfigured,
	}
}

func (u *usecase) Create(ctx context.Context, accessToken string, input llm.OnboardingPlanInput) (*llm.OnboardingPlanDraftOutput, error) {
	authUser, err := u.resolveAuthUser(ctx, accessToken)
	if err != nil {
		return nil, err
	}
	plan, err := u.structuredUsecase.Execute(ctx, input)
	if err != nil {
		return nil, err
	}
	if err := u.service.SaveDraft(ctx, authUser.ID, plan); err != nil {
		return nil, err
	}
	return &llm.OnboardingPlanDraftOutput{
		Message: "AIプランの下書きを保存しました。",
		Plan:    *plan,
	}, nil
}

func (u *usecase) Apply(ctx context.Context, accessToken string) (*llm.OnboardingPlanApplyOutput, error) {
	authUser, err := u.resolveAuthUser(ctx, accessToken)
	if err != nil {
		return nil, err
	}
	draft, err := u.service.GetDraft(ctx, authUser.ID)
	if err != nil {
		return nil, err
	}
	if err := u.service.ApplyGeneratedPlan(ctx, authUser.ID, draft); err != nil {
		return nil, err
	}
	if err := u.service.DeleteDraft(ctx, authUser.ID); err != nil {
		return nil, err
	}
	return &llm.OnboardingPlanApplyOutput{
		Message: "下書きプランを反映しました。",
	}, nil
}

func (u *usecase) Delete(ctx context.Context, accessToken string) error {
	authUser, err := u.resolveAuthUser(ctx, accessToken)
	if err != nil {
		return err
	}
	return u.service.DeleteDraft(ctx, authUser.ID)
}

func (u *usecase) resolveAuthUser(ctx context.Context, accessToken string) (*user.AuthUser, error) {
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
	return authUser, nil
}
