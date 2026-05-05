import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BookEvent } from './useBookEvents';

const previewText = (value: string | null | undefined, max = 72) => {
  const text = (value || '').trim().replace(/\s+/g, ' ');
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};

export function useUserActivity() {
  const fetchUserActivity = useCallback(async (userId: string): Promise<BookEvent[]> => {
    const [eventsRes, postsRes, repliesRes, followsRes, userRes] = await Promise.all([
      supabase
        .from('livro_eventos')
        .select('id, livro_id, usuario_id, tipo, descricao, created_at, livros_globais!livro_eventos_livro_id_fkey(titulo)')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('posts')
        .select('id, conteudo, created_at')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      (supabase as any)
        .from('feed_respostas')
        .select('id, conteudo, target_kind, created_at')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('seguidores')
        .select('id, created_at, seguido_id, usuarios!seguidores_seguido_id_fkey(nome, username)')
        .eq('seguidor_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('usuarios')
        .select('created_at')
        .eq('id', userId)
        .single(),
    ]);

    const bookEvents: BookEvent[] = ((eventsRes.data as any[]) || []).map((event) => ({
      id: event.id,
      livro_id: event.livro_id,
      usuario_id: event.usuario_id,
      tipo: event.tipo,
      descricao: event.descricao,
      created_at: event.created_at,
      livro_titulo: event.livros_globais?.titulo,
    }));

    const postEvents: BookEvent[] = ((postsRes.data as any[]) || []).map((post) => ({
      id: `post-${post.id}`,
      livro_id: '',
      usuario_id: userId,
      tipo: 'post',
      descricao: `Publicou no feed: “${previewText(post.conteudo) || 'Sem texto'}”`,
      created_at: post.created_at,
    }));

    const replyEvents: BookEvent[] = ((repliesRes.data as any[]) || []).map((reply) => ({
      id: `reply-${reply.id}`,
      livro_id: '',
      usuario_id: userId,
      tipo: 'reply',
      descricao: `Respondeu em ${reply.target_kind === 'event' ? 'uma atividade' : 'uma publicação'}: “${previewText(reply.conteudo) || 'Sem texto'}”`,
      created_at: reply.created_at,
    }));

    const followEvents: BookEvent[] = ((followsRes.data as any[]) || []).map((follow) => {
      const target = follow.usuarios;
      const label = target?.username ? `@${target.username}` : target?.nome || 'outro leitor';

      return {
        id: `follow-${follow.id}`,
        livro_id: '',
        usuario_id: userId,
        tipo: 'follow',
        descricao: `Começou a seguir ${label}`,
        created_at: follow.created_at,
      };
    });

    const joinedEvent: BookEvent[] = userRes.data
      ? [{
          id: `joined-${userId}`,
          livro_id: '',
          usuario_id: userId,
          tipo: 'joined',
          descricao: 'Entrou para a comunidade de leitores',
          created_at: userRes.data.created_at,
        }]
      : [];

    return [...bookEvents, ...postEvents, ...replyEvents, ...followEvents, ...joinedEvent].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, []);

  return { fetchUserActivity };
}