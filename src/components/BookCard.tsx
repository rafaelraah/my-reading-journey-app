import { Book } from '@/types/book';
import { BookOpen } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <div className="group parchment-bg rounded-lg border border-border p-3 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing">
      <div className="flex gap-3">
        {book.imagem_url ? (
          <img
            src={book.imagem_url}
            alt={book.titulo}
            className="h-24 w-16 rounded object-cover shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="h-24 w-16 rounded bg-secondary flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-sm font-semibold text-foreground leading-tight truncate">
            {book.titulo}
          </h4>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{book.autor}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-display">
              {book.categoria}
            </span>
            <span className="text-xs text-muted-foreground">{book.paginas} pgs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
