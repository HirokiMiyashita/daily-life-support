package exercisereferencevideousecase

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"regexp"
	"strings"

	"daily-life-support/apps/api/internal/llm"
	"daily-life-support/apps/api/internal/prompt"
	llmservice "daily-life-support/apps/api/internal/service/llm"
)

type Usecase interface {
	Execute(ctx context.Context, input llm.ExerciseReferenceVideoInput) (*llm.ExerciseReferenceVideoOutput, error)
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

func (u *usecase) Execute(ctx context.Context, input llm.ExerciseReferenceVideoInput) (*llm.ExerciseReferenceVideoOutput, error) {
	if !u.hasAPIKey {
		return nil, errors.New("OPENAI_API_KEY is not configured")
	}
	exerciseName := strings.TrimSpace(input.ExerciseName)
	if exerciseName == "" {
		return nil, errors.New("exerciseName is required")
	}

	req := llm.ChatInput{
		Model: u.defaultModel,
		Messages: []llm.Message{
			{
				Role:    "user",
				Content: prompt.BuildExerciseReferenceVideoPrompt(exerciseName),
			},
		},
	}
	result, err := u.service.Generate(ctx, req)
	if err != nil {
		return nil, err
	}

	cleaned := strings.TrimSpace(result.Message)
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	var parsed llm.ExerciseReferenceVideoOutput
	if err := json.Unmarshal([]byte(cleaned), &parsed); err != nil {
		return nil, errors.New("failed to parse exercise reference video json: " + err.Error())
	}

	if strings.TrimSpace(parsed.Title) == "" {
		parsed.Title = exerciseName + " フォーム解説"
	}
	embedURL, err := normalizeToEmbedURL(parsed.YouTubeURL)
	if err != nil {
		return nil, err
	}
	parsed.YouTubeURL = embedURL
	return &parsed, nil
}

func normalizeToEmbedURL(rawURL string) (string, error) {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return "", errors.New("youtube url is required")
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "", errors.New("invalid youtube url")
	}

	host := strings.ToLower(parsed.Hostname())
	var videoID string
	switch host {
	case "youtu.be":
		videoID = strings.TrimPrefix(parsed.Path, "/")
	case "www.youtube.com", "youtube.com", "m.youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com":
		path := strings.Trim(parsed.Path, "/")
		if strings.HasPrefix(path, "watch") {
			videoID = parsed.Query().Get("v")
		} else if strings.HasPrefix(path, "embed/") {
			videoID = strings.TrimPrefix(path, "embed/")
		}
	default:
		return "", errors.New("youtube url must be youtube.com or youtu.be")
	}

	videoID = strings.TrimSpace(videoID)
	if !isValidYouTubeVideoID(videoID) {
		return "", errors.New("invalid youtube video id")
	}

	return "https://www.youtube-nocookie.com/embed/" + videoID + "?autoplay=1&playsinline=1&rel=0&hl=ja&modestbranding=1", nil
}

func isValidYouTubeVideoID(id string) bool {
	re := regexp.MustCompile(`^[A-Za-z0-9_-]{11}$`)
	return re.MatchString(id)
}
