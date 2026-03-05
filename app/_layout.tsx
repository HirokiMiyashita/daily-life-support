import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { handleOAuthCallback } from '@/lib/googleAuth';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    // Handle OAuth callback from deep link
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      console.log('Deep link received:', url);
      if (url.includes('code=') || url.includes('access_token=') || url.includes('error=')) {
        console.log('Processing OAuth callback...');
        try {
          const result = await handleOAuthCallback(url);
          console.log('OAuth callback processed successfully:', result);
        } catch (error: any) {
          console.error('OAuth callback error:', error);
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    console.log('Deep link listener registered');

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/profile" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/confirm" options={{ headerShown: false }} />
        <Stack.Screen name="create-plan" options={{ presentation: 'modal', title: 'プラン作成' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}

