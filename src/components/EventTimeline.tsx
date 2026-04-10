import { BookEvent } from '@/hooks/useBookEvents';
import { BookOpen, ArrowRightLeft, Star, FileText, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EVENT_ICON: Record<string, typeof BookOpen> = {
  created: PlusCircle,
  moved: ArrowRightLeft,
  progress_updated: BookOpen,
  rated: Star,
  review_added: FileText,
};

const EVENT_COLOR: Record<string, string> = {
  created: 'text-green-600 bg-green-100',
  moved: 'text-blue-600 bg-blue-100',
  progress_updated: 'text-purple-600 bg-purple-100',
  rated: 'text-yellow-600 bg-yellow-100',
  review_added: 'text-orange-600 bg-orange-100',
};

interface EventTimelineProps {
  events: BookEvent[];
  showBookTitle?: boolean;
}

export function EventTimeline({ events, showBookTitle = false }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-4">
        Nenhum evento registrado ainda.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

      {events.map((event) => {
        const Icon = EVENT_ICON[event.tipo] || BookOpen;
        const colorClass = EVENT_COLOR[event.tipo] || 'text-muted-foreground bg-secondary';
        const date = new Date(event.created_at);

        return (
          <div key={event.id} className="relative flex items-start gap-3 py-2.5 pl-1">
            <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full ${colorClass} flex-shrink-0`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              {showBookTitle && event.livro_titulo && (
                <span className="font-display text-xs font-semibold text-foreground">
                  {event.livro_titulo}
                  {' — '}
                </span>
              )}
              <span className="text-sm text-foreground">{event.descricao}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
