import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePresence() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const ping = () => {
      (supabase as any).from('usuarios').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then(() => {});
    };
    ping();
    const interval = setInterval(ping, 30_000);
    const onVis = () => { if (!document.hidden) ping(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVis); };
  }, [user]);
}

export function isOnline(lastSeen?: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 90_000; // 90s window
}
