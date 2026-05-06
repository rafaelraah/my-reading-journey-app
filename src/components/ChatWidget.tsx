import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/hooks/useSocial';
import { useConversation, useUnreadMessages } from '@/hooks/useChat';
import { isOnline } from '@/hooks/usePresence';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, ChevronLeft, Send, User as UserIcon, Search } from 'lucide-react';
import { format } from 'date-fns';

interface FollowUser {
  id: string;
  nome: string;
  username: string | null;
  avatar_url: string | null;
  last_seen: string | null;
  status_citacao: string | null;
}

export function ChatWidget() {
  const { user } = useAuth();
  const { getFollowingList } = useSocial();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<FollowUser[]>([]);
  const [activeUser, setActiveUser] = useState<FollowUser | null>(null);
  const [search, setSearch] = useState('');
  const { unreadByUser, refresh } = useUnreadMessages();

  useEffect(() => {
    if (!user || !open) return;
    (async () => {
      const list = await getFollowingList(user.id);
      const ids = list.map((u: any) => u.id);
      if (ids.length === 0) { setContacts([]); return; }
      const { data } = await (supabase as any)
        .from('usuarios')
        .select('id, nome, username, avatar_url, last_seen, status_citacao')
        .in('id', ids);
      setContacts((data as FollowUser[]) || []);
    })();
  }, [user, open, getFollowingList]);

  const totalUnread = useMemo(() => Object.values(unreadByUser).reduce((s, n) => s + n, 0), [unreadByUser]);

  const filtered = contacts.filter(c =>
    !search.trim() ||
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 font-display">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-lg px-4 py-3 hover:opacity-90 transition"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">Conversas</span>
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center font-bold">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="w-[340px] sm:w-[380px] h-[520px] bg-card border-2 border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            {activeUser ? (
              <>
                <button onClick={() => { setActiveUser(null); refresh(); }} className="p-1 hover:bg-white/10 rounded">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
                  <div className="relative">
                    <Avatar className="h-7 w-7">
                      {activeUser.avatar_url ? <AvatarImage src={activeUser.avatar_url} /> : <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>}
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-card ${isOnline(activeUser.last_seen) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  </div>
                  <span className="text-sm truncate">{activeUser.nome}</span>
                </div>
              </>
            ) : (
              <span className="text-sm font-semibold">Mensagens</span>
            )}
            <button onClick={() => { setOpen(false); setActiveUser(null); }} className="p-1 hover:bg-white/10 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!activeUser ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-7 h-8 text-sm" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8 px-4">
                    Siga outros leitores para conversar com eles.
                  </p>
                ) : filtered.map(c => {
                  const unread = unreadByUser[c.id] || 0;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveUser(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/10 border-b border-border/50 text-left"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {c.avatar_url ? <AvatarImage src={c.avatar_url} /> : <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>}
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${isOnline(c.last_seen) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{c.nome}</p>
                        <p className="text-xs text-muted-foreground truncate italic">
                          {c.status_citacao || (isOnline(c.last_seen) ? 'Online' : 'Offline')}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center font-bold">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <ChatPane otherUser={activeUser} />
          )}
        </div>
      )}
    </div>
  );
}

function ChatPane({ otherUser }: { otherUser: FollowUser }) {
  const { user } = useAuth();
  const { messages, send } = useConversation(otherUser.id);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const v = text.trim();
    if (!v) return;
    setText('');
    await send(v);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background/30">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">
            Nenhuma mensagem ainda. Diga olá!
          </p>
        ) : messages.map(m => {
          const mine = m.de_usuario_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-sm shadow-sm ${
                mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap break-words">{m.mensagem}</p>
                <p className={`text-[10px] mt-0.5 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-right`}>
                  {format(new Date(m.created_at), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border p-2 flex gap-2 bg-card">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Mensagem..."
          className="flex-1 h-9"
        />
        <Button size="icon" onClick={handleSend} disabled={!text.trim()} className="h-9 w-9 flex-shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
