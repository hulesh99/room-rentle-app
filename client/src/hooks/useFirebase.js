import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getToken, isSupported } from 'firebase/messaging';
import toast from 'react-hot-toast';
import { vapidKey, getFirebaseMessaging, listenForegroundMessages, isFirebaseConfigured } from '@/firebase.js';
import { notificationsApi } from '@/redux/slices/notificationsApiSlice';
import { apiSlice } from '@/redux/slices/apiSlice';
import { registerServiceWorker } from '@/services/pushWorker';
import { bumpUnread } from '@/redux/slices/notifSlice';

export function useFirebase() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id);
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!userId || !accessToken) return undefined;

    let cancelled = false;

    let running = false;
    let retryTimer;
    let retryDelay = 2000;
    const setup = async () => {
      if (cancelled || running || !navigator.onLine) return;
      running = true;
      clearTimeout(retryTimer);
      try {
        if (!isFirebaseConfigured || !(await isSupported())) return;
        // Request permission only from the Enable notifications button.
        if (Notification.permission !== 'granted') return;
        const registration = await registerServiceWorker();
        if (cancelled || !registration) return;
        const messaging = getFirebaseMessaging();
        if (!messaging) return;
        const token = await getToken(messaging, {
          vapidKey: vapidKey || undefined,
          serviceWorkerRegistration: registration,
        });
        if (cancelled) return;
        if (!token) throw new Error('Firebase returned an empty registration token');
        await dispatch(notificationsApi.endpoints.saveFcmToken.initiate({ token, device: 'web' })).unwrap();
        retryDelay = 2000;
        if (import.meta.env.DEV) console.info('[FCM] Token saved successfully on the server');
      } catch (error) {
        console.error('[FCM] Token setup failed; will retry:', error);
        if (!cancelled) {
          retryTimer = setTimeout(setup, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 60000);
        }
      } finally {
        running = false;
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') setup();
    };
    window.addEventListener('online', setup);
    window.addEventListener('push-permission-changed', setup);
    document.addEventListener('visibilitychange', onVisible);
    setup();

    const unsubscribe = listenForegroundMessages((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'RoomRental';
      const body = payload.notification?.body || payload.data?.body || '';
      if (import.meta.env.DEV) {
        console.info('[FCM] Foreground message received:', { title, body, data: payload.data });
      }
      toast(`${title}${body ? `: ${body}` : ''}`, {
        icon: '🔔',
        duration: 6000,
      });
      dispatch(bumpUnread());
      dispatch(
        apiSlice.util.invalidateTags([
          { type: 'Notification', id: 'LIST' },
          { type: 'Notification', id: 'COUNT' },
        ])
      );
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready
          .then((registration) => registration.showNotification(title, {
            body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            data: { ...(payload.data || {}), link: payload.data?.link || '/' },
            tag: payload.messageId || undefined,
          }))
          .catch((error) => console.error('[FCM] Foreground notification display failed:', error));
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      window.removeEventListener('online', setup);
      window.removeEventListener('push-permission-changed', setup);
      document.removeEventListener('visibilitychange', onVisible);
      unsubscribe();
    };
  }, [userId, accessToken, dispatch]);
}
