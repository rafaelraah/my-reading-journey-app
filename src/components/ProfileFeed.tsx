import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFeed, FeedReply } from '@/hooks/useFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Send, User as UserIcon, Reply as ReplyIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Author { id: string; nome: string; username: string | null; avatar_url: string | null; }
interface Post { id: string; conteudo: string; created_at: string; author: Author | null; }

export function ProfileFeed({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, conteudo, created_at, usuario_id')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    const { data: userData } = await supabase
      .from('usuarios')
      .select('id, nome, username, avatar_url')
      .eq('id', userId)
      .single();
    const author = userData as Author | null;
    setPosts(((postsData as any[]) || []).map((p) => ({
      id: p.id, conteudo: p.conteudo, created_at: p.created_at, author,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  if (posts.length === 0) return <p className="text-center text-muted-foreground py-10 italic">Este usuário ainda não publicou nada.</p>;

  return (
    <div className="space-y-3">
      {posts.map((p) => <ProfilePostCard key={p.id} post={p} onChange={load} />)}
    </div>
  );
}

function ProfilePostCard({ post, onChange }: { post: Post; onChange: () => void }) {
  const { user } = useAuth();
  const { fetchReplies, createReply } = useFeed();
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<FeedReply[]>([]);
  const [count, setCount] = useState(0);
  const [loadingR, setLoadingR] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const time = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR });

  useEffect(() => {
    (async () => {
      const { count } = await (supabase as any)
        .from('feed_respostas').select('id', { count: 'exact', head: true })
        .eq('target_kind', 'post').eq('target_id', post.id);
      if (typeof count === 'number') setCount(count);
    })();
  }, [post.id]);

  const loadReplies = async () => {
    setLoadingR(true);
    const r = await fetchReplies('post', post.id);
    setReplies(r);
    setCount(r.length);
    setLoadingR(false);
  };
  const toggle = async () => { const next = !open; setOpen(next); if (next) await loadReplies(); };

  const send = async () => {
    if (!user || !text.trim()) return;
    setSending(true);
    const { error } = await createReply(
      { id: user.id, nome: user.nome, username: user.username },
      { id: `p-${post.id}`, kind: 'post', created_at: post.created_at, author: post.author, conteudo: post.conteudo, target_id: post.id },
      text,
    );
    setSending(false);
    if (error) toast.error('Erro ao enviar resposta');
    else { setText(''); await loadReplies(); }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {post.author && (
            <Link to={`/usuario/${post.author.id}`} className="flex-shrink-0">
              <Avatar className="h-10 w-10 border-2 border-accent/30">
                {post.author.avatar_url ? <AvatarImage src={post.author.avatar_url} /> : null}
                <AvatarFallback className="bg-accent/20 text-accent"><UserIcon className="h-5 w-5" /></AvatarFallback>
              </Avatar>
            </Link>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {post.author && (
                <Link to={`/usuario/${post.author.id}`} className="font-display font-semibold text-foreground hover:underline">{post.author.nome}</Link>
              )}
              {post.author?.username && <span className="text-xs text-muted-foreground">@{post.author.username}</span>}
              <span className="text-xs text-muted-foreground">· {time}</span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words mt-2">{post.conteudo}</p>

            <div className="mt-3 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggle} className="h-8 px-2 text-xs">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                {open ? 'Ocultar respostas' : count > 0 ? 'Ver respostas' : 'Responder'}
                {count > 0 && <span className="ml-1 text-muted-foreground">({count})</span>}
              </Button>
              {!open && count > 0 && (
                <Button variant="ghost" size="sm" onClick={toggle} className="h-8 px-2 text-xs">
                  <ReplyIcon className="h-3.5 w-3.5 mr-1" /> Responder
                </Button>
              )}
            </div>

            {open && (
              <div className="mt-3 space-y-3 border-l-2 border-accent/20 pl-3">
                {loadingR ? (
                  <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-accent" /></div>
                ) : replies.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhuma resposta ainda.</p>
                ) : replies.map((r) => (
                  <div key={r.id} className="flex gap-2">
                    {r.author && (
                      <Link to={`/usuario/${r.author.id}`} className="flex-shrink-0">
                        <Avatar className="h-7 w-7 border border-accent/20">
                          {r.author.avatar_url ? <AvatarImage src={r.author.avatar_url} /> : null}
                          <AvatarFallback className="bg-accent/20 text-accent text-[10px]"><UserIcon className="h-3 w-3" /></AvatarFallback>
                        </Avatar>
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {r.author && <Link to={`/usuario/${r.author.id}`} className="text-sm font-display font-semibold text-foreground hover:underline">{r.author.nome}</Link>}
                        <span className="text-[10px] text-muted-foreground">· {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{r.conteudo}</p>
                    </div>
                  </div>
                ))}

                {user && (
                  <div className="flex gap-2 pt-2">
                    <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma resposta..." rows={2} maxLength={300} className="resize-none text-sm" />
                    <Button onClick={send} disabled={!text.trim() || sending} size="sm" className="self-end">
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