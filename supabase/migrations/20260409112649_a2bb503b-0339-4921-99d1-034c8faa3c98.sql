
-- Create livros table
CREATE TABLE public.livros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL,
  paginas INTEGER NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'Fantasia',
  imagem_url TEXT,
  status TEXT NOT NULL DEFAULT 'quero_ler',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.livros ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required)
CREATE POLICY "Anyone can view books" ON public.livros FOR SELECT USING (true);
CREATE POLICY "Anyone can insert books" ON public.livros FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update books" ON public.livros FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete books" ON public.livros FOR DELETE USING (true);

-- Create storage bucket for book covers
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- Storage policies
CREATE POLICY "Anyone can upload book covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'book-covers');
CREATE POLICY "Anyone can view book covers" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');
CREATE POLICY "Anyone can delete book covers" ON storage.objects FOR DELETE USING (bucket_id = 'book-covers');
