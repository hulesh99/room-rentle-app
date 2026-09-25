import { useEffect, useState } from 'react';
import { isSupported } from 'firebase/messaging';
import { isFirebaseConfigured } from '@/firebase';
import { Button } from '@/components/ui/button';

export default function EnablePush() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState(() => typeof Notification === 'undefined' ? 'denied' : Notification.permission);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    isSupported().then((value) => { if (active) setSupported(value); }).catch(() => {});
    const refresh = () => { if (typeof Notification !== 'undefined') setPermission(Notification.permission); };
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, []);
  if (!supported || !isFirebaseConfigured || permission === 'granted') return null;
  const enable = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      window.dispatchEvent(new Event('push-permission-changed'));
    } catch {
      setError('Could not request permission. Please try again.');
    } finally { setBusy(false); }
  };
  return <div className="border-b px-5 py-3 text-sm">
    {permission === 'denied'
      ? <p>Notifications are blocked. Allow notifications in your browser?s site settings, then reload.</p>
      : <Button variant="outline" disabled={busy} onClick={enable}>Enable notifications</Button>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
