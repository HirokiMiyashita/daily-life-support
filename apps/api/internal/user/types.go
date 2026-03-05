package user

type ProfileUpsertInput struct {
	Email *string `json:"email,omitempty"`
}

type ProfileUpsertOutput struct {
	ID    string  `json:"id"`
	Email *string `json:"email,omitempty"`
}

type AuthUser struct {
	ID    string  `json:"id"`
	Email *string `json:"email"`
}
