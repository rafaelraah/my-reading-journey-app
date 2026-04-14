import { useState, useEffect } from 'react';
import { Book, STATUS_LABELS } from '@/types/book';
import { StarRating } from './StarRating';
import { EventTimeline } from './EventTimeline';
import { useBookEvents, BookEvent } from '@/hooks/useBookEvents';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { BookOpen, Trash2, Share2 } from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export function BookDetailModal({ book, open, onClose, onDelete }: BookDetailModalProps) {
  const { fetchBookEvents } = useBookEvents();
  const [events, setEvents] = useState<BookEvent[]>([]);

  useEffect(() => {
    if (book && open) {
      fetchBookEvents(book.id).then(setEvents);
    } else {
      setEvents([]);
    }
  }, [book, open, fetchBookEvents]);

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="parchment-bg border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            Detalhes do Livro
          </DialogTitle>
          <DialogDescription className="sr-only">Informações completas do livro</DialogDescription>
        </DialogHeader>

        <div className="flex gap-5 mt-2">
          {book.imagem_url ? (
            <img
              src={book.imagem_url}
              alt={book.titulo}
              className="h-48 w-32 rounded-lg object-cover shadow-md flex-shrink-0"
            />
          ) : (
            <div className="h-48 w-32 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="font-display text-lg font-bold text-foreground leading-tight">
              {book.titulo}
            </h3>
            <p className="text-muted-foreground">{book.autor}</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent font-display">
                {book.categoria}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {book.paginas} páginas
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-display">
                {STATUS_LABELS[book.status]}
              </span>
            </div>

            {book.rating && (
              <div className="pt-1">
                <StarRating value={book.rating} readonly size="md" />
                <span className="text-sm text-muted-foreground ml-1">{book.rating}/10</span>
              </div>
            )}
          </div>
        </div>

        {book.review && (
          <div className="mt-4 p-4 rounded-lg bg-background/60 border border-border">
            <h4 className="font-display text-sm font-semibold mb-2 text-foreground">Resenha</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {book.review}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="mt-4 p-4 rounded-lg bg-background/60 border border-border">
          <h4 className="font-display text-sm font-semibold mb-3 text-foreground">Histórico</h4>
          <EventTimeline events={events} />
        </div>

        <div className="flex justify-between mt-2">
          <Button
            variant="outline"
            size="sm"
            className="font-display"
            onClick={() => {
              const msg = encodeURIComponent(`📚 Estou lendo o livro "${book.titulo}"! Recomendo muito. Venha ver e adicionar à sua lista: ${window.location.origin}`);
              window.open(`https://wa.me/?text=${msg}`, '_blank');
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="font-display">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir livro
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="parchment-bg border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir <span className="font-semibold">"{book.titulo}"</span>? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(book.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
