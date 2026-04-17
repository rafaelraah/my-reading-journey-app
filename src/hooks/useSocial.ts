import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PublicUser {
  id: string;
  nome: string;
  username: string | null;
  avatar_url: string | null;
  quero_ler: number;
  lendo: number;
  lido: number;
}

export interface Notification {
  id: string;
  tipo: string;
  mensagem: string;
  lido: boolean;
  created_at: string;
}

export function useSocial() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch who the current user follows
  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('seguidores')
      .select('seguido_id')
      .eq('seguidor_id', user.id);
    if (data) {
      setFollowing(new Set(data.map((d: any) => d.seguido_id)));
    }
  }, [user]);

  // Search users
  const searchUsers = useCallback(async (query: string = '') => {
    setLoading(true);
    let q = supabase.from('usuarios').select('id, nome, username, avatar_url');
    if (query.trim()) {
      q = q.or(`username.ilike.%${query}%,nome.ilike.%${query}%`);
    }
    const { data: usersData } = await q.limit(50);

    if (!usersData) { setLoading(false); return; }

    // Get book counts for each user
    const userIds = usersData.map((u: any) => u.id);
    const { data: booksData } = await supabase
      .from('usuario_livros')
      .select('usuario_id, status')
      .in('usuario_id', userIds);

    const counts: Record<string, { quero_ler: number; lendo: number; lido: number }> = {};
    (booksData || []).forEach((b: any) => {
      if (!counts[b.usuario_id]) counts[b.usuario_id] = { quero_ler: 0, lendo: 0, lido: 0 };
      if (b.status === 'quero_ler') counts[b.usuario_id].quero_ler++;
      else if (b.status === 'lendo') counts[b.usuario_id].lendo++;
      else if (b.status === 'lido') counts[b.usuario_id].lido++;
    });

    const mapped: PublicUser[] = usersData.map((u: any) => ({
      ...u,
      quero_ler: counts[u.id]?.quero_ler || 0,
      lendo: counts[u.id]?.lendo || 0,
      lido: counts[u.id]?.lido || 0,
    }));

    setUsers(mapped);
    setLoading(false);
  }, []);

  // Follow a user
  const followUser = useCallback(async (targetId: string, targetUsername: string) => {
    if (!user || targetId === user.id) return;

    const { error } = await supabase.from('seguidores').insert({
      seguidor_id: user.id,
      seguido_id: targetId,
    } as any);

    if (error) {
      if (error.code === '23505') {
        toast.info('Você já segue este usuário');
      } else {
        toast.error('Erro ao seguir usuário');
      }
      return;
    }

    // Create notification for the followed user
    await supabase.from('notificacoes').insert({
      usuario_id: targetId,
      tipo: 'follow',
      mensagem: `${user.nome} (@${user.username}) começou a seguir você`,
    } as any);

    setFollowing(prev => new Set([...prev, targetId]));
    toast.success(`Você começou a seguir @${targetUsername}`);
  }, [user]);

  // Unfollow a user
  const unfollowUser = useCallback(async (targetId: string) => {
    if (!user) return;

    await supabase.from('seguidores')
      .delete()
      .eq('seguidor_id', user.id)
      .eq('seguido_id', targetId);

    setFollowing(prev => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
    toast.success('Deixou de seguir');
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: any) => !n.lido).length);
    }
  }, [user]);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('notificacoes')
      .update({ lido: true } as any)
      .eq('usuario_id', user.id)
      .eq('lido', false);
    setNotifications(prev => prev.map(n => ({ ...n, lido: true })));
    setUnreadCount(0);
  }, [user]);

  // Get follower/following counts for a user
  const getFollowCounts = useCallback(async (userId: string) => {
    const [{ count: followers }, { count: followingCount }] = await Promise.all([
      supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguido_id', userId),
      supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguidor_id', userId),
    ]);
    return { followers: followers || 0, following: followingCount || 0 };
  }, []);

  // Get list of users that follow `userId` (followers)
  const getFollowersList = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('seguidores')
      .select('seguidor_id, usuarios!seguidores_seguidor_id_fkey(id, nome, username, avatar_url)')
      .eq('seguido_id', userId);
    return ((data as any[]) || []).map((r) => r.usuarios).filter(Boolean);
  }, []);

  // Get list of users that `userId` follows (following)
  const getFollowingList = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('seguidores')
      .select('seguido_id, usuarios!seguidores_seguido_id_fkey(id, nome, username, avatar_url)')
      .eq('seguidor_id', userId);
    return ((data as any[]) || []).map((r) => r.usuarios).filter(Boolean);
  }, []);

  useEffect(() => {
    fetchFollowing();
    fetchNotifications();
  }, [fetchFollowing, fetchNotifications]);

  return {
    users,
    loading,
    following,
    notifications,
    unreadCount,
    searchUsers,
    followUser,
    unfollowUser,
    fetchNotifications,
    markAllRead,
    getFollowCounts,
    getFollowersList,
    getFollowingList,
  };
}
