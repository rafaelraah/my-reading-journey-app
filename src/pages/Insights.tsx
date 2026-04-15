import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserBooks } from '@/hooks/useUserBooks';
import { BookEvent } from '@/hooks/useBookEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, BookOpen, TrendingUp, Star, Brain, Timer, Flame } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyCount {
  month: string;
  count: number;
}

const Insights = () => {
  const { books, loading: booksLoading } = useUserBooks();
  const [events, setEvents] = useState<BookEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('livro_eventos').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setEvents((data as BookEvent[]) || []);
      setLoading(false);
    });
  }, []);

  if (loading || booksLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const readBooks = books.filter(b => b.status === 'lido');
  const ratedBooks = books.filter(b => b.rating && b.rating > 0);
  const avgRating = ratedBooks.length > 0
    ? (ratedBooks.reduce((s, b) => s + (b.rating || 0), 0) / ratedBooks.length).toFixed(1)
    : '—';

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  // Filter events for user's books
  const userBookIds = new Set(books.map(b => b.id));
  const userEvents = events.filter(e => userBookIds.has(e.livro_id));

  const movedToReadThisMonth = userEvents.filter(e => {
    if (e.tipo !== 'moved' || !e.descricao.includes('Já Li')) return false;
    const d = new Date(e.created_at);
    return d >= thisMonthStart && d <= thisMonthEnd;
  });

  const monthlyData: MonthlyCount[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i);
    const mStart = startOfMonth(m);
    const mEnd = endOfMonth(m);
    const count = userEvents.filter(e => {
      if (e.tipo !== 'moved' || !e.descricao.includes('Já Li')) return false;
      const d = new Date(e.created_at);
      return d >= mStart && d <= mEnd;
    }).length;
    monthlyData.push({ month: format(m, 'MMM', { locale: ptBR }), count });
  }
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

  const catCount: Record<string, number> = {};
  readBooks.forEach(b => { catCount[b.categoria] = (catCount[b.categoria] || 0) + 1; });
  const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentEvents = userEvents.filter(e => new Date(e.created_at) >= thirtyDaysAgo);

  const finishTimes: number[] = [];
  readBooks.forEach(book => {
    const createdEvent = userEvents.find(e => e.livro_id === book.id && e.tipo === 'created');
    const finishedEvent = userEvents.find(e => e.livro_id === book.id && e.tipo === 'moved' && e.descricao.includes('Já Li'));
    if (createdEvent && finishedEvent) {
      const diff = new Date(finishedEvent.created_at).getTime() - new Date(createdEvent.created_at).getTime();
      finishTimes.push(diff / (1000 * 60 * 60 * 24));
    }
  });
  const avgFinishDays = finishTimes.length > 0
    ? Math.round(finishTimes.reduce((s, d) => s + d, 0) / finishTimes.length)
    : null;

  const insights = [
    { icon: BookOpen, color: 'text-green-600 bg-green-100', title: 'Livros lidos este mês', value: movedToReadThisMonth.length.toString(), subtitle: `Você leu ${movedToReadThisMonth.length} livro(s) este mês` },
    { icon: Star, color: 'text-yellow-600 bg-yellow-100', title: 'Média de avaliações', value: avgRating, subtitle: ratedBooks.length > 0 ? `Baseado em ${ratedBooks.length} avaliações` : 'Nenhuma avaliação ainda' },
    { icon: Brain, color: 'text-purple-600 bg-purple-100', title: 'Categoria favorita', value: topCategory ? topCategory[0] : '—', subtitle: topCategory ? `${topCategory[0]} com ${topCategory[1]} livros` : 'Leia mais livros para descobrir' },
    { icon: Timer, color: 'text-blue-600 bg-blue-100', title: 'Tempo médio por livro', value: avgFinishDays ? `${avgFinishDays}d` : '—', subtitle: avgFinishDays ? `Em média ${avgFinishDays} dias` : 'Dados insuficientes' },
    { icon: Flame, color: 'text-red-600 bg-red-100', title: 'Frequência de leitura', value: recentEvents.length.toString(), subtitle: `${recentEvents.length} atividades nos últimos 30 dias` },
    { icon: TrendingUp, color: 'text-emerald-600 bg-emerald-100', title: 'Total de livros lidos', value: readBooks.length.toString(), subtitle: `${books.length} livros na estante` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="parchment-bg border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-wide">Insights</h1>
              <p className="text-muted-foreground text-lg mt-1">Análise automática da sua jornada</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${insight.color} flex-shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground font-display">{insight.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-0.5">{insight.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{insight.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Livros lidos por mês
            </h3>
            <div className="flex items-end gap-3 h-40">
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
      </main>
    </div>
  );
};

export default Insights;
