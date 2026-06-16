import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Castle } from 'lucide-react';
import { fetchUserClubes, Clube } from '@/hooks/useClubes';

export function UserClubesSection({ userId }: { userId: string }) {
  const [clubes, setClubes] = useState<Clube[]>([]);
  useEffect(() => { fetchUserClubes(userId).then(setClubes); }, [userId]);

  if (clubes.length === 0) return <p className="text-center text-muted-foreground italic py-6">Nenhum clube ainda.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {clubes.map(c => (
        <Link key={c.id} to={`/clubes/${c.id}`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 flex gap-3 items-center">
              <div className="h-14 w-14 rounded bg-accent/20 overflow-hidden flex-shrink-0">
                {c.imagem_url ? <img src={c.imagem_url} alt={c.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Castle className="h-6 w-6 text-accent" /></div>}
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-sm truncate">{c.nome}</p>
                {c.categoria && <p className="text-xs text-accent">{c.categoria}</p>}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}