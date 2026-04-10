
CREATE TABLE public.livro_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  livro_id UUID NOT NULL REFERENCES public.livros(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.livro_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON public.livro_eventos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert events" ON public.livro_eventos FOR INSERT WITH CHECK (true);

CREATE INDEX idx_livro_eventos_livro_id ON public.livro_eventos(livro_id);
CREATE INDEX idx_livro_eventos_created_at ON public.livro_eventos(created_at DESC);
