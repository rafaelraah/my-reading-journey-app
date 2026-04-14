import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GlobalBook {
  id: string;
  titulo: string;
  autor: string;
  paginas: number;
  categoria: string;
  imagem_url: string | null;
  created_at: string;
}

export interface UserBook {
  id: string;
  usuario_id: string;
  livro_id: string;
  status: 'quero_ler' | 'lendo' | 'lido';
  rating: number | null;
  review: string | null;
  current_page: number;
  created_at: string;
}

export function useGlobalBooks() {
  const [globalBooks, setGlobalBooks] = useState<GlobalBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchGlobalBooks = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('livros_globais')
      .select('*')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      query = query.or(`titulo.ilike.%${search}%,autor.ilike.%${search}%`);
    }
    if (categoryFilter !== 'all') {
      query = query.eq('categoria', categoryFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
    } else {
      setGlobalBooks(data as GlobalBook[]);
    }
    setLoading(false);
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchGlobalBooks();
  }, [fetchGlobalBooks]);

  const addGlobalBook = async (book: Omit<GlobalBook, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('livros_globais').insert(book);
    if (error) {
      toast.error('Erro ao adicionar livro à biblioteca global');
      return false;
    }
    toast.success('Livro adicionado à biblioteca global!');
    await fetchGlobalBooks();
    return true;
  };

  const addBookToUser = async (usuarioId: string, livroId: string, status: string) => {
    const { error } = await supabase.from('usuario_livros').insert({
      usuario_id: usuarioId,
      livro_id: livroId,
      status,
    });
    if (error) {
      if (error.code === '23505') {
        toast.error('Livro já está no seu perfil!');
      } else {
        toast.error('Erro ao adicionar livro ao perfil');
      }
      return false;
    }
    toast.success('Livro adicionado ao seu perfil!');
    return true;
  };

  const getBookStats = async (livroId: string) => {
    const { data: userBooks } = await supabase
      .from('usuario_livros')
      .select('rating, status')
      .eq('livro_id', livroId);

    if (!userBooks) return { avgRating: 0, totalReaders: 0 };

    const readers = userBooks.filter(ub => ub.status === 'lido').length;
    const ratings = userBooks.filter(ub => ub.rating && ub.rating > 0);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, ub) => sum + (ub.rating || 0), 0) / ratings.length
      : 0;

    return { avgRating: Math.round(avgRating * 10) / 10, totalReaders: readers };
  };

  const uploadCover = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('book-covers').upload(fileName, file);
    if (error) {
      toast.error('Erro ao fazer upload da capa');
      return null;
    }
    const { data } = supabase.storage.from('book-covers').getPublicUrl(fileName);
    return data.publicUrl;
  };

  return {
    globalBooks,
    loading,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    addGlobalBook,
    addBookToUser,
    getBookStats,
    uploadCover,
    fetchGlobalBooks,
  };
}
