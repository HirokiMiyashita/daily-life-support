import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useWorkoutPlan(dayType?: string) {
  const dayOfWeek = new Date().getDay();
  // DB stores day_of_week as 0-6 (0: Sunday, 1: Monday, ...).
  const dbDayOfWeek = dayOfWeek;

  return useQuery({
    queryKey: ['workoutPlan', dayType, dbDayOfWeek],
    queryFn: async () => {
      if (!dayType || dayType === 'REST_DAY') return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: workoutTemplate, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          workout_plan_exercises (
            *,
            exercise_templates (
              *
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('day_of_week', dbDayOfWeek)
        .order('order_index', { foreignTable: 'workout_plan_exercises', ascending: true })
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return workoutTemplate;
    },
    enabled: !!dayType && dayType !== 'REST_DAY',
  });
}

