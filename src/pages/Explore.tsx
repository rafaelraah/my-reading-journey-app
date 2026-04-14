import { useState } from 'react';
import { useGlobalBooks } from '@/hooks/useGlobalBooks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { CATEGORIES } from '@/types/book';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BookOpen, Search, Loader2, Users, Star, Share2, Plus } from 'lucide-react';
import { StarRating } from '@/components/StarRating';
import { GlobalBook } from '@/hooks/useGlobalBooks';
import { useEffect } from 'react';

const Explore = () => {
  const {
    globalBooks,
    loading,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    addBookToUser,
    getBookStats,
  } = useGlobalBooks();
  const { profile } = useUserProfile();

  const [selectedBook, setSelectedBook] = useState<GlobalBook | null>(null);
  const [bookStats, setBookStats] = useState<{ avgRating: number; totalReaders: number } | null>(null);
  const [addingStatus, setAddingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBook) {
      getBookStats(selectedBook.id).then(setBookStats);
    } else {
      setBookStats(null);
    }
  }, [selectedBook, getBookStats]);

  const handleAddToProfile = async (status: string) => {
    if (!profile || !selectedBook) return;
    setAddingStatus(status);
    await addBookToUser(profile.id, selectedBook.id, status);
    setAddingStatus(null);
  };

  const handleShare = (book: GlobalBook) => {
    const url = window.location.origin;
    const msg = encodeURIComponent(`📚 Confira o livro "${book.titulo}" de ${book.autor}! Recomendo muito. Venha ver: ${url}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="parchment-bg border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-wide">Explorar Livros</h1>
              <p className="text-muted-foreground text-lg mt-1">Descubra novos livros na biblioteca global</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título ou autor..."
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : globalBooks.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Nenhum livro encontrado na biblioteca global.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {globalBooks.map(book => (
              <Card
                key={book.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 duration-200"
                onClick={() => setSelectedBook(book)}
              >
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
                  <span className="text-xs px-2 py-0.5 mt-1 inline-block rounded-full bg-accent/20 text-accent font-display">
                    {book.categoria}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Book Detail Dialog */}
      <Dialog open={!!selectedBook} onOpenChange={v => !v && setSelectedBook(null)}>
        <DialogContent className="parchment-bg border-border max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  Perfil do Livro
                </DialogTitle>
                <DialogDescription className="sr-only">Detalhes do livro</DialogDescription>
              </DialogHeader>

              <div className="flex gap-5 mt-2">
                {selectedBook.imagem_url ? (
                  <img src={selectedBook.imagem_url} alt={selectedBook.titulo} className="h-56 w-36 rounded-lg object-cover shadow-md flex-shrink-0" />
                ) : (
                  <div className="h-56 w-36 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-3">
                  <h3 className="font-display text-lg font-bold text-foreground leading-tight">{selectedBook.titulo}</h3>
                  <p className="text-muted-foreground">{selectedBook.autor}</p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent font-display">{selectedBook.categoria}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{selectedBook.paginas} páginas</span>
                  </div>

                  {bookStats && (
                    <div className="space-y-1 pt-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-accent" />
                        <span className="text-sm">Média: {bookStats.avgRating > 0 ? `${bookStats.avgRating}/10` : 'Sem avaliações'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-accent" />
                        <span className="text-sm">{bookStats.totalReaders} leitores</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 space-y-3">
                <h4 className="font-display text-sm font-semibold">Adicionar ao meu perfil</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { status: 'quero_ler', label: 'Quero Ler' },
                    { status: 'lendo', label: 'Estou Lendo' },
                    { status: 'lido', label: 'Já Li' },
                  ].map(opt => (
                    <Button
                      key={opt.status}
                      variant="outline"
                      size="sm"
                      disabled={!!addingStatus}
                      onClick={() => handleAddToProfile(opt.status)}
                      className="font-display"
                    >
                      {addingStatus === opt.status ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                      {opt.label}
                    </Button>
                  ))}
                </div>

                <Button variant="outline" size="sm" onClick={() => handleShare(selectedBook)} className="font-display">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar no WhatsApp
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Explore;
