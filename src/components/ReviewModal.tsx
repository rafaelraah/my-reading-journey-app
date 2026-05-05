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
import { BookOpen, Save, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, rating: number, review: string, completionDate: string | null) => Promise<void>;
}

export function ReviewModal({ book, open, onClose, onSave }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [completionDate, setCompletionDate] = useState<Date | undefined>(new Date());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!book || rating === 0) return;
    setSaving(true);
    const iso = completionDate ? format(completionDate, 'yyyy-MM-dd') : null;
    await onSave(book.id, rating, review, iso);
    setSaving(false);
    setRating(0);
    setReview('');
    setCompletionDate(new Date());
  };

  const handleCancel = () => {
    setRating(0);
    setReview('');
    setCompletionDate(new Date());
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

          <div className="space-y-2">
            <label className="font-display text-sm font-medium text-foreground">Data de finalização</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !completionDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {completionDate ? format(completionDate, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={completionDate}
                  onSelect={setCompletionDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
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
