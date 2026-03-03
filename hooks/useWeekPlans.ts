import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useWeekPlans() {
  return useQuery({
    queryKey: ['weekPlans'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate week start (Monday) and end (Sunday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const weekStart = monday.toISOString().split('T')[0];
      const weekEnd = sunday.toISOString().split('T')[0];

      // Get all day plans for this week
      const { data: dayPlans, error } = await supabase
        .from('day_plans')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date');

      if (error) {
        throw error;
      }

      // Generate day plans for missing days
      const allDays: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        allDays.push(date.toISOString().split('T')[0]);
      }

      const existingDates = new Set(dayPlans?.map(dp => dp.date) || []);
      const missingDates = allDays.filter(date => !existingDates.has(date));

      if (missingDates.length > 0) {
        const dayPlansToCreate = missingDates.map(date => {
          const dateObj = new Date(date);
          const dayOfWeek = dateObj.getDay();
          let dayType: 'TRAINING_DAY' | 'CARDIO_DAY' | 'REST_DAY' = 'REST_DAY';
          
          if (dayOfWeek === 1) dayType = 'TRAINING_DAY'; // Monday
          else if (dayOfWeek === 2) dayType = 'TRAINING_DAY'; // Tuesday
          else if (dayOfWeek === 3) dayType = 'CARDIO_DAY'; // Wednesday
          else if (dayOfWeek === 4) dayType = 'TRAINING_DAY'; // Thursday
          else if (dayOfWeek === 5) dayType = 'TRAINING_DAY'; // Friday
          else if (dayOfWeek === 6) dayType = 'REST_DAY'; // Saturday
          else dayType = 'REST_DAY'; // Sunday

          return {
            user_id: user.id,
            date,
            day_type: dayType,
          };
        });

        await supabase.from('day_plans').insert(dayPlansToCreate);

        // Fetch again
        const { data: allDayPlans } = await supabase
          .from('day_plans')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', weekStart)
          .lte('date', weekEnd)
          .order('date');

        return allDayPlans || [];
      }

      return dayPlans || [];
    },
  });
}

