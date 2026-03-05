package onboardingplandraftservice

import (
	"context"

	"daily-life-support/apps/api/internal/llm"
	supabaserepo "daily-life-support/apps/api/internal/repository/supabase"
	"daily-life-support/apps/api/internal/user"
)

type Service interface {
	ResolveAuthUser(ctx context.Context, accessToken string) (*user.AuthUser, error)
	SaveDraft(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error
	GetDraft(ctx context.Context, userID string) (*llm.OnboardingStructuredPlanOutput, error)
	DeleteDraft(ctx context.Context, userID string) error
	ApplyGeneratedPlan(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error
}

type service struct {
	repository supabaserepo.Repository
}

func New(repository supabaserepo.Repository) Service {
	return &service{repository: repository}
}

func (s *service) ResolveAuthUser(ctx context.Context, accessToken string) (*user.AuthUser, error) {
	return s.repository.AuthUser(ctx, accessToken)
}

func (s *service) SaveDraft(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error {
	return s.repository.UpsertOnboardingPlanDraft(ctx, userID, plan)
}

func (s *service) GetDraft(ctx context.Context, userID string) (*llm.OnboardingStructuredPlanOutput, error) {
	return s.repository.GetOnboardingPlanDraft(ctx, userID)
}

func (s *service) DeleteDraft(ctx context.Context, userID string) error {
	return s.repository.DeleteOnboardingPlanDraft(ctx, userID)
}

func (s *service) ApplyGeneratedPlan(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error {
	return s.repository.ApplyGeneratedOnboardingPlan(ctx, userID, plan)
}
