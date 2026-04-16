import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/hooks/useSocial';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/StarRating';
import { EventTimeline } from '@/components/EventTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, BookOpen, Loader2, Star, Clock, BarChart3 } from 'lucide-react';
import { Book } from '@/types/book';
import { BookEvent } from '@/hooks/useBookEvents';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileBook extends Book {
  user_book_id: string;
}

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const { following, followUser, unfollowUser, getFollowCounts } = useSocial();

  const [profile, setProfile] = useState<{ id: string; nome: string; username: string | null; avatar_url: string | null } | null>(null);
  const [books, setBooks] = useState<ProfileBook[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [events, setEvents] = useState<BookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<ProfileBook | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);

      const [{ data: userData }, { data: booksData }, followCounts] = await Promise.all([
        supabase.from('usuarios').select('id, nome, username, avatar_url').eq('id', id).single(),
        supabase.from('usuario_livros').select('*, livros_globais(*)').eq('usuario_id', id),
        getFollowCounts(id),
      ]);

      if (userData) setProfile(userData as any);
      setCounts(followCounts);

      const mappedBooks: ProfileBook[] = [];
      if (booksData) {
        for (const ub of booksData as any[]) {
          const gb = ub.livros_globais;
          mappedBooks.push({
            id: gb.id,
            user_book_id: ub.id,
            titulo: gb.titulo,
            autor: gb.autor,
            paginas: gb.paginas,
            categoria: gb.categoria,
            imagem_url: gb.imagem_url,
            status: ub.status,
            rating: ub.rating,
            review: ub.review,
            created_at: ub.created_at,
          });
        }
      }
      setBooks(mappedBooks);

      // Fetch events for all of this user's books
      const bookIds = mappedBooks.map(b => b.id);
      if (bookIds.length > 0) {
        const { data: eventsData } = await supabase
          .from('livro_eventos')
          .select('*')
          .in('livro_id', bookIds)
          .order('created_at', { ascending: false })
          .limit(50);
        setEvents((eventsData as BookEvent[]) || []);
      }

      setLoading(false);
    };

    load();
  }, [id, getFollowCounts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Usuário não encontrado.</p>
      </div>
    );
  }

  const isMe = me?.id === profile.id;
  const isFollowing = following.has(profile.id);
  const readBooks = books.filter(b => b.status === 'lido');
  const readingBooks = books.filter(b => b.status === 'lendo');
  const wantBooks = books.filter(b => b.status === 'quero_ler');
  const ratedBooks = books.filter(b => b.rating && b.rating > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="parchment-bg border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-28 w-28 border-4 border-accent/40 shadow-lg">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
              <AvatarFallback className="bg-accent/20 text-accent text-3xl font-display">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-display font-bold text-foreground">{profile.nome}</h1>
              {profile.username && <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>}

              <div className="flex gap-6 mt-4 justify-center sm:justify-start">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{readBooks.length}</p>
                  <p className="text-sm text-muted-foreground">Lidos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{readingBooks.length}</p>
                  <p className="text-sm text-muted-foreground">Lendo</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{ratedBooks.length}</p>
                  <p className="text-sm text-muted-foreground">Avaliações</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{counts.followers}</p>
                  <p className="text-sm text-muted-foreground">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{counts.following}</p>
                  <p className="text-sm text-muted-foreground">Seguindo</p>
                </div>
              </div>

              {!isMe && (
                <div className="mt-4">
                  {isFollowing ? (
                    <Button variant="secondary" onClick={() => unfollowUser(profile.id)} className="font-display">
                      Seguindo
                    </Button>
                  ) : (
                    <Button onClick={() => followUser(profile.id, profile.username || profile.nome)} className="bg-primary text-primary-foreground font-display">
                      Seguir
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-sm"><BarChart3 className="h-4 w-4" /> Dashboard</TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-1.5 text-sm"><BookOpen className="h-4 w-4" /> Livros</TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center gap-1.5 text-sm"><Star className="h-4 w-4" /> Avaliações</TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1.5 text-sm"><Clock className="h-4 w-4" /> Atividade</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <PublicDashboard books={books} events={events} />
          </TabsContent>

          {/* Books */}
          <TabsContent value="books">
            {books.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Nenhum livro na estante.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {books.map(book => (
                  <Card key={book.user_book_id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedBook(book)}>
                    <div className="aspect-[2/3] bg-muted flex items-center justify-center overflow-hidden">
                      {book.imagem_url ? (
                        <img src={book.imagem_url} alt={book.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="font-display text-sm font-semibold leading-tight truncate">{book.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{book.autor}</p>
                      {book.rating && book.rating > 0 && (
                        <div className="mt-1">
                          <StarRating value={book.rating} readonly size="sm" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Ratings */}
          <TabsContent value="ratings">
            {ratedBooks.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Nenhuma avaliação feita ainda.</p>
            ) : (
              <div className="space-y-4">
                {ratedBooks.map(book => (
                  <Card key={book.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedBook(book)}>
                    <CardContent className="p-4 flex gap-4">
                      <div className="w-16 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                        {book.imagem_url ? (
                          <img src={book.imagem_url} alt={book.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-6 w-6 text-muted-foreground/40" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground">{book.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{book.autor}</p>
                        <div className="mt-1"><StarRating value={book.rating || 0} readonly size="sm" /></div>
                        {book.review && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{book.review}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Nenhuma atividade registrada.</p>
            ) : (
              <EventTimeline events={events.slice(0, 30)} showBookTitle />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Book Detail Modal */}
      <Dialog open={!!selectedBook} onOpenChange={open => !open && setSelectedBook(null)}>
        <DialogContent className="max-w-md">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{selectedBook.titulo}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-24 h-36 bg-muted rounded overflow-hidden flex-shrink-0">
                    {selectedBook.imagem_url ? (
                      <img src={selectedBook.imagem_url} alt={selectedBook.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-8 w-8 text-muted-foreground/40" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{selectedBook.autor}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedBook.paginas} páginas • {selectedBook.categoria}</p>
                    {selectedBook.rating && selectedBook.rating > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-display font-semibold text-foreground mb-1">Avaliação de {profile?.nome}:</p>
                        <StarRating value={selectedBook.rating} readonly size="md" />
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedBook.rating}/10</p>
                      </div>
                    )}
                  </div>
                </div>
                {selectedBook.review && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-display font-semibold text-foreground mb-1">Resenha de {profile?.nome}:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedBook.review}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ── Dashboard Component ── */

function PublicDashboard({ books, events }: { books: ProfileBook[]; events: BookEvent[] }) {
  const readBooks = books.filter(b => b.status === 'lido');
  const readingBooks = books.filter(b => b.status === 'lendo');
  const wantBooks = books.filter(b => b.status === 'quero_ler');
  const ratedBooks = books.filter(b => b.rating && b.rating > 0);
  const avgRating = ratedBooks.length > 0 ? (ratedBooks.reduce((s, b) => s + (b.rating || 0), 0) / ratedBooks.length).toFixed(1) : '—';

  const now = new Date();
  const monthlyData: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i);
    const mStart = startOfMonth(m);
    const mEnd = endOfMonth(m);
    const count = events.filter(e => {
      if (e.tipo !== 'moved' || !e.descricao.includes('Já Li')) return false;
      const d = new Date(e.created_at);
      return d >= mStart && d <= mEnd;
    }).length;
    monthlyData.push({ month: format(m, 'MMM', { locale: ptBR }), count });
  }
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

  const catCount: Record<string, number> = {};
  readBooks.forEach(b => { catCount[b.categoria] = (catCount[b.categoria] || 0) + 1; });

  const lastRead = readBooks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Quero Ler', value: wantBooks.length, color: 'text-blue-600' },
          { label: 'Lendo', value: readingBooks.length, color: 'text-purple-600' },
          { label: 'Lidos', value: readBooks.length, color: 'text-green-600' },
          { label: 'Média', value: avgRating, color: 'text-yellow-600' },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-sm text-muted-foreground font-display">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly chart */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Livros lidos por mês</h3>
          <div className="flex items-end gap-3 h-32">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-sm font-bold text-foreground">{m.count}</span>
                <div className="w-full rounded-t-md bg-accent/80 transition-all duration-500" style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? '8px' : '2px' }} />
                <span className="text-xs text-muted-foreground font-display capitalize">{m.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category distribution */}
      {Object.keys(catCount).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Distribuição por categoria</h3>
            <div className="space-y-3">
              {Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm font-display w-40 truncate">{cat}</span>
                  <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(count / readBooks.length) * 100}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last read */}
      {lastRead.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Últimos livros lidos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {lastRead.map(book => (
                <div key={book.id} className="text-center">
                  <div className="aspect-[2/3] bg-muted rounded overflow-hidden mb-2">
                    {book.imagem_url ? (
                      <img src={book.imagem_url} alt={book.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-8 w-8 text-muted-foreground/40" /></div>
                    )}
                  </div>
                  <p className="font-display text-xs font-semibold truncate">{book.titulo}</p>
                  {book.rating && book.rating > 0 && (
                    <div className="flex justify-center mt-1"><StarRating value={book.rating} readonly size="sm" /></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PublicProfile;
