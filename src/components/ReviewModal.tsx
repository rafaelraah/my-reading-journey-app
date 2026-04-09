import { useState } from 'react';
import { Book } from '@/types/book';
import { StarRating } from './StarRating';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { BookOpen, Save } from 'lucide-react';

interface ReviewModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, rating: number, review: string) => Promise<void>;
}

export function ReviewModal({ book, open, onClose, onSave }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!book || rating === 0) return;
    setSaving(true);
    await onSave(book.id, rating, review);
    setSaving(false);
    setRating(0);
    setReview('');
  };

  const handleCancel = () => {
    setRating(0);
    setReview('');
    onClose();
  };

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && handleCancel()}>
      <DialogContent className="parchment-bg border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            Avaliar Livro
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Você terminou <span className="font-semibold text-foreground">{book.titulo}</span>! Deixe sua avaliação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="font-display text-sm font-medium text-foreground">
              Avaliação ({rating}/10)
            </label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="space-y-2">
            <label className="font-display text-sm font-medium text-foreground">Resenha</label>
            <Textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="Escreva sua opinião sobre o livro..."
              className="min-h-[120px] bg-background/50 border-border resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} className="font-display">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || rating === 0}
            className="bg-primary hover:bg-wood-light text-primary-foreground font-display"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
