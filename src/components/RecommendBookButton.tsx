import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Send, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/hooks/useSocial';
import { toast } from 'sonner';

interface RecommendBookButtonProps {
  bookId: string;
  bookTitle: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  label?: string;
}

export function RecommendBookButton({
  bookId,
  bookTitle,
  variant = 'default',
  size = 'sm',
  className,
  label = 'Recomendar para um amigo',
}: RecommendBookButtonProps) {
  const { user } = useAuth();
  const { getFollowingList, recommendBook } = useSocial();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<{ id: string; nome: string; username: string | null; avatar_url: string | null }[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  if (!user) return null;

  const openModal = async () => {
    setOpen(true);
    setLoading(true);
    const list = await getFollowingList(user.id);
    setFollowing(list);
    setLoading(false);
  };

  const handleRecommend = async (target: { id: string; nome: string; username: string | null }) => {
    setSendingTo(target.id);
    const { error } = await recommendBook(
      target.id,
      target.username ? `@${target.username}` : target.nome,
      bookId,
      bookTitle,
    );
    setSendingTo(null);
    if (error) toast.error('Erro ao recomendar livro');
    else {
      toast.success('Livro recomendado com sucesso');
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} className={`font-display ${className ?? ''}`} onClick={openModal}>
        <Send className="h-4 w-4 mr-2" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="parchment-bg border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Recomendar "{bookTitle}"</DialogTitle>
            <DialogDescription>Selecione um amigo para enviar a recomendação.</DialogDescription>
          </DialogHeader>
          {loading ? (
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