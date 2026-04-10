import { useEffect, useState } from 'react';
import { useBookEvents, BookEvent } from '@/hooks/useBookEvents';
import { EventTimeline } from '@/components/EventTimeline';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { Loader2, ScrollText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EVENT_TYPES = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'created', label: 'Criação' },
  { value: 'moved', label: 'Movimentação' },
  { value: 'rated', label: 'Avaliação' },
  { value: 'review_added', label: 'Resenha' },
];

const History = () => {
  const { fetchGlobalEvents, globalEvents, loadingGlobal } = useBookEvents();
  const [books, setBooks] = useState<Pick<Book, 'id' | 'titulo'>[]>([]);
  const [tipoFilter, setTipoFilter] = useState('all');
  const [livroFilter, setLivroFilter] = useState('all');

  useEffect(() => {
    supabase.from('livros').select('id, titulo').order('titulo').then(({ data }) => {
      if (data) setBooks(data as Pick<Book, 'id' | 'titulo'>[]);
    });
  }, []);

  useEffect(() => {
    fetchGlobalEvents({ tipo: tipoFilter, livroId: livroFilter });
  }, [tipoFilter, livroFilter, fetchGlobalEvents]);

  // Enrich events with book titles
  const enrichedEvents: BookEvent[] = globalEvents.map(e => ({
    ...e,
    livro_titulo: books.find(b => b.id === e.livro_id)?.titulo,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="parchment-bg border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <ScrollText className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-wide">
                Histórico
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                Toda a sua jornada de leitura em um só lugar
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-48 font-display text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value} className="font-display text-sm">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={livroFilter} onValueChange={setLivroFilter}>
            <SelectTrigger className="w-56 font-display text-sm">
              <SelectValue placeholder="Todos os livros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-display text-sm">Todos os livros</SelectItem>
              {books.map(b => (
                <SelectItem key={b.id} value={b.id} className="font-display text-sm">
                  {b.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timeline */}
        {loadingGlobal ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="parchment-bg rounded-lg border border-border p-6 animate-fade-in">
            <EventTimeline events={enrichedEvents} showBookTitle />
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
