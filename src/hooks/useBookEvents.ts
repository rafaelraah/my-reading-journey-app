import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STATUS_LABELS } from '@/types/book';

export interface BookEvent {
  id: string;
  livro_id: string;
  usuario_id?: string | null;
  tipo: string;
  descricao: string;
  created_at: string;
  livro_titulo?: string;
}

export function useBookEvents() {
  const [globalEvents, setGlobalEvents] = useState<BookEvent[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const logEvent = useCallback(async (livroId: string, tipo: string, descricao: string, usuarioId?: string) => {
    await supabase.from('livro_eventos').insert({ livro_id: livroId, tipo, descricao, usuario_id: usuarioId } as any);
  }, []);

  const logCreated = useCallback((livroId: string, usuarioId?: string) => {
    return logEvent(livroId, 'created', "Adicionado à lista 'Quero Ler'", usuarioId);
  }, [logEvent]);

  const logMoved = useCallback((livroId: string, status: string, usuarioId?: string) => {
    const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
    return logEvent(livroId, 'moved', `Movido para '${label}'`, usuarioId);
  }, [logEvent]);

  const logRated = useCallback((livroId: string, rating: number, usuarioId?: string) => {
    return logEvent(livroId, 'rated', `Avaliado com ${rating} estrelas`, usuarioId);
  }, [logEvent]);

  const logReviewAdded = useCallback((livroId: string, usuarioId?: string) => {
    return logEvent(livroId, 'review_added', 'Resenha adicionada', usuarioId);
  }, [logEvent]);

  const fetchBookEvents = useCallback(async (livroId: string): Promise<BookEvent[]> => {
    const { data } = await supabase
      .from('livro_eventos')
      .select('*')
      .eq('livro_id', livroId)
      .order('created_at', { ascending: false });
    return (data as BookEvent[]) || [];
  }, []);

  /**
   * Fetch ALL events of a specific user, joining book titles.
   * Filters by usuario_id directly (no row-count limit beyond 1000 default).
   */
  const fetchUserEvents = useCallback(async (usuarioId: string): Promise<BookEvent[]> => {
    const { data } = await supabase
      .from('livro_eventos')
      .select('*, livros_globais!livro_eventos_livro_id_fkey(titulo)')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(500);

    return ((data as any[]) || []).map((e) => ({
      id: e.id,
      livro_id: e.livro_id,
      usuario_id: e.usuario_id,
      tipo: e.tipo,
      descricao: e.descricao,
      created_at: e.created_at,
      livro_titulo: e.livros_globais?.titulo,
    }));
  }, []);

  const fetchGlobalEvents = useCallback(async (filters?: { tipo?: string; livroId?: string }) => {
    setLoadingGlobal(true);
    let query = supabase
      .from('livro_eventos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters?.tipo && filters.tipo !== 'all') {
      query = query.eq('tipo', filters.tipo);
    }
    if (filters?.livroId && filters.livroId !== 'all') {
      query = query.eq('livro_id', filters.livroId);
    }

    const { data } = await query;
    setGlobalEvents((data as BookEvent[]) || []);
    setLoadingGlobal(false);
  }, []);

  return {
    logCreated,
    logMoved,
    logRated,
    logReviewAdded,
    fetchBookEvents,
    fetchUserEvents,
    fetchGlobalEvents,
    globalEvents,
    loadingGlobal,
  };
}
