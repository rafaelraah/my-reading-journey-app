import { useState, useEffect } from 'react';
import { useSocial, PublicUser } from '@/hooks/useSocial';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, User, BookOpen, BookMarked, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const Users = () => {
  const { user } = useAuth();
  const { users, loading, searchUsers, following, followUser, unfollowUser } = useSocial();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    searchUsers('');
  }, [searchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers(query);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="parchment-bg border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-display font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground mt-1">Encontre e siga outros leitores</p>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por username ou nome..."
              className="pl-10"
            />
          </div>
          <Button type="submit" className="font-display">Buscar</Button>
        </form>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Nenhum usuário encontrado.</p>
        ) : (
          <div className="grid gap-4">
            {users.map(u => (
              <UserCard
                key={u.id}
                publicUser={u}
                isMe={u.id === user?.id}
                isFollowing={following.has(u.id)}
                onFollow={() => followUser(u.id, u.username || u.nome)}
                onUnfollow={() => unfollowUser(u.id)}
                onViewProfile={() => navigate(`/usuario/${u.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

function UserCard({
  publicUser: u,
  isMe,
  isFollowing,
  onFollow,
  onUnfollow,
  onViewProfile,
}: {
  publicUser: PublicUser;
  isMe: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onViewProfile: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-accent/30">
          {u.avatar_url ? <AvatarImage src={u.avatar_url} /> : null}
          <AvatarFallback className="bg-accent/20 text-accent font-display">
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground">{u.nome}</p>
          {u.username && <p className="text-sm text-muted-foreground">@{u.username}</p>}
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BookMarked className="h-3 w-3" /> {u.quero_ler} Quero Ler</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {u.lendo} Lendo</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {u.lido} Lidos</span>
          </div>
          {u.favorite_genre && (
            <div className="mt-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent" />
              <Badge variant="secondary" className="font-display text-xs">
                Gênero Favorito do Usuário: {u.favorite_genre}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewProfile} className="font-display">
            Ver perfil
          </Button>
          {!isMe && (
            isFollowing ? (
              <Button variant="secondary" size="sm" onClick={onUnfollow} className="font-display">
                Seguindo
              </Button>
            ) : (
              <Button size="sm" onClick={onFollow} className="bg-primary text-primary-foreground font-display">
                Seguir
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default Users;
