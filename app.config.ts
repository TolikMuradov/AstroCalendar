import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

export default ({ config }: any) => ({
  ...config,
  name: 'AstroCalendar',
  slug: 'astrocalendar',
  scheme: 'astrocalendar',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#0A0118',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.studio916.astrocalendar',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0A0118',
    },
    package: 'com.studio916.astrocalendar',
  },
  extra: {
    openaiApiKey: process.env.VITE_OPENAI_API_KEY,
    admobAppId: process.env.VITE_ADMOB_APP_ID,
    admobAppOpenId: process.env.VITE_ADMOB_APP_OPEN_ID,
    admobRewardedId: process.env.VITE_ADMOB_APP_REWARDED_ID,
    cloudFunctions: process.env.VITE_CLOUD_FUNCTIONS,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    eas: {
      projectId: 'a979dcdf-1e08-4289-81ca-0cd4b2c70be0',
    },
  },
  plugins: [
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-5521590521676349~4769244660',
        iosAppId: 'ca-app-pub-5521590521676349~4769244660',
      },
    ],
    '@react-native-google-signin/google-signin'
  ],
  updates: {
    url: 'https://u.expo.dev/a979dcdf-1e08-4289-81ca-0cd4b2c70be0',
  },
  runtimeVersion: "1.0.0"
});
