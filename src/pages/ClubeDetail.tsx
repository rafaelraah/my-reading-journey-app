import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/hooks/useSocial';
import {
  fetchClubeById, fetchClubeMembros, fetchClubeProgresso, upsertProgresso,
  fetchClubePosts, createClubePost, fetchClubeComentarios, createClubeComentario,
  setClubeBook, useClubes, Clube, ClubeMembro, ClubeProgresso, ClubePost, ClubeComentario
} from '@/hooks/useClubes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Castle, BookOpen, Users as UsersIcon, MessageSquare, Send, UserPlus, Loader2, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const s: any = supabase;

const ClubeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getFollowingList } = useSocial();
  const { fetchMine } = useClubes();

  const [clube, setClube] = useState<Clube | null>(null);
  const [book, setBook] = useState<any>(null);
  const [members, setMembers] = useState<ClubeMembro[]>([]);
  const [progress, setProgress] = useState<ClubeProgresso[]>([]);
  const [posts, setPosts] = useState<ClubePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [followList, setFollowList] = useState<any[]>([]);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [globalBooks, setGlobalBooks] = useState<any[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [pPage, setPPage] = useState(0);
  const [pStatus, setPStatus] = useState<string>('lendo');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const c = await fetchClubeById(id);
    setClube(c);
    if (c?.livro_ativo_id) {
      const { data: b } = await s.from('livros_globais').select('*').eq('id', c.livro_ativo_id).single();
      setBook(b);
    } else setBook(null);
    const [m, prog, ps] = await Promise.all([
      fetchClubeMembros(id),
      fetchClubeProgresso(id, c?.livro_ativo_id ?? null),
      fetchClubePosts(id),
    ]);
    setMembers(m);
    setProgress(prog);
    setPosts(ps);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
  if (!clube) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Clube não encontrado.</p></div>;

  const myMembership = members.find(m => m.usuario_id === user?.id);
  const isAdmin = myMembership?.is_admin || clube.criador_id === user?.id;
  const acceptedMembers = members.filter(m => m.status === 'aceito');
  const myProgress = progress.find(p => p.usuario_id === user?.id);

  const handlePost = async () => {
    if (!user || !postText.trim()) return;
    await createClubePost(clube.id, user.id, postText.trim());
    setPostText('');
    const ps = await fetchClubePosts(clube.id);
    setPosts(ps);
    // notify other members
    for (const m of acceptedMembers.filter(m => m.usuario_id !== user.id)) {
      await s.from('notificacoes').insert({
        usuario_id: m.usuario_id, tipo: 'clube_post',
        mensagem: `${user.nome} postou no clube "${clube.nome}"`, actor_id: user.id,
      });
    }
  };

  const openInvite = async () => {
    if (!user) return;
    const list = await getFollowingList(user.id);
    const memberIds = new Set(members.map(m => m.usuario_id));
    setFollowList(list.filter((u: any) => !memberIds.has(u.id)));
    setShowInvite(true);
  };

  const openBookPicker = async () => {
    const { data } = await s.from('livros_globais').select('id, titulo, autor, imagem_url, categoria, paginas').order('titulo');
    setGlobalBooks(data || []);
    setShowBookPicker(true);
  };

  const chooseBook = async (bookId: string) => {
    await setClubeBook(clube.id, bookId);
    setShowBookPicker(false);
    toast.success('Livro ativo atualizado!');
    await load();
  };

  const openProgressDialog = () => {
    setPPage(myProgress?.pagina_atual ?? 0);
    setPStatus(myProgress?.status ?? 'lendo');
    setShowProgress(true);
  };

  const saveProgress = async () => {
    if (!user || !book) return;
    const total = book.paginas || 1;
    const pct = Math.min(100, Math.round((pPage / total) * 100));
    await upsertProgresso({ clube_id: clube.id, usuario_id: user.id, livro_id: book.id, pagina_atual: pPage, percentual: pct, status: pStatus });
    setShowProgress(false);
    toast.success('Progresso atualizado!');
    await load();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover header */}
      <div className="relative parchment-bg border-b border-border">
        {clube.imagem_url && (
          <div className="absolute inset-0 opacity-30">
            <img src={clube.imagem_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative container max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 rounded-lg bg-accent/20 overflow-hidden flex-shrink-0 border-2 border-accent/40">
              {clube.imagem_url
                ? <img src={clube.imagem_url} alt={clube.nome} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Castle className="h-10 w-10 text-accent" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-display font-bold">{clube.nome}</h1>
              {clube.categoria && <Badge variant="secondary" className="mt-1">{clube.categoria}</Badge>}
              {clube.descricao && <p className="text-muted-foreground mt-2">{clube.descricao}</p>}
              <p className="text-xs text-muted-foreground mt-2">{acceptedMembers.length} membros</p>
            </div>
            {myMembership?.status === 'aceito' && (
              <Button onClick={openInvite} variant="outline" size="sm"><UserPlus className="h-4 w-4 mr-1" /> Convidar</Button>
            )}
          </div>
        </div>
      </div>

      <main className="container max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="livro">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="livro"><BookOpen className="h-4 w-4 mr-1" /> Livro</TabsTrigger>
            <TabsTrigger value="membros"><UsersIcon className="h-4 w-4 mr-1" /> Membros</TabsTrigger>
            <TabsTrigger value="progresso"><Crown className="h-4 w-4 mr-1" /> Progresso</TabsTrigger>
            <TabsTrigger value="feed"><MessageSquare className="h-4 w-4 mr-1" /> Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="livro" className="mt-4">
            {book ? (
              <Card>
                <CardContent className="p-6 flex gap-6">
                  <div className="w-32 h-48 bg-muted rounded overflow-hidden flex-shrink-0">
                    {book.imagem_url ? <img src={book.imagem_url} alt={book.titulo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-10 w-10 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-display font-semibold">{book.titulo}</h2>
                    <p className="text-sm text-muted-foreground">{book.autor}</p>
                    <p className="text-xs text-muted-foreground mt-1">{book.paginas} páginas • {book.categoria}</p>
                    <div className="mt-4 flex gap-2">
                      {myMembership?.status === 'aceito' && (
                        <Button onClick={openProgressDialog}>Atualizar meu progresso</Button>
                      )}
                      {isAdmin && <Button variant="outline" onClick={openBookPicker}>Alterar livro</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground italic mb-4">Nenhum livro ativo no clube ainda.</p>
                  {isAdmin && <Button onClick={openBookPicker}>Escolher livro</Button>}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="membros" className="mt-4 space-y-2">
            {members.map(m => (
              <Card key={m.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Link to={`/usuario/${m.usuario_id}`}>
                    <Avatar className="h-10 w-10">
                      {m.usuario?.avatar_url ? <AvatarImage src={m.usuario.avatar_url} /> : null}
                      <AvatarFallback>{m.usuario?.nome?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <p className="font-display font-semibold text-sm">{m.usuario?.nome} {m.is_admin && <Crown className="inline h-3 w-3 text-accent ml-1" />}</p>
                    <p className="text-xs text-muted-foreground">@{m.usuario?.username}</p>
                  </div>
                  {m.status === 'pendente' && <Badge variant="outline">Convite enviado</Badge>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="progresso" className="mt-4 space-y-3">
            {!book ? (
              <p className="text-center text-muted-foreground py-8 italic">Nenhum livro ativo.</p>
            ) : acceptedMembers.map(m => {
              const p = progress.find(x => x.usuario_id === m.usuario_id);
              const pct = p?.percentual || 0;
              return (
                <Card key={m.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {m.usuario?.avatar_url ? <AvatarImage src={m.usuario.avatar_url} /> : null}
                      <AvatarFallback>{m.usuario?.nome?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-display font-semibold">{m.usuario?.nome}</span>
                        <span className="text-muted-foreground text-xs">Página {p?.pagina_atual || 0} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="feed" className="mt-4 space-y-3">
            {myMembership?.status === 'aceito' && (
              <Card>
                <CardContent className="p-3">
                  <Textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder="Compartilhe com o clube..." rows={3} maxLength={500} />
                  <div className="flex justify-end mt-2">
                    <Button onClick={handlePost} disabled={!postText.trim()}><Send className="h-4 w-4 mr-1" /> Publicar</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {posts.length === 0 && <p className="text-center text-muted-foreground py-6 italic">Nenhuma postagem ainda.</p>}
            {posts.map(p => <ClubePostCard key={p.id} post={p} />)}
          </TabsContent>
        </Tabs>
      </main>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Convidar usuários</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Apenas usuários que você segue aparecem aqui.</p>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {followList.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhum usuário disponível.</p>
            ) : followList.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2 hover:bg-accent/10 rounded">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">{u.avatar_url ? <AvatarImage src={u.avatar_url} /> : null}<AvatarFallback>{u.nome[0]}</AvatarFallback></Avatar>
                  <span className="text-sm">{u.nome}</span>
                </div>
                <InviteButton clubeId={clube.id} clubeNome={clube.nome} userId={u.id} onDone={async () => { await load(); }} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Book picker */}
      <Dialog open={showBookPicker} onOpenChange={setShowBookPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Escolher livro ativo</DialogTitle></DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {globalBooks.map((b) => (
              <button key={b.id} className="w-full flex items-center gap-3 p-2 hover:bg-accent/10 rounded text-left" onClick={() => chooseBook(b.id)}>
                <div className="w-10 h-14 bg-muted rounded overflow-hidden">
                  {b.imagem_url ? <img src={b.imagem_url} className="w-full h-full object-cover" /> : <BookOpen className="h-5 w-5 m-auto text-muted-foreground/40" />}
                </div>
                <div>
                  <p className="text-sm font-display font-semibold">{b.titulo}</p>
                  <p className="text-xs text-muted-foreground">{b.autor}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress dialog */}
      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Atualizar progresso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-display font-semibold mb-1 block">Página atual</label>
              <Input type="number" min={0} max={book?.paginas || undefined} value={pPage} onChange={e => setPPage(Number(e.target.value) || 0)} />
              {book && <p className="text-xs text-muted-foreground mt-1">de {book.paginas} páginas</p>}
            </div>
            <div>
              <label className="text-sm font-display font-semibold mb-1 block">Status</label>
              <Select value={pStatus} onValueChange={setPStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quero_ler">Quero Ler</SelectItem>
                  <SelectItem value="lendo">Lendo</SelectItem>
                  <SelectItem value="lido">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveProgress}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function InviteButton({ clubeId, clubeNome, userId, onDone }: { clubeId: string; clubeNome: string; userId: string; onDone: () => void }) {
  const { inviteUser } = useClubes();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <Button size="sm" variant="outline" disabled={sending || done} onClick={async () => {
      setSending(true);
      const { error } = await inviteUser(clubeId, clubeNome, userId);
      setSending(false);
      if (error) { toast.error(error); return; }
      toast.success('Convite enviado!');
      setDone(true);
      onDone();
    }}>
      {done ? 'Convidado' : sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Convidar'}
    </Button>
  );
}

function ClubePostCard({ post }: { post: ClubePost }) {
  const { user } = useAuth();
  const [expand, setExpand] = useState(false);
  const [comments, setComments] = useState<ClubeComentario[]>([]);
  const [text, setText] = useState('');

  const loadComments = useCallback(async () => {
    const c = await fetchClubeComentarios(post.id);
    setComments(c);
  }, [post.id]);

  useEffect(() => { if (expand) loadComments(); }, [expand, loadComments]);

  const send = async () => {
    if (!user || !text.trim()) return;
    await createClubeComentario(post.id, user.id, text.trim());
    setText('');
    await loadComments();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Link to={`/usuario/${post.usuario_id}`}>
            <Avatar className="h-9 w-9">{post.autor?.avatar_url ? <AvatarImage src={post.autor.avatar_url} /> : null}<AvatarFallback>{post.autor?.nome?.[0] || '?'}</AvatarFallback></Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-display font-semibold text-sm">{post.autor?.nome}</p>
              {post.tipo !== 'post' && <Badge variant="outline" className="text-xs">{post.tipo}</Badge>}
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap mt-1">{post.conteudo}</p>
            <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => setExpand(v => !v)}>
              {expand ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />} Comentários ({comments.length})
            </Button>
            {expand && (
              <div className="mt-2 space-y-2">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2 text-sm">
                    <Avatar className="h-6 w-6">{c.autor?.avatar_url ? <AvatarImage src={c.autor.avatar_url} /> : null}<AvatarFallback>{c.autor?.nome?.[0] || '?'}</AvatarFallback></Avatar>
                    <div className="flex-1 bg-accent/10 rounded px-2 py-1">
                      <p className="font-display font-semibold text-xs">{c.autor?.nome}</p>
                      <p>{c.conteudo}</p>
                    </div>
                  </div>
                ))}
                {user && (
                  <div className="flex gap-2">
                    <Input value={text} onChange={e => setText(e.target.value)} placeholder="Escreva um comentário..." onKeyDown={e => e.key === 'Enter' && send()} />
                    <Button size="sm" onClick={send} disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
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

export default ClubeDetail;