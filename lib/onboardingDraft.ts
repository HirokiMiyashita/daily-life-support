import AsyncStorage from '@react-native-async-storage/async-storage';

export type SetupMode = 'AI' | 'SELF';
export type DurationUnit = 'week' | 'month';
export type TrainingMode = 'GYM' | 'BODYWEIGHT';

export type OnboardingDraft = {
  setupMode: SetupMode | null;
  weightKg: string;
  heightCm: string;
  targetWeightKg: string;
  targetDurationValue: string;
  targetDurationUnit: DurationUnit;
  occupation: string;
  trainingMode: TrainingMode;
  aiSuggestion: string;
};

const STORAGE_KEY = 'onboarding_draft_v1';

const defaultDraft: OnboardingDraft = {
  setupMode: null,
  weightKg: '',
  heightCm: '',
  targetWeightKg: '',
  targetDurationValue: '',
  targetDurationUnit: 'week',
  occupation: '',
  trainingMode: 'GYM',
  aiSuggestion: '',
};

export const getOnboardingDraft = async (): Promise<OnboardingDraft> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultDraft;

  try {
    return { ...defaultDraft, ...(JSON.parse(raw) as Partial<OnboardingDraft>) };
  } catch {
    return defaultDraft;
  }
};

export const saveOnboardingDraft = async (partial: Partial<OnboardingDraft>) => {
  const current = await getOnboardingDraft();
  const next = { ...current, ...partial };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearOnboardingDraft = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
