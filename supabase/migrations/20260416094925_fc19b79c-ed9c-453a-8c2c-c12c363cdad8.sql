
-- Create followers table
CREATE TABLE public.seguidores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seguidor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  seguido_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(seguidor_id, seguido_id),
  CHECK (seguidor_id != seguido_id)
);

ALTER TABLE public.seguidores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view followers" ON public.seguidores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert followers" ON public.seguidores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete followers" ON public.seguidores FOR DELETE USING (true);

-- Create notifications table
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  mensagem text NOT NULL,
  lido boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view notifications" ON public.notificacoes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON public.notificacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notifications" ON public.notificacoes FOR UPDATE USING (true);
