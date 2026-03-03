import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useDailyLog(date: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dailyLog', date],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: log, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

      if (error && error.code === 'PGRST116') {
        // Log doesn't exist, create it
        const { data: newLog, error: createError } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user.id,
            date,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return newLog;
      } else if (error) {
        throw error;
      }

      return log;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      weight?: number;
      waist?: number;
      steps?: number;
      sleep_hours?: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: user.id,
          date,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog', date] });
      // Also invalidate weight history to refresh the list
      queryClient.invalidateQueries({ queryKey: ['weightHistory'] });
    },
  });

  return {
    data,
    isLoading,
    updateLog: updateMutation.mutateAsync,
  };
}

