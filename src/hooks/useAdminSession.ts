import { useCallback, useEffect, useState } from 'react';
import { checkAdminSession, loginAdmin, logoutAdmin } from '@/lib/adminAuth';

export type AdminStatus = 'checking' | 'authed' | 'guest';

export const useAdminSession = () => {
  const [status, setStatus] = useState<AdminStatus>('checking');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const res = await checkAdminSession();
      setStatus(res.ok ? 'authed' : 'guest');
      if (!res.ok && res.error) setError(res.error);
    } catch {
      setStatus('guest');
      setError('Unable to verify admin session.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await loginAdmin(username, password);
      if (res.ok) {
        setStatus('authed');
      } else {
        setStatus('guest');
        setError(res.error || 'Invalid credentials.');
      }
    } catch {
      setStatus('guest');
      setError('Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await logoutAdmin();
    } catch {
      // Ignore logout errors and still clear state.
    } finally {
      setStatus('guest');
      setBusy(false);
    }
  }, []);

  return {
    status,
    error,
    busy,
    login,
    logout,
    refresh
  };
};
