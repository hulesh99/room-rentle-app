import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let messaging = null;

const cleanEnv = (value) => String(value || '').trim().replace(/,$/, '').trim().replace(/^['"]|['"]$/g, '');

const FIREBASE_PROJECT_ID = cleanEnv(process.env.FIREBASE_PROJECT_ID);
const FIREBASE_CLIENT_EMAIL = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL);
const FIREBASE_PRIVATE_KEY = cleanEnv(process.env.FIREBASE_PRIVATE_KEY);

if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    messaging = getMessaging();
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.warn(`Firebase Admin init failed: ${error.message}`);
  }
} else {
  console.warn('Firebase Admin not configured — push notifications disabled');
}

export const isPushConfigured = () => Boolean(messaging);

export const sendMulticast = async (tokens, messagePayload) => {
  if (!messaging || !tokens.length) return null;
  return messaging.sendEachForMulticast({ tokens, ...messagePayload });
};
