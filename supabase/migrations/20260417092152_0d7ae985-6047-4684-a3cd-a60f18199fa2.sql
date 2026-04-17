-- Add usuario_id to livro_eventos to track per-user events
ALTER TABLE public.livro_eventos
  ADD COLUMN IF NOT EXISTS usuario_id uuid;

CREATE INDEX IF NOT EXISTS idx_livro_eventos_usuario_id ON public.livro_eventos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_livro_eventos_created_at ON public.livro_eventos(created_at DESC);