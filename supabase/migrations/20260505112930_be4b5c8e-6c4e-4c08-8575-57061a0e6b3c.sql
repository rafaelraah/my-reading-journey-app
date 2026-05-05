
-- Add completion date to user books
ALTER TABLE public.usuario_livros 
  ADD COLUMN IF NOT EXISTS completion_date date;

-- Add metadata to notifications so we can deep-link
ALTER TABLE public.notificacoes
  ADD COLUMN IF NOT EXISTS livro_id uuid,
  ADD COLUMN IF NOT EXISTS actor_id uuid;

-- Recommendations table
CREATE TABLE IF NOT EXISTS public.recomendacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  de_usuario_id uuid NOT NULL,
  para_usuario_id uuid NOT NULL,
  livro_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recomendacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recommendations"
  ON public.recomendacoes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert recommendations"
  ON public.recomendacoes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete recommendations"
  ON public.recomendacoes FOR DELETE USING (true);
