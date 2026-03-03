import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useMealPlan(dayPlanId?: string) {
  return useQuery({
    queryKey: ['mealPlan', dayPlanId],
    queryFn: async () => {
      if (!dayPlanId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

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

      // If no meal plans exist, create default ones
      if (!mealPlans || mealPlans.length === 0) {
        // Get default meal templates
        const { data: templates } = await supabase
          .from('meal_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at');

        if (templates && templates.length > 0) {
          const plansToCreate = templates.map(template => ({
            user_id: user.id,
            day_plan_id: dayPlanId,
            meal_template_id: template.id,
          }));

          await supabase.from('meal_plans').insert(plansToCreate);

          // Fetch again
          const { data: newMealPlans } = await supabase
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

          return newMealPlans || [];
        }
      }

      return mealPlans || [];
    },
    enabled: !!dayPlanId,
  });
}

