package llm

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatInput struct {
	Messages    []Message `json:"messages"`
	Model       string    `json:"model"`
	Temperature *float64  `json:"temperature,omitempty"`
}

type ChatOutput struct {
	Message string `json:"message"`
	Model   string `json:"model"`
}

type OnboardingPlanInput struct {
	WeightKg            float64 `json:"weightKg"`
	HeightCm            float64 `json:"heightCm"`
	TargetWeightKg      float64 `json:"targetWeightKg"`
	TargetDurationValue int     `json:"targetDurationValue"`
	TargetDurationUnit  string  `json:"targetDurationUnit"` // week or month
	Occupation          string  `json:"occupation"`
	TrainingMode        string  `json:"trainingMode"` // GYM or BODYWEIGHT
}

type DayType string

const (
	DayTypeTraining DayType = "TRAINING_DAY"
	DayTypeCardio   DayType = "CARDIO_DAY"
	DayTypeHybrid   DayType = "HYBRID_DAY"
	DayTypeRest     DayType = "REST_DAY"
)

type MealType string

const (
	MealTypeBreakfast   MealType = "BREAKFAST"
	MealTypeLunch       MealType = "LUNCH"
	MealTypeSnack       MealType = "SNACK"
	MealTypePostWorkout MealType = "POST_WORKOUT"
	MealTypeDinner      MealType = "DINNER"
)

type WeekDayPlan struct {
	DayOfWeek int     `json:"dayOfWeek"` // 0:Sun ... 6:Sat
	DayType   DayType `json:"dayType"`
}

type MealItemPlan struct {
	Name       string   `json:"name"`
	Calories   *int     `json:"calories,omitempty"`
	Protein    *float64 `json:"protein,omitempty"`
	Fat        *float64 `json:"fat,omitempty"`
	Carbs      *float64 `json:"carbs,omitempty"`
	Quantity   *float64 `json:"quantity,omitempty"`
	Unit       *string  `json:"unit,omitempty"`
	OrderIndex int      `json:"orderIndex"`
}

type MealTemplatePlan struct {
	MealType MealType       `json:"mealType"`
	Name     string         `json:"name"`
	Items    []MealItemPlan `json:"items"`
}

type WorkoutExercisePlan struct {
	Name          string  `json:"name"`
	TargetSets    *int    `json:"targetSets,omitempty"`
	TargetRepsMin *int    `json:"targetRepsMin,omitempty"`
	TargetRepsMax *int    `json:"targetRepsMax,omitempty"`
	Notes         *string `json:"notes,omitempty"`
	OrderIndex    int     `json:"orderIndex"`
}

type WorkoutDayTypePlan struct {
	Name                 string                `json:"name"`
	CardioDurationMinute *int                  `json:"cardioDurationMinutes,omitempty"`
	CardioType           *string               `json:"cardioType,omitempty"`
	Exercises            []WorkoutExercisePlan `json:"exercises"`
}

type WorkoutDayPlan struct {
	DayOfWeek            int                   `json:"dayOfWeek"`
	DayType              DayType               `json:"dayType"`
	Name                 string                `json:"name"`
	CardioDurationMinute *int                  `json:"cardioDurationMinutes,omitempty"`
	CardioType           *string               `json:"cardioType,omitempty"`
	Exercises            []WorkoutExercisePlan `json:"exercises"`
}

type OnboardingStructuredPlanOutput struct {
	Version           string                          `json:"version"`
	Timezone          string                          `json:"timezone"`
	DayPlans          []WeekDayPlan                   `json:"dayPlans"`
	MealsByDayType    map[DayType][]MealTemplatePlan  `json:"mealsByDayType"`
	WorkoutsByDay     []WorkoutDayPlan                `json:"workoutsByDay,omitempty"`
	WorkoutsByDayType map[DayType]*WorkoutDayTypePlan `json:"workoutsByDayType,omitempty"`
}

type OnboardingPlanApplyOutput struct {
	Message string `json:"message"`
}

type OnboardingPlanDraftOutput struct {
	Message string                         `json:"message"`
	Plan    OnboardingStructuredPlanOutput `json:"plan"`
}
