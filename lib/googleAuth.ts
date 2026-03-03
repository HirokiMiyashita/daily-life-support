import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Complete the auth session for better UX
WebBrowser.maybeCompleteAuthSession();

const CUSTOM_SCHEME_PREFIX = 'daily-life-support://';
const PARSE_URL_BASE = 'https://dummy.com/';

const toParseableUrl = (rawUrl: string) => {
  if (rawUrl.startsWith(CUSTOM_SCHEME_PREFIX)) {
    return rawUrl.replace(CUSTOM_SCHEME_PREFIX, PARSE_URL_BASE);
  }
  return rawUrl;
};

const parseOAuthCallbackParams = (rawUrl: string) => {
  const parseableUrl = toParseableUrl(rawUrl);
  const parsedUrl = new URL(parseableUrl);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
  const queryParams = parsedUrl.searchParams;
  const pick = (key: string) => queryParams.get(key) ?? hashParams.get(key);

  return {
    code: pick('code'),
    error: pick('error') ?? pick('error_description'),
    accessToken: pick('access_token'),
    refreshToken: pick('refresh_token'),
  };
};

export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign in...');
    
    // Get the redirect URL using custom scheme
    const scheme = Constants.expoConfig?.scheme || 'daily-life-support';
    const redirectUrl = `${scheme}://`;
    console.log('Redirect URL:', redirectUrl);
    
    // Start OAuth flow with Google
    // Use skipBrowserRedirect: true to manually handle browser opening
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('OAuth error:', error);
      throw error;
    }

    if (!data?.url) {
      throw new Error('No OAuth URL returned');
    }

    console.log('Opening browser with URL:', data.url);
    
    // Open browser for authentication
    // Use openAuthSessionAsync with a timeout
    const result = await Promise.race([
      WebBrowser.openAuthSessionAsync(data.url, redirectUrl),
      new Promise<{ type: 'timeout' }>((resolve) => 
        setTimeout(() => resolve({ type: 'timeout' }), 30000)
      ),
    ]);
    
    console.log('Browser result type:', result.type);
    
    if (result.type === 'timeout') {
      console.log('Browser session timed out, waiting for deep link...');
      // Return null to indicate we're waiting for deep link
      return null;
    }
    
    if (result.type === 'success') {
      const callbackUrl = 'url' in result ? result.url : '';
      console.log('OAuth callback received:', callbackUrl);
      
      if (!callbackUrl) {
        throw new Error('No callback URL received');
      }
      
      const { code, error, accessToken, refreshToken } = parseOAuthCallbackParams(callbackUrl);
      
      if (error) {
        console.error('OAuth error from callback:', error);
        throw new Error(`OAuth error: ${error}`);
      }
      
      if (code) {
        console.log('Exchanging code for session...');
        // Exchange code for session
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (sessionError) {
          console.error('Session exchange error:', sessionError);
          throw sessionError;
        }
        console.log('Session created successfully');
        return sessionData;
      }

      if (accessToken && refreshToken) {
        console.log('Setting session from implicit flow tokens...');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('Session set error:', sessionError);
          throw sessionError;
        }

        console.log('Session created successfully');
        return sessionData;
      }

      console.error('No code or tokens found in callback URL');
      throw new Error('No authorization code or tokens found in callback');
    }

    if (result.type === 'cancel') {
      console.log('User cancelled authentication');
      throw new Error('Authentication cancelled');
    }

    console.error('Authentication failed - unexpected result type:', result.type);
    throw new Error('Authentication failed');
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(error.message || 'Google sign in failed');
  }
};

// Handle OAuth callback from deep link
export const handleOAuthCallback = async (url: string) => {
  try {
    console.log('Handling OAuth callback:', url);
    
    const { code, error, accessToken, refreshToken } = parseOAuthCallbackParams(url);
    
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }
    
    if (code) {
      console.log('Exchanging code for session...');
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        throw exchangeError;
      }
      console.log('Session created successfully');
      return data;
    }

    if (accessToken && refreshToken) {
      console.log('Setting session from implicit flow tokens...');
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      console.log('Session created successfully');
      return data;
    }

    throw new Error('No authorization code or tokens found');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    throw new Error(error.message || 'OAuth callback failed');
  }
};
