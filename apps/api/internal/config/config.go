package config

import (
	"os"
	"strings"
)

type App struct {
	Port                   string
	OpenAIBaseURL          string
	OpenAIAPIKey           string
	DefaultModel           string
	SupabaseURL            string
	SupabaseAnonKey        string
	SupabaseServiceRoleKey string
}

func Load() App {
	return App{
		Port:                   env("PORT", "8080"),
		OpenAIBaseURL:          strings.TrimRight(env("OPENAI_BASE_URL", "https://api.openai.com/v1"), "/"),
		OpenAIAPIKey:           os.Getenv("OPENAI_API_KEY"),
		DefaultModel:           env("OPENAI_MODEL", "gpt-4o-mini"),
		SupabaseURL:            strings.TrimRight(env("SUPABASE_URL", ""), "/"),
		SupabaseAnonKey:        os.Getenv("SUPABASE_ANON_KEY"),
		SupabaseServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
	}
}

func env(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}
