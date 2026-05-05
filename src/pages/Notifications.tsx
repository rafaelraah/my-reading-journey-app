import { useEffect, useState } from 'react';
import { useSocial } from '@/hooks/useSocial';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { notifications, unreadCount, fetchNotifications, markAllRead } = useSocial();
  const navigate = useNavigate();
  const [bookModal, setBookModal] = useState<{ id: string; titulo: string; autor: string; imagem_url: string | null } | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (n: any) => {
    if (n.tipo === 'recommendation' && n.livro_id) {
      const { data } = await supabase
        .from('livros_globais')
        .select('id, titulo, autor, imagem_url')
        .eq('id', n.livro_id)
        .single();
      if (data) setBookModal(data as any);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="parchment-bg border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Bell className="h-7 w-7 text-accent" /> Notificações
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="font-display">
              <CheckCheck className="h-4 w-4 mr-1" /> Marcar todas como lidas
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Nenhuma notificação ainda.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <Card
                key={n.id}
                className={`transition-colors ${!n.lido ? 'border-accent/50 bg-accent/5' : ''} ${n.tipo === 'recommendation' ? 'cursor-pointer hover:shadow-md' : ''}`}
                onClick={() => handleClick(n)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <Bell className={`h-5 w-5 mt-0.5 flex-shrink-0 ${!n.lido ? 'text-accent' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{n.mensagem}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!n.lido && <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!bookModal} onOpenChange={(v) => !v && setBookModal(null)}>
        <DialogContent className="max-w-md parchment-bg border-border">
          {bookModal && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" /> {bookModal.titulo}
                </DialogTitle>
              </DialogHeader>
              <div className="flex gap-4">
                <div className="w-28 h-40 bg-muted rounded overflow-hidden flex-shrink-0">
                  {bookModal.imagem_url ? (
                    <img src={bookModal.imagem_url} alt={bookModal.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-10 w-10 text-muted-foreground/40" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{bookModal.autor}</p>
                  <Button className="mt-4 font-display" onClick={() => { navigate(`/explorar?livro=${bookModal.id}`); setBookModal(null); }}>
                    Abrir perfil do livro
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
