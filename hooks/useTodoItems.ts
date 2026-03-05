import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTodoItems(dayPlanId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['todoItems', dayPlanId],
    queryFn: async () => {
      if (!dayPlanId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get day plan to determine day type
      const { data: dayPlan } = await supabase
        .from('day_plans')
        .select('day_type')
        .eq('id', dayPlanId)
        .single();

      if (!dayPlan) return [];

      // Get todo templates for this day type
      const dayTypes = ['DAILY'];
      if (dayPlan.day_type === 'TRAINING_DAY') dayTypes.push('TRAINING_DAY');
      if (dayPlan.day_type === 'CARDIO_DAY') dayTypes.push('CARDIO_DAY');
      if (dayPlan.day_type === 'HYBRID_DAY') dayTypes.push('TRAINING_DAY', 'CARDIO_DAY');

      const { data: templates } = await supabase
        .from('todo_templates')
        .select('*')
        .eq('user_id', user.id)
        .in('day_type', dayTypes)
        .order('order_index');

      // Get existing todo items
      const { data: existingItems } = await supabase
        .from('todo_items')
        .select('*')
        .eq('day_plan_id', dayPlanId)
        .order('order_index');

      // Create todo items from templates if they don't exist
      if (templates && templates.length > 0) {
        const itemsToCreate = templates
          .filter(template => !existingItems?.some(item => item.todo_template_id === template.id))
          .map(template => ({
            user_id: user.id,
            day_plan_id: dayPlanId,
            todo_template_id: template.id,
            title: template.title,
            description: template.description,
            completed: false,
            order_index: template.order_index,
          }));

        if (itemsToCreate.length > 0) {
          await supabase.from('todo_items').insert(itemsToCreate);
        }
      }

      // Fetch all todo items again
      const { data: allItems } = await supabase
        .from('todo_items')
        .select('*')
        .eq('day_plan_id', dayPlanId)
        .order('order_index');

      return allItems || [];
    },
    enabled: !!dayPlanId,
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('todo_items')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todoItems', dayPlanId] });
    },
  });

  return {
    data,
    isLoading,
    updateTodo: updateTodoMutation.mutate,
  };
}

