import { firebaseConfig } from '@/firebase.js';

const waitForActiveWorker = async (registration, timeoutMs = 12000) => {
  const worker = registration.installing || registration.waiting || registration.active;
  if (!worker) throw new Error('Service worker registered without an installable worker');

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.removeEventListener('statechange', onStateChange);
      reject(new Error(`Service worker activation timed out (state: ${worker.state})`));
    }, timeoutMs);

    function onStateChange() {
      if (worker.state === 'activated') {
        clearTimeout(timeout);
        worker.removeEventListener('statechange', onStateChange);
        resolve();
      } else if (worker.state === 'redundant') {
        clearTimeout(timeout);
        worker.removeEventListener('statechange', onStateChange);
        reject(new Error('Service worker became redundant during activation'));
      }
    }

    worker.addEventListener('statechange', onStateChange);
    onStateChange();
  });

  return registration;
};

const registerWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[FCM] Service workers are not supported in this browser');
    return null;
  }
  const config = encodeURIComponent(
    JSON.stringify(firebaseConfig)
  );
  try {
    let registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${config}`);
    registration = await waitForActiveWorker(registration);
    if (import.meta.env.DEV) {
      console.info('[FCM] Service worker active:', registration.scope);
    }
    return registration;
  } catch (error) {
    console.warn('Service worker registration failed:', error.message);
    throw error;
  }
};


let pendingRegistration;
export const registerServiceWorker = () => {
  if (!pendingRegistration) {
    pendingRegistration = registerWorker().finally(() => { pendingRegistration = null; });
  }
  return pendingRegistration;
};
