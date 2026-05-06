
-- Add status/quote and last_seen to usuarios
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS status_citacao text,
  ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Mensagens table for chat
CREATE TABLE IF NOT EXISTS public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  de_usuario_id uuid NOT NULL,
  para_usuario_id uuid NOT NULL,
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_pair ON public.mensagens (de_usuario_id, para_usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_para ON public.mensagens (para_usuario_id, created_at DESC);

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mensagens" ON public.mensagens FOR SELECT USING (true);
CREATE POLICY "Anyone can insert mensagens" ON public.mensagens FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update mensagens" ON public.mensagens FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete mensagens" ON public.mensagens FOR DELETE USING (true);

-- Enable realtime
ALTER TABLE public.mensagens REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
