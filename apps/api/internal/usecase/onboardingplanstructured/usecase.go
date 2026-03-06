package onboardingplanstructuredusecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"

	"daily-life-support/apps/api/internal/llm"
	"daily-life-support/apps/api/internal/prompt"
	llmservice "daily-life-support/apps/api/internal/service/llm"
)

type Usecase interface {
	Execute(ctx context.Context, input llm.OnboardingPlanInput) (*llm.OnboardingStructuredPlanOutput, error)
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

func (u *usecase) Execute(ctx context.Context, input llm.OnboardingPlanInput) (*llm.OnboardingStructuredPlanOutput, error) {
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

	basePrompt := prompt.BuildOnboardingStructuredPlanJSONGym(input)
	if input.TrainingMode == "BODYWEIGHT" {
		basePrompt = prompt.BuildOnboardingStructuredPlanJSONBodyweight(input)
	}
	req := llm.ChatInput{
		Model: u.defaultModel,
		Messages: []llm.Message{
			{
				Role:    "user",
				Content: basePrompt,
			},
		},
	}

	result, err := u.service.Generate(ctx, req)
	if err != nil {
		log.Printf("onboarding structured plan generate failed: %v", err)
		return nil, err
	}
	log.Printf("onboarding structured plan generated: model=%s message_chars=%d", result.Model, len(result.Message))

	parsed, parseErr := parseAndValidateStructuredPlan(result.Message, input.TrainingMode)
	if parseErr == nil {
		log.Printf("onboarding structured plan parsed and validated successfully")
		return parsed, nil
	}
	log.Printf("onboarding structured plan parse/validate failed: %v", parseErr)

	// Retry once with explicit correction instructions.
	retryPrompt := basePrompt + "\n\n前回の出力は要件違反でした。次のエラーを必ず修正して、JSONのみを返してください: " + parseErr.Error()
	retryReq := llm.ChatInput{
		Model: u.defaultModel,
		Messages: []llm.Message{
			{
				Role:    "user",
				Content: retryPrompt,
			},
		},
	}
	retryResult, retryErr := u.service.Generate(ctx, retryReq)
	if retryErr != nil {
		log.Printf("onboarding structured plan retry generate failed: %v", retryErr)
		return nil, retryErr
	}
	log.Printf("onboarding structured plan retry generated: model=%s message_chars=%d", retryResult.Model, len(retryResult.Message))

	retryParsed, retryParseErr := parseAndValidateStructuredPlan(retryResult.Message, input.TrainingMode)
	if retryParseErr != nil {
		log.Printf("onboarding structured plan retry parse/validate failed: %v", retryParseErr)
		return nil, retryParseErr
	}
	log.Printf("onboarding structured plan retry parsed and validated successfully")
	return retryParsed, nil
}

func parseAndValidateStructuredPlan(rawMessage string, trainingMode string) (*llm.OnboardingStructuredPlanOutput, error) {
	raw := strings.TrimSpace(rawMessage)
	raw = strings.TrimPrefix(raw, "```json")
	raw = strings.TrimPrefix(raw, "```")
	raw = strings.TrimSuffix(raw, "```")
	raw = strings.TrimSpace(raw)

	var parsed llm.OnboardingStructuredPlanOutput
	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		return nil, errors.New("failed to parse structured onboarding plan json: " + err.Error())
	}
	if err := validateStructuredPlan(&parsed, trainingMode); err != nil {
		return nil, errors.New("structured onboarding plan validation failed: " + err.Error())
	}
	return &parsed, nil
}

func validateStructuredPlan(plan *llm.OnboardingStructuredPlanOutput, trainingMode string) error {
	if plan == nil {
		return errors.New("plan is nil")
	}
	if len(plan.DayPlans) != 7 {
		return fmt.Errorf("dayPlans must contain 7 items, got %d", len(plan.DayPlans))
	}

	requiredByDayType := map[llm.DayType][]llm.MealType{
		llm.DayTypeTraining: {llm.MealTypeBreakfast, llm.MealTypeLunch, llm.MealTypeSnack, llm.MealTypePostWorkout, llm.MealTypeDinner},
		llm.DayTypeCardio:   {llm.MealTypeBreakfast, llm.MealTypeLunch, llm.MealTypeSnack, llm.MealTypePostWorkout, llm.MealTypeDinner},
		llm.DayTypeHybrid:   {llm.MealTypeBreakfast, llm.MealTypeLunch, llm.MealTypeSnack, llm.MealTypePostWorkout, llm.MealTypeDinner},
		llm.DayTypeRest:     {llm.MealTypeBreakfast, llm.MealTypeLunch, llm.MealTypeDinner},
	}

	for dayType, requiredMeals := range requiredByDayType {
		templates, ok := plan.MealsByDayType[dayType]
		if !ok {
			return fmt.Errorf("mealsByDayType.%s is missing", dayType)
		}
		if len(templates) == 0 {
			return fmt.Errorf("mealsByDayType.%s must not be empty", dayType)
		}

		existing := map[llm.MealType]bool{}
		for _, tmpl := range templates {
			existing[tmpl.MealType] = true
			if len(tmpl.Items) == 0 {
				return fmt.Errorf("meal template %s in %s must include at least one item", tmpl.MealType, dayType)
			}
		}
		for _, mealType := range requiredMeals {
			if !existing[mealType] {
				return fmt.Errorf("mealsByDayType.%s must include %s", dayType, mealType)
			}
		}
	}

	if len(plan.WorkoutsByDay) == 0 {
		// Backward compatibility for old shape; derive from workoutsByDayType.
		for _, day := range plan.DayPlans {
			byType, ok := plan.WorkoutsByDayType[day.DayType]
			if !ok || byType == nil {
				continue
			}
			plan.WorkoutsByDay = append(plan.WorkoutsByDay, llm.WorkoutDayPlan{
				DayOfWeek:            day.DayOfWeek,
				DayType:              day.DayType,
				Name:                 byType.Name,
				CardioDurationMinute: byType.CardioDurationMinute,
				CardioType:           byType.CardioType,
				Exercises:            byType.Exercises,
			})
		}
	}

	workoutByDay := map[int]llm.WorkoutDayPlan{}
	for _, workout := range plan.WorkoutsByDay {
		if workout.DayOfWeek < 0 || workout.DayOfWeek > 6 {
			return fmt.Errorf("workoutsByDay dayOfWeek must be 0-6, got %d", workout.DayOfWeek)
		}
		if _, exists := workoutByDay[workout.DayOfWeek]; exists {
			return fmt.Errorf("workoutsByDay must not include duplicate dayOfWeek %d", workout.DayOfWeek)
		}
		workoutByDay[workout.DayOfWeek] = workout
	}

	for _, day := range plan.DayPlans {
		workout, exists := workoutByDay[day.DayOfWeek]
		if day.DayType == llm.DayTypeRest {
			continue
		}
		if !exists {
			return fmt.Errorf("workoutsByDay must include non-rest day %d", day.DayOfWeek)
		}
		if workout.DayType != day.DayType {
			return fmt.Errorf("workoutsByDay dayType mismatch at dayOfWeek %d", day.DayOfWeek)
		}
		if day.DayType == llm.DayTypeTraining {
			if workout.CardioDurationMinute != nil {
				return fmt.Errorf("training day %d must not include cardio duration", day.DayOfWeek)
			}
			if len(workout.Exercises) == 0 {
				return fmt.Errorf("training day %d must include at least one exercise", day.DayOfWeek)
			}
			if isCoreOnlyWorkout(workout.Exercises) {
				return fmt.Errorf("training day %d must include resistance exercise beyond core-only workout", day.DayOfWeek)
			}
			if trainingMode == "GYM" && !hasGymStyleExercise(workout.Exercises) {
				return fmt.Errorf("training day %d must include at least one gym-style exercise for GYM mode", day.DayOfWeek)
			}
		}
		if day.DayType == llm.DayTypeCardio && workout.CardioDurationMinute == nil && len(workout.Exercises) == 0 {
			return fmt.Errorf("cardio day %d must include cardio duration or exercises", day.DayOfWeek)
		}
		if day.DayType == llm.DayTypeHybrid {
			if workout.CardioDurationMinute == nil || len(workout.Exercises) == 0 {
				return fmt.Errorf("hybrid day %d must include cardio duration and exercises", day.DayOfWeek)
			}
			if isCoreOnlyWorkout(workout.Exercises) {
				return fmt.Errorf("hybrid day %d must include resistance exercise beyond core-only workout", day.DayOfWeek)
			}
			if trainingMode == "GYM" && !hasGymStyleExercise(workout.Exercises) {
				return fmt.Errorf("hybrid day %d must include at least one gym-style exercise for GYM mode", day.DayOfWeek)
			}
		}
	}

	return nil
}

func isCoreOnlyWorkout(exercises []llm.WorkoutExercisePlan) bool {
	if len(exercises) == 0 {
		return false
	}

	coreKeywords := []string{
		"プランク", "サイドプランク", "クランチ", "レッグレイズ", "体幹",
		"plank", "crunch", "dead bug", "hollow hold", "core",
	}

	for _, ex := range exercises {
		name := strings.ToLower(strings.TrimSpace(ex.Name))
		isCore := false
		for _, keyword := range coreKeywords {
			if strings.Contains(name, strings.ToLower(keyword)) {
				isCore = true
				break
			}
		}
		if !isCore {
			return false
		}
	}
	return true
}

func hasGymStyleExercise(exercises []llm.WorkoutExercisePlan) bool {
	gymKeywords := []string{
		"ベンチプレス", "ラットプルダウン", "レッグプレス", "シーテッドロー", "ショルダープレス",
		"ダンベル", "バーベル", "ケーブル", "マシン", "スミスマシン",
		"bench press", "lat pulldown", "leg press", "seated row", "shoulder press",
		"dumbbell", "barbell", "cable", "machine", "smith",
	}

	for _, ex := range exercises {
		name := strings.ToLower(strings.TrimSpace(ex.Name))
		for _, keyword := range gymKeywords {
			if strings.Contains(name, strings.ToLower(keyword)) {
				return true
			}
		}
	}
	return false
}
