import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useShoppingList() {
  return useQuery({
    queryKey: ['shoppingList'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate week start (Monday) and end (Sunday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
      const monday = new Date(today.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const weekStart = monday.toISOString().split('T')[0];
      const weekEnd = sunday.toISOString().split('T')[0];

      // Get or create shopping list
      let { data: shoppingList, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', weekStart)
        .single();

      if (error && error.code === 'PGRST116') {
        // Shopping list doesn't exist, create it
        const { data: newList, error: createError } = await supabase
          .from('shopping_lists')
          .insert({
            user_id: user.id,
            week_start_date: weekStart,
            week_end_date: weekEnd,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        shoppingList = newList;
      } else if (error) {
        throw error;
      }

      // Get shopping list items with ingredients
      let { data: items, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select(`
          *,
          ingredients (
            *
          )
        `)
        .eq('shopping_list_id', shoppingList.id)
        .order('ingredients(category), ingredients(name)');

      if (itemsError) {
        throw itemsError;
      }

      // If no items exist, generate them from meal plans
      if (!items || items.length === 0) {
        // Get all day plans for this week
        const { data: dayPlans } = await supabase
          .from('day_plans')
          .select('id, date')
          .eq('user_id', user.id)
          .gte('date', weekStart)
          .lte('date', weekEnd);

        if (dayPlans && dayPlans.length > 0) {
          // Get all meal plans for these days
          const { data: mealPlans } = await supabase
            .from('meal_plans')
            .select(`
              *,
              meal_templates (
                *,
                meal_items (
                  *,
                  meal_item_ingredients (
                    *,
                    ingredients (
                      *
                    )
                  )
                )
              )
            `)
            .in('day_plan_id', dayPlans.map(dp => dp.id));

          // Aggregate ingredients
          const ingredientMap = new Map<string, { ingredient_id: string; quantity: number; unit: string; category: string }>();

          mealPlans?.forEach(mealPlan => {
            const mealItems = mealPlan.meal_templates?.meal_items || [];
            mealItems.forEach(mealItem => {
              const mealItemIngredients = mealItem.meal_item_ingredients || [];
              mealItemIngredients.forEach(mii => {
                const ingredient = mii.ingredients;
                if (ingredient) {
                  const key = `${ingredient.id}_${mii.unit}`;
                  if (ingredientMap.has(key)) {
                    const existing = ingredientMap.get(key)!;
                    existing.quantity += mii.quantity;
                  } else {
                    ingredientMap.set(key, {
                      ingredient_id: ingredient.id,
                      quantity: mii.quantity,
                      unit: mii.unit,
                      category: ingredient.category,
                    });
                  }
                }
              });
            });
          });

          // Create shopping list items
          if (ingredientMap.size > 0) {
            const itemsToInsert = Array.from(ingredientMap.values()).map(item => ({
              user_id: user.id,
              shopping_list_id: shoppingList.id,
              ingredient_id: item.ingredient_id,
              quantity: item.quantity,
              unit: item.unit,
              purchased: false,
            }));

            const { error: insertError } = await supabase
              .from('shopping_list_items')
              .insert(itemsToInsert);

            if (insertError) {
              console.error('Error creating shopping list items:', insertError);
            } else {
              // Fetch again
              const { data: newItems } = await supabase
                .from('shopping_list_items')
                .select(`
                  *,
                  ingredients (
                    *
                  )
                `)
                .eq('shopping_list_id', shoppingList.id)
                .order('ingredients(category), ingredients(name)');

              items = newItems || [];
            }
          }
        }
      }

      // Group items by category
      const grouped = (items || []).reduce((acc, item) => {
        const category = item.ingredients?.category || 'OTHER';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      return {
        ...shoppingList,
        items: grouped,
      };
    },
  });
}

