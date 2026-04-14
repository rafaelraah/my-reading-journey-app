import { useState, useRef, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBooks } from '@/hooks/useBooks';
import { useBookEvents } from '@/hooks/useBookEvents';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/StarRating';
import { EventTimeline } from '@/components/EventTimeline';
import { BookOpen, Star, Clock, Settings, Camera, Pencil, Check, X, Loader2, User, BarChart3 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { BookEvent } from '@/hooks/useBookEvents';

const Profile = () => {
  const { profile, loading, updateName, uploadAvatar } = useUserProfile();
  const { books } = useBooks();
  const { fetchGlobalEvents, globalEvents, loadingGlobal } = useBookEvents();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGlobalEvents();
  }, [fetchGlobalEvents]);

  useEffect(() => {
    if (profile) setNameValue(profile.nome);
  }, [profile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile) return null;

  const ratedBooks = books.filter(b => b.rating && b.rating > 0);
  const readBooks = books.filter(b => b.status === 'lido');
  const readingBooks = books.filter(b => b.status === 'lendo');

  const handleSaveName = async () => {
    if (nameValue.trim()) {
      await updateName(nameValue.trim());
      setEditingName(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="parchment-bg border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="h-28 w-28 border-4 border-accent/40 shadow-lg">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.nome} />
                ) : null}
                <AvatarFallback className="bg-accent/20 text-accent text-3xl font-display">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Name + Stats */}
            <div className="flex-1 text-center sm:text-left">
              {editingName ? (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Input
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    className="max-w-[250px] font-display text-lg"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName}>
                    <Check className="h-4 w-4 text-accent" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setEditingName(false); setNameValue(profile.nome); }}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-3xl font-display font-bold text-foreground">{profile.nome}</h1>
                  <Button size="icon" variant="ghost" onClick={() => setEditingName(true)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              )}

              {/* Counters */}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-sm">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-1.5 text-sm">
              <BookOpen className="h-4 w-4" /> Meus Livros
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center gap-1.5 text-sm">
              <Star className="h-4 w-4" /> Avaliações
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4" /> Atividade
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 text-sm">
              <Settings className="h-4 w-4" /> Configurações
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <ProfileDashboard books={books} />
          </TabsContent>

          {/* Meus Livros */}
          <TabsContent value="books">
            {books.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Nenhum livro adicionado ainda.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {books.map(book => (
                  <Card key={book.id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Avaliações */}
          <TabsContent value="ratings">
            {ratedBooks.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Nenhuma avaliação feita ainda.</p>
            ) : (
              <div className="space-y-4">
                {ratedBooks.map(book => (
                  <Card key={book.id} className="overflow-hidden">
                    <CardContent className="p-4 flex gap-4">
                      <div className="w-16 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                        {book.imagem_url ? (
                          <img src={book.imagem_url} alt={book.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground">{book.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{book.autor}</p>
                        <div className="mt-1">
                          <StarRating value={book.rating || 0} readonly size="sm" />
                        </div>
                        {book.review && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{book.review}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Atividade */}
          <TabsContent value="activity">
            {loadingGlobal ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : globalEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Nenhuma atividade registrada.</p>
            ) : (
              <EventTimeline events={globalEvents.slice(0, 20)} />
            )}
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="settings">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-display font-semibold text-foreground mb-2 block">Nome</label>
                  <div className="flex gap-2">
                    <Input
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button onClick={handleSaveName} variant="default">Salvar</Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-display font-semibold text-foreground mb-2 block">Foto de Perfil</label>
                  <Button variant="outline" onClick={handleAvatarClick}>
                    <Camera className="h-4 w-4 mr-2" /> Alterar foto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

function ProfileDashboard({ books }: { books: import('@/types/book').Book[] }) {
  const [allEvents, setAllEvents] = useState<BookEvent[]>([]);

  useEffect(() => {
    supabase.from('livro_eventos').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setAllEvents((data as BookEvent[]) || []);
    });
  }, []);

  const readBooks = books.filter(b => b.status === 'lido');
  const readingBooks = books.filter(b => b.status === 'lendo');
  const wantBooks = books.filter(b => b.status === 'quero_ler');
  const ratedBooks = books.filter(b => b.rating && b.rating > 0);
  const avgRating = ratedBooks.length > 0
    ? (ratedBooks.reduce((s, b) => s + (b.rating || 0), 0) / ratedBooks.length).toFixed(1)
    : '—';

  const now = new Date();
  const monthlyData: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i);
    const mStart = startOfMonth(m);
    const mEnd = endOfMonth(m);
    const count = allEvents.filter(e => {
      if (e.tipo !== 'moved' || !e.descricao.includes('Já Li')) return false;
      const d = new Date(e.created_at);
      return d >= mStart && d <= mEnd;
    }).length;
    monthlyData.push({ month: format(m, 'MMM', { locale: ptBR }), count });
  }
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

  const catCount: Record<string, number> = {};
  readBooks.forEach(b => { catCount[b.categoria] = (catCount[b.categoria] || 0) + 1; });

  return (
    <div className="space-y-6">
      {/* Summary cards */}
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
                <div
                  className="w-full rounded-t-md bg-accent/80 transition-all duration-500"
                  style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? '8px' : '2px' }}
                />
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
    </div>
  );
}

export default Profile;
