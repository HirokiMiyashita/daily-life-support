package httphandler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"daily-life-support/apps/api/internal/llm"
	chatusecase "daily-life-support/apps/api/internal/usecase/chat"
	exercisereferencevideousecase "daily-life-support/apps/api/internal/usecase/exercisereferencevideo"
	onboardingplanapplyusecase "daily-life-support/apps/api/internal/usecase/onboardingplanapply"
	onboardingplandraftusecase "daily-life-support/apps/api/internal/usecase/onboardingplandraft"
	onboardingplanstructuredusecase "daily-life-support/apps/api/internal/usecase/onboardingplanstructured"
	userprofileusecase "daily-life-support/apps/api/internal/usecase/userprofile"
	"daily-life-support/apps/api/internal/user"
)

type Handler struct {
	chatUsecase                     chatusecase.Usecase
	exerciseReferenceVideoUsecase   exercisereferencevideousecase.Usecase
	onboardingPlanDraftUsecase      onboardingplandraftusecase.Usecase
	onboardingPlanApplyUsecase      onboardingplanapplyusecase.Usecase
	onboardingPlanStructuredUsecase onboardingplanstructuredusecase.Usecase
	userProfileUsecase              userprofileusecase.Usecase
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func New(
	chatUsecase chatusecase.Usecase,
	exerciseReferenceVideoUsecase exercisereferencevideousecase.Usecase,
	onboardingPlanDraftUsecase onboardingplandraftusecase.Usecase,
	onboardingPlanApplyUsecase onboardingplanapplyusecase.Usecase,
	onboardingPlanStructuredUsecase onboardingplanstructuredusecase.Usecase,
	userProfileUsecase userprofileusecase.Usecase,
) *Handler {
	return &Handler{
		chatUsecase:                     chatUsecase,
		exerciseReferenceVideoUsecase:   exerciseReferenceVideoUsecase,
		onboardingPlanDraftUsecase:      onboardingPlanDraftUsecase,
		onboardingPlanApplyUsecase:      onboardingPlanApplyUsecase,
		onboardingPlanStructuredUsecase: onboardingPlanStructuredUsecase,
		userProfileUsecase:              userProfileUsecase,
	}
}

// OnboardingPlanDraft godoc
// @Summary Onboarding draft create
// @Description オンボーディング入力値から構造化プランを生成しDraft保存
// @Tags llm
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer access token"
// @Param request body llm.OnboardingPlanInput true "Onboarding draft request"
// @Success 200 {object} llm.OnboardingPlanDraftOutput
// @Failure 400 {object} ErrorResponse
// @Failure 502 {object} ErrorResponse
// @Router /v1/llm/onboarding-plan-draft [post]
func (h *Handler) OnboardingPlanDraft(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	accessToken := extractBearerToken(r.Header.Get("Authorization"))

	var req llm.OnboardingPlanInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	result, err := h.onboardingPlanDraftUsecase.Create(ctx, accessToken, req)
	if err != nil {
		status := http.StatusBadGateway
		switch {
		case strings.Contains(err.Error(), "OPENAI_API_KEY is not configured"),
			strings.Contains(err.Error(), "weight, height and targetWeight must be positive"),
			strings.Contains(err.Error(), "targetDurationValue must be positive"),
			strings.Contains(err.Error(), "targetDurationUnit must be week or month"),
			strings.Contains(err.Error(), "occupation is required"),
			strings.Contains(err.Error(), "trainingMode must be GYM or BODYWEIGHT"),
			strings.Contains(err.Error(), "failed to parse structured onboarding plan json"),
			strings.Contains(err.Error(), "authorization bearer token is required"),
			strings.Contains(err.Error(), "supabase server config is missing"),
			strings.Contains(err.Error(), "structured onboarding plan validation failed"):
			status = http.StatusBadRequest
		}
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// ApplyOnboardingPlanDraft godoc
// @Summary Onboarding draft apply
// @Description 保存済みDraftを実DBに反映
// @Tags llm
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer access token"
// @Success 200 {object} llm.OnboardingPlanApplyOutput
// @Failure 400 {object} ErrorResponse
// @Failure 502 {object} ErrorResponse
// @Router /v1/llm/onboarding-plan-draft/apply [post]
func (h *Handler) ApplyOnboardingPlanDraft(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	accessToken := extractBearerToken(r.Header.Get("Authorization"))

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	result, err := h.onboardingPlanDraftUsecase.Apply(ctx, accessToken)
	if err != nil {
		status := http.StatusBadGateway
		switch {
		case strings.Contains(err.Error(), "authorization bearer token is required"),
			strings.Contains(err.Error(), "supabase server config is missing"),
			strings.Contains(err.Error(), "onboarding plan draft not found"):
			status = http.StatusBadRequest
		}
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// DeleteOnboardingPlanDraft godoc
// @Summary Onboarding draft delete
// @Description 保存済みDraftを削除
// @Tags llm
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer access token"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 502 {object} ErrorResponse
// @Router /v1/llm/onboarding-plan-draft [delete]
func (h *Handler) DeleteOnboardingPlanDraft(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	accessToken := extractBearerToken(r.Header.Get("Authorization"))

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	if err := h.onboardingPlanDraftUsecase.Delete(ctx, accessToken); err != nil {
		status := http.StatusBadGateway
		switch {
		case strings.Contains(err.Error(), "authorization bearer token is required"),
			strings.Contains(err.Error(), "supabase server config is missing"):
			status = http.StatusBadRequest
		}
		writeError(w, status, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "draft deleted"})
}

// Health godoc
// @Summary Health check
// @Description APIのヘルスチェック
// @Tags health
// @Produce json
// @Success 200 {object} map[string]string
// @Router /health [get]
func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}

// Chat godoc
// @Summary LLM chat
// @Description LLMにチャットリクエストを送信
// @Tags llm
// @Accept json
// @Produce json
// @Param request body llm.ChatInput true "Chat request"
// @Success 200 {object} llm.ChatOutput
// @Failure 400 {object} ErrorResponse
// @Failure 502 {object} ErrorResponse
// @Router /v1/llm/chat [post]
func (h *Handler) Chat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req llm.ChatInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	result, err := h.chatUsecase.Execute(ctx, req)
	if err != nil {
		status := http.StatusBadGateway
		if err.Error() == "messages is required" || err.Error() == "OPENAI_API_KEY is not configured" {
			status = http.StatusBadRequest
		}
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// ExerciseReferenceVideo godoc
// @Summary Exercise reference video
// @Description 種目名から日本語向けのYouTube参考動画を1件返す
// @Tags llm
// @Accept json
// @Produce json
// @Param request body llm.ExerciseReferenceVideoInput true "Exercise reference video request"
// @Success 200 {object} llm.ExerciseReferenceVideoOutput
// @Failure 400 {object} ErrorResponse
// @Failure 502 {object} ErrorResponse
// @Router /v1/llm/exercise-reference-video [post]
func (h *Handler) ExerciseReferenceVideo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req llm.ExerciseReferenceVideoInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	result, err := h.exerciseReferenceVideoUsecase.Execute(ctx, req)
	if err != nil {
		status := http.StatusBadGateway
		switch {
		case strings.Contains(err.Error(), "OPENAI_API_KEY is not configured"),
			strings.Contains(err.Error(), "exerciseName is required"),
			strings.Contains(err.Error(), "failed to parse exercise reference video json"),
			strings.Contains(err.Error(), "youtube url"),
			strings.Contains(err.Error(), "invalid youtube video id"):
			status = http.StatusBadRequest
		}
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// OnboardingPlanStructured godoc
// @Summary Onboarding structured plan
// @Description オンボーディング入力値からDB投入用の構造化プランJSONを生成
// @Tags llm
// @Accept json
// @Produce json
// @Param request body llm.OnboardingPlanInput true "Onboarding structured plan request"
// @Success 200 {object} llm.OnboardingStructuredPlanOutput
// @Failure 400 {object} ErrorResponse
// @Failure 502 {object} ErrorResponse
// @Router /v1/llm/onboarding-plan-structured [post]
func (h *Handler) OnboardingPlanStructured(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req llm.OnboardingPlanInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	result, err := h.onboardingPlanStructuredUsecase.Execute(ctx, req)
	if err != nil {
		status := http.StatusBadGateway
		switch {
		case strings.Contains(err.Error(), "OPENAI_API_KEY is not configured"),
			strings.Contains(err.Error(), "weight, height and targetWeight must be positive"),
			strings.Contains(err.Error(), "targetDurationValue must be positive"),
			strings.Contains(err.Error(), "targetDurationUnit must be week or month"),
			strings.Contains(err.Error(), "occupation is required"),
			strings.Contains(err.Error(), "trainingMode must be GYM or BODYWEIGHT"),
			strings.Contains(err.Error(), "failed to parse structured onboarding plan json"):
			status = http.StatusBadRequest
		}
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// OnboardingPlanApply godoc
// @Summary Onboarding plan generate and apply
// @Description オンボーディング入力値からAIプランを生成してDBに保存
// @Tags llm
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer access token"
// @Param request body llm.OnboardingPlanInput true "Onboarding plan apply request"
// @Success 200 {object} llm.OnboardingPlanApplyOutput
// @Failure 400 {object} ErrorResponse
// @Failure 502 {object} ErrorResponse
// @Router /v1/llm/onboarding-plan-apply [post]
func (h *Handler) OnboardingPlanApply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	accessToken := extractBearerToken(r.Header.Get("Authorization"))

	var req llm.OnboardingPlanInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	result, err := h.onboardingPlanApplyUsecase.Execute(ctx, accessToken, req)
	if err != nil {
		status := http.StatusBadGateway
		switch {
		case strings.Contains(err.Error(), "OPENAI_API_KEY is not configured"),
			strings.Contains(err.Error(), "weight, height and targetWeight must be positive"),
			strings.Contains(err.Error(), "targetDurationValue must be positive"),
			strings.Contains(err.Error(), "targetDurationUnit must be week or month"),
			strings.Contains(err.Error(), "occupation is required"),
			strings.Contains(err.Error(), "trainingMode must be GYM or BODYWEIGHT"),
			strings.Contains(err.Error(), "failed to parse structured onboarding plan json"),
			strings.Contains(err.Error(), "authorization bearer token is required"),
			strings.Contains(err.Error(), "supabase server config is missing"):
			status = http.StatusBadRequest
		}
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// UpsertUserProfile godoc
// @Summary Upsert user profile
// @Description Supabase access tokenを使ってusersテーブルをupsert
// @Tags users
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer access token"
// @Param request body user.ProfileUpsertInput false "User profile payload"
// @Success 200 {object} user.ProfileUpsertOutput
// @Failure 400 {object} ErrorResponse
// @Failure 502 {object} ErrorResponse
// @Router /v1/users/profile [post]
func (h *Handler) UpsertUserProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	accessToken := extractBearerToken(r.Header.Get("Authorization"))
	var req user.ProfileUpsertInput
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&req)
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	result, err := h.userProfileUsecase.Execute(ctx, accessToken, req)
	if err != nil {
		status := http.StatusBadGateway
		switch err.Error() {
		case "authorization bearer token is required", "supabase server config is missing":
			status = http.StatusBadRequest
		}
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func extractBearerToken(authorization string) string {
	if authorization == "" {
		return ""
	}
	parts := strings.SplitN(authorization, " ", 2)
	if len(parts) != 2 {
		return ""
	}
	if !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
