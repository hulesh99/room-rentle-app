import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported, onMessage } from 'firebase/messaging';

const env = import.meta.env;

// Protect Firebase from accidental CSV-style commas/quotes in .env values.
const cleanEnv = (value) => String(value || '').trim().replace(/,$/, '').trim().replace(/^['"]|['"]$/g, '');

export const vapidKey = cleanEnv(env.VITE_FIREBASE_VAPID_KEY);

export const firebaseConfig = {
  apiKey: cleanEnv(env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(env.VITE_FIREBASE_APP_ID),
};

const REQUIRED_KEYS = ['apiKey', 'projectId', 'messagingSenderId', 'appId'];
const missingKeys = REQUIRED_KEYS.filter((key) => !firebaseConfig[key]);

export const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured) {
  console.warn(
    `Push notifications disabled - missing Firebase config in client/.env: ${missingKeys.join(', ')}`
  );
}

let messaging = null;
if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase messaging init failed:', error.message);
    messaging = null;
  }
}

export const isMessagingSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && isSupported();

export const getFirebaseMessaging = () => messaging;

export const listenForegroundMessages = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => callback(payload));
};
