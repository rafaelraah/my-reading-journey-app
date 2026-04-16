import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/hooks/useSocial';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Loader2 } from 'lucide-react';
import { Book } from '@/types/book';

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const { following, followUser, unfollowUser, getFollowCounts } = useSocial();

  const [profile, setProfile] = useState<{ id: string; nome: string; username: string | null; avatar_url: string | null } | null>(null);
  const [books, setBooks] = useState<(Book & { user_book_id: string })[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);

      const [{ data: userData }, { data: booksData }, followCounts] = await Promise.all([
        supabase.from('usuarios').select('id, nome, username, avatar_url').eq('id', id).single(),
        supabase.from('usuario_livros').select('*, livros_globais(*)').eq('usuario_id', id),
        getFollowCounts(id),
      ]);

      if (userData) setProfile(userData as any);
      setCounts(followCounts);

      if (booksData) {
        setBooks(booksData.map((ub: any) => {
          const gb = ub.livros_globais;
          return {
            id: gb.id,
            user_book_id: ub.id,
            titulo: gb.titulo,
            autor: gb.autor,
            paginas: gb.paginas,
            categoria: gb.categoria,
            imagem_url: gb.imagem_url,
            status: ub.status,
            rating: ub.rating,
            review: ub.review,
            created_at: ub.created_at,
          };
        }));
      }

      setLoading(false);
    };

    load();
  }, [id, getFollowCounts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Usuário não encontrado.</p>
      </div>
    );
  }

  const isMe = me?.id === profile.id;
  const isFollowing = following.has(profile.id);
  const readBooks = books.filter(b => b.status === 'lido');
  const readingBooks = books.filter(b => b.status === 'lendo');
  const wantBooks = books.filter(b => b.status === 'quero_ler');

  return (
    <div className="min-h-screen bg-background">
      <div className="parchment-bg border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-28 w-28 border-4 border-accent/40 shadow-lg">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
              <AvatarFallback className="bg-accent/20 text-accent text-3xl font-display">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-display font-bold text-foreground">{profile.nome}</h1>
              {profile.username && <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>}

              <div className="flex gap-6 mt-4 justify-center sm:justify-start">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{wantBooks.length}</p>
                  <p className="text-sm text-muted-foreground">Quero Ler</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{readingBooks.length}</p>
                  <p className="text-sm text-muted-foreground">Lendo</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{readBooks.length}</p>
                  <p className="text-sm text-muted-foreground">Lidos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{counts.followers}</p>
                  <p className="text-sm text-muted-foreground">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{counts.following}</p>
                  <p className="text-sm text-muted-foreground">Seguindo</p>
                </div>
              </div>

              {!isMe && (
                <div className="mt-4">
                  {isFollowing ? (
                    <Button variant="secondary" onClick={() => unfollowUser(profile.id)} className="font-display">
                      Seguindo
                    </Button>
                  ) : (
                    <Button onClick={() => followUser(profile.id, profile.username || profile.nome)} className="bg-primary text-primary-foreground font-display">
                      Seguir
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-xl font-display font-semibold text-foreground mb-4">Livros</h2>
        {books.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">Nenhum livro na estante.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {books.map(book => (
              <Card key={book.user_book_id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[2/3] bg-muted flex items-center justify-center overflow-hidden">
                  {book.imagem_url ? (
                    <img src={book.imagem_url} alt={book.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-display text-sm font-semibold leading-tight truncate">{book.titulo}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.autor}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
