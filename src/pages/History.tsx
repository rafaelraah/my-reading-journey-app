import { useEffect, useState } from 'react';
import { useBookEvents, BookEvent } from '@/hooks/useBookEvents';
import { EventTimeline } from '@/components/EventTimeline';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { Loader2, ScrollText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserActivity } from '@/hooks/useUserActivity';
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
  { value: 'recommended', label: 'Recomendação' },
  { value: 'removed', label: 'Remoção' },
  { value: 'post', label: 'Publicação' },
  { value: 'reply', label: 'Resposta' },
  { value: 'follow', label: 'Seguindo' },
];

const History = () => {
  const { user } = useAuth();
  const { fetchUserActivity } = useUserActivity();
  const [books, setBooks] = useState<Pick<Book, 'id' | 'titulo'>[]>([]);
  const [allEvents, setAllEvents] = useState<BookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState('all');
  const [livroFilter, setLivroFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchUserActivity(user.id).then((evts) => {
      setAllEvents(evts);
      // Build the list of distinct books referenced in the events
      const seen = new Map<string, string>();
      evts.forEach((e) => {
        if (e.livro_id && e.livro_titulo) seen.set(e.livro_id, e.livro_titulo);
      });
      setBooks(Array.from(seen.entries()).map(([id, titulo]) => ({ id, titulo })));
      setLoading(false);
    });
  }, [user, fetchUserActivity]);

  const filteredEvents = allEvents.filter((e) => {
    if (tipoFilter !== 'all' && e.tipo !== tipoFilter) return false;
    if (livroFilter !== 'all' && e.livro_id !== livroFilter) return false;
    return true;
  });

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
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="parchment-bg rounded-lg border border-border p-6 animate-fade-in">
            <EventTimeline events={filteredEvents} showBookTitle />
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
