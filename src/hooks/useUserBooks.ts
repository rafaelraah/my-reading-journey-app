import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { toast } from 'sonner';
import { useBookEvents } from './useBookEvents';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to manage user's books via usuario_livros + livros_globais join.
 * Replaces useBooks for the Kanban and profile views.
 */
export function useUserBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<(Book & { user_book_id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'titulo' | 'created_at'>('created_at');
  const { logCreated, logMoved, logRated, logReviewAdded } = useBookEvents();

  const fetchBooks = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('usuario_livros')
      .select('*, livros_globais(*)')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar livros');
      console.error(error);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((ub: any) => {
      const gb = ub.livros_globais;
      return {
        id: gb.id,
        user_book_id: ub.id,
        titulo: gb.titulo,
        autor: gb.autor,
        paginas: gb.paginas,
        categoria: gb.categoria,
        imagem_url: gb.imagem_url,
        status: ub.status as Book['status'],
        rating: ub.rating,
        review: ub.review,
        created_at: ub.created_at,
        completion_date: ub.completion_date ?? null,
      };
    });

    // Sort
    if (sortBy === 'titulo') {
      mapped.sort((a: any, b: any) => a.titulo.localeCompare(b.titulo));
    }

    setBooks(mapped);
    setLoading(false);
  }, [user, sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const addBookToShelf = async (livroId: string, status: Book['status']) => {
    if (!user) return false;

    const { error } = await supabase.from('usuario_livros').insert({
      usuario_id: user.id,
      livro_id: livroId,
      status,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Livro já está na sua estante!');
      } else {
        toast.error('Erro ao adicionar livro');
      }
      return false;
    }

    toast.success('Livro adicionado à sua estante!');
    await logCreated(livroId, user.id);
    await fetchBooks();
    return true;
  };

  const updateStatus = async (bookId: string, status: Book['status']) => {
    if (!user) return;

    // Find the user_book entry
    const ub = books.find(b => b.id === bookId);
    if (!ub) return;

    // Optimistic update
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status } : b));

    const { error } = await supabase
      .from('usuario_livros')
      .update({ status })
      .eq('id', ub.user_book_id);

    if (error) {
      toast.error('Erro ao atualizar status');
      await fetchBooks();
    } else {
      await logMoved(bookId, status, user.id);
    }
  };

  const saveReview = async (bookId: string, rating: number, review: string, completionDate?: string | null) => {
    const ub = books.find(b => b.id === bookId);
    if (!ub) return;

    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, rating, review, completion_date: completionDate ?? b.completion_date } : b));

    const updatePayload: any = { rating, review };
    if (completionDate !== undefined) updatePayload.completion_date = completionDate;
    const { error } = await supabase
      .from('usuario_livros')
      .update(updatePayload)
      .eq('id', ub.user_book_id);

    if (error) {
      toast.error('Erro ao salvar avaliação');
      await fetchBooks();
    } else {
      await logRated(bookId, rating, user?.id);
      if (review.trim()) await logReviewAdded(bookId, user?.id);
    }
  };

  const deleteBook = async (bookId: string) => {
    const ub = books.find(b => b.id === bookId);
    if (!ub) return;

    setBooks(prev => prev.filter(b => b.id !== bookId));

    const { error } = await supabase
      .from('usuario_livros')
      .delete()
      .eq('id', ub.user_book_id);

    if (error) {
      toast.error('Erro ao remover livro');
      await fetchBooks();
    } else {
      toast.success('Livro removido da estante!');
    }
  };

  const isBookInShelf = useCallback((livroId: string) => {
    return books.some(b => b.id === livroId);
  }, [books]);

  const filteredBooks = filter === 'all'
    ? books
    : books.filter(b => b.categoria === filter);

  const getBooksByStatus = (status: Book['status']) =>
    filteredBooks.filter(b => b.status === status);

  return {
    books: filteredBooks,
    allBooks: books,
    loading,
    addBookToShelf,
    updateStatus,
    getBooksByStatus,
    saveReview,
    deleteBook,
    isBookInShelf,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    fetchBooks,
  };
}
