import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { toast } from 'sonner';
import { useBookEvents } from './useBookEvents';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'titulo' | 'created_at'>('created_at');
  const { logCreated, logMoved, logRated, logReviewAdded } = useBookEvents();

  const fetchBooks = useCallback(async () => {
    const { data, error } = await supabase
      .from('livros')
      .select('*')
      .order(sortBy, { ascending: sortBy === 'titulo' });

    if (error) {
      toast.error('Erro ao carregar livros');
      console.error(error);
    } else {
      setBooks(data as Book[]);
    }
    setLoading(false);
  }, [sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const addBook = async (book: Omit<Book, 'id' | 'created_at' | 'status'>) => {
    const { data, error } = await supabase
      .from('livros')
      .insert({ ...book, status: 'quero_ler' } as any)
      .select()
      .single();

    if (error) {
      toast.error('Erro ao adicionar livro');
      console.error(error);
      return false;
    }
    toast.success('Livro adicionado com sucesso!');
    if (data) {
      await logCreated(data.id);
    }
    await fetchBooks();
    return true;
  };

  const updateStatus = async (id: string, status: Book['status']) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, status } : b));

    const { error } = await supabase
      .from('livros')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
      await fetchBooks();
    } else {
      await logMoved(id, status);
    }
  };

  const saveReview = async (id: string, rating: number, review: string) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, rating, review } : b));
    const { error } = await supabase
      .from('livros')
      .update({ rating, review })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao salvar avaliação');
      await fetchBooks();
    } else {
      await logRated(id, rating);
      if (review.trim()) {
        await logReviewAdded(id);
      }
    }
  };

  const deleteBook = async (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    const { error } = await supabase
      .from('livros')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Erro ao excluir livro');
      await fetchBooks();
    } else {
      toast.success('Livro excluído com sucesso!');
    }
  };

  const uploadCover = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('book-covers')
      .upload(fileName, file);

    if (error) {
      toast.error('Erro ao fazer upload da capa');
      return null;
    }

    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const filteredBooks = filter === 'all'
    ? books
    : books.filter(b => b.categoria === filter);

  const getBooksByStatus = (status: Book['status']) =>
    filteredBooks.filter(b => b.status === status);

  return {
    books: filteredBooks,
    loading,
    addBook,
    updateStatus,
    uploadCover,
    getBooksByStatus,
    saveReview,
    deleteBook,
    filter,
    setFilter,
    sortBy,
    setSortBy,
  };
}
