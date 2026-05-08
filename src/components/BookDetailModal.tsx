import { useState, useEffect } from 'react';
import { Book, STATUS_LABELS } from '@/types/book';
import { StarRating } from './StarRating';
import { EventTimeline } from './EventTimeline';
import { useBookEvents, BookEvent } from '@/hooks/useBookEvents';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocial } from '@/hooks/useSocial';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { BookOpen, Trash2, Share2, Send, User as UserIcon, Loader2, NotebookPen } from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export function BookDetailModal({ book, open, onClose, onDelete }: BookDetailModalProps) {
  const { fetchBookEvents } = useBookEvents();
  const { user } = useAuth();
  const { getFollowingList, recommendBook } = useSocial();
  const [events, setEvents] = useState<BookEvent[]>([]);
  const [avgInfo, setAvgInfo] = useState<{ avg: number; count: number } | null>(null);
  const [recOpen, setRecOpen] = useState(false);
  const [following, setFollowing] = useState<{ id: string; nome: string; username: string | null; avatar_url: string | null }[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [historyText, setHistoryText] = useState('');
  const [savingHistory, setSavingHistory] = useState(false);

  const loadEvents = async () => {
    if (!book) return;
    // Combine livro_eventos with livro_historicos so they appear together in the timeline.
    const [evts, histRes] = await Promise.all([
      fetchBookEvents(book.id),
      (supabase as any)
        .from('livro_historicos')
        .select('id, livro_id, usuario_id, conteudo, created_at')
        .eq('livro_id', book.id)
        .order('created_at', { ascending: false }),
    ]);
    const histEvents: BookEvent[] = ((histRes?.data as any[]) || []).map((h) => ({
      id: `hist-${h.id}`,
      livro_id: h.livro_id,
      usuario_id: h.usuario_id,
      tipo: 'historico_leitura',
      descricao: `Histórico de leitura: “${h.conteudo}”`,
      created_at: h.created_at,
    }));
    const merged = [...evts, ...histEvents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setEvents(merged);
  };

  useEffect(() => {
    if (book && open) {
      loadEvents();
      // Compute average rating across all users for this book
      (async () => {
        const { data } = await supabase
          .from('usuario_livros')
          .select('rating')
          .eq('livro_id', book.id)
          .not('rating', 'is', null);
        const ratings = ((data as any[]) || []).map((r) => r.rating).filter((r) => typeof r === 'number' && r > 0);
        if (ratings.length === 0) setAvgInfo({ avg: 0, count: 0 });
        else setAvgInfo({ avg: ratings.reduce((s, r) => s + r, 0) / ratings.length, count: ratings.length });
      })();
    } else {
      setEvents([]);
      setAvgInfo(null);
      setHistoryText('');
    }
  }, [book, open]);

  const handleAddHistory = async () => {
    if (!book || !user || !historyText.trim()) return;
    setSavingHistory(true);
    const text = historyText.trim();
    const { error } = await (supabase as any).from('livro_historicos').insert({
      livro_id: book.id,
      usuario_id: user.id,
      conteudo: text,
    });
    if (error) {
      toast.error('Erro ao salvar histórico');
      setSavingHistory(false);
      return;
    }
    // Log to user activity timeline
    await supabase.from('livro_eventos').insert({
      livro_id: book.id,
      usuario_id: user.id,
      tipo: 'historico_leitura',
      descricao: `Adicionou histórico de leitura: “${text.slice(0, 80)}${text.length > 80 ? '…' : ''}”`,
    } as any);
    // Auto-post to the feed so others can see and react.
    await supabase.from('posts').insert({
      usuario_id: user.id,
      conteudo: `📖 Histórico de leitura — "${book.titulo}"\n\n${text}`,
    } as any);
    toast.success('Histórico adicionado!');
    setHistoryText('');
    setSavingHistory(false);
    await loadEvents();
  };

  const openRecommend = async () => {
    if (!user) return;
    setRecOpen(true);
    setLoadingFollowing(true);
    const list = await getFollowingList(user.id);
    setFollowing(list);
    setLoadingFollowing(false);
  };

  const handleRecommend = async (target: { id: string; nome: string; username: string | null }) => {
    if (!book) return;
    setSendingTo(target.id);
    const { error } = await recommendBook(target.id, target.username ? `@${target.username}` : target.nome, book.id, book.titulo);
    setSendingTo(null);
    if (error) toast.error('Erro ao recomendar livro');
    else {
      toast.success('Livro recomendado com sucesso');
      setRecOpen(false);
    }
  };

  if (!book) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="parchment-bg border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            Detalhes do Livro
          </DialogTitle>
          <DialogDescription className="sr-only">Informações completas do livro</DialogDescription>
        </DialogHeader>

        <div className="flex gap-5 mt-2">
          {book.imagem_url ? (
            <img
              src={book.imagem_url}
              alt={book.titulo}
              className="h-48 w-32 rounded-lg object-cover shadow-md flex-shrink-0"
            />
          ) : (
            <div className="h-48 w-32 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="font-display text-lg font-bold text-foreground leading-tight">
              {book.titulo}
            </h3>
            <p className="text-muted-foreground">{book.autor}</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent font-display">
                {book.categoria}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {book.paginas} páginas
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-display">
                {STATUS_LABELS[book.status]}
              </span>
            </div>

            {book.rating && (
              <div className="pt-1">
                <StarRating value={book.rating} readonly size="md" />
                <span className="text-sm text-muted-foreground ml-1">{book.rating}/10</span>
              </div>
            )}
          </div>
        </div>

        {avgInfo && avgInfo.count > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-background/60 border border-border">
            <h4 className="font-display text-sm font-semibold mb-2 text-foreground">Média da comunidade</h4>
            <div className="flex items-center gap-3">
              <StarRating value={Math.round(avgInfo.avg)} readonly size="md" />
              <span className="font-display text-lg font-bold text-foreground">{avgInfo.avg.toFixed(1)}/10</span>
              <span className="text-xs text-muted-foreground">({avgInfo.count} avaliação{avgInfo.count > 1 ? 'es' : ''})</span>
            </div>
          </div>
        )}

        {book.review && (
          <div className="mt-4 p-4 rounded-lg bg-background/60 border border-border">
            <h4 className="font-display text-sm font-semibold mb-2 text-foreground">Resenha</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {book.review}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="mt-4 p-4 rounded-lg bg-background/60 border border-border">
          <h4 className="font-display text-sm font-semibold mb-3 text-foreground">Histórico</h4>

          {user && (
            <div className="mb-4 space-y-2">
              <label className="text-xs font-display font-semibold text-foreground flex items-center gap-1">
                <NotebookPen className="h-3.5 w-3.5 text-accent" /> Adicionar histórico de leitura
              </label>
              <Textarea
                value={historyText}
                onChange={(e) => setHistoryText(e.target.value)}
                placeholder="Ex: Cheguei ao capítulo 5, reviravolta inesperada!"
                rows={3}
                maxLength={500}
                className="resize-none text-sm"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddHistory} disabled={!historyText.trim() || savingHistory} className="font-display">
                  {savingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" /> Publicar</>}
                </Button>
              </div>
            </div>
          )}

          <EventTimeline events={events} />
        </div>

        <div className="flex justify-between mt-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="font-display"
              onClick={() => {
                const msg = encodeURIComponent(`📚 Estou lendo o livro "${book.titulo}"! Recomendo muito. Venha ver e adicionar à sua lista: ${window.location.origin}`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            {user && (
              <Button variant="default" size="sm" className="font-display" onClick={openRecommend}>
                <Send className="h-4 w-4 mr-2" />
                Recomendar para um amigo
              </Button>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="font-display">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir livro
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="parchment-bg border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir <span className="font-semibold">"{book.titulo}"</span>? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(book.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={recOpen} onOpenChange={(v) => !v && setRecOpen(false)}>
      <DialogContent className="parchment-bg border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Recomendar "{book.titulo}"</DialogTitle>
          <DialogDescription>Selecione um amigo para enviar a recomendação.</DialogDescription>
        </DialogHeader>
        {loadingFollowing ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
        ) : following.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 italic">Você ainda não segue ninguém.</p>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 pr-2">
              {following.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleRecommend(u)}
                  disabled={sendingTo === u.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors text-left disabled:opacity-50"
                >
                  <Avatar className="h-10 w-10 border-2 border-accent/30">
                    {u.avatar_url ? <AvatarImage src={u.avatar_url} /> : null}
                    <AvatarFallback className="bg-accent/20 text-accent"><UserIcon className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground truncate">{u.nome}</p>
                    {u.username && <p className="text-xs text-muted-foreground truncate">@{u.username}</p>}
                  </div>
                  {sendingTo === u.id ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : <Send className="h-4 w-4 text-accent" />}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
