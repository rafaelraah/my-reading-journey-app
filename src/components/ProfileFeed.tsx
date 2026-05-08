import { useEffect } from 'react';
import { useFeed } from '@/hooks/useFeed';
import { Loader2 } from 'lucide-react';
import { FeedItemCard } from './FeedItemCard';

export function ProfileFeed({ userId }: { userId: string }) {
  const { items, loading, fetchFeed, fetchReplies, createReply } = useFeed();

  useEffect(() => { fetchFeed([userId]); }, [userId, fetchFeed]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  if (items.length === 0) return <p className="text-center text-muted-foreground py-10 italic">Nenhuma atividade ainda.</p>;

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <FeedItemCard key={it.id} item={it} fetchReplies={fetchReplies} createReply={createReply} />
      ))}
    </div>
  );
}
