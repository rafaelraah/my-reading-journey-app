import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

const SIZES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function StarRating({ value, onChange, size = 'md', readonly = false }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(i + 1)}
            className={cn(
              'transition-all duration-150',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125',
            )}
          >
            <Star
              className={cn(
                SIZES[size],
                'transition-colors',
                filled
                  ? 'fill-accent text-accent'
                  : 'fill-transparent text-muted-foreground/40',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
