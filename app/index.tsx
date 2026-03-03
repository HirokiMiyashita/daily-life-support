import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { isOnboardingCompleted } from '@/lib/onboarding';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthAndOnboarding();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setOnboardingCompleted(null);
      } else {
        checkAuthAndOnboarding();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthAndOnboarding = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authenticated = !!session;
      setIsAuthenticated(authenticated);

      if (!authenticated || !session?.user?.id) {
        setOnboardingCompleted(null);
        return;
      }

      const completed = await isOnboardingCompleted(session.user.id);
      setOnboardingCompleted(completed);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setOnboardingCompleted(null);
    }
  };

  if (isAuthenticated === null || (isAuthenticated && onboardingCompleted === null)) {
    // Loading state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    if (!onboardingCompleted) {
      return <Redirect href="/onboarding" />;
    }
    return <Redirect href="/(tabs)/today" />;
  }

  return <Redirect href="/login" />;
}

