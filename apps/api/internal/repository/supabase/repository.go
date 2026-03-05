package supabase

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"daily-life-support/apps/api/internal/llm"
	"daily-life-support/apps/api/internal/user"
)

type Repository interface {
	AuthUser(ctx context.Context, accessToken string) (*user.AuthUser, error)
	UpsertUser(ctx context.Context, userID string, email *string) error
	ApplyGeneratedOnboardingPlan(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error
	UpsertOnboardingPlanDraft(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error
	GetOnboardingPlanDraft(ctx context.Context, userID string) (*llm.OnboardingStructuredPlanOutput, error)
	DeleteOnboardingPlanDraft(ctx context.Context, userID string) error
}

type Client struct {
	baseURL        string
	anonKey        string
	serviceRoleKey string
	http           *http.Client
}

func NewClient(baseURL, anonKey, serviceRoleKey string) *Client {
	return &Client{
		baseURL:        baseURL,
		anonKey:        anonKey,
		serviceRoleKey: serviceRoleKey,
		http:           &http.Client{Timeout: 20 * time.Second},
	}
}

func (c *Client) AuthUser(ctx context.Context, accessToken string) (*user.AuthUser, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/auth/v1/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("apikey", c.anonKey)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return nil, errors.New("supabase auth user request failed: " + string(raw))
	}

	var parsed user.AuthUser
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, err
	}
	if parsed.ID == "" {
		return nil, errors.New("supabase auth user id is empty")
	}
	return &parsed, nil
}

func (c *Client) UpsertUser(ctx context.Context, userID string, email *string) error {
	payload := []map[string]any{
		{
			"id":    userID,
			"email": email,
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	params := url.Values{}
	params.Set("on_conflict", "id")
	endpoint := c.baseURL + "/rest/v1/users?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("apikey", c.serviceRoleKey)
	req.Header.Set("Authorization", "Bearer "+c.serviceRoleKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "resolution=merge-duplicates,return=minimal")

	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return errors.New("supabase users upsert failed: " + string(raw))
	}
	return nil
}

func (c *Client) UpsertOnboardingPlanDraft(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error {
	if plan == nil {
		return errors.New("plan is nil")
	}
	planJSON, err := toMap(plan)
	if err != nil {
		return err
	}
	payload := []map[string]any{
		{
			"user_id":    userID,
			"plan_json":  planJSON,
			"updated_at": time.Now().UTC().Format(time.RFC3339),
		},
	}
	_, err = c.requestJSON(
		ctx,
		http.MethodPost,
		"/rest/v1/onboarding_plan_drafts",
		url.Values{"on_conflict": []string{"user_id"}},
		payload,
		true,
		"resolution=merge-duplicates,return=minimal",
	)
	return err
}

func (c *Client) GetOnboardingPlanDraft(ctx context.Context, userID string) (*llm.OnboardingStructuredPlanOutput, error) {
	raw, err := c.requestJSON(
		ctx,
		http.MethodGet,
		"/rest/v1/onboarding_plan_drafts",
		url.Values{
			"select":  []string{"plan_json"},
			"user_id": []string{"eq." + userID},
			"limit":   []string{"1"},
		},
		nil,
		true,
		"",
	)
	if err != nil {
		return nil, err
	}
	var rows []struct {
		Plan llm.OnboardingStructuredPlanOutput `json:"plan_json"`
	}
	if err := json.Unmarshal(raw, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, errors.New("onboarding plan draft not found")
	}
	return &rows[0].Plan, nil
}

func (c *Client) DeleteOnboardingPlanDraft(ctx context.Context, userID string) error {
	_, err := c.requestJSON(
		ctx,
		http.MethodDelete,
		"/rest/v1/onboarding_plan_drafts",
		url.Values{
			"user_id": []string{"eq." + userID},
		},
		nil,
		true,
		"return=minimal",
	)
	return err
}

type dayPlanRecord struct {
	ID      string      `json:"id"`
	UserID  string      `json:"user_id"`
	Date    string      `json:"date"`
	DayType llm.DayType `json:"day_type"`
}

type mealTemplateRecord struct {
	ID       string       `json:"id"`
	MealType llm.MealType `json:"meal_type"`
}

type workoutTemplateRecord struct {
	ID        string `json:"id"`
	DayOfWeek *int   `json:"day_of_week"`
}

type exerciseTemplateRecord struct {
	ID string `json:"id"`
}

func (c *Client) ApplyGeneratedOnboardingPlan(ctx context.Context, userID string, plan *llm.OnboardingStructuredPlanOutput) error {
	if plan == nil {
		return errors.New("plan is nil")
	}
	if len(plan.DayPlans) != 7 {
		return errors.New("dayPlans must contain 7 items")
	}

	monday := currentWeekMonday()
	dayPlansPayload := make([]map[string]any, 0, len(plan.DayPlans))
	dayPlanByWeekday := map[int]dayPlanRecord{}
	for _, day := range plan.DayPlans {
		if day.DayOfWeek < 0 || day.DayOfWeek > 6 {
			return errors.New("dayOfWeek must be between 0 and 6")
		}
		date := monday.AddDate(0, 0, weekdayOffsetFromMonday(day.DayOfWeek)).Format("2006-01-02")
		dayPlansPayload = append(dayPlansPayload, map[string]any{
			"user_id":  userID,
			"date":     date,
			"day_type": day.DayType,
		})
	}

	dayPlanQuery := url.Values{}
	dayPlanQuery.Set("on_conflict", "user_id,date")
	dayPlansRaw, err := c.requestJSON(ctx, http.MethodPost, "/rest/v1/day_plans", dayPlanQuery, dayPlansPayload, true, "resolution=merge-duplicates,return=representation")
	if err != nil {
		return err
	}
	var dayPlans []dayPlanRecord
	if err := json.Unmarshal(dayPlansRaw, &dayPlans); err != nil {
		return err
	}
	for _, dp := range dayPlans {
		weekday := weekdayFromDate(dp.Date)
		dayPlanByWeekday[weekday] = dp
	}

	dayPlanIDs := make([]string, 0, len(dayPlans))
	for _, dp := range dayPlans {
		dayPlanIDs = append(dayPlanIDs, dp.ID)
	}
	if len(dayPlanIDs) == 0 {
		return errors.New("no day plans created")
	}

	if err := c.deleteByIn(ctx, "/rest/v1/meal_plans", "day_plan_id", dayPlanIDs, userID); err != nil {
		return err
	}

	createdMealTemplates := map[llm.DayType][]mealTemplateRecord{
		llm.DayTypeTraining: {},
		llm.DayTypeCardio:   {},
		llm.DayTypeHybrid:   {},
		llm.DayTypeRest:     {},
	}
	for _, dayType := range []llm.DayType{llm.DayTypeTraining, llm.DayTypeCardio, llm.DayTypeHybrid, llm.DayTypeRest} {
		templates := plan.MealsByDayType[dayType]
		if len(templates) == 0 {
			continue
		}
		payload := make([]map[string]any, 0, len(templates))
		for _, template := range templates {
			caloriesSum := 0
			for _, item := range template.Items {
				if item.Calories != nil {
					caloriesSum += *item.Calories
				}
			}
			payload = append(payload, map[string]any{
				"user_id":   userID,
				"name":      template.Name,
				"meal_type": template.MealType,
				"calories":  caloriesSum,
			})
		}
		raw, err := c.requestJSON(ctx, http.MethodPost, "/rest/v1/meal_templates", nil, payload, true, "return=representation")
		if err != nil {
			return err
		}
		var created []mealTemplateRecord
		if err := json.Unmarshal(raw, &created); err != nil {
			return err
		}
		createdMealTemplates[dayType] = created

		mealItemsPayload := make([]map[string]any, 0)
		for idx, template := range templates {
			if idx >= len(created) {
				continue
			}
			for itemIdx, item := range template.Items {
				mealItemsPayload = append(mealItemsPayload, map[string]any{
					"user_id":          userID,
					"meal_template_id": created[idx].ID,
					"name":             item.Name,
					"calories":         item.Calories,
					"protein":          item.Protein,
					"fat":              item.Fat,
					"carbs":            item.Carbs,
					"quantity":         item.Quantity,
					"unit":             item.Unit,
					"order_index":      itemIdx,
				})
			}
		}
		if len(mealItemsPayload) > 0 {
			if _, err := c.requestJSON(ctx, http.MethodPost, "/rest/v1/meal_items", nil, mealItemsPayload, true, "return=minimal"); err != nil {
				return err
			}
		}
	}

	mealPlansPayload := make([]map[string]any, 0)
	for _, day := range plan.DayPlans {
		dp, ok := dayPlanByWeekday[day.DayOfWeek]
		if !ok {
			continue
		}
		for _, template := range createdMealTemplates[day.DayType] {
			mealPlansPayload = append(mealPlansPayload, map[string]any{
				"user_id":          userID,
				"day_plan_id":      dp.ID,
				"meal_template_id": template.ID,
			})
		}
	}
	if len(mealPlansPayload) > 0 {
		if _, err := c.requestJSON(ctx, http.MethodPost, "/rest/v1/meal_plans", nil, mealPlansPayload, true, "return=minimal"); err != nil {
			return err
		}
	}

	workoutsByDay := resolveWorkoutsByDay(plan)
	existingTemplatesRaw, err := c.requestJSON(
		ctx,
		http.MethodGet,
		"/rest/v1/workout_templates",
		url.Values{
			"select":  []string{"id,day_of_week"},
			"user_id": []string{"eq." + userID},
		},
		nil,
		true,
		"",
	)
	if err != nil {
		return err
	}
	var existingWorkoutTemplates []workoutTemplateRecord
	if err := json.Unmarshal(existingTemplatesRaw, &existingWorkoutTemplates); err != nil {
		return err
	}
	existingWorkoutTemplateIDs := make([]string, 0, len(existingWorkoutTemplates))
	for _, wt := range existingWorkoutTemplates {
		existingWorkoutTemplateIDs = append(existingWorkoutTemplateIDs, wt.ID)
	}
	if len(existingWorkoutTemplateIDs) > 0 {
		existingLinksRaw, err := c.requestJSON(
			ctx,
			http.MethodGet,
			"/rest/v1/workout_plan_exercises",
			url.Values{
				"select":              []string{"exercise_template_id"},
				"user_id":             []string{"eq." + userID},
				"workout_template_id": []string{inStringFilter(existingWorkoutTemplateIDs)},
			},
			nil,
			true,
			"",
		)
		if err != nil {
			return err
		}
		var existingLinks []map[string]string
		if err := json.Unmarshal(existingLinksRaw, &existingLinks); err != nil {
			return err
		}
		exerciseIDs := make([]string, 0, len(existingLinks))
		for _, link := range existingLinks {
			if id := link["exercise_template_id"]; id != "" {
				exerciseIDs = append(exerciseIDs, id)
			}
		}

		if err := c.deleteByIn(ctx, "/rest/v1/workout_plan_exercises", "workout_template_id", existingWorkoutTemplateIDs, userID); err != nil {
			return err
		}
		if len(exerciseIDs) > 0 {
			if err := c.deleteByIn(ctx, "/rest/v1/exercise_templates", "id", exerciseIDs, userID); err != nil {
				return err
			}
		}
		if err := c.deleteByIn(ctx, "/rest/v1/workout_templates", "id", existingWorkoutTemplateIDs, userID); err != nil {
			return err
		}
	}

	if len(workoutsByDay) == 0 {
		return nil
	}

	workoutTemplatesPayload := make([]map[string]any, 0, len(workoutsByDay))
	for dayOfWeek, w := range workoutsByDay {
		workoutTemplatesPayload = append(workoutTemplatesPayload, map[string]any{
			"user_id":                 userID,
			"name":                    valueOrFallbackForDay(w),
			"day_of_week":             dayOfWeek,
			"cardio_duration_minutes": w.CardioDurationMinute,
			"cardio_type":             w.CardioType,
		})
	}
	createdWorkoutTemplatesRaw, err := c.requestJSON(ctx, http.MethodPost, "/rest/v1/workout_templates", nil, workoutTemplatesPayload, true, "return=representation")
	if err != nil {
		return err
	}
	var createdWorkoutTemplates []workoutTemplateRecord
	if err := json.Unmarshal(createdWorkoutTemplatesRaw, &createdWorkoutTemplates); err != nil {
		return err
	}

	for _, wt := range createdWorkoutTemplates {
		if wt.DayOfWeek == nil {
			continue
		}
		workout, ok := workoutsByDay[*wt.DayOfWeek]
		if !ok || workout.DayType == llm.DayTypeRest || len(workout.Exercises) == 0 {
			continue
		}

		exerciseTemplatesPayload := make([]map[string]any, 0, len(workout.Exercises))
		for _, exercise := range workout.Exercises {
			exerciseTemplatesPayload = append(exerciseTemplatesPayload, map[string]any{
				"user_id": userID,
				"name":    exercise.Name,
			})
		}
		createdExercisesRaw, err := c.requestJSON(ctx, http.MethodPost, "/rest/v1/exercise_templates", nil, exerciseTemplatesPayload, true, "return=representation")
		if err != nil {
			return err
		}
		var createdExercises []exerciseTemplateRecord
		if err := json.Unmarshal(createdExercisesRaw, &createdExercises); err != nil {
			return err
		}

		linksPayload := make([]map[string]any, 0, len(createdExercises))
		for idx, ex := range createdExercises {
			exercisePlan := workout.Exercises[idx]
			linksPayload = append(linksPayload, map[string]any{
				"user_id":              userID,
				"workout_template_id":  wt.ID,
				"exercise_template_id": ex.ID,
				"target_sets":          exercisePlan.TargetSets,
				"target_reps_min":      exercisePlan.TargetRepsMin,
				"target_reps_max":      exercisePlan.TargetRepsMax,
				"notes":                exercisePlan.Notes,
				"order_index":          exercisePlan.OrderIndex,
			})
		}
		if len(linksPayload) > 0 {
			if _, err := c.requestJSON(ctx, http.MethodPost, "/rest/v1/workout_plan_exercises", nil, linksPayload, true, "return=minimal"); err != nil {
				return err
			}
		}
	}

	return nil
}

func (c *Client) requestJSON(
	ctx context.Context,
	method string,
	path string,
	query url.Values,
	body any,
	serviceRole bool,
	prefer string,
) ([]byte, error) {
	endpoint := c.baseURL + path
	if len(query) > 0 {
		endpoint += "?" + query.Encode()
	}

	var reader io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reader = bytes.NewReader(payload)
	}

	req, err := http.NewRequestWithContext(ctx, method, endpoint, reader)
	if err != nil {
		return nil, err
	}
	if serviceRole {
		req.Header.Set("apikey", c.serviceRoleKey)
		req.Header.Set("Authorization", "Bearer "+c.serviceRoleKey)
	} else {
		req.Header.Set("apikey", c.anonKey)
	}
	req.Header.Set("Content-Type", "application/json")
	if prefer != "" {
		req.Header.Set("Prefer", prefer)
	}

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return nil, errors.New("supabase request failed: " + string(raw))
	}
	return raw, nil
}

func (c *Client) deleteByIn(ctx context.Context, path string, key string, ids []string, userID string) error {
	if len(ids) == 0 {
		return nil
	}
	_, err := c.requestJSON(
		ctx,
		http.MethodDelete,
		path,
		url.Values{
			"user_id": []string{"eq." + userID},
			key:       []string{inStringFilter(ids)},
		},
		nil,
		true,
		"return=minimal",
	)
	return err
}

func currentWeekMonday() time.Time {
	now := time.Now()
	weekday := int(now.Weekday()) // Sun=0
	diffToMonday := (weekday + 6) % 7
	monday := now.AddDate(0, 0, -diffToMonday)
	return time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, monday.Location())
}

func weekdayOffsetFromMonday(dayOfWeek int) int {
	if dayOfWeek == 0 {
		return 6
	}
	return dayOfWeek - 1
}

func weekdayFromDate(dateText string) int {
	parsed, err := time.Parse("2006-01-02", dateText)
	if err != nil {
		return -1
	}
	return int(parsed.Weekday())
}

func inStringFilter(values []string) string {
	escaped := make([]string, 0, len(values))
	for _, value := range values {
		escaped = append(escaped, `"`+strings.ReplaceAll(value, `"`, `\"`)+`"`)
	}
	return "in.(" + strings.Join(escaped, ",") + ")"
}

func inIntFilter(values []int) string {
	parts := make([]string, 0, len(values))
	for _, value := range values {
		parts = append(parts, strconv.Itoa(value))
	}
	return "in.(" + strings.Join(parts, ",") + ")"
}

func valueOrFallbackForDay(plan llm.WorkoutDayPlan) string {
	if strings.TrimSpace(plan.Name) != "" {
		return strings.TrimSpace(plan.Name)
	}
	if plan.DayType == llm.DayTypeCardio {
		return "有酸素メニュー"
	}
	return "トレーニングメニュー"
}

func resolveWorkoutsByDay(plan *llm.OnboardingStructuredPlanOutput) map[int]llm.WorkoutDayPlan {
	out := map[int]llm.WorkoutDayPlan{}
	if plan == nil {
		return out
	}

	if len(plan.WorkoutsByDay) > 0 {
		for _, workout := range plan.WorkoutsByDay {
			if workout.DayType == llm.DayTypeRest {
				continue
			}
			out[workout.DayOfWeek] = workout
		}
		return out
	}

	// Backward compatibility: if old shape remains in draft.
	for _, day := range plan.DayPlans {
		if day.DayType == llm.DayTypeRest {
			continue
		}
		byType := plan.WorkoutsByDayType[day.DayType]
		if byType == nil {
			continue
		}
		out[day.DayOfWeek] = llm.WorkoutDayPlan{
			DayOfWeek:            day.DayOfWeek,
			DayType:              day.DayType,
			Name:                 byType.Name,
			CardioDurationMinute: byType.CardioDurationMinute,
			CardioType:           byType.CardioType,
			Exercises:            byType.Exercises,
		}
	}
	return out
}

func toMap(value any) (map[string]any, error) {
	raw, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	return out, nil
}
