import {
  deleteV1LlmOnboardingPlanDraft,
  postV1LlmOnboardingPlanDraft,
  postV1LlmOnboardingPlanDraftApply,
} from '@/lib/generated/llmApi';
import { supabase } from '@/lib/supabase';

export type OnboardingSuggestionInput = {
  weightKg: number;
  heightCm: number;
  targetWeightKg: number;
  targetDurationValue: number;
  targetDurationUnit: 'week' | 'month';
  occupation: string;
  trainingMode: 'GYM' | 'BODYWEIGHT';
};

export const createOnboardingPlanDraft = async (input: OnboardingSuggestionInput) => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('ログイン情報が見つかりません。再ログインしてください。');
  }

  const res = await postV1LlmOnboardingPlanDraft(
    {
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      targetWeightKg: input.targetWeightKg,
      targetDurationValue: input.targetDurationValue,
      targetDurationUnit: input.targetDurationUnit,
      occupation: input.occupation,
      trainingMode: input.trainingMode,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (res.status === 200 && 'message' in res.data && res.data.message && 'plan' in res.data) {
    return {
      message: res.data.message,
      plan: res.data.plan,
    };
  }

  if ('error' in res.data && res.data.error) {
    throw new Error(res.data.error);
  }

  throw new Error('AIプランの下書き保存に失敗しました。');
};

export const applyOnboardingPlanDraft = async () => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('ログイン情報が見つかりません。再ログインしてください。');
  }

  const res = await postV1LlmOnboardingPlanDraftApply({
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 200 && 'message' in res.data && res.data.message) {
    return res.data.message;
  }

  if ('error' in res.data && res.data.error) {
    throw new Error(res.data.error);
  }

  throw new Error('AIプランの反映に失敗しました。');
};

export const deleteOnboardingPlanDraft = async () => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return;
  }
  await deleteV1LlmOnboardingPlanDraft({
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};
