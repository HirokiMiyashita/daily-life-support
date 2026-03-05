package main

import (
	"errors"
	"log"
	"net/http"
	"time"

	"daily-life-support/apps/api/internal/config"
	_ "daily-life-support/apps/api/internal/docs"
	httphandler "daily-life-support/apps/api/internal/handler/http"
	"daily-life-support/apps/api/internal/middleware"
	"daily-life-support/apps/api/internal/repository/openai"
	supabaserepository "daily-life-support/apps/api/internal/repository/supabase"
	llmservice "daily-life-support/apps/api/internal/service/llm"
	onboardingplanapplyservice "daily-life-support/apps/api/internal/service/onboardingplanapply"
	onboardingplandraftservice "daily-life-support/apps/api/internal/service/onboardingplandraft"
	userprofileservice "daily-life-support/apps/api/internal/service/userprofile"
	chatusecase "daily-life-support/apps/api/internal/usecase/chat"
	onboardingplanusecase "daily-life-support/apps/api/internal/usecase/onboardingplan"
	onboardingplanapplyusecase "daily-life-support/apps/api/internal/usecase/onboardingplanapply"
	onboardingplandraftusecase "daily-life-support/apps/api/internal/usecase/onboardingplandraft"
	onboardingplanstructuredusecase "daily-life-support/apps/api/internal/usecase/onboardingplanstructured"
	userprofileusecase "daily-life-support/apps/api/internal/usecase/userprofile"
	httpSwagger "github.com/swaggo/http-swagger"
)

// @title Daily Life Support API
// @version 1.0
// @description LLM gateway API for the mobile app.
// @BasePath /
func main() {
	cfg := config.Load()

	openAIRepo := openai.NewClient(cfg.OpenAIBaseURL, cfg.OpenAIAPIKey)
	chatService := llmservice.New(openAIRepo)
	chatUsecase := chatusecase.New(chatService, cfg.DefaultModel, cfg.OpenAIAPIKey != "")
	onboardingUsecase := onboardingplanusecase.New(chatService, cfg.DefaultModel, cfg.OpenAIAPIKey != "")
	onboardingStructuredUsecase := onboardingplanstructuredusecase.New(chatService, cfg.DefaultModel, cfg.OpenAIAPIKey != "")
	supabaseRepo := supabaserepository.NewClient(cfg.SupabaseURL, cfg.SupabaseAnonKey, cfg.SupabaseServiceRoleKey)
	onboardingPlanDraftService := onboardingplandraftservice.New(supabaseRepo)
	onboardingPlanDraftUsecase := onboardingplandraftusecase.New(
		onboardingStructuredUsecase,
		onboardingPlanDraftService,
		cfg.SupabaseURL != "" && cfg.SupabaseAnonKey != "" && cfg.SupabaseServiceRoleKey != "",
	)
	onboardingPlanApplyService := onboardingplanapplyservice.New(supabaseRepo)
	onboardingPlanApplyUsecase := onboardingplanapplyusecase.New(
		onboardingStructuredUsecase,
		onboardingPlanApplyService,
		cfg.SupabaseURL != "" && cfg.SupabaseAnonKey != "" && cfg.SupabaseServiceRoleKey != "",
	)
	userProfileService := userprofileservice.New(supabaseRepo)
	userProfileUsecase := userprofileusecase.New(userProfileService, cfg.SupabaseURL != "" && cfg.SupabaseAnonKey != "" && cfg.SupabaseServiceRoleKey != "")
	handler := httphandler.New(chatUsecase, onboardingPlanDraftUsecase, onboardingPlanApplyUsecase, onboardingUsecase, onboardingStructuredUsecase, userProfileUsecase)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", handler.Health)
	mux.Handle("/v1/llm/chat", middleware.WithCORS(http.HandlerFunc(handler.Chat)))
	mux.Handle("/v1/llm/onboarding-plan-draft", middleware.WithCORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			handler.DeleteOnboardingPlanDraft(w, r)
			return
		}
		handler.OnboardingPlanDraft(w, r)
	})))
	mux.Handle("/v1/llm/onboarding-plan-draft/apply", middleware.WithCORS(http.HandlerFunc(handler.ApplyOnboardingPlanDraft)))
	mux.Handle("/v1/llm/onboarding-plan-apply", middleware.WithCORS(http.HandlerFunc(handler.OnboardingPlanApply)))
	mux.Handle("/v1/llm/onboarding-plan", middleware.WithCORS(http.HandlerFunc(handler.OnboardingPlan)))
	mux.Handle("/v1/llm/onboarding-plan-structured", middleware.WithCORS(http.HandlerFunc(handler.OnboardingPlanStructured)))
	mux.Handle("/v1/users/profile", middleware.WithCORS(http.HandlerFunc(handler.UpsertUserProfile)))
	mux.Handle("/swagger/", httpSwagger.WrapHandler)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           middleware.RequestLogger(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("go api is listening on :%s", cfg.Port)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server failed: %v", err)
	}
}
