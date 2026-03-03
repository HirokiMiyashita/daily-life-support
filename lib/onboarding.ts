import { supabase } from './supabase';

export type OnboardingChoice = 'SELF' | 'AI';

export type OnboardingState = {
  completed: boolean;
  trainingChoice?: OnboardingChoice;
  mealChoice?: OnboardingChoice;
  completedAt?: string;
};

export const saveOnboardingState = async (
  userId: string,
  payload: Omit<OnboardingState, 'completed' | 'completedAt'> & { email?: string | null },
) => {
  const { error } = await supabase.from('users').upsert({
    id: userId,
    email: payload.email ?? null,
  });

  if (error) {
    throw error;
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
