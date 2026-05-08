-- Reading history annotations on books
CREATE TABLE IF NOT EXISTS public.livro_historicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livro_id uuid NOT NULL REFERENCES public.livros_globais(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL,
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.livro_historicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view livro_historicos" ON public.livro_historicos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert livro_historicos" ON public.livro_historicos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete livro_historicos" ON public.livro_historicos FOR DELETE USING (true);
CREATE INDEX IF NOT EXISTS idx_livro_historicos_livro ON public.livro_historicos(livro_id);
CREATE INDEX IF NOT EXISTS idx_livro_historicos_usuario ON public.livro_historicos(usuario_id);

-- Emoji reactions on feed items (posts and events)
CREATE TABLE IF NOT EXISTS public.feed_reacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_kind text NOT NULL,
  target_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_kind, target_id, usuario_id, emoji)
);
ALTER TABLE public.feed_reacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feed_reacoes" ON public.feed_reacoes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert feed_reacoes" ON public.feed_reacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete feed_reacoes" ON public.feed_reacoes FOR DELETE USING (true);
CREATE INDEX IF NOT EXISTS idx_feed_reacoes_target ON public.feed_reacoes(target_kind, target_id);