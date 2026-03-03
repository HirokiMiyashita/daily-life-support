export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          target_weight: number;
          initial_weight: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          end_date: string;
          target_weight: number;
          initial_weight: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_date?: string;
          end_date?: string;
          target_weight?: number;
          initial_weight?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      day_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          date: string;
          day_type: 'TRAINING_DAY' | 'CARDIO_DAY' | 'REST_DAY';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          date: string;
          day_type: 'TRAINING_DAY' | 'CARDIO_DAY' | 'REST_DAY';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string | null;
          date?: string;
          day_type?: 'TRAINING_DAY' | 'CARDIO_DAY' | 'REST_DAY';
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          meal_type: 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'POST_WORKOUT' | 'DINNER';
          calories: number | null;
          protein: number | null;
          fat: number | null;
          carbs: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          meal_type: 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'POST_WORKOUT' | 'DINNER';
          calories?: number | null;
          protein?: number | null;
          fat?: number | null;
          carbs?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          meal_type?: 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'POST_WORKOUT' | 'DINNER';
          calories?: number | null;
          protein?: number | null;
          fat?: number | null;
          carbs?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          day_plan_id: string | null;
          date: string;
          weight: number | null;
          waist: number | null;
          steps: number | null;
          sleep_hours: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_plan_id?: string | null;
          date: string;
          weight?: number | null;
          waist?: number | null;
          steps?: number | null;
          sleep_hours?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day_plan_id?: string | null;
          date?: string;
          weight?: number | null;
          waist?: number | null;
          steps?: number | null;
          sleep_hours?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      todo_items: {
        Row: {
          id: string;
          user_id: string;
          day_plan_id: string;
          todo_template_id: string | null;
          title: string;
          description: string | null;
          completed: boolean;
          completed_at: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_plan_id: string;
          todo_template_id?: string | null;
          title: string;
          description?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day_plan_id?: string;
          todo_template_id?: string | null;
          title?: string;
          description?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          day_of_week: number | null;
          cardio_duration_minutes: number | null;
          cardio_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          day_of_week?: number | null;
          cardio_duration_minutes?: number | null;
          cardio_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          day_of_week?: number | null;
          cardio_duration_minutes?: number | null;
          cardio_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      exercise_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_reps_min: number | null;
          target_reps_max: number | null;
          target_sets: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_reps_min?: number | null;
          target_reps_max?: number | null;
          target_sets?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_reps_min?: number | null;
          target_reps_max?: number | null;
          target_sets?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: 'PROTEIN' | 'VEGETABLE' | 'CARB' | 'OTHER';
          default_unit: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: 'PROTEIN' | 'VEGETABLE' | 'CARB' | 'OTHER';
          default_unit: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: 'PROTEIN' | 'VEGETABLE' | 'CARB' | 'OTHER';
          default_unit?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      shopping_lists: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          week_end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          week_end_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start_date?: string;
          week_end_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      shopping_list_items: {
        Row: {
          id: string;
          user_id: string;
          shopping_list_id: string;
          ingredient_id: string;
          quantity: number;
          unit: string;
          purchased: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shopping_list_id: string;
          ingredient_id: string;
          quantity: number;
          unit: string;
          purchased?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shopping_list_id?: string;
          ingredient_id?: string;
          quantity?: number;
          unit?: string;
          purchased?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      seed_user_data: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
  };
}

