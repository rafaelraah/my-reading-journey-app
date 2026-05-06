import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  de_usuario_id: string;
  para_usuario_id: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export function useConversation(otherUserId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  const load = useCallback(async () => {
    if (!user || !otherUserId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('mensagens')
      .select('*')
      .or(`and(de_usuario_id.eq.${user.id},para_usuario_id.eq.${otherUserId}),and(de_usuario_id.eq.${otherUserId},para_usuario_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(500);
    setMessages((data as ChatMessage[]) || []);
    setLoading(false);
    // mark received as read
    await (supabase as any)
      .from('mensagens')
      .update({ lida: true })
      .eq('para_usuario_id', user.id)
      .eq('de_usuario_id', otherUserId)
      .eq('lida', false);
  }, [user, otherUserId]);

  useEffect(() => {
    load();
    if (!user || !otherUserId) return;

    const ch = (supabase as any)
      .channel(`chat-${[user.id, otherUserId].sort().join('-')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload: any) => {
        const m = payload.new as ChatMessage;
        const involved =
          (m.de_usuario_id === user.id && m.para_usuario_id === otherUserId) ||
          (m.de_usuario_id === otherUserId && m.para_usuario_id === user.id);
        if (!involved) return;
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        if (m.para_usuario_id === user.id) {
          (supabase as any).from('mensagens').update({ lida: true }).eq('id', m.id).then(() => {});
        }
      })
      .subscribe();
    channelRef.current = ch;
    return () => { (supabase as any).removeChannel(ch); };
  }, [user, otherUserId, load]);

  const send = useCallback(async (text: string) => {
    if (!user || !otherUserId || !text.trim()) return;
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      de_usuario_id: user.id,
      para_usuario_id: otherUserId,
      mensagem: text.trim(),
      lida: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    const { data } = await (supabase as any)
      .from('mensagens')
      .insert({ de_usuario_id: user.id, para_usuario_id: otherUserId, mensagem: text.trim() })
      .select()
      .single();
    if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? (data as ChatMessage) : m));
    }
  }, [user, otherUserId]);

  return { messages, loading, send };
}

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('mensagens')
      .select('de_usuario_id')
      .eq('para_usuario_id', user.id)
      .eq('lida', false);
    const counts: Record<string, number> = {};
    (data || []).forEach((r: any) => { counts[r.de_usuario_id] = (counts[r.de_usuario_id] || 0) + 1; });
    setUnreadByUser(counts);
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = (supabase as any)
      .channel(`unread-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens' }, (payload: any) => {
        const m = payload.new || payload.old;
        if (m && (m.para_usuario_id === user.id || m.de_usuario_id === user.id)) refresh();
      })
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [user, refresh]);

  return { unreadByUser, refresh };
}
