import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STATUS_LABELS } from '@/types/book';

export interface BookEvent {
  id: string;
  livro_id: string;
  tipo: string;
  descricao: string;
  created_at: string;
  livro_titulo?: string;
}

export function useBookEvents() {
  const [globalEvents, setGlobalEvents] = useState<BookEvent[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const logEvent = useCallback(async (livroId: string, tipo: string, descricao: string) => {
    await supabase.from('livro_eventos').insert({ livro_id: livroId, tipo, descricao });
  }, []);

  const logCreated = useCallback((livroId: string) => {
    return logEvent(livroId, 'created', "Adicionado à lista 'Quero Ler'");
  }, [logEvent]);

  const logMoved = useCallback((livroId: string, status: string) => {
    const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
    return logEvent(livroId, 'moved', `Movido para '${label}'`);
  }, [logEvent]);

  const logRated = useCallback((livroId: string, rating: number) => {
    return logEvent(livroId, 'rated', `Avaliado com ${rating} estrelas`);
  }, [logEvent]);

  const logReviewAdded = useCallback((livroId: string) => {
    return logEvent(livroId, 'review_added', 'Resenha adicionada');
  }, [logEvent]);

  const fetchBookEvents = useCallback(async (livroId: string): Promise<BookEvent[]> => {
    const { data } = await supabase
      .from('livro_eventos')
      .select('*')
      .eq('livro_id', livroId)
      .order('created_at', { ascending: false });
    return (data as BookEvent[]) || [];
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
    fetchGlobalEvents,
    globalEvents,
    loadingGlobal,
  };
}
