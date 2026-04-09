import { useState, useRef } from 'react';
import { CATEGORIES } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Upload, Loader2 } from 'lucide-react';

interface BookFormProps {
  onSubmit: (book: {
    titulo: string;
    autor: string;
    paginas: number;
    categoria: string;
    imagem_url: string | null;
  }) => Promise<boolean>;
  onUploadCover: (file: File) => Promise<string | null>;
}

export function BookForm({ onSubmit, onUploadCover }: BookFormProps) {
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [paginas, setPaginas] = useState('');
  const [categoria, setCategoria] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !autor || !paginas || !categoria) return;

    setSubmitting(true);
    let imagem_url: string | null = null;

    if (coverFile) {
      imagem_url = await onUploadCover(coverFile);
    }

    const success = await onSubmit({
      titulo,
      autor,
      paginas: parseInt(paginas),
      categoria,
      imagem_url,
    });

    if (success) {
      setTitulo('');
      setAutor('');
      setPaginas('');
      setCategoria('');
      setCoverFile(null);
      setCoverPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="parchment-bg rounded-lg border border-border p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-accent" />
        <h2 className="text-2xl font-display text-foreground">Adicionar Novo Livro</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="titulo" className="font-display text-sm">Título</Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="O Nome do Vento..."
            required
            className="bg-parchment/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="autor" className="font-display text-sm">Autor</Label>
          <Input
            id="autor"
            value={autor}
            onChange={e => setAutor(e.target.value)}
            placeholder="Patrick Rothfuss..."
            required
            className="bg-parchment/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paginas" className="font-display text-sm">Páginas</Label>
          <Input
            id="paginas"
            type="number"
            value={paginas}
            onChange={e => setPaginas(e.target.value)}
            placeholder="662"
            min={1}
            required
            className="bg-parchment/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-display text-sm">Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria} required>
            <SelectTrigger className="bg-parchment/50 border-border">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-display text-sm">Capa do Livro</Label>
          <div
            className="flex items-center gap-3 cursor-pointer rounded-md border border-border bg-parchment/50 px-3 py-2 hover:bg-secondary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {coverPreview ? (
              <img src={coverPreview} alt="Preview" className="h-10 w-8 rounded object-cover" />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground truncate">
              {coverFile ? coverFile.name : 'Escolher imagem...'}
            </span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={submitting || !titulo || !autor || !paginas || !categoria}
            className="w-full bg-primary hover:bg-wood-light text-primary-foreground font-display"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
            Adicionar Livro
          </Button>
        </div>
      </div>
    </form>
  );
}
