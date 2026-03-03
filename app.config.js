require('dotenv').config();

module.exports = {
  expo: {
    name: 'daily-life-support',
    slug: 'daily-life-support',
    version: '1.0.2',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dailylifesupport.app',
      buildNumber: '3',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.dailylifesupport.app',
    },
    plugins: [
      'expo-router',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'dynamic',
            deploymentTarget: '15.1',
          },
        },
      ],
    ],
    scheme: 'daily-life-support',
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: 'bd189b67-a06d-4c32-9c6c-66f414e1b19c',
      },
    },
  },
};

