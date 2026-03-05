import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useDayPlan() {
  return useQuery({
    queryKey: ['dayPlan', new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get day plan for today
      const { data: dayPlan, error } = await supabase
        .from('day_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return dayPlan ?? null;
    },
  });
}

