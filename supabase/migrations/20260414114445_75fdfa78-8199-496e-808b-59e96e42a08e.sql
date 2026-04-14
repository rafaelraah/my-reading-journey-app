
-- Create global books table
CREATE TABLE public.livros_globais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL,
  paginas INTEGER NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'Fantasia',
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.livros_globais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view global books" ON public.livros_globais FOR SELECT USING (true);
CREATE POLICY "Anyone can insert global books" ON public.livros_globais FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update global books" ON public.livros_globais FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete global books" ON public.livros_globais FOR DELETE USING (true);

-- Create user-book relationship table
CREATE TABLE public.usuario_livros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  livro_id UUID NOT NULL REFERENCES public.livros_globais(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'quero_ler',
  rating INTEGER,
  review TEXT,
  current_page INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, livro_id)
);

ALTER TABLE public.usuario_livros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user books" ON public.usuario_livros FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user books" ON public.usuario_livros FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user books" ON public.usuario_livros FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete user books" ON public.usuario_livros FOR DELETE USING (true);
