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
      return dayPlans || [];
    },
  });
}

