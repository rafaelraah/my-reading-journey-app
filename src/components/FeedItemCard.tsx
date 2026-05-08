import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FeedItem, FeedReply, REACTION_EMOJIS, ReactionEmoji, fetchReactions, toggleReaction } from '@/hooks/useFeed';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Send, BookOpen, MessageSquare, ArrowRightLeft, Star, FileText,
  PlusCircle, User as UserIcon, Reply as ReplyIcon, Trash2, NotebookPen,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const EVENT_META: Record<string, { icon: any; color: string }> = {
  created: { icon: PlusCircle, color: 'text-green-600 bg-green-100' },
  moved: { icon: ArrowRightLeft, color: 'text-blue-600 bg-blue-100' },
  rated: { icon: Star, color: 'text-yellow-600 bg-yellow-100' },
  review_added: { icon: FileText, color: 'text-orange-600 bg-orange-100' },
  progress_updated: { icon: BookOpen, color: 'text-purple-600 bg-purple-100' },
  recommended: { icon: Send, color: 'text-pink-600 bg-pink-100' },
  removed: { icon: Trash2, color: 'text-red-600 bg-red-100' },
  historico_leitura: { icon: NotebookPen, color: 'text-amber-700 bg-amber-100' },
};

type ReplyFns = {
  fetchReplies: (kind: 'event' | 'post', targetId: string) => Promise<FeedReply[]>;
  createReply: (
    fromUser: { id: string; nome: string; username: string | null },
    item: FeedItem,
    conteudo: string,
  ) => Promise<{ error: string | null }>;
};

export function FeedItemCard({ item, fetchReplies, createReply }: { item: FeedItem } & ReplyFns) {
  const { user } = useAuth();
  const author = item.author;
  const time = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR });
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<FeedReply[]>([]);
  const [replyCount, setReplyCount] = useState(0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [myReactions, setMyReactions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    if (!item.target_id) return;
    (async () => {
      const { count } = await (supabase as any)
        .from('feed_respostas')
        .select('id', { count: 'exact', head: true })
        .eq('target_kind', item.kind)
        .eq('target_id', item.target_id);
      if (active && typeof count === 'number') setReplyCount(count);
      const { counts, mine } = await fetchReactions(item.kind, item.target_id!, user?.id);
      if (active) { setReactionCounts(counts); setMyReactions(mine); }
    })();
    return () => { active = false; };
  }, [item.kind, item.target_id, user?.id]);

  const loadReplies = useCallback(async () => {
    if (!item.target_id) return;
    setLoadingReplies(true);
    const data = await fetchReplies(item.kind, item.target_id);
    setReplies(data);
    setReplyCount(data.length);
    setLoadingReplies(false);
  }, [fetchReplies, item.kind, item.target_id]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadReplies();
  };

  const handleSend = async () => {
    if (!user || !replyText.trim()) return;
    setSending(true);
    const { error } = await createReply(
      { id: user.id, nome: user.nome, username: user.username },
      item,
      replyText,
    );
    setSending(false);
    if (error) toast.error('Erro ao enviar resposta');
    else { setReplyText(''); await loadReplies(); }
  };

  const onReact = async (key: ReactionEmoji) => {
    if (!user || !item.target_id) { toast.error('Faça login para reagir'); return; }
    const reacted = !!myReactions[key];
    // optimistic
    setMyReactions((m) => ({ ...m, [key]: !reacted }));
    setReactionCounts((c) => ({ ...c, [key]: Math.max(0, (c[key] || 0) + (reacted ? -1 : 1)) }));
    const { error } = await toggleReaction(item.kind, item.target_id, user.id, key, reacted);
    if (error) {
      // revert
      setMyReactions((m) => ({ ...m, [key]: reacted }));
      setReactionCounts((c) => ({ ...c, [key]: Math.max(0, (c[key] || 0) + (reacted ? 1 : -1)) }));
      toast.error('Erro ao reagir');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {author ? (
            <Link to={`/usuario/${author.id}`} className="flex-shrink-0">
              <Avatar className="h-11 w-11 border-2 border-accent/30">
                {author.avatar_url ? <AvatarImage src={author.avatar_url} /> : null}
                <AvatarFallback className="bg-accent/20 text-accent"><UserIcon className="h-5 w-5" /></AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="h-11 w-11"><AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback></Avatar>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {author ? (
                <Link to={`/usuario/${author.id}`} className="font-display font-semibold text-foreground hover:underline">
                  {author.nome}
                </Link>
              ) : (
                <span className="font-display font-semibold text-muted-foreground">Usuário</span>
              )}
              {author?.username && <span className="text-xs text-muted-foreground">@{author.username}</span>}
              <span className="text-xs text-muted-foreground">· {time}</span>
            </div>

            {item.kind === 'post' ? (
              <div className="mt-2 flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{item.conteudo}</p>
              </div>
            ) : (
              <EventBody item={item} />
            )}

            {/* Reactions */}
            <div className="mt-3 flex items-center gap-1 flex-wrap">
              {REACTION_EMOJIS.map((r) => {
                const count = reactionCounts[r.key] || 0;
                const active = !!myReactions[r.key];
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => onReact(r.key)}
                    title={r.label}
                    className={`inline-flex items-center gap-1 px-2 h-7 rounded-full text-xs border transition-colors ${
                      active ? 'bg-accent/20 border-accent/40' : 'bg-background border-border hover:bg-accent/10'
                    }`}
                  >
                    <span className="text-sm leading-none">{r.emoji}</span>
                    {count > 0 && <span className="text-foreground font-display">{count}</span>}
                  </button>
                );
              })}

              {replyCount > 0 && (
                <Button variant="ghost" size="sm" onClick={toggle} className="h-7 px-2 text-xs ml-1">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  {open ? 'Ocultar' : 'Ver'} respostas
                  <span className="ml-1 text-muted-foreground">({replyCount})</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={toggle} className="h-7 px-2 text-xs">
                <ReplyIcon className="h-3.5 w-3.5 mr-1" />
                {open ? 'Cancelar' : 'Responder'}
              </Button>
            </div>

            {open && (
              <div className="mt-3 space-y-3 border-l-2 border-accent/20 pl-3">
                {loadingReplies ? (
                  <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-accent" /></div>
                ) : replies.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhuma resposta ainda. Seja o primeiro!</p>
                ) : (
                  replies.map((r) => (
                    <div key={r.id} className="flex gap-2">
                      {r.author ? (
                        <Link to={`/usuario/${r.author.id}`} className="flex-shrink-0">
                          <Avatar className="h-7 w-7 border border-accent/20">
                            {r.author.avatar_url ? <AvatarImage src={r.author.avatar_url} /> : null}
                            <AvatarFallback className="bg-accent/20 text-accent text-[10px]"><UserIcon className="h-3 w-3" /></AvatarFallback>
                          </Avatar>
                        </Link>
                      ) : (
                        <Avatar className="h-7 w-7"><AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback></Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {r.author ? (
                            <Link to={`/usuario/${r.author.id}`} className="text-sm font-display font-semibold text-foreground hover:underline">
                              {r.author.nome}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">Usuário</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{r.conteudo}</p>
                      </div>
                    </div>
                  ))
                )}

                {user && (
                  <div className="flex gap-2 pt-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escreva uma resposta..."
                      rows={2}
                      maxLength={300}
                      className="resize-none text-sm"
                    />
                    <Button onClick={handleSend} disabled={!replyText.trim() || sending} size="sm" className="self-end">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventBody({ item }: { item: FeedItem }) {
  const meta = EVENT_META[item.tipo || ''] || { icon: BookOpen, color: 'text-muted-foreground bg-secondary' };
  const Icon = meta.icon;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${meta.color}`}>
          <Icon className="h-3 w-3" />
        </span>
        <span className="text-sm text-foreground">{item.descricao}</span>
      </div>
      {item.livro_titulo && (
        <div className="mt-2 flex items-center gap-3 p-2 rounded-md bg-muted/40 border border-border">
          <div className="h-14 w-10 bg-muted rounded overflow-hidden flex-shrink-0">
            {item.livro_imagem ? (
              <img src={item.livro_imagem} alt={item.livro_titulo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-4 w-4 text-muted-foreground/40" /></div>
            )}
          </div>
          <Badge variant="secondary" className="font-display text-xs">{item.livro_titulo}</Badge>
        </div>
      )}
    </div>
  );
}