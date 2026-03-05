package openai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"daily-life-support/apps/api/internal/llm"
)

type Repository interface {
	Chat(ctx context.Context, input llm.ChatInput) (*ChatCompletionResponse, error)
}

type Client struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

type ChatCompletionRequest struct {
	Model       string        `json:"model"`
	Messages    []llm.Message `json:"messages"`
	Temperature *float64      `json:"temperature,omitempty"`
}

type ChatCompletionResponse struct {
	Choices []struct {
		Message llm.Message `json:"message"`
	} `json:"choices"`
}

func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL: baseURL,
		apiKey:  apiKey,
		http:    &http.Client{Timeout: 5 * time.Minute},
	}
}

func (c *Client) Chat(ctx context.Context, input llm.ChatInput) (*ChatCompletionResponse, error) {
	payload := ChatCompletionRequest{
		Model:       input.Model,
		Messages:    input.Messages,
		Temperature: input.Temperature,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return nil, errors.New("upstream llm request failed: " + string(raw))
	}

	var parsed ChatCompletionResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, err
	}
	return &parsed, nil
}
