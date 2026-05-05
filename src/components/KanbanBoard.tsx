import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Book, STATUS_LABELS, STATUS_COLUMNS } from '@/types/book';
import { BookCard } from './BookCard';
import { ReviewModal } from './ReviewModal';
import { BookDetailModal } from './BookDetailModal';
import { BookMarked, BookOpenCheck, Library } from 'lucide-react';

const COLUMN_ICONS = {
  quero_ler: BookMarked,
  lendo: BookOpenCheck,
  lido: Library,
};

interface KanbanBoardProps {
  getBooksByStatus: (status: Book['status']) => Book[];
  onUpdateStatus: (id: string, status: Book['status']) => void;
  onSaveReview: (id: string, rating: number, review: string, completionDate: string | null) => Promise<void>;
  onDeleteBook: (id: string) => Promise<void>;
  books: Book[];
}

export function KanbanBoard({ getBooksByStatus, onUpdateStatus, onSaveReview, onDeleteBook, books }: KanbanBoardProps) {
  const [reviewBook, setReviewBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as Book['status'];
    if (result.source.droppableId !== newStatus) {
      if (newStatus === 'lido') {
        const book = books.find(b => b.id === result.draggableId);
        if (book) {
          onUpdateStatus(result.draggableId, newStatus);
          setReviewBook({ ...book, status: newStatus });
        }
      } else {
        onUpdateStatus(result.draggableId, newStatus);
      }
    }
  };

  const handleSaveReview = async (id: string, rating: number, review: string, completionDate: string | null) => {
    await onSaveReview(id, rating, review, completionDate);
    setReviewBook(null);
  };

  const handleDelete = async (id: string) => {
    await onDeleteBook(id);
    setDetailBook(null);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUS_COLUMNS.map(status => {
            const statusBooks = getBooksByStatus(status);
            const Icon = COLUMN_ICONS[status];

            return (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-lg border-2 border-dashed p-4 min-h-[400px] transition-all duration-200 ${
                      snapshot.isDraggingOver
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-card/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-accent" />
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {STATUS_LABELS[status]}
                        </h3>
                      </div>
                      <span className="text-sm font-display px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {statusBooks.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {statusBooks.map((book, index) => (
                        <Draggable key={book.id} draggableId={book.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}`}
                            >
                              <BookCard book={book} onClick={() => setDetailBook(book)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {statusBooks.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-center text-muted-foreground text-sm mt-8 italic">
                        Arraste livros para cá
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <ReviewModal
        book={reviewBook}
        open={!!reviewBook}
        onClose={() => setReviewBook(null)}
        onSave={handleSaveReview}
      />

      <BookDetailModal
        book={detailBook}
        open={!!detailBook}
        onClose={() => setDetailBook(null)}
        onDelete={handleDelete}
      />
    </>
  );
}
