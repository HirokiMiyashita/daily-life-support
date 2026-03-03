import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useWeightHistory(days: number = 30) {
  return useQuery({
    queryKey: ['weightHistory', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all logs with weight, then filter by date range on client side
      // This ensures we don't miss any data due to date calculation issues
      const { data: logs, error } = await supabase
        .from('daily_logs')
        .select('date, weight, waist')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      // Filter by date range and weight on client side
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Debug: log all logs to see what we're getting
      console.log('User ID:', user.id);
      console.log('All logs from DB:', logs);
      console.log('Date range:', startDateStr, 'to', endDateStr);
      console.log('Today:', new Date().toISOString().split('T')[0]);

      const filteredLogs = (logs || []).filter(log => {
        // Filter out null weights
        if (log.weight === null || log.weight === undefined) {
          return false;
        }
        // Filter by date range (include dates within the range)
        return log.date >= startDateStr && log.date <= endDateStr;
      });

      console.log('Filtered logs:', filteredLogs);

      // Calculate 7-day average
      const last7Days = filteredLogs
        .slice(0, 7)
        .map(log => log.weight as number);

      const average7Days = last7Days.length > 0
        ? last7Days.reduce((sum, weight) => sum + weight, 0) / last7Days.length
        : null;

      return {
        logs: filteredLogs,
        average7Days,
      };
    },
  });
}

