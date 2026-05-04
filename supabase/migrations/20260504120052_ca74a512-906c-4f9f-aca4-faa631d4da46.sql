CREATE TABLE public.feed_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  target_kind TEXT NOT NULL,
  target_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_respostas_target ON public.feed_respostas(target_kind, target_id, created_at DESC);

ALTER TABLE public.feed_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view replies" ON public.feed_respostas FOR SELECT USING (true);
CREATE POLICY "Anyone can insert replies" ON public.feed_respostas FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete replies" ON public.feed_respostas FOR DELETE USING (true);