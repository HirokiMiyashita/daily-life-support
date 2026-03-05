package userprofileservice

import (
	"context"

	supabaserepo "daily-life-support/apps/api/internal/repository/supabase"
	"daily-life-support/apps/api/internal/user"
)

type Service interface {
	ResolveAuthUser(ctx context.Context, accessToken string) (*user.AuthUser, error)
	SaveUserProfile(ctx context.Context, userID string, email *string) error
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

func (s *service) SaveUserProfile(ctx context.Context, userID string, email *string) error {
	return s.repository.UpsertUser(ctx, userID, email)
}
