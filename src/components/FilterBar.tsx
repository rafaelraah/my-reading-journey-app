import { CATEGORIES } from '@/types/book';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  filter: string;
  setFilter: (v: string) => void;
  sortBy: 'titulo' | 'created_at';
  setSortBy: (v: 'titulo' | 'created_at') => void;
}

export function FilterBar({ filter, setFilter, sortBy, setSortBy }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] bg-card/80 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card">
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select value={sortBy} onValueChange={v => setSortBy(v as 'titulo' | 'created_at')}>
          <SelectTrigger className="w-[180px] bg-card/80 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card">
            <SelectItem value="created_at">Data de criação</SelectItem>
            <SelectItem value="titulo">Título</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
