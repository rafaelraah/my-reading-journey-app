import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { toast } from 'sonner';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'titulo' | 'created_at'>('created_at');

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
    const { error } = await supabase
      .from('livros')
      .insert({ ...book, status: 'quero_ler' });

    if (error) {
      toast.error('Erro ao adicionar livro');
      console.error(error);
      return false;
    }
    toast.success('Livro adicionado com sucesso!');
    await fetchBooks();
    return true;
  };

  const updateStatus = async (id: string, status: Book['status']) => {
    // Optimistic update
    setBooks(prev => prev.map(b => b.id === id ? { ...b, status } : b));

    const { error } = await supabase
      .from('livros')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
      await fetchBooks();
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
    filter,
    setFilter,
    sortBy,
    setSortBy,
  };
}
