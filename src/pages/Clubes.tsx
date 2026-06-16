import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClubes } from '@/hooks/useClubes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/types/book';
import { Castle, PlusCircle, Camera, Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageUtils';
import { toast } from 'sonner';

const Clubes = () => {
  const { myClubes, invites, loading, createClube, respondInvite } = useClubes();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setImageFile(f); setPreviewUrl(URL.createObjectURL(f)); }
  };

  const handleCreate = async () => {
    if (!nome.trim()) { toast.error('Nome obrigatório'); return; }
    setSaving(true);
    let imagem_url: string | null = null;
    if (imageFile) {
      const compressed = await compressImage(imageFile, { maxWidth: 1000, maxHeight: 600 });
      const path = `clubes/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage.from('book-covers').upload(path, compressed, { upsert: true });
      if (!error) imagem_url = supabase.storage.from('book-covers').getPublicUrl(path).data.publicUrl;
    }
    const { error } = await createClube({ nome: nome.trim(), descricao, categoria, imagem_url });
    setSaving(false);
    if (error) { toast.error('Erro ao criar clube'); return; }
    toast.success('Clube criado!');
    setOpen(false);
    setNome(''); setDescricao(''); setCategoria(''); setImageFile(null); setPreviewUrl(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="parchment-bg border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Castle className="h-7 w-7 text-accent" /> Clube de Leitura
            </h1>
            <p className="text-muted-foreground mt-1">Leia em grupo e compartilhe a jornada</p>
          </div>
          <Button onClick={() => setOpen(true)} className="font-display">
            <PlusCircle className="h-4 w-4 mr-2" /> Criar Clube
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-8">
        {invites.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-semibold mb-3">Convites pendentes</h2>
            <div className="space-y-2">
              {invites.map((inv) => (
                <Card key={inv.id} className="border-accent/40">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold">{inv.clube?.nome}</p>
                      <p className="text-sm text-muted-foreground">{inv.clube?.descricao}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => respondInvite(inv.id, true, inv.clube_id)}><Check className="h-4 w-4 mr-1" /> Aceitar</Button>
                      <Button size="sm" variant="outline" onClick={() => respondInvite(inv.id, false, inv.clube_id)}><X className="h-4 w-4 mr-1" /> Recusar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Meus clubes</h2>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : myClubes.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 italic">Você ainda não participa de nenhum clube. Crie um para começar!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myClubes.map((c) => (
                <Link key={c.id} to={`/clubes/${c.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 h-full">
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      {c.imagem_url
                        ? <img src={c.imagem_url} alt={c.nome} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-primary/20"><Castle className="h-12 w-12 text-accent/60" /></div>}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-display font-semibold text-lg truncate">{c.nome}</h3>
                      {c.categoria && <p className="text-xs text-accent mt-1">{c.categoria}</p>}
                      {c.descricao && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.descricao}</p>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Criar Clube de Leitura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-display font-semibold mb-1 block">Nome</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} maxLength={80} />
            </div>
            <div>
              <label className="text-sm font-display font-semibold mb-1 block">Descrição</label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} maxLength={500} />
            </div>
            <div>
              <label className="text-sm font-display font-semibold mb-1 block">Categoria principal</label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-display font-semibold mb-1 block">Capa do clube</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded-md hover:bg-accent/10">
                    <Camera className="h-4 w-4" /> Escolher imagem
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </label>
                {previewUrl && <img src={previewUrl} alt="preview" className="h-12 w-20 object-cover rounded" />}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clubes;