import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('@/firebase.js', () => ({ firebaseConfig: { apiKey: 'test-key', projectId: 'test-project' } }));
import { registerServiceWorker } from '@/services/pushWorker';
afterEach(() => vi.unstubAllGlobals());
describe('push worker registration', () => {
  it('shares a configured registration between concurrent callers', async () => {
    const registration = { active: { state: 'activated', addEventListener: vi.fn(), removeEventListener: vi.fn() } };
    const register = vi.fn().mockResolvedValue(registration);
    vi.stubGlobal('navigator', { serviceWorker: { register } });
    await Promise.all([registerServiceWorker(), registerServiceWorker()]);
    expect(register).toHaveBeenCalledTimes(1);
    const url = new URL(register.mock.calls[0][0], 'http://localhost');
    expect(JSON.parse(url.searchParams.get('config')).apiKey).toBe('test-key');
  });
  it('waits for the replacement worker even when an old worker is active', async () => {
    let change;
    const installing = { state: 'installing', addEventListener: (_, cb) => { change = cb; }, removeEventListener: vi.fn() };
    const registration = { active: { state: 'activated' }, installing };
    vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn().mockResolvedValue(registration) } });
    let resolved = false;
    const pending = registerServiceWorker().then(() => { resolved = true; });
    await Promise.resolve();
    await Promise.resolve();
    expect(resolved).toBe(false);
    installing.state = 'activated';
    change();
    await pending;
    expect(resolved).toBe(true);
  });
});
