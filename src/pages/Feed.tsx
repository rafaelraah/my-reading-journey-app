import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/hooks/useSocial';
import { useFeed, FeedItem } from '@/hooks/useFeed';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Globe, Users as UsersIcon, Loader2, Send, BookOpen, MessageSquare, ArrowRightLeft, Star, FileText, PlusCircle, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const EVENT_META: Record<string, { icon: any; color: string }> = {
  created: { icon: PlusCircle, color: 'text-green-600 bg-green-100' },
  moved: { icon: ArrowRightLeft, color: 'text-blue-600 bg-blue-100' },
  rated: { icon: Star, color: 'text-yellow-600 bg-yellow-100' },
  review_added: { icon: FileText, color: 'text-orange-600 bg-orange-100' },
  progress_updated: { icon: BookOpen, color: 'text-purple-600 bg-purple-100' },
};

const Feed = () => {
  const { user } = useAuth();
  const { following } = useSocial();
  const { items, loading, fetchFeed, createPost } = useFeed();
  const [tab, setTab] = useState<'general' | 'following'>('general');
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);

  const reload = useCallback(() => {
    if (tab === 'following') {
      const ids = Array.from(following);
      // include self so user sees their own posts in following tab
      if (user && !ids.includes(user.id)) ids.push(user.id);
      fetchFeed(ids);
    } else {
      fetchFeed();
    }
  }, [tab, following, user, fetchFeed]);

  useEffect(() => { reload(); }, [reload]);

  const handlePost = async () => {
    if (!user || !postText.trim()) return;
    setPosting(true);
    const { error } = await createPost(user.id, postText);
    setPosting(false);
    if (error) {
      toast.error('Erro ao publicar');
    } else {
      toast.success('Postagem publicada!');
      setPostText('');
      reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="parchment-bg border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-display font-bold text-foreground">Feed</h1>
          <p className="text-muted-foreground mt-1">Veja o que outros leitores estão fazendo</p>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Composer */}
        {user && (
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 border-2 border-accent/30 flex-shrink-0">
                  {user.avatar_url ? <AvatarImage src={user.avatar_url} /> : null}
                  <AvatarFallback className="bg-accent/20 text-accent"><UserIcon className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="O que você está lendo ou pensando?"
                    rows={3}
                    maxLength={500}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{postText.length}/500</span>
                    <Button onClick={handlePost} disabled={!postText.trim() || posting} className="font-display">
                      {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Publicar</>}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'general' | 'following')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="general" className="flex items-center gap-2"><Globe className="h-4 w-4" /> Geral</TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2"><UsersIcon className="h-4 w-4" /> Seguindo</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <FeedList items={items} loading={loading} emptyMessage="Nenhuma atividade ainda." />
          </TabsContent>
          <TabsContent value="following" className="mt-4">
            <FeedList items={items} loading={loading} emptyMessage="Siga outros leitores para ver suas atividades aqui." />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

function FeedList({ items, loading, emptyMessage }: { items: FeedItem[]; loading: boolean; emptyMessage: string }) {
  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }
  if (items.length === 0) {
    return <p className="text-center text-muted-foreground py-10 italic">{emptyMessage}</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((it) => <FeedItemCard key={it.id} item={it} />)}
    </div>
  );
}

function FeedItemCard({ item }: { item: FeedItem }) {
  const author = item.author;
  const time = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR });

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

export default Feed;