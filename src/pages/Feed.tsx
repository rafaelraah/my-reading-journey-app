import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/hooks/useSocial';
import { useFeed, FeedItem, FeedReply } from '@/hooks/useFeed';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Users as UsersIcon, Loader2, Send, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FeedItemCard } from '@/components/FeedItemCard';

const Feed = () => {
  const { user } = useAuth();
  const { following } = useSocial();
  const { items, loading, fetchFeed, createPost, fetchReplies, createReply } = useFeed();
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
            <FeedList items={items} loading={loading} emptyMessage="Nenhuma atividade ainda." fetchReplies={fetchReplies} createReply={createReply} />
          </TabsContent>
          <TabsContent value="following" className="mt-4">
            <FeedList items={items} loading={loading} emptyMessage="Siga outros leitores para ver suas atividades aqui." fetchReplies={fetchReplies} createReply={createReply} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

type ReplyFns = {
  fetchReplies: (kind: 'event' | 'post', targetId: string) => Promise<FeedReply[]>;
  createReply: (fromUser: { id: string; nome: string; username: string | null }, item: FeedItem, conteudo: string) => Promise<{ error: string | null }>;
};

function FeedList({ items, loading, emptyMessage, fetchReplies, createReply }: { items: FeedItem[]; loading: boolean; emptyMessage: string } & ReplyFns) {
  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }
  if (items.length === 0) {
    return <p className="text-center text-muted-foreground py-10 italic">{emptyMessage}</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((it) => <FeedItemCard key={it.id} item={it} fetchReplies={fetchReplies} createReply={createReply} />)}
    </div>
  );
}


export default Feed;