import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const mocks = vi.hoisted(() => ({ getToken: vi.fn(), save: vi.fn(), dispatch: vi.fn(), worker: vi.fn() }));
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch, useSelector: fn => fn({ auth: { user: { id: 'user-1' }, accessToken: 'session' } }) }));
vi.mock('firebase/messaging', () => ({ getToken: mocks.getToken, isSupported: async () => true }));
vi.mock('@/firebase.js', () => ({ vapidKey: 'key', isFirebaseConfigured: true, getFirebaseMessaging: () => ({}), listenForegroundMessages: () => () => {} }));
vi.mock('@/services/pushWorker', () => ({ registerServiceWorker: mocks.worker }));
vi.mock('@/redux/slices/notificationsApiSlice', () => ({ notificationsApi: { endpoints: { saveFcmToken: { initiate: mocks.save } } } }));
vi.mock('@/redux/slices/apiSlice', () => ({ apiSlice: { util: { invalidateTags: vi.fn() } } }));
import { useFirebase } from '@/hooks/useFirebase';
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() });
  mocks.worker.mockResolvedValue({});
  mocks.getToken.mockResolvedValue('token');
  mocks.dispatch.mockReturnValue({ unwrap: async () => ({}) });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('Firebase token recovery', () => {
  it('retries a failed server save and cancels timers on unmount', async () => {
    mocks.dispatch.mockReturnValueOnce({ unwrap: async () => { throw new Error('offline'); } });
    const hook = renderHook(() => useFirebase());
    await act(flush);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mocks.save).toHaveBeenCalledTimes(2);
    hook.unmount();
    await vi.advanceTimersByTimeAsync(60000);
    expect(mocks.save).toHaveBeenCalledTimes(2);
  });
  it('does not prompt automatically and registers after permission is granted', async () => {
    Notification.permission = 'default';
    const hook = renderHook(() => useFirebase());
    await act(flush);
    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(mocks.getToken).not.toHaveBeenCalled();
    Notification.permission = 'granted';
    await act(async () => { window.dispatchEvent(new Event('push-permission-changed')); await flush(); });
    expect(mocks.save).toHaveBeenCalledTimes(1);
    hook.unmount();
  });
});
