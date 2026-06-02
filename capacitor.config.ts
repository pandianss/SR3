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
    FirebaseAuthentication: {
      // The app uses the Firebase *JS* SDK for Firestore, so the JS auth
      // instance must be the signed-in one. skipNativeAuth keeps the plugin
      // from also signing into the native Firebase SDK (unused, redundant) —
      // it only performs Google Sign-In to hand back an idToken, which we
      // exchange via signInWithCredential() in firebase.js.
      skipNativeAuth: true,
      providers: ["google.com"],
    },
  },

  server: {
    // Explicit for clarity — this is already the Capacitor 8 default. The app
    // is served from https://localhost on Android. Native Google sign-in goes
    // through the FirebaseAuthentication plugin (not a WebView redirect), so
    // this scheme does not affect the auth flow; it's set so the origin (and
    // therefore localStorage) stays stable if the Capacitor default ever changes.
    androidScheme: "https",
  },

  android: {
    minWebViewVersion: 80,
    allowMixedContent: false,
    backgroundColor: '#0B1929',
  },
};

export default config;
