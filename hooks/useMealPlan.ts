import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useMealPlan(dayPlanId?: string) {
  return useQuery({
    queryKey: ['mealPlan', dayPlanId],
    queryFn: async () => {
      if (!dayPlanId) return [];

      // Get meal plans for this day
      const { data: mealPlans, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_templates (
            *,
            meal_items (
              *
            )
          )
        `)
        .eq('day_plan_id', dayPlanId)
        .order('created_at');

      if (error) throw error;

      return mealPlans || [];
    },
    enabled: !!dayPlanId,
  });
}

