CREATE TABLE IF NOT EXISTS public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_usuario_id ON public.posts(usuario_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete posts" ON public.posts FOR DELETE USING (true);