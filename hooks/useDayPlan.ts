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

      // Get or create day plan for today
      let { data: dayPlan, error } = await supabase
        .from('day_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code === 'PGRST116') {
        // Day plan doesn't exist, create it
        const dayOfWeek = new Date().getDay();
        let dayType: 'TRAINING_DAY' | 'CARDIO_DAY' | 'REST_DAY' = 'REST_DAY';
        
        if (dayOfWeek === 1) dayType = 'TRAINING_DAY'; // Monday
        else if (dayOfWeek === 2) dayType = 'TRAINING_DAY'; // Tuesday
        else if (dayOfWeek === 3) dayType = 'CARDIO_DAY'; // Wednesday
        else if (dayOfWeek === 4) dayType = 'TRAINING_DAY'; // Thursday
        else if (dayOfWeek === 5) dayType = 'TRAINING_DAY'; // Friday
        else if (dayOfWeek === 6) dayType = 'REST_DAY'; // Saturday
        else dayType = 'REST_DAY'; // Sunday

        const { data: newDayPlan, error: createError } = await supabase
          .from('day_plans')
          .insert({
            user_id: user.id,
            date: today,
            day_type: dayType,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        dayPlan = newDayPlan;
      } else if (error) {
        throw error;
      }

      return dayPlan;
    },
  });
}

