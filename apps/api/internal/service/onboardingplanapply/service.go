package onboardingplanapplyservice

import (
	"context"

	"daily-life-support/apps/api/internal/llm"
	supabaserepo "daily-life-support/apps/api/internal/repository/supabase"
	"daily-life-support/apps/api/internal/user"
)

type Service interface {
	ResolveAuthUser(ctx context.Context, accessToken string) (*user.AuthUser, error)
	SaveGeneratedPlan(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error
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

func (s *service) SaveGeneratedPlan(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error {
	return s.repository.ApplyGeneratedOnboardingPlan(ctx, userID, plan)
}
