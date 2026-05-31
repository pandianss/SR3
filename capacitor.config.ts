import { CapacitorConfig } from '@capacitor/cli';

// Production config — always loads from bundled dist/.
// For live-reload during development, temporarily override server.url manually
// (do NOT commit that change):
//   server: { url: 'http://10.0.2.2:5173', cleartext: true }

const config: CapacitorConfig = {
  appId: 'com.superrecall.caiib',
  appName: 'SuperRecall - CAIIB',
  webDir: 'dist',

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
    minWebViewVersion: 80,
    allowMixedContent: false,
    backgroundColor: '#0B1929',
  },
};

export default config;
