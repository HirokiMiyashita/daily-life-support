import { supabase } from './supabase';

export type OnboardingChoice = 'SELF' | 'AI';

export type OnboardingState = {
  completed: boolean;
  trainingChoice?: OnboardingChoice;
  mealChoice?: OnboardingChoice;
  completedAt?: string;
};

export const saveOnboardingState = async (
  payload: Omit<OnboardingState, 'completed' | 'completedAt'> & { email?: string | null },
) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('セッションが見つかりません');
  }

  const response = await fetch(`${baseUrl}/v1/users/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      email: payload.email ?? null,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'onboarding profile upsert failed');
  }
};

export const isOnboardingCompleted = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data?.id;
};

export const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};
