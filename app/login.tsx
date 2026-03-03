import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signInWithGoogle } from '@/lib/googleAuth';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'authenticated' : 'not authenticated');
      if (session) {
        // User is authenticated, navigate to main app
        setLoading(false);
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      console.log('Google login button pressed');
      const result = await signInWithGoogle();
      console.log('Google login result:', result);
      
      // If result is null, it means we're waiting for deep link callback
      // The callback will be handled by the deep link handler in _layout.tsx
      // Keep loading state until auth state changes
      if (result === null) {
        console.log('Waiting for OAuth callback via deep link...');
        // Don't set loading to false - let the auth state change handler do it
        return;
      }
      
      // If we get here with a session, navigate directly
      if (result?.session) {
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('ログインエラー', error.message || 'Googleログインに失敗しました');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>減量プラン管理アプリ</Text>
        <Text style={styles.subtitle}>Googleでログインして開始</Text>

        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.googleButtonText}>Googleでログイン</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
