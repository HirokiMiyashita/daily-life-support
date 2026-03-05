package userprofileusecase

import (
	"context"
	"errors"
	"strings"

	userprofileservice "daily-life-support/apps/api/internal/service/userprofile"
	"daily-life-support/apps/api/internal/user"
)

type Usecase interface {
	Execute(ctx context.Context, accessToken string, input user.ProfileUpsertInput) (*user.ProfileUpsertOutput, error)
}

type usecase struct {
	service      userprofileservice.Service
	isConfigured bool
}

func New(service userprofileservice.Service, isConfigured bool) Usecase {
	return &usecase{
		service:      service,
		isConfigured: isConfigured,
	}
}

func (u *usecase) Execute(ctx context.Context, accessToken string, input user.ProfileUpsertInput) (*user.ProfileUpsertOutput, error) {
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

	email := authUser.Email
	if input.Email != nil && strings.TrimSpace(*input.Email) != "" {
		normalized := strings.TrimSpace(*input.Email)
		email = &normalized
	}

	if err := u.service.SaveUserProfile(ctx, authUser.ID, email); err != nil {
		return nil, err
	}

	return &user.ProfileUpsertOutput{
		ID:    authUser.ID,
		Email: email,
	}, nil
}
