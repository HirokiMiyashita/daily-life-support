import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
    storageKey: 'supabase.auth.token',
  },
});

// Initialize anonymous authentication on first launch
export const initializeAuth = async () => {
  // Check for existing session first
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Error getting session:', sessionError);
  }
  
  if (session && session.user) {
    console.log('Existing session found, user ID:', session.user.id);
    // Check if user profile exists
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single();
    
    if (!userProfile) {
      // Create user profile if it doesn't exist
      await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email,
        });
    }
    
    return { data: { session }, error: null };
  }
  
  // No session, check if we have a stored user ID
  const storedUserId = await AsyncStorage.getItem('supabase_user_id');
  
  if (storedUserId) {
    // Try to restore session (anonymous auth doesn't support this, so we'll create new)
    // But check if user data exists first
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', storedUserId)
      .single();
    
    if (existingUser) {
      console.log('Found existing user in database, but cannot restore anonymous session');
      // Anonymous auth doesn't support restoring sessions, so we need to create new
      // But we'll skip seeding if data exists
    }
  }
  
  // Sign in anonymously (new user or session expired)
  console.log('No session found, creating new anonymous user...');
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    console.error('Error signing in anonymously:', error);
    return { error };
  }
  
  // Save user ID to AsyncStorage
  if (data.user) {
    await AsyncStorage.setItem('supabase_user_id', data.user.id);
    console.log('New anonymous user created, ID:', data.user.id);
    
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: data.user.email,
      });
    
    if (profileError) {
      console.error('Error creating user profile:', profileError);
    } else {
      // Check if seed data already exists before seeding
      const { data: existingMealTemplates } = await supabase
        .from('meal_templates')
        .select('id')
        .eq('user_id', data.user.id)
        .limit(1);
      
      if (!existingMealTemplates || existingMealTemplates.length === 0) {
        // Seed initial data only if it doesn't exist
        console.log('No existing data found, seeding...');
        const { error: seedError } = await supabase.rpc('seed_user_data');
        if (seedError) {
          console.error('Error seeding user data:', seedError);
        } else {
          console.log('Seed data created successfully');
        }
      } else {
        console.log('Seed data already exists, skipping...');
      }
    }
  }
  
  return { data, error: null };
};

