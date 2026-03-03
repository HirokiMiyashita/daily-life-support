import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useWorkoutPlan(dayType?: string) {
  return useQuery({
    queryKey: ['workoutPlan', dayType],
    queryFn: async () => {
      if (!dayType || dayType === 'REST_DAY') return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dayOfWeek = new Date().getDay();
      // Convert Sunday (0) to 7 for database (Monday = 1)
      const dbDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

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
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return workoutTemplate;
    },
    enabled: !!dayType && dayType !== 'REST_DAY',
  });
}

