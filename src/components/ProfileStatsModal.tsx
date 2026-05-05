import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/StarRating';
import { BookOpen, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Book } from '@/types/book';

export type StatsModalKind = 'lidos' | 'lendo' | 'quero_ler' | 'avaliacoes' | 'seguidores' | 'seguindo' | null;

interface UserLite {
  id: string;
  nome: string;
  username: string | null;
  avatar_url: string | null;
}

interface ProfileStatsModalProps {
  kind: StatsModalKind;
  username: string;
  books?: Book[];
  users?: UserLite[];
  onClose: () => void;
  onBookClick?: (book: Book) => void;
}

const TITLES: Record<NonNullable<StatsModalKind>, (u: string) => string> = {
  lidos: (u) => `Aqui estão os livros lidos de @${u}`,
  lendo: (u) => `Aqui estão os livros que @${u} está lendo`,
  quero_ler: (u) => `Aqui estão os livros que @${u} deseja ler`,
  avaliacoes: (u) => `Aqui estão as avaliações de @${u}`,
  seguidores: (u) => `Pessoas que seguem @${u}`,
  seguindo: (u) => `Pessoas que @${u} segue`,
};

export function ProfileStatsModal({ kind, username, books = [], users = [], onClose, onBookClick }: ProfileStatsModalProps) {
  if (!kind) return null;
  const isUserList = kind === 'seguidores' || kind === 'seguindo';
  const isRatings = kind === 'avaliacoes';

  return (
    <Dialog open={!!kind} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">{TITLES[kind](username)}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isUserList ? (
            users.length === 0 ? (
              <p className="text-center text-muted-foreground py-10 italic">Lista vazia.</p>
            ) : (
              <div className="space-y-2 pb-2">
                {users.map((u) => (
                  <Link key={u.id} to={`/usuario/${u.id}`} onClick={onClose}>
                    <Card className="hover:shadow-md transition-shadow hover:bg-accent/5">
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-accent/30">
                          {u.avatar_url ? <AvatarImage src={u.avatar_url} /> : null}
                          <AvatarFallback className="bg-accent/20 text-accent">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-display font-semibold text-foreground">{u.nome}</p>
                          {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )
          ) : books.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 italic">Nenhum livro nesta lista.</p>
          ) : isRatings ? (
            <div className="space-y-3 pb-2">
              {books.map((b) => (
                <Card key={b.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onBookClick?.(b)}>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-16 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                      {b.imagem_url ? (
                        <img src={b.imagem_url} alt={b.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-6 w-6 text-muted-foreground/40" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground">{b.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{b.autor}</p>
                      <div className="mt-1"><StarRating value={b.rating || 0} readonly size="sm" /></div>
                      {b.review && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{b.review}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-2">
              {books.map((b) => (
                <Card key={b.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => onBookClick?.(b)}>
                  <div className="aspect-[2/3] bg-muted flex items-center justify-center overflow-hidden">
                    {b.imagem_url ? (
                      <img src={b.imagem_url} alt={b.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <CardContent className="p-2.5">
                    <p className="font-display text-sm font-semibold leading-tight truncate">{b.titulo}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.autor}</p>
                    {b.rating && b.rating > 0 && (
                      <div className="mt-1"><StarRating value={b.rating} readonly size="sm" /></div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/** Compute the user's favorite category based on their library. */
export function favoriteGenre(books: Pick<Book, 'categoria' | 'status'>[]): string | null {
  if (books.length === 0) return null;
  // Prioritize read books; fall back to all
  const pool = books.filter(b => b.status === 'lido');
  const list = pool.length > 0 ? pool : books;
  const counts: Record<string, number> = {};
  list.forEach(b => { counts[b.categoria] = (counts[b.categoria] || 0) + 1; });
  let best: string | null = null;
  let bestCount = 0;
  for (const [cat, n] of Object.entries(counts)) {
    if (n > bestCount) { best = cat; bestCount = n; }
  }
  return best;
}
