import { useState, useRef } from 'react';
import { CATEGORIES } from '@/types/book';
import { useGlobalBooks } from '@/hooks/useGlobalBooks';
import { useUserBooks } from '@/hooks/useUserBooks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageCropper } from '@/components/ImageCropper';
import { compressImage } from '@/lib/imageUtils';
import { BookOpen, Upload, Loader2, PlusCircle } from 'lucide-react';

const AddBook = () => {
  const { addGlobalBook, uploadCover } = useGlobalBooks();
  const { addBookToShelf } = useUserBooks();
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [paginas, setPaginas] = useState('');
  const [categoria, setCategoria] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawFile(file);
      setShowCropper(true);
    }
  };

  const handleCropped = async (croppedFile: File) => {
    const compressed = await compressImage(croppedFile);
    setCoverFile(compressed);
    setCoverPreview(URL.createObjectURL(compressed));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !autor || !paginas || !categoria) return;

    setSubmitting(true);
    let imagem_url: string | null = null;
    if (coverFile) {
      imagem_url = await uploadCover(coverFile);
    }

    const success = await addGlobalBook({
      titulo,
      autor,
      paginas: parseInt(paginas),
      categoria,
      imagem_url,
    });

    if (success && user) {
      // Auto-add to creator's shelf
      const { supabase: sb } = await import('@/integrations/supabase/client');
      const { data } = await sb
        .from('livros_globais')
        .select('id')
        .eq('titulo', titulo)
        .eq('autor', autor)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        await addBookToShelf(data.id, 'quero_ler');
      }

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
    <div className="min-h-screen bg-background">
      <header className="parchment-bg border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <PlusCircle className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-wide">Adicionar Livro</h1>
              <p className="text-muted-foreground text-lg mt-1">Cadastre um livro na biblioteca global</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="parchment-bg rounded-lg border border-border p-6 shadow-lg space-y-5">
          <div className="space-y-2">
            <Label htmlFor="g-titulo" className="font-display text-sm">Título</Label>
            <Input id="g-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="O Nome do Vento..." required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="g-autor" className="font-display text-sm">Autor</Label>
            <Input id="g-autor" value={autor} onChange={e => setAutor(e.target.value)} placeholder="Patrick Rothfuss..." required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="g-paginas" className="font-display text-sm">Páginas</Label>
              <Input id="g-paginas" type="number" value={paginas} onChange={e => setPaginas(e.target.value)} placeholder="662" min={1} required />
            </div>
            <div className="space-y-2">
              <Label className="font-display text-sm">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria} required>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-display text-sm">Capa do Livro</Label>
            <div
              className="flex items-center gap-3 cursor-pointer rounded-md border border-border bg-background/50 px-3 py-2 hover:bg-secondary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Preview" className="h-16 w-12 rounded object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground truncate">
                {coverFile ? 'Imagem recortada e comprimida' : 'Escolher imagem...'}
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <Button
            type="submit"
            disabled={submitting || !titulo || !autor || !paginas || !categoria}
            className="w-full bg-primary hover:bg-wood-light text-primary-foreground font-display"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
            Adicionar à Biblioteca Global
          </Button>
        </form>
      </main>

      <ImageCropper
        file={rawFile}
        open={showCropper}
        onClose={() => setShowCropper(false)}
        onCropped={handleCropped}
        aspect={2 / 3}
      />
    </div>
  );
};

export default AddBook;
