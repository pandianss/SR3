import { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV !== 'production';

const config: CapacitorConfig = {
  appId: 'com.superrecall.caiib',
  appName: 'SuperRecall - CAIIB',
  webDir: 'dist',

  // In development, point the WebView at the Vite dev server so hot-reload works.
  // In production builds this block is omitted and the bundled dist/ is used.
  ...(isDev && {
    server: {
      url: 'http://10.0.2.2:5173', // Android emulator loopback to host machine
      cleartext: true,             // allow HTTP in dev only
    }
  }),

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0B1929',   // matches C.bg in theme.js
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  android: {
    // Target Android 13+ (API 33) — required by current Play Store policy
    minWebViewVersion: 80,
    allowMixedContent: false,       // HTTPS only in production
    backgroundColor: '#0B1929',
  },
};

export default config;
