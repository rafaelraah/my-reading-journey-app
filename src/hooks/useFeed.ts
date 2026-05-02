import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeedAuthor {
  id: string;
  nome: string;
  username: string | null;
  avatar_url: string | null;
}

export interface FeedItem {
  id: string;
  kind: 'event' | 'post';
  created_at: string;
  author: FeedAuthor | null;
  // event-specific
  tipo?: string;
  descricao?: string;
  livro_id?: string;
  livro_titulo?: string;
  livro_imagem?: string | null;
  // post-specific
  conteudo?: string;
}

/**
 * Aggregate book events + user posts into a single chronological feed.
 * If `userIds` is provided, restricts to those users (e.g., "following only").
 */
export function useFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFeed = useCallback(async (userIds?: string[]) => {
    setLoading(true);

    // If userIds is an empty array (e.g., user follows nobody), return empty.
    if (userIds && userIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Events
    let evQ = supabase
      .from('livro_eventos')
      .select('id, livro_id, usuario_id, tipo, descricao, created_at, livros_globais(titulo, imagem_url)')
      .not('usuario_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);
    if (userIds) evQ = evQ.in('usuario_id', userIds);

    // Posts
    let postQ = supabase
      .from('posts')
      .select('id, usuario_id, conteudo, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (userIds) postQ = postQ.in('usuario_id', userIds);

    const [{ data: evData }, { data: postData }] = await Promise.all([evQ, postQ]);

    // Collect all author ids
    const authorIds = new Set<string>();
    (evData as any[] || []).forEach((e) => e.usuario_id && authorIds.add(e.usuario_id));
    (postData as any[] || []).forEach((p) => p.usuario_id && authorIds.add(p.usuario_id));

    let authors: Record<string, FeedAuthor> = {};
    if (authorIds.size > 0) {
      const { data: usersData } = await supabase
        .from('usuarios')
        .select('id, nome, username, avatar_url')
        .in('id', Array.from(authorIds));
      (usersData as any[] || []).forEach((u) => { authors[u.id] = u; });
    }

    const evItems: FeedItem[] = (evData as any[] || []).map((e) => ({
      id: `e-${e.id}`,
      kind: 'event',
      created_at: e.created_at,
      author: authors[e.usuario_id] || null,
      tipo: e.tipo,
      descricao: e.descricao,
      livro_id: e.livro_id,
      livro_titulo: e.livros_globais?.titulo,
      livro_imagem: e.livros_globais?.imagem_url,
    }));

    const postItems: FeedItem[] = (postData as any[] || []).map((p) => ({
      id: `p-${p.id}`,
      kind: 'post',
      created_at: p.created_at,
      author: authors[p.usuario_id] || null,
      conteudo: p.conteudo,
    }));

    const merged = [...evItems, ...postItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setItems(merged);
    setLoading(false);
  }, []);

  const createPost = useCallback(async (usuarioId: string, conteudo: string) => {
    const text = conteudo.trim();
    if (!text) return { error: 'Conteúdo vazio' };
    const { error } = await supabase.from('posts').insert({ usuario_id: usuarioId, conteudo: text } as any);
    return { error: error?.message || null };
  }, []);

  return { items, loading, fetchFeed, createPost };
}