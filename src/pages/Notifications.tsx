import { useEffect } from 'react';
import { useSocial } from '@/hooks/useSocial';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Notifications = () => {
  const { notifications, unreadCount, fetchNotifications, markAllRead } = useSocial();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
              <Card key={n.id} className={`transition-colors ${!n.lido ? 'border-accent/50 bg-accent/5' : ''}`}>
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
    </div>
  );
};

export default Notifications;
